const express = require('express');
const AuctionSession = require('../models/AuctionSession');
const Bid = require('../models/Bid');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all auction sessions
router.get('/sessions', async (req, res) => {
    try {
        const sessions = await AuctionSession.find({ status: 'active' });
        res.json(sessions);
    } catch (error) {
        console.error('Get sessions error:', error);
        res.status(500).json({ message: 'Server error fetching auction sessions' });
    }
});

// Get current or next auction session
router.get('/current-session', async (req, res) => {
    try {
        const { currentSession, nextSession } = await AuctionSession.getCurrentOrNextSession();
        
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
        const totalBids = await Bid.countDocuments();
        const activeBids = await Bid.countDocuments({ status: { $in: ['pending', 'paired'] } });
        const completedBids = await Bid.countDocuments({ status: 'completed' });
        
        const totalVolume = await Bid.aggregate([
            { $match: { status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        
        res.json({
            totalBids,
            activeBids,
            completedBids,
            totalVolume: totalVolume[0]?.total || 0
        });
    } catch (error) {
        console.error('Get statistics error:', error);
        res.status(500).json({ message: 'Server error fetching statistics' });
    }
});

module.exports = router;