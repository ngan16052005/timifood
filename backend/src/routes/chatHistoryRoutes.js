const chatHistoryController = require('../controllers/chatHistoryController');
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

// ==================== CHAT HISTORY API ====================

// Lấy danh sách phiên chat (Admin)
router.get('/api/chat/history', authenticateToken, isAdmin, chatHistoryController.getChatHistory);;

// Lấy chi tiết tin nhắn của một phiên chat (Admin)
router.get('/api/chat/history/:sessionId', authenticateToken, isAdmin, chatHistoryController.getChatHistorySessionid);;

// Xóa phiên chat (Admin)
router.delete('/api/chat/history/:sessionId', authenticateToken, isAdmin, chatHistoryController.deleteChatHistorySessionid);;



module.exports = router;
