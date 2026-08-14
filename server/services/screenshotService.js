/**
 * KASU Proctoring System - Evidence Storage Manager
 * File Path: server/services/screenshotService.js
 */

const fs = require('fs');
const path = require('path');

const screenshotService = {
    /**
     * Decodes a base64 image data string and saves it to public/screenshots/
     * @param {string} base64Data - Base64 string from canvas/ProctorCapture
     * @param {string} candidateId - Candidate identifier for file naming
     * @returns {string|null} - Accessible URL path (e.g., /screenshots/evidence_xxx.jpg)
     */
    saveScreenshot: function (base64Data, candidateId) {
        if (!base64Data || typeof base64Data !== 'string') return null;

        try {
            // Strip data prefix if present
            const matches = base64Data.match(/^data:image\/([a-zA-Z]*);base64,(.+)$/);
            const imageBuffer = matches 
                ? Buffer.from(matches[2], 'base64') 
                : Buffer.from(base64Data, 'base64');

            const uploadDir = path.join(__dirname, '../public/screenshots');

            // Ensure destination directory exists
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            const cleanCandidate = (candidateId || 'anon').toString().replace(/[^a-zA-Z0-9]/g, '_');
            const filename = `evidence_${cleanCandidate}_${Date.now()}.jpg`;
            const filePath = path.join(uploadDir, filename);

            fs.writeFileSync(filePath, imageBuffer);

            // FIX: Express static serving handles /screenshots directly
            return `/screenshots/${filename}`;
        } catch (err) {
            console.error('❌ Failed to persist screenshot buffer:', err.message);
            return null;
        }
    }
};

module.exports = screenshotService;