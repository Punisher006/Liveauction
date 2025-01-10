// contactController.js

// This function handles the contact form submission
exports.submitContactForm = (req, res) => {
    // Destructure data from the request body
    const { name, email, message } = req.body;

    // Basic validation to ensure the required fields are provided
    if (!name || !email || !message) {
        return res.status(400).json({ error: 'All fields (name, email, message) are required.' });
    }

    // Logic to handle the form submission (e.g., save to database or log it)
    // For now, we'll simply log the data to the console
    console.log('Contact Form Submitted:', {
        name,
        email,
        message,
    });

    // Simulate saving to a database or sending an email (optional)
    // e.g., saveToDatabase(name, email, message); or sendEmail(name, email, message);

    // Send a success response
    return res.status(200).json({
        success: 'Your message has been sent successfully. Thank you for contacting us!',
    });
};
