// client/js/monitor/faceMonitor.js
import { AI_CONFIG, reportViolation } from './violationEngine.js';
import { processGazeOrientation } from './gazeTracker.js';
import { loadObjectDetectorModel, evaluateFrameObjects } from './objectDetector.js';

let modelsLoadedSuccessfully = false;

export async function globalWarmupProctorAI() {
    if (modelsLoadedSuccessfully) {
        console.log("🤖 [PROCTOR AI]: Models already warmed up in application scope memory.");
        return true;
    }

    try {
        console.log("🤖 [PROCTOR AI]: Commencing global AI engine memory caching...");
        
        await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
            faceapi.nets.faceLandmark68Net.loadFromUri('/models')
        ]);
        console.log("✓ [PROCTOR AI]: Face tracking models compiled in application memory.");

        await loadObjectDetectorModel();
        console.log("✓ [PROCTOR AI]: COCO-SSD object engine compiled in application memory.");

        modelsLoadedSuccessfully = true;
        return true;
    } catch (err) {
        console.error("❌ [PROCTOR AI]: Global pre-flight compilation crashed:", err);
        return false;
    }
}

export async function executeProctorFrameAnalysis(videoElement, matricNumber, sessionToken) {
    if (!modelsLoadedSuccessfully || !videoElement || videoElement.paused || videoElement.ended) return;

    try {
        const faceData = await faceapi.detectAllFaces(
            videoElement,
            new faceapi.TinyFaceDetectorOptions({ 
                inputSize: 224, 
                scoreThreshold: AI_CONFIG.THRESHOLDS.face 
            })
        ).withFaceLandmarks();

        const facesDetectedCount = faceData.length;

        if (facesDetectedCount === 0) {
            await reportViolation({
                type: "CANDIDATE_ABSENT",
                description: "Security scanning field indicates user is missing or leaving testing seat.",
                confidence: 1.0,
                matricNumber,
                sessionToken
            });
        } else if (facesDetectedCount > 1) {
            await reportViolation({
                type: "MULTIPLE_PEOPLE",
                description: `Multiple human facial constructs (${facesDetectedCount}) mapped in secure perimeter.`,
                confidence: 0.95,
                matricNumber,
                sessionToken
            });
        } else {
            const isLookingAway = processGazeOrientation(faceData[0].landmarks);
            if (isLookingAway) {
                await reportViolation({
                    type: "LOOKING_AWAY",
                    description: "Continuous tracking indices confirm student focus has broken off-screen angles.",
                    confidence: 0.85,
                    matricNumber,
                    sessionToken
                });
            }
        }

        await evaluateFrameObjects(videoElement, matricNumber, sessionToken);

    } catch (analysisException) {
        console.error("❌ [PROCTOR CONTROL]: Analysis iteration drop:", analysisException);
    }
}