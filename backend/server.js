const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const compression = require('compression');
const path = require('path');
const twilio = require('twilio');

// TWILIO CONFIGURATION (Will be updated by the user later)
const accountSid = 'YOUR_ACCOUNT_SID';
const authToken = 'YOUR_AUTH_TOKEN';
const twilioPhone = 'YOUR_TWILIO_PHONE_NUMBER';
// const twilioClient = new twilio(accountSid, authToken); // Uncomment when ready
const { sql, connectDB } = require('./src/config/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

// --- Module imports (Tách module - Giai đoạn 28) ---
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

// OTP Storage (Phone -> {otp, expiry})
const otpStore = new Map();

// Global error handlers to prevent silent crashes
process.on('uncaughtException', (err) => {
    console.error('CRITICAL UNCAUGHT EXCEPTION:', err);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('CRITICAL UNHANDLED REJECTION at:', promise, 'reason:', reason);
});

const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const corsOrigin = process.env.CORS_ORIGIN || '*';
const parsedCorsOrigin = corsOrigin === '*' ? '*' : corsOrigin.split(',').map(s => s.trim());

const io = new Server(server, {
    cors: {
        origin: parsedCorsOrigin,
        methods: ["GET", "POST"]
    }
});

// Configure Socket.io to use PM2 IPC adapter for Cluster Mode synchronization
const { createAdapter } = require('@socket.io/cluster-adapter');
const { setupWorker } = require('@socket.io/sticky');
if(require('cluster').isWorker) io.adapter(createAdapter());
if(require('cluster').isWorker) setupWorker(io);

const PORT = process.env.PORT || 3500;

app.use(cors({
    origin: parsedCorsOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));
app.use(globalLimiter);
app.use(compression()); // Gzip compression - Giảm dung lượng response
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toLocaleString()} - ${req.method} ${req.url}`);
    next();
});

// Socket.io & Live Chat handlers (tách module)
const { activeChats, getActiveChatsSummary } = require('./src/socket/handlers')({ io });



let pool;
let createNotification, createLog;
async function startServer() {
    try {
        pool = await connectDB();
        if (!pool) {
            console.error('Could not connect to database. Server starting without DB...');
        } else {
            await pool.request().query(`
                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SystemLogs')
                BEGIN
                    CREATE TABLE SystemLogs (
                        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
                        userId UNIQUEIDENTIFIER,
                        action NVARCHAR(100),
                        details NVARCHAR(MAX),
                        createdAt DATETIME DEFAULT GETDATE()
                    )
                END
                
                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Contacts')
                BEGIN
                    CREATE TABLE Contacts (
                        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
                        name NVARCHAR(100),
                        email NVARCHAR(100),
                        subject NVARCHAR(200),
                        message NVARCHAR(MAX),
                        status INT DEFAULT 0, -- 0: Unread, 1: Read/Resolved
                        createdAt DATETIME DEFAULT GETDATE()
                    )
                END

                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'News')
                BEGIN
                    CREATE TABLE News (
                        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
                        title NVARCHAR(255),
                        thumbnail NVARCHAR(MAX),
                        content NVARCHAR(MAX),
                        author NVARCHAR(100),
                        status INT DEFAULT 1, -- 1: Active, 0: Hidden
                        createdAt DATETIME DEFAULT GETDATE(),
                        updatedAt DATETIME DEFAULT GETDATE()
                    )
                END

                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Favorites')
                BEGIN
                    CREATE TABLE Favorites (
                        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
                        userId UNIQUEIDENTIFIER NOT NULL,
                        productId UNIQUEIDENTIFIER NOT NULL,
                        createdAt DATETIME DEFAULT GETDATE(),
                        CONSTRAINT UQ_User_Product UNIQUE (userId, productId)
                    )
                END

                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ChatSessions')
                BEGIN
                    CREATE TABLE ChatSessions (
                        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
                        customerId UNIQUEIDENTIFIER,
                        customerName NVARCHAR(100),
                        staffId UNIQUEIDENTIFIER,
                        staffName NVARCHAR(100),
                        status NVARCHAR(20) DEFAULT 'waiting', -- waiting, chatting, ended
                        createdAt DATETIME DEFAULT GETDATE(),
                        endedAt DATETIME
                    )
                END

                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ChatMessages')
                BEGIN
                    CREATE TABLE ChatMessages (
                        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
                        sessionId UNIQUEIDENTIFIER FOREIGN KEY REFERENCES ChatSessions(id) ON DELETE CASCADE,
                        sender NVARCHAR(20), -- 'customer' or 'staff'
                        text NVARCHAR(MAX),
                        timestamp DATETIME DEFAULT GETDATE()
                    )
                END
                IF COL_LENGTH('Products', 'minStock') IS NULL
                BEGIN
                    ALTER TABLE Products ADD minStock INT DEFAULT 5;
                    EXEC('UPDATE Products SET minStock = 5 WHERE minStock IS NULL');
                END
            `);
            console.log('Database initialized successfully.');

            // Khởi tạo helper functions sau khi pool sẵn sàng
            ({ createNotification } = require('./src/helpers/notification')({ pool, sql, io }));
            ({ createLog } = require('./src/helpers/logger')({ pool, sql }));
        }

        // Verify email transporter configuration
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

        server.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        }).on('error', (err) => {
            console.error('Server failed to start:', err);
        });
    } catch (err) {
        console.error('Start server error:', err);
    }
}

// Helper to resolve order ID (UUID vs orderCode)
async function resolveOrderId(paramId) {
    const isUUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/i.test(paramId);
    if (isUUID) return paramId;
    const result = await pool.request()
        .input('orderCode', sql.NVarChar, paramId)
        .query('SELECT id FROM Orders WHERE orderCode = @orderCode');
    if (result.recordset.length > 0) return result.recordset[0].id;
    return paramId; // Return original if not found (will probably throw SQL error later, but better than crashing here)
}

// Delete order (Customer can delete history of completed/cancelled orders)

// --- API ENDPOINTS ---

app.use('/api', require('./src/routes/adminRoutes'));

app.use('/api/users', require('./src/routes/userRoutes'));

app.use('/api', require('./src/routes/authRoutes'));

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

// --- CART API ---

// Get user cart (Protected)
app.get('/api/cart', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await pool.request()
            .input('userId', sql.UniqueIdentifier, userId)
            .query(`
                SELECT c.quantity as soluong, c.note as ghichu, p.* 
                FROM CartItems c
                JOIN Products p ON c.productId = p.id
                WHERE c.userId = @userId
            `);
        res.json(result.recordset || []);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching cart' });
    }
});

// Update user cart (Protected)
app.post('/api/cart', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const cart = req.body;
        
        // Clear existing cart items
        await pool.request()
            .input('userId', sql.UniqueIdentifier, userId)
            .query('DELETE FROM CartItems WHERE userId = @userId');

        // Insert new cart items
        if (cart && cart.length > 0) {
            for (let item of cart) {
                await pool.request()
                    .input('userId', sql.UniqueIdentifier, userId)
                    .input('productId', sql.UniqueIdentifier, item.id)
                    .input('quantity', sql.Int, item.soluong || 1)
                    .input('note', sql.NVarChar, item.ghichu || '')
                    .query('INSERT INTO CartItems (userId, productId, quantity, note) VALUES (@userId, @productId, @quantity, @note)');
            }
        }
        res.json({ message: 'Cart updated' });
    } catch (err) {
        res.status(500).json({ message: 'Error updating cart' });
    }
});


// --- INVENTORY API ---

// Create order (Protected)

// Get orders paginated (Protected)

// Get orders (Protected)

// Get order details

// Cancel order (User only, status 0 only)

// Update order (User only, status 0 only)

// Update order status (Staff and Admin)

// Get all vouchers (Admin only)

// Check voucher validity (Public)

// Create voucher (Admin only)

// Update voucher status (Admin only)

// Delete voucher (Admin only)

// --- PRODUCT REVIEWS ---

// Get reviews for a product
app.get('/api/products/:id/reviews', async (req, res) => {
    try {
        const { id } = req.params;
        // Using global pool
        const result = await pool.request()
            .input('productId', sql.UniqueIdentifier, id)
            .query('SELECT r.*, r.createdAt as reviewDate, u.fullname as customerName FROM Reviews r JOIN Users u ON r.userId = u.id WHERE r.productId = @productId ORDER BY r.createdAt DESC');
        res.json(result.recordset);
    } catch (error) {
        console.error("Get reviews error:", error);
        res.status(500).json({ message: 'Lỗi server khi lấy đánh giá' });
    }
});

// Submit a review (Protected)
app.post('/api/reviews', authenticateToken, async (req, res) => {
    try {
        const { productId, rating, comment } = req.body;
        const userId = req.user.id;

        // Kiểm tra xem khách hàng đã mua sản phẩm này chưa (Status 2 = Completed)
        const purchaseCheck = await pool.request()
            .input('userId', sql.UniqueIdentifier, userId)
            .input('productId', sql.UniqueIdentifier, productId)
            .query(`
                SELECT TOP 1 d.productId 
                FROM Orders o 
                JOIN OrderDetails d ON o.id = d.orderId 
                WHERE o.userId = @userId 
                AND d.productId = @productId 
                AND o.status = 2
            `);

        if (purchaseCheck.recordset.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'Bạn chỉ có thể đánh giá sản phẩm sau khi đã mua và nhận hàng thành công!'
            });
        }

        let customerName = req.user.fullname;

        // Nếu trong token thiếu fullname, truy vấn lại từ DB
        if (!customerName) {
            const userResult = await pool.request()
                .input('phone', sql.NVarChar, userId)
                .query('SELECT fullname FROM Users WHERE phone = @phone');
            if (userResult.recordset.length > 0) {
                customerName = userResult.recordset[0].fullname;
            }
        }

        await pool.request()
            .input('productId', sql.UniqueIdentifier, productId)
            .input('userId', sql.UniqueIdentifier, userId)
            .input('rating', sql.Int, rating)
            .input('comment', sql.NVarChar, comment || '')
            .query('INSERT INTO Reviews (productId, userId, rating, comment, createdAt) VALUES (@productId, @userId, @rating, @comment, GETDATE())');

        res.json({ success: true, message: 'Đánh giá của bạn đã được gửi!' });
    } catch (error) {
        console.error("Submit review error:", error);
        res.status(500).json({ message: 'Lỗi server khi gửi đánh giá' });
    }
});

// --- ADMIN STATS API ---

// Get advanced statistics for charts

// --- END ADMIN STATS API ---

// --- ADMIN REVIEW MANAGEMENT ---

// Admin: Get all reviews

// Delete a review

// --- END PRODUCT REVIEWS ---

// --- STOCK MANAGEMENT ---

// Get Stock History

// Record Stock In


// --- NOTIFICATION MANAGEMENT ---

// Get notifications for current user
app.get('/api/notifications', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const isStaff = req.user.userType === 1 || req.user.userType === 2;
        
        let query = 'SELECT * FROM Notifications WHERE userId = @userId';
        if (isStaff) {
            query += " OR userId = 'ADMIN'";
        }
        query += ' ORDER BY createdAt DESC';

        const result = await pool.request()
            .input('userId', sql.NVarChar, userId)
            .query(query);
            
        // Map database schema fields to what frontend expects
        const mappedResult = result.recordset.map(row => ({
            ...row,
            message: row.body,
            isRead: row.readStatus
        }));
        
        res.json(mappedResult);
    } catch (err) {
        console.error("Fetch notifications error:", err);
        res.status(500).json({ message: 'Lỗi khi tải thông báo' });
    }
});

// Mark notification as read
app.put('/api/notifications/:id/read', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const isStaff = req.user.userType === 1 || req.user.userType === 2;

        let query = 'UPDATE Notifications SET readStatus = 1 WHERE id = @id AND (userId = @userId';
        if (isStaff) {
            query += " OR userId = 'ADMIN'";
        }
        query += ')';

        await pool.request()
            .input('id', sql.Int, id)
            .input('userId', sql.NVarChar, userId)
            .query(query);
        res.json({ success: true });
    } catch (err) {
        console.error("Mark notification read error:", err);
        res.status(500).json({ message: 'Lỗi khi cập nhật thông báo' });
    }
});

// Mark all as read
app.put('/api/notifications/read-all', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const isStaff = req.user.userType === 1 || req.user.userType === 2;

        let query = 'UPDATE Notifications SET readStatus = 1 WHERE userId = @userId';
        if (isStaff) {
            query += " OR userId = 'ADMIN'";
        }

        await pool.request()
            .input('userId', sql.NVarChar, userId)
            .query(query);
        res.json({ success: true });
    } catch (err) {
        console.error("Mark all read error:", err);
        res.status(500).json({ message: 'Lỗi khi cập nhật thông báo' });
    }
});

// Delete a specific notification
app.delete('/api/notifications/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const isStaff = req.user.userType === 1 || req.user.userType === 2;

        let query = 'DELETE FROM Notifications WHERE id = @id AND (userId = @userId';
        if (isStaff) {
            query += " OR userId = 'ADMIN'";
        }
        query += ')';

        await pool.request()
            .input('id', sql.Int, id)
            .input('userId', sql.NVarChar, userId)
            .query(query);
        res.json({ success: true });
    } catch (err) {
        console.error("Delete notification error:", err);
        res.status(500).json({ message: 'Lỗi khi xóa thông báo' });
    }
});

// Delete all notifications for current user
app.delete('/api/notifications', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const isStaff = req.user.userType === 1 || req.user.userType === 2;

        let query = 'DELETE FROM Notifications WHERE userId = @userId';
        if (isStaff) {
            query += " OR userId = 'ADMIN'";
        }

        await pool.request()
            .input('userId', sql.NVarChar, userId)
            .query(query);
        res.json({ success: true });
    } catch (err) {
        console.error("Delete all notifications error:", err);
        res.status(500).json({ message: 'Lỗi khi xóa tất cả thông báo' });
    }
});

// --- END NOTIFICATION MANAGEMENT ---

app.use('/api/categories', require('./src/routes/categoryRoutes'));


// --- LIVE CHAT API ---
// Retrieve summary of all active chat sessions (Staff/Admin only)
app.get('/api/livechats', authenticateToken, async (req, res) => {
    try {
        const isStaff = req.user.userType === 1 || req.user.userType === 2;
        if (!isStaff) return res.status(403).json({ message: 'Quyền truy cập bị từ chối!' });
        res.json(getActiveChatsSummary());
    } catch (err) {
        console.error("Fetch livechats API error:", err);
        res.status(500).json({ message: 'Lỗi khi tải các phiên chat!' });
    }
});

// --- PAYOS INTEGRATION ---

// Create PayOS payment link
app.post('/api/payos/create-payment-link', authenticateToken, async (req, res) => {
    try {
        const { orderId, amount, description } = req.body;
        
        if (!orderId || !amount) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin đơn hàng hoặc số tiền' });
        }

        // PayOS orderCode must be an integer (max 2^53 - 1)
        // Extract number from DH001 -> 1
        const orderCode = parseInt(orderId.replace(/\D/g, '')) || Math.floor(Date.now() / 1000);
        
        // Use client's origin or standard localhost as fallback
        const clientOrigin = req.headers.origin || `http://localhost:${process.env.PORT || 3500}`;
        
        // Clean description: PayOS only accepts alphanumeric and spaces, no accents
        const cleanDesc = (description || `TiMiFood ${orderId}`)
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-zA-Z0-9 ]/g, "")
            .substring(0, 25);

        const paymentData = {
            orderCode: orderCode,
            amount: Math.round(amount),
            description: cleanDesc,
            cancelUrl: `${clientOrigin}/checkout-cancel.html?orderId=${orderId}`,
            returnUrl: `${clientOrigin}/checkout-success.html?orderId=${orderId}`
        };

        if (!payos) {
            console.warn("[PayOS] SDK not initialized due to missing keys in .env. Returning warning.");
            return res.status(400).json({
                success: false,
                isMock: true,
                message: 'PayOS chưa được cấu hình. Vui lòng thêm PAYOS_CLIENT_ID, PAYOS_API_KEY, PAYOS_CHECKSUM_KEY vào tệp .env.'
            });
        }

        const paymentLinkResponse = await payos.createPaymentLink(paymentData);
        
        res.json({
            success: true,
            checkoutUrl: paymentLinkResponse.checkoutUrl,
            qrCode: paymentLinkResponse.qrCode
        });
    } catch (error) {
        console.error("PayOS Create Payment Link Error:", error);
        res.status(500).json({ success: false, message: error.message || 'Lỗi khi tạo liên kết thanh toán PayOS' });
    }
});

