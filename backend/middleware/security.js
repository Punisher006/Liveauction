const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const express = require('express');

// Security headers
const securityHeaders = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://your-domain.com"]
        }
    },
    crossOriginEmbedderPolicy: false
});

// Rate limiting
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: 'Too many login attempts, please try again later.'
});

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

// Input validation middleware
const validateBidInput = (req, res, next) => {
    const { amount, investmentPeriod } = req.body;
    
    if (!amount || !investmentPeriod) {
        return res.status(400).json({ message: 'Amount and investment period are required' });
    }
    
    if (amount < 500 || amount > 100000) {
        return res.status(400).json({ message: 'Amount must be between 500 and 100000' });
    }
    
    if (![4, 8, 12].includes(parseInt(investmentPeriod))) {
        return res.status(400).json({ message: 'Invalid investment period' });
    }
    
    next();
};

module.exports = {
    securityHeaders,
    authLimiter,
    apiLimiter,
    validateBidInput
};