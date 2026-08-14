/**
 * Browser Security Engine - KASU EPS
 * Handles all browser-level event listeners and integrity tracking.
 */
(function (window, document) {
    'use strict';

    const BrowserSecurity = {
        isInitialized: false,

        init: function () {
            if (this.isInitialized) {
                console.warn("⚠️ BrowserSecurity is already initialized.");
                return;
            }
            this.isInitialized = true;
            console.log("🔒 Initializing Browser Security Enforcers...");

            this._attachVisibilityListener();
            this._attachFocusListeners();
            this._attachClipboardAndContextListeners();
            this._attachKeyboardInterceptors();
        },

        _captureFrame: function () {
            return window.ProctorCapture ? window.ProctorCapture.grabSnapshot('proctorFeed') : null;
        },

        _reportViolation: function (type, description) {
            if (window.ViolationsEngine && typeof window.ViolationsEngine.report === 'function') {
                window.ViolationsEngine.report({
                    type: type,
                    confidence: 1.0,
                    description: description,
                    screenshot: this._captureFrame(),
                    persistenceDuration: 0
                });
            } else {
                console.error(`❌ ViolationsEngine not available to report: ${type}`);
            }
        },

        _attachVisibilityListener: function () {
            document.addEventListener("visibilitychange", () => {
                if (document.hidden) {
                    this._reportViolation(
                        'tab_switch',
                        'Candidate switched tabs or minimized the browser window.'
                    );
                }
            });
        },

        _attachFocusListeners: function () {
            window.addEventListener("blur", () => {
                this._reportViolation(
                    'tab_switch',
                    'Window focus lost (candidate clicked outside exam window).'
                );
            });
        },

        _attachClipboardAndContextListeners: function () {
            // Prevent and log right-click context menu
            document.addEventListener("contextmenu", (e) => {
                e.preventDefault();
            });

            // Prevent copy
            document.addEventListener("copy", (e) => {
                e.preventDefault();
            });

            // Prevent paste
            document.addEventListener("paste", (e) => {
                e.preventDefault();
            });

            // Prevent selectstart (optional text dragging)
            document.addEventListener("selectstart", (e) => {
                if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                    // Allow text selection inside inputs if needed, otherwise restrict
                }
            });
        },

        _attachKeyboardInterceptors: function () {
            document.addEventListener("keydown", (e) => {
                // Intercept key combinations: Ctrl+C, Ctrl+V, Ctrl+U, Ctrl+Shift+I, F12, Alt+Tab
                const isCtrlOrCmd = e.ctrlKey || e.metaKey;

                if (
                    e.key === 'F12' ||
                    (isCtrlOrCmd && ['c', 'v', 'u', 'a', 'p', 's'].includes(e.key.toLowerCase())) ||
                    (isCtrlOrCmd && e.shiftKey && ['i', 'j', 'c'].includes(e.key.toLowerCase()))
                ) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            });
        }
    };

    window.BrowserSecurity = BrowserSecurity;
})(window, document);