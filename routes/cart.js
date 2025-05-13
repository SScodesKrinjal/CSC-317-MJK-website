const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

//Helper to get DB connection
function getDb() {
  return new sqlite3.Database(
    path.join(__dirname, '..', 'database', 'products.db'),
    sqlite3.OPEN_READWRITE
  );
}

//GET route to display cart
router.get('/', (req, res) => {
  if (!req.session?.userId) {
    return res.render('cart', { 
      cartItems: [],
      total: 0,
      message: 'Please log in to view your cart'
    });
  }

  const db = getDb();
  
  db.all(`
    SELECT 
      p.title, 
      p.price, 
      p.image,
      c.id AS cart_id,
      c.quantity
    FROM cart c
    JOIN products p ON c.product_id = p.id
    WHERE c.user_id = ?
  `, [req.session.userId], (err, cartItems) => {
    if (err) {
      console.error('Error fetching cart:', err);
      db.close();
      return res.render('cart', { 
        cartItems: [], 
        total: 0,
        error: 'Error fetching cart items'
      });
    }

    if (cartItems.length === 0) {
      db.close();
      return res.render('cart', { 
        cartItems: [],
        total: 0,
        message: 'Your cart is empty'
      });
    }

    //Calculate total price
    const total = cartItems.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    
    db.close();
    res.render('cart', { 
      cartItems,
      total: total.toFixed(2)
    });
  });
});

//POST route to remove an item from cart
router.post('/remove', (req, res) => {
  if (!req.session?.userId) {
    return res.status(401).json({ error: 'Not logged in' });
  }

  const { cartId } = req.body;

  if (!cartId) {
    return res.status(400).json({ error: 'Cart ID is required' });
  }

  const db = getDb();

  db.run('DELETE FROM cart WHERE id = ? AND user_id = ?', 
    [cartId, req.session.userId],
    (err) => {
      db.close();
      if (err) {
        console.error('Error removing item from cart:', err);
        return res.status(500).json({ error: 'Error removing item from cart' });
      }
      res.json({ success: true });
    }
  );
});

module.exports = router;
