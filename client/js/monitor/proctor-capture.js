/**
 * KASU EPS — Phase 4: Continuous Proctoring Monitoring Hub
 */

const secureInitializationZone = document.getElementById('secure-initialization-zone');
const enterExamBtn = document.getElementById('enterExamBtn');

function initializeEnvironmentScanStage() {
    console.log("🚀 Diagnostics passed. Secure Exam Initialization unblocked.");
    if (secureInitializationZone) secureInitializationZone.classList.remove('disabled');
    if (enterExamBtn) enterExamBtn.disabled = false;
}

/**
 * Handle Authorization Validation Transitions Safely
 */
function handleExamSandboxActivation() {
    if (enterExamBtn) {
        enterExamBtn.disabled = true;
        enterExamBtn.innerText = "🔒 Arming Security Grid...";
    }

    // Extract current token from URL string
    const urlParams = new URLSearchParams(window.location.search);
    const activeToken = urlParams.get('session') || `EPS-${Date.now()}`;

    // Clean handoff: Redirect WITHOUT initializing restrictions on this page
    window.location.href = `exam.html?session=${activeToken}`;
}

document.addEventListener('DOMContentLoaded', () => {
    if (enterExamBtn) {
        enterExamBtn.addEventListener('click', handleExamSandboxActivation);
    }
});