const express = require('express');
const cors = require('cors');
const { Api } = require('telegram');
const bigInt = require('big-integer');
const dotenv = require('dotenv');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { client, initClient, uploadToTelegram, forwardMessage } = require('./telegramClient');
const dbManager = require('./db');

const app = express();

app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: false, frameguard: false, contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 2000, 
    message: 'Too many requests, please try again later.'
});
app.use('/api/', limiter);

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const upload = multer({ 
  dest: 'uploads/',
  limits: {
    fileSize: 300 * 1024 * 1024 // 300MB
  }
});

// Specific rate limiter for upload route to prevent DDOS/Spam
const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour window
    max: 10, // Max 10 uploads per IP per hour
    message: 'Upload limit exceeded. You can only upload 10 books per hour. Please try again later.'
});

const PRIMARY_CHANNEL = -1004391184725;
const BACKUP_CHANNEL = -1004293174793;
// Database initialization is now handled by dbManager in the startup block

const s3 = new S3Client({
    region: 'auto',
    endpoint: 'https://cd43a1a033e10546ee8869a5cbc45d92.r2.cloudflarestorage.com',
    credentials: {
        accessKeyId: '7968131a5b90c4e47bab63e6a5648592',
        secretAccessKey: 'a1ae995ba75741d64a74a8eb54c533bec4ab2f6b0479f81a97c3bab425510652',
    },
});

const { verifyToken } = require('./middleware/auth');

// Track upload progress
const uploadProgressMap = new Map();

