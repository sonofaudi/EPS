// server/routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Standard Access Paths
router.post('/verify', authController.verifyCandidate);
router.get('/session/validate/:token', authController.validateActiveSession);
router.post('/admin/login', authController.verifyAdminLogin);

// Stage Workflow Enforcement Endpoints
router.post('/save-environment-scan', authController.storeEnvironmentMetrics);
router.post('/log-violation', authController.recordIntegrityInfraction);

// ACTIVE EXAMINATION SPACE PROCTORING FRAME ENDPOINT
router.post('/proctor/frame', authController.archiveTelemetryFrame);

module.exports = router;