// database.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

//Connect to a file-based database
const db = new sqlite3.Database(path.join(__dirname, 'products.db'), (err) => {
  if (err) {
    console.error('Failed to connect to database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
  }
});

//Helper function to create slugs from titles
function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')   //Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '');       //Remove leading/trailing hyphens
}

//Create and populate the database
db.serialize(() => {
  //Drop the products table if it exists (for fresh start during development)
  db.run('DROP TABLE IF EXISTS products');
  // Add DROP TABLE for purchases and cart for development
  db.run('DROP TABLE IF EXISTS purchases');
  db.run('DROP TABLE IF EXISTS cart');


  //Create products table
  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      price REAL NOT NULL,
      slug TEXT NOT NULL,
      image TEXT NOT NULL
    )
  `);

  // ADD PURCHASES TABLE CREATION HERE (IN products.db)
  db.run(`
    CREATE TABLE IF NOT EXISTS purchases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL, -- You added quantity, so make sure it's here!
      purchase_date TEXT DEFAULT CURRENT_TIMESTAMP,
      -- FOREIGN KEY (user_id) REFERENCES users(id) -- Comment this out if users table is NOT in products.db
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `);

  // ADD CART TABLE CREATION HERE (IN products.db)
  db.run(`
    CREATE TABLE IF NOT EXISTS cart (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER DEFAULT 1, -- Add quantity to cart table too!
      -- FOREIGN KEY (user_id) REFERENCES users(id) -- Comment this out if users table is NOT in products.db
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `);


  //product data (unchanged)
  const products = [
    { title: 'Gaming Laptop X200', description: 'This high-performance gaming laptop features a powerful processor, vibrant display, and long battery life, perfect for gamers and creators alike.', price: 999.00, image: 'laptop.png'},
    { title: 'iPad', description: 'The 11-inch iPad is now more capable than ever with the superfast A16 chip, a stunning Liquid Retina display, advanced cameras, fast Wi-Fi, USB-C connector, and four gorgeous colors.', price: 999999999.00, image: 'ipad.jpg'  },
    { title: 'FlatScreen Television', description: 'Full HD delivers a step up in clarity from HD with richer contrast and true-to-life color achieved with Full Array LED Backlight and fine-tuned Active Pixel Tuning.', price: 2.00,   image: 'tv.jpg' },
    { title: 'Nintendo Switch 2', description: 'Your games will leap to life on the vivid, 7.9” 1080p screen that showcases the systems powerful processing and graphics performance.', price: 0.00, image: 'switchtwo.jpg' },
    { title: 'Valorant 1000RP Gift Card', description: 'The perfect gift for anyone who plays VALORANT. Unlocks in-game currency to buy skins and agents.', price: 999999.00, image: 'valorantcard.jpg' },
    { title: 'Roblox Gift Card 1000 Robux', description: 'The easiest way to add Robux to your account to customize your avatar and unlock perks.', price: 999.00, image: 'robuxcard.jpg'},
    { title: 'Gaming Keyboard', description: 'Razer Optical switches use light-based actuation, registering key presses at the speed of light.', price: 999999991.00, image: 'keyboard.jpg' },
    { title: 'Beats Headphones', description: 'Custom acoustic architecture and updated drivers for powerful Beats sound and comfort.', price: 9.00,image: 'beats.jpg' },
    { title: 'iPhone Cover', description: 'Superior Drop Protection with rigorous military standard testing to safeguard your phone.', price: 999999.00, image: 'iphonecover.jpg'   },
    { title: 'Smart Watch', description: 'Fitness tracking watch with vivid 1.83” HD screen and customizable watch faces.', price: 0.00, image:'smartwatch.jpg'},
    { title: 'GameBoy', description: 'Classic retro GameBoy, unmodified, requires external light source to view screen.', price: 999999999999.00,image: 'gameboy.jpg' },
    { title: 'DJ Set', description: '2-deck DJ Controller with multi-device compatibility, USB Audio Output, and smart mixing features.', price: 99.00, image: 'djset.jpg' },
  ];

  const insert = db.prepare(`
    INSERT INTO products (title, description, price, slug, image) VALUES (?, ?, ?, ?, ?)
  `);

  products.forEach(product => {
    insert.run(product.title, product.description, product.price, slugify(product.title), product.image);
  });

  insert.finalize();

  // query and print all products
  db.each('SELECT id, title, slug, price FROM products', (err, row) => {
    if (err) {
      console.error('Error fetching product:', err.message);
    } else {
      console.log(`${row.id}: ${row.title} (${row.slug}) - $${row.price}`);
    }
  });
});

module.exports = db;