app.get('/api/upload/progress', (req, res) => {
    const { uploadId } = req.query;
    if (!uploadId) return res.status(400).end();

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const sendProgress = () => {
        const data = uploadProgressMap.get(uploadId) || { status: 'waiting', progress: 0 };
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    const interval = setInterval(sendProgress, 500);

    req.on('close', () => {
        clearInterval(interval);
        // We do not delete the map entry immediately in case the client reconnects
        // Let the upload finish logic clean it up, or it will be GC'd eventually.
    });
});

app.post('/api/upload', verifyToken, uploadLimiter, upload.fields([{ name: 'book', maxCount: 1 }, { name: 'cover', maxCount: 1 }]), async (req, res) => {
    const { uploadId } = req.query;
    try {
        if (uploadId) uploadProgressMap.set(uploadId, { status: 'uploading_server', progress: 0 });
        const bookFile = req.files['book'] ? req.files['book'][0] : null;
        const coverFile = req.files['cover'] ? req.files['cover'][0] : null;
        const { title, author, description, pages } = req.body;
        
        if (!bookFile || !coverFile) {
            return res.status(400).json({ error: 'Both book and cover files are required' });
        }

        console.log(`Starting upload process for: ${title}`);

        const coverExt = path.extname(coverFile.originalname);
        const coverKey = `covers/${Date.now()}-${Math.round(Math.random()*1000)}${coverExt}`;
        const coverStream = fs.createReadStream(coverFile.path);

        const s3Params = {
            Bucket: 'notora',
            Key: coverKey,
            Body: coverStream,
            ContentType: coverFile.mimetype,
        };

        await s3.send(new PutObjectCommand(s3Params));
        const coverUrl = `https://pub-0531eeb1781e4d2f9030ec9b8f57fca5.r2.dev/${coverKey}`;
        console.log('Cover uploaded to Cloudflare R2:', coverUrl);
        fs.unlinkSync(coverFile.path);

        const bookExt = path.extname(bookFile.originalname);
        const bookFilePath = bookFile.path + bookExt;
        fs.renameSync(bookFile.path, bookFilePath);

        let lastProgress = 0;
        const primaryMsgId = await uploadToTelegram(bookFilePath, `${title} by ${author}`, (progress) => {
            const current = Math.floor(progress * 100);
            if (uploadId) {
                uploadProgressMap.set(uploadId, { status: 'uploading_telegram', progress: current });
            }
            if (current > lastProgress + 5) {
                console.log(`Telegram Upload Progress: ${current}%`);
                lastProgress = current;
            }
        }, PRIMARY_CHANNEL);
        
        console.log('Book uploaded to Primary Channel. Msg ID:', primaryMsgId);
        fs.unlinkSync(bookFilePath);

        let backupMsgId = null;
        try {
            backupMsgId = await forwardMessage(PRIMARY_CHANNEL, primaryMsgId, BACKUP_CHANNEL);
            console.log('Book successfully copied to Backup Channel. Msg ID:', backupMsgId);
        } catch (backupErr) {
            console.error('Failed to copy to Backup Channel (non-fatal):', backupErr);
        }

        const BookModel = dbManager.getActiveBookModel();
        const newBook = new BookModel({
            title,
            author,
            description,
            filename: bookFile.originalname,
            size: bookFile.size,
            coverUrl: coverUrl,
            genre: req.body.genre || 'Other',
            tags: req.body.tags ? req.body.tags.split(',').map(t => t.trim()) : [],
            pages: pages ? parseInt(pages) : null,
            telegramPrimaryMsgId: primaryMsgId,
            telegramBackupMsgId: backupMsgId,
            uploaderId: req.user.uid
        });
        await newBook.save();
        console.log('Book metadata saved to MongoDB');

        res.json({ success: true, book: newBook });
    } catch (error) {
        console.error('Error during upload:', error);
        if (uploadId) uploadProgressMap.set(uploadId, { status: 'error', progress: 0 });
        res.status(500).json({ error: 'Upload failed' });
    } finally {
        if (uploadId && uploadProgressMap.get(uploadId)?.status !== 'error') {
            uploadProgressMap.set(uploadId, { status: 'done', progress: 100 });
            // Clean up after 10 seconds
            setTimeout(() => uploadProgressMap.delete(uploadId), 10000);
        }
    }
});

app.get('/api/books', async (req, res) => {
    try {
        const { q, genres, langs, tags, uploaderId, page = 1, limit = 20 } = req.query;
        let query = {};
        
        if (q) {
            query.$or = [
                { title: { $regex: q, $options: 'i' } },
                { author: { $regex: q, $options: 'i' } },
                { tags: { $regex: q, $options: 'i' } }
            ];
        }

        if (uploaderId) {
            query.uploaderId = uploaderId;
        }
        
        if (genres) {
            query.genre = { $in: genres.split(',') };
        }

        if (langs) {
            query.language = { $in: langs.split(',') };
        }

        if (tags) {
            query.tags = { $in: tags.split(',') };
        }

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const totalCount = await dbManager.countBooksAcrossAll(query);
        const books = await dbManager.findBooksAcrossAll(query, { uploadDate: -1 }, skip, limitNum);
                            
        res.json({
            books,
            totalCount,
            currentPage: pageNum,
            totalPages: Math.ceil(totalCount / limitNum)
        });
    } catch (err) {
        console.error('Failed to fetch books:', err);
        res.status(500).json({ error: 'Failed to fetch books' });
    }
});

app.get('/api/books/:id', async (req, res) => {
    try {
        const bookData = await dbManager.findBookByIdAcrossAll(req.params.id);
        if (!bookData) return res.status(404).json({ error: 'Book not found' });
        
        if (bookData.uploaderId) {
            const User = dbManager.getUserModel();
            const user = await User.findOne({ uid: bookData.uploaderId }).lean();
            if (user) {
                bookData.uploaderName = user.name;
            }
        }
        res.json(bookData);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch book' });
    }
});

// --- Review Routes ---

app.get('/api/books/:id/reviews', async (req, res) => {
    try {
        const Review = dbManager.getReviewModel();
        const reviews = await Review.find({ bookId: req.params.id }).sort({ createdAt: -1 });
        
        // Populate user details for reviews
        const User = dbManager.getUserModel();
        const populatedReviews = await Promise.all(reviews.map(async (r) => {
            const user = await User.findOne({ uid: r.userId }).lean();
            return {
                ...r.toObject(),
                userName: user ? user.name : 'Unknown User',
                userPhoto: user ? user.photoUrl : null
            };
        }));

        res.json(populatedReviews);
    } catch (err) {
        console.error('Failed to fetch reviews:', err);
        res.status(500).json({ error: 'Failed to fetch reviews' });
    }
});

app.get('/api/books/:id/rate', verifyToken, async (req, res) => {
    try {
        const userId = req.user.uid;
        const Review = dbManager.getReviewModel();
        const review = await Review.findOne({ bookId: req.params.id, userId });
        res.json(review || { rating: 0, reviewText: '' });
    } catch (err) {
        console.error('Failed to fetch user rating:', err);
        res.status(500).json({ error: 'Failed to fetch user rating' });
    }
});

app.post('/api/books/:id/rate', verifyToken, async (req, res) => {
    try {
        const userId = req.user.uid;
        const bookId = req.params.id;
        const { rating, reviewText } = req.body;
        
        if (rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating must be between 1 and 5' });
        
        // Ensure review text is under limit
        const safeText = reviewText ? reviewText.substring(0, 300) : '';

        const Review = dbManager.getReviewModel();
        
        let existingReview = await Review.findOne({ bookId, userId });
        if (existingReview) {
            existingReview.rating = rating;
            existingReview.reviewText = safeText;
            await existingReview.save();
        } else {
            await new Review({ bookId, userId, rating, reviewText: safeText }).save();
        }

        // Recalculate average
        const allReviews = await Review.find({ bookId });
        const count = allReviews.length;
        const averageRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / count;

        await dbManager.updateBookByIdAcrossAll(bookId, { 
            averageRating: Number(averageRating.toFixed(1)), 
            ratingCount: count 
        });

        res.json({ success: true, averageRating: Number(averageRating.toFixed(1)), ratingCount: count });
    } catch (err) {
        console.error('Failed to submit rating:', err);
        res.status(500).json({ error: 'Failed to submit rating' });
    }
});

app.delete('/api/books/:id/rate', verifyToken, async (req, res) => {
    try {
        const userId = req.user.uid;
        const bookId = req.params.id;

        const Review = dbManager.getReviewModel();
        
        const review = await Review.findOneAndDelete({ bookId, userId });
        if (!review) {
            return res.status(404).json({ error: 'Review not found' });
        }

        // Recalculate average
        const allReviews = await Review.find({ bookId });
        const count = allReviews.length;
        const averageRating = count > 0 ? allReviews.reduce((sum, r) => sum + r.rating, 0) / count : 0;

        await dbManager.updateBookByIdAcrossAll(bookId, { 
            averageRating: Number(averageRating.toFixed(1)), 
            ratingCount: count 
        });

        res.json({ success: true, averageRating: Number(averageRating.toFixed(1)), ratingCount: count });
    } catch (err) {
        console.error('Failed to delete rating:', err);
        res.status(500).json({ error: 'Failed to delete rating' });
    }
});

app.get('/api/books/user/:uploaderId', async (req, res) => {
    try {
        const books = await dbManager.findBooksAcrossAll({ uploaderId: req.params.uploaderId }, { uploadDate: -1 });
        res.json(books);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch user books' });
    }
});

app.get('/api/download/:id', async (req, res) => {
    try {
        const book = await dbManager.findBookByIdAcrossAll(req.params.id);
        if (!book) return res.status(404).send('Book not found');

        let message = null;
        
        if (!client.connected) {
            console.log("GramJS reconnecting...");
            await client.connect();
        }

        try {
            const messages = await client.getMessages(PRIMARY_CHANNEL, { ids: [book.telegramPrimaryMsgId] });
            if (messages.length > 0 && messages[0] && messages[0].media) {
                message = messages[0];
            }
        } catch (err) {
            console.warn("Primary channel fetch failed, attempting backup...");
        }

        if (!message && book.telegramBackupMsgId) {
            console.log("Using Backup Channel for download!");
            try {
                const backupMsgs = await client.getMessages(BACKUP_CHANNEL, { ids: [book.telegramBackupMsgId] });
                if (backupMsgs.length > 0 && backupMsgs[0] && backupMsgs[0].media) {
                    message = backupMsgs[0];
                }
            } catch (err) {
                console.warn("Backup channel fetch failed");
            }
        }

        if (!message) return res.status(404).send('File not found in any Telegram storage');
        
        const isInline = req.query.inline === 'true';
        const isCheckStatus = req.query.check_status === 'true';
        
        const fs = require('fs');
        const path = require('path');
        const os = require('os');
        const cacheDir = path.join(os.tmpdir(), 'notora_cache');
        if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir, { recursive: true });
        }
        const cacheFilePath = path.join(cacheDir, `${book.id}_${book.filename}`);

        // Global download tracking
        if (!global.downloadingFiles) {
            global.downloadingFiles = new Map();
        }

        if (fs.existsSync(cacheFilePath)) {
            if (isCheckStatus) {
                return res.json({ ready: true });
            }
            const headers = {
                'Content-Disposition': `${isInline ? 'inline' : 'attachment'}; filename="${book.filename}"`,
                'Accept-Ranges': 'bytes',
                'Access-Control-Expose-Headers': 'Accept-Ranges, Content-Range, Content-Length, Content-Disposition'
            };
            if (book.filename.toLowerCase().endsWith('.pdf')) {
                headers['Content-Type'] = 'application/pdf';
            } else if (book.filename.toLowerCase().endsWith('.epub')) {
                headers['Content-Type'] = 'application/epub+zip';
            }
            return res.sendFile(cacheFilePath, { headers });
        }

        // File is NOT on disk
        const fileSize = Number(message.media.document.size);
        const bigInt = require('big-integer');

        const range = req.headers.range;
        if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            const chunksize = (end - start) + 1;

            const headers = {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Disposition': `${isInline ? 'inline' : 'attachment'}; filename="${book.filename}"`,
                'Access-Control-Expose-Headers': 'Accept-Ranges, Content-Range, Content-Length, Content-Disposition'
            };
            if (book.filename.toLowerCase().endsWith('.pdf')) {
                headers['Content-Type'] = 'application/pdf';
            } else if (book.filename.toLowerCase().endsWith('.epub')) {
                headers['Content-Type'] = 'application/epub+zip';
            }
            res.writeHead(206, headers);

            const requestSize = 512 * 1024; // 512KB chunks
            const alignedStart = Math.floor(start / requestSize) * requestSize;
            const alignedEnd = Math.ceil((end + 1) / requestSize) * requestSize;
            const numChunks = Math.max(1, (alignedEnd - alignedStart) / requestSize);
            const skipBytes = start - alignedStart;
            
            let bytesToSend = chunksize;
            let currentSkip = skipBytes;

            try {
                for await (const chunk of client.iterDownload({ 
                    file: message.media, 
                    offset: bigInt(alignedStart),
                    limit: numChunks,
                    requestSize: requestSize 
                })) {
                    let data = chunk;
                    if (currentSkip > 0) {
                        if (data.length <= currentSkip) {
                            currentSkip -= data.length;
                            continue;
                        } else {
                            data = data.slice(currentSkip);
                            currentSkip = 0;
                        }
                    }
                    if (data.length > bytesToSend) {
                        data = data.slice(0, bytesToSend);
                    }
                    res.write(data);
                    bytesToSend -= data.length;
                    if (bytesToSend <= 0) break;
                }
                res.end();
            } catch (err) {
                console.error("Telegram Range stream error:", err);
                if (!res.writableEnded) res.end();
            }
            return;
        }

        // Background download for full file requests (like the download button)
        if (global.downloadingFiles.has(book.id)) {
            if (isCheckStatus) {
                return res.json({ ready: false, ...global.downloadingFiles.get(book.id) });
            }
            return res.status(202).send('Downloading to server cache...');
        }
        
        // Start background download
        global.downloadingFiles.set(book.id, { downloaded: 0, total: fileSize });
        
        client.downloadMedia(message.media, {
            workers: 8,
            progressCallback: (downloaded, total) => {
                if (global.downloadingFiles.has(book.id)) {
                    global.downloadingFiles.set(book.id, { 
                        downloaded: Number(downloaded), 
                        total: Number(total) 
                    });
                }
            }
        }).then(buffer => {
            fs.writeFileSync(cacheFilePath, buffer);
            global.downloadingFiles.delete(book.id);
            console.log(`[Cache Miss] Downloaded ${book.filename} to cache.`);
        }).catch(err => {
            console.error(`Download failed for ${book.filename}:`, err);
            global.downloadingFiles.delete(book.id);
        });

        if (isCheckStatus) {
            return res.json({ ready: false, downloaded: 0, total: fileSize });
        }
        return res.status(202).send('Started downloading to server cache...');
        
    } catch (error) {
        console.error('Error during download:', error);
        if (!res.headersSent) res.status(500).send('Download failed');
    }
});

