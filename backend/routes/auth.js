const express = require('express');
const router = express.Router();

// Simple in-memory user store for testing
const users = [];

// Register user
router.post('/register', async (req, res) => {
    try {
        const { fullName, email, phone, password } = req.body;

        // Basic validation
        if (!fullName || !email || !phone || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'All fields are required' 
            });
        }

        // Check if user already exists
        const existingUser = users.find(user => user.email === email);
        if (existingUser) {
            return res.status(400).json({ 
                success: false, 
                message: 'User already exists with this email' 
            });
        }

        // Create new user (in real app, hash password)
        const newUser = {
            id: users.length + 1,
            fullName,
            email,
            phone,
            password: password, // In production, hash this!
            balance: 0,
            createdAt: new Date()
        };

        users.push(newUser);

        // Create simple token (in real app, use JWT)
        const token = `user-${newUser.id}-${Date.now()}`;

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            user: {
                id: newUser.id,
                fullName: newUser.fullName,
                email: newUser.email,
                phone: newUser.phone
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error during registration' 
        });
    }
});

// Login user
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Basic validation
        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email and password are required' 
            });
        }

        // Find user
        const user = users.find(u => u.email === email && u.password === password);
        if (!user) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }

        // Create simple token
        const token = `user-${user.id}-${Date.now()}`;

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                phone: user.phone,
                balance: user.balance
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error during login' 
        });
    }
});

// Get current user
router.get('/me', (req, res) => {
    // Simple demo response
    res.json({
        success: true,
        user: {
            id: 1,
            fullName: 'Demo User',
            email: 'demo@liveauction.com',
            phone: '254712345678',
            balance: 5000
        }
    });
});

module.exports = router;