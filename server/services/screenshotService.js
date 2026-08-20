/**
 * KASU Proctoring System - Evidence Storage Manager
 * File Path: server/services/screenshotService.js
 */
const fs = require('fs');
const path = require('path');

const UPLOAD_DIR = path.join(__dirname, '../public/uploads/screenshots');

function ensureDirExists() {
    if (!fs.existsSync(UPLOAD_DIR)) {
        fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }
}

function saveScreenshot(base64String, candidateId = 'candidate') {
    if (!base64String || typeof base64String !== 'string') {
        console.warn('⚠️ [ScreenshotService] Skipped: Invalid or missing Base64 string.');
        return null;
    }

    try {
        ensureDirExists();

        // Extract base64 image data
        const matches = base64String.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
        let buffer;
        let extension = 'jpg';

        if (matches && matches.length === 3) {
            extension = matches[1] === 'jpeg' ? 'jpg' : matches[1];
            buffer = Buffer.from(matches[2], 'base64');
        } else {
            // Strip raw header prefix manually if regex match misses
            const cleanBase64 = base64String.replace(/^data:image\/\w+;base64,/, '');
            buffer = Buffer.from(cleanBase64, 'base64');
        }

        const filename = `violation_${candidateId}_${Date.now()}.${extension}`;
        const filepath = path.join(UPLOAD_DIR, filename);

        // Write image file directly
        fs.writeFileSync(filepath, buffer);
        console.log(`📸 [ScreenshotService] Screenshot saved successfully -> ${filepath}`);

        return `/public/uploads/screenshots/${filename}`;
    } catch (error) {
        console.error('❌ [ScreenshotService] Failed to save screenshot file:', error.message);
        return null;
    }
}

module.exports = {
    saveScreenshot
};