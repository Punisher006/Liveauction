const express = require('express');
const AuctionSession = require('../models/AuctionSession');
const Bid = require('../models/Bid');
const auth = require('../middleware/auth');
const logger = require('../middleware/logger');

const router = express.Router();

// Get all auction sessions
router.get('/sessions', async (req, res) => {
    try {
        const sessions = await AuctionSession.findAll();
        res.json({
            success: true,
            data: sessions
        });
    } catch (error) {
        logger.error('Get sessions error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching auction sessions'
        });
    }
});

// Get current or next auction session
router.get('/current-session', async (req, res) => {
    try {
        const { currentSession, nextSession } = await AuctionSession.getCurrentOrNext();
        
        res.json({
            success: true,
            data: {
                currentSession,
                nextSession,
                currentTime: new Date().toTimeString().split(' ')[0]
            }
        });
    } catch (error) {
        logger.error('Get current session error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching current session'
        });
    }
});

// Get auction statistics
router.get('/statistics', auth, async (req, res) => {
    try {
        const totalBids = await Bid.countAll();
        const activeBids = await Bid.countByStatus(['pending', 'paired']);
        const completedBids = await Bid.countByStatus(['completed']);
        
        const totalVolume = await Bid.getTotalVolume();
        
        res.json({
            success: true,
            data: {
                totalBids,
                activeBids,
                completedBids,
                totalVolume: totalVolume || 0
            }
        });
    } catch (error) {
        logger.error('Get statistics error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching statistics'
        });
    }
});

// Get session by ID
router.get('/sessions/:id', async (req, res) => {
    try {
        const session = await AuctionSession.findById(req.params.id);
        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Auction session not found'
            });
        }

        const stats = await AuctionSession.getSessionStats(req.params.id);
        
        res.json({
            success: true,
            data: {
                session,
                stats
            }
        });
    } catch (error) {
        logger.error('Get session by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching session'
        });
    }
});

module.exports = router;