const cartController = require('../controllers/cartController');
const express = require('express');
const router = express.Router();
const { sql, connectDB } = require('../config/db');
const { authenticateToken, isAdmin, isStaffOrAdmin } = require('../middleware/auth');
const { validate, cartSchema } = require('../validators/appValidator');
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

// --- CART API ---

// Get user cart (Protected)
router.get('/api/cart', authenticateToken, cartController.getCart);

// Update user cart (Protected)
router.post('/api/cart', authenticateToken, validate(cartSchema), cartController.postCart);




module.exports = router;
