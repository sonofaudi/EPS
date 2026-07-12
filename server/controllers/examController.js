/**
 * KASU Proctoring System - Exam Event Lifecycle Controller
 * File Path: server/controllers/examController.js
 */

const violationService = require('../services/violationService');

/**
 * REST Endpoint: Receives and processes real-time AI security integrity alerts
 * @param {Object} req - Express Request context containing the body payload
 * @param {Object} res - Express Response context
 */
exports.logViolation = async (req, res) => {
    try {
        const { session, candidate, type, confidence, description, screenshot, timestamp } = req.body;

        // Basic validation boundary check
        if (!type || !description) {
            return res.status(400).json({
                success: false,
                message: "Missing critical parameters: 'type' and 'description' are mandatory metrics."
            });
        }

        // Delegate the complex task of saving to database and executing business logic to the service
        const savedRecord = await violationService.handleNewViolation({
            session,
            candidate,
            type,
            confidence,
            description,
            screenshot,
            timestamp
        });

        return res.status(201).json({
            success: true,
            message: "Proctoring anomaly recorded successfully into system architecture.",
            data: savedRecord
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