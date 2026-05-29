const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const { cacheMiddleware, clearCache } = require('../middleware/cache');
const { validate } = require('../middleware/validate');
const { productSchema } = require('../validators/schemas');

// Public routes
router.get('/', cacheMiddleware(300), productController.getAllProducts);
router.get('/:id', cacheMiddleware(300), productController.getProductById);

// Protected routes (Admin only)
router.post('/', authenticateToken, isAdmin, validate(productSchema), (req, res, next) => {
    clearCache('/api/products');
    next();
}, productController.addProduct);

router.put('/:id', authenticateToken, isAdmin, validate(productSchema), (req, res, next) => {
    clearCache('/api/products');
    next();
}, productController.updateProduct);

router.delete('/:id', authenticateToken, isAdmin, (req, res, next) => {
    clearCache('/api/products');
    next();
}, productController.deleteProduct);

module.exports = router;
