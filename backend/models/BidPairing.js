const mongoose = require('mongoose');

const bidPairingSchema = new mongoose.Schema({
    bidId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bid',
        required: true
    },
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    buyerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    sellerPhone: {
        type: String,
        required: true
    },
    sellerMpesaName: {
        type: String,
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'confirmed', 'disputed'],
        default: 'pending'
    },
    paymentDeadline: {
        type: Date,
        required: true
    },
    paidAt: {
        type: Date
    },
    confirmedAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Update related bid status when pairing is created
bidPairingSchema.post('save', async function() {
    const Bid = mongoose.model('Bid');
    await Bid.findByIdAndUpdate(this.bidId, { status: 'paired' });
});

module.exports = mongoose.model('BidPairing', bidPairingSchema);