const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const compression = require('compression');
const path = require('path');
const { sql, connectDB } = require('./src/config/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// --- Module imports (Tách module - Giai đoạn 28) ---
const { authenticateToken, isAdmin, isStaffOrAdmin, SECRET_KEY } = require('./src/middleware/auth');
const { loginLimiter, otpLimiter, resetPasswordLimiter, registerLimiter, changePasswordLimiter } = require('./src/middleware/rateLimiter');
const { transporter, sendOrderEmail, sendContactEmail, sendReplyEmail } = require('./src/helpers/email');

const PayOS = require('@payos/node');
const payos = (process.env.PAYOS_CLIENT_ID && process.env.PAYOS_API_KEY && process.env.PAYOS_CHECKSUM_KEY)
    ? new PayOS(process.env.PAYOS_CLIENT_ID, process.env.PAYOS_API_KEY, process.env.PAYOS_CHECKSUM_KEY)
    : null;

const { OAuth2Client } = require('google-auth-library');
const axios = require('axios');
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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

const PORT = process.env.PORT || 3500;

app.use(cors({
    origin: parsedCorsOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));
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
                        id INT PRIMARY KEY IDENTITY(1,1),
                        userPhone NVARCHAR(20),
                        action NVARCHAR(100),
                        details NVARCHAR(MAX),
                        createdAt DATETIME DEFAULT GETDATE()
                    )
                END
                
                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Contacts')
                BEGIN
                    CREATE TABLE Contacts (
                        id INT PRIMARY KEY IDENTITY(1,1),
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
                        id INT PRIMARY KEY IDENTITY(1,1),
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
                        id INT PRIMARY KEY IDENTITY(1,1),
                        userPhone NVARCHAR(20) NOT NULL,
                        productId NVARCHAR(50) NOT NULL,
                        createdAt DATETIME DEFAULT GETDATE(),
                        CONSTRAINT UQ_User_Product UNIQUE (userPhone, productId)
                    )
                END

                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ChatSessions')
                BEGIN
                    CREATE TABLE ChatSessions (
                        id INT PRIMARY KEY IDENTITY(1,1),
                        customerPhone NVARCHAR(20),
                        customerName NVARCHAR(100),
                        staffPhone NVARCHAR(20),
                        staffName NVARCHAR(100),
                        status NVARCHAR(20) DEFAULT 'waiting', -- waiting, chatting, ended
                        createdAt DATETIME DEFAULT GETDATE(),
                        endedAt DATETIME
                    )
                END

                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ChatMessages')
                BEGIN
                    CREATE TABLE ChatMessages (
                        id INT PRIMARY KEY IDENTITY(1,1),
                        sessionId INT FOREIGN KEY REFERENCES ChatSessions(id) ON DELETE CASCADE,
                        sender NVARCHAR(20), -- 'customer' or 'staff'
                        text NVARCHAR(MAX),
                        timestamp DATETIME DEFAULT GETDATE()
                    )
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



// Delete order (Customer can delete history of completed/cancelled orders)
app.delete('/api/orders/:id', authenticateToken, async (req, res) => {
    try {
        const id = req.params.id;
        
        // Transaction to delete both details and the order
        const transaction = new sql.Transaction(pool);
        await transaction.begin();
        try {
            await transaction.request()
                .input('orderId', sql.NVarChar, id)
                .query('DELETE FROM OrderDetails WHERE orderId = @orderId');
            
            await transaction.request()
                .input('id', sql.NVarChar, id)
                .query('DELETE FROM Orders WHERE id = @id');
            
            await transaction.commit();
            res.json({ success: true, message: 'Order deleted successfully' });
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (err) {
        console.error("Delete order error:", err);
        res.status(500).json({ message: 'Error deleting order' });
    }
});

// --- API ENDPOINTS ---

// Get all products (with optional search)
app.get('/api/products', async (req, res) => {
    try {
        const { search } = req.query;
        // Using global pool
        let query = `
            SELECT p.*, 
                   COALESCE(AVG(CAST(r.rating AS FLOAT)), 0) as avgRating,
                   COUNT(r.id) as reviewCount
            FROM Products p
            LEFT JOIN Reviews r ON p.id = r.productId
        `;
        let request = pool.request();

        if (search) {
            query += ' WHERE p.title LIKE @search OR p.description LIKE @search';
            request.input('search', sql.NVarChar, `%${search}%`);
        }

        query += ' GROUP BY p.id, p.title, p.price, p.img, p.category, p.status, p.description, p.stock';

        const result = await request.query(query);
        const products = result.recordset.map(p => ({
            ...p,
            desc: p.description
        }));
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching products' });
    }
});

// Add new product (Admin only)
app.post('/api/products', authenticateToken, isAdmin, async (req, res) => {
    try {
        const prod = req.body;
        if (!prod.title) return res.status(400).json({ message: 'Tên sản phẩm không được để trống' });

        // Check duplicate product title (case-insensitive)
        const existingProduct = await pool.request()
            .input('title', sql.NVarChar, prod.title.trim())
            .query('SELECT TOP 1 id FROM Products WHERE LOWER(TRIM(title)) = LOWER(@title)');
        if (existingProduct.recordset.length > 0) {
            return res.status(400).json({ success: false, message: 'Tên món ăn đã tồn tại!' });
        }

        const maxIdResult = await pool.request().query('SELECT MAX(id) as maxId FROM Products');
        const nextId = (maxIdResult.recordset[0].maxId || 0) + 1;

        await pool.request()
            .input('id', sql.Int, nextId)
            .input('title', sql.NVarChar, prod.title)
            .input('img', sql.NVarChar, prod.img)
            .input('category', sql.NVarChar, prod.category)
            .input('price', sql.Int, parseInt(prod.price))
            .input('description', sql.NVarChar, prod.description)
            .input('stock', sql.Int, parseInt(prod.stock) || 0)
            .query('INSERT INTO Products (id, title, img, category, price, description, status, stock) VALUES (@id, @title, @img, @category, @price, @description, 1, @stock)');
        await createLog(req.user.phone, 'ADD_PRODUCT', `Thêm sản phẩm mới: ${prod.title} (ID: ${nextId})`);
        res.status(201).json({ success: true, message: 'Product added successfully', id: nextId });
    } catch (err) {
        res.status(500).json({ message: 'Error adding product' });
    }
});

// Update product (Admin only)
app.put('/api/products/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const prod = req.body;
        if (!prod.title) return res.status(400).json({ message: 'Tên sản phẩm không được để trống' });

        // Check duplicate product title excluding current product (case-insensitive)
        const existingProduct = await pool.request()
            .input('id', sql.Int, id)
            .input('title', sql.NVarChar, prod.title.trim())
            .query('SELECT TOP 1 id FROM Products WHERE LOWER(TRIM(title)) = LOWER(@title) AND id != @id');
        if (existingProduct.recordset.length > 0) {
            return res.status(400).json({ success: false, message: 'Tên món ăn đã tồn tại cho một sản phẩm khác!' });
        }

        await pool.request()
            .input('id', sql.Int, id)
            .input('title', sql.NVarChar, prod.title)
            .input('img', sql.NVarChar, prod.img)
            .input('category', sql.NVarChar, prod.category)
            .input('price', sql.Int, parseInt(prod.price))
            .input('description', sql.NVarChar, prod.description)
            .input('status', sql.Int, parseInt(prod.status))
            .input('stock', sql.Int, parseInt(prod.stock) || 0)
            .query('UPDATE Products SET title=@title, img=@img, category=@category, price=@price, description=@description, status=@status, stock=@stock WHERE id=@id');
        await createLog(req.user.phone, 'UPDATE_PRODUCT', `Cập nhật sản phẩm ID: ${id} (${prod.title})`);
        res.json({ success: true, message: 'Product updated successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error updating product' });
    }
});

// Delete product (Admin only)
app.delete('/api/products/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        // Check if product is in any order first
        const checkOrder = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT TOP 1 * FROM OrderDetails WHERE productId=@id');

        if (checkOrder.recordset.length > 0) {
            return res.status(400).json({ message: 'Không thể xóa vĩnh viễn sản phẩm này vì đã có trong lịch sử đơn hàng. Vui lòng sử dụng chức năng Ẩn.' });
        }

        await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM Products WHERE id=@id');
        await createLog(req.user.phone, 'DELETE_PRODUCT', `Xóa vĩnh viễn sản phẩm ID: ${id}`);
        res.json({ success: true, message: 'Product deleted permanently' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting product' });
    }
});

// Login
app.post('/api/login', loginLimiter, async (req, res) => {
    try {
        const { username, password } = req.body;
        const result = await pool.request()
            .input('phone', sql.NVarChar, username)
            .query('SELECT * FROM Users WHERE phone=@phone');

        if (result.recordset.length > 0) {
            const user = result.recordset[0];

            let isMatch = false;
            try {
                isMatch = await bcrypt.compare(password, user.password);
            } catch (e) {
                // Not a hash, fallback to plain text comparison
            }

            // Support old plain text passwords and migrate them on the fly
            if (!isMatch && user.password === password) {
                console.log(`Migrating password for user: ${user.phone}`);
                const hashedPassword = await bcrypt.hash(password, 10);
                await pool.request()
                    .input('phone', sql.NVarChar, user.phone)
                    .input('password', sql.NVarChar, hashedPassword)
                    .query('UPDATE Users SET password=@password WHERE phone=@phone');
                isMatch = true;
            }

            if (isMatch) {
                // Create JWT Token
                const token = jwt.sign(
                    { phone: user.phone, userType: user.userType },
                    SECRET_KEY,
                    { expiresIn: '24h' }
                );

                // Remove sensitive info
                const { password: _, ...safeUser } = user;
                safeUser.join = user.joinDate;
                safeUser.cart = [];
                res.json({ success: true, user: safeUser, token });
            } else {
                res.status(401).json({ success: false, message: 'Số điện thoại hoặc mật khẩu không đúng' });
            }
        } else {
            res.status(401).json({ success: false, message: 'Số điện thoại hoặc mật khẩu không đúng' });
        }
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

// Google Login
app.post('/api/auth/google', loginLimiter, async (req, res) => {
    try {
        const { credential } = req.body;
        if (!credential) return res.status(400).json({ success: false, message: 'Missing Google credential' });

        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const { email, name, picture } = payload;

        // Check if user exists by email
        const result = await pool.request()
            .input('email', sql.NVarChar, email)
            .query('SELECT * FROM Users WHERE email=@email');

        if (result.recordset.length > 0) {
            // User exists, log them in
            const user = result.recordset[0];
            const token = jwt.sign(
                { phone: user.phone, userType: user.userType },
                SECRET_KEY,
                { expiresIn: '24h' }
            );
            const { password: _, ...safeUser } = user;
            safeUser.join = user.joinDate;
            safeUser.cart = [];
            res.json({ success: true, user: safeUser, token });
        } else {
            // User does not exist, ask for phone number to complete registration
            res.json({ 
                success: false, 
                status: 'require_phone', 
                message: 'Vui lòng cung cấp số điện thoại để hoàn tất đăng ký',
                googleInfo: { email, name, picture }
            });
        }
    } catch (err) {
        console.error("Google Login Error:", err);
        res.status(401).json({ success: false, message: 'Google authentication failed' });
    }
});

// Complete Google Registration
app.post('/api/auth/google/complete-registration', registerLimiter, async (req, res) => {
    try {
        const { credential, phone } = req.body;
        if (!credential || !phone) return res.status(400).json({ success: false, message: 'Missing required fields' });

        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const { email, name } = payload;

        // Check if phone already exists
        const checkPhone = await pool.request()
            .input('phone', sql.NVarChar, phone)
            .query('SELECT * FROM Users WHERE phone=@phone');
        
        if (checkPhone.recordset.length > 0) {
            return res.status(400).json({ success: false, message: 'Số điện thoại này đã được đăng ký cho một tài khoản khác' });
        }

        // Generate a random strong password for Google users since they login via Google
        const randomPassword = Math.random().toString(36).slice(-10) + 'A1@';
        const hashedPassword = await bcrypt.hash(randomPassword, 10);

        await pool.request()
            .input('fullname', sql.NVarChar, name)
            .input('phone', sql.NVarChar, phone)
            .input('password', sql.NVarChar, hashedPassword)
            .input('address', sql.NVarChar, '')
            .input('email', sql.NVarChar, email)
            .input('status', sql.Int, 1)
            .input('userType', sql.Int, 0)
            .query('INSERT INTO Users (fullname, phone, password, address, email, status, userType) VALUES (@fullname, @phone, @password, @address, @email, @status, @userType)');

        // Create JWT Token
        const token = jwt.sign(
            { phone: phone, userType: 0 },
            SECRET_KEY,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            success: true,
            message: 'Đăng ký thành công bằng Google',
            user: { fullname: name, phone, email, address: '', status: 1, userType: 0, cart: [] },
            token
        });
    } catch (err) {
        console.error("Google Registration Error:", err);
        res.status(500).json({ success: false, message: 'Registration failed' });
    }
});

// Facebook Login
app.post('/api/auth/facebook', loginLimiter, async (req, res) => {
    try {
        const { accessToken } = req.body;
        if (!accessToken) return res.status(400).json({ success: false, message: 'Missing Facebook token' });

        // Verify token with Facebook Graph API
        const response = await axios.get(`https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${accessToken}`);
        const { email, name, picture } = response.data;
        const fbEmail = email || `${response.data.id}@facebook.com`; // Fallback if email is missing
        const avatarUrl = picture?.data?.url || '';

        // Check if user exists by email
        const result = await pool.request()
            .input('email', sql.NVarChar, fbEmail)
            .query('SELECT * FROM Users WHERE email=@email');

        if (result.recordset.length > 0) {
            // User exists, log them in
            const user = result.recordset[0];
            const token = jwt.sign(
                { phone: user.phone, userType: user.userType },
                SECRET_KEY,
                { expiresIn: '24h' }
            );
            const { password: _, ...safeUser } = user;
            safeUser.join = user.joinDate;
            safeUser.cart = [];
            res.json({ success: true, user: safeUser, token });
        } else {
            // User does not exist, ask for phone number to complete registration
            res.json({ 
                success: false, 
                status: 'require_phone', 
                message: 'Vui lòng cung cấp số điện thoại để hoàn tất đăng ký',
                facebookInfo: { email: fbEmail, name, picture: avatarUrl }
            });
        }
    } catch (err) {
        console.error("Facebook Login Error:", err.response?.data || err.message);
        res.status(401).json({ success: false, message: 'Facebook authentication failed' });
    }
});

// Complete Facebook Registration
app.post('/api/auth/facebook/complete-registration', registerLimiter, async (req, res) => {
    try {
        const { accessToken, phone } = req.body;
        if (!accessToken || !phone) return res.status(400).json({ success: false, message: 'Missing required fields' });

        // Verify token with Facebook Graph API
        const response = await axios.get(`https://graph.facebook.com/me?fields=id,name,email&access_token=${accessToken}`);
        const { email, name } = response.data;
        const fbEmail = email || `${response.data.id}@facebook.com`;

        // Check if phone already exists
        const checkPhone = await pool.request()
            .input('phone', sql.NVarChar, phone)
            .query('SELECT * FROM Users WHERE phone=@phone');
        
        if (checkPhone.recordset.length > 0) {
            return res.status(400).json({ success: false, message: 'Số điện thoại này đã được đăng ký cho một tài khoản khác' });
        }

        // Generate a random strong password for Facebook users
        const randomPassword = Math.random().toString(36).slice(-10) + 'A1@';
        const hashedPassword = await bcrypt.hash(randomPassword, 10);

        await pool.request()
            .input('fullname', sql.NVarChar, name)
            .input('phone', sql.NVarChar, phone)
            .input('password', sql.NVarChar, hashedPassword)
            .input('address', sql.NVarChar, '')
            .input('email', sql.NVarChar, fbEmail)
            .input('status', sql.Int, 1)
            .input('userType', sql.Int, 0)
            .query('INSERT INTO Users (fullname, phone, password, address, email, status, userType) VALUES (@fullname, @phone, @password, @address, @email, @status, @userType)');

        // Create JWT Token
        const token = jwt.sign(
            { phone: phone, userType: 0 },
            SECRET_KEY,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            success: true,
            message: 'Đăng ký thành công bằng Facebook',
            user: { fullname: name, phone, email: fbEmail, address: '', status: 1, userType: 0, cart: [] },
            token
        });
    } catch (err) {
        console.error("Facebook Registration Error:", err.response?.data || err.message);
        res.status(500).json({ success: false, message: 'Registration failed' });
    }
});

// Send OTP via Email
app.post('/api/send-otp', otpLimiter, async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ success: false, message: 'Vui lòng nhập Email' });

        const result = await pool.request()
            .input('email', sql.NVarChar, email)
            .query('SELECT phone FROM Users WHERE email = @email');
        
        if (result.recordset.length === 0) {
            return res.status(404).json({ success: false, message: 'Email này chưa được đăng ký tài khoản' });
        }

        const phone = result.recordset[0].phone;
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiry = Date.now() + 5 * 60 * 1000; // 5 mins
        
        // Use email as key in otpStore
        otpStore.set(email, { otp, phone, expiry });

        console.log(`[OTP DEBUG] Email: ${email}, Phone: ${phone}, OTP: ${otp}`);

        // Send actual email if configured
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            const mailOptions = {
                from: process.env.MAIL_FROM || process.env.EMAIL_USER,
                to: email,
                subject: '[TiMiFood] Mã xác thực khôi phục mật khẩu',
                html: `<h3>Mã OTP của bạn là: <b style="color: #ff5e3a; font-size: 24px;">${otp}</b></h3>
                       <p>Mã này có hiệu lực trong 5 phút. Vui lòng không chia sẻ mã này cho bất kỳ ai.</p>`
            };
            try {
                await transporter.sendMail(mailOptions);
                res.json({ success: true, message: 'OTP đã được gửi về Email của bạn' });
            } catch (mailError) {
                console.error("[Email OTP] Failed to send email via SMTP:", mailError);
                // Clean up OTP from store since it wasn't successfully sent
                otpStore.delete(email);
                res.status(500).json({ 
                    success: false, 
                    message: 'Không thể gửi email chứa mã OTP. Vui lòng liên hệ quản trị viên hoặc kiểm tra cấu hình SMTP.' 
                });
            }
        } else {
            res.json({ success: true, message: 'OTP đã được tạo (Xem log server)', debug: true });
        }
    } catch (err) {
        console.error("Send OTP error:", err);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ khi xử lý mã OTP.' });
    }
});

