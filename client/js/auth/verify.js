/**
 * KASU AI-Proctor | Secure Student Verification & Diagnostics Engine
 * Location: /js/student/verify.js
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log("🚀 KASU Gatekeeper Safe Loader Initialized.");
    
    // 1. Run the safe UI parser to update candidate details
    initSessionDetails();

    // 2. Safely lock down the enter button visually and functionally on load
    lockExamButtonPermanently();

    // 3. Find your "Run System Diagnostics" button and force-bind the click event
    bindDiagnosticsButton();
});

/**
 * Hard-locks the button on page load so it cannot be bypassed
 */
function lockExamButtonPermanently() {
    const enterExamBtn = document.getElementById('enterExamBtn');
    if (enterExamBtn) {
        enterExamBtn.setAttribute('disabled', 'true');
        enterExamBtn.disabled = true;
        enterExamBtn.style.cssText = `
            width: 100% !important;
            background: #d1d5db !important; /* Dull grey */
            color: #9ca3af !important;
            cursor: not-allowed !important;
            opacity: 0.6 !important;
            pointer-events: none !important;
        `;
        enterExamBtn.onclick = null;
    }
}

/**
 * Robustly binds the diagnostic run
 */
function bindDiagnosticsButton() {
    let diagBtn = document.getElementById('runDiagnosticsBtn') || 
                  document.querySelector('button[onclick*="Diagnostics"]') || 
                  document.querySelector('.btn-primary');

    if (!diagBtn) {
        const buttons = document.querySelectorAll('button');
        buttons.forEach(btn => {
            if (btn.textContent.includes('Diagnostics') || btn.textContent.includes('Run System')) {
                diagBtn = btn;
            }
        });
    }

    if (diagBtn) {
        console.log("🎯 Successfully bound click listener to 'Run System Diagnostics' button.");
        diagBtn.addEventListener('click', (e) => {
            e.preventDefault();
            runDiagnosticsPipeline();
        });
    }
}

/**
 * Run REAL Hardware Diagnostics
 * Will fail and alert if camera/mic permissions are denied!
 */
async function runDiagnosticsPipeline() {
    console.log("⚙️ Starting Hardware Diagnostics...");

    try {
        // Request actual camera and microphone streams from the browser
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        
        console.log("✅ Hardware Permissions Granted.");
        
        // Find the video feed element and attach the stream so the student sees themselves
        const videoFeed = document.querySelector('video') || document.getElementById('webcamFeed');
        if (videoFeed) {
            videoFeed.srcObject = stream;
            videoFeed.play();
        }

        // Hardware is verified! It is safe to unlock the exam button.
        unlockSecureExam();

    } catch (error) {
        console.error("❌ Hardware Diagnostics Failed:", error);
        
        // Detain the student and display a clear warning
        alert("🔒 ACCESS DENIED: You must permit Camera and Microphone access to proceed to the exam.");
        
        // Keep the button heavily locked
        lockExamButtonPermanently();
    }
}
window.runDiagnosticsPipeline = runDiagnosticsPipeline;

/**
 * Unlocks the "Initialize Secure Exam" button and visually transitions it to active green
 */
function unlockSecureExam() {
    const enterExamBtn = document.getElementById('enterExamBtn');
    
    if (enterExamBtn) {
        console.log("🔓 Unlocking Secure Exam Button!");
        
        // 1. Remove physical disabled attributes
        enterExamBtn.removeAttribute('disabled');
        enterExamBtn.disabled = false;
        
        // 2. Force CSS layout override to make it green and clickable
        enterExamBtn.style.cssText = `
            width: 100% !important;
            background: #22c55e !important; /* Vibrant Active Green */
            color: #ffffff !important;
            cursor: pointer !important;
            opacity: 1 !important;
            pointer-events: auto !important;
            font-weight: bold !important;
            box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4) !important;
            transition: all 0.2s ease-in-out !important;
        `;

        // Hover animations
        enterExamBtn.onmouseover = () => {
            enterExamBtn.style.background = '#16a34a';
        };
        enterExamBtn.onmouseout = () => {
            enterExamBtn.style.background = '#22c55e';
        };

        // 3. Set the active redirect URL
        enterExamBtn.onclick = () => {
            const urlParams = new URLSearchParams(window.location.search);
            const sessionId = urlParams.get('session') || 'EPS-1783816998229';
            window.location.href = `/student/exam.html?session=${sessionId}`;
        };
    }
}

/**
 * Safely fetches and updates candidate info
 */
async function initSessionDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session') || "EPS-1783816998229";

    let studentData = {
        fullName: "Glad Candidate",
        matricNo: "KASU22CSC1125",
        academicUnit: "Computer Science (400L)",
        assessment: "CSC 401: Advanced Software Engineering Mock Exam"
    };

    try {
        const response = await fetch(`/api/session/${sessionId}`);
        if (response.ok) {
            const data = await response.json();
            studentData.fullName = data.fullName || data.name || studentData.fullName;
            studentData.matricNo = data.matricNo || data.matricNumber || studentData.matricNo;
            studentData.academicUnit = data.academicUnit || data.department || studentData.academicUnit;
            studentData.assessment = data.assessment || data.examName || studentData.assessment;
        }
    } catch (error) {
        console.warn("⚠️ API offline/failed. Using safe local placeholders.", error);
    }

    updateUIByTextMatching(sessionId, studentData);
}

/**
 * Text node parser to clean up the UI data safely
 */
function updateUIByTextMatching(sessionId, student) {
    const textElements = document.querySelectorAll('p, span, h2, h3, h4, li, strong, b');

    textElements.forEach(el => {
        if (el.children.length > 0 && !el.textContent.includes('Loading...')) return;

        const text = el.textContent.trim();

        if (text.includes('Session Token:') && text.includes('Checking...')) {
            el.textContent = `Session Token: ${sessionId}`;
        }
        if (text.startsWith('Full Name:')) {
            el.innerHTML = `Full Name: ${student.fullName}`;
        }
        if (text.startsWith('Matric Number:')) {
            el.innerHTML = `Matric Number: ${student.matricNo}`;
        }
        if (text.startsWith('Academic Unit:')) {
            el.innerHTML = `Academic Unit: ${student.academicUnit}`;
        }
        if (text.startsWith('Assessment:')) {
            el.innerHTML = `Assessment: ${student.assessment}`;
        }
    });
}