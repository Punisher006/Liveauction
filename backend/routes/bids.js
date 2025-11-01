const express = require('express');
const router = express.Router();

// Simple in-memory bid store
const bids = [];

// Place a bid
router.post('/place', async (req, res) => {
    try {
        const { amount, investmentPeriod } = req.body;

        // Basic validation
        if (!amount || !investmentPeriod) {
            return res.status(400).json({ 
                success: false, 
                message: 'Amount and investment period are required' 
            });
        }

        if (amount < 500 || amount > 100000) {
            return res.status(400).json({ 
                success: false, 
                message: 'Amount must be between 500 and 100000' 
            });
        }

        if (![4, 8, 12].includes(parseInt(investmentPeriod))) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid investment period' 
            });
        }

        // Calculate ROI
        const roiRates = { 4: 0.3, 8: 0.6, 12: 0.95 };
        const expectedROI = roiRates[investmentPeriod] * 100;
        const expectedReturn = amount + (amount * roiRates[investmentPeriod]);

        // Create bid
        const newBid = {
            id: bids.length + 1,
            amount,
            investmentPeriod,
            expectedROI,
            expectedReturn,
            status: 'pending',
            createdAt: new Date()
        };

        bids.push(newBid);

        res.status(201).json({
            success: true,
            message: 'Bid placed successfully',
            bid: newBid
        });

    } catch (error) {
        console.error('Bid placement error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error during bid placement' 
        });
    }
});

// Get bid status
router.get('/status', (req, res) => {
    // Return demo bids
    const demoBids = [
        {
            id: 1,
            amount: 1000,
            period: 4,
            status: 'completed',
            expectedReturn: 1300,
            timeRemaining: null,
            sellers: []
        },
        {
            id: 2,
            amount: 2000,
            period: 8,
            status: 'paired',
            expectedReturn: 3200,
            timeRemaining: '24 hours',
            sellers: [
                {
                    phone: '254712345678',
                    name: 'John Doe',
                    status: 'pending'
                }
            ]
        }
    ];

    res.json({
        success: true,
        bids: demoBids
    });
});

// Confirm payment
router.post('/confirm-payment/:bidId', (req, res) => {
    const { bidId } = req.params;
    
    res.json({
        success: true,
        message: `Payment confirmed for bid ${bidId}`,
        bidId: parseInt(bidId)
    });
});

module.exports = router;