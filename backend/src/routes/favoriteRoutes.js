const favoriteController = require('../controllers/favoriteController');
const express = require('express');
const router = express.Router();
const { sql, connectDB } = require('../config/db');
const { authenticateToken, isAdmin, isStaffOrAdmin } = require('../middleware/auth');
const { createNotification } = require('../helpers/notification');
const { createLog } = require('../helpers/logger');
const { sendOrderEmail, sendReplyEmail } = require('../helpers/email');
const webpush = require('web-push');

let pool;
connectDB().then(p => pool = p).catch(console.error);

// Add global helpers access
router.use((req, res, next) => {
    req.pool = pool;
    next();
});

// ==================== FAVORITES API ====================

// Lấy danh sách yêu thích
router.get('/api/favorites', authenticateToken, favoriteController.getFavorites);;

// Thêm vào yêu thích
router.post('/api/favorites', authenticateToken, favoriteController.postFavorites);;

// Xóa khỏi yêu thích
router.delete('/api/favorites/:productId', authenticateToken, favoriteController.deleteFavoritesProductid);;



module.exports = router;
