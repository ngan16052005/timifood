const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { sql, connectDB } = require('./src/config/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
require('dotenv').config();

// OTP Storage (Phone -> {otp, expiry})
const otpStore = new Map();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const SECRET_KEY = 'TiMiFood_Secret_Key_2026';

// Global error handlers to prevent silent crashes
process.on('uncaughtException', (err) => {
    console.error('CRITICAL UNCAUGHT EXCEPTION:', err);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('CRITICAL UNHANDLED REJECTION at:', promise, 'reason:', reason);
});

const app = express();
const PORT = process.env.PORT || 3500;

app.use(cors());
app.use(bodyParser.json());

// Logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toLocaleString()} - ${req.method} ${req.url}`);
    next();
});

let pool;
async function startServer() {
    try {
        pool = await connectDB();
        if (!pool) {
            console.error('Could not connect to database. Server starting without DB...');
        }

        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        }).on('error', (err) => {
            console.error('Server failed to start:', err);
        });
    } catch (err) {
        console.error('Start server error:', err);
    }
}

// --- MIDDLEWARE ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'Bạn cần đăng nhập để thực hiện thao tác này' });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ message: 'Phiên đăng nhập hết hạn hoặc không hợp lệ' });
        req.user = user;
        next();
    });
};

const isAdmin = (req, res, next) => {
    if (req.user && req.user.userType === 1) {
        next();
    } else {
        res.status(403).json({ message: 'Access denied. Admin only.' });
    }
};

const isStaffOrAdmin = (req, res, next) => {
    if (req.user && (req.user.userType === 1 || req.user.userType === 2)) {
        next();
    } else {
        res.status(403).json({ message: 'Access denied. Staff or Admin only.' });
    }
};

// Helper function to create notifications
async function createNotification(userPhone, title, message, type = 'info') {
    console.log(`[Notification] Creating for ${userPhone}: ${title}`);
    try {
        if (!pool) {
            console.error("[Notification] Error: DB pool not initialized");
            return false;
        }
        await pool.request()
            .input('userPhone', sql.NVarChar, userPhone)
            .input('title', sql.NVarChar, title)
            .input('message', sql.NVarChar, message)
            .input('type', sql.NVarChar, type)
            .query('INSERT INTO Notifications (userPhone, title, message, type) VALUES (@userPhone, @title, @message, @type)');
        console.log(`[Notification] Success: Created for ${userPhone}`);
        return true;
    } catch (err) {
        console.error("[Notification] Error creating notification:", err);
        return false;
    }
}

// Email transporter already initialized at the top

async function sendOrderEmail(orderId, customerEmail, statusName, orderDetails) {
    console.log(`[Email] Sending order update for #${orderId} to ${customerEmail}`);
    
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || !customerEmail || customerEmail === 'your-email@gmail.com') {
        console.warn("[Email] Skipping email send: Missing credentials or default placeholder email");
        return;
    }

    const mailOptions = {
        from: process.env.MAIL_FROM,
        to: customerEmail,
        subject: `TiMi Food - Cập nhật đơn hàng #${orderId}`,
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; max-width: 600px; border-radius: 10px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #B5292F; margin: 0;">TiMi Food</h1>
                    <p style="color: #666; font-size: 14px;">Cảm ơn bạn đã tin tưởng dịch vụ của chúng tôi!</p>
                </div>
                <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h2 style="color: #333; font-size: 18px; margin-top: 0;">Thông báo trạng thái đơn hàng</h2>
                    <p>Chào bạn,</p>
                    <p>Đơn hàng <strong>#${orderId}</strong> của bạn đã được cập nhật trạng thái mới:</p>
                    <div style="background: #B5292F; color: white; padding: 10px 20px; display: inline-block; border-radius: 5px; font-weight: bold; font-size: 16px;">
                        ${statusName}
                    </div>
                </div>
                <div style="border-top: 1px solid #eee; padding-top: 20px;">
                    <h3 style="color: #333; font-size: 16px;">Thông tin đơn hàng:</h3>
                    <table style="width: 100%; font-size: 14px;">
                        <tr>
                            <td style="color: #666; padding: 5px 0;">Tổng thanh toán:</td>
                            <td style="text-align: right; font-weight: bold; color: #ee4d2d;">${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(orderDetails.totalPrice)}</td>
                        </tr>
                        <tr>
                            <td style="color: #666; padding: 5px 0;">Địa chỉ giao hàng:</td>
                            <td style="text-align: right;">${orderDetails.receiverAddress}</td>
                        </tr>
                        <tr>
                            <td style="color: #666; padding: 5px 0;">Số điện thoại:</td>
                            <td style="text-align: right;">${orderDetails.receiverPhone}</td>
                        </tr>
                    </table>
                </div>
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #999; font-size: 12px;">
                    <p>Đây là email tự động, vui lòng không phản hồi email này.</p>
                    <p>&copy; 2026 TiMi Food. All rights reserved.</p>
                </div>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`[Email] Email sent successfully to ${customerEmail}`);
    } catch (error) {
        console.error("[Email] Failed to send email:", error);
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
        res.json({ success: true, message: 'Product deleted permanently' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting product' });
    }
});

