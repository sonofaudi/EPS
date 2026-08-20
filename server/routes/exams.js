/**
 * KASU Proctoring System - Exam & Violation Routes
 * File Path: server/routes/exams.js
 */

const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');

// Map POST /api/violations directly to examController.logViolation
router.post('/violations', examController.logViolation);

module.exports = router;