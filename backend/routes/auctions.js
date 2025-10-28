const express = require('express');
const AuctionSession = require('../models/AuctionSession');
const Bid = require('../models/Bid');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all auction sessions
router.get('/sessions', async (req, res) => {
    try {
        const sessions = await AuctionSession.findAll();
        res.json(sessions);
    } catch (error) {
        console.error('Get sessions error:', error);
        res.status(500).json({ message: 'Server error fetching auction sessions' });
    }
});

// Get current or next auction session
router.get('/current-session', async (req, res) => {
    try {
        const { currentSession, nextSession } = await AuctionSession.getCurrentOrNext();
        
        res.json({
            currentSession,
            nextSession,
            currentTime: new Date().toTimeString().split(' ')[0]
        });
    } catch (error) {
        console.error('Get current session error:', error);
        res.status(500).json({ message: 'Server error fetching current session' });
    }
});

// Get auction statistics
router.get('/statistics', auth, async (req, res) => {
    try {
        // This would require additional methods in Bid model
        // For now, return basic stats
        res.json({
            totalBids: 0,
            activeBids: 0,
            completedBids: 0,
            totalVolume: 0
        });
    } catch (error) {
        console.error('Get statistics error:', error);
        res.status(500).json({ message: 'Server error fetching statistics' });
    }
});

module.exports = router;