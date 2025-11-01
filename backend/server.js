const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
require('dotenv').config();

// Database
const { testConnection, initializeDatabase } = require('./config/database');

// Error handling
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');

const app = express();

// Security Middleware
app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"]
        }
    }
}));

// CORS configuration
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: {
        error: 'Too many login attempts from this IP, please try again after 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        error: 'Too many requests from this IP, please try again after 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

app.use('/api/auth/', authLimiter);
app.use('/api/', apiLimiter);

// Body parsing with limits
app.use(express.json({ 
    limit: '10kb'
}));
app.use(express.urlencoded({ 
    extended: true, 
    limit: '10kb'
}));

// Compression
app.use(compression());

// Request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl} - IP: ${req.ip}`);
    next();
});

// Health check
app.get('/health', async (req, res) => {
    const healthcheck = {
        uptime: process.uptime(),
        message: 'OK',
        timestamp: Date.now(),
        checks: {}
    };

    try {
        const dbConnected = await testConnection();
        healthcheck.checks.database = dbConnected ? 'OK' : 'ERROR';
    } catch (error) {
        healthcheck.checks.database = 'ERROR';
    }

    res.status(healthcheck.checks.database === 'OK' ? 200 : 503).json(healthcheck);
});

// API Routes - IMPORTANT: Import routes correctly
const authRoutes = require('./routes/auth');
const bidsRoutes = require('./routes/bids');
const auctionsRoutes = require('./routes/auctions');
const transactionsRoutes = require('./routes/transactions');

app.use('/api/auth', authRoutes);
app.use('/api/bids', bidsRoutes);
app.use('/api/auctions', auctionsRoutes);
app.use('/api/transactions', transactionsRoutes);

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

// Process event handlers
process.on('unhandledRejection', (err, promise) => {
    console.error('Unhandled Rejection at:', promise, 'Reason:', err);
    process.exit(1);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception thrown:', err);
    process.exit(1);
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        const dbConnected = await testConnection();
        if (!dbConnected) {
            console.error('Failed to connect to database');
            process.exit(1);
        }

        await initializeDatabase();

        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📊 Health: http://localhost:${PORT}/health`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();