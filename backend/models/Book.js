const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
    title: { type: String, required: true },
    author: { type: String, required: true },
    description: { type: String },
    filename: { type: String, required: true },
    size: { type: Number },
    coverUrl: { type: String, required: true },
    genre: { type: String, required: true },
    tags: [{ type: String }],
    language: { type: String, default: 'English' },
    telegramPrimaryMsgId: { type: Number, required: true },
    telegramBackupMsgId: { type: Number },
    uploaderId: { type: String }, // Firebase UID of the user who uploaded this book
    uploadDate: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Book', bookSchema);
