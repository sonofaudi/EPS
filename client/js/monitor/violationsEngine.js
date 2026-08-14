/**
 * Violations Engine Core - KASU EPS
 * Handles reporting, UI counter updates, local storage backup, and backend syncing.
 */
(function (window) {
    'use strict';

    const ViolationsEngine = {
        strikeCount: 0,
        maxStrikes: 5,
        isProcessing: false,
        isTerminated: false, // Prevents post-submit tracking

        init: function () {
            const savedStrikes = localStorage.getItem('kasu_strike_count');
            this.strikeCount = savedStrikes !== null ? parseInt(savedStrikes, 10) : 0;
            
            if (isNaN(this.strikeCount)) {
                this.strikeCount = 0;
            }

            // Check if this session was already terminated
            if (localStorage.getItem('kasu_session_terminated') === 'true') {
                this.isTerminated = true;
            }

            this.updateUI();
        },

        updateUI: function () {
            const display = document.getElementById('strikeCountDisplay');
            const container = document.getElementById('strikeCounterBox');

            if (display) {
                display.innerText = `${this.strikeCount} / ${this.maxStrikes}`;
            }

            if (container) {
                if (this.strikeCount > 0) {
                    container.style.display = 'block';
                } else {
                    container.style.display = 'none';
                }
            }
        },

        incrementStrike: function () {
            if (this.isTerminated) return;

            this.strikeCount = parseInt(this.strikeCount, 10) + 1;
            localStorage.setItem('kasu_strike_count', this.strikeCount.toString());
            this.updateUI();

            console.warn(`⚠️ Security Strike recorded: Total = ${this.strikeCount} / ${this.maxStrikes}`);

            if (this.strikeCount >= this.maxStrikes) {
                console.error("🚨 Maximum violation strikes reached! Triggering auto-submit...");
                this.terminateSession();

                if (typeof window.handleSubmit === 'function') {
                    window.handleSubmit();
                } else {
                    console.error("❌ handleSubmit function is not defined in global window scope.");
                }
            }
        },

        terminateSession: function () {
            this.isTerminated = true;
            localStorage.setItem('kasu_session_terminated', 'true');

            // Terminate background vision detection loop if active
            if (window.FaceMonitor && typeof window.FaceMonitor.stop === 'function') {
                window.FaceMonitor.stop();
                console.log("🛑 FaceMonitor stream & detection loop halted.");
            }

            // Unbind browser security event listeners if active
            if (window.BrowserSecurity && typeof window.BrowserSecurity.detach === 'function') {
                window.BrowserSecurity.detach();
                console.log("🛑 Browser security enforcement listeners detached.");
            }
        },

        resetSession: function () {
            this.strikeCount = 0;
            this.isTerminated = false;
            this.isProcessing = false;

            localStorage.removeItem('kasu_strike_count');
            localStorage.removeItem('kasu_session_terminated');
            
            // Generate a fresh session ID for testing
            const newSessionId = 'SESSION_' + Date.now();
            localStorage.setItem('sessionId', newSessionId);

            this.updateUI();
            console.log(`🔄 Session reset complete. New Session ID generated: ${newSessionId}`);
        },

        report: async function (violationData) {
            // Guard 1: Ignore any further events after session auto-submits/terminates
            if (this.isTerminated) {
                console.warn("🚫 Violation ignored: Session is already terminated.");
                return;
            }

            // Guard 2: Throttling cool-down buffer (1 second)
            if (this.isProcessing) {
                console.warn("⏳ Violation event throttled to prevent duplicate strike increments.");
                return;
            }

            this.isProcessing = true;
            setTimeout(() => { this.isProcessing = false; }, 1000);

            // 1. Increment local strike count
            this.incrementStrike();

            // 2. Build payload with active candidate and session state
            const candidateId = localStorage.getItem('candidateId') || 'DEMO_CANDIDATE_001';
            const sessionId = localStorage.getItem('sessionId') || 'DEMO_SESSION_999';

            const payload = {
                candidateId: candidateId,
                sessionId: sessionId,
                candidate: candidateId,
                session: sessionId,
                type: violationData.type,
                confidence: violationData.confidence || 1.0,
                description: violationData.description || 'Integrity anomaly detected',
                screenshot: violationData.screenshot || null,
                screenshotUrl: violationData.screenshot || null,
                persistenceDuration: violationData.persistenceDuration || 0,
                timestamp: new Date().toISOString()
            };

            console.log(`📡 Dispatching proctor event [${payload.type}] to backend...`);

            try {
                const response = await fetch('http://localhost:5000/api/violations', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    throw new Error(`HTTP network pipeline error status code returned: ${response.status}`);
                }

                const resData = await response.json();
                console.log('✅ Violation recorded on server:', resData);

            } catch (err) {
                console.error(`❌ Violations Engine sync error: ${err.message}`);
                
                let queue = JSON.parse(localStorage.getItem('kasu_offline_violations') || '[]');
                queue.push(payload);
                localStorage.setItem('kasu_offline_violations', JSON.stringify(queue));
                console.warn('📥 Infraction queued into secondary local memory block.');
            }
        }
    };

    document.addEventListener("DOMContentLoaded", () => {
        ViolationsEngine.init();
    });

    window.ViolationsEngine = ViolationsEngine;
})(window);