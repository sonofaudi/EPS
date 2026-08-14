const mongoose = require('mongoose');
const Violation = require('../models/Violation');
const screenshotService = require('./screenshotService');

const ALLOWED_TYPES = [
    'tab_switch',
    'face_missing',
    'multiple_faces',
    'gaze_away',
    'unauthorized_object',
    'fullscreen_exit'
];

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

function resolveObjectId(idString) {
    if (idString && mongoose.Types.ObjectId.isValid(idString)) {
        return new mongoose.Types.ObjectId(idString);
    }
    // Fallback static ID for testing/demo mode
    return new mongoose.Types.ObjectId("650000000000000000000001");
}

async function handleNewViolation(data) {
    const {
        session,
        sessionId,
        candidate,
        candidateId,
        type,
        confidence = 1.0,
        description,
        screenshot,
        screenshotUrl,
        timestamp,
        persistenceDuration = 0
    } = data;

    const rawType = ALLOWED_TYPES.includes(type) ? type : 'unauthorized_object';
    const targetSessionId = resolveObjectId(session || sessionId);
    const targetCandidateId = resolveObjectId(candidate || candidateId);

    const severity = calculateSeverity(rawType);

    // 1. Process screenshot evidence before DB write
    let finalScreenshotUrl = screenshotUrl || null;
    const base64ImageData = screenshot || null;

    if (base64ImageData && !finalScreenshotUrl) {
        finalScreenshotUrl = screenshotService.saveScreenshot(
            base64ImageData,
            targetCandidateId.toString()
        );
    }

    const strikeEligible = ['high', 'critical'].includes(severity);

    // 2. Persist DB Document
    const violation = await Violation.create({
        session: targetSessionId,
        candidate: targetCandidateId,
        type: rawType,
        confidence: typeof confidence === 'number' ? confidence : 1.0,
        severity,
        strikeEligible,
        persistenceDuration: persistenceDuration || 0,
        description: description || `Integrity anomaly detected: ${rawType}`,
        screenshotUrl: finalScreenshotUrl,
        timestamp: timestamp || new Date()
    });

    // 3. Official strike count calculation
    const currentStrikes = await Violation.countDocuments({
        session: targetSessionId,
        candidate: targetCandidateId,
        strikeEligible: true
    });

    const MAX_STRIKES = 5; // Standardized authoritative strike policy

    return {
        violation,
        strikeInfo: {
            applied: strikeEligible,
            currentStrikes,
            maxStrikes: MAX_STRIKES,
            shouldTerminate: currentStrikes >= MAX_STRIKES
        }
    };
}

module.exports = {
    handleNewViolation
};