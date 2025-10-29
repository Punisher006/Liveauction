const express = require('express');
const { pool } = require('../config/database');
const router = express.Router();

router.get('/health', async (req, res) => {
    const healthcheck = {
        uptime: process.uptime(),
        message: 'OK',
        timestamp: Date.now(),
        checks: {}
    };

    try {
        // Database check
        const [dbResult] = await pool.execute('SELECT 1');
        healthcheck.checks.database = 'OK';
    } catch (error) {
        healthcheck.checks.database = 'ERROR';
        healthcheck.message = 'Database connection failed';
        return res.status(503).json(healthcheck);
    }

    // Memory usage
    healthcheck.checks.memory = {
        used: process.memoryUsage().heapUsed,
        total: process.memoryUsage().heapTotal
    };

    res.json(healthcheck);
});

module.exports = router;