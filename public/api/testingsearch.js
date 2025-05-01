const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Define the path to the database
const dbPath = path.join(__dirname, 'databases', 'products.sqlite');

// Function to search NFTs by title
function searchNfts(query) {
    const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('Error opening database:', err.message);
            return;
        }
        console.log('Connected to the SQLite database.');
    });

    db.all("SELECT * FROM NFTs WHERE NFTtitle LIKE ?", [`%${query}%`], (err, rows) => {
        if (err) {
            console.error('Error executing query:', err.message);
            return;
        }
        console.log(`Search results for '${query}': ${JSON.stringify(rows)}`);
        db.close((err) => {
            if (err) {
                console.error('Error closing database:', err.message);
            } else {
                console.log('Database connection closed.');
            }
        });
    });
}

// Test the search function
const query = "Chappy";
searchNfts(query);
