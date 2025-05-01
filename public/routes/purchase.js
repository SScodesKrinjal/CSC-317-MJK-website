const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

router.get('/purchase-success', (req, res) => {
    if (!req.session?.userId) {
        return res.redirect('/login');
    }

    const db = new sqlite3.Database(path.join(__dirname, '..', 'databases', 'users.sqlite'));
    
    db.all(`
        SELECT n.*, p.purchase_date
        FROM purchases p
        JOIN NFTs n ON p.nft_id = n.id
        WHERE p.user_id = ?
        ORDER BY p.purchase_date DESC
    `, [req.session.userId], (err, purchases) => {
        db.close();
        if (err) {
            console.error(err);
            return res.status(500).send('Error retrieving purchases');
        }
        res.render('purchase-success', { purchases });
    });
});

module.exports = router;
