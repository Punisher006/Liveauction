const express = require('express');
const SystemSetting = require('../models/SystemSetting');
const auth = require('../middleware/auth');

const router = express.Router();

// Get system settings
router.get('/settings', async (req, res) => {
    try {
        const settings = await SystemSetting.findAll();
        res.json(settings);
    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({ message: 'Server error fetching system settings' });
    }
});

// Get investment settings
router.get('/investment-settings', async (req, res) => {
    try {
        const settings = await SystemSetting.getInvestmentSettings();
        res.json(settings);
    } catch (error) {
        console.error('Get investment settings error:', error);
        res.status(500).json({ message: 'Server error fetching investment settings' });
    }
});

module.exports = router;