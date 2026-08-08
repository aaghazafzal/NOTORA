const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    uid: { type: String, required: true, unique: true },
    name: { type: String },
    bio: { type: String },
    photoUrl: { type: String },
    followers: { type: Number, default: 0 },
    following: { type: Number, default: 0 },
    settings: {
        language: { type: String, default: "English" },
        notifications: {
            newReviews: { type: Boolean, default: true },
            newFollowers: { type: Boolean, default: true },
            replies: { type: Boolean, default: true },
            weeklyDigest: { type: Boolean, default: false }
        },
        security: {
            twoFactor: { type: Boolean, default: false },
            sessionSync: { type: Boolean, default: true }
        }
    }
}, { timestamps: true });

module.exports = userSchema;