// Verify OTP only
app.post('/api/verify-otp', (req, res) => {
    const { email, otp } = req.body;
    const stored = otpStore.get(email);
    
    if (!stored || stored.otp !== otp || Date.now() > stored.expiry) {
        return res.status(400).json({ success: false, message: 'Mã OTP không đúng hoặc đã hết hạn' });
    }
    
    res.json({ success: true, message: 'Mã xác thực chính xác' });
});

// Reset Password with OTP
app.post('/api/reset-password', resetPasswordLimiter, async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        
        // Verify OTP
        const stored = otpStore.get(email);
        if (!stored || stored.otp !== otp || Date.now() > stored.expiry) {
            return res.status(400).json({ success: false, message: 'Mã OTP không đúng hoặc đã hết hạn' });
        }

        // Backend strong password validation
        const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (!strongPasswordRegex.test(newPassword)) {
            return res.status(400).json({ success: false, message: 'Mật khẩu phải từ 8 ký tự, bao gồm chữ hoa, chữ thường và số' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        await pool.request()
            .input('phone', sql.NVarChar, stored.phone)
            .input('password', sql.NVarChar, hashedPassword)
            .query('UPDATE Users SET password = @password WHERE phone = @phone');
        
        otpStore.delete(email); // Clear OTP after success
        res.json({ success: true, message: 'Password updated successfully' });
    } catch (err) {
        console.error("Reset password error:", err);
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

// Register
app.post('/api/register', registerLimiter, async (req, res) => {
    try {
        const newUser = req.body;
        const checkUser = await pool.request()
            .input('phone', sql.NVarChar, newUser.phone)
            .query('SELECT * FROM Users WHERE phone=@phone');

        if (checkUser.recordset.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Backend strong password validation
        const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (!strongPasswordRegex.test(newUser.password)) {
            return res.status(400).json({ message: 'Mật khẩu phải từ 8 ký tự, bao gồm chữ hoa, chữ thường và số' });
        }

        const hashedPassword = await bcrypt.hash(newUser.password, 10);

        await pool.request()
            .input('fullname', sql.NVarChar, newUser.fullname)
            .input('phone', sql.NVarChar, newUser.phone)
            .input('password', sql.NVarChar, hashedPassword)
            .input('address', sql.NVarChar, newUser.address || '')
            .input('email', sql.NVarChar, newUser.email || '')
            .input('status', sql.Int, 1)
            .input('userType', sql.Int, 0)
            .query('INSERT INTO Users (fullname, phone, password, address, email, status, userType) VALUES (@fullname, @phone, @password, @address, @email, @status, @userType)');

        // Create JWT Token for the new user
        const token = jwt.sign(
            { phone: newUser.phone, userType: 0 },
            SECRET_KEY,
            { expiresIn: '24h' }
        );

        // Return user info WITHOUT password, and include an empty cart
        const { password, ...userWithoutPassword } = newUser;
        res.status(201).json({
            success: true,
            message: 'User created successfully',
            user: { ...userWithoutPassword, status: 1, userType: 0, cart: [] },
            token
        });
    } catch (err) {
        console.error("Register error:", err);
        res.status(500).json({ success: false, message: 'Error registering user' });
    }
});

// Change Password API
app.post('/api/change-password', authenticateToken, changePasswordLimiter, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userPhone = req.user.phone;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin' });
        }

        const result = await pool.request()
            .input('phone', sql.NVarChar, userPhone)
            .query('SELECT password FROM Users WHERE phone=@phone');

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }

        const user = result.recordset[0];
        const isMatch = await bcrypt.compare(currentPassword, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Mật khẩu hiện tại không đúng' });
        }

        // Backend strong password validation
        const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (!strongPasswordRegex.test(newPassword)) {
            return res.status(400).json({ message: 'Mật khẩu mới phải từ 8 ký tự, bao gồm chữ hoa, chữ thường và số' });
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        await pool.request()
            .input('phone', sql.NVarChar, userPhone)
            .input('password', sql.NVarChar, hashedNewPassword)
            .query('UPDATE Users SET password=@password WHERE phone=@phone');

        res.json({ success: true, message: 'Đổi mật khẩu thành công' });
    } catch (err) {
        console.error("Change password error:", err);
        res.status(500).json({ message: 'Lỗi khi đổi mật khẩu' });
    }
});

// Get all users (Admin only)
app.get('/api/users', authenticateToken, isAdmin, async (req, res) => {
    try {
        // Using global pool
        const result = await pool.request().query(`
            SELECT * FROM Users 
            ORDER BY (CASE WHEN userType = 1 THEN 0 WHEN userType = 2 THEN 1 ELSE 2 END) ASC, joinDate DESC
        `);
        const users = result.recordset.map(u => ({
            ...u,
            join: u.joinDate
        }));
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching users' });
    }
});

// Update user (Admin or Owner)
app.put('/api/users/:phone', authenticateToken, async (req, res) => {
    try {
        const { phone } = req.params;
        const { fullname, email, address, password, status, userType } = req.body;
        
        // Security check: Only Admin can update other users or change status/userType
        if (req.user.userType !== 1 && req.user.phone !== phone) {
            return res.status(403).json({ message: 'Bạn không có quyền cập nhật thông tin này' });
        }

        // If not admin, force these to remain unchanged (or use current values)
        let finalStatus = status;
        let finalUserType = userType;
        if (req.user.userType !== 1) {
            // Regular users cannot change their own status or type
            const currentUser = await pool.request()
                .input('phone', sql.NVarChar, phone)
                .query('SELECT status, userType, password FROM Users WHERE phone=@phone');
            if (currentUser.recordset.length > 0) {
                finalStatus = currentUser.recordset[0].status;
                finalUserType = currentUser.recordset[0].userType;
            }
        }
        
        // Hash password if it's not already hashed
        let finalPassword = password;
        if (password && !password.startsWith('$2')) {
            const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
            if (!strongPasswordRegex.test(password)) {
                return res.status(400).json({ message: 'Mật khẩu phải từ 8 ký tự, bao gồm chữ hoa, chữ thường và số' });
            }
            finalPassword = await bcrypt.hash(password, 10);
        } else if (!password) {
            // If password is not provided, keep current password
            const currentUser = await pool.request()
                .input('phone', sql.NVarChar, phone)
                .query('SELECT password FROM Users WHERE phone=@phone');
            if (currentUser.recordset.length > 0) {
                finalPassword = currentUser.recordset[0].password;
            }
        }

        await pool.request()
            .input('phone', sql.NVarChar, phone)
            .input('fullname', sql.NVarChar, fullname)
            .input('email', sql.NVarChar, email || '')
            .input('address', sql.NVarChar, address || '')
            .input('password', sql.NVarChar, finalPassword)
            .input('status', sql.Int, finalStatus)
            .input('userType', sql.Int, finalUserType)
            .query('UPDATE Users SET fullname = @fullname, email = @email, address = @address, password = @password, status = @status, userType = @userType WHERE phone = @phone');

        // Fetch and return the updated user (without password)
        const updatedUserResult = await pool.request()
            .input('phone', sql.NVarChar, phone)
            .query('SELECT * FROM Users WHERE phone = @phone');
        
        const { password: _, ...userWithoutPassword } = updatedUserResult.recordset[0];
        res.json({ success: true, message: 'Cập nhật thành công', user: userWithoutPassword });
    } catch (error) {
        console.error("Update user error:", error);
        res.status(500).json({ message: 'Lỗi server khi cập nhật tài khoản' });
    }
});

// Delete user (Admin only)
app.delete('/api/users/:phone', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { phone } = req.params;
        await pool.request()
            .input('phone', sql.NVarChar, phone)
            .query('DELETE FROM Users WHERE phone=@phone');
        await createLog(req.user.phone, 'DELETE_USER', `Xóa tài khoản: ${phone}`);
        res.json({ message: 'User deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting user' });
    }
});

