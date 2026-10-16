const bcrypt = require('bcryptjs');
const User = require('../models/User');

const getAddresses = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('addresses');
    res.json({ success: true, addresses: user.addresses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const addAddress = async (req, res) => {
  try {
    const { label, name, phone, street, city, province, zip } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $push: { addresses: { label, name, phone, street, city, province, zip } } },
      { returnDocument: 'after' }
    ).select('addresses');
    res.status(201).json({ success: true, addresses: user.addresses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteAddress = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $pull: { addresses: { _id: req.params.id } } },
      { returnDocument: 'after' }
    ).select('addresses');
    res.json({ success: true, addresses: user.addresses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) return res.status(400).json({ success: false, message: 'Name and email are required.' });
    const conflict = await User.exists({ email: email.toLowerCase(), _id: { $ne: req.user.id } });
    if (conflict) return res.status(409).json({ success: false, message: 'Email is already in use.' });
    const user = await User.findByIdAndUpdate(req.user.id, { name, email }, { returnDocument: 'after' });
    res.json({ success: true, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ success: false, message: 'Both passwords are required.' });
    if (newPassword.length < 8) return res.status(400).json({ success: false, message: 'New password must be at least 8 characters.' });
    const user = await User.findById(req.user.id).select('+password');
    if (!await bcrypt.compare(currentPassword, user.password)) return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();
    res.json({ success: true, message: 'Password updated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getWallets = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('wallets');
    res.json({ success: true, wallets: Object.fromEntries(user.wallets || []) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateWallets = async (req, res) => {
  try {
    const allowed = ['gopay', 'dana', 'ovo'];
    const update = {};
    for (const id of allowed) {
      const phone = req.body[id];
      update[`wallets.${id}`] = phone && phone.trim() ? phone.trim() : '';
    }
    const user = await User.findByIdAndUpdate(req.user.id, { $set: update }, { returnDocument: 'after' }).select('wallets');
    res.json({ success: true, wallets: Object.fromEntries(user.wallets || []) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAddresses, addAddress, deleteAddress, updateProfile, updatePassword, getWallets, updateWallets };