// PayOS Webhook to receive payment status updates
app.post('/api/payos/webhook', async (req, res) => {
    try {
        const webhookData = req.body;
        console.log("[PayOS Webhook] Received webhook payload:", JSON.stringify(webhookData, null, 2));

        if (!payos) {
            console.warn("[PayOS Webhook] PayOS SDK not initialized. Webhook cannot verify signature.");
            return res.status(400).json({ success: false, message: 'PayOS not configured on server' });
        }

        // Verify webhook signature (PayOS SDK handles this)
        let verifiedData;
        try {
            verifiedData = payos.verifyPaymentWebhookData(webhookData);
            console.log("[PayOS Webhook] Signature verified successfully:", verifiedData);
        } catch (err) {
            console.error("[PayOS Webhook] Signature verification failed:", err);
            return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
        }

        // PayOS verifiedData contains success and data attributes
        const orderCode = verifiedData.orderCode;
        
        if (orderCode) {
            // Map orderCode back to order ID
            const orderIdStr = 'DH' + orderCode.toString().padStart(3, '0');
            console.log(`[PayOS Webhook] Processing payment success for order: ${orderIdStr}`);

            // Fetch order from DB
            const orderResult = await pool.request()
                .input('id', sql.NVarChar, orderIdStr)
                .query('SELECT status, userId, totalPrice, receiverAddress, receiverPhone, note FROM Orders WHERE id = @id');
            
            if (orderResult.recordset.length > 0) {
                const order = orderResult.recordset[0];
                
                // Check if already paid to avoid double processing
                if (order.note && order.note.includes('[Đã thanh toán qua PayOS]')) {
                    console.log(`[PayOS Webhook] Order ${orderIdStr} was already marked as paid.`);
                    return res.json({ success: true, message: 'Already processed' });
                }

                const newNote = `[Đã thanh toán qua PayOS] ${order.note || ''}`.substring(0, 1000);
                
                // Update Order Note and change status to 1 (Đang giao)
                await pool.request()
                    .input('id', sql.NVarChar, orderIdStr)
                    .input('note', sql.NVarChar, newNote)
                    .query('UPDATE Orders SET status = 1, note = @note WHERE id = @id');
                
                console.log(`[PayOS Webhook] Order ${orderIdStr} marked as Paid/Delivering.`);

                // System Notification for customer
                await createNotification(
                    order.userId, 
                    "Thanh toán thành công", 
                    `Đơn hàng #${orderIdStr} đã được thanh toán thành công qua PayOS! Nhân viên đang chuẩn bị món ăn.`, 
                    "order"
                );
                
                // System Notification for Admin/Staff
                await createNotification(
                    "ADMIN", 
                    "Thanh toán đơn hàng", 
                    `Đơn hàng #${orderIdStr} từ ${order.userId} đã được thanh toán thành công qua PayOS`, 
                    "order"
                );
                
                // Log activity
                await createLog(order.userId, 'PAYOS_PAYMENT_SUCCESS', `Thanh toán thành công ${order.totalPrice}đ cho đơn hàng #${orderIdStr}`);
                
                // Send email confirmation
                const userResult = await pool.request()
                    .input('phone', sql.NVarChar, order.userId)
                    .query('SELECT email FROM Users WHERE phone = @phone');
                
                if (userResult.recordset.length > 0 && userResult.recordset[0].email) {
                    const customerEmail = userResult.recordset[0].email;
                    sendOrderEmail(orderIdStr, customerEmail, "Đã thanh toán qua PayOS (Đang giao hàng)", {
                        totalPrice: order.totalPrice,
                        receiverAddress: order.receiverAddress,
                        receiverPhone: order.receiverPhone
                    });
                }
            } else {
                console.warn(`[PayOS Webhook] Order with ID ${orderIdStr} not found in database.`);
            }
        }

        res.json({ success: true });
    } catch (error) {
        console.error("PayOS Webhook processing error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});
// Contact API
app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;
        if (!name || !email || !subject || !message) {
            return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ thông tin' });
        }
        
        await pool.request()
            .input('name', sql.NVarChar, name)
            .input('email', sql.NVarChar, email)
            .input('subject', sql.NVarChar, subject)
            .input('message', sql.NVarChar, message)
            .query('INSERT INTO Contacts (name, email, subject, message) VALUES (@name, @email, @subject, @message)');
        
        // Notify admin via socket/system notification
        if (createNotification) {
            await createNotification("ADMIN", "Liên hệ mới", `Có liên hệ mới từ ${name} (${email}) - ${subject}`, "system");
        }

        res.json({ success: true, message: 'Tin nhắn đã được gửi thành công' });
    } catch (error) {
        console.error('Error sending contact message:', error);
        res.status(500).json({ success: false, message: 'Đã xảy ra lỗi khi lưu liên hệ. Vui lòng thử lại sau.' });
    }
});

// Admin get contacts
app.get('/api/contacts', authenticateToken, isAdmin, async (req, res) => {
    try {
        const result = await pool.request().query('SELECT * FROM Contacts ORDER BY createdAt DESC');
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi lấy danh sách liên hệ' });
    }
});

// Admin update contact status
app.put('/api/contacts/:id/status', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        await pool.request()
            .input('id', sql.UniqueIdentifier, id)
            .input('status', sql.Int, status)
            .query('UPDATE Contacts SET status = @status WHERE id = @id');
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi cập nhật trạng thái liên hệ' });
    }
});

