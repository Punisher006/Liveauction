const Joi = require('joi');

// User registration validation
const registerSchema = Joi.object({
    fullName: Joi.string()
        .trim()
        .min(2)
        .max(100)
        .required()
        .pattern(/^[a-zA-Z\s]+$/)
        .messages({
            'string.pattern.base': 'Full name can only contain letters and spaces',
            'string.empty': 'Full name is required',
            'string.min': 'Full name must be at least 2 characters long',
            'string.max': 'Full name cannot exceed 100 characters'
        }),

    email: Joi.string()
        .trim()
        .email()
        .required()
        .normalize()
        .messages({
            'string.email': 'Please provide a valid email address',
            'string.empty': 'Email is required'
        }),

    phone: Joi.string()
        .trim()
        .pattern(/^254[17]\d{8}$/)
        .required()
        .messages({
            'string.pattern.base': 'Phone number must be a valid Kenyan number (254XXXXXXXXX)',
            'string.empty': 'Phone number is required'
        }),

    password: Joi.string()
        .min(8)
        .max(100)
        .required()
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .messages({
            'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character',
            'string.min': 'Password must be at least 8 characters long',
            'string.max': 'Password cannot exceed 100 characters',
            'string.empty': 'Password is required'
        }),

    confirmPassword: Joi.string()
        .valid(Joi.ref('password'))
        .required()
        .messages({
            'any.only': 'Passwords do not match',
            'string.empty': 'Please confirm your password'
        })
});

// User login validation
const loginSchema = Joi.object({
    email: Joi.string()
        .trim()
        .email()
        .required()
        .normalize()
        .messages({
            'string.email': 'Please provide a valid email address',
            'string.empty': 'Email is required'
        }),

    password: Joi.string()
        .required()
        .messages({
            'string.empty': 'Password is required'
        })
});

// Bid placement validation
const bidSchema = Joi.object({
    amount: Joi.number()
        .min(500)
        .max(100000)
        .required()
        .messages({
            'number.min': 'Minimum bid amount is KES 500',
            'number.max': 'Maximum bid amount is KES 100,000',
            'number.base': 'Amount must be a valid number'
        }),

    investmentPeriod: Joi.number()
        .valid(4, 8, 12)
        .required()
        .messages({
            'any.only': 'Investment period must be 4, 8, or 12 days',
            'number.base': 'Investment period must be a valid number'
        })
});

// Payment confirmation validation
const paymentSchema = Joi.object({
    mpesaCode: Joi.string()
        .trim()
        .pattern(/^[A-Z0-9]{10}$/)
        .required()
        .messages({
            'string.pattern.base': 'MPESA code must be 10 alphanumeric characters',
            'string.empty': 'MPESA code is required'
        }),

    phone: Joi.string()
        .trim()
        .pattern(/^254[17]\d{8}$/)
        .required()
        .messages({
            'string.pattern.base': 'Phone number must be a valid Kenyan number',
            'string.empty': 'Phone number is required'
        })
});

// Transaction validation
const transactionSchema = Joi.object({
    amount: Joi.number()
        .positive()
        .max(1000000)
        .required()
        .messages({
            'number.positive': 'Amount must be positive',
            'number.max': 'Amount cannot exceed KES 1,000,000',
            'number.base': 'Amount must be a valid number'
        }),

    transactionType: Joi.string()
        .valid('deposit', 'withdrawal', 'investment', 'payout')
        .required()
        .messages({
            'any.only': 'Invalid transaction type',
            'string.empty': 'Transaction type is required'
        })
});

// ID validation (for route parameters)
const idSchema = Joi.object({
    id: Joi.number()
        .integer()
        .positive()
        .required()
        .messages({
            'number.base': 'ID must be a valid number',
            'number.positive': 'ID must be a positive number',
            'number.integer': 'ID must be an integer'
        })
});

module.exports = {
    registerSchema,
    loginSchema,
    bidSchema,
    paymentSchema,
    transactionSchema,
    idSchema
};