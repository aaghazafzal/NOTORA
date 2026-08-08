const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    bookId: { type: String, required: true, index: true },
    userId: { type: String, required: true }, // Firebase UID
    rating: { type: Number, required: true, min: 1, max: 5 },
    reviewText: { type: String, maxlength: 300 }, // Strict 300 char limit
}, { timestamps: true });

// Ensure a user can only review a book once
reviewSchema.index({ bookId: 1, userId: 1 }, { unique: true });

module.exports = reviewSchema;
