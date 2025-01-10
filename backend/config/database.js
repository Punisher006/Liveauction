const mongoose = require('mongoose');

// MongoDB connection string (replace with your actual connection string)
const dbURI = 'mongodb://localhost:27017/liveAuctionDB';  // Local MongoDB instance

// Function to connect to the database
const connectDB = async () => {
    try {
        await mongoose.connect(dbURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connected successfully!');
    } catch (err) {
        console.error('Error connecting to MongoDB:', err);
        process.exit(1); // Exit process with failure
    }
};

module.exports = connectDB;
