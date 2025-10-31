const jwt = require('jsonwebtoken');
const { executeQuery, userQueries } = require('../config/database');
const { promisify } = require('util');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES = process.env.JWT_EXPIRES || '24h';

// Blacklist for tokens (in production, use Redis)
const tokenBlacklist = new Set();

const auth = async (req, res, next) => {
    try {
        // 1) Get token from header
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'You are not logged in! Please log in to get access.'
            });
        }

        // 2) Check if token is blacklisted
        if (tokenBlacklist.has(token)) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token. Please log in again.'
            });
        }

        // 3) Verify token
        const decoded = await promisify(jwt.verify)(token, JWT_SECRET);

        // 4) Check if user still exists
        const users = await executeQuery(userQueries.findById, [decoded.userId]);
        const currentUser = users[0];

        if (!currentUser) {
            return res.status(401).json({
                success: false,
                message: 'The user belonging to this token no longer exists.'
            });
        }

        // 5) Check if user changed password after token was issued
        if (currentUser.passwordChangedAt) {
            const changedTimestamp = parseInt(
                currentUser.passwordChangedAt.getTime() / 1000,
                10
            );

            if (decoded.iat < changedTimestamp) {
                return res.status(401).json({
                    success: false,
                    message: 'User recently changed password! Please log in again.'
                });
            }
        }

        // 6) Check if account is active
        if (currentUser.account_status !== 'active') {
            return res.status(401).json({
                success: false,
                message: 'Your account has been suspended. Please contact support.'
            });
        }

        // GRANT ACCESS TO PROTECTED ROUTE
        req.user = currentUser;
        req.token = token;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token. Please log in again.'
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Your token has expired! Please log in again.'
            });
        }

        console.error('Auth middleware error:', error);
        return res.status(500).json({
            success: false,
            message: 'Something went wrong with authentication'
        });
    }
};

// Generate JWT token
const signToken = (userId) => {
    return jwt.sign(
        { userId },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES }
    );
};

// Add token to blacklist
const blacklistToken = (token) => {
    tokenBlacklist.add(token);
    
    // Remove token from blacklist after expiration (optional cleanup)
    setTimeout(() => {
        tokenBlacklist.delete(token);
    }, 24 * 60 * 60 * 1000); // 24 hours
};

// Restrict to certain roles (if you implement roles)
const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to perform this action'
            });
        }
        next();
    };
};

module.exports = {
    auth,
    signToken,
    blacklistToken,
    restrictTo
};