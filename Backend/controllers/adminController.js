const User = require('../models/User');

const listUsers = async (req, res) => {
  try {
    const users = await User.find({}, 'name email role disabled disabledReason createdAt').sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const setRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) return res.status(400).json({ success: false, message: 'Invalid role.' });
    if (req.params.id === req.user.id) return res.status(400).json({ success: false, message: 'Cannot change your own role.' });
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true, select: 'name email role disabled disabledReason' });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const setDisabled = async (req, res) => {
  try {
    const { disabled, reason } = req.body;
    if (req.params.id === req.user.id) return res.status(400).json({ success: false, message: 'Cannot disable your own account.' });
    const update = disabled
      ? { disabled: true, disabledReason: reason || null }
      : { disabled: false, disabledReason: null };
    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true, select: 'name email role disabled disabledReason' });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { listUsers, setRole, setDisabled };