// --- CART API ---

// Get user cart (Protected)
app.get('/api/cart/:phone', authenticateToken, async (req, res) => {
    try {
        const { phone } = req.params;
        const result = await pool.request()
            .input('phone', sql.NVarChar, phone)
            .query('SELECT cartData FROM Users WHERE phone=@phone');

        if (result.recordset.length > 0) {
            const cartData = result.recordset[0].cartData;
            res.json(cartData ? JSON.parse(cartData) : []);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (err) {
        res.status(500).json({ message: 'Error fetching cart' });
    }
});

// Update user cart (Protected)
app.post('/api/cart/:phone', authenticateToken, async (req, res) => {
    try {
        const { phone } = req.params;
        const cart = req.body;
        await pool.request()
            .input('phone', sql.NVarChar, phone)
            .input('cartData', sql.NVarChar, JSON.stringify(cart))
            .query('UPDATE Users SET cartData=@cartData WHERE phone=@phone');
        res.json({ message: 'Cart updated' });
    } catch (err) {
        res.status(500).json({ message: 'Error updating cart' });
    }
});

// --- ORDER API ---

// Create order (Protected)
app.post('/api/orders', authenticateToken, async (req, res) => {
    console.log('Received order request:', JSON.stringify(req.body, null, 2));
    const transaction = new sql.Transaction(pool);
    try {
        const order = req.body;
        if (!order || !order.chitiet || !Array.isArray(order.chitiet)) {
            throw new Error('Invalid order data: missing chitiet array');
        }

        // Generate Order ID if not provided or to ensure uniqueness
        const countResult = await pool.request().query('SELECT MAX(CAST(SUBSTRING(id, 3, LEN(id)) AS INT)) as maxId FROM Orders');
        const maxId = countResult.recordset[0].maxId || 0;
        const finalId = 'DH' + (maxId + 1).toString().padStart(3, '0');

        await transaction.begin();

        const orderRequest = new sql.Request(transaction);
        console.log('Inserting order:', finalId);
        const customerPhone = order.khachhang;

        await orderRequest
            .input('id', sql.NVarChar, finalId)
            .input('customerPhone', sql.NVarChar, customerPhone)
            .input('totalPrice', sql.Float, order.tongtien)
            .input('deliveryType', sql.NVarChar, order.hinhthucgiao)
            .input('deliveryTime', sql.NVarChar, order.thoigiangiao)
            .input('deliveryDate', sql.DateTime, order.ngaygiaohang ? new Date(order.ngaygiaohang) : null)
            .input('receiverName', sql.NVarChar, order.tenguoinhan)
            .input('receiverPhone', sql.NVarChar, order.sdtnhan)
            .input('receiverAddress', sql.NVarChar, order.diachinhan)
            .input('note', sql.NVarChar, order.ghichu || '')
            .input('voucherCode', sql.NVarChar, order.voucherCode || null)
            .input('discountAmount', sql.Int, parseInt(order.discountAmount) || 0)
            .input('shippingFee', sql.Int, parseInt(order.shippingFee) || 0)
            .input('status', sql.Int, 0)
            .query(`INSERT INTO Orders (id, customerPhone, totalPrice, deliveryType, deliveryTime, deliveryDate, receiverName, receiverPhone, receiverAddress, note, voucherCode, discountAmount, shippingFee, orderDate, status) 
                    VALUES (@id, @customerPhone, @totalPrice, @deliveryType, @deliveryTime, @deliveryDate, @receiverName, @receiverPhone, @receiverAddress, @note, @voucherCode, @discountAmount, @shippingFee, GETDATE(), @status)`);

        // Notify user about successful order
        console.log(`[Order] Notifying customer: ${customerPhone}`);
        await createNotification(customerPhone, "Đơn hàng mới", `Đơn hàng #${finalId} đã được đặt thành công!`, "order");
        
        // Fetch user email for notification
        const userResult = await pool.request()
            .input('phone', sql.NVarChar, customerPhone)
            .query('SELECT email FROM Users WHERE phone = @phone');
        
        if (userResult.recordset.length > 0 && userResult.recordset[0].email) {
            const customerEmail = userResult.recordset[0].email;
            sendOrderEmail(finalId, customerEmail, "Đã đặt hàng (Chờ xác nhận)", {
                totalPrice: order.tongtien,
                receiverAddress: order.diachinhan,
                receiverPhone: order.sdtnhan
            });
        }

        // Notify Admins
        console.log(`[Order] Notifying Admins`);
        await createNotification("ADMIN", "Đơn hàng mới", `Có đơn hàng mới #${finalId} từ ${customerPhone}`, "order");

        console.log('Inserting details for order:', finalId);
        for (const item of order.chitiet) {
            // Check stock first
            const checkStockReq = new sql.Request(transaction);
            const stockResult = await checkStockReq
                .input('pId', sql.Int, parseInt(item.id))
                .query('SELECT stock, title FROM Products WHERE id = @pId');

            const product = stockResult.recordset[0];
            if (!product || product.stock < parseInt(item.soluong)) {
                throw new Error(`Sản phẩm "${product ? product.title : item.id}" không đủ số lượng trong kho!`);
            }

            // Insert order details
            const detailRequest = new sql.Request(transaction);
            await detailRequest
                .input('orderId', sql.NVarChar, finalId)
                .input('productId', sql.Int, parseInt(item.id))
                .input('price', sql.Float, parseFloat(item.price))
                .input('quantity', sql.Int, parseInt(item.soluong))
                .input('note', sql.NVarChar, item.note || '')
                .query(`INSERT INTO OrderDetails (orderId, productId, price, quantity, note) 
                        VALUES (@orderId, @productId, @price, @quantity, @note)`);

            // Decrease stock
            const updateStockReq = new sql.Request(transaction);
            await updateStockReq
                .input('pId', sql.Int, parseInt(item.id))
                .input('q', sql.Int, parseInt(item.soluong))
                .query('UPDATE Products SET stock = stock - @q WHERE id = @pId');
        }

        await transaction.commit();
        res.status(201).json({ success: true, message: 'Order created successfully', orderId: finalId });
    } catch (err) {
        try {
            if (transaction && transaction._aborted === false && transaction._committed === false) {
                await transaction.rollback();
            }
        } catch (rollbackErr) {
            console.error('Rollback Error:', rollbackErr);
        }
        console.error('Order Error:', err);
        res.status(500).json({ message: 'Error creating order', error: err.message });
    }
});

// Get orders (Protected)
app.get('/api/orders', authenticateToken, async (req, res) => {
    try {
        let query = 'SELECT * FROM Orders';
        const request = pool.request();

        // If not staff/admin, filter by user's phone
        if (req.user.userType === 0) {
            query += ' WHERE customerPhone = @phone';
            request.input('phone', sql.NVarChar, req.user.phone);
        }

        const result = await request.query(query);
        const orders = result.recordset || [];

        // Fetch details for each order to include in the response
        for (let order of orders) {
            const detailsResult = await pool.request()
                .input('orderId', sql.NVarChar, order.id)
                .query('SELECT od.*, p.title, p.img FROM OrderDetails od JOIN Products p ON od.productId = p.id WHERE od.orderId = @orderId');
            order.chitiet = JSON.stringify(detailsResult.recordset.map(d => ({
                ...d,
                soluong: d.quantity,
                price: d.price
            })));
        }

        res.json(orders.map(o => ({
            ...o,
            thoigiandat: o.orderDate,
            khachhang: o.customerPhone,
            tongtien: o.totalPrice,
            trangthai: o.status,
            hinhthucgiao: o.deliveryType,
            thoigiangiao: o.deliveryTime,
            ngaygiaohang: o.deliveryDate,
            tenguoinhan: o.receiverName,
            sdtnhan: o.receiverPhone,
            diachinhan: o.receiverAddress,
            ghichu: o.note,
            voucherCode: o.voucherCode,
            discountAmount: o.discountAmount,
            shippingFee: o.shippingFee,
            chitiet: o.chitiet
        })));


    } catch (err) {
        console.error("Fetch orders error:", err);
        res.status(500).json({ message: 'Error fetching orders' });
    }
});

// Get order details
app.get('/api/orders/:id/details', async (req, res) => {
    try {
        const result = await pool.request()
            .input('orderId', sql.NVarChar, req.params.id)
            .query('SELECT od.*, p.title, p.img FROM OrderDetails od JOIN Products p ON od.productId = p.id WHERE od.orderId = @orderId');
        res.json(result.recordset.map(d => ({
            ...d,
            id: d.productId,
            soluong: d.quantity
        })));
    } catch (err) {
        res.status(500).json({ message: 'Error fetching order details' });
    }
});

// Cancel order (User only, status 0 only)
app.put('/api/orders/:id/cancel', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userPhone = req.user.phone;

        // Check if order exists and belongs to user and is still processing
        const orderCheck = await pool.request()
            .input('id', sql.NVarChar, id)
            .query('SELECT customerPhone, status FROM Orders WHERE id = @id');

        if (orderCheck.recordset.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
        }

        const order = orderCheck.recordset[0];
        if (order.customerPhone !== userPhone) {
            return res.status(403).json({ message: 'Bạn không có quyền hủy đơn hàng này' });
        }

        if (order.status !== 0) {
            return res.status(400).json({ message: 'Chỉ có thể hủy đơn hàng đang xử lý' });
        }

        await pool.request()
            .input('id', sql.NVarChar, id)
            .query('UPDATE Orders SET status = 3 WHERE id = @id'); // 3 = Cancelled

        // Notify Admin about the cancellation
        await createNotification("ADMIN", "Đơn hàng hủy", `Đơn hàng #${id} đã bị khách hàng (${userPhone}) hủy!`, "cancel");

        res.json({ success: true, message: 'Đã hủy đơn hàng thành công' });
    } catch (err) {
        console.error("Cancel order error:", err);
        res.status(500).json({ message: 'Lỗi server khi hủy đơn hàng' });
    }
});

