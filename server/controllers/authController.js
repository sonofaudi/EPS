const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Core Database Architecture Imports
const Session = require('../models/Session');
// const Student = require('../models/Candidate'); // Points to models/Candidate.js if needed later

// Note: If you don't have a distinct Violation model file yet, we use Mongoose dynamically 
// or you can substitute your specific Violation model import here.
let Violation;
try {
    Violation = require('../models/Violation');
} catch (e) {
    // Fallback schema if file doesn't exist yet to prevent startup crashes
    const violationSchema = new mongoose.Schema({
        sessionToken: String,
        matricNumber: String,
        violationType: String,
        description: String,
        timestamp: Date
    });
    Violation = mongoose.models.Violation || mongoose.model('Violation', violationSchema);
}

/**
 * POST /api/auth/verify
 * Standard baseline client authentication matching entrypoint.
 */
exports.verifyCandidate = async (req, res) => {
    try {
        const { matricNumber } = req.body;
        
        console.log(`\n🔑 [AUTH GATEWAY]: Candidate authenticating with Matric: ${matricNumber || "Unknown"}`);
        
        return res.status(200).json({ 
            success: true, 
            redirectUrl: `/student/verify.html?session=EPS-${Date.now()}` 
        });
    } catch (err) {
        console.error("Auth initialization failure:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * GET /api/auth/session/validate/:token
 * Validates tracking tokens and pulls active profile records out.
 */
exports.validateActiveSession = async (req, res) => {
    try {
        const { token } = req.params;
        
        if (!token || token === "Checking...") {
            return res.status(400).json({ success: false, message: "Invalid or empty token payload context parameters." });
        }

        console.log(`\n🔍 [SESSION QUERY]: Verifying token references for key payload: ${token}`);

        const mockCandidate = {
            fullName: "Glad Candidate",
            matricNumber: "KASU22CSC1125",
            department: "Computer Science",
            level: "400",
            targetExam: "CSC 401: Advanced Software Engineering Mock Exam"
        };

        return res.status(200).json({
            success: true,
            message: "Candidate session verified successfully.",
            candidate: mockCandidate
        });
    } catch (error) {
        console.error("Session verification matrix crash:", error);
        return res.status(500).json({ success: false, message: "Internal directory authentication error." });
    }
};

/**
 * POST /api/auth/admin/login
 * Administrative entry check pipeline to grant panel dashboard authorization.
 */
exports.verifyAdminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (email === "admin@gmail.com" && password === "Password123") {
            return res.status(200).json({ 
                success: true, 
                token: "ADMIN-MOCK-KEY-2026", 
                redirectUrl: "/admin/dashboard.html" 
            });
        }
        return res.status(401).json({ success: false, message: "Invalid Administrative Credentials." });
    } catch (err) {
        console.error("Admin system authentication crash:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * POST /api/auth/save-environment-scan
 * Saves multi-frame room perimeter sweep profile base64 arrays to storage engines.
 */
exports.storeEnvironmentMetrics = async (req, res) => {
    try {
        const { frames, matricNumber, sessionToken } = req.body;
        if (!frames || !Array.isArray(frames) || frames.length === 0) {
            return res.status(400).json({ success: false, message: "No environment sweep proof buffers received." });
        }

        const studentId = (matricNumber || "UNKNOWN_STUDENT").replace(/[^a-zA-Z0-9]/g, "_");
        const sessionKey = (sessionToken || `SESSION_${Date.now()}`).replace(/[^a-zA-Z0-9_-]/g, "_");

        console.log(`\n🌐 [ENVIRONMENT SCAN]: Archiving ${frames.length} snapshots for Student: ${studentId}`);

        const outputDir = path.join(__dirname, '..', 'storage', 'frames', 'scans', studentId, sessionKey);
        
        fs.mkdir(outputDir, { recursive: true }, (dirErr) => {
            if (dirErr) {
                console.error("❌ [DISK ARCHIVER]: Directory generation block failure:", dirErr);
                return;
            }

            frames.forEach((base64Data, index) => {
                if (!base64Data || typeof base64Data !== "string" || !base64Data.startsWith("data:image/")) return;

                const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, "");
                const imageBuffer = Buffer.from(cleanBase64, 'base64');
                
                const uniqueSalt = Math.random().toString(36).slice(2, 8);
                const fileName = `scan_frame_${index + 1}_${Date.now()}_${uniqueSalt}.jpg`;
                const filePath = path.join(outputDir, fileName);

                fs.writeFile(filePath, imageBuffer, (err) => {
                    if (err) console.error(`❌ [DISK ARCHIVER]: Failed to write ${fileName}:`, err);
                });
            });
        });

        return res.status(200).json({ 
            success: true, 
            message: "Spatial workspace perimeter telemetry logged and structured safely." 
        });
    } catch (error) {
        console.error("Environment scan processing failure:", error);
        return res.status(500).json({ success: false, message: "Internal storage environment scan error." });
    }
};

/**
 * POST /api/auth/log-violation
 * Commits structural violations to the database and increments the violationsCount on the session model.
 */
exports.recordIntegrityInfraction = async (req, res) => {
    try {
        const { violationType, description, sessionToken, matricNumber } = req.body;
        
        if (!violationType) {
            return res.status(400).json({ success: false, message: "Missing structural violation type metrics." });
        }

        // 1. Persist log details directly into the MongoDB Violation collection
        const newInfraction = await Violation.create({
            sessionToken: sessionToken || "MOCK_SESSION",
            matricNumber: matricNumber || "UNKNOWN_STUDENT",
            violationType,
            description: description || "Automated proctor flag.",
            timestamp: new Date()
        });

        // 2. Increment matching fields on the active student session record concurrently
        if (sessionToken) {
            const updatedSession = await Session.findOneAndUpdate(
                { sessionId: sessionToken }, // Clean mapping to 'sessionId' from Session.js schema
                { $inc: { violationsCount: 1 } }, // Corrected property mapping
                { new: true, upsert: false }
            );

            // Dynamic risk engine recalculation calculation step: 20 points per infraction up to 100 max
            if (updatedSession) {
                let currentCount = updatedSession.violationsCount || 0;
                let calculatedRisk = Math.min(currentCount * 20, 100); 
                
                await Session.findOneAndUpdate(
                    { sessionId: sessionToken },
                    { $set: { riskScore: calculatedRisk } }
                );
            }
        }

        console.log(`\n🛑 [ALERT — PROCTOR SECURITY INTEGRITY VIOLATION STORED]`);
        console.log(`| Student Matric     : ${matricNumber || "Unknown"}`);
        console.log(`| Infraction Vector  : ${violationType}`);
        console.log(`-----------------------------------------------------------------`);
        
        return res.status(200).json({ 
            success: true, 
            message: "Infraction data successfully committed to historical security logs.",
            violationId: newInfraction._id
        });
    } catch (error) {
        console.error("Violation logger database infrastructure failure:", error);
        return res.status(500).json({ success: false, message: "Internal reporting database transaction crash." });
    }
};

/**
 * POST /api/auth/proctor/frame
 * Receives periodic background snapshot frames during the active exam phase.
 */
exports.archiveTelemetryFrame = async (req, res) => {
    try {
        const { frame, matricNumber, sessionToken } = req.body;
        
        if (!frame || typeof frame !== "string" || !frame.startsWith("data:image/")) {
            return res.status(400).json({ success: false, message: "Invalid or corrupt proctoring image payload." });
        }

        const studentId = (matricNumber || "UNKNOWN_STUDENT").replace(/[^a-zA-Z0-9]/g, "_");
        const sessionKey = (sessionToken || `SESSION_${Date.now()}`).replace(/[^a-zA-Z0-9_-]/g, "_");

        const outputDir = path.join(__dirname, '..', 'storage', 'frames', 'live_stream', studentId, sessionKey);
        
        fs.mkdir(outputDir, { recursive: true }, (dirErr) => {
            if (dirErr) {
                console.error("❌ [LIVE TRACKER]: Failed to configure session directory map:", dirErr);
                return;
            }

            const cleanBase64 = frame.replace(/^data:image\/\w+;base64,/, "");
            const imageBuffer = Buffer.from(cleanBase64, 'base64');
            
            const uniqueSalt = Math.random().toString(36).slice(2, 8);
            const fileName = `live_${Date.now()}_${uniqueSalt}.jpg`;
            const filePath = path.join(outputDir, fileName);

            fs.writeFile(filePath, imageBuffer, (err) => {
                if (err) {
                    console.error(`❌ [LIVE TRACKER]: Failed to save frame partition to storage disk:`, err);
                }
            });
        });

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error("Live telemetry archiver framework crash:", error);
        return res.status(500).json({ success: false, message: "Internal telemetry stream engine error." });
    }
};