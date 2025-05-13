const express = require('express');
const router = express.Router();

// Render About page
router.get('/', (req, res) => {
  res.render('about');
});

module.exports = router;

