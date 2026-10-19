/**
 * KASU Proctoring System - Admin Routes
 * File Path: server/routes/admin.js
 */

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

router.get('/violations', adminController.getAllViolations);
router.patch('/violations/:id', adminController.updateViolationStatus);

module.exports = router;