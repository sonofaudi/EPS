const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    fullName: { type: String, required: true, trim: true },
    matricNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
    faculty: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true },
    level: { type: String, required: true, trim: true },
    examId: { type: String, required: true, trim: true }, // Ties student to a specific scheduled paper
    isAllowed: { type: Boolean, default: true } // Dynamic administrative ban switch
}, { timestamps: true });

// Exporting the 'Student' model within Candidate.js
module.exports = mongoose.model('Student', studentSchema);