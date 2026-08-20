/**
 * KASU Proctoring System - Exam & Violation Routes
 * File Path: server/routes/exams.js
 */

const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');

// Map POST /api/violations directly to examController pipeline
router.post('/violations', examController.logViolation);

// Retrieve all violations for a session
router.get('/violations/:sessionId', examController.getSessionViolations);

module.exports = router;