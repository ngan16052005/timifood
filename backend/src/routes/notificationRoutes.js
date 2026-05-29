const notificationController = require('../controllers/notificationController');
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

// --- NOTIFICATION MANAGEMENT ---

// Get notifications for current user
router.get('/api/notifications', authenticateToken, notificationController.getNotifications);;

// Mark notification as read
router.put('/api/notifications/:id/read', authenticateToken, notificationController.putNotificationsIdRead);;

// Mark all as read
router.put('/api/notifications/readAll', authenticateToken, notificationController.putNotificationsReadAll);;

// Delete a specific notification
router.delete('/api/notifications/:id', authenticateToken, notificationController.deleteNotificationsId);;

// Delete all notifications for current user
router.delete('/api/notifications', authenticateToken, notificationController.deleteNotifications);;

// --- END NOTIFICATION MANAGEMENT ---



module.exports = router;
