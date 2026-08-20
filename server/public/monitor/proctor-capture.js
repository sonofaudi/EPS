/**
 * KASU Proctoring System - Client Canvas Frame Grabber Utility
 * File Path: client/js/monitor/proctor-capture.js
 */

(function (window) {
    'use strict';

    const ProctorCapture = {
        /**
         * Extracts a frame snapshot from the running webcam layout element
         * @param {string} videoElementId - ID selector of the active HTML video tag (defaults to 'proctorFeed')
         * @returns {string|null} - Base64 JPEG Data URL string, or null if camera/feed unavailable
         */
        grabSnapshot(videoElementId = 'proctorFeed') {
            // Attempt to resolve target video element, fallback to first <video> tag on page
            let video = document.getElementById(videoElementId);
            if (!video) {
                video = document.querySelector('video');
            }

            // Ensure video element exists, has loaded metadata, and is actively streaming
            if (!video || !video.videoWidth || !video.videoHeight) {
                console.warn("⚠️ Snapshot intercept failed: Video feed source stream not active or metadata uninitialized.");
                return null;
            }

            // Verify video stream HAS_ENOUGH_DATA (readyState >= 3 or 4)
            if (typeof video.readyState === 'number' && video.readyState < 2) {
                console.warn("⚠️ Snapshot intercept failed: Video feed state not ready for capture.");
                return null;
            }

            try {
                // Instantiate off-screen canvas matching active video stream dimensions
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = video.videoWidth || 640;
                tempCanvas.height = video.videoHeight || 480;

                const context = tempCanvas.getContext('2d');

                if (!context) {
                    console.error("❌ Failed to obtain 2D rendering context for snapshot canvas.");
                    return null;
                }

                // Mirror flip alignment to match user layout feed rendering
                context.translate(tempCanvas.width, 0);
                context.scale(-1, 1);

                // Render current instantaneous video frame onto transient canvas
                context.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);

                // Export to compressed Base64 JPEG string (60% quality balance)
                const dataUrl = tempCanvas.toDataURL('image/jpeg', 0.6);

                // Basic validation on returned Data URI structure
                if (dataUrl && dataUrl.startsWith('data:image/')) {
                    return dataUrl;
                }

                return null;

            } catch (error) {
                console.error("❌ Frontend video frame state extraction pipeline failure:", error);
                return null;
            }
        }
    };

    // Attach to global window object
    window.ProctorCapture = ProctorCapture;

})(window);