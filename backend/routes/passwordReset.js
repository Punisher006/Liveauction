const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { pool } = require('../config/database');

const router = express.Router();

// Validate reset token
router.get('/validate-reset-token/:token', async (req, res) => {
    try {
        const { token } = req.params;

        const sql = 'SELECT id, reset_token_expiry FROM users WHERE reset_token = ?';
        const [rows] = await pool.execute(sql, [token]);

        if (rows.length === 0) {
            return res.json({ valid: false, message: 'Invalid reset token' });
        }

        const user = rows[0];
        const now = new Date();

        if (user.reset_token_expiry < now) {
            return res.json({ valid: false, message: 'Reset token has expired' });
        }

        res.json({ valid: true, message: 'Token is valid' });

    } catch (error) {
        console.error('Validate token error:', error);
        res.status(500).json({ valid: false, message: 'Server error validating token' });
    }
});

// Reset password
router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword, confirmPassword } = req.body;

        // Validate input
        if (!token || !newPassword || !confirmPassword) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: 'Passwords do not match' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long' });
        }

        // Verify token is valid and not expired
        const sql = 'SELECT id, reset_token_expiry FROM users WHERE reset_token = ?';
        const [rows] = await pool.execute(sql, [token]);

        if (rows.length === 0) {
            return res.status(400).json({ message: 'Invalid reset token' });
        }

        const user = rows[0];
        const now = new Date();

        if (user.reset_token_expiry < now) {
            return res.status(400).json({ message: 'Reset token has expired' });
        }

        // Hash new password
        const passwordHash = await bcrypt.hash(newPassword, 10);

        // Update password and clear reset token
        const updateSql = 'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?';
        await pool.execute(updateSql, [passwordHash, user.id]);

        res.json({ message: 'Password reset successfully' });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Server error resetting password' });
    }
});

// Forgot password - request reset link
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        // Find user by email
        const sql = 'SELECT id, email FROM users WHERE email = ?';
        const [rows] = await pool.execute(sql, [email]);

        // For security, don't reveal if email exists
        if (rows.length === 0) {
            return res.json({ 
                message: 'If an account with that email exists, a reset link has been sent.',
                success: true // Still return success to prevent email enumeration
            });
        }

        const user = rows[0];

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

        // Store reset token in database
        const updateSql = 'UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?';
        await pool.execute(updateSql, [resetToken, resetTokenExpiry, user.id]);

        // In production, you would send an email here
        // For demo purposes, we'll return the reset link
        const resetLink = `http://localhost:3000/reset-password.html?token=${resetToken}`;
        
        console.log('🔐 Password Reset Link:', resetLink); // For testing/demo

        res.json({ 
            message: 'If an account with that email exists, a reset link has been sent.',
            success: true,
            resetLink: resetLink // Remove this in production, only for demo
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Server error during password reset request', success: false });
    }
});

module.exports = router;