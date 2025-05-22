const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database', 'products.db');

//route to display all products
router.get('/', (req, res) => {
  const db = new sqlite3.Database(dbPath);

  db.all('SELECT * FROM products', [], (err, products) => {
    db.close();

    if (err) {
      console.error('Database error:', err);
      return res.status(500).send('Database error');
    }

    res.render('shop', { products, searchQuery: '' });
  });
});

module.exports = router;