const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database connection helper
function getDb() {
    return new sqlite3.Database(
        path.join(__dirname, '..', 'databases', 'users.sqlite'),
        sqlite3.OPEN_READWRITE,
        (err) => {
            if (err) console.error('Database connection error:', err);
        }
    );
}

router.post('/register', async (req, res) => {
    const { username, password, confirm_password, real_name } = req.body;

    if (password !== confirm_password) {
        return res.status(400).json({ error: 'Passwords do not match' });
    }

    const db = getDb();

    db.get('SELECT username FROM users WHERE username = ?', [username], (err, user) => {
        if (err) {
            console.error(err);
            db.close();
            return res.status(500).json({ error: 'Database error' });
        }

        if (user) {
            db.close();
            return res.status(400).json({ error: 'Username already exists' });
        }

        const stmt = db.prepare('INSERT INTO users (username, password, real_name) VALUES (?, ?, ?)');
        stmt.run([username, password, real_name || null], function(err) {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Error creating user' });
            }

            res.status(200).json({ 
                success: true, 
                message: 'Registration successful! You may now log in.' 
            });
        });

        stmt.finalize();
        db.close();
    });
});
//  store the user ID in the session when they log in
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const db = getDb();

    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (!user || password !== user.password) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Set user session
        req.session.userId = user.id;
        req.session.username = user.username;
        
        // Return success with redirect instruction
        res.status(200).json({ 
            success: true, 
            redirect: '/settings' 
        });
    });

    db.close();
});

module.exports = router;
