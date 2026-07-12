// client/js/monitor/objectDetector.js
import { AI_CONFIG, reportViolation } from './violationEngine.js';

let cocoSsdModelInstance = null;

export async function loadObjectDetectorModel() {
    if (cocoSsdModelInstance) return cocoSsdModelInstance;
    
    if (typeof cocoSsd !== 'undefined') {
        cocoSsdModelInstance = await cocoSsd.load();
        return cocoSsdModelInstance;
    } else {
        throw new Error("COCO-SSD library missing from runtime scope.");
    }
}

export async function evaluateFrameObjects(videoElement, matricNumber, sessionToken) {
    if (!cocoSsdModelInstance) return;

    const predictions = await cocoSsdModelInstance.detect(videoElement);

    for (const prediction of predictions) {
        const { class: className, score } = prediction;

        if (className === 'cell phone' && score > AI_CONFIG.THRESHOLDS.phone) {
            await reportViolation({
                type: "CONTRABAND_DETECTED",
                description: `Mobile hardware verified within active tracking matrix.`,
                confidence: score,
                matricNumber,
                sessionToken
            });
        }

        if (className === 'book' && score > AI_CONFIG.THRESHOLDS.book) {
            await reportViolation({
                type: "BOOK_DETECTED",
                description: `Unauthorized reference materials/literature flagged by vision metrics.`,
                confidence: score,
                matricNumber,
                sessionToken
            });
        }
    }
}