const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');


router.get('/search', (req, res) => {  // Changed from '/api/search' to '/search'
    const searchTerm = req.query.q;
    const dbPath = path.join(__dirname, '..', 'databases', 'users.sqlite'); // Change to correct database name

    const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
        if (err) {
            console.error('Error connecting to database:', err.message);
            return res.status(500).json({ error: 'Database connection failed' });
        }

        const query = `SELECT * FROM NFTs WHERE NFTtitle LIKE ?`;
        const searchParam = `%${searchTerm}%`;

        db.all(query, [searchParam], (err, rows) => {
            if (err) {
                console.error('Error executing search query:', err.message);
                db.close();
                return res.status(500).json({ error: 'Search query failed' });
            }

            db.close((closeErr) => {
                if (closeErr) {
                    console.error('Error closing database:', closeErr.message);
                }
            });
            
            res.json(rows);
        });
    });
});

module.exports = router;
