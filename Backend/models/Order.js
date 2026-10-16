const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: String,
  title: String,
  image: String,
  price: Number,
  qty: Number,
  size: String,
}, { _id: false });

const logSchema = new mongoose.Schema({
  time: { type: Date, default: Date.now },
  text: String,
}, { _id: false });

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [orderItemSchema],
  total: Number,
  subtotal: Number,
  shippingCost: Number,
  addons: {
    protection: { type: Number, default: 0 },
    insurance:  { type: Number, default: 0 },
  },
  courier: { id: String, label: String, price: Number },
  trackingNumber: String,
  shippingAddress: {
    name: String, phone: String, street: String, city: String, province: String, zip: String,
  },
  note:          { type: String, default: null },
  paymentMethod: { type: String, default: null },
  status:    { type: String, enum: ['packed', 'shipped', 'delivered'], default: 'packed' },
  cancelled:   { type: Boolean, default: false },
  soldCounted: { type: Boolean, default: false },
  shippedAt:   Date,
  deliveredAt: Date,
  logs: [logSchema],
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
