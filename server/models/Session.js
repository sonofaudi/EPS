const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
    sessionId: { type: String, required: true, unique: true }, // Cryptographically secure token identifier
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    
    // Multi-Stage Verification Pipeline Gates
    status: { 
        type: String, 
        enum: ['pending_identity', 'identity_passed', 'active_exam', 'completed', 'flagged_terminated'], 
        default: 'pending_identity' 
    },
    identityVerified: { type: Boolean, default: false },
    faceVerified: { type: Boolean, default: false },
    examStarted: { type: Boolean, default: false },
    examEnded: { type: Boolean, default: false },
    
    // Live Proctoring Risk Analytics Matrices
    riskScore: { type: Number, default: 0, min: 0, max: 100 },
    violationsCount: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Session', sessionSchema);