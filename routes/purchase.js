const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPathUsers = path.join(__dirname, '..', 'database', 'users.sqlite'); // for users and purchases
const dbPathProducts = path.join(__dirname, '..', 'database', 'products.db'); // for product info

router.get('/', (req, res) => {
  if (!req.session?.userId) {
    return res.redirect('/login');
  }

  const dbUsers = new sqlite3.Database(dbPathUsers);
  const dbProducts = new sqlite3.Database(dbPathProducts);

  // Fetch user info (like username, real_name)
  dbUsers.get('SELECT id, username, real_name FROM users WHERE id = ?', [req.session.userId], (err, user) => {
    if (err || !user) {
      dbUsers.close();
      dbProducts.close();
      return res.render('profile', { error: 'User not found', purchaseHistory: [], user: null });
    }

    // Fetch purchase history with product titles and purchase dates
    dbUsers.all(`
      SELECT p.product_id, pr.title AS name, p.purchase_date
      FROM purchases p
      JOIN products pr ON p.product_id = pr.id
      WHERE p.user_id = ?
      ORDER BY p.purchase_date DESC
    `, [req.session.userId], (err2, purchaseHistory) => {
      dbUsers.close();
      dbProducts.close();

      if (err2) {
        console.error('Purchase history fetch error:', err2);
        return res.render('profile', { error: 'Failed to load purchase history', purchaseHistory: [], user });
      }

      // Render profile with user data and purchase history
      res.render('profile', { user, purchaseHistory });
    });
  });
});

module.exports = router;
