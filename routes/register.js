
const express = require('express');
const router = express.Router();

// Route to render Login page
router.get('/', (req, res) => {
  res.render('register');
});

module.exports = router;
