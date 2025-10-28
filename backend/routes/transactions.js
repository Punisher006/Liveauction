const express = require('express');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Get user transactions
router.get('/my-transactions', auth, async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        
        const transactions = await Transaction.findByUserId(req.user.id, parseInt(limit), parseInt(page));
        const total = await Transaction.countByUserId(req.user.id);
        
        res.json({
            transactions,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
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
        
        const user = await User.findById(req.user.id);
        const balanceBefore = user.balance || 0;
        let balanceAfter = balanceBefore;
        
        // Calculate new balance based on transaction type
        if (transactionType === 'deposit') {
            balanceAfter = balanceBefore + parseFloat(amount);
        } else if (transactionType === 'withdrawal') {
            if (balanceBefore < parseFloat(amount)) {
                return res.status(400).json({ message: 'Insufficient balance' });
            }
            balanceAfter = balanceBefore - parseFloat(amount);
        } else if (transactionType === 'investment') {
            if (balanceBefore < parseFloat(amount)) {
                return res.status(400).json({ message: 'Insufficient balance for investment' });
            }
            balanceAfter = balanceBefore - parseFloat(amount);
        }
        
        const transaction = await Transaction.create({
            userId: req.user.id,
            transactionType,
            amount: parseFloat(amount),
            balanceBefore,
            balanceAfter,
            mpesaCode,
            mpesaPhone,
            description,
            status: 'completed'
        });
        
        // Update user balance
        await User.updateBalance(req.user.id, balanceAfter);
        
        res.status(201).json({
            message: 'Transaction completed successfully',
            transaction: {
                id: transaction,
                type: transactionType,
                amount: parseFloat(amount),
                balanceAfter: balanceAfter,
                createdAt: new Date()
            }
        });
    } catch (error) {
        console.error('Create transaction error:', error);
        res.status(500).json({ message: 'Server error creating transaction' });
    }
});

module.exports = router;