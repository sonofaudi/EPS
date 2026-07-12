const mongoose = require('mongoose');

const violationSchema = new mongoose.Schema({
    session: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Session',
        required: true
    },
    candidate: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Candidate',
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ['tab_switch', 'face_missing', 'multiple_faces', 'gaze_away', 'unauthorized_object', 'fullscreen_exit']
    },
    confidence: {
        type: Number,
        default: 1.0 // 100% confidence for events like tab switching, varies for ML detections
    },
    description: {
        type: String,
        required: true
    },
    screenshotUrl: {
        type: String, // Pointing to local path: /public/screenshots/filename.jpg or Cloudinary URL
        required: false
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

module.exports = mongoose.model('Violation', violationSchema);