const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

// Register user
router.post('/register', async (req, res) => {
    try {
        const { fullName, email, phone, password } = req.body;

        // Validate input
        if (!fullName || !email || !phone || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Check if user exists
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        // Create user
        const userId = await User.create({
            fullName,
            email,
            phone,
            password,
            mpesaName: fullName
        });

        // Get created user
        const user = await User.findById(userId);

        // Create token
        const token = jwt.sign(
            { userId: user.id },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: user.id,
                fullName: user.full_name,
                email: user.email,
                phone: user.phone
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
});

// Login user
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        // Find user
        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await User.comparePassword(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Update last login
        await User.updateLastLogin(user.id);

        // Create token
        const token = jwt.sign(
            { userId: user.id },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                fullName: user.full_name,
                email: user.email,
                phone: user.phone,
                balance: user.balance
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// Get current user
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Get user statistics
        const stats = await User.getUserStats(req.user.id);

        res.json({
            user: {
                id: user.id,
                fullName: user.full_name,
                email: user.email,
                phone: user.phone,
                mpesaName: user.mpesa_name,
                balance: user.balance,
                accountStatus: user.account_status,
                verificationStatus: user.verification_status,
                createdAt: user.created_at
            },
            stats: {
                totalBids: stats.total_bids || 0,
                totalInvested: stats.total_invested || 0,
                totalEarned: stats.total_earned || 0
            }
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ message: 'Server error fetching user data' });
    }
});

module.exports = router;