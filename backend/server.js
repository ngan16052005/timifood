const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const bodyParser = require('body-parser');
const compression = require('compression');
const path = require('path');
const twilio = require('twilio');

const accountSid = 'YOUR_ACCOUNT_SID';
const authToken = 'YOUR_AUTH_TOKEN';
const twilioPhone = 'YOUR_TWILIO_PHONE_NUMBER';
const { sql, connectDB } = require('./src/config/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { authenticateToken, isAdmin, isStaffOrAdmin, SECRET_KEY } = require('./src/middleware/auth');
const { globalLimiter, loginLimiter, otpLimiter, resetPasswordLimiter, registerLimiter, changePasswordLimiter, orderLimiter } = require('./src/middleware/rateLimiter');
const { cacheMiddleware, clearCache } = require('./src/middleware/cache');
const { transporter, sendOrderEmail, sendContactEmail, sendReplyEmail } = require('./src/helpers/email');

const PayOS = require('@payos/node');
const payos = (process.env.PAYOS_CLIENT_ID && process.env.PAYOS_API_KEY && process.env.PAYOS_CHECKSUM_KEY)
    ? new PayOS(process.env.PAYOS_CLIENT_ID, process.env.PAYOS_API_KEY, process.env.PAYOS_CHECKSUM_KEY)
    : null;

const { GoogleGenAI } = require('@google/genai');
const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

const { OAuth2Client } = require('google-auth-library');
const axios = require('axios');
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const webpush = require('web-push');
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        process.env.VAPID_SUBJECT || 'mailto:admin@timifood.com',
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
}

const otpStore = new Map();

process.on('uncaughtException', (err) => {
    console.error('CRITICAL UNCAUGHT EXCEPTION:', err);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('CRITICAL UNHANDLED REJECTION at:', promise, 'reason:', reason);
});

const http = require('http');
const { Server } = require('socket.io');

const app = express();
app.set('trust proxy', 1);
const server = http.createServer(app);
const corsOrigin = process.env.CORS_ORIGIN || '*';
const parsedCorsOrigin = corsOrigin === '*' ? '*' : corsOrigin.split(',').map(s => s.trim());

const io = new Server(server, {
    cors: {
        origin: parsedCorsOrigin,
        methods: ["GET", "POST"]
    }
});

const { createAdapter } = require('@socket.io/cluster-adapter');
const { setupWorker } = require('@socket.io/sticky');
if(require('cluster').isWorker) io.adapter(createAdapter());
if(require('cluster').isWorker) setupWorker(io);

const PORT = process.env.PORT || 3500;

app.use((req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
    next();
});
app.use(cors({
    origin: parsedCorsOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));
app.use(globalLimiter);
app.use(compression()); app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

app.use((req, res, next) => {
    console.log(`${new Date().toLocaleString()} - ${req.method} ${req.url}`);
    next();
});

const { activeChats, getActiveChatsSummary } = require('./src/socket/handlers')({ io });
app.locals.getActiveChatsSummary = getActiveChatsSummary;



let pool;
let createNotification, createLog;
async function startServer() {
    try {
        pool = await connectDB();
        if (!pool) {
            console.error('Could not connect to database. Server starting without DB...');
        } else {
            await require('./src/config/initDB')(pool);

                        ({ createNotification } = require('./src/helpers/notification')({ pool, sql, io }));
            ({ createLog } = require('./src/helpers/logger')({ pool, sql }));
            app.locals.createNotification = createNotification;
            app.locals.createLog = createLog;
        }

                if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            transporter.verify((error, success) => {
                if (error) {
                    console.error("[Email] Nodemailer transporter verification failed:", error.message);
                } else {
                    console.log("[Email] Nodemailer transporter connection established successfully and ready.");
                }
            });
        } else {
            console.warn("[Email] Nodemailer skipping validation: No credentials provided in environment.");
        }

        if (require.main === module || process.env.NODE_ENV !== 'test') {
            server.listen(PORT, () => {
                console.log(`Server is running on http://localhost:${PORT}`);
            }).on('error', (err) => {
                console.error('Server failed to start:', err);
            });
        }
    } catch (err) {
        console.error('Start server error:', err);
    }
}

async function resolveOrderId(paramId) {
    const isUUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/i.test(paramId);
    if (isUUID) return paramId;
    const result = await pool.request()
        .input('orderCode', sql.NVarChar, paramId)
        .query('SELECT id FROM Orders WHERE orderCode = @orderCode');
    if (result.recordset.length > 0) return result.recordset[0].id;
    return paramId; }

// Delete order (Customer can delete history of completed/cancelled orders)


app.use('/api', require('./src/routes/adminRoutes'));

app.use('/api/users', require('./src/routes/userRoutes'));

app.use('/api', require('./src/routes/authRoutes'));

