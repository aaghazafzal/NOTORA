const mongoose = require('mongoose');
const Book = require('./models/Book');

const MONGO_URI = "mongodb+srv://notora:aaghaz9431@notora.fvaoxen.mongodb.net/?appName=notora";

async function updateCovers() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB...");
        
        const result = await Book.updateMany({}, { 
            $set: { coverUrl: "https://pub-0531eeb1781e4d2f9030ec9b8f57fca5.r2.dev/covers/1784306936149-244.jpg" } 
        });
        
        console.log(`Successfully updated ${result.modifiedCount} books with the new R2 cover image!`);
        mongoose.disconnect();
    } catch (err) {
        console.error("Error updating covers:", err);
        mongoose.disconnect();
    }
}

updateCovers();
