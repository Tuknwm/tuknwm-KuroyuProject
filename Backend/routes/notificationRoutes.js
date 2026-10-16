const express = require('express');
const auth = require('../middleware/auth');
const { subscribe, getNotifications, markRead, clearNotifications } = require('../controllers/notificationController');

const router = express.Router();
router.use(auth);

router.get('/stream', subscribe);
router.get('/', getNotifications);
router.patch('/read', markRead);
router.delete('/', clearNotifications);

module.exports = router;
