
const express = require('express');
const router = express.Router();

// Route to render About page
router.get('/about', (req, res) => {
  res.render('about');
});

module.exports = router;
