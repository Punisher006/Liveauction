const Joi = require('joi');

// User registration validation
const registerSchema = Joi.object({
    fullName: Joi.string().trim().min(2).max(100).required(),
    email: Joi.string().trim().email().required(),
    phone: Joi.string().trim().pattern(/^254[17]\d{8}$/).required(),
    password: Joi.string().min(8).max(100).required(),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required()
});

// User login validation
const loginSchema = Joi.object({
    email: Joi.string().trim().email().required(),
    password: Joi.string().required()
});

// Bid placement validation
const bidSchema = Joi.object({
    amount: Joi.number().min(500).max(100000).required(),
    investmentPeriod: Joi.number().valid(4, 8, 12).required()
});

module.exports = {
    registerSchema,
    loginSchema,
    bidSchema
};