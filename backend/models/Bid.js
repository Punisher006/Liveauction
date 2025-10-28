const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    auctionSessionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AuctionSession',
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 500,
        max: 100000
    },
    investmentPeriod: {
        type: Number,
        required: true,
        enum: [4, 8, 12]
    },
    expectedROI: {
        type: Number,
        required: true
    },
    expectedReturn: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'paired', 'paid', 'completed', 'cancelled', 'expired'],
        default: 'pending'
    },
    bidDate: {
        type: Date,
        default: Date.now
    },
    bidTime: {
        type: String, // Store as "HH:MM:SS"
        required: true
    },
    paymentDeadline: {
        type: Date
    },
    completedAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Calculate expected return and ROI before saving
bidSchema.pre('save', function(next) {
    const roiRates = { 4: 0.3, 8: 0.6, 12: 0.95 };
    this.expectedROI = roiRates[this.investmentPeriod] * 100;
    this.expectedReturn = this.amount + (this.amount * roiRates[this.investmentPeriod]);
    
    // Set payment deadline (24 hours from creation)
    if (this.isNew) {
        this.paymentDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000);
    }
    
    next();
});

// Update bid status based on payment deadline
bidSchema.methods.checkPaymentStatus = function() {
    if (this.status === 'paired' && this.paymentDeadline < new Date()) {
        this.status = 'expired';
        return this.save();
    }
    return Promise.resolve(this);
};

module.exports = mongoose.model('Bid', bidSchema);