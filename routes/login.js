
const express = require('express');
const router = express.Router();

// Route to render Login page
router.get('/login', (req, res) => {
  res.render('login');
});

module.exports = router;
