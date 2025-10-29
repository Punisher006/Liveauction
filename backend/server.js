const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { testConnection, initializeDatabase } = require('./config/database');

const app = express();

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5500', 'http://127.0.0.1:5500'],
    credentials: true
}));
app.use(express.json());

// Test database connection on startup
const initializeApp = async () => {
    console.log('🔌 Testing database connection...');
    const connected = await testConnection();
    if (connected) {
        await initializeDatabase();
        console.log('✅ Database initialization completed');
    } else {
        console.log('⚠️  Starting without database connection');
    }
};

// Basic route - Test if server is responding
app.get('/', (req, res) => {
    res.json({ 
        message: 'Live Auction API is running!',
        timestamp: new Date().toISOString(),
        status: 'OK'
    });
});

// Health check with detailed info
app.get('/health', async (req, res) => {
    const healthcheck = {
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        database: 'checking...'
    };

    try {
        const dbConnected = await testConnection();
        healthcheck.database = dbConnected ? 'connected' : 'disconnected';
        
        if (!dbConnected) {
            healthcheck.status = 'WARNING';
            healthcheck.message = 'Database connection failed';
        }
    } catch (error) {
        healthcheck.database = 'error';
        healthcheck.status = 'ERROR';
        healthcheck.message = error.message;
    }

    res.json(healthcheck);
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/bids', require('./routes/bids'));
app.use('/api/auctions', require('./routes/auctions'));
app.use('/api/transactions', require('./routes/transactions'));

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ 
        success: false,
        message: 'API endpoint not found',
        availableEndpoints: [
            'GET  /',
            'GET  /health',
            'POST /api/auth/register',
            'POST /api/auth/login',
            'GET  /api/auth/me',
            'POST /api/bids/place',
            'GET  /api/bids/status',
            'POST /api/bids/confirm-payment/:id'
        ]
    });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('🚨 Server Error:', error);
    res.status(500).json({ 
        success: false,
        message: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', async () => {
    console.log('🚀 Starting Live Auction Server...');
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Server URL: http://localhost:${PORT}`);
    console.log(`📊 Health Check: http://localhost:${PORT}/health`);
    console.log(`⏰ Started at: ${new Date().toISOString()}`);
    
    await initializeApp();
    
    console.log('✅ Server started successfully!');
    console.log('📝 Available endpoints:');
    console.log('   GET  /');
    console.log('   GET  /health');
    console.log('   POST /api/auth/register');
    console.log('   POST /api/auth/login');
    console.log('   GET  /api/auth/me');
    console.log('   POST /api/bids/place');
    console.log('   GET  /api/bids/status');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server gracefully...');
    process.exit(0);
});

process.on('uncaughtException', (error) => {
    console.error('🚨 Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});