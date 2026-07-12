// client/js/monitor/gazeTracker.js
import { AI_CONFIG } from './violationEngine.js';

let gazeAnomalyStreak = 0;

/**
 * Evaluates the 68-point facial landmarks layout to isolate head rotation deviation vectors.
 */
export function processGazeOrientation(landmarks) {
    const jawOutline = landmarks.getJawOutline();
    const noseBridge = landmarks.getNose();
    
    if (!jawOutline || !noseBridge || jawOutline.length < 17) return false;

    const leftJawEdge = jawOutline[0];
    const rightJawEdge = jawOutline[16];
    const noseTip = noseBridge[6]; 

    // --- YAW ESTIMATION ---
    const totalJawWidth = rightJawEdge.x - leftJawEdge.x;
    if (totalJawWidth === 0) return false;

    const noseOffsetFromLeft = noseTip.x - leftJawEdge.x;
    const symmetryRatio = noseOffsetFromLeft / totalJawWidth;
    const yawDeviation = Math.abs(symmetryRatio - 0.5);
    const estimatedYawDegrees = yawDeviation * 100; 

    // --- PITCH ESTIMATION ---
    const topOfNoseBridge = noseBridge[0];
    const noseBridgeLength = noseTip.y - topOfNoseBridge.y;
    if (noseBridgeLength === 0) return false;

    const leftEye = landmarks.getLeftEye()[0];
    const eyeNoseDistance = noseTip.y - leftEye.y;
    const pitchRatio = eyeNoseDistance / noseBridgeLength;

    let estimatedPitchDegrees = 0;
    if (pitchRatio < 1.1) estimatedPitchDegrees = (1.1 - pitchRatio) * 50; 
    if (pitchRatio > 1.6) estimatedPitchDegrees = (pitchRatio - 1.6) * 50; 

    const lookHorizontal = estimatedYawDegrees > AI_CONFIG.THRESHOLDS.yawLimit;
    const lookVertical = estimatedPitchDegrees > AI_CONFIG.THRESHOLDS.pitchLimit;

    if (lookHorizontal || lookVertical) {
        gazeAnomalyStreak++;
        if (gazeAnomalyStreak >= AI_CONFIG.THRESHOLDS.gazeStreakLimit) {
            return true;
        }
    } else {
        gazeAnomalyStreak = 0; 
    }

    return false;
}