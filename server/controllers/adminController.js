/**
 * KASU Proctoring System - Admin Dashboard Controller
 * File Path: server/controllers/adminController.js
 */

const Session = require('../models/Session');
const Violation = require('../models/Violation');
const Candidate = require('../models/Candidate');

/**
 * Gathers active exam sessions, calculated violations metrics, and current system metrics
 */
exports.getDashboardStats = async (req, res) => {
    try {
        // 1. Fetch active session pipelines and populate context profiles
        const activeSessions = await Session.find({ status: 'active' })
            .populate('candidate', 'matricNo firstName lastName department')
            .populate('exam', 'title code');

        // 2. Fetch the 10 most recent violations globally to populate the live event monitor feed
        const recentViolations = await Violation.find()
            .populate('candidate', 'matricNo firstName lastName')
            .sort({ timestamp: -1 })
            .limit(10);

        // 3. Compile structural summary analytical counts
        const totalActive = activeSessions.length;
        
        let criticalAlertsCount = 0;
        let warningAlertsCount = 0;

        // Process status rules based on strike boundaries
        const formattedStudents = activeSessions.map(session => {
            let integrityStatus = 'normal'; // 🟢
            
            if (session.strikeCount >= 3) {
                integrityStatus = 'critical'; // 🔴
                criticalAlertsCount++;
            } else if (session.strikeCount > 0) {
                integrityStatus = 'warning'; // 🟡
                warningAlertsCount++;
            }

            return {
                sessionId: session._id,
                matricNo: session.candidate?.matricNo || 'N/A',
                name: `${session.candidate?.firstName || ''} ${session.candidate?.lastName || ''}`.trim(),
                examCode: session.exam?.code || 'N/A',
                strikes: session.strikeCount,
                status: integrityStatus,
                lastSeen: session.updatedAt
            };
        });

        return res.status(200).json({
            success: true,
            analytics: {
                activeCandidates: totalActive,
                warningAlerts: warningAlertsCount,
                criticalAlerts: criticalAlertsCount
            },
            students: formattedStudents,
            recentViolations: recentViolations
        });

    } catch (error) {
        console.error("❌ Dashboard Controller Aggregation Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to assemble administration metrics overview panel context.",
            error: error.message
        });
    }
};