// Update order (User only, status 0 only)
app.put('/api/orders/:id/update', authenticateToken, async (req, res) => {
    const transaction = new sql.Transaction(pool);
    try {
        const { id } = req.params;
        const { note, chitiet, shippingFee, discountAmount } = req.body;
        const items = chitiet; // Map to items for compatibility with existing logic
        const userPhone = req.user.phone;

        // 1. Check permissions
        const orderCheck = await pool.request()
            .input('id', sql.NVarChar, id)
            .query('SELECT customerPhone, status FROM Orders WHERE id = @id');

        if (orderCheck.recordset.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
        }

        const order = orderCheck.recordset[0];
        if (order.customerPhone !== userPhone) {
            return res.status(403).json({ message: 'Bạn không có quyền sửa đơn hàng này' });
        }

        if (order.status !== 0) {
            return res.status(400).json({ message: 'Chỉ có thể sửa đơn hàng đang chờ xử lý' });
        }

        await transaction.begin();

        if (!items || !Array.isArray(items)) {
            throw new Error('Danh sách món ăn không hợp lệ');
        }

        // 2. Calculate new total price
        let newTotalPrice = 0;
        for (const item of items) {
            const itemPrice = item.price || item.priceValue || 0;
            const itemQty = item.quantity || item.soluong || 0;
            newTotalPrice += (itemPrice * itemQty);
        }
        newTotalPrice = newTotalPrice + (shippingFee || 0) - (discountAmount || 0);

        // 3. Update Orders table
        await transaction.request()
            .input('id', sql.NVarChar, id)
            .input('note', sql.NVarChar, note || '')
            .input('totalPrice', sql.Float, newTotalPrice)
            .query('UPDATE Orders SET note = @note, totalPrice = @totalPrice WHERE id = @id');

        // 4. Update OrderDetails table
        await transaction.request()
            .input('orderId', sql.NVarChar, id)
            .query('DELETE FROM OrderDetails WHERE orderId = @orderId');

        for (const item of items) {
            const itemPrice = item.price || item.priceValue || 0;
            const itemQty = item.quantity || item.soluong || 0;

            await transaction.request()
                .input('orderId', sql.NVarChar, id)
                .input('productId', sql.Int, item.id)
                .input('quantity', sql.Int, itemQty)
                .input('price', sql.Float, itemPrice)
                .input('note', sql.NVarChar, item.note || '')
                .query(`INSERT INTO OrderDetails (orderId, productId, quantity, price, note) 
                        VALUES (@orderId, @productId, @quantity, @price, @note)`);
        }


        await transaction.commit();
        res.json({ success: true, message: 'Cập nhật đơn hàng thành công', newTotalPrice });
    } catch (err) {
        try {
            await transaction.rollback();
        } catch (e) {
            // Ignore rollback errors if transaction hasn't started
        }
        console.error("DETAILED Update order error:", err);
        res.status(500).json({ message: 'Lỗi server khi cập nhật đơn hàng: ' + err.message });
    }

});

