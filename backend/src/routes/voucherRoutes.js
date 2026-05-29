const express = require('express');
const router = express.Router();
const voucherController = require('../controllers/voucherController');
const { authenticateToken, isAdmin } = require('../middleware/auth');

router.get('/', authenticateToken, isAdmin, voucherController.getVouchers);
router.get('/:code', voucherController.getVoucherByCode);
router.post('/', authenticateToken, isAdmin, voucherController.createVoucher);
router.put('/:code', authenticateToken, isAdmin, voucherController.updateVoucher);
router.delete('/:code', authenticateToken, isAdmin, voucherController.deleteVoucher);

module.exports = router;
