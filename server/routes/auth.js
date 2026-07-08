const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Ensure every handler referenced below exists explicitly in authController.js
router.post('/verify', authController.verifyCandidate);
router.get('/session/validate/:token', authController.validateActiveSession);
router.post('/admin/login', authController.verifyAdminLogin);

// Stage Workflow Enforcement Enpoints
router.post('/save-environment-scan', authController.storeEnvironmentMetrics);
router.post('/log-violation', authController.recordIntegrityInfraction);

module.exports = router;