// Update order status (Staff and Admin)
app.put('/api/orders/:id/status', authenticateToken, isStaffOrAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // Get order info and user email to notify
        const orderInfoResult = await pool.request()
            .input('id', sql.NVarChar, id)
            .query(`
                SELECT o.customerPhone, o.totalPrice, o.receiverAddress, o.receiverPhone, u.email 
                FROM Orders o 
                JOIN Users u ON o.customerPhone = u.phone 
                WHERE o.id = @id
            `);
        
        await pool.request()
            .input('id', sql.NVarChar, id)
            .input('status', sql.Int, status)
            .query('UPDATE Orders SET status=@status WHERE id=@id');
        
        if (orderInfoResult.recordset.length > 0) {
            const orderInfo = orderInfoResult.recordset[0];
            const statusNames = ["Chờ xử lý", "Đang giao", "Hoàn thành", "Đã hủy"];
            const statusName = statusNames[status] || "Cập nhật";
            
            await createLog(req.user.phone, 'UPDATE_ORDER_STATUS', `Cập nhật đơn hàng #${id} sang: ${statusName}`);

            // System Notification
            await createNotification(orderInfo.customerPhone, "Cập nhật đơn hàng", `Đơn hàng #${id} của bạn đã chuyển sang trạng thái: ${statusName}`, "order");
            
            // Email Notification
            if (orderInfo.email) {
                sendOrderEmail(id, orderInfo.email, statusName, {
                    totalPrice: orderInfo.totalPrice,
                    receiverAddress: orderInfo.receiverAddress,
                    receiverPhone: orderInfo.receiverPhone
                });
            }
        }

        res.json({ success: true, message: 'Order status updated' });
    } catch (err) {
        console.error("Update status error:", err);
        res.status(500).json({ message: 'Error updating order status' });
    }
});

