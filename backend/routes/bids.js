const express = require('express');
const Bid = require('../models/Bid');
const BidPairing = require('../models/BidPairing');
const AuctionSession = require('../models/AuctionSession');
const SystemSetting = require('../models/SystemSetting');
const auth = require('../middleware/auth');

const router = express.Router();

// Place a bid
router.post('/place', auth, async (req, res) => {
    try {
        const { amount, investmentPeriod } = req.body;

        // Validate input
        if (!amount || !investmentPeriod) {
            return res.status(400).json({ message: 'Amount and investment period are required' });
        }

        // Get investment settings
        const settings = await SystemSetting.getInvestmentSettings();
        const minInvestment = parseInt(settings.min_investment);
        const maxInvestment = parseInt(settings.max_investment);

        // Validate amount
        if (amount < minInvestment || amount > maxInvestment) {
            return res.status(400).json({ 
                message: `Amount must be between KES ${minInvestment} and KES ${maxInvestment}` 
            });
        }

        // Validate investment period
        if (![4, 8, 12].includes(parseInt(investmentPeriod))) {
            return res.status(400).json({ message: 'Invalid investment period' });
        }

        // Check if user has active bid
        const hasActiveBid = await Bid.hasActiveBid(req.user.id);
        if (hasActiveBid) {
            return res.status(400).json({ 
                message: 'You already have an active bid. Please wait for it to be processed.' 
            });
        }

        // Get current or next auction session
        const { currentSession } = await AuctionSession.getCurrentOrNext();
        if (!currentSession) {
            return res.status(400).json({ message: 'No active auction session at the moment' });
        }

        // Create bid
        const bidId = await Bid.create({
            userId: req.user.id,
            auctionSessionId: currentSession.id,
            amount: parseFloat(amount),
            investmentPeriod: parseInt(investmentPeriod)
        });

        // Get created bid
        const bid = await Bid.findById(bidId);

        res.status(201).json({
            message: 'Bid placed successfully',
            bid: {
                id: bid.id,
                amount: bid.amount,
                investmentPeriod: bid.investment_period,
                expectedROI: bid.expected_roi,
                expectedReturn: bid.expected_return,
                status: bid.status,
                sessionName: bid.session_name
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
        const bids = await Bid.findByUserId(req.user.id);

        // For each bid, get pairings if any
        const bidsWithDetails = await Promise.all(
            bids.map(async (bid) => {
                const pairings = await BidPairing.findByBidId(bid.id);
                
                // Simulate pairing for demo (in real app, this would be automated)
                let sellers = [];
                if (bid.status === 'paired' && pairings.length > 0) {
                    sellers = pairings.map(p => ({
                        phone: p.seller_phone,
                        name: p.seller_mpesa_name,
                        status: p.payment_status,
                        amount: p.amount,
                        paymentDeadline: p.payment_deadline
                    }));
                } else if (bid.status === 'pending') {
                    // Simulate pairing after some time for demo
                    const bidAge = Date.now() - new Date(bid.created_at).getTime();
                    if (bidAge > 30000) { // 30 seconds for demo
                        sellers = [{
                            phone: '2547' + Math.floor(Math.random() * 100000000).toString().padStart(8, '0'),
                            name: 'Demo Seller',
                            status: 'pending',
                            amount: bid.amount,
                            paymentDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000)
                        }];
                        // Update bid status to paired
                        await Bid.updateStatus(bid.id, 'paired');
                        bid.status = 'paired';
                    }
                }

                return {
                    id: bid.id,
                    amount: bid.amount,
                    period: bid.investment_period,
                    status: bid.status,
                    expectedReturn: bid.expected_return,
                    sessionName: bid.session_name,
                    timeRemaining: bid.time_remaining,
                    sellers: sellers,
                    createdAt: bid.created_at
                };
            })
        );

        res.json(bidsWithDetails);
    } catch (error) {
        console.error('Bid status error:', error);
        res.status(500).json({ message: 'Server error fetching bid status' });
    }
});

// Confirm payment
router.post('/confirm-payment/:bidId', auth, async (req, res) => {
    try {
        const { bidId } = req.params;

        const bid = await Bid.findById(bidId);
        if (!bid) {
            return res.status(404).json({ message: 'Bid not found' });
        }

        // Check if user owns the bid
        if (bid.user_id !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        if (bid.status !== 'paired') {
            return res.status(400).json({ message: 'Bid is not in a payable state' });
        }

        // Update bid status to paid
        await Bid.updateStatus(bidId, 'paid');

        // Update pairing payment status
        const pairings = await BidPairing.findByBidId(bidId);
        if (pairings.length > 0) {
            await BidPairing.updatePaymentStatus(pairings[0].id, 'paid');
        }

        res.json({ 
            message: 'Payment confirmed successfully',
            bid: {
                id: bid.id,
                status: 'paid'
            }
        });
    } catch (error) {
        console.error('Payment confirmation error:', error);
        res.status(500).json({ message: 'Server error confirming payment' });
    }
});

module.exports = router;