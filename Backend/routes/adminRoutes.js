const express = require('express');
const auth = require('../middleware/auth');
const { listUsers, setRole, setDisabled } = require('../controllers/adminController');
const { createProduct, getProducts, deleteProduct, updateProduct } = require('../controllers/productController');
const { adminGetOrders, adminUpdateStatus, adminAddLog, adminEditLog, adminDeleteLog, adminCancelOrder } = require('../controllers/orderController');
const upload = require('../middleware/upload');
const SiteSettings = require('../models/SiteSettings');

const router = express.Router();

const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin access required.' });
  next();
};

router.use(auth, adminOnly);

router.get('/users', listUsers);
router.patch('/users/:id/role', setRole);
router.patch('/users/:id/disable', setDisabled);

router.get('/products', getProducts);
router.post('/products', upload.array('images', 5), createProduct);
router.patch('/products/:id', upload.array('images', 5), updateProduct);
router.delete('/products/:id', deleteProduct);

router.get('/orders', adminGetOrders);
router.patch('/orders/:id/status', adminUpdateStatus);
router.patch('/orders/:id/cancel', adminCancelOrder);
router.post('/orders/:id/log', adminAddLog);
router.patch('/orders/:id/log/:index', adminEditLog);
router.delete('/orders/:id/log/:index', adminDeleteLog);

router.get('/settings/featured', async (req, res) => {
  try {
    const s = await SiteSettings.findOne({ key: 'global' }).populate('featuredProducts.product');
    res.json({ success: true, featured: s?.featuredProducts || [] });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.patch('/settings/featured', upload.array('images', 4), async (req, res) => {
  try {
    const slots = JSON.parse(req.body.slots || '[]');
    let fileIdx = 0;
    const featuredProducts = slots.slice(0, 4).map(slot => {
      let customImage = slot.existingImage || '';
      if (!slot.keepImage && req.files && req.files[fileIdx]) {
        customImage = `/uploads/${req.files[fileIdx].filename}`;
        fileIdx++;
      }
      return { product: slot.productId || null, customImage };
    }).filter(s => s.product);

    const s = await SiteSettings.findOneAndUpdate(
      { key: 'global' },
      { featuredProducts },
      { upsert: true, new: true }
    ).populate('featuredProducts.product');
    res.json({ success: true, featured: s.featuredProducts });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
