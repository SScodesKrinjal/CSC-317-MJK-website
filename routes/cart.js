
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

router.get('/cart', (req, res) => {
    if (!req.session?.userId) {
        return res.render('cart', { 
            cartItems: [],
            total: 0,
            message: 'Please log in to view your cart'
        });
    }

    const db = getDb();
    
    // Join cart with NFTs table to get item details
    db.all(`
        SELECT n.*, c.id as cart_id
        FROM cart c
        JOIN NFTs n ON c.nft_id = n.id
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

        // Calculate total
        const total = cartItems.reduce((sum, item) => sum + item.NFTprice, 0);
        
        db.close();
        res.render('cart', { 
            cartItems,
            total: total.toFixed(2)
        });
    });
});

// Add route to remove items from cart
router.post('/cart/remove', (req, res) => {
    if (!req.session?.userId) {
        return res.status(401).json({ error: 'Not logged in' });
    }

    const { cartId } = req.body;
    const db = getDb();

    db.run('DELETE FROM cart WHERE id = ? AND user_id = ?', 
        [cartId, req.session.userId],
        (err) => {
            db.close();
            if (err) {
                return res.status(500).json({ error: 'Error removing item' });
            }
            res.json({ success: true });
        }
    );
});

module.exports = router;
