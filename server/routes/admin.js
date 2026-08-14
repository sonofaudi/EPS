/**
 * KASU Proctoring System - Administration Router Endpoints
 * File Path: server/routes/admin.js
 */

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Dashboard analytics KPIs
router.get('/dashboard-summary', adminController.getDashboardStats);

// Fetch live roster
router.get('/sessions', adminController.getActiveSessions);

// Remote shutdown payload
router.post('/session/terminate/:sessionId', adminController.terminateCandidateSession);

module.exports = router;