// Admin reply to contact
app.post('/api/contacts/:id/reply', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { replyMessage } = req.body;
        
        // 1. Get contact info
        const result = await pool.request()
            .input('id', sql.UniqueIdentifier, id)
            .query('SELECT * FROM Contacts WHERE id = @id');
            
        if (result.recordset.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy liên hệ' });
        }
        
        const contact = result.recordset[0];
        
        // 2. Send email
        await sendReplyEmail(contact.email, contact.subject, replyMessage);
        
        // 3. Update status to Replied (2)
        await pool.request()
            .input('id', sql.UniqueIdentifier, id)
            .query('UPDATE Contacts SET status = 2 WHERE id = @id');
            
        res.json({ success: true, message: 'Đã gửi phản hồi thành công' });
    } catch (error) {
        console.error('Error sending reply:', error);
        res.status(500).json({ success: false, message: 'Đã xảy ra lỗi khi gửi phản hồi' });
    }
});

// Admin delete contact
app.delete('/api/contacts/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await pool.request()
            .input('id', sql.UniqueIdentifier, id)
            .query('DELETE FROM Contacts WHERE id = @id');
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi xóa liên hệ' });
    }
});

// ==================== FAVORITES API ====================

// Lấy danh sách yêu thích
app.get('/api/favorites', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await pool.request()
            .input('userId', sql.NVarChar, userId)
            .query('SELECT productId FROM Favorites WHERE userId = @userId');
        
        const favorites = result.recordset.map(row => row.productId);
        res.json(favorites);
    } catch (error) {
        console.error('Error fetching favorites:', error);
        res.status(500).json({ success: false, message: 'Lỗi lấy danh sách yêu thích' });
    }
});

