const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/liveauction';
mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(async () => {
    console.log('MongoDB connected successfully');
    
    // Initialize database with default data
    const initDatabase = require('./scripts/initDatabase');
    await initDatabase();
})
.catch(err => console.error('MongoDB connection error:', err));

// Models
const User = require('./models/User');
const Bid = require('./models/Bid');
const AuctionSession = require('./models/AuctionSession');
const BidPairing = require('./models/BidPairing');
const Transaction = require('./models/Transaction');
const SystemSetting = require('./models/SystemSetting');

// Auth Middleware
const auth = require('./middleware/auth');

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/bids', require('./routes/bids'));
app.use('/api/auctions', require('./routes/auctions'));
app.use('/api/transactions', require('./routes/transactions'));

// Basic route
app.get('/', (req, res) => {
    res.json({ 
        message: 'Live Auction API is running!',
        database: 'Connected to Live Auction Database',
        timestamp: new Date().toISOString()
    });
});

// Health check route with database status
app.get('/health', async (req, res) => {
    try {
        const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
        const userCount = await User.countDocuments();
        const bidCount = await Bid.countDocuments();
        
        res.json({
            status: 'OK',
            database: dbStatus,
            users: userCount,
            bids: bidCount,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            status: 'ERROR',
            error: error.message
        });
    }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`API Base URL: http://localhost:${PORT}/api`);
});