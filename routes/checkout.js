const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Helper to get DB connection for products.db (assuming this holds products, cart, and purchases)
function getDb() {
  return new sqlite3.Database(
    path.join(__dirname, '..', 'database', 'products.db'), // Ensure this path is correct for products.db
    sqlite3.OPEN_READWRITE,
    (err) => {
        if (err) {
            console.error('Error connecting to products.db:', err.message);
        }
    }
  );
}

// GET checkout page (no changes here, keeping it for context)
router.get('/', (req, res) => {
  if (!req.session?.userId) {
    return res.redirect('/login');
  }

  const db = getDb();

  db.all(`
    SELECT
      p.title,
      p.price,
      p.image,
      c.quantity
    FROM cart c
    JOIN products p ON c.product_id = p.id
    WHERE c.user_id = ?
  `, [req.session.userId], (err, cartItems) => {
    if (err) {
      console.error('Checkout error:', err);
      db.close();
      return res.render('checkout', {
        cartItems: [],
        total: 0,
        error: 'Error loading your cart'
      });
    }

    const total = cartItems.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);
    db.close();

    res.render('checkout', {
      cartItems,
      total: total.toFixed(2),
      error: null
    });
  });
});

// POST route to process payment - MAJOR CHANGES HERE
router.post('/', (req, res) => {
  if (!req.session?.userId) {
    return res.status(401).json({ error: 'Not logged in' });
  }

  const userId = req.session.userId;
  const { creditCard, expiryDate, cvv } = req.body;

  // Basic fake validation — just check if fields exist and are non-empty
  if (!creditCard || !expiryDate || !cvv) {
    return res.status(400).json({ error: 'Payment information is incomplete' });
  }

  // Simulate payment processing delay
  setTimeout(() => {
    const db = getDb(); // Get connection to products.db

    // Start a database transaction for atomicity: either all operations succeed, or none do.
    db.serialize(() => {
      db.run('BEGIN TRANSACTION;', (beginErr) => {
        if (beginErr) {
          console.error('Error starting transaction:', beginErr);
          db.close();
          return res.status(500).json({ error: 'Failed to complete purchase (transaction error)' });
        }

        // 1. Fetch current cart items for the user
        db.all(`
          SELECT product_id, quantity
          FROM cart
          WHERE user_id = ?
        `, [userId], (err, cartItems) => {
          if (err) {
            console.error('Error fetching cart items for purchase:', err);
            db.run('ROLLBACK;'); // Rollback the transaction on error
            db.close();
            return res.status(500).json({ error: 'Failed to complete purchase (cart fetch error)' });
          }

          if (cartItems.length === 0) {
            db.run('ROLLBACK;'); // Nothing to purchase, rollback
            db.close();
            return res.status(400).json({ error: 'Your cart is empty!' });
          }

          // Use a Promise.all to handle multiple asynchronous INSERT operations
          const insertPromises = cartItems.map(item => {
            return new Promise((resolve, reject) => {
              // 2. Insert each cart item into the 'purchases' table
              db.run(`
                INSERT INTO purchases (user_id, product_id, quantity, purchase_date)
                VALUES (?, ?, ?, CURRENT_TIMESTAMP)
              `, [userId, item.product_id, item.quantity], function(insertErr) {
                if (insertErr) {
                  console.error('Error inserting into purchases table:', insertErr);
                  reject(insertErr); // Reject the promise on error
                } else {
                  resolve(); // Resolve the promise on success
                }
              });
            });
          });

          // After all inserts are attempted, proceed
          Promise.all(insertPromises)
            .then(() => {
              // 3. Clear the user's cart (after items are recorded in purchases)
              db.run('DELETE FROM cart WHERE user_id = ?', [userId], (deleteErr) => {
                if (deleteErr) {
                  console.error('Error clearing cart after purchase:', deleteErr);
                  db.run('ROLLBACK;'); // Rollback if cart clearing fails
                  db.close();
                  return res.status(500).json({ error: 'Failed to complete purchase (cart clear error)' });
                }

                // 4. Commit the transaction if all previous steps succeeded
                db.run('COMMIT;', (commitErr) => {
                  db.close(); // Close DB connection
                  if (commitErr) {
                    console.error('Error committing transaction:', commitErr);
                    return res.status(500).json({ error: 'Failed to complete purchase (transaction commit error)' });
                  }
                  // Payment accepted and cart cleared — send success response
                  res.json({ success: true, message: 'Purchase completed successfully!' });
                });
              });
            })
            .catch(batchErr => {
              // If any insert promise fails, this catch block is executed
              console.error('One or more inserts into purchases failed:', batchErr);
              db.run('ROLLBACK;'); // Rollback the entire transaction
              db.close();
              res.status(500).json({ error: 'Failed to complete purchase (data saving error)' });
            });
        });
      });
    });
  }, 1000); // 1-second fake delay
});

module.exports = router;