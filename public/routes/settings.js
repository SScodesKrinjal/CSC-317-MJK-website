const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

function getDb() {
    return new sqlite3.Database(
        path.join(__dirname, '..', 'databases', 'users.sqlite'),
        sqlite3.OPEN_READWRITE
    );
}

router.get('/settings', (req, res) => {
    console.log('Settings page accessed, session:', req.session);

    if (!req.session?.userId) {
        return res.render('settings', { 
            user: null,
            purchaseHistory: [],
            message: 'Please log in to view settings'
        });
    }

    const db = getDb();
    
    // Get user data
    db.get('SELECT * FROM users WHERE id = ?', [req.session.userId], (err, user) => {
        if (err) {
            console.error('Error fetching user:', err);
            db.close();
            return res.render('settings', { 
                user: null,
                purchaseHistory: [],
                error: 'Error fetching user data'
            });
        }

        if (!user) {
            console.log('No user found for ID:', req.session.userId);
            db.close();
            return res.render('settings', { 
                user: null,
                purchaseHistory: [],
                error: 'User not found'
            });
        }

        // Get purchase history
        db.all(`
            SELECT n.*, p.purchase_date
            FROM purchases p
            JOIN NFTs n ON p.nft_id = n.id
            WHERE p.user_id = ?
            ORDER BY p.purchase_date DESC
        `, [req.session.userId], (err, purchaseHistory) => {
            if (err) {
                console.error('Error fetching purchase history:', err);
            }
            
            db.close();
            res.render('settings', { 
                user,
                purchaseHistory: purchaseHistory || []
            });
        });
    });
});

router.post('/settings/update-password', (req, res) => {
  console.log('Password update requested');

  if (!req.session?.userId) {
      return res.status(401).json({ error: 'Please log in' });
  }

  const { currentPassword, newPassword, confirmPassword } = req.body;
  console.log('Password update details received:', { currentPassword, newPassword, confirmPassword });

  if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'All password fields are required' });
  }

  if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'New passwords do not match' });
  }

  const db = getDb();

  db.get('SELECT * FROM users WHERE id = ?', [req.session.userId], (err, user) => {
      if (err) {
          console.error('Database error:', err);
          db.close();
          return res.status(500).json({ error: 'Database error' });
      }

      if (!user) {
          db.close();
          return res.status(404).json({ error: 'User not found' });
      }

      if (user.password !== currentPassword) {
          db.close();
          return res.status(400).json({ error: 'Current password is incorrect' });
      }

      db.run('UPDATE users SET password = ? WHERE id = ?',
          [newPassword, req.session.userId],
          function(err) {
              db.close();
              if (err) {
                  console.error('Error updating password:', err);
                  return res.status(500).json({ error: 'Error updating password' });
              }
              res.json({ success: true, message: 'Password updated successfully' });
          }
      );
  });
});

// logout route
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
      if (err) {
          console.error('Error destroying session:', err);
          return res.status(500).json({ error: 'Error logging out' });
      }
      res.json({ success: true });
  });
});

router.post('/settings/update-username', (req, res) => {
    console.log('Username update requested:', req.body);
    console.log('Session:', req.session);

    if (!req.session?.userId) {
        return res.status(401).json({ error: 'Please log in' });
    }

    const { username } = req.body;
    if (!username) {
        return res.status(400).json({ error: 'Username is required' });
    }

    const db = getDb();
    
    // First verify user exists
    db.get('SELECT * FROM users WHERE id = ?', [req.session.userId], (err, user) => {
        if (err || !user) {
            console.error('Error or user not found:', err);
            db.close();
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if new username is taken
        db.get('SELECT id FROM users WHERE username = ? AND id != ?', 
            [username, req.session.userId], 
            (err, existing) => {
                if (err) {
                    console.error('Error checking username:', err);
                    db.close();
                    return res.status(500).json({ error: 'Database error' });
                }

                if (existing) {
                    db.close();
                    return res.status(400).json({ error: 'Username already taken' });
                }

                // Update username
                db.run('UPDATE users SET username = ? WHERE id = ?',
                    [username, req.session.userId],
                    function(err) {
                        console.log('Update result:', err || 'Success', this.changes);
                        db.close();
                        
                        if (err) {
                            return res.status(500).json({ error: 'Error updating username' });
                        }
                        
                        // Update session
                        req.session.username = username;
                        res.json({ success: true, message: 'Username updated successfully' });
                    }
                );
            }
        );
    });
});

module.exports = router;
