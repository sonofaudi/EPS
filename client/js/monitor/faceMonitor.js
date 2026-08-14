/**
 * KASU Proctoring System - AI Vision & Anomaly Engine
 * File Path: client/js/monitor/faceMonitor.js
 */

const FaceMonitor = {
    // Configuration Settings
    config: {
        fps: 12,
        videoElementId: 'proctorFeed',
        canvasElementId: 'proctorCanvas',
        reportCooldownMs: 5000,
        prohibitedItems: ["cell phone", "book", "laptop", "tablet", "paper"]
    },

    // Internal State Tracker
    state: {
        model: null,
        isPreloaded: false,
        isLoading: false,
        intervalId: null,
        lastReportTime: {},
        persistence: {
            faceMissing: 0,
            multipleFaces: 0,
            contraband: 0
        }
    },

    /**
     * Pre-loads the COCO-SSD TensorFlow model into browser RAM
     * and performs a 1-pixel GPU shader warmup to eliminate startup lag.
     */
    async preload() {
        if (this.state.isPreloaded || this.state.isLoading) return;

        try {
            this.state.isLoading = true;
            console.log("⏳ [FaceMonitor] Pre-loading COCO-SSD Vision Model (mobilenet_v2)...");

            // Load model using MobileNet V2 for higher accuracy and light execution footprint
            this.state.model = await cocoSsd.load({ base: 'mobilenet_v2' });

            // GPU Shader Warmup: Execute 1-pixel dummy frame detection to compile WebGL shaders early
            console.log("🔥 [FaceMonitor] Executing GPU WebGL shader warmup...");
            const dummyCanvas = document.createElement('canvas');
            dummyCanvas.width = 1;
            dummyCanvas.height = 1;
            await this.state.model.detect(dummyCanvas);

            this.state.isPreloaded = true;
            this.state.isLoading = false;
            console.log("✅ [FaceMonitor] Vision Model pre-loaded & GPU warmed up for instant startup.");

        } catch (err) {
            this.state.isLoading = false;
            console.error("❌ [FaceMonitor] Vision model pre-loading failed:", err);
        }
    },

    /**
     * Starts continuous vision monitoring and bounding-box rendering loop
     */
    async start() {
        const video = document.getElementById(this.config.videoElementId);
        const canvas = document.getElementById(this.config.canvasElementId);

        if (!video || !canvas) {
            console.error(`❌ [FaceMonitor] Missing DOM targets: #${this.config.videoElementId} or #${this.config.canvasElementId}`);
            return;
        }

        try {
            // Load model now if it wasn't pre-loaded during pre-exam setup
            if (!this.state.model) {
                await this.preload();
            }

            // Halt any existing interval before starting a new one
            this.stop();

            const ctx = canvas.getContext('2d');
            const interval = 1000 / this.config.fps;

            console.log("🟢 [FaceMonitor] Launching real-time detection & bounding box render loop...");

            this.state.intervalId = setInterval(async () => {
                if (video.readyState === video.HAVE_ENOUGH_DATA) {
                    // Keep canvas dimensions strictly in sync with source video resolution
                    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
                        canvas.width = video.videoWidth;
                        canvas.height = video.videoHeight;
                    }
                    await this._processFrame(video, canvas, ctx);
                }
            }, interval);

        } catch (err) {
            console.error("❌ [FaceMonitor] Failed to start vision tracking loop:", err);
        }
    },

    /**
     * Halts continuous detection loop and clears overlay canvas
     */
    stop() {
        if (this.state.intervalId) {
            clearInterval(this.state.intervalId);
            this.state.intervalId = null;
            console.log("⏹️ [FaceMonitor] Vision tracking loop halted.");
        }

        const canvas = document.getElementById(this.config.canvasElementId);
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    },

    /**
     * Analyzes individual frame, draws real-time overlays, and tracks violation persistence
     */
    async _processFrame(video, canvas, ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Execute object detection
        const predictions = await this.state.model.detect(video);

        let personCount = 0;
        let detectedContraband = [];
        let highestConfidence = 0;

        predictions.forEach(p => {
            if (p.class === "person") personCount++;

            if (this.config.prohibitedItems.includes(p.class)) {
                detectedContraband.push(p.class);
                if (p.score > highestConfidence) highestConfidence = p.score;
            }

            // Draw real-time tracking bounding box and label overlay
            const isViolation = this.config.prohibitedItems.includes(p.class) || (p.class === "person" && personCount > 1);
            
            // Box styling
            ctx.strokeStyle = isViolation ? "#dc2626" : "#2563eb";
            ctx.lineWidth = 2;
            ctx.strokeRect(...p.bbox);

            // Label background tag
            const labelText = `${p.class.toUpperCase()} (${Math.round(p.score * 100)}%)`;
            ctx.font = "12px sans-serif";
            const textWidth = ctx.measureText(labelText).width;

            ctx.fillStyle = isViolation ? "#dc2626" : "#2563eb";
            ctx.fillRect(p.bbox[0], p.bbox[1] > 20 ? p.bbox[1] - 20 : p.bbox[1], textWidth + 10, 20);

            // Label text
            ctx.fillStyle = "#ffffff";
            ctx.fillText(labelText, p.bbox[0] + 5, p.bbox[1] > 20 ? p.bbox[1] - 5 : p.bbox[1] + 14);
        });

        // ----------------------------------------------------
        // PERSISTENCE EVALUATION
        // ----------------------------------------------------

        // A. Candidate Missing
        if (personCount === 0) {
            this.state.persistence.faceMissing++;
            const durationSec = Math.floor(this.state.persistence.faceMissing / this.config.fps);

            if (durationSec >= 2 && this._canReport('face_missing')) {
                this.emitProctorAnomaly(
                    'CANDIDATE_ABSENT',
                    0.95,
                    `Candidate absent from camera view for ${durationSec} seconds.`,
                    durationSec
                );
            }
        } else {
            this.state.persistence.faceMissing = 0;
        }

        // B. Multiple Individuals
        if (personCount > 1) {
            this.state.persistence.multipleFaces++;
            const durationSec = Math.floor(this.state.persistence.multipleFaces / this.config.fps);

            if (this._canReport('multiple_faces')) {
                this.emitProctorAnomaly(
                    'MULTIPLE_PEOPLE',
                    0.98,
                    `Multiple individuals (${personCount}) detected in view for ${durationSec} seconds.`,
                    durationSec
                );
            }
        } else {
            this.state.persistence.multipleFaces = 0;
        }

        // C. Contraband / Prohibited Objects
        if (detectedContraband.length > 0) {
            this.state.persistence.contraband++;
            const durationSec = Math.floor(this.state.persistence.contraband / this.config.fps);

            if (this._canReport('unauthorized_object')) {
                this.emitProctorAnomaly(
                    'CONTRABAND_DETECTED',
                    highestConfidence,
                    `Prohibited item(s) detected: [${detectedContraband.join(', ')}] for ${durationSec} seconds.`,
                    durationSec
                );
            }
        } else {
            this.state.persistence.contraband = 0;
        }
    },

    /**
     * Prevents alert spam by enforcing a per-event cooldown
     */
    _canReport(type) {
        const now = Date.now();
        if (!this.state.lastReportTime[type] || (now - this.state.lastReportTime[type]) > this.config.reportCooldownMs) {
            this.state.lastReportTime[type] = now;
            return true;
        }
        return false;
    },

    /**
     * Normalizes and reports detected anomalies to the central pipeline
     */
    emitProctorAnomaly(rawEventType, confidence, detailsText, persistence = 0) {
        const schemaType = window.AIViolationMapper?.normalizeType(rawEventType);
        
        if (!schemaType) {
            console.warn(`[AIVisionGuard] Event [${rawEventType}] rejected: No valid schema mapping.`);
            return;
        }

        const snapshot = window.ProctorCapture ? window.ProctorCapture.grabSnapshot(this.config.videoElementId) : null;

        window.ViolationsEngine?.report({
            type: schemaType,
            confidence: confidence,
            description: detailsText,
            persistenceDuration: persistence,
            screenshot: snapshot
        });
    }
};

window.FaceMonitor = FaceMonitor;