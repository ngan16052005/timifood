const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { authenticateToken, isAdmin, isStaffOrAdmin } = require('../middleware/auth');

router.post('/import', authenticateToken, isStaffOrAdmin, inventoryController.importStock);
router.get('/history', authenticateToken, isStaffOrAdmin, inventoryController.getImportHistory);
router.get('/profit-report', authenticateToken, isStaffOrAdmin, inventoryController.getProfitReport);

// Suppliers
router.get('/suppliers', authenticateToken, isStaffOrAdmin, inventoryController.getSuppliers);
router.post('/suppliers', authenticateToken, isStaffOrAdmin, inventoryController.createSupplier);
router.put('/suppliers/:id', authenticateToken, isStaffOrAdmin, inventoryController.updateSupplier);
router.delete('/suppliers/:id', authenticateToken, isStaffOrAdmin, inventoryController.deleteSupplier);

// Purchase Orders
router.get('/purchase-orders', authenticateToken, isStaffOrAdmin, inventoryController.getPurchaseOrders);
router.get('/purchase-orders/:id', authenticateToken, isStaffOrAdmin, inventoryController.getPurchaseOrderDetails);
router.post('/purchase-orders', authenticateToken, isStaffOrAdmin, inventoryController.createPurchaseOrder);

module.exports = router;
