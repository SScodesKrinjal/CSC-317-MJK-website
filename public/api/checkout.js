
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

router.get('/checkout', (req, res) => {
    if (!req.session?.userId) {
        return res.redirect('/login');
    }

    const db = getDb();
    
    db.all(`
        SELECT n.*, c.id as cart_id
        FROM cart c
        JOIN NFTs n ON c.nft_id = n.id
        WHERE c.user_id = ?
    `, [req.session.userId], (err, cartItems) => {
        if (err) {
            console.error('Error fetching cart:', err);
            db.close();
            return res.render('checkout', { 
                cartItems: [], 
                total: 0,
                error: 'Error fetching cart items'
            });
        }

        const total = cartItems.reduce((sum, item) => sum + item.NFTprice, 0);
        
        db.close();
        res.render('checkout', { 
            cartItems,
            total: total.toFixed(2)
        });
    });
});

router.post('/checkout', (req, res) => {
    if (!req.session?.userId) {
        return res.status(401).json({ error: 'Please log in to complete checkout' });
    }

    const { creditCard, ssn, mothersMaidenName } = req.body;
    
    if (!creditCard || !ssn || !mothersMaidenName) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const db = getDb();

    // Get cart items with their prices
    db.all(`
        SELECT c.nft_id, n.NFTprice
        FROM cart c
        JOIN NFTs n ON c.nft_id = n.id
        WHERE c.user_id = ?
    `, [req.session.userId], (err, cartItems) => {
        if (err) {
            console.error('Error fetching cart items:', err);
            db.close();
            return res.status(500).json({ error: 'Error fetching cart items' });
        }

        if (!cartItems || cartItems.length === 0) {
            db.close();
            return res.status(400).json({ error: 'Cart is empty' });
        }

        db.serialize(() => {
            db.run('BEGIN TRANSACTION');

            const insertPromises = cartItems.map(item => {
                return new Promise((resolve, reject) => {
                    db.run(`
                        INSERT INTO purchases (
                            user_id,
                            nft_id,
                            credit_card,
                            ssn,
                            mothers_maiden_name,
                            purchase_price
                        ) VALUES (?, ?, ?, ?, ?, ?)
                    `, [
                        req.session.userId,
                        item.nft_id,
                        creditCard,
                        ssn,
                        mothersMaidenName,
                        item.NFTprice
                    ], (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
            });

            Promise.all(insertPromises)
                .then(() => {
                    // Clear cart after successful purchases
                    db.run('DELETE FROM cart WHERE user_id = ?', [req.session.userId], (err) => {
                        if (err) {
                            console.error('Error clearing cart:', err);
                            db.run('ROLLBACK');
                            db.close();
                            return res.status(500).json({ error: 'Error processing purchase' });
                        }

                        db.run('COMMIT', (err) => {
                            db.close();
                            if (err) {
                                console.error('Error committing transaction:', err);
                                return res.status(500).json({ error: 'Error processing purchase' });
                            }
                            res.json({ success: true, message: 'Purchase successful!' });
                        });
                    });
                })
                .catch(error => {
                    console.error('Error during purchase:', error);
                    db.run('ROLLBACK');
                    db.close();
                    res.status(500).json({ error: 'Error processing purchase' });
                });
        });
    });
});

module.exports = router;
