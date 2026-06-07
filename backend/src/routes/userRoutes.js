const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, isAdmin } = require('../middleware/auth');

router.get('/', authenticateToken, isAdmin, userController.getUsers);
router.get('/me', authenticateToken, userController.getCurrentUser);
router.post('/redeem', authenticateToken, userController.redeemVoucher);
router.put('/:phone', authenticateToken, userController.updateUser);
router.delete('/:phone', authenticateToken, isAdmin, userController.deleteUser);

module.exports = router;
