// users-setup.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create / Connect to the users.sqlite file
const dbPath = path.join(__dirname, 'users.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to connect to users.sqlite:', err.message);
  } else {
    console.log('Connected to users.sqlite database.');
  }
});

// Create tables
db.serialize(() => {
  // USERS table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      real_name TEXT
    )
  `);

  // REMOVE THE PURCHASES TABLE CREATION FROM HERE
  // REMOVE THE CART TABLE CREATION FROM HERE

  console.log('Table users created successfully!'); // Updated message
});

// Close connection
db.close((err) => {
  if (err) {
    console.error('Error closing database:', err.message);
  } else {
    console.log('Database connection closed.');
  }
});