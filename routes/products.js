const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database', 'products.db');

//Fetch product by slug
router.get('/:slug', (req, res) => {
  const productSlug = req.params.slug; 

  const db = new sqlite3.Database(dbPath);

  db.get('SELECT * FROM products WHERE slug = ?', [productSlug], (err, product) => {
    db.close();

    if (err) {
      console.error('Database error:', err);
      return res.status(500).send('Database error');
    }

    if (!product) {
      return res.status(404).render('404');
    }

    res.render('product', { product });  // passinthe full product object
  });
});

module.exports = router;

