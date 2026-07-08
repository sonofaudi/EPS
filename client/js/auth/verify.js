/**
 * KASU EPS — Student Session Verification & Profile Loader Matrix
 */
document.addEventListener('DOMContentLoaded', () => {
    let localStream = null;
    const sessionBadge = document.getElementById('session-badge');
    const errorBox = document.getElementById('status-error-box');
    const launchExamBtn = document.getElementById('launchExamBtn'); 

    // Target structural profile elements
    const identityCard = document.getElementById('identity-card');
    const lblName = document.getElementById('lbl-name');
    const lblMatric = document.getElementById('lbl-matric');
    const lblDept = document.getElementById('lbl-dept');
    const lblLevel = document.getElementById('lbl-level');
    const lblExam = document.getElementById('lbl-exam');

    // 1. Extract Token Identifier securely out from active URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const sessionToken = urlParams.get('session');

    if (!sessionToken) {
        showGlobalError("Critical Session Reference Token Missing. Please re-authenticate via the login portal.");
        return;
    }

    if (sessionBadge) {
        sessionBadge.innerText = `Session Token: ${sessionToken}`;
    }
    sessionStorage.setItem('activeSessionToken', sessionToken);

    // 2. Query validation state records out from background server matrices
    fetch(`/api/auth/session/validate/${sessionToken}`)
        .then(async (res) => {
            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.message || "Session verification rejected by proctoring gate.");
            }
            populateCandidateProfile(data.candidate);
        })
        .catch((err) => {
            console.error("Session Validation Failure:", err);
            showGlobalError(err.message);
        });

    /**
     * Defensive Check Binding: Safely map backend payloads onto present DOM elements
     */
    function populateCandidateProfile(candidate) {
        if (!candidate) return;

        if (lblName)  lblName.innerText  = candidate.fullName || "N/A";
        if (lblMatric) lblMatric.innerText = candidate.matricNumber || "N/A";
        if (lblDept)   lblDept.innerText   = candidate.department || "Computer Science";
        if (lblLevel)  lblLevel.innerText  = candidate.level ? `${candidate.level}L` : "400L";
        if (lblExam)   lblExam.innerText   = candidate.targetExam || "KASU Institutional Assessment Space";

        // Store identity indices for backend telemetry references
        sessionStorage.setItem('matricNumber', candidate.matricNumber);
    }

    /**
     * Intercepts the click action on 'Proceed to Identity Lock' 
     * Handles UI phase visibility modifications defensively
     */
    if (launchExamBtn) {
        launchExamBtn.addEventListener('click', () => {
            // Hide Checklist block safely
            const checklistCard = document.querySelector('.checklist-card');
            if (checklistCard) {
                checklistCard.style.display = 'none';
            }

            // Reveal Populated Candidate Information Layout Block inside Step 1
            if (identityCard) {
                identityCard.style.display = 'block';
            }

            // Extract the webcam track out from the System Check global environment context
            const webcamVideo = document.getElementById('webcam-feed');
            if (webcamVideo && webcamVideo.srcObject) {
                localStream = webcamVideo.srcObject;
                
                // Pass control flow straight to Step 1 of the structural capture pipeline wizard
                if (typeof initializeProctoringWizard === 'function') {
                    initializeProctoringWizard(localStream);
                } else {
                    console.error("Critical Failure: proctor-capture.js wizard functions failed to mount into active memory space.");
                }
            } else {
                alert("Hardware Pipeline Error: Live webcam context handle lost. Please rerun system diagnostic checks.");
            }
        });
    }

    function showGlobalError(msg) {
        if (errorBox) {
            errorBox.innerHTML = `❌ ${msg}`;
            errorBox.style.display = 'block';
        }
    }
});