const mongoose = require('mongoose');

const featuredSlotSchema = new mongoose.Schema({
  product:     { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  customImage: { type: String, default: '' },
}, { _id: false });

const siteSettingsSchema = new mongoose.Schema({
  key:              { type: String, default: 'global', unique: true },
  featuredProducts: { type: [featuredSlotSchema], default: [] },
}, { timestamps: true });

module.exports = mongoose.model('SiteSettings', siteSettingsSchema);
