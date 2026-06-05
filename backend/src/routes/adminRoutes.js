const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, isAdmin, isStaffOrAdmin } = require('../middleware/auth');

router.get('/inventory/stats', authenticateToken, isStaffOrAdmin, adminController.getInventoryStats);
router.get('/admin/stats/report', authenticateToken, isAdmin, adminController.getStatsReport);
router.get('/admin/reviews', authenticateToken, isAdmin, adminController.getAdmin_reviews);
router.delete('/admin/reviews/:id', authenticateToken, isAdmin, adminController.deleteAdmin_reviews_id);
router.get('/admin/stock-history', authenticateToken, isAdmin, adminController.getAdmin_stock_history);
router.delete('/admin/stock-history/:id', authenticateToken, isAdmin, adminController.deleteAdmin_stock_history);
router.get('/admin/logs', authenticateToken, isAdmin, adminController.getAdmin_logs);
router.delete('/admin/logs/:id', authenticateToken, isAdmin, adminController.deleteAdmin_log);
router.delete('/admin/logs', authenticateToken, isAdmin, adminController.clearAdmin_logs);
router.post('/admin/stock-in', authenticateToken, isAdmin, adminController.createAdmin_stock_in);

// Suppliers
router.get('/admin/suppliers', authenticateToken, isAdmin, adminController.getAdmin_suppliers);
router.post('/admin/suppliers', authenticateToken, isAdmin, adminController.createAdmin_supplier);
router.delete('/admin/suppliers/:id', authenticateToken, isAdmin, adminController.deleteAdmin_supplier);

// Purchase Orders
router.get('/admin/purchase-orders', authenticateToken, isAdmin, adminController.getAdmin_purchase_orders);
router.post('/admin/purchase-orders', authenticateToken, isAdmin, adminController.createAdmin_purchase_order);
router.delete('/admin/purchase-orders/:id', authenticateToken, isAdmin, adminController.deleteAdmin_purchase_order);

router.post('/admin/ai-insights', adminController.getAiInsights);

module.exports = router;
