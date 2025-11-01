const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const validator = require('validator');

// Security headers configuration
const securityHeaders = helmet({
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
});

// Rate limiting configurations
const createAuthLimiter = () => rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: {
        error: 'Too many login attempts from this IP, please try again after 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

const createApiLimiter = () => rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests from this IP, please try again after 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Input sanitization middleware
const sanitizeInput = (req, res, next) => {
    // Sanitize body
    if (req.body) {
        Object.keys(req.body).forEach(key => {
            if (typeof req.body[key] === 'string') {
                req.body[key] = validator.escape(validator.trim(req.body[key]));
            }
        });
    }

    // Sanitize query parameters
    if (req.query) {
        Object.keys(req.query).forEach(key => {
            if (typeof req.query[key] === 'string') {
                req.query[key] = validator.escape(validator.trim(req.query[key]));
            }
        });
    }

    next();
};

// Validate email format
const validateEmail = (email) => {
    return validator.isEmail(email) && 
           validator.isLength(email, { min: 5, max: 255 });
};

// Validate phone number (Kenya format)
const validatePhone = (phone) => {
    const kenyanPhoneRegex = /^(?:\+254|0)?[17]\d{8}$/;
    return kenyanPhoneRegex.test(phone.replace(/\s/g, ''));
};

// Validate password strength
const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return password.length >= minLength && 
           hasUpperCase && 
           hasLowerCase && 
           hasNumbers && 
           hasSpecialChar;
};

// SQL injection prevention
const sanitizeSQL = (input) => {
    if (typeof input !== 'string') return input;
    
    // Remove common SQL injection patterns
    const sqlInjectionPatterns = [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|EXEC|ALTER|CREATE|TRUNCATE)\b)/gi,
        /('|"|`|;|--|\/\*|\*\/|\\\*|\\\?)/g
    ];
    
    let sanitized = input;
    sqlInjectionPatterns.forEach(pattern => {
        sanitized = sanitized.replace(pattern, '');
    });
    
    return validator.escape(sanitized);
};

module.exports = {
    securityHeaders,
    createAuthLimiter,
    createApiLimiter,
    sanitizeInput,
    validateEmail,
    validatePhone,
    validatePassword,
    sanitizeSQL
};