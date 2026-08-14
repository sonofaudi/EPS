/**
 * KASU Proctoring System - Invigilator Dashboard Orchestration Engine
 * File Path: client/js/admin/dashboard.js
 */

// Global dashboard state
const state = {
    sessions: {}, // Keyed by session ID for O(1) real-time lookups
    stats: {
        activeStudents: 0,
        totalWarnings: 0,
        terminatedExams: 0
    }
};

// Elements cache
const DOM = {
    metricActiveCount: document.getElementById('metricActiveCount'),
    metricWarningCount: document.getElementById('metricWarningCount'),
    metricCriticalCount: document.getElementById('metricCriticalCount'),
    candidateGrid: document.getElementById('candidateGrid'),
    incidentStream: document.getElementById('incidentStream'),
    btnLogout: document.getElementById('btnLogout'),
    
    // Modal Elements
    evidenceModal: document.getElementById('evidenceModal'),
    modalCandidate: document.getElementById('modalCandidate'),
    modalType: document.getElementById('modalType'),
    modalConfidence: document.getElementById('modalConfidence'),
    modalEvidenceImage: document.getElementById('modalEvidenceImage'),
    closeModalBtn: document.querySelector('.close-modal')
};

// Ensure Socket.IO library is loaded (Add script tag in HTML head or let it fall back)
let socket;

/**
 * Initialize Dashboard
 */
document.addEventListener('DOMContentLoaded', async () => {
    setupSocketIO();
    await fetchInitialDashboardStats();
    await fetchActiveSessions();
    setupUIListeners();
});

/**
 * Configure Real-Time WebSocket Channel
 */
function setupSocketIO() {
    // Falls back to current window origin if socket.io client script is loaded globally
    if (typeof io !== 'undefined') {
        socket = io();
    } else {
        console.error("❌ Socket.IO client library not loaded. Dynamically importing...");
        // Fallback programmatic inject
        const script = document.createElement('script');
        script.src = "/socket.io/socket.io.js";
        script.onload = () => {
            socket = io();
            registerSocketEvents();
        };
        document.head.appendChild(script);
        return;
    }
    registerSocketEvents();
}

/**
 * Bind Socket Events to Real-Time Updates
 */
function registerSocketEvents() {
    // 1. Join Dashboard Channel
    socket.emit('join_admin_room');

    // 2. Listen for newly stored candidate violations
    socket.on('new_violation', (violation) => {
        console.log("📡 [Socket] New Violation Received:", violation);
        handleIncomingViolation(violation);
    });

    // 3. Listen for forced terminations
    socket.on('session_terminated', (terminatedSession) => {
        console.log("📡 [Socket] Remote Termination Verified:", terminatedSession);
        updateSessionState(terminatedSession);
    });
}

/**
 * Fetch baseline analytics metrics on load
 */
async function fetchInitialDashboardStats() {
    try {
        const response = await fetch('/api/admin/dashboard-summary');
        const result = await response.json();
        
        if (result.success) {
            state.stats.activeStudents = result.stats.activeStudents;
            state.stats.terminatedExams = result.stats.terminatedExams;
            // Total violations accumulated globally as proxy for warnings
            state.stats.totalWarnings = result.stats.totalViolations;
            updateMetricCounters();
        }
    } catch (err) {
        console.error("❌ Could not fetch initial dashboard stats:", err);
    }
}

/**
 * Fetch and render all current active exam sessions
 */
async function fetchActiveSessions() {
    try {
        const response = await fetch('/api/admin/sessions');
        const result = await response.json();

        if (result.success && result.data.length > 0) {
            DOM.candidateGrid.innerHTML = ''; // Clear placeholder
            result.data.forEach(session => {
                state.sessions[session.sessionId] = session;
                renderCandidateCard(session);
            });
        }
    } catch (err) {
        console.error("❌ Could not fetch active sessions:", err);
    }
}

/**
 * Live updates UI counters
 */
function updateMetricCounters() {
    DOM.metricActiveCount.textContent = state.stats.activeStudents;
    DOM.metricWarningCount.textContent = state.stats.totalWarnings;
    DOM.metricCriticalCount.textContent = state.stats.terminatedExams;
}

/**
 * Render individual grid card for an active candidate
 */
function renderCandidateCard(session) {
    const student = session.studentId || {};
    const cardId = `card_${session.sessionId}`;
    
    // Check if element exists to avoid duplicating grid spaces
    let card = document.getElementById(cardId);
    const isNew = !card;

    if (isNew) {
        card = document.createElement('div');
        card.id = cardId;
        card.className = 'candidate-card';
    }

    // Determine status text & theme modifier
    let statusClass = 'status-active';
    let statusLabel = 'ACTIVE EXAM';
    
    if (session.status === 'flagged_terminated') {
        statusClass = 'status-terminated';
        statusLabel = 'KICKED / TERMINATED';
    } else if (session.status === 'completed') {
        statusClass = 'status-completed';
        statusLabel = 'COMPLETED';
    } else if (session.status === 'pending_identity') {
        statusClass = 'status-pending';
        statusLabel = 'IDENTITY CHECK';
    }

    card.className = `candidate-card ${statusClass}`;
    card.innerHTML = `
        <div class="card-header">
            <span class="status-indicator">${statusLabel}</span>
            <span class="violation-badge">${session.violationsCount || 0} Strikes</span>
        </div>
        <div class="card-body">
            <h4>${student.fullName || 'Unknown Student'}</h4>
            <p class="matric-num">${student.matricNumber || 'N/A'}</p>
            <p class="meta-field"><strong>Course:</strong> ${student.examId || 'Unscheduled'}</p>
            <p class="meta-field"><strong>Risk Score:</strong> ${session.riskScore || 0}%</p>
        </div>
        <div class="card-footer">
            ${session.status !== 'flagged_terminated' && session.status !== 'completed' 
                ? `<button class="btn-terminate" onclick="terminateSession('${session.sessionId}')">Remote Terminate</button>`
                : `<span class="session-end-time">Session Concluded</span>`
            }
        </div>
    `;

    if (isNew) {
        DOM.candidateGrid.appendChild(card);
    }
}

