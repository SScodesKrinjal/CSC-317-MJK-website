"use strict";

var express = require('express');

var path = require('path');

var session = require('express-session');

var app = express(); //set Pug as the view engine

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views')); //tells Express where to find our Pug templates
//middleware to parse form data

app.use(express.urlencoded({
  extended: true
}));
app.use('/images', express["static"](path.join(__dirname, 'public', 'images')));
app.use(express.json()); //static files (CSS, images, etc.)

app.use(express["static"](path.join(__dirname, 'public')));
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true
})); //import and use route files

var indexRouter = require('./routes/index');

var shopRouter = require('./routes/shop');

var productsRouter = require('./routes/products');

var cartRouter = require('./routes/cart');

var aboutRouter = require('./routes/about');

var faqRouter = require('./routes/faq');

var authRouter = require('./routes/auth');

var profileRouter = require('./routes/profile');

var loginRouter = require('./routes/login');

var registerRouter = require('./routes/register');

var checkoutRouter = require('./routes/checkout');

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
app.use('/checkout', checkoutRouter); // Start the server

var PORT = process.env.PORT || 3000;
app.listen(PORT, function () {
  console.log("Server running at http://localhost:".concat(PORT));
});
//# sourceMappingURL=server.dev.js.map
