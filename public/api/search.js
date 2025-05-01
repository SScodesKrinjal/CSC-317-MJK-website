
const express = require('express');
const router = express.Router();

// Route to render Search page
router.get('/search', (req, res) => {
  res.render('search');
});

module.exports = router;
