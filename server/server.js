/**
 * KASU Proctoring Core System - Main Application Entry Gateway
 * File Path: server/server.js
 */

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');

// Import Modular API Endpoint Routes
const authRoutes = require('./routes/auth');
const examRoutes = require('./routes/exams');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable Cross-Origin Resource Sharing
app.use(cors());

// Payload Parsing Middleware (50mb limit handles base64 image strings safely)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serving Static Assets Globally
app.use(express.static(path.join(__dirname, '../client')));

// Static serving for public directory inside server (CSS, JS, uploads, screenshots)
// Direct route mapping: exposes /public/uploads/screenshots/...
app.use('/public', express.static(path.join(__dirname, 'public')));

// Direct shortcut mapping: allows relative URLs like /uploads/screenshots/... to serve cleanly
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Bind API Endpoints
app.use('/api/auth', authRoutes);
app.use('/api', examRoutes); // Mounts /api/violations matching client calls

// ADMIN PORTAL SPA ROUTING FALLBACK
app.get('/admin/:page', (req, res) => {
    const targetFile = req.params.page || 'login.html';
    res.sendFile(path.join(__dirname, '../client/admin', targetFile));
});

// CANDIDATE PORTAL SPA ROUTING FALLBACK
app.get('/student/:page', (req, res) => {
    const targetFile = req.params.page || 'login.html';
    res.sendFile(path.join(__dirname, '../client/student', targetFile));
});

// Establish Persistent Connection state directly into MongoDB Data Engine
mongoose.connect('mongodb://127.0.0.1:27017/kasuProctoring')
    .then(() => app.listen(PORT, () => console.log(`\n🚀 Secure Proctoring Grid Online on Node Core Port: ${PORT}`)))
    .catch(err => console.error('Database connection failed:', err));