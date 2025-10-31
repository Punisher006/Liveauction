const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors');

// Security headers with Helmet
const securityHeaders = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"]
        }
    },
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: { policy: "same-origin" },
    crossOriginResourcePolicy: { policy: "same-origin" },
    dnsPrefetchControl: { allow: false },
    frameguard: { action: 'deny' },
    hidePoweredBy: true,
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    },
    ieNoOpen: true,
    noSniff: true,
    permittedCrossDomainPolicies: { permittedPolicies: "none" },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" }
});

// Rate limiting configurations
const createRateLimit = (windowMs, max, message) => rateLimit({
    windowMs,
    max,
    message: { 
        success: false, 
        message 
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message,
            retryAfter: Math.ceil(windowMs / 1000)
        });
    }
});

// Specific rate limiters
const authLimiter = createRateLimit(
    15 * 60 * 1000, // 15 minutes
    5, // 5 attempts
    'Too many login attempts from this IP, please try again after 15 minutes.'
);

const bidLimiter = createRateLimit(
    60 * 1000, // 1 minute
    3, // 3 bids per minute
    'Too many bid attempts. Please wait a moment.'
);

const apiLimiter = createRateLimit(
    15 * 60 * 1000, // 15 minutes
    100, // 100 requests per 15 minutes
    'Too many requests from this IP, please try again later.'
);

const bruteForceLimiter = createRateLimit(
    60 * 60 * 1000, // 1 hour
    10, // 10 requests per hour per IP
    'Too many requests, please try again in an hour.'
);

// CORS configuration
const corsOptions = {
    origin: (origin, callback) => {
        const allowedOrigins = [
            process.env.CLIENT_URL,
            'https://your-domain.com',
            'https://www.your-domain.com'
        ];
        
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'X-CSRF-Token'
    ],
    maxAge: 86400 // 24 hours
};

// Input validation middleware
const validateInput = (schema) => (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: error.details.map(detail => detail.message)
        });
    }
    next();
};

// SQL Injection prevention for MySQL
const sqlInjectionCheck = (req, res, next) => {
    const sqlInjectionPatterns = [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|EXEC)\b)/i,
        /('|"|;|--|\/\*|\*\/|@@|@|char|nchar|varchar|nvarchar)/i,
        /(\b(OR|AND)\b\s+\d+\s*=\s*\d+)/i,
        /(\b(WAITFOR|DELAY)\b\s+['"]\d+:\d+:\d+['"])/i,
        /(xp_|sp_|fn_)/i
    ];

    const checkObject = (obj) => {
        for (let key in obj) {
            if (typeof obj[key] === 'string') {
                for (let pattern of sqlInjectionPatterns) {
                    if (pattern.test(obj[key])) {
                        return true;
                    }
                }
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                if (checkObject(obj[key])) return true;
            }
        }
        return false;
    };

    if (checkObject(req.body) || checkObject(req.query) || checkObject(req.params)) {
        // Log the attempt
        console.warn('SQL Injection attempt detected:', {
            ip: req.ip,
            method: req.method,
            url: req.url,
            body: req.body,
            query: req.query,
            params: req.params
        });

        return res.status(400).json({
            success: false,
            message: 'Invalid input detected'
        });
    }

    next();
};

// XSS Prevention
const xssPrevention = (req, res, next) => {
    const xssPatterns = [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,
        /<iframe/gi,
        /<object/gi,
        /<embed/gi,
        /<applet/gi,
        /<meta/gi,
        /<link/gi,
        /vbscript:/gi
    ];

    const sanitizeObject = (obj) => {
        for (let key in obj) {
            if (typeof obj[key] === 'string') {
                let sanitized = obj[key];
                for (let pattern of xssPatterns) {
                    sanitized = sanitized.replace(pattern, '');
                }
                // Remove potentially dangerous characters
                sanitized = sanitized.replace(/[<>]/g, '');
                obj[key] = sanitized;
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                sanitizeObject(obj[key]);
            }
        }
    };

    sanitizeObject(req.body);
    sanitizeObject(req.query);
    sanitizeObject(req.params);

    next();
};

// CSRF Protection (for forms if needed)
const csrfProtection = (req, res, next) => {
    if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
        const csrfToken = req.headers['x-csrf-token'] || req.body._csrf;
        const sessionToken = req.session?.csrfToken;
        
        if (!csrfToken || csrfToken !== sessionToken) {
            return res.status(403).json({
                success: false,
                message: 'Invalid CSRF token'
            });
        }
    }
    next();
};

module.exports = {
    securityHeaders,
    authLimiter,
    bidLimiter,
    apiLimiter,
    bruteForceLimiter,
    corsOptions,
    validateInput,
    sqlInjectionCheck,
    xssPrevention,
    csrfProtection,
    mongoSanitize: mongoSanitize(),
    xssClean: xss(),
    hpp: hpp()
};