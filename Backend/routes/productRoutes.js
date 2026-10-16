const express = require('express');
const router = express.Router();
const { getProducts, getProductById, createProduct, addReview, getReviews } = require('../controllers/productController');
const auth = require('../middleware/auth');
const SiteSettings = require('../models/SiteSettings');

router.get('/featured', async (req, res) => {
  try {
    const s = await SiteSettings.findOne({ key: 'global' }).populate('featuredProducts.product');
    res.json({ success: true, featured: s?.featuredProducts || [] });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', createProduct);
router.get('/:id/reviews', getReviews);
router.post('/:id/review', auth, addReview);

module.exports = router;
