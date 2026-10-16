const Notification = require('../models/Notification');

const clients = new Map();

function subscribe(req, res) {
  res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
  res.flushHeaders();
  clients.set(req.user.id, res);
  req.on('close', () => clients.delete(req.user.id));
}

async function pushNotification(userId, data) {
  const notif = await Notification.create({ user: userId, ...data });
  const client = clients.get(String(userId));
  if (client) client.write(`data: ${JSON.stringify(notif)}\n\n`);
  return notif;
}

async function getNotifications(req, res) {
  try {
    const notifs = await Notification.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(20);
    res.json({ success: true, notifications: notifs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function markRead(req, res) {
  try {
    await Notification.updateMany({ user: req.user.id }, { unread: false });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function clearNotifications(req, res) {
  try {
    await Notification.deleteMany({ user: req.user.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { subscribe, pushNotification, getNotifications, markRead, clearNotifications };
