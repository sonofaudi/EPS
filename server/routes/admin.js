/**
 * KASU Proctoring System - Administration Router Endpoints
 * File Path: server/routes/admin.js
 */

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
// const { verifyAdminToken } = require('../middleware/adminAuth'); // Optional authorization layer hook

// Fetch current proctoring snapshots, student alert queues, and logs
router.get('/dashboard-summary', adminController.getDashboardStats);

module.exports = router;