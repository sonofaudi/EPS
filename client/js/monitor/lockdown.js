/**
 * KASU EPS — Phase 6: Core Browser Lockdown & Anti-Cheat Engine
 */

const LockdownEngine = {
    strikeCount: 0,
    maxStrikes: 3,
    isExamActive: false,

    init() {
        this.isExamActive = true;
        this.strikeCount = 0;
        
        this.bindSecurityListeners();
        this.enterStrictFullscreen();
        console.log("🛡️ KASU Security Grid Active: Monitoring System Lifecycle Changes.");
    },

    bindSecurityListeners() {
        // 1. Prevent App-Switching / Tab-Blurring
        window.addEventListener('blur', () => this.registerInfraction("Window/Tab Switched"));

        // 2. Prevent Context Menu (Right Click)
        document.addEventListener('contextmenu', (e) => e.preventDefault());

        // 3. Block Critical Keyboard Combinations
        document.addEventListener('keydown', (e) => {
            const forbiddenKeys = ['c', 'v', 'p', 'r', 'f', 'i'];
            if ((e.ctrlKey || e.metaKey || e.altKey) && forbiddenKeys.includes(e.key.toLowerCase())) {
                e.preventDefault();
                this.registerInfraction(`Forbidden hotkey shortcut combination: Ctrl+${e.key.toUpperCase()}`);
            }
        });

        // 4. Before Unload Warning Layer (The exit confirmation dialog)
        window.addEventListener('beforeunload', (e) => {
            if (!this.isExamActive) return;
            e.preventDefault();
            e.returnValue = ""; // Triggers standard browser exit modal confirmation
        });
    },

    enterStrictFullscreen() {
        const docEl = document.documentElement;
        if (docEl.requestFullscreen) docEl.requestFullscreen().catch(() => {});
    },

    async registerInfraction(reason) {
        if (!this.isExamActive) return;
        
        this.strikeCount++;
        console.warn(`🛑 Violation logged: ${reason}. Total Strikes: ${this.strikeCount}/${this.maxStrikes}`);

        // Async dispatch telemetry metrics back onto our Express infrastructure
        try {
            await fetch('/api/auth/log-violation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ violationType: reason, currentTotal: this.strikeCount })
            });
        } catch (err) {
            console.error("Failed to transmit violation telemetry:", err);
        }

        // Handle Hard-Enforcement Disconnection Rules
        if (this.strikeCount >= this.maxStrikes) {
            this.executeEmergencyShutdown();
        } else {
            alert(`⚠️ PROCTORING ALERT:\n\n${reason} detected.\nStrike Count: ${this.strikeCount}/${this.maxStrikes}.\nExceeding ${this.maxStrikes} strikes will terminate your exam session immediately.`);
        }
    },

    executeEmergencyShutdown() {
        this.isExamActive = false; // Lift protection parameters to avoid looping triggers
        alert("❌ EXAM TERMINATED: You have exceeded the permitted threshold for security infractions.");
        window.location.href = "/student/login.html?error=terminated";
    }
};