// --- Library Routes ---

app.get('/api/library', verifyToken, async (req, res) => {
    try {
        const userId = req.user.uid;
        const Library = dbManager.getLibraryModel();
        let library = await Library.findOne({ userId }).lean();
        
        if (!library) {
            // If library doesn't exist, create it on DB1
            const newLibrary = new Library({ userId });
            await newLibrary.save();
            library = newLibrary.toObject();
        }
        
        // Manual cross-database population
        const bookIds = new Set();
        const shelfNames = ['reading', 'favorites', 'completed', 'to-read'];
        for (const shelf of shelfNames) {
            (library.shelves[shelf] || []).forEach(id => bookIds.add(id.toString()));
        }
        for (const [shelfName, ids] of Object.entries(library.customShelves || {})) {
            (ids || []).forEach(id => bookIds.add(id.toString()));
        }

        if (bookIds.size > 0) {
            const books = await dbManager.findBooksAcrossAll({ _id: { $in: Array.from(bookIds) } });
            const bookMap = {};
            books.forEach(b => bookMap[b._id.toString()] = b);

            for (const shelf of shelfNames) {
                library.shelves[shelf] = (library.shelves[shelf] || [])
                    .map(id => bookMap[id.toString()])
                    .filter(Boolean);
            }
            for (const [shelfName, ids] of Object.entries(library.customShelves || {})) {
                library.customShelves[shelfName] = (ids || [])
                    .map(id => bookMap[id.toString()])
                    .filter(Boolean);
            }
        }
        
        res.json(library);
    } catch (err) {
        console.error('Failed to fetch library:', err);
        res.status(500).json({ error: 'Failed to fetch library' });
    }
});

