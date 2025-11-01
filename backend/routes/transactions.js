const express = require('express');
const { body, validationResult } = require('express-validator');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const auth = require('../middleware/auth');
const logger = require('../middleware/logger');

const router = express.Router();

// Get user transactions
router.get('/my-transactions', auth, async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        
        const transactions = await Transaction.findByUserId(req.user.id, parseInt(page), parseInt(limit));
        const total = await Transaction.countByUserId(req.user.id);
        
        res.json({
            success: true,
            data: {
                transactions,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        logger.error('Get transactions error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching transactions'
        });
    }
});

// Create a transaction (for deposits, etc.)
router.post('/create', auth, [
    body('transactionType')
        .isIn(['deposit', 'withdrawal', 'investment', 'payout', 'commission'])
        .withMessage('Invalid transaction type'),
    body('amount')
        .isFloat({ min: 1 })
        .withMessage('Amount must be a positive number'),
    body('mpesaCode')
        .optional()
        .isLength({ min: 10, max: 20 })
        .withMessage('MPesa code must be between 10 and 20 characters')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { transactionType, amount, mpesaCode, mpesaPhone, description } = req.body;
        
        const user = await User.findById(req.user.id);
        const balanceBefore = user.balance;
        let balanceAfter = balanceBefore;
        
        // Calculate new balance based on transaction type
        if (transactionType === 'deposit') {
            balanceAfter = balanceBefore + parseFloat(amount);
        } else if (transactionType === 'withdrawal') {
            if (balanceBefore < parseFloat(amount)) {
                return res.status(400).json({
                    success: false,
                    message: 'Insufficient balance'
                });
            }
            balanceAfter = balanceBefore - parseFloat(amount);
        } else if (transactionType === 'investment') {
            if (balanceBefore < parseFloat(amount)) {
                return res.status(400).json({
                    success: false,
                    message: 'Insufficient balance for investment'
                });
            }
            balanceAfter = balanceBefore - parseFloat(amount);
        } else if (transactionType === 'payout') {
            balanceAfter = balanceBefore + parseFloat(amount);
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
        
        logger.info('Transaction created', {
            userId: req.user.id,
            transactionId: transaction.id,
            type: transactionType,
            amount: amount
        });

        res.status(201).json({
            success: true,
            message: 'Transaction completed successfully',
            data: {
                transaction: {
                    id: transaction.id,
                    type: transaction.transactionType,
                    amount: transaction.amount,
                    balanceAfter: transaction.balanceAfter,
                    createdAt: transaction.created_at
                }
            }
        });
    } catch (error) {
        logger.error('Create transaction error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error creating transaction'
        });
    }
});

// Get transaction by ID
router.get('/:id', auth, async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id);
        
        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
        }

        // Check if user owns the transaction
        if (transaction.user_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        res.json({
            success: true,
            data: transaction
        });
    } catch (error) {
        logger.error('Get transaction error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching transaction'
        });
    }
});

module.exports = router;