// Push Notifications Endpoints
app.get('/api/push/public-key', (req, res) => {
    res.json({ publicKey: process.env.VAPID_PUBLIC_KEY || '' });
});
app.post('/api/push/subscribe', authenticateToken, (req, res) => {
    res.json({ success: true });
});

app.use('/api', require('./src/routes/newsRoutes'));

app.use('/api/vouchers', require('./src/routes/voucherRoutes'));

app.use('/api/orders', require('./src/routes/orderRoutes'));

app.use('/api/products', (req, res, next) => {
    console.log("PRODUCT ROUTE HIT! Url:", req.url);
    next();
}, require('./src/routes/productRoutes'));


// Google Login

// Complete Google Registration

// Facebook Login

// Complete Facebook Registration

// Send OTP via Email

// Verify OTP only

// Send OTP via SMS (Twilio)

// Verify OTP SMS

// Reset Password with OTP verified by Firebase

// Register

// Change Password API

// Get all users (Admin only)

// Update user (Admin or Owner)

// Delete user (Admin only)

app.use('/', require('./src/routes/cartRoutes'));

// Create order (Protected)

// Get orders paginated (Protected)

// Get orders (Protected)

// Get order details

// Cancel order (User only, status 0 only)

// Update order (User only, status 0 only)

// Update order status (Staff and Admin)


// Check voucher validity (Public)

// Create voucher (Admin only)

// Update voucher status (Admin only)

// Delete voucher (Admin only)

app.use('/', require('./src/routes/reviewRoutes'));

// Get advanced statistics for charts



// Admin: Get all reviews

// Delete a review



// Get Stock History

// Record Stock In


app.use('/', require('./src/routes/notificationRoutes'));
app.use('/api/categories', require('./src/routes/categoryRoutes'));
app.use('/api/inventory', require('./src/routes/inventoryRoutes'));


app.use('/', require('./src/routes/livechatRoutes'));
app.use('/', require('./src/routes/payosRoutes'));
app.use('/', require('./src/routes/contactRoutes'));
app.use('/', require('./src/routes/favoriteRoutes'));
app.use('/', require('./src/routes/chatHistoryRoutes'));
app.use('/', require('./src/routes/copilotRoutes'));

// Láº¥y danh sÃ¡ch tin tá»©c (Public)

// Láº¥y danh sÃ¡ch tin tá»©c (Admin - Láº¥y cáº£ bÃ i áº©n)

// Láº¥y chi tiáº¿t tin tá»©c

// ThÃªm tin tá»©c (Admin)

// Sá»­a tin tá»©c (Admin)

// XÃ³a tin tá»©c (Admin)

const fs = require('fs');

const serveIndex = (req, res) => {
    try {
        const layoutPath = path.join(__dirname, '../frontend/index-layout.html');
        if (!fs.existsSync(layoutPath)) {
            return res.sendFile(path.join(__dirname, '../frontend/index.html'));
        }
        let html = fs.readFileSync(layoutPath, 'utf8');
        html = html.replace(/<!--\s*INCLUDE:\s*(.*?)\s*-->/g, (match, filename) => {
            try {
                return fs.readFileSync(path.join(__dirname, '../frontend/components', filename), 'utf8');
            } catch (e) {
                console.error('Include error:', e.message);
                return `<!-- Error including ${filename} -->`;
            }
        });
        res.send(html);
    } catch (e) {
        res.status(500).send('Server Error');
    }
};

app.get('/', serveIndex);
app.get('/index.html', serveIndex);

app.get('/admin.html', (req, res) => {
    try {
        const layoutPath = path.join(__dirname, '../frontend/admin-layout.html');
        if (!fs.existsSync(layoutPath)) {
                        return res.sendFile(path.join(__dirname, '../frontend/admin.html'));
        }
        let html = fs.readFileSync(layoutPath, 'utf8');
        html = html.replace(/<!--\s*INCLUDE:\s*(.*?)\s*-->/g, (match, filename) => {
            try {
                return fs.readFileSync(path.join(__dirname, '../frontend/admin-components', filename), 'utf8');
            } catch (e) {
                console.error('Include error:', e.message);
                return `<!-- Error including ${filename} -->`;
            }
        });
        res.send(html);
    } catch (e) {
        res.status(500).send('Server Error');
    }
});

app.use(express.static(path.join(__dirname, '../frontend')));

if (process.env.NODE_ENV !== 'test') {
    startServer();
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});


app.use((err, req, res, next) => {
    console.error('ðŸ”¥ [Global Error]:', err.stack || err.message || err);
    res.status(err.status || 500).json({
        success: false,
        message: 'ÄÃ£ xáº£y ra lá»—i há»‡ thá»‘ng, vui lÃ²ng thá»­ láº¡i sau!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

module.exports = app;

