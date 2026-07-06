const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// Parsers
app.use(express.json());

// Serving Static Frontend Web Space Build Assets
app.use(express.static(path.join(__dirname, '../client')));

// Bind Modular API Endpoint Matrices
app.use('/api/auth', authRoutes);

// FIXED: Clean variable routing syntax completely free of regex symbols (* or +)
// This captures requests like /student/login.html or /student/verify.html safely
app.get('/student/:page', (req, res) => {
    const targetFile = req.params.page || 'login.html';
    res.sendFile(path.join(__dirname, '../client/student', targetFile));
});

// Establish Persistent Connection state directly into Database
mongoose.connect('mongodb://127.0.0.1:27017/kasuProctoring')
    .then(() => app.listen(PORT, () => console.log(`\n🚀 Secure Proctoring Grid Online on Node Core Port: ${PORT}`)))
    .catch(err => console.error('Database connection failed:', err));