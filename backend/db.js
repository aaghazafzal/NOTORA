const mongoose = require('mongoose');
const bookSchema = require('./models/Book');
const librarySchema = require('./models/Library');
const userSchema = require('./models/User');
const reviewSchema = require('./models/Review');

const URIs = [
    "mongodb+srv://notora:aaghaz9431@notora.fvaoxen.mongodb.net/?appName=notora",
    "mongodb+srv://notora2:aaghaz9431@notora2.qni1ovz.mongodb.net/?appName=notora2"
];

class MultiDBManager {
    constructor() {
        this.connections = [];
        this.activeConnectionIndex = 0;
    }

    async connectAll() {
        for (let i = 0; i < URIs.length; i++) {
            const conn = mongoose.createConnection(URIs[i]);
            conn.model('Book', bookSchema);
            conn.model('User', userSchema);
            conn.model('Library', librarySchema);
            conn.model('Review', reviewSchema);
            await conn.asPromise();
            this.connections.push(conn);
            console.log(`Connected to Database ${i + 1}`);
        }
        await this.checkStorage();
        // Check every 15 minutes
        setInterval(() => this.checkStorage(), 15 * 60 * 1000);
    }

    async checkStorage() {
        const LIMIT = 500 * 1024 * 1024; // 500 MB limit threshold for switching
        for (let i = 0; i < this.connections.length; i++) {
            try {
                const stats = await this.connections[i].db.stats();
                // Check dataSize to ensure we stay under the 512MB free tier limit
                if (stats.dataSize < LIMIT) {
                    this.activeConnectionIndex = i;
                    console.log(`Active Database for writing is now DB ${i + 1}`);
                    return;
                }
            } catch (err) {
                console.error(`Failed to get stats for DB ${i + 1}:`, err);
            }
        }
        console.warn("ALL DATABASES ARE NEARLY FULL!");
        // Fallback to the last database if all are full
        this.activeConnectionIndex = this.connections.length - 1;
    }

    // Always get User and Library models from the primary (first) database
    // since they take up very little space and we want to avoid fragmentation.
    getUserModel() {
        return this.connections[0].model('User');
    }

    getLibraryModel() {
        return this.connections[0].model('Library');
    }

    getReviewModel() {
        return this.connections[0].model('Review');
    }

    // Get the Book model for the currently active database (for uploads)
    getActiveBookModel() {
        return this.connections[this.activeConnectionIndex].model('Book');
    }

    // Helper: Find documents across all sharded Book collections
    async findBooksAcrossAll(query, sort = null, skip = 0, limit = 0) {
        let allResults = [];
        for (const conn of this.connections) {
            const BookModel = conn.model('Book');
            let q = BookModel.find(query);
            if (sort) q = q.sort(sort);
            if (limit > 0) {
                q = q.limit(skip + limit);
            }
            const results = await q.lean().exec();
            allResults = allResults.concat(results);
        }

        // Sort in memory if needed
        if (sort && sort.uploadDate) {
            const dir = sort.uploadDate === -1 ? -1 : 1;
            allResults.sort((a, b) => {
                const dateA = new Date(a.uploadDate || 0).getTime();
                const dateB = new Date(b.uploadDate || 0).getTime();
                return dir === -1 ? dateB - dateA : dateA - dateB;
            });
        }

        if (limit > 0) {
            return allResults.slice(skip, skip + limit);
        }
        return allResults;
    }

    async countBooksAcrossAll(query) {
        let total = 0;
        for (const conn of this.connections) {
            const BookModel = conn.model('Book');
            total += await BookModel.countDocuments(query);
        }
        return total;
    }

    async findBookByIdAcrossAll(id) {
        for (const conn of this.connections) {
            const BookModel = conn.model('Book');
            const doc = await BookModel.findById(id).lean();
            if (doc) return doc;
        }
        return null;
    }

    // Returns a real Mongoose document, not a lean object
    async findBookDocByIdAcrossAll(id) {
        for (const conn of this.connections) {
            const BookModel = conn.model('Book');
            const doc = await BookModel.findById(id);
            if (doc) return doc;
        }
        return null;
    }

    async updateBookByIdAcrossAll(id, updateData) {
        for (const conn of this.connections) {
            const BookModel = conn.model('Book');
            // Try updating it on this connection
            const doc = await BookModel.findByIdAndUpdate(id, updateData, { new: true });
            if (doc) return doc; // Found and updated
        }
        return null;
    }
}

const dbManager = new MultiDBManager();
module.exports = dbManager;
