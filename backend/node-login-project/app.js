const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const loginRoutes = require('./login');
const registerRoutes = require('./register');

const app = express();

// Set up view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to parse POST data
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/login', loginRoutes);
app.use('/register', registerRoutes);

// Dashboard route
app.get('/dashboard', (req, res) => {
    res.render('dashboard');
});

// Start server
app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
