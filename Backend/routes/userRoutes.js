const express = require('express');
const auth = require('../middleware/auth');
const { getAddresses, addAddress, deleteAddress, updateProfile, updatePassword, getWallets, updateWallets } = require('../controllers/userController');

const router = express.Router();
router.use(auth);

router.get('/addresses', getAddresses);
router.post('/addresses', addAddress);
router.delete('/addresses/:id', deleteAddress);
router.put('/profile', updateProfile);
router.put('/password', updatePassword);
router.get('/wallets', getWallets);
router.put('/wallets', updateWallets);

module.exports = router;
