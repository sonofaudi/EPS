/**
 * KASU Proctoring System - Evidence Storage Manager
 * File Path: server/services/screenshotService.js
 */

const fs = require('fs');
const path = require('path');

const screenshotService = {
    /**
     * Decodes Base64 image streams and saves them to the local file system
     * @param {string} base64Data - Raw image data string from the client camera canvas
     * @param {string} candidateId - The ID of the student (used for unique naming)
     * @returns {string|null} - Relative URL path to access the file, or null if failed
     */
    saveScreenshot(base64Data, candidateId) {
        if (!base64Data) return null;

        try {
            // 1. Clean the incoming base64 payload header string if present
            const matches = base64Data.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
            let imageBuffer;
            
            if (matches && matches.length === 3) {
                imageBuffer = Buffer.from(matches[2], 'base64');
            } else {
                // If it's already raw base64 data without the data:image prefix
                imageBuffer = Buffer.from(base64Data, 'base64');
            }

            // 2. Define target directory mapping
            const outputDir = path.join(__dirname, '../../public/screenshots');
            
            // Ensure the directory exists recursively
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }

            // 3. Generate a distinct, timestamped filename
            const filename = `evidence_${candidateId}_${Date.now()}.jpg`;
            const fullPath = path.join(outputDir, filename);

            // 4. Synchronously write the buffer stream to disk
            fs.writeFileSync(fullPath, imageBuffer);
            console.log(`📸 [Evidence Captured] Saved screenshot locally: ${filename}`);

            // 5. Return the public web access path to be saved in MongoDB
            return `/public/screenshots/${filename}`;

        } catch (error) {
            console.error("❌ Evidence Repository Writer Failure:", error);
            return null;
        }
    }
};

module.exports = screenshotService;