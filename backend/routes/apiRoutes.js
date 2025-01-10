// apiRoutes.js

const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');

// Define a POST route for submitting the contact form
router.post('/submit', contactController.submitContactForm);

module.exports = router;
