const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const { sendWelcome, sendResetPassword } = require('../utils/mailer');
const { pushNotification } = require('./notificationController');

const createToken = (user) => jwt.sign({ id: user._id, email: user.email, role: user.role || 'user' }, process.env.JWT_SECRET, { expiresIn: '7d' });
const publicUser = (user) => ({ id: user._id, name: user.name, email: user.email, role: user.role || 'user' });
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    if (password.length < 8) return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
    if (await User.exists({ email: email.toLowerCase() })) return res.status(409).json({ success: false, message: 'Email is already registered.' });
    const user = await User.create({ name, email, password: await bcrypt.hash(password, 12) });
    sendWelcome({ name: user.name, email: user.email });
    pushNotification(user._id, {
      icon: 'info',
      title: 'Welcome to Kuroyu! 👋',
      body: `Hi ${user.name}! Thanks for joining us. We'll notify you about your orders, promos, and updates right here.`,
    }).catch(() => {});
    res.status(201).json({ success: true, token: createToken(user), user: publicUser(user) });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() }).select('+password');
    if (!user || !password || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ success: false, message: 'Email or password is incorrect.' });
    if (user.disabled) return res.status(403).json({ success: false, message: `Your account has been disabled. Reason: ${user.disabledReason || 'No reason provided.'}` });
    res.json({ success: true, token: createToken(user), user: publicUser(user) });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const checkEmail = async (req, res) => {
  try {
    const email = String(req.body.email || '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ success: false, message: 'A valid email is required.' });
    const exists = await User.exists({ email: email.toLowerCase() });
    res.json({ success: true, exists: Boolean(exists) });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ success: false, message: 'No credential provided.' });
    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: process.env.GOOGLE_CLIENT_ID });
    const { email, name, sub } = ticket.getPayload();
    let user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      user = await User.create({ name, email, password: await bcrypt.hash(sub + process.env.JWT_SECRET, 12) });
      sendWelcome({ name: user.name, email: user.email });
      pushNotification(user._id, {
        icon: 'info',
        title: 'Welcome to Kuroyu! 👋',
        body: `Hi ${user.name}! Thanks for joining us. We'll notify you about your orders, promos, and updates right here.`,
      }).catch(() => {});
    }
    if (user.disabled) return res.status(403).json({ success: false, message: `Your account has been disabled. Reason: ${user.disabledReason || 'No reason provided.'}` });
    res.json({ success: true, token: createToken(user), user: publicUser(user) });
  } catch (e) {
    res.status(401).json({ success: false, message: 'Google authentication failed.' });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const user = await User.findOne({ email });
    // Always respond OK so we don't leak which emails are registered
    if (!user) return res.json({ success: true });
    const token = crypto.randomBytes(32).toString('hex');
    user.resetToken = crypto.createHash('sha256').update(token).digest('hex');
    user.resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    await sendResetPassword({ name: user.name, email: user.email, resetUrl });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password || password.length < 8)
      return res.status(400).json({ success: false, message: 'Invalid request.' });
    const hashed = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({ resetToken: hashed, resetTokenExpiry: { $gt: new Date() } }).select('+resetToken +resetTokenExpiry +password');
    if (!user) return res.status(400).json({ success: false, message: 'Reset link is invalid or has expired.' });
    user.password = await bcrypt.hash(password, 12);
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { register, login, checkEmail, googleLogin, forgotPassword, resetPassword };
