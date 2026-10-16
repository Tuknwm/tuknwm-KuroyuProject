const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  label:    { type: String, trim: true },
  name:     { type: String, trim: true },
  phone:    { type: String, trim: true },
  street:   { type: String, trim: true },
  city:     { type: String, trim: true },
  province: { type: String, trim: true },
  zip:      { type: String, trim: true },
}, { _id: true });

const userSchema = new mongoose.Schema({
  name:      { type: String, required: [true, 'Name is required'], trim: true, maxlength: 80 },
  email:     { type: String, required: [true, 'Email is required'], unique: true, lowercase: true, trim: true },
  password:  { type: String, required: true, select: false },
  role:           { type: String, enum: ['user', 'admin'], default: 'user' },
  disabled:       { type: Boolean, default: false },
  disabledReason: { type: String, default: null },
  addresses:      { type: [addressSchema], default: [] },
  wallets:        { type: Map, of: String, default: {} },
  resetToken:        { type: String, select: false },
  resetTokenExpiry:  { type: Date,   select: false },
  scheduledDeleteAt: { type: Date,   default: null },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
