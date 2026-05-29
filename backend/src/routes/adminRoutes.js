const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, isAdmin, isStaffOrAdmin } = require('../middleware/auth');

router.get('/inventory/stats', authenticateToken, isStaffOrAdmin, adminController.getInventoryStats);
router.get('/admin/stats/report', authenticateToken, isAdmin, adminController.getStatsReport);
router.get('/admin/reviews', authenticateToken, isAdmin, adminController.getAdmin_reviews);
router.delete('/admin/reviews/:id', authenticateToken, isAdmin, adminController.deleteAdmin_reviews_id);
router.get('/admin/stock-history', authenticateToken, isAdmin, adminController.getAdmin_stock_history);
router.get('/admin/logs', authenticateToken, isAdmin, adminController.getAdmin_logs);
router.post('/admin/stock-in', authenticateToken, isAdmin, adminController.createAdmin_stock_in);
router.post('/admin/ai-insights', adminController.getAiInsights);

module.exports = router;