// Thêm vào yêu thích
app.post('/api/favorites', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId } = req.body;
        if (!productId) return res.status(400).json({ success: false, message: 'Thiếu productId' });

        await pool.request()
            .input('userId', sql.NVarChar, userId)
            .input('productId', sql.NVarChar, productId.toString())
            .query(`
                IF NOT EXISTS (SELECT 1 FROM Favorites WHERE userId = @userId AND productId = @productId)
                BEGIN
                    INSERT INTO Favorites (userId, productId) VALUES (@userId, @productId)
                END
            `);
        
        res.json({ success: true, message: 'Đã thêm vào yêu thích' });
    } catch (error) {
        console.error('Error adding favorite:', error);
        res.status(500).json({ success: false, message: 'Lỗi thêm yêu thích' });
    }
});

// Xóa khỏi yêu thích
app.delete('/api/favorites/:productId', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId } = req.params;

        await pool.request()
            .input('userId', sql.NVarChar, userId)
            .input('productId', sql.NVarChar, productId.toString())
            .query('DELETE FROM Favorites WHERE userId = @userId AND productId = @productId');
            
        res.json({ success: true, message: 'Đã xóa khỏi yêu thích' });
    } catch (error) {
        console.error('Error removing favorite:', error);
        res.status(500).json({ success: false, message: 'Lỗi xóa yêu thích' });
    }
});

