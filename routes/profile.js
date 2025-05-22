const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

// Helper function to get connection to the users database
function getUsersDb() {
  return new sqlite3.Database(
    path.join(__dirname, '..', 'database', 'users.sqlite'),
    sqlite3.OPEN_READWRITE,
    (err) => {
      if (err) {
        console.error('Error connecting to users.sqlite:', err.message);
      }
    }
  );
}

// Helper function to get connection to the products database
function getProductsDb() {
  return new sqlite3.Database(
    path.join(__dirname, '..', 'database', 'products.db'),
    sqlite3.OPEN_READWRITE,
    (err) => {
      if (err) {
        console.error('Error connecting to products.db:', err.message);
      }
    }
  );
}

// Profile page: shows user info + purchase history
router.get('/', (req, res) => {
  console.log('Profile page accessed, session:', req.session);

  if (!req.session?.userId) {
    return res.render('profile', {
      user: null,
      purchases: [], // Renamed purchaseHistory to purchases for consistency with pug
      message: 'Please log in to view your profile',
      error: null
    });
  }

  const userId = req.session.userId;

  // Connect to the users database for user data
  const usersDb = getUsersDb();
  let currentUser = null; // Store user data here

  // Fetch username AND real_name from users.sqlite
  usersDb.get('SELECT id, username, real_name FROM users WHERE id = ?', [userId], (err, user) => {
    if (err) {
      console.error('Error fetching user from users.sqlite:', err);
      usersDb.close();
      return res.render('profile', {
        user: null,
        purchases: [],
        error: 'Error fetching user data'
      });
    }

    if (!user) {
      console.log('No user found for ID:', userId);
      usersDb.close();
      return res.render('profile', {
        user: null,
        purchases: [],
        error: 'User not found'
      });
    }

    currentUser = user; // Store the fetched user
    usersDb.close(); // Close usersDb connection after fetching user data

    // Now, connect to the products database for purchase history
    const productsDb = getProductsDb();

    // Fetch purchase history, joining with products to get title, price, image, AND product_id
    productsDb.all(`
      SELECT
        p.title AS product_title,
        p.price,
        p.image,
        ph.quantity,
        ph.product_id,     -- IMPORTANT: Fetch product_id for "Buy Again" button
        ph.purchase_date
      FROM purchases ph
      JOIN products p ON ph.product_id = p.id
      WHERE ph.user_id = ?
      ORDER BY ph.purchase_date DESC
    `, [userId], (err, purchases) => { // Renamed purchaseHistory to purchases
      if (err) {
        console.error('Error fetching purchase history from products.db:', err);
        productsDb.close();
        return res.render('profile', {
          user: currentUser,
          purchases: [],
          message: null,
          error: 'Error loading purchase history: ' + err.message
        });
      }

      productsDb.close(); // Close productsDb connection after fetching history

      const formattedPurchases = (purchases || []).map(p => ({
        ...p,
        purchase_date: p.purchase_date ? new Date(p.purchase_date).toLocaleDateString() : 'N/A'
      }));

      const error = req.query.error || null;
      const message = req.query.message || null;

      res.render('profile', {
        user: currentUser,
        purchases: formattedPurchases, // Pass the renamed variable
        message: message,
        error: error
      });
    });
  });
});

// Update password - uses getUsersDb()
router.post('/update-password', (req, res) => {
  console.log('Password update requested');

  if (!req.session?.userId) {
    return res.status(401).render('login', { error: 'Please log in' });
  }

  const { currentPassword, newPassword, confirmPassword } = req.body;
  console.log('Password update details received:', { currentPassword, newPassword, confirmPassword });

  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.redirect('/profile?error=' + encodeURIComponent('All password fields are required'));
  }

  if (newPassword !== confirmPassword) {
    return res.redirect('/profile?error=' + encodeURIComponent('New passwords do not match'));
  }

  const db = getUsersDb(); // Use getUsersDb()

  db.get('SELECT * FROM users WHERE id = ?', [req.session.userId], (err, user) => {
    if (err) {
      console.error('Database error:', err);
      db.close();
      return res.redirect('/profile?error=' + encodeURIComponent('Database Error'));
    }

    if (!user) {
      db.close();
      return res.redirect('/profile?error=' + encodeURIComponent('User not Found'));
    }

    bcrypt.compare(currentPassword, user.password, (err, isMatch) => {
      if (err) {
        console.error('Bcrypt error:', err);
        db.close();
        return res.redirect('/profile?error=' + encodeURIComponent('Internal Error'));
      }

      if (!isMatch) {
        db.close();
        return res.redirect('/profile?error=' + encodeURIComponent('Current password is incorrect'));
      }

      bcrypt.hash(newPassword, 10, (err, hashedPassword) => {
        if (err) {
          console.error('Hashing error:', err);
          db.close();
          return res.redirect('/profile?error=' + encodeURIComponent('Error updating password'));
        }

        db.run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.session.userId], function (err) {
          db.close();
          if (err) {
            console.error('Error updating password:', err);
            return res.redirect('/profile?error=' + encodeURIComponent('Error updating password'));
          }

          res.redirect('/profile?message=Password%20updated%20successfully');
        });
      });
    });
  });
});


// Update username - uses getUsersDb()
router.post('/update-username', (req, res) => {
  console.log('Username update requested:', req.body);

  if (!req.session?.userId) {
    return res.redirect('/profile?error=' + encodeURIComponent('Please log in'));
  }

  const { username } = req.body;
  if (!username) {
    return res.redirect('/profile?error=' + encodeURIComponent('Username is required'));
  }

  const db = getUsersDb(); // Use getUsersDb()

  db.get('SELECT id FROM users WHERE username = ? AND id != ?',
    [username, req.session.userId],
    (err, existing) => {
      if (err) {
        console.error('Error checking username:', err);
        db.close();
        return res.redirect('/profile?error=' + encodeURIComponent('Database error'));
      }

      if (existing) {
        db.close();
        return res.redirect('/profile?error=' + encodeURIComponent('Username already taken'));
      }

      db.run('UPDATE users SET username = ? WHERE id = ?',
        [username, req.session.userId],
        function (err) {
          console.log('Update result:', err || 'Success', this.changes);
          db.close();

          if (err) {
            return res.redirect('/profile?error=' + encodeURIComponent('Error updating username'));
          }

          req.session.username = username;
          req.session.save();
          res.redirect('/profile?message=' + encodeURIComponent('Username updated successfully'));
        }
      );
    }
  );
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
      return res.status(500).json({ error: 'Error logging out' });
    }
    res.redirect('/?message=Logout%20successful');
  });
});

module.exports = router;