const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database', 'users.sqlite');

function getDb() {
  return new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
    if (err) console.error('Database connection error:', err);
  });
}

// Registration
router.post('/register', async (req, res) => {
  const { username, password, confirm_password, real_name } = req.body;

  if (password !== confirm_password) {
    return res.status(400).render('register', { error: 'Passwords do not match' });
  }

  const db = getDb();

  db.get('SELECT username FROM users WHERE username = ?', [username], async (err, existingUser) => {
    if (err) {
      db.close();
      return res.status(500).render('register', { error: 'Database error' });
    }

    if (existingUser) {
      db.close();
      return res.status(400).render('register', { error: 'Username already taken' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    db.run('INSERT INTO users (username, password, real_name) VALUES (?, ?, ?)',
      [username, hashedPassword, real_name || null],
      function(err) {
        db.close();
        if (err) return res.status(500).render('register', { error: 'Error creating user' });

        req.session.userId = this.lastID;
        req.session.username = username;

        res.redirect('/profile');
      });
  });
});

// Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const db = getDb();

  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (err) {
      db.close();
      return res.status(500).render('login', { error: 'Database error' });
    }

    if (!user || !(await bcrypt.compare(password, user.password))) {
      db.close();
      return res.status(401).render('login', { error: 'Invalid username or password' });
    }

    req.session.userId = user.id;
    req.session.username = user.username;

    db.close();
    res.redirect('/profile');
  });
});

module.exports = router;
