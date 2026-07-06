const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Student Auth Routes
router.post('/verify', authController.verifyCandidate);
router.get('/session/validate/:token', authController.validateActiveSession);

// Admin Auth Route 
router.post('/admin/login', authController.verifyAdminLogin);

module.exports = router;