app.post('/api/library/shelves', verifyToken, async (req, res) => {
    try {
        const userId = req.user.uid;
        const { bookId, bookIds, targetShelf, newName, custom = false, action = 'add' } = req.body;
        
        const Library = dbManager.getLibraryModel();
        let library = await Library.findOne({ userId });
        if (!library) {
            library = new Library({ userId });
        }
        
        if (custom) {
            if (action === 'create') {
                if (!library.customShelves.has(targetShelf)) {
                    library.customShelves.set(targetShelf, []);
                }
            } else if (action === 'rename') {
                if (library.customShelves.has(targetShelf) && newName) {
                    const shelfBooks = library.customShelves.get(targetShelf);
                    library.customShelves.delete(targetShelf);
                    library.customShelves.set(newName, shelfBooks);
                }
            } else if (action === 'delete_shelf') {
                if (library.customShelves.has(targetShelf)) {
                    library.customShelves.delete(targetShelf);
                }
            } else {
                let shelf = library.customShelves.get(targetShelf) || [];
                if (action === 'add' && bookId && !shelf.includes(bookId)) shelf.push(bookId);
                if (action === 'remove' && bookId) shelf = shelf.filter(id => id.toString() !== bookId);
                if (action === 'remove_multiple' && bookIds) {
                    shelf = shelf.filter(id => !bookIds.includes(id.toString()));
                }
                library.customShelves.set(targetShelf, shelf);
            }
        } else {
            let shelf = library.shelves[targetShelf];
            if (!shelf) return res.status(400).json({ error: 'Invalid shelf' });
            
            if (action === 'add' && !shelf.includes(bookId)) {
                // Optionally remove from mutually exclusive shelves (e.g. to-read vs completed)
                shelf.push(bookId);
            }
            if (action === 'remove' && bookId) {
                library.shelves[targetShelf] = shelf.filter(id => id.toString() !== bookId);
            }
            if (action === 'remove_multiple' && bookIds) {
                library.shelves[targetShelf] = shelf.filter(id => !bookIds.includes(id.toString()));
            }
        }
        
        await library.save();
        res.json({ success: true, library });
    } catch (err) {
        console.error('Failed to update shelves:', err);
        res.status(500).json({ error: 'Failed to update shelves' });
    }
});

