const express = require('express');
const bcrypt = require('bcrypt');//using bcrypt to hash and compare passwords securely
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'databases', 'users.sqlite');

function getDb() {
    return new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
        if (err) console.error('Database connection error:', err);
    });
}

//registration
router.post('/register', async (req, res) => {
    const { username, password, confirm_password, real_name } = req.body;

    if (password !== confirm_password) {
        return res.status(400).json({ error: 'Passwords do not match' });
    }

    const db = getDb();

    db.get('SELECT username FROM users WHERE username = ?', [username], async (err, existingUser) => {
        if (err) return res.status(500).json({ error: 'Database error' });

        if (existingUser) {
            return res.status(400).json({ error: 'Username already taken' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        //inserts the new user into the database with the hashed pass
        db.run('INSERT INTO users (username, password, real_name) VALUES (?, ?, ?)', 
            [username, hashedPassword, real_name || null], 
            function(err) {
                db.close();
                if (err) return res.status(500).json({ error: 'Error creating user' });

                res.status(200).json({ success: true, message: 'Registration successful!' });
            });
    });
});

//login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const db = getDb();

    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
        if (err) {
            db.close();
            return res.status(500).json({ error: 'Database error' });
        }

        if (!user || !(await bcrypt.compare(password, user.password))) {
            db.close();
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        req.session.userId = user.id;
        req.session.username = user.username;

        db.close();
        res.status(200).json({ success: true, redirect: '/settings' });
    });
});

module.exports = router;
