const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  product:  { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  qty:      { type: Number, default: 1, min: 1 },
  size:     { type: String, default: null },
  color:    { type: String, default: null },
}, { _id: false });

const cartSchema = new mongoose.Schema({
  user:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  items: { type: [itemSchema], default: [] },
}, { timestamps: true });

module.exports = mongoose.model('Cart', cartSchema);
