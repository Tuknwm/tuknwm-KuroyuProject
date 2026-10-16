const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  user:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  icon:   { type: String, default: 'package' },
  title:  String,
  body:   String,
  unread: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Notification', schema);
