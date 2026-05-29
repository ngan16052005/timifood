const payosController = require('../controllers/payosController');
const PayOS = require('@payos/node');
const payos = (process.env.PAYOS_CLIENT_ID && process.env.PAYOS_API_KEY && process.env.PAYOS_CHECKSUM_KEY) ? new PayOS(process.env.PAYOS_CLIENT_ID, process.env.PAYOS_API_KEY, process.env.PAYOS_CHECKSUM_KEY) : null;
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

// --- PAYOS INTEGRATION ---

// Create PayOS payment link
router.post('/api/payos/createPaymentLink', authenticateToken, payosController.postPayosCreatePaymentLink);;

// PayOS Webhook to receive payment status updates
router.post('/api/payos/webhook', payosController.postPayosWebhook);;


module.exports = router;
