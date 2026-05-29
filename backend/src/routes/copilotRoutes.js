const copilotController = require('../controllers/copilotController');
const { GoogleGenAI } = require('@google/genai');
const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;
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

// ==========================================
// AI COPILOT: Admin Business Insights
// ==========================================
// Web Push Subscription
router.post('/api/push/subscribe', authenticateToken, copilotController.postPushSubscribe);;

router.get('/api/push/publicKey', (req, res) => {
    res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

// Gửi tin nhắn cho AI
router.post('/api/chat/ai', copilotController.postChatAi);;




module.exports = router;
