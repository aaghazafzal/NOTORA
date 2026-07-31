const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    uid: { type: String, required: true, unique: true },
    name: { type: String },
    bio: { type: String },
    photoUrl: { type: String },
    followers: { type: Number, default: 0 },
    following: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
