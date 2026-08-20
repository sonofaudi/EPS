/**
 * KASU Proctoring System - Exam & Violation Controller
 * File Path: server/controllers/examController.js
 */

const violationService = require('../services/violationService');
const Violation = require('../models/Violation');
const mongoose = require('mongoose');

/**
 * Handles incoming integrity violations from ViolationsEngine
 */
async function logViolation(req, res) {
    try {
        console.log('📥 [examController] Incoming violation request:', req.body.type);

        // Process screenshot conversion and MongoDB persistence via violationService
        const result = await violationService.handleNewViolation(req.body);

        return res.status(201).json({
            success: true,
            message: 'Violation and evidence successfully logged.',
            data: result.violation,
            strikeInfo: result.strikeInfo
        });

    } catch (error) {
        console.error('❌ [examController] Violation logging error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal Server Error',
            details: error.message
        });
    }
}

/**
 * Retrieves all archived violation logs for a given session
 */
async function getSessionViolations(req, res) {
    try {
        const { sessionId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(sessionId)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid Session ID format.' 
            });
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
        return res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
}

module.exports = {
    logViolation,
    getSessionViolations
};