// --- VOUCHER MANAGEMENT ---

// Get all vouchers (Admin only)
app.get('/api/vouchers', authenticateToken, isAdmin, async (req, res) => {
    try {
        // Using global pool
        const result = await pool.request().query('SELECT * FROM Vouchers ORDER BY expiryDate DESC');
        res.json(result.recordset);
    } catch (error) {
        console.error("Get vouchers error:", error);
        res.status(500).json({ message: 'Lỗi server khi lấy danh sách voucher' });
    }
});

// Check voucher validity (Public)
app.get('/api/vouchers/:code', async (req, res) => {
    try {
        const { code } = req.params;
        // Using global pool
        const result = await pool.request()
            .input('code', sql.NVarChar, code)
            .query('SELECT * FROM Vouchers WHERE code = @code AND status = 1 AND CAST(expiryDate AS DATE) >= CAST(GETDATE() AS DATE)');

        if (result.recordset && result.recordset.length > 0) {
            res.json({ success: true, voucher: result.recordset[0] });
        } else {
            res.json({ success: false, message: 'Mã giảm giá không tồn tại hoặc đã hết hạn' });
        }
    } catch (error) {
        console.error("Check voucher error:", error);
        res.status(500).json({ message: 'Lỗi server khi kiểm tra voucher' });
    }
});

// Create voucher (Admin only)
app.post('/api/vouchers', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { code, discountValue, discountType, minOrder, maxDiscount, expiryDate } = req.body;
        // Using global pool
        await pool.request()
            .input('code', sql.NVarChar, code)
            .input('discountValue', sql.Int, discountValue)
            .input('discountType', sql.Int, discountType)
            .input('minOrder', sql.Int, minOrder)
            .input('maxDiscount', sql.Int, maxDiscount)
            .input('expiryDate', sql.DateTime, expiryDate)
            .query('INSERT INTO Vouchers (code, discountValue, discountType, minOrder, maxDiscount, expiryDate, status) VALUES (@code, @discountValue, @discountType, @minOrder, @maxDiscount, @expiryDate, 1)');
        await createLog(req.user.phone, 'ADD_VOUCHER', `Tạo mã giảm giá mới: ${code}`);
        res.json({ success: true, message: 'Tạo mã giảm giá thành công' });
    } catch (error) {
        console.error("Create voucher error:", error);
        if (error.number === 2627) { // SQL Server primary key violation
            res.status(400).json({ message: 'Mã giảm giá này đã tồn tại!' });
        } else {
            res.status(500).json({ message: 'Lỗi server: ' + error.message });
        }
    }
});

// Update voucher status (Admin only)
app.put('/api/vouchers/:code', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { code } = req.params;
        const { status } = req.body;
        // Using global pool
        await pool.request()
            .input('code', sql.NVarChar, code)
            .input('status', sql.Int, status)
            .query('UPDATE Vouchers SET status = @status WHERE code = @code');
        await createLog(req.user.phone, 'UPDATE_VOUCHER', `Cập nhật trạng thái voucher: ${code} (Status: ${status})`);
        res.json({ success: true, message: 'Cập nhật trạng thái voucher thành công' });
    } catch (error) {
        console.error("Update voucher error:", error);
        res.status(500).json({ message: 'Lỗi server khi cập nhật voucher' });
    }
});

// Delete voucher (Admin only)
app.delete('/api/vouchers/:code', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { code } = req.params;
        // Using global pool
        await pool.request()
            .input('code', sql.NVarChar, code)
            .query('DELETE FROM Vouchers WHERE code = @code');
        await createLog(req.user.phone, 'DELETE_VOUCHER', `Xóa mã giảm giá: ${code}`);
        res.json({ success: true, message: 'Xóa mã giảm giá thành công' });
    } catch (error) {
        console.error("Delete voucher error:", error);
        res.status(500).json({ message: 'Lỗi server khi xóa voucher' });
    }
});

// --- PRODUCT REVIEWS ---

