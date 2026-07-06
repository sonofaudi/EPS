const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    fullName: { type: String, required: true, trim: true },
    password: { type: String, required: true }
}, { timestamps: true });

// CRITICAL: This exact export configuration makes .deleteMany() available
module.exports = mongoose.model('Admin', adminSchema);