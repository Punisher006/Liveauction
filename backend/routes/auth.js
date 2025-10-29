const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

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

// Password Reset - Request Reset Link
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        // Find user by email
        const user = await User.findByEmail(email);
        if (!user) {
            // For security, don't reveal if email exists
            return res.json({ 
                message: 'If an account with that email exists, a reset link has been sent.' 
            });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = Date.now() + 3600000; // 1 hour from now

        // Store reset token in database (you'll need to add these fields to your users table)
        const updateSql = 'UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?';
        await pool.execute(updateSql, [resetToken, new Date(resetTokenExpiry), user.id]);

        // In a real application, you would send an email here
        // For demo purposes, we'll return the reset link
        const resetLink = `http://localhost:3000/reset-password.html?token=${resetToken}`;
        
        console.log('Password reset link:', resetLink); // For testing

        res.json({ 
            message: 'If an account with that email exists, a reset link has been sent.',
            resetLink: resetLink // Remove this in production, only for demo
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Server error during password reset request' });
    }
});

// Password Reset - Verify Token
router.get('/verify-reset-token/:token', async (req, res) => {
    try {
        const { token } = req.params;

        const sql = 'SELECT * FROM users WHERE reset_token = ? AND reset_token_expiry > NOW()';
        const [rows] = await pool.execute(sql, [token]);

        if (rows.length === 0) {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        res.json({ message: 'Token is valid', userId: rows[0].id });

    } catch (error) {
        console.error('Verify token error:', error);
        res.status(500).json({ message: 'Server error verifying reset token' });
    }
});

// Password Reset - Set New Password
router.post('/reset-password/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        if (!password || password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long' });
        }

        // Verify token
        const sql = 'SELECT * FROM users WHERE reset_token = ? AND reset_token_expiry > NOW()';
        const [rows] = await pool.execute(sql, [token]);

        if (rows.length === 0) {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        const user = rows[0];

        // Hash new password
        const passwordHash = await bcrypt.hash(password, 10);

        // Update password and clear reset token
        const updateSql = 'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?';
        await pool.execute(updateSql, [passwordHash, user.id]);

        res.json({ message: 'Password reset successfully' });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Server error resetting password' });
    }
});

module.exports = router;