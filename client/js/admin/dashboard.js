/**
 * KASU Proctoring System - Admin Dashboard Client Controller
 * File Path: server/public/admin/js/dashboard.js
 */

document.addEventListener('DOMContentLoaded', () => {
    fetchViolations();
    
    // Poll the backend every 5 seconds for real-time violation updates
    setInterval(fetchViolations, 5000);
});

async function fetchViolations() {
    const severity = document.getElementById('severityFilter').value;
    const type = document.getElementById('typeFilter').value;

    let url = '/api/v1/admin/violations?';
    const params = [];
    if (severity) params.push(`severity=${severity}`);
    if (type) params.push(`type=${type}`);
    
    if (params.length > 0) {
        url += params.join('&');
    }

    try {
        const res = await fetch(url);
        const data = await res.json();

        if (data.success) {
            updateStats(data.stats);
            renderTable(data.violations);
        }
    } catch (err) {
        console.error("Failed to load violations:", err);
    }
}

function updateStats(stats) {
    document.getElementById('statTotal').textContent = stats.total || 0;
    document.getElementById('statHigh').textContent = stats.highSeverity || 0;
    document.getElementById('statCandidates').textContent = stats.flaggedCandidates || 0;
}

function renderTable(violations) {
    const tbody = document.getElementById('violationsTableBody');
    if (!violations || violations.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No violation records found matching the criteria.</td></tr>`;
        return;
    }

    tbody.innerHTML = violations.map(v => {
        const time = new Date(v.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const candidateName = v.candidate ? (v.candidate.fullName || v.candidate.regNumber) : (v.candidate || 'DEMO_STUDENT');
        const badgeClass = `badge-${v.severity || 'medium'}`;

        return `
            <tr>
                <td>${time}</td>
                <td><strong>${candidateName}</strong></td>
                <td><code>${v.type}</code></td>
                <td><span class="badge ${badgeClass}">${v.severity || 'medium'}</span></td>
                <td>${v.description || 'N/A'}</td>
                <td>
                    ${v.screenshotUrl 
                        ? `<button class="btn-view" onclick="viewEvidence('${v.screenshotUrl}', '${v.type}', '${v.description}')">🖼️ View Frame</button>` 
                        : `<span style="color: var(--text-muted); font-size: 0.8rem;">No Capture</span>`}
                </td>
            </tr>
        `;
    }).join('');
}

function viewEvidence(url, type, desc) {
    document.getElementById('modalTitle').textContent = `Evidence: ${type}`;
    document.getElementById('modalImage').src = url;
    document.getElementById('modalDesc').textContent = desc || 'Frame captured during violation event.';
    document.getElementById('evidenceModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('evidenceModal').style.display = 'none';
}