app.post('/api/library/progress', verifyToken, async (req, res) => {
    try {
        const userId = req.user.uid;
        const { bookId, page } = req.body;
        
        const Library = dbManager.getLibraryModel();
        let library = await Library.findOne({ userId });
        if (!library) library = new Library({ userId });
        
        library.progress.set(bookId, page);
        
        if (!library.shelves.reading.includes(bookId) && !library.shelves.completed.includes(bookId)) {
            library.shelves.reading.push(bookId);
        }
        
        await library.save();
        res.json({ success: true });
    } catch (err) {
        console.error('Failed to update progress:', err);
        res.status(500).json({ error: 'Failed to update progress' });
    }
});

// User Profile Routes

// Follow Routes
app.get('/api/users/:uid/follow-status', async (req, res) => {
    try {
        const { currentUid } = req.query;
        if (!currentUid) return res.json({ isFollowing: false });
        
        const Follow = dbManager.getFollowModel();
        const follow = await Follow.findOne({ followerId: currentUid, followingId: req.params.uid });
        res.json({ isFollowing: !!follow });
    } catch (err) {
        console.error('Failed to get follow status:', err);
        res.status(500).json({ error: 'Failed to get follow status' });
    }
});

app.post('/api/users/:uid/follow', async (req, res) => {
    try {
        const targetUid = req.params.uid;
        const { currentUid } = req.body;
        
        if (!currentUid || currentUid === targetUid) {
            return res.status(400).json({ error: 'Invalid request' });
        }
        
        const Follow = dbManager.getFollowModel();
        const User = dbManager.getUserModel();
        
        const existingFollow = await Follow.findOne({ followerId: currentUid, followingId: targetUid });
        
        let isFollowing = false;
        if (existingFollow) {
            // Unfollow
            await Follow.deleteOne({ _id: existingFollow._id });
            await User.updateOne({ uid: targetUid }, { $inc: { followers: -1 } });
            await User.updateOne({ uid: currentUid }, { $inc: { following: -1 } });
            isFollowing = false;
        } else {
            // Follow
            await Follow.create({ followerId: currentUid, followingId: targetUid });
            await User.updateOne({ uid: targetUid }, { $inc: { followers: 1 } }, { upsert: true });
            await User.updateOne({ uid: currentUid }, { $inc: { following: 1 } }, { upsert: true });
            isFollowing = true;
        }
        
        const updatedUser = await User.findOne({ uid: targetUid });
        res.json({ isFollowing, followers: updatedUser.followers, following: updatedUser.following });
    } catch (err) {
        console.error('Failed to toggle follow:', err);
        res.status(500).json({ error: 'Failed to toggle follow' });
    }
});

