const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const { cacheMiddleware, clearCache } = require('../middleware/cache');
const { validate } = require('../middleware/validate');
const { categorySchema } = require('../validators/schemas');

// Public routes
router.get('/', cacheMiddleware(300), categoryController.getAllCategories);

// Protected routes (Admin only)
router.post('/', authenticateToken, isAdmin, validate(categorySchema), (req, res, next) => {
    clearCache('/api/categories');
    next();
}, categoryController.addCategory);

router.put('/:id', authenticateToken, isAdmin, validate(categorySchema), (req, res, next) => {
    clearCache('/api/categories');
    next();
}, categoryController.updateCategory);

router.delete('/:id', authenticateToken, isAdmin, (req, res, next) => {
    clearCache('/api/categories');
    next();
}, categoryController.deleteCategory);

module.exports = router;
