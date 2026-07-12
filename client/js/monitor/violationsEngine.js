/**
 * KASU Proctoring System - Client-Side Violations Engine Pipeline
 * File Path: client/js/monitor/violationsEngine.js
 * 
 * Central aggregator managing state, event collection, processing, 
 * and network transmission of AI/System integrity infractions to the backend.
 */

const ViolationsEngine = {
    // Configuration settings for tracking thresholds
    config: {
        apiUrl: '/api/violations',
        localStorageSessionKey: 'kasu_exam_session',
        localStorageCandidateKey: 'kasu_candidate_info'
    },

    /**
     * Aggregates violation data, handles metadata retrieval, and dispatches payload to MongoDB
     * @param {Object} violationDetails - Context object for the detected infraction
     * @param {string} violationDetails.type - Action pattern (e.g., 'tab_switch', 'unauthorized_object')
     * @param {number} violationDetails.confidence - ML model certainty score (0.0 to 1.0)
     * @param {string} violationDetails.description - Text details describing the frame event
     * @param {string} [violationDetails.screenshot] - Base64 encoded snapshot string (Optional)
     */
    async report({ type, confidence, description, screenshot = null }) {
        try {
            // 1. Retrieve session context dynamically from local cache structures
            const sessionData = JSON.parse(localStorage.getItem(this.config.localStorageSessionKey)) || {};
            const candidateData = JSON.parse(localStorage.getItem(this.config.localStorageCandidateKey)) || {};

            const sessionId = sessionData.id || sessionData._id || null;
            const candidateId = candidateData.id || candidateData._id || null;

            if (!sessionId || !candidateId) {
                console.warn("⚠️ Violations Engine Warning: Active session or candidate metadata profile missing from browser memory state.");
            }

            // 2. Build standard data tracking payload structure matching server schemas
            const payload = {
                session: sessionId,
                candidate: candidateId,
                type: type,
                confidence: parseFloat(confidence || 1.0),
                description: description,
                screenshot: screenshot, // Sent forward for Phase 10 Evidence Processing
                timestamp: new Date().toISOString()
            };

            console.log(`📡 dispatching proctor event [${type}] to system core architecture...`);

            // 3. Open asynchronous transmission line directly over Express routing channel
            const response = await fetch(this.config.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('kasu_auth_token') || ''}`
                },
                body: JSON.stringify(payload)
            });

            // 4. Handle boundary states and parsing
            if (!response.ok) {
                throw new Error(`HTTP network pipeline error status code returned: ${response.status}`);
            }

            const result = await response.json();
            
            // 5. Fire global window events so local interfaces (like exam.html) can change colors live
            const event = new CustomEvent('kasu_violation_logged', { detail: result });
            window.dispatchEvent(event);

            return result;

        } catch (error) {
            console.error("❌ Violations Engine Core pipeline synchronization crash:", error);
            
            // Graceful fallback mechanism: maintain locally in console array trace if connection drops
            this._storeLocalBackup({ type, confidence, description, error: error.message });
            
            return { success: false, error: error.message };
        }
    },

    /**
     * Emergency fallback repository tracker if candidate drops local network connectivity mid-exam
     */
    _localBackupQueue: [],
    _storeLocalBackup(failedPayload) {
        failedPayload.offlineTimestamp = new Date().toISOString();
        this._localBackupQueue.push(failedPayload);
        console.warn("📥 Infraction queued into secondary local memory block: Offline tracking mode active.");
    }
};

// Bind directly onto root viewport runtime state to open accessibility vectors across script layers
window.ViolationsEngine = ViolationsEngine;