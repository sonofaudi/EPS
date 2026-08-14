const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Violation = require('../models/Violation'); // Adjust path to match your model structure

/**
 * Helper: Assign default severity based on violation type
 */
function calculateSeverity(type) {
    switch (type) {
        case 'unauthorized_object':
        case 'multiple_faces':
            return 'high';
        case 'face_missing':
        case 'tab_switch':
            return 'medium';
        case 'fullscreen_exit':
        case 'gaze_away':
            return 'low';
        default:
            return 'medium';
    }
}

/**
 * Helper: Safely resolve valid MongoDB ObjectId or generate a fallback ObjectId for testing
 */
function resolveObjectId(idString) {
    if (idString && mongoose.Types.ObjectId.isValid(idString)) {
        return new mongoose.Types.ObjectId(idString);
    }
    // Dummy static ObjectId for demo/testing environments when raw string IDs are passed
    return new mongoose.Types.ObjectId("650000000000000000000001");
}

/**
 * POST /api/violations
 * Receives integrity logs from frontend ViolationsEngine
 */
router.post('/api/violations', async (req, res) => {
    try {
        const {
            session,
            sessionId,
            candidate,
            candidateId,
            type,
            confidence,
            severity,
            strikeEligible,
            persistenceDuration,
            description,
            screenshot,
            screenshotUrl
        } = req.body;

        // 1. Resolve raw inputs and map incoming frontend key variants
        const rawSessionId = session || sessionId;
        const rawCandidateId = candidate || candidateId;
        const imagePayload = screenshotUrl || screenshot || null;

        // 2. Map & validate violation enum types
        const allowedTypes = ['tab_switch', 'face_missing', 'multiple_faces', 'gaze_away', 'unauthorized_object', 'fullscreen_exit'];
        const resolvedType = allowedTypes.includes(type) ? type : 'unauthorized_object';

        // 3. Compute integrity severity and strike eligibility if omitted
        const computedSeverity = severity || calculateSeverity(resolvedType);
        const computedStrikeEligible = typeof strikeEligible === 'boolean' 
            ? strikeEligible 
            : ['high', 'critical'].includes(computedSeverity);

        // 4. Instantiate Mongoose Document with safe ObjectIds
        const newViolation = new Violation({
            session: resolveObjectId(rawSessionId),
            candidate: resolveObjectId(rawCandidateId),
            type: resolvedType,
            confidence: typeof confidence === 'number' ? confidence : 1.0,
            severity: computedSeverity,
            strikeEligible: computedStrikeEligible,
            persistenceDuration: persistenceDuration || 0,
            description: description || `Automated integrity log: ${resolvedType}`,
            screenshotUrl: imagePayload
        });

        // 5. Persist document to MongoDB
        const savedViolation = await newViolation.save();

        return res.status(201).json({
            success: true,
            message: 'Violation successfully archived in enforcement grid.',
            violationId: savedViolation._id,
            strikeAdded: savedViolation.strikeEligible
        });

    } catch (error) {
        console.error('❌ MongoDB Persistence Error in /api/violations:', error.message);

        return res.status(500).json({
            success: false,
            error: 'Internal Server Error',
            details: error.message
        });
    }
});

/**
 * GET /api/violations/:sessionId
 * Retrieves all violations associated with a specific exam session
 */
router.get('/api/violations/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(sessionId)) {
            return res.status(400).json({ success: false, error: 'Invalid Session ID format.' });
        }

        const logs = await Violation.find({ session: sessionId })
            .populate('candidate', 'fullName email registrationNumber')
            .sort({ timestamp: -1 });

        return res.status(200).json({
            success: true,
            count: logs.length,
            data: logs
        });

    } catch (error) {
        console.error('❌ Error fetching session violations:', error.message);
        return res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;