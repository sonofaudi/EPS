const Student = require('../models/Candidate'); // Points explicitly to Candidate.js physical file
const Session = require('../models/Session');
const crypto = require('crypto');

// Strict Server-Side Validation Regular Expressions
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const nameRegex = /^[a-zA-Z][a-zA-Z'-]*(\s+[a-zA-Z][a-zA-Z'-]*)+$/;
const matricRegex = /^KASU\/\d{2}\/[A-Z]{2,8}\/\d{4}$/;

/**
 * Generates an unpredictable high-entropy hexadecimal session identifier string.
 * This prevents sequential prediction attacks if a session is deleted from MongoDB.
 * @returns {string} e.g., "EPS-4E8F2A1B"
 */
function generateSecureSessionId() {
    const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `EPS-${randomHex}`;
}

/**
 * POST /api/auth/verify
 * Handles initial candidate checking, validation, and proctoring session creation.
 */
exports.verifyCandidate = async (req, res) => {
    try {
        const { email, fullName, matricNumber } = req.body;

        // 1. NEVER TRUST CLIENT: Server-Side Field Validation Guard
        if (!email || !fullName || !matricNumber) {
            return res.status(400).json({ success: false, message: "All form validation fields are mandatory." });
        }
        if (!emailRegex.test(email.trim())) {
            return res.status(400).json({ success: false, message: "Invalid institutional email syntax received." });
        }
        if (!nameRegex.test(fullName.trim())) {
            return res.status(400).json({ success: false, message: "Name format invalid. Minimum two names required starting with letters." });
        }
        if (!matricRegex.test(matricNumber.trim().toUpperCase())) {
            return res.status(400).json({ success: false, message: "Matriculation pattern mismatch. Example: KASU/22/CSC/1125" });
        }

        // 2. Query MongoDB using the Student model mapped to models/Candidate.js
        const student = await Student.findOne({
            email: email.trim().toLowerCase(),
            matricNumber: matricNumber.trim().toUpperCase()
        });

        // 3. Handle Student Not Found
        if (!student) {
            return res.status(404).json({ success: false, message: "Candidate record not found on the official exam register." });
        }

        // Deep matching step: Enforce exact string match on Full Name too
        if (student.fullName.toLowerCase() !== fullName.trim().toLowerCase()) {
            return res.status(404).json({ success: false, message: "Candidate name does not match register records." });
        }

        // 4. Administrative Security Status Guard (Fix #5)
        if (!student.isAllowed) {
            return res.status(403).json({ 
                success: false, 
                message: "Access Denied. Your candidate account status has been restricted by an administrator." 
            });
        }

        // 5. Create Cryptographically Unpredictable Session Key Tokens (Fix #2)
        const secureSessionToken = generateSecureSessionId();
        
        // 6. Write expanded audit logging metrics to Session collection (Fix #4)
        const newSession = new Session({
            sessionId: secureSessionToken,
            studentId: student._id, // Relates cleanly to MongoDB object reference
            status: 'pending_identity',
            identityVerified: false,
            faceVerified: false,
            examStarted: false,
            examEnded: false,
            riskScore: 0,
            violationsCount: 0
        });
        await newSession.save();

        // 7. Return payload containing secure query parameter redirect instructions
        return res.status(200).json({
            success: true,
            message: "Candidate verified successfully.",
            redirectUrl: `verify.html?session=${secureSessionToken}`
        });

    } catch (error) {
        console.error("Critical Database Engine Error inside verifyCandidate:", error);
        return res.status(500).json({ success: false, message: "Internal server error occurred processing candidate profile validation." });
    }
};

/**
 * GET /api/auth/session/validate/:token
 * Validates the session token immediately upon verify.html load and pulls academic data.
 */
exports.validateActiveSession = async (req, res) => {
    try {
        const { token } = req.params;
        
        // Find session and pull associated student details across collection references
        const session = await Session.findOne({ sessionId: token }).populate('studentId');
        
        if (!session) {
            return res.status(404).json({ success: false, message: "Proctoring session context token has expired or is invalid." });
        }

        // Catch edge case where admin locks student out midway through the environmental check
        if (!session.studentId.isAllowed) {
            return res.status(403).json({ success: false, message: "Verification halted. Associated candidate account has been suspended." });
        }
        
        return res.status(200).json({ 
            success: true, 
            student: session.studentId 
        });
        
    } catch (error) {
        console.error("Critical Failure inside validateActiveSession controller:", error);
        return res.status(500).json({ success: false, message: "Internal server error validating session data context." });
    }
};

const Admin = require('../models/Admin'); // Ensure this points to your Admin model correctly

/**
 * POST /api/auth/admin/login
 * Handles administrative verification and dashboard clearance.
 */
exports.verifyAdminLogin = async (req, res) => {
    try {
        const { email, fullName, password } = req.body;

        // 1. Basic Payload Struct Check
        if (!email || !fullName || !password) {
            return res.status(400).json({ success: false, message: "All sign-in credentials are required." });
        }

        // 2. Lookup Admin Record
        const admin = await Admin.findOne({ email: email.trim().toLowerCase() });

        if (!admin) {
            return res.status(401).json({ success: false, message: "Invalid admin credentials or access denied." });
        }

        // 3. Deep Name Verification Match
        if (admin.fullName.toLowerCase() !== fullName.trim().toLowerCase()) {
            return res.status(401).json({ success: false, message: "Invalid admin credentials or access denied." });
        }

        // 4. Temporary Plain-Text Password Check (Matches seed data)
        // NOTE: Switch this to bcrypt.compare() later once sign-up hash pipelines are built
        if (admin.password !== password) {
            return res.status(401).json({ success: false, message: "Invalid admin credentials or access denied." });
        }

        // Success Response
        return res.status(200).json({
            success: true,
            message: "Administrative clearance authorized."
        });

    } catch (error) {
        console.error("Critical Admin Login Controller Failure:", error);
        return res.status(500).json({ success: false, message: "Internal server processing failure." });
    }
};