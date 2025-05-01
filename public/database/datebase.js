const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to a file-based database (persistent)
const db = new sqlite3.Database(path.join(__dirname, 'products.db'), (err) => {
  if (err) {
    console.error('Failed to connect to database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
  }
});

// Create and populate the database
db.serialize(() => {
  // Create the products table
  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      price REAL NOT NULL,
      token TEXT NOT NULL
    )
  `);

  // Insert product data
  const insert = db.prepare(`
    INSERT INTO products (title, description, price, token) VALUES (?, ?, ?, ?)
  `);

  insert.run('Laptop Pro X', 'A high-performance laptop with 16GB RAM and 1TB SSD.', 1499.99, 'token-laptop-001');
  insert.run('Smartphone Ultra', 'Latest-gen smartphone with an advanced camera and fast processor.', 899.99, 'token-smartphone-002');
  insert.run('4K Smart TV', 'Experience crystal-clear visuals on a 65-inch 4K television.', 1299.99, 'token-tv-003');
  insert.run('DSLR Camera Z5', 'Professional DSLR camera with 24MP and 4K video.', 799.99, 'token-camera-004');

  insert.finalize();

  // Query and print all products
  db.each('SELECT id, title, price FROM products', (err, row) => {
    if (err) {
      console.error('Error fetching product:', err.message);
    } else {
      console.log(`${row.id}: ${row.title} - $${row.price}`);
    }
  });
});

module.exports = db;
