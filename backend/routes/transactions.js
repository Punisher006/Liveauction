const express = require('express');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Get user transactions
router.get('/my-transactions', auth, async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        
        const transactions = await Transaction.find({ userId: req.user._id })
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .populate('bidId', 'amount investmentPeriod');
            
        const total = await Transaction.countDocuments({ userId: req.user._id });
        
        res.json({
            transactions,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        console.error('Get transactions error:', error);
        res.status(500).json({ message: 'Server error fetching transactions' });
    }
});

// Create a transaction (for deposits, etc.)
router.post('/create', auth, async (req, res) => {
    try {
        const { transactionType, amount, mpesaCode, mpesaPhone, description } = req.body;
        
        const user = await User.findById(req.user._id);
        const balanceBefore = user.balance;
        let balanceAfter = balanceBefore;
        
        // Calculate new balance based on transaction type
        if (transactionType === 'deposit') {
            balanceAfter = balanceBefore + amount;
        } else if (transactionType === 'withdrawal') {
            if (balanceBefore < amount) {
                return res.status(400).json({ message: 'Insufficient balance' });
            }
            balanceAfter = balanceBefore - amount;
        }
        
        const transaction = new Transaction({
            userId: req.user._id,
            transactionType,
            amount,
            balanceBefore,
            balanceAfter,
            mpesaCode,
            mpesaPhone,
            description,
            status: 'completed' // For demo purposes
        });
        
        await transaction.save();
        
        // Update user balance
        user.balance = balanceAfter;
        await user.save();
        
        res.status(201).json({
            message: 'Transaction completed successfully',
            transaction: {
                id: transaction._id,
                type: transaction.transactionType,
                amount: transaction.amount,
                balanceAfter: transaction.balanceAfter,
                createdAt: transaction.createdAt
            }
        });
    } catch (error) {
        console.error('Create transaction error:', error);
        res.status(500).json({ message: 'Server error creating transaction' });
    }
});

module.exports = router;