const express = require('express');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const { getChat, sendMessage, getAllChats, adminReply } = require('../controllers/chatController');

const router = express.Router();
router.use(auth);

router.get('/', getChat);
router.post('/', sendMessage);

router.get('/admin', adminOnly, getAllChats);
router.post('/admin/:userId', adminOnly, adminReply);

module.exports = router;
