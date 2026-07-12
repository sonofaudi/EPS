/**
 * KASU Proctoring System - Client Canvas Frame Grabber Utility
 * File Path: client/js/monitor/proctor-capture.js
 */

const ProctorCapture = {
    /**
     * Extracts a frame snapshot from the running webcam layout element
     * @param {string} videoElementId - Domestic ID selector of the active HTML video tag
     * @returns {string|null} - Base64 JPEG string snapshot sequence, or null if camera unavailable
     */
    grabSnapshot(videoElementId = 'proctorFeed') {
        const video = document.getElementById(videoElementId);
        
        if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) {
            console.warn("⚠️ Snapshot intercept failed: Video feed source stream not ready.");
            return null;
        }

        try {
            // Create an off-screen transient canvas block
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = video.videoWidth || 640;
            tempCanvas.height = video.videoHeight || 480;
            
            const context = tempCanvas.getContext('2d');
            
            // Mirror flip alignment support to stay consistent with the user layout canvas
            context.translate(tempCanvas.width, 0);
            context.scale(-1, 1);
            
            // Render the instantaneous frame capture onto the layout context box
            context.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
            
            // Extract the canvas down into a low-overhead compressed Base64 JPEG layout string
            return tempCanvas.toDataURL('image/jpeg', 0.6); // 60% quality compression balance

        } catch (error) {
            console.error("❌ Frontend video frame state extraction pipeline failure:", error);
            return null;
        }
    }
};

window.ProctorCapture = ProctorCapture;