const reviewController = require('../controllers/reviewController');
const express = require('express');
const router = express.Router();
const { sql, connectDB } = require('../config/db');
const { authenticateToken, isAdmin, isStaffOrAdmin } = require('../middleware/auth');
const { validate, reviewSchema } = require('../validators/appValidator');
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

// --- PRODUCT REVIEWS ---

// Get reviews for a product
router.get('/api/products/:id/reviews', reviewController.getProductsIdReviews);

// Submit a review (Protected)
router.post('/api/reviews', authenticateToken, validate(reviewSchema), reviewController.postReviews);



module.exports = router;
