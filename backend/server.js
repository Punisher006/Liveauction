const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/liveauction';
mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

// Models
const User = require('./models/User');
const Bid = require('./models/Bid');

// Auth Middleware
const auth = require('./middleware/auth');

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/bids', require('./routes/bids'));

// Basic route
app.get('/', (req, res) => {
    res.json({ message: 'Live Auction API is running!' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});