app.get('/api/users/:uid/recent-followers', async (req, res) => {
    try {
        const Follow = dbManager.getFollowModel();
        const User = dbManager.getUserModel();
        const follows = await Follow.find({ followingId: req.params.uid }).sort({ createdAt: -1 }).limit(10);
        
        const followers = await Promise.all(follows.map(async (f) => {
            const u = await User.findOne({ uid: f.followerId }).lean();
            return {
                uid: f.followerId,
                name: (u && u.name) ? u.name : 'Unknown User',
                photoUrl: u ? u.photoUrl : null,
                bio: u ? u.bio : ''
            };
        }));
        
        res.json(followers);
    } catch (err) {
        console.error('Failed to fetch recent followers:', err);
        res.status(500).json({ error: 'Failed to fetch recent followers' });
    }
});

app.get('/api/users/:uid/followers', async (req, res) => {
    try {
        const Follow = dbManager.getFollowModel();
        const User = dbManager.getUserModel();
        const follows = await Follow.find({ followingId: req.params.uid }).sort({ createdAt: -1 });
        
        const followers = await Promise.all(follows.map(async (f) => {
            const u = await User.findOne({ uid: f.followerId }).lean();
            return {
                uid: f.followerId,
                name: (u && u.name) ? u.name : 'Unknown User',
                photoUrl: u ? u.photoUrl : null,
                bio: u ? u.bio : ''
            };
        }));
        
        res.json(followers);
    } catch (err) {
        console.error('Failed to fetch followers:', err);
        res.status(500).json({ error: 'Failed to fetch followers' });
    }
});

