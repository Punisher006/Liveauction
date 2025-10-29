const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const PasswordResetToken = require('../models/PasswordResetToken');
const EmailService = require('../services/emailService');

const router = express.Router();

// Request password reset
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        // Find user by email
        const user = await User.findByEmail(email);
        if (!user) {
            // For security, don't reveal if email exists or not
            return res.json({ 
                message: 'If an account with that email exists, a password reset link has been sent.' 
            });
        }

        // Create reset token
        const token = await PasswordResetToken.create(user.id);

        // Create reset link (in production, use your actual domain)
        const resetLink = `http://localhost:3000/reset-password.html?token=${token}`;

        // Send email (simulated)
        await EmailService.sendPasswordReset(user.email, resetLink);

        res.json({ 
            message: 'If an account with that email exists, a password reset link has been sent.',
            // For demo purposes, include the reset link in response
            demoResetLink: resetLink
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Server error processing password reset request' });
    }
});

// Reset password with token
router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword, confirmPassword } = req.body;

        if (!token || !newPassword || !confirmPassword) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: 'Passwords do not match' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long' });
        }

        // Find valid token
        const resetToken = await PasswordResetToken.findValidToken(token);
        if (!resetToken) {
            return res.status(400).json({ 
                message: 'Invalid or expired reset token. Please request a new password reset.' 
            });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update user password
        await pool.execute(
            'UPDATE users SET password_hash = ? WHERE id = ?',
            [hashedPassword, resetToken.user_id]
        );

        // Mark token as used
        await PasswordResetToken.markAsUsed(token);

        // Clean expired tokens
        await PasswordResetToken.cleanExpiredTokens();

        res.json({ 
            message: 'Password reset successfully! You can now login with your new password.' 
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Server error resetting password' });
    }
});

// Validate reset token
router.get('/validate-reset-token/:token', async (req, res) => {
    try {
        const { token } = req.params;

        const resetToken = await PasswordResetToken.findValidToken(token);
        if (!resetToken) {
            return res.status(400).json({ 
                valid: false,
                message: 'Invalid or expired reset token' 
            });
        }

        res.json({ 
            valid: true,
            email: resetToken.email 
        });
    } catch (error) {
        console.error('Validate token error:', error);
        res.status(500).json({ 
            valid: false,
            message: 'Server error validating token' 
        });
    }
});

module.exports = router;