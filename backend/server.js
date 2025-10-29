const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const passwordResetRoutes = require('./routes/passwordReset');
require('dotenv').config();

const { testConnection, initializeDatabase } = require('./config/database');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database connection check
const initializeApp = async () => {
    const connected = await testConnection();
    if (connected) {
        await initializeDatabase();
    } else {
        console.log('⚠️  Starting without database connection');
    }
};

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/bids', require('./routes/bids'));
app.use('/api/auctions', require('./routes/auctions'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/system', require('./routes/system'));
app.use('/api/password-reset', require('./routes/passwordReset'));

// Basic route
app.get('/', (req, res) => {
    res.json({ 
        message: 'Live Auction API is running!',
        database: 'MySQL',
        timestamp: new Date().toISOString()
    });
});

// Health check route
app.get('/health', async (req, res) => {
    try {
        const dbStatus = await testConnection();
        
        res.json({
            status: 'OK',
            database: dbStatus ? 'connected' : 'disconnected',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development'
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
app.listen(PORT, async () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
    
    await initializeApp();
});