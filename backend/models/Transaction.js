const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    bidId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bid'
    },
    transactionType: {
        type: String,
        enum: ['deposit', 'withdrawal', 'investment', 'payout', 'commission'],
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    balanceBefore: {
        type: Number,
        required: true
    },
    balanceAfter: {
        type: Number,
        required: true
    },
    mpesaCode: {
        type: String
    },
    mpesaPhone: {
        type: String
    },
    description: {
        type: String
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'cancelled'],
        default: 'pending'
    }
}, {
    timestamps: true
});

// Update user balance when transaction is completed
transactionSchema.post('save', async function() {
    if (this.status === 'completed') {
        const User = mongoose.model('User');
        await User.findByIdAndUpdate(this.userId, { 
            balance: this.balanceAfter 
        });
    }
});

module.exports = mongoose.model('Transaction', transactionSchema);