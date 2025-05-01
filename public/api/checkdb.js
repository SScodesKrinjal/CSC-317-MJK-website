const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'databases', 'users.sqlite');
console.log('Checking database at:', dbPath);

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        return;
    }
    console.log('Successfully connected to database');
    
    db.all(`SELECT name FROM sqlite_master WHERE type='table'`, [], (err, tables) => {
        if (err) {
            console.error('Error getting tables:', err);
            return;
        }
        console.log('Tables in database:', tables);
        
        db.close((err) => {
            if (err) {
                console.error('Error closing database:', err.message);
            }
            console.log('Database connection closed');
        });
    });
});