// ==================== CHAT HISTORY API ====================

// Lấy danh sách phiên chat (Admin)
app.get('/api/chat/history', authenticateToken, isAdmin, async (req, res) => {
    try {
        let query = 'SELECT * FROM ChatSessions WHERE 1=1';
        const request = pool.request();

        if (req.query.phone) {
            query += ' AND customerPhone LIKE @phone';
            request.input('phone', sql.NVarChar, `%${req.query.phone}%`);
        }
        if (req.query.date) {
            query += ' AND CONVERT(DATE, createdAt) = @date';
            request.input('date', sql.Date, req.query.date);
        }

        query += ' ORDER BY createdAt DESC';
        const result = await request.query(query);
        res.json(result.recordset);
    } catch (error) {
        console.error('Error fetching chat history:', error);
        res.status(500).json({ success: false, message: 'Lỗi lấy lịch sử chat' });
    }
});

// Lấy chi tiết tin nhắn của một phiên chat (Admin)
app.get('/api/chat/history/:sessionId', authenticateToken, isAdmin, async (req, res) => {
    try {
        const result = await pool.request()
            .input('sessionId', sql.UniqueIdentifier, req.params.sessionId)
            .query('SELECT * FROM ChatMessages WHERE sessionId = @sessionId ORDER BY timestamp ASC');
        res.json(result.recordset);
    } catch (error) {
        console.error('Error fetching chat messages:', error);
        res.status(500).json({ success: false, message: 'Lỗi lấy tin nhắn chat' });
    }
});

