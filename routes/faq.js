const express = require('express');
const router = express.Router();

// Route to render FAQ page
router.get('/', (req, res) => {
  res.render('faq');
});

module.exports = router;
