// Verification DOM References
const sessionBadge = document.getElementById('session-badge');
const errorBox = document.getElementById('status-error-box');
const cameraOverlay = document.getElementById('camera-overlay');
const videoElement = document.getElementById('webcam-feed');
const identityCard = document.getElementById('identity-card');
const primaryBtn = document.getElementById('initiate-capture-btn');

// Student Profile Display Elements
const lblName = document.getElementById('lbl-name');
const lblMatric = document.getElementById('lbl-matric');
const lblDept = document.getElementById('lbl-dept');
const lblLevel = document.getElementById('lbl-level');
const lblExam = document.getElementById('lbl-exam');

let currentActiveStream = null;

/**
 * PHASE 2.1: Extract and Interrogate Session Token State Rule Requirements
 */
function initializeVerificationGate() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('session');

    if (!token) {
        displayTerminalError("Missing Secure Session Context Token. Redirecting to initialization access portal...");
        setTimeout(() => { window.location.href = "login.html"; }, 3500);
        return;
    }

    sessionBadge.innerText = `Session Token: ${token}`;

    // Verify token validation context dynamically against Mongoose Data Engine
    fetch(`/api/auth/session/validate/${token}`)
        .then(async (response) => {
            const data = await response.json();
            if (response.ok && data.success) {
                populateStudentProfile(data.student);
                // Token authenticated. Advance seamlessly into Phase 2.2 Hardware Capture
                activateWebcamPipeline();
            } else {
                displayTerminalError(data.message || "Session verification token has expired or is invalid.");
                setTimeout(() => { window.location.href = "login.html"; }, 4000);
            }
        })
        .catch(() => {
            displayTerminalError("System communication latency failure. Verification engine halted.");
        });
}

function populateStudentProfile(student) {
    lblName.innerText = student.fullName;
    lblMatric.innerText = student.matricNumber;
    lblDept.innerText = `${student.faculty} / ${student.department}`;
    lblLevel.innerText = `${student.level} Level`;
    lblExam.innerText = student.examId;
    identityCard.style.display = "block";
}

/**
 * PHASE 2.2: Establish Asynchronous Media Devices Capture Engine Framework
 */
async function activateWebcamPipeline() {
    cameraOverlay.innerText = "⏳ Requesting hardware camera feed access authorization...";
    
    const operationalConstraints = {
        video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: "user" // Enforces operational webcam tracking orientation selector
        },
        audio: false // Keeps processing thread context entirely lightweight
    };

    try {
        currentActiveStream = await navigator.mediaDevices.getUserMedia(operationalConstraints);
        videoElement.srcObject = currentActiveStream;
        
        // Remove tracking blocking layer once feed initialization locks smoothly
        videoElement.onloadedmetadata = () => {
            cameraOverlay.style.display = "none";
            primaryBtn.disabled = false;
            primaryBtn.innerHTML = "Proceed to Environmental Scan";
            console.log("Phase 2.2: Hardware Capture Channel Stream Locked Successfully.");
        };

    } catch (hardwareError) {
        console.error("Hardware Capture Controller Failure:", hardwareError);
        handleCameraAccessError(hardwareError);
    }
}

function handleCameraAccessError(err) {
    let actionableFeedback = "Unable to start secure proctoring webcam interface.";
    
    if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        actionableFeedback = "❌ Camera Access Denied. KASU Exam Proctoring protocols strictly mandate active system hardware access to proceed.";
    } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        actionableFeedback = "❌ No functional hardware camera module detected connected to this machine console configuration.";
    }
    
    cameraOverlay.innerHTML = `<span style="color:#ff8888; padding: 20px; text-align:center;">${actionableFeedback}</span>`;
    displayTerminalError(`${actionableFeedback} Please fix hardware layer adjustments and refresh interface context.`);
    primaryBtn.innerHTML = "🔒 Verification Pipeline Blocked";
    primaryBtn.disabled = true;
}

function displayTerminalError(msg) {
    errorBox.innerHTML = msg;
    errorBox.style.display = "block";
}

// Execute Init sequence processing pipeline automatically upon asset delivery load bind
window.addEventListener('DOMContentLoaded', initializeVerificationGate);