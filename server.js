const express = require('express');
const path = require('path');
const session = require('express-session');
const app = express();


//set Pug as the view engine
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));  //tells Express where to find our Pug templates

//middleware to parse form data
app.use(express.urlencoded({ extended: true}));

app.use('/images', express.static(path.join(__dirname, 'public', 'images')));

app.use(express.json());

//static files (CSS, images, etc.)
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true
}));

//import and use route files
const indexRouter = require('./routes/index');
const shopRouter = require('./routes/shop');
const productsRouter = require('./routes/products');
const cartRouter = require('./routes/cart');
const aboutRouter = require('./routes/about');
const faqRouter = require('./routes/faq');
const authRouter = require('./routes/auth');
const profileRouter = require('./routes/profile');
const loginRouter = require('./routes/login');
const registerRouter = require('./routes/register');


app.use('/', indexRouter);
app.use('/shop', shopRouter);
app.use('/product', productsRouter);
app.use('/cart', cartRouter);
app.use('/about', aboutRouter);
app.use('/faq', faqRouter);
app.use('/profile', profileRouter);
app.use('/login', loginRouter);
app.use('/register', registerRouter);
app.use('/auth', authRouter);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});