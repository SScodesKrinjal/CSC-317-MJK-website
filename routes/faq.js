const express = require('express');
const router = express.Router();

// Route to render FAQ page
router.get('/faq', (req, res) => {
  res.render('faq');
});

module.exports = router;
