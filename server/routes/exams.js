/**
 * KASU Proctoring System - Exam & Security Routing System
 * File Path: server/routes/exams.js
 */

const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');

// Secure API Pipeline to capture and log AI-detected proctoring infractions
router.post('/violations', examController.logViolation);

module.exports = router;