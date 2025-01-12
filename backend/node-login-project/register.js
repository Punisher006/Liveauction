const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('./config');
const router = express.Router();

router.post('/', (req, res) => {
    const { email, password } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10); // Hash the password

    db.query('INSERT INTO users (email, password) VALUES (?, ?)', [email, hashedPassword], (err, results) => {
        if (err) return res.status(500).send('Database error');
        res.send('Registration successful!');
    });
});

module.exports = router;
