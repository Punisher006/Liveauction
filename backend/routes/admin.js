const express = require('express');
const { adminAuth } = require('../middleware/auth');
const User = require('../models/User');
const Bid = require('../models/Bid');
const Transaction = require('../models/Transaction');
const logger = require('../middleware/logger');

const router = express.Router();

// Get system statistics (admin only)
router.get('/statistics', adminAuth, async (req, res) => {
    try {
        const totalUsers = await User.countAll();
        const totalBids = await Bid.countAll();
        const totalVolume = await Bid.getTotalVolume();
        const activeBids = await Bid.countByStatus(['pending', 'paired']);

        res.json({
            success: true,
            data: {
                totalUsers,
                totalBids,
                totalVolume,
                activeBids,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        logger.error('Admin statistics error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching admin statistics'
        });
    }
});

// Get all users (admin only)
router.get('/users', adminAuth, async (req, res) => {
    try {
        const { page = 1, limit = 50 } = req.query;
        // This would require a method to get all users with pagination
        // For now, return basic response
        res.json({
            success: true,
            message: 'Admin users endpoint - implement user listing logic'
        });
    } catch (error) {
        logger.error('Admin users error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching users'
        });
    }
});

module.exports = router;