// Login
app.post('/api/login', async (req, res) => {
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

// Send OTP via Email
app.post('/api/send-otp', async (req, res) => {
    try {
        const { phone } = req.body;
        const result = await pool.request()
            .input('phone', sql.NVarChar, phone)
            .query('SELECT email FROM Users WHERE phone = @phone');
        
        if (result.recordset.length === 0) {
            return res.status(404).json({ success: false, message: 'Số điện thoại chưa được đăng ký' });
        }

        const email = result.recordset[0].email;
        if (!email) {
            return res.status(400).json({ success: false, message: 'Tài khoản này chưa cập nhật Email' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiry = Date.now() + 5 * 60 * 1000; // 5 mins
        otpStore.set(phone, { otp, expiry });

        console.log(`[OTP DEBUG] Phone: ${phone}, Email: ${email}, OTP: ${otp}`);

        // Send actual email if configured
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: email,
                subject: '[TiMiFood] Mã xác thực khôi phục mật khẩu',
                html: `<h3>Mã OTP của bạn là: <b style="color: #ff5e3a; font-size: 24px;">${otp}</b></h3>
                       <p>Mã này có hiệu lực trong 5 phút. Vui lòng không chia sẻ mã này cho bất kỳ ai.</p>`
            };
            await transporter.sendMail(mailOptions);
            res.json({ success: true, message: 'OTP đã được gửi về Email của bạn' });
        } else {
            res.json({ success: true, message: 'OTP đã được tạo (Xem log server)', debug: true });
        }
    } catch (err) {
        console.error("Send OTP error:", err);
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

// Reset Password with OTP
app.post('/api/reset-password', async (req, res) => {
    try {
        const { phone, otp, newPassword } = req.body;
        
        // Verify OTP
        const stored = otpStore.get(phone);
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
            .input('phone', sql.NVarChar, phone)
            .input('password', sql.NVarChar, hashedPassword)
            .query('UPDATE Users SET password = @password WHERE phone = @phone');
        
        otpStore.delete(phone); // Clear OTP after success
        res.json({ success: true, message: 'Password updated successfully' });
    } catch (err) {
        console.error("Reset password error:", err);
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

// Register
app.post('/api/register', async (req, res) => {
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
app.post('/api/change-password', authenticateToken, async (req, res) => {
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

// Update user (Admin only)
app.put('/api/users/:phone', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { phone } = req.params;
        const { fullname, password, status, userType } = req.body;
        
        // Hash password if it's not already hashed (bcrypt hashes start with $2)
        let finalPassword = password;
        if (password && !password.startsWith('$2')) {
            // Backend strong password validation
            const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
            if (!strongPasswordRegex.test(password)) {
                return res.status(400).json({ message: 'Mật khẩu phải từ 8 ký tự, bao gồm chữ hoa, chữ thường và số' });
            }
            finalPassword = await bcrypt.hash(password, 10);
        }

        await pool.request()
            .input('phone', sql.NVarChar, phone)
            .input('fullname', sql.NVarChar, fullname)
            .input('password', sql.NVarChar, finalPassword)
            .input('status', sql.Int, status)
            .input('userType', sql.Int, userType)
            .query('UPDATE Users SET fullname = @fullname, password = @password, status = @status, userType = @userType WHERE phone = @phone');

        res.json({ success: true, message: 'Cập nhật tài khoản thành công' });
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
        res.status(201).json({ success: true, message: 'Order created successfully' });
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

// Delete order (Admin)
app.delete('/api/orders/:id', authenticateToken, async (req, res) => {
    if (!pool) {
        return res.status(500).json({ message: 'Database not connected' });
    }
    const transaction = new sql.Transaction(pool);
    try {
        const { id } = req.params;
        console.log(`Attempting to delete order: ${id}`);
        await transaction.begin();
        const request = new sql.Request(transaction);
        await request.input('orderId', sql.NVarChar, id)
            .query('DELETE FROM OrderDetails WHERE orderId=@orderId; DELETE FROM Orders WHERE id=@orderId;');
        await transaction.commit();
        console.log(`Successfully deleted order: ${id}`);
        res.json({ success: true, message: 'Order deleted successfully' });
    } catch (err) {
        console.error(`Error deleting order ${req.params.id}:`, err);
        try {
            if (transaction) await transaction.rollback();
        } catch (rollbackErr) {
            console.error('Rollback Error:', rollbackErr);
        }
        res.status(500).json({ message: 'Error deleting order', error: err.message });
    }
});
// --- VOUCHER MANAGEMENT ---

// Get all vouchers (Staff and Admin)
app.get('/api/vouchers', authenticateToken, isStaffOrAdmin, async (req, res) => {
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
app.get('/api/admin/reviews', authenticateToken, isStaffOrAdmin, async (req, res) => {
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

        await pool.request()
            .input('name', sql.NVarChar, name)
            .query('INSERT INTO Categories (name) VALUES (@name)');
        
        res.status(201).json({ success: true, message: 'Thêm danh mục thành công' });
    } catch (err) {
        if (err.number === 2627) { // Unique constraint violation
            return res.status(400).json({ message: 'Tên danh mục đã tồn tại' });
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
        
        await pool.request()
            .input('id', sql.Int, id)
            .input('name', sql.NVarChar, name)
            .query('UPDATE Categories SET name = @name WHERE id = @id');
        
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
        
        res.json({ success: true, message: 'Xóa danh mục thành công' });
    } catch (err) {
        console.error("Delete category error:", err);
        res.status(500).json({ message: 'Lỗi khi xóa danh mục' });
    }
});
// --- END CATEGORY MANAGEMENT ---

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

if (process.env.NODE_ENV !== 'production') {
    startServer();
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

module.exports = app; // Dòng này là QUAN TRỌNG NHẤT để Vercel chạy được
