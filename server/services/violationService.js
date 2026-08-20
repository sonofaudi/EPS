/**
 * KASU Proctoring System - Violation Service Engine
 * File Path: server/services/violationService.js
 */

const mongoose = require('mongoose');
const Violation = require('../models/Violation');
const Session = require('../models/Session');
const screenshotService = require('./screenshotService');

// Fallback valid Mongo ObjectIds for dummy/demo values
const MOCK_SESSION_ID = new mongoose.Types.ObjectId("650000000000000000000001");
const MOCK_CANDIDATE_ID = new mongoose.Types.ObjectId("650000000000000000000002");

/**
 * Validates whether a string is a valid 24-character hex MongoDB ObjectId
 */
function toValidObjectId(idString, fallbackId) {
    if (idString && mongoose.Types.ObjectId.isValid(idString) && String(new mongoose.Types.ObjectId(idString)) === idString) {
        return idString;
    }
    return fallbackId;
}

/**
 * Processes incoming violation payloads, saves frame screenshots to disk,
 * and records the event in MongoDB.
 */
async function handleNewViolation(payload) {
    const {
        sessionId,
        session,
        candidateId,
        candidate,
        type,
        severity = 'medium',
        description = '',
        screenshotUrl,
        screenshot,
        confidence = 1.0,
        persistenceDuration = 0,
        strikeEligible = true
    } = payload;

    // Resolve raw input strings
    const rawSession = sessionId || session;
    const rawCandidate = candidateId || candidate;
    const rawScreenshot = screenshotUrl || screenshot;

    // Safely cast string IDs or replace mock strings with valid ObjectIds
    const dbSessionId = toValidObjectId(rawSession, MOCK_SESSION_ID);
    const dbCandidateId = toValidObjectId(rawCandidate, MOCK_CANDIDATE_ID);

    // 1. Process and save base64 screenshot image file to local disk
    let savedImagePath = null;
    if (rawScreenshot) {
        savedImagePath = screenshotService.saveScreenshot(rawScreenshot, rawCandidate || 'candidate');
    }

    // 2. Persist violation record in database
    const newViolation = await Violation.create({
        session: dbSessionId,
        candidate: dbCandidateId,
        type,
        severity,
        description,
        screenshotUrl: savedImagePath || rawScreenshot,
        confidence,
        persistenceDuration,
        strikeEligible
    });

    // 3. Increment session strike count if applicable
    let strikeInfo = { applied: false, currentStrikes: 0, maxStrikes: 5, shouldTerminate: false };

    if (dbSessionId) {
        const targetSession = await Session.findById(dbSessionId);
        if (targetSession) {
            if (strikeEligible) {
                targetSession.strikeCount = (targetSession.strikeCount || 0) + 1;
                if (targetSession.strikeCount >= 5) {
                    targetSession.status = 'terminated';
                }
                await targetSession.save();
            }

            strikeInfo = {
                applied: strikeEligible,
                currentStrikes: targetSession.strikeCount,
                maxStrikes: 5,
                shouldTerminate: targetSession.strikeCount >= 5
            };
        }
    }

    return {
        violation: newViolation,
        strikeInfo
    };
}

module.exports = {
    handleNewViolation
};