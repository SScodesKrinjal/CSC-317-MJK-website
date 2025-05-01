const express = require('express');
const router = express.Router();

// Route to render homepage with electronics products
router.get('/', (req, res) => {
  const products = [
    {
      id: 1,
      serialNumber: 'token-laptop-001',
      name: 'Laptop Pro X',
      price: 1499.99,
      description: 'A high-performance laptop with 16GB RAM and 1TB SSD.',
      image: 'laptop-pro-x.jpeg'
    },
    {
      id: 2,
      serialNumber: 'token-smartphone-002',
      name: 'Smartphone Ultra',
      price: 899.99,
      description: 'Latest-gen smartphone with an advanced camera and fast processor.',
      image: 'smartphone-ultra.jpeg'
    },
    {
      id: 3,
      serialNumber: 'token-tv-003',
      name: '4K Smart TV',
      price: 1299.99,
      description: 'Experience crystal-clear visuals on a 65-inch 4K television.',
      image: '4k-smart-tv.jpeg'
    },
    {
      id: 4,
      serialNumber: 'token-camera-004',
      name: 'DSLR Camera Z5',
      price: 799.99,
      description: 'Professional DSLR camera with 24MP and 4K video.',
      image: 'dslr-camera-z5.jpeg'
    }
  ];

  res.render('index', {
    products,
    userId: req.session.userId,
    username: req.session.username
  });
});

module.exports = router;
