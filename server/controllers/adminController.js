const Violation = require('../models/Violation');

exports.getRecentViolations = async (req, res) => {
    try {
        const violations = await Violation.find()
            .populate('candidate', 'fullName email registrationNumber')
            .populate('session')
            .sort({ timestamp: -1 })
            .limit(50);

        return res.status(200).json({
            success: true,
            count: violations.length,
            data: violations
        });
    } catch (error) {
        console.error('❌ Error fetching recent violations:', error.message);
        return res.status(500).json({
            success: false,
            error: 'Could not retrieve incident stream.'
        });
    }
};