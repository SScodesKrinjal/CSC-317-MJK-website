const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

function getDb() {
    // Use absolute path from project root
    const dbPath = path.join(__dirname, '..', 'databases', 'users.sqlite');
    
    // Ensure database directory exists
    const dbDir = path.dirname(dbPath);
    if (!require('fs').existsSync(dbDir)) {
        require('fs').mkdirSync(dbDir, { recursive: true });
    }

    return new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
        if (err) {
            console.error('Database connection error:', err.message);
            throw err;
        }
        console.log('Connected to database:', dbPath);
    });
}

// Add to cart
router.post('/add', (req, res) => {
    console.log('Add to cart request received');
    console.log('Session:', req.session);
    console.log('Request body:', req.body);

    if (!req.session?.userId) {
        return res.status(401).json({ error: 'Please log in to add items to cart' });
    }

    const { nftId } = req.body;
    
    if (!nftId) {
        return res.status(400).json({ error: 'No NFT ID provided' });
    }

    let db;
    try {
        db = getDb();
        
        // First check if the item is already in the cart
        db.get('SELECT id FROM cart WHERE user_id = ? AND nft_id = ?', 
            [req.session.userId, nftId], 
            (err, existing) => {
                if (err) {
                    console.error('Database error:', err);
                    db.close();
                    return res.status(500).json({ error: 'Error checking cart' });
                }

                if (existing) {
                    db.close();
                    return res.json({ success: true, message: 'Item already in cart' });
                }

                // If not in cart, add it
                db.run('INSERT INTO cart (user_id, nft_id) VALUES (?, ?)',
                    [req.session.userId, nftId],
                    (err) => {
                        if (err) {
                            console.error('Error adding to cart:', err);
                            db.close();
                            return res.status(500).json({ error: 'Error adding to cart' });
                        }
                        
                        db.close();
                        res.json({ success: true, message: 'Added to cart' });
                    }
                );
            }
        );
    } catch (error) {
        console.error('Database connection error:', error);
        if (db) db.close();
        res.status(500).json({ error: 'Database connection failed' });
    }
});

// Debug route to check database connection
router.get('/debug', (req, res) => {
    let db;
    try {
        db = getDb();
        db.all(`SELECT name FROM sqlite_master WHERE type='table'`, [], (err, tables) => {
            if (err) {
                console.error('Error getting tables:', err);
                db.close();
                return res.status(500).json({ error: 'Database error', details: err.message });
            }
            
            const result = { 
                tables,
                dbPath: path.join(__dirname, '..', 'databases', 'users.sqlite')
            };
            
            db.all(`SELECT * FROM cart`, [], (err, cart) => {
                result.cart = cart || [];
                result.cartError = err ? err.message : null;
                db.close();
                res.json(result);
            });
        });
    } catch (error) {
        console.error('Database connection error:', error);
        if (db) db.close();
        res.status(500).json({ error: 'Database connection failed', details: error.message });
    }
});

module.exports = router;
