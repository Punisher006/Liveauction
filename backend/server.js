const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const { securityHeaders, authLimiter, apiLimiter } = require('./middleware/security');
const { testConnection, initializeDatabase } = require('./config/database');

const app = express();

// Middleware
app.use(securityHeaders);
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
}));

// Rate limiting
app.use('/api/auth/', authLimiter);
app.use('/api/', apiLimiter);

// Body parsing with limits
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Static files with cache control
app.use(express.static('public', {
    maxAge: '1d',
    etag: false
}));

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