// Xóa phiên chat (Admin)
app.delete('/api/chat/history/:sessionId', authenticateToken, isAdmin, async (req, res) => {
    try {
        await pool.request()
            .input('sessionId', sql.UniqueIdentifier, req.params.sessionId)
            .query('DELETE FROM ChatSessions WHERE id = @sessionId'); // Cascade will delete messages
        res.json({ success: true, message: 'Đã xóa phiên chat' });
    } catch (error) {
        console.error('Error deleting chat session:', error);
        res.status(500).json({ success: false, message: 'Lỗi xóa phiên chat' });
    }
});

// ==========================================
// AI COPILOT: Admin Business Insights
// ==========================================
// Web Push Subscription
app.post('/api/push/subscribe', authenticateToken, async (req, res) => {
    try {
        const { subscription } = req.body;
        const userId = req.user.id;
        
        if (!subscription || !subscription.endpoint) {
            return res.status(400).json({ success: false, message: 'Invalid subscription object' });
        }

        // Kiểm tra xem subscription endpoint đã tồn tại chưa
        const checkSub = await pool.request()
            .input('endpoint', sql.NVarChar, subscription.endpoint)
            .query('SELECT id FROM PushSubscriptions WHERE endpoint = @endpoint');
            
        if (checkSub.recordset.length === 0) {
            await pool.request()
                .input('userId', sql.UniqueIdentifier, userId)
                .input('endpoint', sql.NVarChar, subscription.endpoint)
                .input('p256dh', sql.NVarChar, subscription.keys.p256dh)
                .input('auth', sql.NVarChar, subscription.keys.auth)
                .query(`
                    INSERT INTO PushSubscriptions (userId, endpoint, p256dh, auth)
                    VALUES (@userId, @endpoint, @p256dh, @auth)
                `);
        }
        res.status(201).json({ success: true, message: 'Subscribed to push notifications' });
    } catch (error) {
        console.error('Lỗi khi lưu push subscription:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

app.get('/api/push/public-key', (req, res) => {
    res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

// Gửi tin nhắn cho AI
app.post('/api/chat/ai', async (req, res) => {
    try {
        if (!ai) {
            return res.status(503).json({ success: false, message: 'Tính năng AI chưa được cấu hình. Vui lòng thử lại sau.' });
        }
        
        const { message, history } = req.body;
        if (!message) return res.status(400).json({ success: false, message: 'Thiếu tin nhắn' });

        // Lấy danh sách sản phẩm để AI tư vấn
        const productsResult = await pool.request().query('SELECT id, title, price, stock, category FROM Products');
        const menuText = productsResult.recordset.map(p => `- ${p.title} (Mã: ${p.id}, Giá: ${p.price}đ, Trạng thái: ${p.stock > 0 ? 'Còn hàng' : 'Hết hàng'}, Danh mục: ${p.category})`).join('\n');

        const systemPrompt = `Bạn tên là TiMi Assistant, trợ lý ảo thông minh và thân thiện của nhà hàng TiMiFood.
Nhiệm vụ của bạn là tư vấn cho khách hàng dựa trên Menu hiện tại của nhà hàng. Luôn xưng hô là "mình/TiMi" và gọi khách là "bạn", giọng điệu vui vẻ, lễ phép.
Nếu khách hỏi món không có trong Menu, hãy khéo léo giới thiệu món khác tương tự có sẵn.
Đặc biệt: Nếu bạn đang tư vấn/gợi ý một món ăn cụ thể có trong Menu, BẮT BUỘC PHẢI THÊM mã sản phẩm vào cuối câu trả lời theo đúng định dạng sau: [SUGGEST:MãSảnPhẩm] (Ví dụ: [SUGGEST:SP001]). Nếu không gợi ý món cụ thể, không được ghi thẻ này.

Thông tin về TiMiFood:
- Địa chỉ: Cơ sở 1 tại 165 Trần Quốc Chẩn, Hải Phòng. Cơ sở 2 tại 76 Nguyễn Thị Duệ, Hải Phòng.
- Giờ mở cửa: 7:00 - 22:00 tất cả các ngày trong tuần.
- Phí giao hàng: Freeship cho đơn từ 150k (bán kính 5km). Dưới 150k phí từ 15k-25k.
- Mã giảm giá: TIMI50 (Giảm 50% tối đa 50k), HELLOTIMI (Giảm 20k cho đơn từ 100k), FREESHIP (Miễn phí ship tối đa 30k cho đơn từ 150k). Nhập mã ở bước thanh toán.

Dưới đây là Menu nhà hàng hiện tại:
${menuText}`;

        // Format history for Gemini
        let rawContents = (history || []).map(msg => ({
            role: msg.role === 'customer' ? 'user' : 'model',
            parts: [{ text: msg.text }]
        }));

        // Thêm tin nhắn hiện tại
        rawContents.push({ role: 'user', parts: [{ text: message }] });

        // Đảm bảo các role xen kẽ nhau nghiêm ngặt (user -> model -> user)
        let contents = [];
        for (let msg of rawContents) {
            if (contents.length === 0 || contents[contents.length - 1].role !== msg.role) {
                contents.push(msg);
            } else {
                // Nếu trùng role, nối nội dung lại với nhau
                let lastMsg = contents[contents.length - 1];
                if (!lastMsg.parts[0].text.endsWith(msg.parts[0].text)) {
                    lastMsg.parts[0].text += "\n" + msg.parts[0].text;
                }
            }
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: contents,
            config: {
                systemInstruction: systemPrompt,
                temperature: 0.7,
            }
        });

        let replyText = response.text;
        let suggestedProduct = null;

        // Trích xuất thẻ [SUGGEST:MãSảnPhẩm] nếu có
        const suggestMatch = replyText.match(/\[SUGGEST:([a-zA-Z0-9_]+)\]/);
        if (suggestMatch) {
            suggestedProduct = suggestMatch[1];
            replyText = replyText.replace(/\[SUGGEST:[a-zA-Z0-9_]+\]/g, '').trim();
        }

        res.json({ 
            success: true, 
            reply: replyText,
            suggestedProduct: suggestedProduct
        });
    } catch (error) {
        console.error('Lỗi Gemini AI:', error);
        res.status(500).json({ success: false, message: 'Trợ lý AI đang bận, vui lòng thử lại sau.' });
    }
});


// ==================== NEWS API ====================

// Lấy danh sách tin tức (Public)

// Lấy danh sách tin tức (Admin - Lấy cả bài ẩn)

// Lấy chi tiết tin tức

// Thêm tin tức (Admin)

// Sửa tin tức (Admin)

// Xóa tin tức (Admin)

// Serve static files
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
            // Fallback if layout hasn't been created yet
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

if (process.env.NODE_ENV !== 'production') {
    startServer();
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

module.exports = app; // Dòng này là QUAN TRỌNG NHẤT để Vercel chạy được
