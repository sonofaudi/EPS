// client/js/student/exam.js
import { globalWarmupProctorAI, executeProctorFrameAnalysis } from '../monitor/faceMonitor.js';

// Global references for this candidate's tracking session
let currentSessionToken = "MOCK_SESSION";
let currentMatricNumber = "FETCHING..."; 

/**
 * Parses query parameters from the browser window URL to extract active session tokens
 */
function initializeSessionContext() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('session');
    if (token) {
        currentSessionToken = token;
        console.log(`🎫 [EXAM INITIALIZER]: Active Session Token Extracted: ${currentSessionToken}`);
    }
}

/**
 * Requests hardware access, handles the browser stream, and binds it to the UI container
 */
async function bootWebcamFeed() {
    const videoElement = document.getElementById('webcam-feed');
    
    if (!videoElement) {
        console.error("❌ [EXAM FRONTEND]: Target HTML video container element '#webcam-feed' not found.");
        return false;
    }

    try {
        console.log("🎥 [EXAM FRONTEND]: Initializing local video stream capture channels...");
        const mediaStream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 640 },
                height: { ideal: 480 },
                facingMode: "user"
            },
            audio: false
        });
        
        videoElement.srcObject = mediaStream;
        
        // Update connection banner text once camera hardware wakes up
        const connectionAlert = findStatusAlertElement();
        if (connectionAlert) {
            connectionAlert.style.backgroundColor = "#d1e7dd";
            connectionAlert.style.color = "#0f5132";
            connectionAlert.innerText = "🛡️ System Fully Secured & Active";
        }

        return true;
    } catch (streamError) {
        console.error("❌ [EXAM FRONTEND]: Webcam hardware allocation blocked or unavailable:", streamError);
        alert("Camera Access Required: This exam environment requires an active, uninterrupted video stream to continue.");
        return false;
    }
}

/**
 * Safe utility to locate the status box in your layout dynamically
 */
function findStatusAlertElement() {
    const divs = document.getElementsByTagName('div');
    for (let i = 0; i < divs.length; i++) {
        if (divs[i].innerText.includes('Waiting for Reconnection...')) {
            return divs[i];
        }
    }
    return null;
}

/**
 * Resolves candidate background properties dynamically from the verification database
 */
async function fetchCandidateProfile() {
    try {
        const response = await fetch(`/api/auth/session/validate/${currentSessionToken}`);
        const data = await response.json();
        if (data.success && data.candidate) {
            currentMatricNumber = data.candidate.matricNumber;
            console.log(`👤 [EXAM FRONTEND]: Verified Candidate Identity: ${currentMatricNumber}`);
        }
    } catch (err) {
        console.error("❌ [EXAM FRONTEND]: Failed to fetch student profile metadata:", err);
    }
}

/**
 * Periodic side-channel frame uploader to stream background snapshots back to server storage
 */
function startLiveTelemetryStreaming(videoElement) {
    const hiddenCanvas = document.createElement('canvas');
    hiddenCanvas.width = 320;
    hiddenCanvas.height = 240;
    const ctx = hiddenCanvas.getContext('2d');

    setInterval(async () => {
        if (!videoElement || videoElement.paused || videoElement.ended) return;

        try {
            ctx.drawImage(videoElement, 0, 0, hiddenCanvas.width, hiddenCanvas.height);
            const base64Frame = hiddenCanvas.toDataURL('image/jpeg', 0.6);

            await fetch('/api/auth/proctor/frame', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    frame: base64Frame,
                    matricNumber: currentMatricNumber,
                    sessionToken: currentSessionToken
                })
            });
        } catch (telemetryErr) {
            console.error("⚠️ [TELEMETRY ENGINE]: Frame upload step dropped:", telemetryErr);
        }
    }, 5000);
}

/**
 * Master Execution Entrypoint
 */
async function startExamEnvironmentPipeline() {
    initializeSessionContext();
    await fetchCandidateProfile();

    const modelsWarmedUp = await globalWarmupProctorAI();
    if (!modelsWarmedUp) {
        console.error("❌ [CRITICAL]: AI processing models failed compilation steps. Aborting loop.");
        return;
    }

    const streamActive = await bootWebcamFeed();
    if (!streamActive) return;

    const videoFeed = document.getElementById('webcam-feed');
    startLiveTelemetryStreaming(videoFeed);

    console.log("🚀 [PROCTOR CORE]: Integrity monitoring grid actively engaged.");
    setInterval(async () => {
        await executeProctorFrameAnalysis(videoFeed, currentMatricNumber, currentSessionToken);
    }, 3000);
}

window.addEventListener('DOMContentLoaded', startExamEnvironmentPipeline);