const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { sql, connectDB } = require('./db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const SECRET_KEY = 'TiMiFood_Secret_Key_2026';

// Global error handlers to prevent silent crashes
process.on('uncaughtException', (err) => {
    console.error('CRITICAL UNCAUGHT EXCEPTION:', err);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('CRITICAL UNHANDLED REJECTION at:', promise, 'reason:', reason);
});

const app = express();
const PORT = process.env.PORT || 3000;

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

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

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

                user.join = user.joinDate;
                user.cart = []; 
                res.json({ success: true, user, token });
            } else {
                res.status(401).json({ success: false, message: 'Số điện thoại hoặc mật khẩu không đúng' });
            }
        } else {
            res.status(401).json({ success: false, message: 'Số điện thoại hoặc mật khẩu không đúng' });
        }
    } catch (err) {
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

// Get all users (Admin only)
app.get('/api/users', authenticateToken, isAdmin, async (req, res) => {
    try {
        // Using global pool
        const result = await pool.request().query('SELECT * FROM Users ORDER BY userType DESC, joinDate DESC');
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
        // Using global pool
        
        await pool.request()
            .input('phone', sql.NVarChar, phone)
            .input('fullname', sql.NVarChar, fullname)
            .input('password', sql.NVarChar, password)
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
        await orderRequest
            .input('id', sql.NVarChar, finalId)
            .input('customerPhone', sql.NVarChar, order.khachhang)
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
        await pool.request()
            .input('id', sql.NVarChar, id)
            .input('status', sql.Int, status)
            .query('UPDATE Orders SET status=@status WHERE id=@id');
        res.json({ success: true, message: 'Order status updated' });
    } catch (err) {
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
        // Using global pool
        
        // Kiểm tra xem khách hàng đã mua sản phẩm này chưa
        const purchaseCheck = await pool.request()
            .input('phone', sql.NVarChar, customerPhone)
            .input('productId', sql.Int, productId)
            .query(`
                SELECT TOP 1 d.productId 
                FROM Orders o 
                JOIN OrderDetails d ON o.id = d.orderId 
                WHERE o.customerPhone = @phone 
                AND d.productId = @productId 
                AND o.status = 1
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
            .input('comment', sql.NVarChar, comment)
            .query('INSERT INTO Reviews (productId, customerPhone, customerName, rating, comment) VALUES (@productId, @customerPhone, @customerName, @rating, @comment)');
        
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

// Get all reviews for admin
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

// --- END STOCK MANAGEMENT ---

// Serve static files
app.use(express.static(path.join(__dirname, './')));

startServer();
