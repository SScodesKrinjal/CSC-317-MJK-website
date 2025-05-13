const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

//Connect to users.sqlite
function getDb() {
    return new sqlite3.Database(
        path.join(__dirname, '..', 'database', 'users.sqlite'),  // careful: it's 'database', not 'databases' if your folder is singular!
        sqlite3.OPEN_READWRITE,
        (err) => {
            if (err) console.error('Database connection error:', err);
        }
    );
}

//GET /checkout (show cart items before purchase)
router.get('/checkout', (req, res) => {
    if (!req.session?.userId) {
        return res.redirect('/login');
    }

    const db = getDb();
    db.all(`
        SELECT p.*, c.id AS cart_id
        FROM cart c
        JOIN products p ON c.product_id = p.id
        WHERE c.user_id = ?
    `, [req.session.userId], (err, cartItems) => {
        db.close();

        if (err) {
            console.error('Error fetching cart:', err);
            return res.render('checkout', {
                cartItems: [],
                total: 0,
                error: 'Error fetching cart items.'
            });
        }

        const total = cartItems.reduce((sum, item) => sum + item.price, 0);
        res.render('checkout', {
            cartItems,
            total: total.toFixed(2)
        });
    });
});

//POST /checkout (process the purchase)
router.post('/checkout', (req, res) => {
    if (!req.session?.userId) {
        return res.status(401).json({ error: 'Please log in to complete checkout.' });
    }

    const db = getDb();

    db.all(`
        SELECT product_id
        FROM cart
        WHERE user_id = ?
    `, [req.session.userId], (err, cartItems) => {
        if (err) {
            console.error('Error fetching cart:', err);
            db.close();
            return res.status(500).json({ error: 'Error fetching cart items.' });
        }

        if (!cartItems || cartItems.length === 0) {
            db.close();
            return res.status(400).json({ error: 'Your cart is empty.' });
        }

        db.serialize(() => {
            db.run('BEGIN TRANSACTION');

            const insertPromises = cartItems.map(item => {
                return new Promise((resolve, reject) => {
                    db.run(`
                        INSERT INTO purchases (user_id, product_id)
                        VALUES (?, ?)
                    `, [req.session.userId, item.product_id], (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
            });

            Promise.all(insertPromises)
                .then(() => {
                    db.run('DELETE FROM cart WHERE user_id = ?', [req.session.userId], (err) => {
                        if (err) {
                            console.error('Error clearing cart:', err);
                            db.run('ROLLBACK');
                            db.close();
                            return res.status(500).json({ error: 'Error clearing cart.' });
                        }

                        db.run('COMMIT', (err) => {
                            db.close();
                            if (err) {
                                console.error('Error committing transaction:', err);
                                return res.status(500).json({ error: 'Error finalizing purchase.' });
                            }
                            res.json({ success: true, message: 'Purchase completed successfully!' });
                        });
                    });
                })
                .catch(error => {
                    console.error('Error during purchase:', error);
                    db.run('ROLLBACK');
                    db.close();
                    res.status(500).json({ error: 'Purchase failed.' });
                });
        });
    });
});

module.exports = router;
