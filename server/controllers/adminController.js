/**
 * KASU Proctoring System - Admin Controller
 * File Path: server/controllers/adminController.js
 */

const Violation = require('../models/Violation');
require('../models/Candidate'); // <-- ADD THIS LINE to register the 'Student' model schema

/**
 * Fetch all violations with populated candidate and session data
 */
exports.getAllViolations = async (req, res) => {
    try {
        const { session, severity, type } = req.query;
        const query = {};

        if (session) query.session = session;
        if (severity) query.severity = severity;
        if (type) query.type = type;

        const violations = await Violation.find(query)
            .populate('candidate', 'fullName email regNumber')
            .populate('session', 'title sessionCode')
            .sort({ createdAt: -1 })
            .limit(100);

        const stats = {
            total: violations.length,
            highSeverity: violations.filter(v => v.severity === 'high' || v.severity === 'critical').length,
            flaggedCandidates: new Set(violations.map(v => v.candidate?._id?.toString())).size
        };

        return res.status(200).json({
            success: true,
            stats,
            violations
        });
    } catch (err) {
        console.error("❌ [adminController] Error fetching violations:", err);
        return res.status(500).json({ success: false, error: err.message });
    }
};

/**
 * Dismiss or mark a violation as reviewed
 */
exports.updateViolationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { strikeEligible } = req.body;

        const updated = await Violation.findByIdAndUpdate(
            id,
            { strikeEligible },
            { new: true }
        );

        return res.status(200).json({ success: true, violation: updated });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};