const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// Payload Parsing Middleware
app.use(express.json());

// Serving Static Assets Globally (CSS, JS, Images, Media)
app.use(express.static(path.join(__dirname, '../client')));

// Bind Modular API Endpoint Matrices
app.use('/api/auth', authRoutes);

// ADMIN PORTAL SPA ROUTING FALLBACK
// Captures paths like /admin/login.html or /admin/dashboard.html safely
app.get('/admin/:page', (req, res) => {
    const targetFile = req.params.page || 'login.html';
    res.sendFile(path.join(__dirname, '../client/admin', targetFile));
});

// CANDIDATE PORTAL SPA ROUTING FALLBACK
// Captures paths like /student/login.html or /student/verify.html safely
app.get('/student/:page', (req, res) => {
    const targetFile = req.params.page || 'login.html';
    res.sendFile(path.join(__dirname, '../client/student', targetFile));
});

// Establish Persistent Connection state directly into MongoDB Data Engine
mongoose.connect('mongodb://127.0.0.1:27017/kasuProctoring')
    .then(() => app.listen(PORT, () => console.log(`\n🚀 Secure Proctoring Grid Online on Node Core Port: ${PORT}`)))
    .catch(err => console.error('Database connection failed:', err));
    