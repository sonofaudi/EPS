/**
 * KASU Proctoring System - Core Violation Processing Service Layer
 * File Path: server/services/violationService.js
 */

const Violation = require('../models/Violation');
const Session = require('../models/Session');
const screenshotService = require('./screenshotService');

const violationService = {
    /**
     * Executes data model instantiation, process visual evidence, and updates thresholds
     * @param {Object} rawData - Incoming payload tracking structural model fields
     */
    async handleNewViolation(rawData) {
        try {
            let finalizedScreenshotUrl = null;

            // 1. Process visual evidence screenshot if provided in the payload request
            if (rawData.screenshot) {
                finalizedScreenshotUrl = screenshotService.saveScreenshot(
                    rawData.screenshot, 
                    rawData.candidate || 'unknown'
                );
            }

            // 2. Map parameters explicitly to your MongoDB Mongoose Schema
            const infraction = new Violation({
                session: rawData.session || null,
                candidate: rawData.candidate || null,
                type: rawData.type,
                confidence: parseFloat(rawData.confidence || 1.0),
                description: rawData.description,
                screenshotUrl: finalizedScreenshotUrl, // Stores public access link path string
                timestamp: rawData.timestamp || new Date()
            });

            // 3. Persist directly down to your MongoDB Cluster environment
            const savedInfraction = await infraction.save();
            console.log(`💾 [MongoDB Commit] Infraction type (${rawData.type}) secured permanently.`);

            // 4. Increment the cumulative strike metric count on the active operational session context
            if (rawData.session) {
                await Session.findByIdAndUpdate(rawData.session, {
                    $inc: { strikeCount: 1 }
                });
            }

            return savedInfraction;

        } catch (error) {
            console.error("❌ Database persistence pipeline error inside violationService:", error);
            throw error;
        }
    }
};

module.exports = violationService;