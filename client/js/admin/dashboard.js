document.addEventListener('DOMContentLoaded', () => {
    loadDashboardStats();
    loadRecentViolations();

    // Stage A Polling Fallbacks
    setInterval(loadDashboardStats, 5000);
    setInterval(loadRecentViolations, 3000);

    setupModalEvents();
});

async function loadDashboardStats() {
    try {
        const response = await fetch('/api/admin/dashboard-summary');
        if (!response.ok) return;

        const result = await response.json();
        if (!result.success) return;

        if (document.getElementById('metricActiveCount')) {
            document.getElementById('metricActiveCount').textContent = result.stats?.activeStudents || 0;
        }
        if (document.getElementById('metricWarningCount')) {
            document.getElementById('metricWarningCount').textContent = result.stats?.totalViolations || 0;
        }
        if (document.getElementById('metricCriticalCount')) {
            document.getElementById('metricCriticalCount').textContent = result.stats?.terminatedExams || 0;
        }
    } catch (error) {
        console.error('Stats polling error:', error);
    }
}

async function loadRecentViolations() {
    try {
        const response = await fetch('/api/admin/violations');
        if (!response.ok) return;

        const result = await response.json();
        if (!result.success) return;

        renderIncidentStream(result.data || []);
    } catch (error) {
        console.error('Incident stream error:', error);
    }
}

function formatViolationType(type) {
    return (type || 'VIOLATION').replace(/_/g, ' ').toUpperCase();
}

function escapeHtml(str) {
    return String(str || '').replace(/[&<>"']/g, (m) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    }[m]));
}

function renderIncidentStream(violations) {
    const container = document.getElementById('incidentStream');
    if (!container) return;

    if (!violations.length) {
        container.innerHTML = `<div class="stream-placeholder">No security incidents recorded.</div>`;
        return;
    }

    container.innerHTML = violations.map(v => {
        const candidateName = v.candidate?.fullName || v.candidate?.registrationNumber || 'Unknown Candidate';
        const confidence = Math.round((v.confidence || 0) * 100);
        const screenshot = v.screenshotUrl || '';
        const severity = (v.severity || 'medium').toLowerCase();

        return `
            <div class="incident-card severity-${severity}">
                <div class="incident-header">
                    <strong>${formatViolationType(v.type)}</strong>
                    <span class="severity-badge ${severity}">${severity.toUpperCase()}</span>
                </div>
                <div class="incident-body">
                    <p><strong>Candidate:</strong> ${escapeHtml(candidateName)}</p>
                    <p><strong>Confidence:</strong> ${confidence}%</p>
                    <p>${escapeHtml(v.description || '')}</p>
                    <small>${new Date(v.timestamp).toLocaleTimeString()}</small>
                </div>
                ${screenshot ? `
                    <button class="btn-evidence" data-evidence='${JSON.stringify({
                        candidate: candidateName,
                        type: v.type,
                        confidence,
                        screenshot
                    }).replace(/'/g, "&apos;")}'>VIEW EVIDENCE</button>
                ` : `
                    <span class="no-evidence">Evidence unavailable</span>
                `}
            </div>
        `;
    }).join('');

    // Attach click listeners to evidence buttons safely
    container.querySelectorAll('.btn-evidence').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const data = JSON.parse(e.currentTarget.getAttribute('data-evidence'));
            openEvidenceModal(data);
        });
    });
}

function openEvidenceModal(data) {
    const modal = document.getElementById('evidenceModal');
    if (!modal) return;

    if (document.getElementById('modalCandidate')) {
        document.getElementById('modalCandidate').textContent = data.candidate;
    }
    if (document.getElementById('modalType')) {
        document.getElementById('modalType').textContent = formatViolationType(data.type);
    }
    if (document.getElementById('modalConfidence')) {
        document.getElementById('modalConfidence').textContent = `${data.confidence}%`;
    }
    if (document.getElementById('modalEvidenceImage')) {
        document.getElementById('modalEvidenceImage').src = data.screenshot;
    }

    modal.style.display = 'flex';
}

function setupModalEvents() {
    const modal = document.getElementById('evidenceModal');
    const closeButton = document.querySelector('.close-modal');

    closeButton?.addEventListener('click', () => {
        if (modal) modal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event === modal) {
            modal.style.display = 'none';
        }
    });
}