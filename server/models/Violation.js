/**
 * KASU Proctoring System - Violation Mongoose Model
 * File Path: server/models/Violation.js
 */

const mongoose = require('mongoose');

const violationSchema = new mongoose.Schema({
    session: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Session',
        required: true
    },
    candidate: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student', // <--- FIXED: Match the registered 'Student' model name
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: [
            'tab_switch',
            'face_missing',
            'multiple_faces',
            'gaze_away',
            'unauthorized_object',
            'fullscreen_exit',
            'camera_blocked'
        ]
    },
    severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
    },
    confidence: {
        type: Number,
        default: 1.0
    },
    strikeEligible: {
        type: Boolean,
        default: true
    },
    persistenceDuration: {
        type: Number,
        default: 0
    },
    description: {
        type: String,
        default: ''
    },
    screenshotUrl: {
        type: String,
        default: null
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Violation', violationSchema);