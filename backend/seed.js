const mongoose = require('mongoose');
const Book = require('./models/Book');

const MONGO_URI = "mongodb+srv://notora:aaghaz9431@notora.fvaoxen.mongodb.net/?appName=notora";

const genres = ["Science Fiction", "Literary Fiction", "Magical Realism", "Thriller", "Poetry", "Philosophy", "Psychology", "Technology", "History", "Fantasy"];
const authors = ["Ravi Menon", "Juno Park", "Elena Rossi", "Michael Chang", "Sarah Jenkins", "David Mitchell", "Haruki Murakami", "Neil Gaiman", "Yuval Noah Harari", "Carl Jung"];
const adjectives = ["The Silent", "Whispering", "Glass", "Neon", "Forgotten", "Invisible", "Quantum", "Golden", "Crimson", "Midnight"];
const nouns = ["Cities", "Gardener", "Wind", "Choir", "Shadows", "Illusion", "Echoes", "Paradox", "Voyage", "Empire"];
const tagsList = ["bestseller", "classic", "modern", "mind-bending", "award-winning", "must-read", "dark", "uplifting", "epic", "short-read"];

function getRandomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

async function seedDatabase() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB for seeding...");

        // Clear existing books (optional, let's keep them if user wants, but seeding 100 is enough)
        await Book.deleteMany({});
        console.log("Cleared old books.");

        const booksToInsert = [];
        for (let i = 1; i <= 100; i++) {
            // Generate a random title
            const title = `${getRandomItem(adjectives)} ${getRandomItem(nouns)}`;
            const genre = getRandomItem(genres);
            const author = getRandomItem(authors);
            const numTags = Math.floor(Math.random() * 3) + 1;
            const tags = [];
            for (let j = 0; j < numTags; j++) {
                const tag = getRandomItem(tagsList);
                if (!tags.includes(tag)) tags.push(tag);
            }

            // Using placeholder images for covers with different colors based on index
            const coverUrl = `https://picsum.photos/seed/${i + 100}/400/600`;

            booksToInsert.push({
                title: title,
                author: author,
                description: `A fascinating journey into the world of ${genre.toLowerCase()}. This masterpiece by ${author} explores the depths of the human experience through the lens of ${tags.join(' and ')}.`,
                filename: `Introduction_to_${genre.replace(' ', '_')}.pdf`,
                size: 25 * 1024 * 1024, // 25 MB dummy size
                coverUrl: coverUrl,
                genre: genre,
                tags: tags,
                language: i % 5 === 0 ? "Hindi" : "English",
                telegramPrimaryMsgId: 100, // Dummy message ID for testing
                telegramBackupMsgId: 101, // Dummy backup ID
                uploadDate: new Date(Date.now() - Math.random() * 10000000000) // Random date in the past
            });
        }

        await Book.insertMany(booksToInsert);
        console.log(`Successfully seeded ${booksToInsert.length} books!`);
        mongoose.disconnect();
    } catch (err) {
        console.error("Error seeding database:", err);
        mongoose.disconnect();
    }
}

seedDatabase();
