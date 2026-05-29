const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticateToken, isAdmin, isStaffOrAdmin } = require('../middleware/auth');
const { orderLimiter } = require('../middleware/rateLimiter');

router.delete('/:id', authenticateToken, orderController.deleteOrder);
router.post('/', authenticateToken, orderLimiter, orderController.createOrder);
router.get('/paginated', authenticateToken, orderController.getOrdersPaginated);
router.get('/', authenticateToken, orderController.getOrders);
router.get('/:id/details', orderController.getOrderDetails);
router.put('/:id/cancel', authenticateToken, orderController.cancelOrder);
router.put('/:id/update', authenticateToken, orderController.updateOrder);
router.put('/:id/status', authenticateToken, isStaffOrAdmin, orderController.updateOrderStatus);

module.exports = router;
