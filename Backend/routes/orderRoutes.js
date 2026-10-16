const express = require('express');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const { createOrder, getOrders, updateOrderStatus, cancelOrder } = require('../controllers/orderController');

const router = express.Router();
router.use(auth);

router.get('/', getOrders);
router.post('/', createOrder);
router.patch('/:id/status', adminOnly, updateOrderStatus);
router.patch('/:id/cancel', cancelOrder);

module.exports = router;
