const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const Seller = require('./models/Seller');
const Farmer = require('./models/Farmer');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/agrichain';
mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

// ── Auth Routes ──

// Signup
app.post('/api/auth/signup', async (req, res) => {
    console.log('📩 POST /api/auth/signup - Received:', req.body);
    try {
        const { businessName, email, password } = req.body;
        
        // Check if user already exists
        const existingSeller = await Seller.findOne({ email });
        if (existingSeller) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const newSeller = new Seller({ businessName, email, password });
        await newSeller.save();

        const token = jwt.sign({ id: newSeller._id }, process.env.JWT_SECRET || 'agrichain_secret', { expiresIn: '24h' });
        res.status(201).json({ token, seller: { id: newSeller._id, businessName: newSeller.businessName, email: newSeller.email } });
    } catch (error) {
        console.error('Signup Error:', error);
        res.status(500).json({ message: 'Error creating user', error: error.message });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const seller = await Seller.findOne({ email });
        
        if (!seller || !(await seller.comparePassword(password))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: seller._id }, process.env.JWT_SECRET || 'agrichain_secret', { expiresIn: '24h' });
        res.status(200).json({ token, seller: { id: seller._id, businessName: seller.businessName, email: seller.email } });
    } catch (error) {
        res.status(500).json({ message: 'Login error', error: error.message });
    }
});

// ── Farmer Auth Routes ──

// Farmer Signup
app.post('/api/auth/farmer/signup', async (req, res) => {
    try {
        const { farmerName, email, password, farmLocation } = req.body;
        
        const existingFarmer = await Farmer.findOne({ email });
        if (existingFarmer) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const newFarmer = new Farmer({ farmerName, email, password, farmLocation });
        await newFarmer.save();

        const token = jwt.sign({ id: newFarmer._id, role: 'farmer' }, process.env.JWT_SECRET || 'agrichain_secret', { expiresIn: '24h' });
        res.status(201).json({ token, farmer: { id: newFarmer._id, farmerName: newFarmer.farmerName, email: newFarmer.email } });
    } catch (error) {
        console.error('Farmer Signup Error:', error);
        res.status(500).json({ message: 'Error creating farmer', error: error.message });
    }
});

// Farmer Login
app.post('/api/auth/farmer/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const farmer = await Farmer.findOne({ email });
        
        if (!farmer || !(await farmer.comparePassword(password))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: farmer._id, role: 'farmer' }, process.env.JWT_SECRET || 'agrichain_secret', { expiresIn: '24h' });
        res.status(200).json({ token, farmer: { id: farmer._id, farmerName: farmer.farmerName, email: farmer.email } });
    } catch (error) {
        res.status(500).json({ message: 'Login error', error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// Final error handler
app.use((err, req, res, next) => {
    console.error('🔥 GLOBAL ERROR:', err);
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
});
