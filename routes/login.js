
const express = require('express');
const router = express.Router();

// Route to render Login page
router.get('/', (req, res) => {
  res.render('login', { error: null});
});

module.exports = router;
