const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database', 'products.db');

router.get('/', (req, res) => {
  const db = new sqlite3.Database(dbPath);

  db.all('SELECT * FROM products LIMIT 6', [], (err, products) => {
    db.close();

    if (err) {
      console.error('Database error:', err);
      return res.status(500).send('Database error');
    }

    res.render('index', { 
      products,
      userId: req.session.userId,
      username: req.session.username,
      message: req.query.message
    });
  });
});

router.get('/search', (req, res) => {
  const keyword = req.query.q || '';
  const db = new sqlite3.Database(dbPath);

  db.all(
    'SELECT * FROM products WHERE title LIKE ? OR description LIKE ?',
    [`%${keyword}%`, `%${keyword}%`],
    (err, products) => {
      db.close();

      if (err) {
        console.error('Search error:', err);
        return res.status(500).send('Search error');
      }

      res.render('index', {
        products,
        searchQuery: keyword,
        userId: req.session.userId,
        username: req.session.username
      });
    }
  );
});
module.exports = router;
