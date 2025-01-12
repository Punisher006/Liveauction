const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('./config');
const router = express.Router();

router.post('/', (req, res) => {
    const { email, password } = req.body;

    db.query('SELECT id, email, password FROM users WHERE email = ?', [email], (err, results) => {
        if (err) return res.status(500).send('Database error');
        
        if (results.length > 0) {
            const user = results[0];

            bcrypt.compare(password, user.password, (err, isMatch) => {
                if (err) return res.status(500).send('Error verifying password');

                if (isMatch) {
                    res.redirect('/dashboard');
                } else {
                    res.send('Incorrect password!');
                }
            });
        } else {
            res.send('No user found with this email.');
        }
    });
});

module.exports = router;
