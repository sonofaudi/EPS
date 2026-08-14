/**
 * KASU Proctoring System - Administration controller logic
 * File Path: server/controllers/adminController.js
 */

const Session = require('../models/Session');
const Violation = require('../models/Violation');
const Student = require('../models/Candidate'); // Points to Candidate.js schema file
const socketService = require('../services/socketService');

const adminController = {
    /**
     * Compiles system-wide high-level dashboard analytics metrics
     */
    async getDashboardStats(req, res) {
        try {
            // Aggregate totals across collections
            const activeSessionsCount = await Session.countDocuments({ 
                status: { $in: ['active_exam', 'pending_identity', 'identity_passed'] } 
            });
            const completedCount = await Session.countDocuments({ status: 'completed' });
            const terminatedCount = await Session.countDocuments({ status: 'flagged_terminated' });
            const totalViolationsCount = await Violation.countDocuments();

            // Aggregate metrics to find the most common type of infraction
            const commonViolationAggregation = await Violation.aggregate([
                { $group: { _id: "$type", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 1 }
            ]);

            const mostCommonViolation = commonViolationAggregation.length > 0 
                ? commonViolationAggregation[0]._id 
                : "None";

            return res.status(200).json({
                success: true,
                stats: {
                    activeStudents: activeSessionsCount,
                    completedExams: completedCount,
                    terminatedExams: terminatedCount,
                    totalViolations: totalViolationsCount,
                    mostCommonViolation: mostCommonViolation
                }
            });
        } catch (error) {
            console.error("❌ Admin Stats Retrieval Error:", error);
            return res.status(500).json({ success: false, message: "Error calculating analytics stats." });
        }
    },

    /**
     * Lists active examination candidate sessions with populated student identities
     */
    async getActiveSessions(req, res) {
        try {
            const sessions = await Session.find()
                .populate({ path: 'studentId', model: 'Student' })
                .sort({ updatedAt: -1 });

            return res.status(200).json({ success: true, data: sessions });
        } catch (error) {
            console.error("❌ Session Retrieval Error:", error);
            return res.status(500).json({ success: false, message: "Could not fetch system sessions." });
        }
    },

    /**
     * Forces immediate administrative termination on a candidate session (Remote Kick)
     */
    async terminateCandidateSession(req, res) {
        try {
            const { sessionId } = req.params;

            const updatedSession = await Session.findOneAndUpdate(
                { sessionId: sessionId },
                { status: 'flagged_terminated', examEnded: true },
                { new: true }
            ).populate({ path: 'studentId', model: 'Student' });

            if (!updatedSession) {
                return res.status(404).json({ success: false, message: "Target session not found." });
            }

            // Push termination real-time broadcast. The client-side hook will recognize this status and boot the student immediately.
            socketService.emitToAdmins('session_terminated', updatedSession);

            return res.status(200).json({
                success: true,
                message: `Session ${sessionId} has been forcefully terminated.`,
                data: updatedSession
            });
        } catch (error) {
            console.error("❌ Session Forced Termination Error:", error);
            return res.status(500).json({ success: false, message: "An administrative error occurred during session termination." });
        }
    }
};

module.exports = adminController;