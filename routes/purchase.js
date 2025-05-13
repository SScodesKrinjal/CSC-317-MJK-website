const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

//users DB here for purchases
const dbPath = path.join(__dirname, '..', 'database', 'users.sqlite'); 

router.get('/', (req, res) => {
    if (!req.session?.userId) {
        return res.redirect('/login');
    }

    const db = new sqlite3.Database(dbPath);

    db.all(`
        SELECT p.id, pr.title, pr.price, p.purchase_date
        FROM purchases p
        JOIN products pr ON p.product_id = pr.id
        WHERE p.user_id = ?
        ORDER BY p.purchase_date DESC
    `, [req.session.userId], (err, purchases) => {
        db.close();
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send('Error retrieving purchases');
        }
        res.render('purchase-success', { purchases });
    });
});

module.exports = router;