/**
 * Handle incoming violations pushed from Socket.IO
 */
function handleIncomingViolation(violation) {
    // 1. Increment total warning metrics
    state.stats.totalWarnings++;
    updateMetricCounters();

    // 2. Parse telemetry information safely
    const candidateName = violation.candidate?.fullName || 'Unknown';
    const matricNumber = violation.candidate?.matricNumber || 'N/A';
    const typeClean = violation.type.toUpperCase().replace('_', ' ');
    const confidencePct = `${Math.round(violation.confidence * 100)}%`;
    const formattedTime = new Date(violation.timestamp).toLocaleTimeString();

    // 3. Update internal local state & candidate UI card 
    const targetSession = violation.session;
    if (targetSession) {
        const sid = typeof targetSession === 'string' ? targetSession : targetSession._id;
        // Lookup by ID or find dynamically in state
        const localSession = Object.values(state.sessions).find(s => s._id === sid);
        if (localSession) {
            localSession.violationsCount = (localSession.violationsCount || 0) + 1;
            renderCandidateCard(localSession);
        }
    }

    // 4. Remove live stream placeholder if first incident occurs
    const placeholder = DOM.incidentStream.querySelector('.stream-placeholder');
    if (placeholder) {
        DOM.incidentStream.innerHTML = '';
    }

    // 5. Append dynamic alert item to dashboard feed
    const incidentItem = document.createElement('div');
    incidentItem.className = 'incident-item';
    incidentItem.innerHTML = `
        <div class="incident-header">
            <span class="incident-time">${formattedTime}</span>
            <span class="incident-badge">${typeClean}</span>
        </div>
        <div class="incident-body">
            <p><strong>${candidateName}</strong> (${matricNumber})</p>
            <p class="desc">${violation.description}</p>
        </div>
        <div class="incident-actions">
            <span>Confidence: ${confidencePct}</span>
            ${violation.screenshotUrl 
                ? `<button class="btn-view-evidence" onclick="showEvidence('${candidateName}', '${typeClean}', '${confidencePct}', '${violation.screenshotUrl}')">View Frame Evidence</button>` 
                : '<span class="no-evidence">No snapshot</span>'
            }
        </div>
    `;

    // Prepend to show most recent incident first
    DOM.incidentStream.insertBefore(incidentItem, DOM.incidentStream.firstChild);
}

/**
 * Remote Trigger to Force Shutdown on Candidate Session
 */
window.terminateSession = async function(sessionId) {
    const confirmation = confirm(`⚠️ Are you absolutely sure you want to FORCE TERMINATE session: ${sessionId}? This immediately locks the student out of the examination.`);
    if (!confirmation) return;

    try {
        const response = await fetch(`/api/admin/session/terminate/${sessionId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        const result = await response.json();

        if (result.success) {
            console.log(`🔒 Session ${sessionId} marked as flagged_terminated`);
            alert("Lockdown termination payload successfully propagated.");
        } else {
            alert(`Error: ${result.message}`);
        }
    } catch (err) {
        console.error("❌ Network error executing termination sequence:", err);
    }
};

/**
 * Remote Session State Updates handler
 */
function updateSessionState(updatedSession) {
    // Overwrite baseline memory mapping
    state.sessions[updatedSession.sessionId] = updatedSession;
    
    // Increment critical metric and lower active metric dynamically
    state.stats.terminatedExams++;
    if (state.stats.activeStudents > 0) state.stats.activeStudents--;
    
    updateMetricCounters();
    renderCandidateCard(updatedSession);
}

/**
 * Display Evidence Overlay Modal
 */
window.showEvidence = function(candidate, type, confidence, imgUrl) {
    DOM.modalCandidate.textContent = candidate;
    DOM.modalType.textContent = type;
    DOM.modalConfidence.textContent = confidence;
    DOM.modalEvidenceImage.src = imgUrl;
    
    DOM.evidenceModal.classList.add('is-active');
};

/**
 * Wire basic layout and system buttons
 */
function setupUIListeners() {
    // Close Modal Button
    DOM.closeModalBtn.addEventListener('click', () => {
        DOM.evidenceModal.classList.remove('is-active');
        DOM.modalEvidenceImage.src = ''; // Flush visual stream cache
    });

    // Close Modal if clicking backdrop blur frame
    window.addEventListener('click', (e) => {
        if (e.target === DOM.evidenceModal) {
            DOM.evidenceModal.classList.remove('is-active');
            DOM.modalEvidenceImage.src = '';
        }
    });

    // Sign Out Hook
    DOM.btnLogout.addEventListener('click', () => {
        if (confirm("Are you sure you want to exit the Invigilator Dashboard?")) {
            window.location.href = '../admin/login.html'; // Adjust based on your admin routes
        }
    });
}