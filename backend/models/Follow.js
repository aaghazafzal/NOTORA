const mongoose = require('mongoose');

const followSchema = new mongoose.Schema({
    followerId: { type: String, required: true },
    followingId: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

followSchema.index({ followerId: 1, followingId: 1 }, { unique: true });

module.exports = followSchema;
