const mongoose = require('mongoose');

const librarySchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    progress: {
        // Map of bookId -> current page/percentage
        type: Map,
        of: Number,
        default: {}
    },
    shelves: {
        reading: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Book' }],
        favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Book' }],
        completed: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Book' }],
        'to-read': [{ type: mongoose.Schema.Types.ObjectId, ref: 'Book' }]
    },
    customShelves: {
        // Map of shelfName -> Array of bookIds
        type: Map,
        of: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Book' }],
        default: {}
    }
}, { timestamps: true });

module.exports = librarySchema;