app.get('/api/users/:uid/following', async (req, res) => {
    try {
        const Follow = dbManager.getFollowModel();
        const User = dbManager.getUserModel();
        const follows = await Follow.find({ followerId: req.params.uid }).sort({ createdAt: -1 });
        
        const following = await Promise.all(follows.map(async (f) => {
            const u = await User.findOne({ uid: f.followingId }).lean();
            return {
                uid: f.followingId,
                name: (u && u.name) ? u.name : 'Unknown User',
                photoUrl: u ? u.photoUrl : null,
                bio: u ? u.bio : ''
            };
        }));
        
        res.json(following);
    } catch (err) {
        console.error('Failed to fetch following:', err);
        res.status(500).json({ error: 'Failed to fetch following' });
    }
});

app.post('/api/users/sync', async (req, res) => {
    try {
        const { uid, name, photoUrl } = req.body;
        if (!uid || !name) return res.status(400).json({ error: 'Missing data' });
        const User = dbManager.getUserModel();
        const existing = await User.findOne({ uid });
        if (!existing) {
            await User.create({ uid, name, photoUrl, followers: 0, following: 0 });
        } else if (!existing.name) {
            existing.name = name;
            existing.photoUrl = photoUrl;
            await existing.save();
        }
        res.json({ success: true });
    } catch (err) {
        console.error('Failed to sync user:', err);
        res.status(500).json({ error: 'Failed to sync user' });
    }
});

