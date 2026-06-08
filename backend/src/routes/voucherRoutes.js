const express = require('express');
const router = express.Router();
const voucherController = require('../controllers/voucherController');
const { authenticateToken, optionalAuthenticateToken, isAdmin } = require('../middleware/auth');

router.get('/', authenticateToken, isAdmin, voucherController.getVouchers);
router.get('/active', optionalAuthenticateToken, voucherController.getActiveVouchers);
router.get('/rewards', voucherController.getRewardPackages);
router.get('/rewards/all', authenticateToken, isAdmin, voucherController.getAllRewardPackages);
router.post('/rewards', authenticateToken, isAdmin, voucherController.createRewardPackage);
router.put('/rewards/:id', authenticateToken, isAdmin, voucherController.updateRewardPackage);
router.delete('/rewards/:id', authenticateToken, isAdmin, voucherController.deleteRewardPackage);
router.get('/:code', optionalAuthenticateToken, voucherController.getVoucherByCode);
router.post('/', authenticateToken, isAdmin, voucherController.createVoucher);
router.put('/:code', authenticateToken, isAdmin, voucherController.updateVoucher);
router.delete('/:code', authenticateToken, isAdmin, voucherController.deleteVoucher);

module.exports = router;
