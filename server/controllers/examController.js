/**
 * KASU Proctoring System - Exam Event Lifecycle Controller
 * File Path: server/controllers/examController.js
 */

const violationService = require('../services/violationService');

exports.logViolation = async (req, res) => {
    try {
        const { session, candidate, type, confidence, description, screenshot, timestamp, persistenceDuration } = req.body;

        if (!type || !description) {
            return res.status(400).json({
                success: false,
                message: "Missing critical parameters: 'type' and 'description' are mandatory metrics."
            });
        }

        const result = await violationService.handleNewViolation({
            session,
            candidate,
            type,
            confidence,
            description,
            screenshot,
            timestamp,
            persistenceDuration
        });

        return res.status(201).json({
            success: true,
            message: "Proctoring telemetry recorded successfully.",
            data: result.violation,
            strikeInfo: result.strikeInfo
        });

    } catch (error) {
        console.error("❌ Error caught inside examController.logViolation:", error);
        return res.status(500).json({
            success: false,
            message: "Critical error encountered handling incoming monitoring stream transaction.",
            error: error.message
        });
    }
};