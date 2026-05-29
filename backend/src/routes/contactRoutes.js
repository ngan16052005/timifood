const contactController = require('../controllers/contactController');
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

// Contact API
router.post('/api/contact', contactController.postContact);;

// Admin get contacts
router.get('/api/contacts', authenticateToken, isAdmin, contactController.getContacts);;

// Admin update contact status
router.put('/api/contacts/:id/status', authenticateToken, isAdmin, contactController.putContactsIdStatus);;

// Admin reply to contact
router.post('/api/contacts/:id/reply', authenticateToken, isAdmin, contactController.postContactsIdReply);;

// Admin delete contact
router.delete('/api/contacts/:id', authenticateToken, isAdmin, contactController.deleteContactsId);;



module.exports = router;
