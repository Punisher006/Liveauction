const express = require('express');
const compression = require('compression');
const cookieParser = require('cookie-parser');
require('dotenv').config();

// Security middleware
const {
    securityHeaders,
    authLimiter,
    bidLimiter,
    apiLimiter,
    bruteForceLimiter,
    corsOptions,
    validateInput,
    sqlInjectionCheck,
    xssPrevention,
    mongoSanitize,
    xssClean,
    hpp
} = require('./middleware/security');

const { testConnection, initializeDatabase } = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Security Middleware (Order is important!)
app.use(securityHeaders);
app.use(compression());
app.use(cors(corsOptions));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());
app.use(mongoSanitize);
app.use(xssClean);
app.use(hpp);

// Custom security middleware
app.use(sqlInjectionCheck);
app.use(xssPrevention);

// Rate limiting (apply after security middleware)
app.use('/api/auth/', authLimiter);
app.use('/api/bids/place', bidLimiter);
app.use('/api/', apiLimiter);
app.use('/api/', bruteForceLimiter);

// Trust proxy (if behind reverse proxy like Nginx)
app.set('trust proxy', 1);

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - IP: ${req.ip}`);
    next();
});

// Routes (with input validation)
const { 
    registerSchema, 
    loginSchema, 
    bidSchema 
} = require('./validation/schemas');

app.use('/api/auth', require('./routes/auth'));
app.use('/api/bids', validateInput(bidSchema), require('./routes/bids'));
app.use('/api/auctions', require('./routes/auctions'));
app.use('/api/transactions', require('./routes/transactions'));

// Health check (no security for basic health checks)
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Global error handler (must be last)
app.use(errorHandler);

// Process termination handlers
process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    console.error(err.name, err.message);
    process.exit(1);
});

process.on('unhandledRejection', (err) => {
    console.error('UNHANDLED REJECTION! 💥 Shutting down...');
    console.error(err.name, err.message);
    server.close(() => {
        process.exit(1);
    });
});

process.on('SIGTERM', () => {
    console.log('👋 SIGTERM RECEIVED. Shutting down gracefully');
    server.close(() => {
        console.log('💥 Process terminated!');
    });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, async () => {
    console.log(`🚀 Secure server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    
    // Test database connection
    const dbConnected = await testConnection();
    if (dbConnected) {
        await initializeDatabase();
        console.log('✅ Database connected and initialized');
    } else {
        console.log('❌ Database connection failed');
    }
});

module.exports = server;