const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Product title is required'],
    trim: true,
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: 0,
  },
  originalPrice: {
    type: Number,
    default: 0,
  },
  discount: {
    type: Number,
    default: 0,
  },
  rating: {
    type: Number,
    default: null,
    min: 0,
    max: 5,
  },
  soldCount: {
    type: Number,
    default: 0,
  },
  category: {
    type: String,
    required: true,
    index: true,
  },
  isOfficial: {
    type: Boolean,
    default: false,
  },
  isPowerPro: {
    type: Boolean,
    default: false,
  },
  location: {
    type: String,
    default: 'Jakarta',
  },
  image: {
    type: String,
    default: '',
  },
  images: {
    type: [String],
    default: [],
  },
  colors: {
    type: [String],
    default: [],
  },
  sizes: {
    type: [String],
    default: [],
  },
  description: {
    type: String,
    default: '',
  },
  stock: {
    type: Number,
    default: 100,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  reviews: {
    type: [{
      userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      userName:  { type: String, default: 'Anonymous' },
      rating:    { type: Number, required: true, min: 1, max: 5 },
      text:      { type: String, default: '' },
      createdAt: { type: Date, default: Date.now },
    }],
    default: [],
  },
  reviewCount: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Product', productSchema);
