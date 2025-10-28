const express = require('express');
const Bid = require('../models/Bid');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Place a bid
router.post('/place', auth, async (req, res) => {
    try {
        const { amount, period } = req.body;

        // Validate amount
        if (amount < 500 || amount > 100000) {
            return res.status(400).json({ 
                message: 'Amount must be between KES 500 and KES 100,000' 
            });
        }

        // Check if user has any pending bids
        const pendingBid = await Bid.findOne({ 
            userId: req.user._id, 
            status: 'pending' 
        });

        if (pendingBid) {
            return res.status(400).json({ 
                message: 'You already have a pending bid. Please wait for it to be processed.' 
            });
        }

        // Create new bid
        const bid = new Bid({
            userId: req.user._id,
            amount,
            period
        });

        await bid.save();

        res.status(201).json({
            message: 'Bid placed successfully',
            bid: {
                id: bid._id,
                amount: bid.amount,
                period: bid.period,
                expectedReturn: bid.expectedReturn,
                status: bid.status
            }
        });
    } catch (error) {
        console.error('Bid placement error:', error);
        res.status(500).json({ message: 'Server error during bid placement' });
    }
});

// Get user's bid status
router.get('/status', auth, async (req, res) => {
    try {
        const bids = await Bid.find({ userId: req.user._id })
            .sort({ createdAt: -1 })
            .limit(10);

        // Simulate seller pairing (in real app, this would be more complex)
        const bidsWithSellers = bids.map(bid => {
            if (bid.status === 'pending' && !bid.sellers.length) {
                // Simulate pairing after some time
                const timeSinceCreation = Date.now() - bid.createdAt;
                if (timeSinceCreation > 60000) { // 1 minute for demo
                    bid.sellers = [{
                        phone: '2547' + Math.floor(Math.random() * 100000000).toString().padStart(8, '0'),
                        name: 'Demo Seller',
                        status: 'pending',
                        amount: bid.amount
                    }];
                    bid.status = 'paired';
                    bid.save();
                }
            }

            return {
                id: bid._id,
                amount: bid.amount,
                period: bid.period,
                status: bid.status,
                sellers: bid.sellers,
                timer: bid.timer,
                expectedReturn: bid.expectedReturn,
                createdAt: bid.createdAt
            };
        });

        res.json(bidsWithSellers);
    } catch (error) {
        console.error('Bid status error:', error);
        res.status(500).json({ message: 'Server error fetching bid status' });
    }
});

// Confirm payment
router.post('/confirm-payment/:bidId', auth, async (req, res) => {
    try {
        const { bidId } = req.params;

        const bid = await Bid.findOne({ 
            _id: bidId, 
            userId: req.user._id 
        });

        if (!bid) {
            return res.status(404).json({ message: 'Bid not found' });
        }

        if (bid.status !== 'paired') {
            return res.status(400).json({ message: 'Bid is not in a payable state' });
        }

        // Update bid status
        bid.status = 'paid';
        bid.sellers[0].status = 'confirmed';
        await bid.save();

        res.json({ 
            message: 'Payment confirmed successfully',
            bid: {
                id: bid._id,
                status: bid.status,
                sellers: bid.sellers
            }
        });
    } catch (error) {
        console.error('Payment confirmation error:', error);
        res.status(500).json({ message: 'Server error confirming payment' });
    }
});

// Get all bids (admin functionality)
router.get('/all', auth, async (req, res) => {
    try {
        const bids = await Bid.find()
            .populate('userId', 'fullName email phone')
            .sort({ createdAt: -1 });

        res.json(bids);
    } catch (error) {
        console.error('Get all bids error:', error);
        res.status(500).json({ message: 'Server error fetching bids' });
    }
});

module.exports = router;