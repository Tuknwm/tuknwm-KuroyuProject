const express = require('express');
const auth = require('../middleware/auth');
const Cart = require('../models/Cart');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id }).populate('items.product');
    res.json({ success: true, data: cart?.items ?? [] });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.put('/', auth, async (req, res) => {
  try {
    const { items } = req.body;
    const cart = await Cart.findOneAndUpdate(
      { user: req.user.id },
      { items },
      { upsert: true, new: true }
    ).populate('items.product');
    res.json({ success: true, data: cart.items });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
