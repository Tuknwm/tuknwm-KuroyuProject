const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: String, enum: ['user', 'store'], required: true },
  text:   { type: String, required: true, maxlength: 2000 },
  productRef: {
    id:    { type: String, default: null },
    title: { type: String, default: null },
    price: { type: Number, default: null },
    image: { type: String, default: null },
  },
}, { timestamps: true });

const chatSchema = new mongoose.Schema({
  user:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  messages: { type: [messageSchema], default: [] },
}, { timestamps: true });

module.exports = mongoose.model('Chat', chatSchema);
