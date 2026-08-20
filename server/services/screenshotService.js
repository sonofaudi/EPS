/**
 * KASU Proctoring System - Evidence Storage Manager
 * File Path: server/services/screenshotService.js
 */
const fs = require('fs');
const path = require('path');

// FIXED: Points directly to server/public/uploads/screenshots
const UPLOAD_DIR = path.join(__dirname, '../public/uploads/screenshots');

// Ensure directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

function saveScreenshot(base64String, candidateId) {
    if (!base64String) return null;

    try {
        // Strip data URI header if present
        const matches = base64String.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
        let buffer;
        let extension = 'png';

        if (matches && matches.length === 3) {
            extension = matches[1] === 'jpeg' ? 'jpg' : matches[1];
            buffer = Buffer.from(matches[2], 'base64');
        } else {
            buffer = Buffer.from(base64String, 'base64');
        }

        const filename = `violation_${candidateId}_${Date.now()}.${extension}`;
        const filepath = path.join(UPLOAD_DIR, filename);

        fs.writeFileSync(filepath, buffer);
        console.log(`📸 Screenshot saved successfully: ${filename}`);

        return `/uploads/screenshots/${filename}`;
    } catch (error) {
        console.error('❌ Failed to save screenshot:', error.message);
        return null;
    }
}

module.exports = {
    saveScreenshot
};