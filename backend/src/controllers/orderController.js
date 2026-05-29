const { sql, poolPromise } = require('../config/db');


exports.deleteOrder = async (req, res) => {
    try {
        const id = await resolveOrderId(req.params.id);
        
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
};

exports.createOrder = async (req, res) => {
    console.log('Received order request:', JSON.stringify(req.body, null, 2));
    const transaction = new sql.Transaction(pool);
    try {
        const order = req.body;
        if (!order || !order.chitiet || !Array.isArray(order.chitiet)) {
            throw new Error('Invalid order data: missing chitiet array');
        }

        // Generate Order ID if not provided or to ensure uniqueness
        const countResult = await pool.request().query("SELECT MAX(CAST(SUBSTRING(orderCode, 3, LEN(orderCode)) AS INT)) as maxId FROM Orders WHERE orderCode LIKE 'DH%'");
        const maxId = countResult.recordset[0].maxId || 0;
        const finalId = 'DH' + (maxId + 1).toString().padStart(3, '0');
        const newOrderId = require('crypto').randomUUID();

        await transaction.begin();

        const orderRequest = new sql.Request(transaction);
        console.log('Inserting order:', finalId);
        const userId = order.khachhang;

        await orderRequest
            .input('id', sql.UniqueIdentifier, newOrderId)
            .input('orderCode', sql.NVarChar, finalId)
            .input('userId', sql.UniqueIdentifier, userId)
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
            .query(`INSERT INTO Orders (id, orderCode, userId, totalPrice, deliveryType, deliveryTime, deliveryDate, receiverName, receiverPhone, receiverAddress, note, voucherCode, discountAmount, shippingFee, orderDate, status) 
                    VALUES (@id, @orderCode, @userId, @totalPrice, @deliveryType, @deliveryTime, @deliveryDate, @receiverName, @receiverPhone, @receiverAddress, @note, @voucherCode, @discountAmount, @shippingFee, GETDATE(), @status)`);

        // Notify user about successful order
        console.log(`[Order] Notifying customer: ${userId}`);
        await createNotification(userId, "Đơn hàng mới", `Đơn hàng #${finalId} đã được đặt thành công!`, "order");
        
        // Fetch user email for notification
        const userResult = await pool.request()
            .input('userId', sql.UniqueIdentifier, userId)
            .query('SELECT email FROM Users WHERE id = @userId');
        
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
        await createNotification("ADMIN", "Đơn hàng mới", `Có đơn hàng mới #${finalId} từ ${userId}`, "order");

        console.log('Inserting details for order:', finalId);
        for (const item of order.chitiet) {
            // Check stock first
            const checkStockReq = new sql.Request(transaction);
            const stockResult = await checkStockReq
                .input('pId', sql.UniqueIdentifier, item.id)
                .query('SELECT stock, title, minStock FROM Products WHERE id = @pId');

            const product = stockResult.recordset[0];
            if (!product || product.stock < parseInt(item.soluong)) {
                throw new Error(`Sản phẩm "${product ? product.title : item.id}" không đủ số lượng trong kho!`);
            }

            // Insert order details
            const detailRequest = new sql.Request(transaction);
            await detailRequest
                .input('orderId', sql.UniqueIdentifier, newOrderId)
                .input('productId', sql.UniqueIdentifier, item.id)
                .input('price', sql.Float, parseFloat(item.price))
                .input('quantity', sql.Int, parseInt(item.soluong))
                .input('note', sql.NVarChar, item.note || '')
                .query(`INSERT INTO OrderDetails (orderId, productId, price, quantity, note) 
                        VALUES (@orderId, @productId, @price, @quantity, @note)`);

            // Decrease stock
            if (product && product.stock !== undefined) {
                const updateStockReq = new sql.Request(transaction);
                await updateStockReq
                    .input('pId', sql.UniqueIdentifier, item.id)
                    .input('q', sql.Int, parseInt(item.soluong))
                    .query('UPDATE Products SET stock = stock - @q WHERE id = @pId');
                
                // Check minStock Warning
                const remainingStock = product.stock - parseInt(item.soluong);
                const limit = product.minStock !== undefined && product.minStock !== null ? product.minStock : 5;
                if (remainingStock <= limit) {
                    if (typeof createNotification === 'function') {
                        createNotification('all_staff', `CẢNH BÁO TỒN KHO: Sản phẩm "${product.title}" sắp hết. Chỉ còn ${remainingStock} phần!`, 'warning');
                    }
                }
            }
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
};

exports.getOrdersPaginated = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const status = parseInt(req.query.status);
        const search = req.query.search || '';
        const startDate = req.query.startDate || '';
        const endDate = req.query.endDate || '';
        
        const offset = (page - 1) * limit;

        let baseQuery = 'FROM Orders WHERE 1=1';
        const request = pool.request();

        // If not staff/admin, filter by user's phone
        if (req.user.userType === 0) {
            baseQuery += ' AND userId = @userId';
            request.input('userId', sql.NVarChar, req.user.id);
        }

        // Apply filters
        if (!isNaN(status) && status !== 3) {
            baseQuery += ' AND status = @status';
            request.input('status', sql.Int, status);
        }

        if (search) {
            baseQuery += ' AND (userId LIKE @search OR id LIKE @search)';
            request.input('search', sql.NVarChar, `%${search}%`);
        }

        if (startDate) {
            baseQuery += ' AND orderDate >= @startDate';
            request.input('startDate', sql.DateTime, new Date(startDate));
        }

        if (endDate) {
            let end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            baseQuery += ' AND orderDate <= @endDate';
            request.input('endDate', sql.DateTime, end);
        }

        // Get total count
        const countResult = await request.query(`SELECT COUNT(*) as total ${baseQuery}`);
        const total = countResult.recordset[0].total;

        // Get paginated data
        const query = `
            SELECT * ${baseQuery}
            ORDER BY orderDate DESC
            OFFSET @offset ROWS
            FETCH NEXT @limit ROWS ONLY
        `;
        
        request.input('offset', sql.Int, offset);
        request.input('limit', sql.Int, limit);
        
        const result = await request.query(query);
        const orders = result.recordset || [];

        // Fetch details for each order
        for (let order of orders) {
            const detailsResult = await pool.request()
                .input('orderId', sql.UniqueIdentifier, order.id)
                .query('SELECT od.*, p.title, p.img FROM OrderDetails od JOIN Products p ON od.productId = p.id WHERE od.orderId = @orderId');
            order.chitiet = JSON.stringify(detailsResult.recordset.map(d => ({
                ...d,
                soluong: d.quantity,
                price: d.price
            })));
        }

        res.json({
            data: orders.map(o => ({
                ...o,
                id: o.orderCode || o.id, // Map orderCode to id for frontend
                uuid: o.id,
                thoigiandat: o.orderDate,
                khachhang: o.userId,
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
            })),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        });

    } catch (err) {
        console.error("Fetch paginated orders error:", err);
        res.status(500).json({ message: 'Error fetching orders' });
    }
};

exports.getOrders = async (req, res) => {
    try {
        let query = 'SELECT * FROM Orders';
        const request = pool.request();

        // If not staff/admin, filter by user's phone
        if (req.user.userType === 0) {
            query += ' WHERE userId = @userId';
            request.input('userId', sql.NVarChar, req.user.id);
        }

        const result = await request.query(query);
        const orders = result.recordset || [];

        // Fetch details for each order to include in the response
        for (let order of orders) {
            const detailsResult = await pool.request()
                .input('orderId', sql.UniqueIdentifier, order.id)
                .query('SELECT od.*, p.title, p.img FROM OrderDetails od JOIN Products p ON od.productId = p.id WHERE od.orderId = @orderId');
            order.chitiet = JSON.stringify(detailsResult.recordset.map(d => ({
                ...d,
                soluong: d.quantity,
                price: d.price
            })));
        }

        res.json(orders.map(o => ({
            ...o,
            id: o.orderCode || o.id, // Map orderCode to id for frontend
            uuid: o.id,
            thoigiandat: o.orderDate,
            khachhang: o.userId,
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
};

exports.getOrderDetails = async (req, res) => {
    try {
        const id = await resolveOrderId(req.params.id);
        const result = await pool.request()
            .input('orderId', sql.NVarChar, id)
            .query('SELECT od.*, p.title, p.img FROM OrderDetails od JOIN Products p ON od.productId = p.id WHERE od.orderId = @orderId');
        res.json(result.recordset.map(d => ({
            ...d,
            id: d.productId,
            soluong: d.quantity
        })));
    } catch (err) {
        res.status(500).json({ message: 'Error fetching order details' });
    }
};

exports.cancelOrder = async (req, res) => {
    try {
        const id = await resolveOrderId(req.params.id);
        const userId = req.user.id;

        // Check if order exists and belongs to user and is still processing
        const orderCheck = await pool.request()
            .input('id', sql.NVarChar, id)
            .query('SELECT userId, status FROM Orders WHERE id = @id');

        if (orderCheck.recordset.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
        }

        const order = orderCheck.recordset[0];
        if (order.userId !== userId) {
            return res.status(403).json({ message: 'Bạn không có quyền hủy đơn hàng này' });
        }

        if (order.status !== 0) {
            return res.status(400).json({ message: 'Chỉ có thể hủy đơn hàng đang xử lý' });
        }

        await pool.request()
            .input('id', sql.NVarChar, id)
            .query('UPDATE Orders SET status = 3 WHERE id = @id'); // 3 = Cancelled

        // Notify Admin about the cancellation
        await createNotification("ADMIN", "Đơn hàng hủy", `Đơn hàng #${id} đã bị khách hàng (${userId}) hủy!`, "cancel");

        res.json({ success: true, message: 'Đã hủy đơn hàng thành công' });
    } catch (err) {
        console.error("Cancel order error:", err);
        res.status(500).json({ message: 'Lỗi server khi hủy đơn hàng' });
    }
};

exports.updateOrder = async (req, res) => {
    const transaction = new sql.Transaction(pool);
    try {
        const id = await resolveOrderId(req.params.id);
        const { note, chitiet, shippingFee, discountAmount } = req.body;
        const items = chitiet; // Map to items for compatibility with existing logic
        const userId = req.user.id;

        // 1. Check permissions
        const orderCheck = await pool.request()
            .input('id', sql.NVarChar, id)
            .query('SELECT userId, status FROM Orders WHERE id = @id');

        if (orderCheck.recordset.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
        }

        const order = orderCheck.recordset[0];
        if (order.userId !== userId) {
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

};

exports.updateOrderStatus = async (req, res) => {
    try {
        const id = await resolveOrderId(req.params.id);
        const { status } = req.body;

        // Get order info and user email to notify
        const orderInfoResult = await pool.request()
            .input('id', sql.NVarChar, id)
            .query(`
                SELECT o.userId, o.totalPrice, o.receiverAddress, o.receiverPhone, u.email 
                FROM Orders o 
                JOIN Users u ON o.userId = u.id 
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
            
            await createLog(req.user.id, 'UPDATE_ORDER_STATUS', `Cập nhật đơn hàng #${id} sang: ${statusName}`);

            // System Notification
            await createNotification(orderInfo.userId, "Cập nhật đơn hàng", `Đơn hàng #${id} của bạn đã chuyển sang trạng thái: ${statusName}`, "order");
            
            // Web Push Notification
            try {
                const subsResult = await pool.request()
                    .input('userId', sql.UniqueIdentifier, orderInfo.userId)
                    .query('SELECT * FROM PushSubscriptions WHERE userId = @userId');
                    
                const payload = JSON.stringify({
                    title: 'Cập nhật đơn hàng',
                    body: `Đơn hàng #${id} của bạn đã chuyển sang trạng thái: ${statusName}`,
                    icon: '/assets/img/logos/timifood.png',
                    url: '/components/account.html'
                });
                
                for (const sub of subsResult.recordset) {
                    const pushSubscription = {
                        endpoint: sub.endpoint,
                        keys: {
                            p256dh: sub.p256dh,
                            auth: sub.auth
                        }
                    };
                    webpush.sendNotification(pushSubscription, payload).catch(err => {
                        console.error('Lỗi gửi push notification:', err);
                        // Optional: Xóa sub lỗi nếu err.statusCode === 410 (Gone)
                    });
                }
            } catch (err) {
                console.error('Lỗi lấy push subscriptions:', err);
            }

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
};

