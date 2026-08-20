/**
 * KASU Proctoring System - Exam Event Lifecycle Controller
 * File Path: server/controllers/examController.js
 */

const violationService = require('../services/violationService');

exports.logViolation = async (req, res) => {
    try {
        const result = await violationService.handleNewViolation(req.body);

        return res.status(201).json({
            success: true,
            message: 'Violation and evidence successfully logged.',
            data: result.violation,
            strikeInfo: result.strikeInfo
        });
    } catch (error) {
        console.error('❌ Error logging violation via examController:', error.message);
        return res.status(500).json({
            success: false,
            error: 'Failed to record violation evidence.',
            details: error.message
        });
    }
};