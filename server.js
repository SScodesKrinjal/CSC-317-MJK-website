const express = require('express');
const path = require('path');
const session = require('express-session');
const app = express();


//set Pug as the view engine
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));  // tells Express where to find your Pug templates

//static files (CSS, images, etc.)
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true
}));

//import and use route files
const indexRouter = require('./routes/index');
app.use('/', indexRouter);  //will handle all requests to the root route 

//array of products for dynamic shop
const products = [
  { name: 'Laptop', price: '999.00', image: 'laptop.png', slug: 'laptop', description: 'This high-performance gaming laptop features a powerful processor, vibrant display, and long battery life, perfect for gamers and creators alike.' },
  { name: 'Ipad', price: '999,999,999.00', image: 'ipad.jpg', slug: 'ipad', description: 'The 11-inch iPad is now more capable than ever with the superfast A16 chip, a stunning Liquid Retina display,advanced cameras, fast Wi-Fi, USB-C connector, and four gorgeous colors.* iPad delivers a powerful way to create, stay connected, and get things done. It can even drive you to School!' },
  { name: 'FlatScreen Television', price: '2.00', image: 'tv.jpg', slug: 'tv', description: 'Full HD delivers a step up in clarity from HD with richer contrast and true-to-life color achieved with Full Array LED Backlight and fine-tuned at a granular level with Active Pixel Tuning.' },
  { name: 'Nintendo Switch 2', price: 'Your Soul', image: 'switchtwo.jpg', slug: 'switchtwo', description: 'Your games will leap to life on the vivid, 7.9” 1080p screen that showcases the system’s powerful processing and graphics performance. The updated dock also supports up to 4K resolution and frame rates up to 120 fps with compatible games and TVs.' },
  { name: 'Valorant 1000RP Gift Card', price: '999,999.00', image: 'valorantcard.jpg', slug: 'valorantcard', description: 'The perfect gift for anyone who plays VALORANT or trying it out for the first time. Unlocks in-game currency that can be used to purchase weapon skins and unlock new agents.' },
  { name: 'Roblox Gift Card 1000 Robux', price: '999.00', image: 'robuxcard.jpg', slug: 'robuxcard', description: 'The easiest way to add Robux (Roblox digital currency) to your account. Use Robux to deck out your avatar and unlock additional perks in your favorite Roblox experiences.' },
  { name: 'Gaming Keyboard', price: '999,999,991.00', image: 'keyboard.jpg', slug: 'keyboard', description: 'FASTER THAN LEGACY MECHANICAL SWITCHES — Razer Optical switches use light-based actuation, registering key presses at the speed of light (30% shorter actuation distance than other clicky switches at 1.5 mm) with satisfying, clicky feedback' },
  { name: 'Beats Headphones', price: '9.00', image: 'beats.jpg', slug: 'beats', description: 'Custom acoustic architecture and updated drivers for powerful Beats sound. Personalized Spatial Audio with dynamic head tracking. Ultralight ergonomic design for all-day comfort. Flex-grip headband and ergonomically angled, adjustable ear cups for a stable fit.' },
  { name: 'Iphone Cover', price: '999,999.00', image: 'iphonecover.jpg', slug: 'iphonecover', description: 'Superior Drop Protection: Rigorously tested, this case surpasses military standards (MIL-STD-810G 516.6), enduring 5X more drops. Rest assured, your iPhone is safeguarded in the most unexpected situations with OtterBoxs commitment to superior protection.' },
  { name: 'Smart Watch', price: 'RipOff', image: 'smartwatch.jpg', slug: 'smartwatch', description: '1.83 HD Screen for Exceptional Clarity: Fitness tracking watch with HD screen, enjoy vivid colors and sharp details on the ultra-large touchscreen, even under sunlight, with customizable watch faces' },
  { name: 'GameBoy', price: '999,999,999,999.00', image: 'gameboy.jpg', slug: 'gameboy', description: 'No Backlight. This is an unmodified console which requires a well lit room to see the screen.' },
  { name: 'DJ Set', price: '99.00', image: 'djset.jpg', slug: 'djset', description: '2-deck DJ Controller with Multi-device Compatibility. USB Audio Output - Graphite. Streaming Integration. Smart Mixing.' },
]

//shop page
app.get('/shop', (req, res) => {
  res.render('shop', { products });
});

//product render page when choosing an item to look at
app.get('/product/:slug', (req,res) => {
  const productSlug= req.params.slug;
  const product = products.find(p => p.slug === productSlug);

  if (!product) {
    return res.status(404).render('404');
  }

  res.render('product', {product});
})

//cart page
app.get('/cart', (req, res) => {
  res.render('cart');
})


app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
