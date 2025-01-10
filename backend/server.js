const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const apiRoutes = require('./routes/apiRoutes'); // Import your API routes
const connectDB = require('./config/database');  // Import the DB connection function

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Serve static files (frontend)
app.use(express.static('public'));

// Use API routes
app.use('/api', apiRoutes); // This will map all the routes defined in apiRoutes.js

// API endpoint for contact form submission
app.post('/submit', (req, res) => {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    console.log('Received Contact Form:', { name, email, message });

    // Here you would typically save the data to the database or send an email
    // Example for saving the contact form data to MongoDB (using a Model)
    // const Contact = require('./models/contact');
    // const newContact = new Contact({ name, email, message });
    // newContact.save()
    //     .then(() => res.status(200).json({ success: 'Message sent successfully!' }))
    //     .catch((err) => res.status(500).json({ error: 'Failed to save message.' }));

    res.status(200).json({ success: 'Message sent successfully!' });
});

// Start server
connectDB(); // Connect to the database first
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
