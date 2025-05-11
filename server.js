const express = require('express');const path = require('path');
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

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
