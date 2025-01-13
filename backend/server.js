const express = require("express");
const jsonwebtoken = require("jsonwebtoken");
const mysql= require("mysql");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");


// Import routes
const authRoutes = require("./routes/auth");

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/liveAuction", { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("Connected to MongoDB"))
    .catch(err => console.error("MongoDB connection error:", err));

// Routes
app.use("/auth", authRoutes);

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

