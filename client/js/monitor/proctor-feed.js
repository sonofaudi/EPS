/**
 * KASU EPS — Phase 5: Continuous Background Proctoring Hub
 * This script runs exclusively inside exam.html.
 */

const ContinuousMonitor = {
    localStream: null,
    monitorInterval: null,
    sessionToken: sessionStorage.getItem('activeSessionToken') || 'EPS-UNKNOWN',

    async init() {
        console.log("📡 Phase 5 Continuous Monitoring Hub: Waking up.");
        await this.startMediaReconnection();
        this.initializeBackgroundTelemetry();
    },

    /**
     * Reconnects the webcam hardware stream upon exam page load
     */
    async startMediaReconnection() {
        const proctorView = document.getElementById('proctorFeed');
        const proctorStatus = document.getElementById('proctorStatus');
        
        if (!proctorView) {
            console.error("Critical Error: Live proctor feed viewport missing from layout.");
            return;
        }

        try {
            // Requesting hardware access again. The browser should reuse the previous permission token.
            this.localStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true // Start audio capture immediately
            });
            
            // Map the stream matrix to the visual view tag (mirroring usually handled in CSS)
            proctorView.srcObject = this.localStream;
            
            if (proctorStatus) {
                proctorStatus.innerText = "✔ Live Monitoring Active";
                proctorStatus.style.background = "#dcfce7"; // Green status
                proctorStatus.style.color = "#166534";
            }
            console.log("✅ Webcam stream reactivated for examination space.");
        } catch (error) {
            console.error("Hardware pipeline failed to reconnect:", error);
            if (proctorStatus) {
                proctorStatus.innerText = "❌ MONITORING ERROR: Check Camera Permissions";
                proctorStatus.style.background = "#fee2e2"; // Red status
                proctorStatus.style.color = "#991b1b";
            }
            alert("❌ PROCTORING FAILURE:\n\nWe cannot verify your environment security parameters. Ensure your camera is active and refresh the page.");
        }
    },

    /**
     * Extracts current frame telemetry and dispatches to server pipelines
     */
    initializeBackgroundTelemetry() {
        console.log("📊 Starting background frame capture telemetry (Interval: 5s).");
        
        // Use a 5-second sampling interval for developmental performance balance
        this.monitorInterval = setInterval(() => {
            this.captureAndUploadFrame();
        }, 5000);
    },

    captureAndUploadFrame() {
        const videoView = document.getElementById('proctorFeed');
        if (!videoView || !this.localStream) return;

        // Verify video tracks are active before converting pixels
        if (!videoView.videoWidth) return;

        const canvas = document.createElement('canvas');
        canvas.width = videoView.videoWidth;
        canvas.height = videoView.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoView, 0, 0, canvas.width, canvas.height);
        
        // Convert to high-performance JPEG representation string
        const frameData = canvas.toDataURL('image/jpeg', 0.85);

        // POST snapshot matrix onto the backend proctoring grid endpoints
        this.transmitFramePayload(frameData);
    },

    async transmitFramePayload(frame) {
        // Build unique timestamp identifier
        const frameTimestamp = new Date().toISOString().replace(/:/g, '-').replace('T', '_').split('.')[0];
        
        try {
            // New endpoint specifically for periodic telemetry storage
            await fetch('/api/proctor/frame', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionToken: this.sessionToken,
                    matricNumber: sessionStorage.getItem('matricNumber') || 'EPS-TEMP',
                    timestamp: frameTimestamp,
                    image: frame // The base64 compressed pixels
                })
            });
            // (dev only console.log) console.log(`✓ Telemetry packet transmitted: ${frameTimestamp}`);
        } catch (err) {
            console.error("Critical Telemetry Transmission Crash:", err);
        }
    }
};

/**
 * Stop monitoring loop on navigation/submission to prevent leakages
 */
window.addEventListener('beforeunload', () => {
    if (ContinuousMonitor.monitorInterval) {
        clearInterval(ContinuousMonitor.monitorInterval);
        console.log("🛑 Continuous Monitoring Loop Terminated.");
    }
    // Safely drop hardware tracks
    if (ContinuousMonitor.localStream) {
        ContinuousMonitor.localStream.getTracks().forEach(track => track.stop());
    }
});

// On application setup / webcam activation sequence
await globalWarmupProctorAI();

// Running inside your periodic telemetry interval track (e.g., every 3 seconds)
setInterval(async () => {
    const video = document.getElementById("webcam-feed");
    await executeProctorFrameAnalysis(video, currentMatricNumber, currentSessionToken);
}, 3000);