app.get('/api/users/:uid', async (req, res) => {
    try {
        const User = dbManager.getUserModel();
        let user = await User.findOne({ uid: req.params.uid });
        if (!user) {
            // Return 404 if not found, frontend can fallback to firebase auth data
            return res.status(404).json({ error: 'User not found in DB' });
        }
        res.json(user);
    } catch (err) {
        console.error('Failed to fetch user:', err);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

app.get('/api/users/:uid/reviews', async (req, res) => {
    try {
        const userId = req.params.uid;
        const Review = dbManager.getReviewModel();
        
        // Fetch all reviews by this user
        const userReviews = await Review.find({ userId }).sort({ createdAt: -1 }).lean();
        
        if (userReviews.length === 0) {
            return res.json([]);
        }
        
        // Extract unique bookIds
        const bookIds = [...new Set(userReviews.map(r => r.bookId))];
        
        // Fetch book details across all databases
        const books = await dbManager.findBooksAcrossAll({ _id: { $in: bookIds } });
        
        // Create a map for quick book lookup
        const bookMap = {};
        books.forEach(b => {
            bookMap[b._id.toString()] = b;
        });
        
        // Merge book details into reviews
        const populatedReviews = userReviews.map(r => {
            const book = bookMap[r.bookId];
            return {
                ...r,
                book: book ? {
                    id: book._id,
                    slug: book.slug || book._id,
                    title: book.title,
                    author: book.author,
                    coverUrl: book.coverUrl,
                } : null
            };
        });
        
        res.json(populatedReviews);
    } catch (err) {
        console.error('Failed to fetch user reviews:', err);
        res.status(500).json({ error: 'Failed to fetch user reviews' });
    }
});

app.put('/api/users/profile', verifyToken, upload.single('photo'), async (req, res) => {
    try {
        const uid = req.user.uid;
        const { name, bio, settings } = req.body;
        
        const User = dbManager.getUserModel();
        let user = await User.findOne({ uid });
        if (!user) {
            user = new User({ uid });
        }

        if (name) user.name = name;
        if (bio !== undefined) user.bio = bio;
        
        let parsedSettings = settings;
        if (typeof settings === 'string') {
            try {
                parsedSettings = JSON.parse(settings);
            } catch (e) {
                console.error("Failed to parse settings JSON:", e);
            }
        }
        
        if (parsedSettings) {
            if (!user.settings) user.settings = {};
            if (parsedSettings.language) user.settings.language = parsedSettings.language;
            
            if (parsedSettings.notifications) {
                user.settings.notifications = {
                    ...user.settings.notifications,
                    ...parsedSettings.notifications
                };
            }
            if (parsedSettings.security) {
                user.settings.security = {
                    ...user.settings.security,
                    ...parsedSettings.security
                };
            }
        }

        if (req.body.removePhoto === 'true') {
            if (user.photoUrl && user.photoUrl.includes('r2.dev/avatars/')) {
                try {
                    const oldKey = user.photoUrl.split('r2.dev/')[1];
                    await s3.send(new DeleteObjectCommand({ Bucket: 'notora', Key: oldKey }));
                    console.log('Old photo deleted via removePhoto:', oldKey);
                } catch (e) {
                    console.error('Failed to delete old photo:', e);
                }
            }
            user.photoUrl = "";
        }

        if (req.file) {
            const photoExt = path.extname(req.file.originalname);
            const photoKey = `avatars/${Date.now()}-${Math.round(Math.random()*1000)}${photoExt}`;
            const photoStream = fs.createReadStream(req.file.path);

            const s3Params = {
                Bucket: 'notora',
                Key: photoKey,
                Body: photoStream,
                ContentType: req.file.mimetype,
            };

            await s3.send(new PutObjectCommand(s3Params));
            const newPhotoUrl = `https://pub-0531eeb1781e4d2f9030ec9b8f57fca5.r2.dev/${photoKey}`;
            
            // Delete old photo if it exists and is on our R2
            if (user.photoUrl && user.photoUrl.includes('r2.dev/avatars/')) {
                try {
                    const oldKey = user.photoUrl.split('r2.dev/')[1];
                    await s3.send(new DeleteObjectCommand({ Bucket: 'notora', Key: oldKey }));
                    console.log('Old photo deleted:', oldKey);
                } catch (e) {
                    console.error('Failed to delete old photo:', e);
                }
            }

            user.photoUrl = newPhotoUrl;
            fs.unlinkSync(req.file.path);
        }

        await user.save();
        res.json({ success: true, user });
    } catch (err) {
        console.error('Failed to update profile:', err);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});


app.get('/api/ping', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});

// Self-ping to prevent Render sleeping on free tier
const pingInterval = 8 * 60 * 1000; // 8 minutes
setInterval(() => {
    // RENDER_EXTERNAL_URL is automatically provided by Render
    const backendUrl = process.env.RENDER_EXTERNAL_URL || `http://localhost:${process.env.PORT || 9090}`;
    fetch(`${backendUrl}/api/ping`)
        .then(res => res.json())
        .then(data => console.log('Self-ping success:', data.time))
        .catch(err => console.error('Self-ping failed:', err.message));
}, pingInterval);


const PORT = process.env.PORT || 9090;
initClient().then(async () => {
    await dbManager.connectAll();
    app.listen(PORT, () => {
        console.log(`Secure Backend running on port ${PORT} with Multi-DB`);
    });
});