// Get reviews for a product
app.get('/api/products/:id/reviews', async (req, res) => {
    try {
        const { id } = req.params;
        // Using global pool
        const result = await pool.request()
            .input('productId', sql.Int, id)
            .query('SELECT * FROM Reviews WHERE productId = @productId ORDER BY reviewDate DESC');
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
        const customerPhone = req.user.phone;

        // Kiểm tra xem khách hàng đã mua sản phẩm này chưa (Status 2 = Completed)
        const purchaseCheck = await pool.request()
            .input('phone', sql.NVarChar, customerPhone)
            .input('productId', sql.Int, productId)
            .query(`
                SELECT TOP 1 d.productId 
                FROM Orders o 
                JOIN OrderDetails d ON o.id = d.orderId 
                WHERE o.customerPhone = @phone 
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
                .input('phone', sql.NVarChar, customerPhone)
                .query('SELECT fullname FROM Users WHERE phone = @phone');
            if (userResult.recordset.length > 0) {
                customerName = userResult.recordset[0].fullname;
            }
        }

        await pool.request()
            .input('productId', sql.Int, productId)
            .input('customerPhone', sql.NVarChar, customerPhone)
            .input('customerName', sql.NVarChar, customerName || 'Khách hàng')
            .input('rating', sql.Int, rating)
            .input('comment', sql.NVarChar, comment || '')
            .query('INSERT INTO Reviews (productId, customerPhone, customerName, rating, comment, reviewDate) VALUES (@productId, @customerPhone, @customerName, @rating, @comment, GETDATE())');

        res.json({ success: true, message: 'Đánh giá của bạn đã được gửi!' });
    } catch (error) {
        console.error("Submit review error:", error);
        res.status(500).json({ message: 'Lỗi server khi gửi đánh giá' });
    }
});

// --- ADMIN STATS API ---

// Get advanced statistics for charts
app.get('/api/admin/stats/report', authenticateToken, isAdmin, async (req, res) => {
    try {
        // Using global pool

        // 1. Top 5 Best Sellers
        const topProducts = await pool.request().query(`
            SELECT TOP 5 p.title, SUM(od.quantity) as totalQuantity, SUM(od.quantity * od.price) as totalRevenue
            FROM OrderDetails od
            JOIN Products p ON od.productId = p.id
            JOIN Orders o ON od.orderId = o.id
            WHERE o.status = 2 -- Only Paid orders
            GROUP BY p.id, p.title
            ORDER BY totalQuantity DESC
        `);

        // 2. Monthly Revenue (Current Year)
        const monthlyRevenue = await pool.request().query(`
            SELECT MONTH(CAST(o.deliveryDate AS DATE)) as month, SUM(o.totalPrice) as revenue
            FROM Orders o
            WHERE o.status = 2 
            AND YEAR(CAST(o.deliveryDate AS DATE)) = YEAR(GETDATE())
            GROUP BY MONTH(CAST(o.deliveryDate AS DATE))
            ORDER BY month ASC
        `);

        // 3. Category Distribution
        const categoryStats = await pool.request().query(`
            SELECT p.category, SUM(od.quantity * od.price) as revenue
            FROM OrderDetails od
            JOIN Products p ON od.productId = p.id
            JOIN Orders o ON od.orderId = o.id
            WHERE o.status = 2
            GROUP BY p.category
        `);

        res.json({
            topProducts: topProducts.recordset,
            monthlyRevenue: monthlyRevenue.recordset,
            categoryStats: categoryStats.recordset
        });
    } catch (error) {
        console.error("Admin stats report error:", error);
        res.status(500).json({ message: 'Lỗi server khi lấy dữ liệu thống kê' });
    }
});

// --- END ADMIN STATS API ---

// --- ADMIN REVIEW MANAGEMENT ---

// Admin: Get all reviews
app.get('/api/admin/reviews', authenticateToken, isAdmin, async (req, res) => {
    try {
        // Using global pool
        const result = await pool.request()
            .query(`
                SELECT r.*, p.title as productTitle 
                FROM Reviews r 
                JOIN Products p ON r.productId = p.id 
                ORDER BY r.reviewDate DESC
            `);
        res.json(result.recordset);
    } catch (error) {
        console.error("Admin get reviews error:", error);
        res.status(500).json({ message: 'Lỗi server khi lấy danh sách đánh giá' });
    }
});

// Delete a review
app.delete('/api/admin/reviews/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        // Using global pool
        await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM Reviews WHERE id = @id');
        res.json({ success: true, message: 'Xóa đánh giá thành công' });
    } catch (error) {
        console.error("Admin delete review error:", error);
        res.status(500).json({ message: 'Lỗi server khi xóa đánh giá' });
    }
});

// --- END PRODUCT REVIEWS ---

// --- STOCK MANAGEMENT ---

// Get Stock History
app.get('/api/admin/stock-history', authenticateToken, isAdmin, async (req, res) => {
    try {
        // Using global pool
        const result = await pool.request().query(`
            SELECT sh.*, p.title as productTitle 
            FROM StockHistory sh 
            JOIN Products p ON sh.productId = p.id 
            ORDER BY sh.importDate DESC
        `);
        res.json(result.recordset);
    } catch (err) {
        console.error("Fetch stock history error:", err);
        res.status(500).json({ message: 'Error fetching stock history' });
    }
});

// Record Stock In
app.get('/api/admin/logs', authenticateToken, isAdmin, async (req, res) => {
    try {
        if (!pool) return res.status(500).json({ message: 'Database pool not initialized' });
        const result = await pool.request()
            .query('SELECT * FROM SystemLogs ORDER BY createdAt DESC');
        res.json(result.recordset);
    } catch (err) {
        console.error("Get logs error:", err);
        res.status(500).json({ message: 'Error fetching system logs' });
    }
});

app.post('/api/admin/stock-in', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { productId, quantity, note } = req.body;
        // Using global pool
        const transaction = new sql.Transaction(pool);

        await transaction.begin();

        try {
            // 1. Record history
            await transaction.request()
                .input('productId', sql.Int, productId)
                .input('quantity', sql.Int, quantity)
                .input('note', sql.NVarChar, note)
                .query('INSERT INTO StockHistory (productId, quantity, note) VALUES (@productId, @quantity, @note)');

            // 2. Update Product stock
            await transaction.request()
                .input('productId', sql.Int, productId)
                .input('quantity', sql.Int, quantity)
                .query('UPDATE Products SET stock = stock + @quantity WHERE id = @productId');

            await transaction.commit();
            res.status(201).json({ success: true, message: 'Nhập kho thành công!' });
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (err) {
        console.error("Stock in error:", err);
        res.status(500).json({ message: 'Lỗi khi cập nhật kho hàng' });
    }
});

// --- NOTIFICATION MANAGEMENT ---

// Get notifications for current user
app.get('/api/notifications', authenticateToken, async (req, res) => {
    try {
        const userPhone = req.user.phone;
        const isStaff = req.user.userType === 1 || req.user.userType === 2;
        
        let query = 'SELECT * FROM Notifications WHERE userPhone = @userPhone';
        if (isStaff) {
            query += " OR userPhone = 'ADMIN'";
        }
        query += ' ORDER BY createdAt DESC';

        const result = await pool.request()
            .input('userPhone', sql.NVarChar, userPhone)
            .query(query);
        res.json(result.recordset);
    } catch (err) {
        console.error("Fetch notifications error:", err);
        res.status(500).json({ message: 'Lỗi khi tải thông báo' });
    }
});

// Mark notification as read
app.put('/api/notifications/:id/read', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userPhone = req.user.phone;
        const isStaff = req.user.userType === 1 || req.user.userType === 2;

        let query = 'UPDATE Notifications SET isRead = 1 WHERE id = @id AND (userPhone = @userPhone';
        if (isStaff) {
            query += " OR userPhone = 'ADMIN'";
        }
        query += ')';

        await pool.request()
            .input('id', sql.Int, id)
            .input('userPhone', sql.NVarChar, userPhone)
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
        const userPhone = req.user.phone;
        const isStaff = req.user.userType === 1 || req.user.userType === 2;

        let query = 'UPDATE Notifications SET isRead = 1 WHERE userPhone = @userPhone';
        if (isStaff) {
            query += " OR userPhone = 'ADMIN'";
        }

        await pool.request()
            .input('userPhone', sql.NVarChar, userPhone)
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
        const userPhone = req.user.phone;
        const isStaff = req.user.userType === 1 || req.user.userType === 2;

        let query = 'DELETE FROM Notifications WHERE id = @id AND (userPhone = @userPhone';
        if (isStaff) {
            query += " OR userPhone = 'ADMIN'";
        }
        query += ')';

        await pool.request()
            .input('id', sql.Int, id)
            .input('userPhone', sql.NVarChar, userPhone)
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
        const userPhone = req.user.phone;
        const isStaff = req.user.userType === 1 || req.user.userType === 2;

        let query = 'DELETE FROM Notifications WHERE userPhone = @userPhone';
        if (isStaff) {
            query += " OR userPhone = 'ADMIN'";
        }

        await pool.request()
            .input('userPhone', sql.NVarChar, userPhone)
            .query(query);
        res.json({ success: true });
    } catch (err) {
        console.error("Delete all notifications error:", err);
        res.status(500).json({ message: 'Lỗi khi xóa tất cả thông báo' });
    }
});

// --- END NOTIFICATION MANAGEMENT ---

// --- CATEGORY MANAGEMENT ---
// Get all categories (Public)
app.get('/api/categories', async (req, res) => {
    try {
        const result = await pool.request().query('SELECT * FROM Categories ORDER BY name ASC');
        res.json(result.recordset);
    } catch (err) {
        console.error("Fetch categories error:", err);
        res.status(500).json({ message: 'Lỗi khi tải danh mục' });
    }
});

// Add category (Admin only)
app.post('/api/categories', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ message: 'Tên danh mục không được để trống' });

        // Check duplicate category name (case-insensitive)
        const existingCategory = await pool.request()
            .input('name', sql.NVarChar, name.trim())
            .query('SELECT TOP 1 id FROM Categories WHERE LOWER(TRIM(name)) = LOWER(@name)');
        if (existingCategory.recordset.length > 0) {
            return res.status(400).json({ success: false, message: 'Tên danh mục đã tồn tại!' });
        }

        await pool.request()
            .input('name', sql.NVarChar, name)
            .query('INSERT INTO Categories (name) VALUES (@name)');
        
        await createLog(req.user.phone, 'ADD_CATEGORY', `Thêm danh mục: ${name}`);
        res.status(201).json({ success: true, message: 'Thêm danh mục thành công' });
    } catch (err) {
        if (err.number === 2627) { // Unique constraint violation
            return res.status(400).json({ message: 'Tên danh mục đã tồn tại!' });
        }
        console.error("Add category error:", err);
        res.status(500).json({ message: 'Lỗi khi thêm danh mục' });
    }
});

// Update category (Admin only)
app.put('/api/categories/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        if (!name) return res.status(400).json({ message: 'Tên danh mục không được để trống' });

        // Check duplicate category name excluding current (case-insensitive)
        const existingCategory = await pool.request()
            .input('id', sql.Int, parseInt(id))
            .input('name', sql.NVarChar, name.trim())
            .query('SELECT TOP 1 id FROM Categories WHERE LOWER(TRIM(name)) = LOWER(@name) AND id != @id');
        if (existingCategory.recordset.length > 0) {
            return res.status(400).json({ success: false, message: 'Tên danh mục đã tồn tại cho một danh mục khác!' });
        }
        
        await pool.request()
            .input('id', sql.Int, id)
            .input('name', sql.NVarChar, name)
            .query('UPDATE Categories SET name = @name WHERE id = @id');
        
        await createLog(req.user.phone, 'UPDATE_CATEGORY', `Cập nhật danh mục ID: ${id} sang: ${name}`);
        res.json({ success: true, message: 'Cập nhật danh mục thành công' });
    } catch (err) {
        console.error("Update category error:", err);
        res.status(500).json({ message: 'Lỗi khi cập nhật danh mục' });
    }
});

// Delete category (Admin only)
app.delete('/api/categories/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if category is in use
        const catCheck = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT name FROM Categories WHERE id = @id');
        
        if (catCheck.recordset.length === 0) return res.status(404).json({ message: 'Không tìm thấy danh mục' });
        
        const catName = catCheck.recordset[0].name;
        const productCheck = await pool.request()
            .input('name', sql.NVarChar, catName)
            .query('SELECT COUNT(*) as count FROM Products WHERE category = @name');
        
        if (productCheck.recordset[0].count > 0) {
            return res.status(400).json({ message: 'Không thể xóa danh mục đang có sản phẩm' });
        }

        await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM Categories WHERE id = @id');
        
        await createLog(req.user.phone, 'DELETE_CATEGORY', `Xóa danh mục: ${catName} (ID: ${id})`);
        res.json({ success: true, message: 'Xóa danh mục thành công' });
    } catch (err) {
        console.error("Delete category error:", err);
        res.status(500).json({ message: 'Lỗi khi xóa danh mục' });
    }
});
// --- END CATEGORY MANAGEMENT ---

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
                .query('SELECT status, customerPhone, totalPrice, receiverAddress, receiverPhone, note FROM Orders WHERE id = @id');
            
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
                    order.customerPhone, 
                    "Thanh toán thành công", 
                    `Đơn hàng #${orderIdStr} đã được thanh toán thành công qua PayOS! Nhân viên đang chuẩn bị món ăn.`, 
                    "order"
                );
                
                // System Notification for Admin/Staff
                await createNotification(
                    "ADMIN", 
                    "Thanh toán đơn hàng", 
                    `Đơn hàng #${orderIdStr} từ ${order.customerPhone} đã được thanh toán thành công qua PayOS`, 
                    "order"
                );
                
                // Log activity
                await createLog(order.customerPhone, 'PAYOS_PAYMENT_SUCCESS', `Thanh toán thành công ${order.totalPrice}đ cho đơn hàng #${orderIdStr}`);
                
                // Send email confirmation
                const userResult = await pool.request()
                    .input('phone', sql.NVarChar, order.customerPhone)
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
            .input('id', sql.Int, id)
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
            .input('id', sql.Int, id)
            .query('SELECT * FROM Contacts WHERE id = @id');
            
        if (result.recordset.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy liên hệ' });
        }
        
        const contact = result.recordset[0];
        
        // 2. Send email
        await sendReplyEmail(contact.email, contact.subject, replyMessage);
        
        // 3. Update status to Replied (2)
        await pool.request()
            .input('id', sql.Int, id)
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
            .input('id', sql.Int, id)
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
        const userPhone = req.user.phone;
        const result = await pool.request()
            .input('userPhone', sql.NVarChar, userPhone)
            .query('SELECT productId FROM Favorites WHERE userPhone = @userPhone');
        
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
        const userPhone = req.user.phone;
        const { productId } = req.body;
        if (!productId) return res.status(400).json({ success: false, message: 'Thiếu productId' });

        await pool.request()
            .input('userPhone', sql.NVarChar, userPhone)
            .input('productId', sql.NVarChar, productId.toString())
            .query(`
                IF NOT EXISTS (SELECT 1 FROM Favorites WHERE userPhone = @userPhone AND productId = @productId)
                BEGIN
                    INSERT INTO Favorites (userPhone, productId) VALUES (@userPhone, @productId)
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
        const userPhone = req.user.phone;
        const { productId } = req.params;

        await pool.request()
            .input('userPhone', sql.NVarChar, userPhone)
            .input('productId', sql.NVarChar, productId.toString())
            .query('DELETE FROM Favorites WHERE userPhone = @userPhone AND productId = @productId');
            
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
            .input('sessionId', sql.Int, req.params.sessionId)
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
            .input('sessionId', sql.Int, req.params.sessionId)
            .query('DELETE FROM ChatSessions WHERE id = @sessionId'); // Cascade will delete messages
        res.json({ success: true, message: 'Đã xóa phiên chat' });
    } catch (error) {
        console.error('Error deleting chat session:', error);
        res.status(500).json({ success: false, message: 'Lỗi xóa phiên chat' });
    }
});


// ==================== NEWS API ====================

// Lấy danh sách tin tức (Public)
app.get('/api/news', async (req, res) => {
    try {
        const result = await pool.request()
            .query('SELECT * FROM News WHERE status = 1 ORDER BY createdAt DESC');
        res.json({ success: true, data: result.recordset });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi lấy tin tức' });
    }
});

// Lấy danh sách tin tức (Admin - Lấy cả bài ẩn)
app.get('/api/admin/news', authenticateToken, isAdmin, async (req, res) => {
    try {
        const result = await pool.request()
            .query('SELECT * FROM News ORDER BY createdAt DESC');
        res.json({ success: true, data: result.recordset });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi lấy tin tức admin' });
    }
});

// Lấy chi tiết tin tức
app.get('/api/news/:id', async (req, res) => {
    try {
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('SELECT * FROM News WHERE id = @id');
        if (result.recordset.length === 0) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
        res.json({ success: true, data: result.recordset[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi lấy chi tiết tin tức' });
    }
});

// Thêm tin tức (Admin)
app.post('/api/admin/news', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { title, thumbnail, content, author, status } = req.body;
        await pool.request()
            .input('title', sql.NVarChar, title)
            .input('thumbnail', sql.NVarChar, thumbnail)
            .input('content', sql.NVarChar, content)
            .input('author', sql.NVarChar, author || 'Admin')
            .input('status', sql.Int, status !== undefined ? status : 1)
            .query(`
                INSERT INTO News (title, thumbnail, content, author, status) 
                VALUES (@title, @thumbnail, @content, @author, @status)
            `);
        res.json({ success: true, message: 'Thêm tin tức thành công' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi thêm tin tức' });
    }
});

// Sửa tin tức (Admin)
app.put('/api/admin/news/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { title, thumbnail, content, author, status } = req.body;
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .input('title', sql.NVarChar, title)
            .input('thumbnail', sql.NVarChar, thumbnail)
            .input('content', sql.NVarChar, content)
            .input('author', sql.NVarChar, author)
            .input('status', sql.Int, status)
            .query(`
                UPDATE News 
                SET title = @title, thumbnail = @thumbnail, content = @content, 
                    author = @author, status = @status, updatedAt = GETDATE()
                WHERE id = @id
            `);
        res.json({ success: true, message: 'Cập nhật thành công' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi cập nhật tin tức' });
    }
});

// Xóa tin tức (Admin)
app.delete('/api/admin/news/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('DELETE FROM News WHERE id = @id');
        res.json({ success: true, message: 'Xóa thành công' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi xóa tin tức' });
    }
});

// Serve static files
app.use(express.static(path.join(__dirname, '../frontend')));

if (process.env.NODE_ENV !== 'production') {
    startServer();
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

module.exports = app; // Dòng này là QUAN TRỌNG NHẤT để Vercel chạy được
