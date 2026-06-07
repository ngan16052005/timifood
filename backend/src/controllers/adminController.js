const { sql, connectDB } = require('../config/db');
const { GoogleGenAI } = require('@google/genai');
const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;
let pool;
connectDB().then(p => pool = p).catch(console.error);

exports.getInventoryStats = async (req, res) => {
    try {
        const result = await pool.request().query(`
            SELECT TOP 10 p.title, p.stock, p.minStock, SUM(od.quantity) as soldQuantity 
            FROM OrderDetails od
            JOIN Orders o ON od.orderId = o.id
            JOIN Products p ON od.productId = p.id
            WHERE o.orderDate >= DATEADD(day, -7, GETUTCDATE())
              AND o.status != 3
            GROUP BY p.title, p.stock, p.minStock
            ORDER BY soldQuantity DESC
        `);
        res.json({ success: true, data: result.recordset });
    } catch (err) {
        console.error("Inventory stats error:", err);
        res.status(500).json({ message: 'Lỗi khi tải thống kê kho' });
    }
};

exports.getStatsReport = async (req, res) => {
    try {
        // Using global pool
        const { startDate, endDate } = req.query;
        let dateFilterOrders = "1=1";
        const request1 = pool.request();
        const request2 = pool.request();
        const request3 = pool.request();

        if (startDate) {
            dateFilterOrders += " AND o.orderDate >= @startDate";
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            request1.input('startDate', sql.DateTime, start);
            request2.input('startDate', sql.DateTime, start);
            request3.input('startDate', sql.DateTime, start);
        }
        if (endDate) {
            dateFilterOrders += " AND o.orderDate <= @endDate";
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            request1.input('endDate', sql.DateTime, end);
            request2.input('endDate', sql.DateTime, end);
            request3.input('endDate', sql.DateTime, end);
        }

        // 1. Top 5 Best Sellers
        const topProducts = await request1.query(`
            SELECT TOP 5 p.title, SUM(od.quantity) as totalQuantity, SUM(od.quantity * od.price) as totalRevenue
            FROM OrderDetails od
            JOIN Products p ON od.productId = p.id
            JOIN Orders o ON od.orderId = o.id
            WHERE o.status = 2 AND ${dateFilterOrders}
            GROUP BY p.id, p.title
            ORDER BY totalQuantity DESC
        `);

        // 2. Monthly Revenue (Current Year)
        const monthlyRevenue = await request2.query(`
            SELECT MONTH(CAST(o.orderDate AS DATE)) as month, SUM(o.totalPrice) as revenue
            FROM Orders o
            WHERE o.status = 2 
            AND YEAR(CAST(o.orderDate AS DATE)) = YEAR(GETUTCDATE())
            AND ${dateFilterOrders}
            GROUP BY MONTH(CAST(o.orderDate AS DATE))
            ORDER BY month ASC
        `);

        // 3. Category Distribution
        const categoryStats = await request3.query(`
            SELECT p.category, SUM(od.quantity * od.price) as revenue
            FROM OrderDetails od
            JOIN Products p ON od.productId = p.id
            JOIN Orders o ON od.orderId = o.id
            WHERE o.status = 2 AND ${dateFilterOrders}
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
};

exports.getAdmin_reviews = async (req, res) => {
    try {
        // Using global pool
        const result = await pool.request()
            .query(`
                SELECT r.*, r.createdAt as reviewDate, p.title as productTitle, u.fullname as customerName 
                FROM Reviews r 
                JOIN Products p ON r.productId = p.id 
                LEFT JOIN Users u ON r.userId = u.id 
                ORDER BY r.createdAt DESC
            `);
        res.json(result.recordset);
    } catch (error) {
        console.error("Admin get reviews error:", error);
        res.status(500).json({ message: 'Lỗi server khi lấy danh sách đánh giá' });
    }
};

exports.deleteAdmin_reviews_id = async (req, res) => {
    try {
        const { id } = req.params;
        // Using global pool
        await pool.request()
            .input('id', sql.UniqueIdentifier, id)
            .query('DELETE FROM Reviews WHERE id = @id');
            
        if (req.app.locals.createLog && req.user) {
            await req.app.locals.createLog(req.user.id, 'DELETE_REVIEW', `Xóa đánh giá ID: ${id}`);
        }
            
        res.json({ success: true, message: 'Xóa đánh giá thành công' });
    } catch (error) {
        console.error("Admin delete review error:", error);
        res.status(500).json({ message: 'Lỗi server khi xóa đánh giá' });
    }
};

exports.getAdmin_stock_history = async (req, res) => {
    try {
        // Using global pool
        const result = await pool.request().query(`
            SELECT 
                COALESCE(CAST(sh.id AS VARCHAR(36)), CAST(si.id AS VARCHAR(36))) as id,
                COALESCE(sh.productId, si.productId) as productId,
                COALESCE(sh.action, 'IMPORT_PO') as action,
                COALESCE(sh.quantity, si.quantity) as quantity,
                COALESCE(sh.createdAt, si.importDate) as createdAt,
                p.title as productTitle,
                si.purchaseOrderId,
                si.importPrice,
                si.totalPrice
            FROM StockHistory sh
            FULL OUTER JOIN StockImports si ON sh.productId = si.productId AND sh.action = 'IMPORT_PO' AND ABS(DATEDIFF(second, sh.createdAt, si.importDate)) < 5
            JOIN Products p ON COALESCE(sh.productId, si.productId) = p.id
            ORDER BY createdAt DESC
        `);
        res.json(result.recordset);
    } catch (err) {
        console.error("Fetch stock history error:", err);
        res.status(500).json({ message: 'Error fetching stock history' });
    }
};

exports.deleteAdmin_stock_history = async (req, res) => {
    try {
        const pool = await connectDB();
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            // Get the record
            const record = await transaction.request()
                .input('id', sql.Int, req.params.id)
                .query('SELECT * FROM StockHistory WHERE id = @id');

            if (!record.recordset || record.recordset.length === 0) {
                await transaction.rollback();
                return res.status(404).json({ success: false, message: 'Không tìm thấy lịch sử nhập/xuất' });
            }

            const item = record.recordset[0];
            
            if (item.action === 'IMPORT_PO') {
                await transaction.rollback();
                return res.status(400).json({ success: false, message: 'Lịch sử từ phiếu nhập không thể xoá trực tiếp tại đây! Vui lòng xoá phiếu nhập ở tab Lịch sử Phiếu Nhập.' });
            }

            // Reverse stock ONLY for IMPORT and EXPORT, not for DELETE_PO
            if (item.action === 'IMPORT') {
                await transaction.request()
                    .input('productId', sql.UniqueIdentifier, item.productId)
                    .input('quantity', sql.Int, item.quantity)
                    .query('UPDATE Products SET stock = ISNULL(stock, 0) - @quantity WHERE id = @productId');
            } else if (item.action === 'EXPORT') {
                await transaction.request()
                    .input('productId', sql.UniqueIdentifier, item.productId)
                    .input('quantity', sql.Int, item.quantity)
                    .query('UPDATE Products SET stock = ISNULL(stock, 0) + @quantity WHERE id = @productId');
            }

            // Delete the history record
            await transaction.request()
                .input('id', sql.Int, req.params.id)
                .query('DELETE FROM StockHistory WHERE id = @id');

            await transaction.commit();
            res.json({ success: true, message: 'Xoá lịch sử và hoàn tác tồn kho thành công' });
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

exports.getAdmin_logs = async (req, res) => {
    try {
        if (!pool) return res.status(500).json({ message: 'Database pool not initialized' });
        
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 15;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';
        
        let baseCountQuery = "SELECT COUNT(*) as total FROM SystemLogs sl LEFT JOIN Users u ON sl.userId = u.id";
        let baseDataQuery = "SELECT sl.*, COALESCE(u.phone, N'Hệ thống') as userPhone FROM SystemLogs sl LEFT JOIN Users u ON sl.userId = u.id";
        
        const reqPool = pool.request();
        
        if (search) {
            const whereClause = " WHERE sl.action LIKE @search OR sl.details LIKE @search OR u.phone LIKE @search";
            baseCountQuery += whereClause;
            baseDataQuery += whereClause;
            reqPool.input('search', sql.NVarChar, `%${search}%`);
        }
        
        reqPool.input('offset', sql.Int, offset);
        reqPool.input('limit', sql.Int, limit);
        
        baseDataQuery += " ORDER BY sl.createdAt DESC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY";
        
        const countResult = await reqPool.query(baseCountQuery);
        const dataResult = await reqPool.query(baseDataQuery);
        
        const total = countResult.recordset[0].total;
        
        res.json({
            data: dataResult.recordset,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        });
    } catch (err) {
        console.error("Get logs error:", err);
        res.status(500).json({ message: 'Error fetching system logs' });
    }
};

exports.deleteAdmin_log = async (req, res) => {
    try {
        if (!pool) return res.status(500).json({ message: 'Database pool not initialized' });
        const { id } = req.params;
        await pool.request()
            .input('id', sql.UniqueIdentifier, id)
            .query('DELETE FROM SystemLogs WHERE id = @id');
        res.json({ success: true, message: 'Log deleted successfully' });
    } catch (err) {
        console.error("Delete log error:", err);
        res.status(500).json({ message: 'Error deleting system log' });
    }
};

exports.clearAdmin_logs = async (req, res) => {
    try {
        if (!pool) return res.status(500).json({ message: 'Database pool not initialized' });
        await pool.request().query('TRUNCATE TABLE SystemLogs');
        res.json({ success: true, message: 'All logs cleared successfully' });
    } catch (err) {
        console.error("Clear logs error:", err);
        res.status(500).json({ message: 'Error clearing system logs' });
    }
};

exports.createAdmin_stock_in = async (req, res) => {
    try {
        const { productId, quantity, note } = req.body;
        console.log('stock-in request:', {productId, quantity, note, userId: req.user.id});
        // Using global pool
        const transaction = new sql.Transaction(pool);

        await transaction.begin();

        try {
            // 1. Record history
            await transaction.request()
                .input('productId', sql.UniqueIdentifier, productId)
                .input('action', sql.NVarChar, 'IMPORT')
                .input('quantity', sql.Int, quantity)
                .input('note', sql.NVarChar, note)
                .input('createdBy', sql.UniqueIdentifier, req.user.id)
                .query('INSERT INTO StockHistory (productId, action, quantity, note, createdBy, createdAt) VALUES (@productId, @action, @quantity, @note, @createdBy, GETUTCDATE())');

            // 2. Update Product stock
            await transaction.request()
                .input('productId', sql.UniqueIdentifier, productId)
                .input('quantity', sql.Int, quantity)
                .query('UPDATE Products SET stock = ISNULL(stock, 0) + @quantity WHERE id = @productId');

            await transaction.commit();
            
            if (req.app.locals.createLog && req.user) {
                await req.app.locals.createLog(req.user.id, 'STOCK_IN', `Nhập ${quantity} sản phẩm (ID: ${productId}). Ghi chú: ${note}`);
            }
            
            res.status(201).json({ success: true, message: 'Nhập kho thành công!' });
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (err) {
        console.error("Stock in error:", err);
        res.status(500).json({ message: 'Lỗi khi cập nhật kho hàng' });
    }
};

exports.getAdmin_suppliers = async (req, res) => {
    try {
        const pool = await connectDB();
        const result = await pool.request().query('SELECT * FROM Suppliers ORDER BY createdAt DESC');
        res.json({ success: true, data: result.recordset });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

exports.createAdmin_supplier = async (req, res) => {
    try {
        const { name, phone, email, address } = req.body;
        const pool = await connectDB();
        await pool.request()
            .input('name', sql.NVarChar, name)
            .input('phone', sql.NVarChar, phone)
            .input('email', sql.NVarChar, email)
            .input('address', sql.NVarChar, address)
            .query('INSERT INTO Suppliers (name, phone, email, address, status, createdAt) VALUES (@name, @phone, @email, @address, 1, GETUTCDATE())');
        res.status(201).json({ success: true, message: 'Thêm nhà cung cấp thành công' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

exports.getAdmin_purchase_orders = async (req, res) => {
    try {
        const pool = await connectDB();
        const result = await pool.request().query(`
            SELECT p.*, s.name as supplierName, u.fullName as staffName 
            FROM PurchaseOrders p
            LEFT JOIN Suppliers s ON p.supplierId = s.id
            LEFT JOIN Users u ON p.staffId = u.id
            ORDER BY p.importDate DESC
        `);
        res.json({ success: true, data: result.recordset });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

exports.createAdmin_purchase_order = async (req, res) => {
    try {
        const { supplierId, note, totalAmount, items } = req.body;
        const pool = await connectDB();
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            // 1. Insert PurchaseOrder
            const poResult = await transaction.request()
                .input('supplierId', sql.UniqueIdentifier, supplierId)
                .input('staffId', sql.UniqueIdentifier, req.user.id)
                .input('totalAmount', sql.Float, totalAmount)
                .input('note', sql.NVarChar, note)
                .query(`
                    INSERT INTO PurchaseOrders (supplierId, staffId, totalAmount, note, status, importDate)
                    OUTPUT INSERTED.id
                    VALUES (@supplierId, @staffId, @totalAmount, @note, 1, GETUTCDATE())
                `);
            const poId = poResult.recordset[0].id;

            // 2. Insert items and update products
            for (let item of items) {
                // a. Insert StockImports
                await transaction.request()
                    .input('purchaseOrderId', sql.UniqueIdentifier, poId)
                    .input('productId', sql.UniqueIdentifier, item.productId)
                    .input('quantity', sql.Int, item.quantity)
                    .input('importPrice', sql.Float, item.importPrice)
                    .input('totalPrice', sql.Float, item.quantity * item.importPrice)
                    .input('note', sql.NVarChar, note)
                    .input('importedBy', sql.UniqueIdentifier, req.user.id)
                    .query(`
                        INSERT INTO StockImports (purchaseOrderId, productId, quantity, importPrice, totalPrice, note, importedBy, importDate)
                        VALUES (@purchaseOrderId, @productId, @quantity, @importPrice, @totalPrice, @note, @importedBy, GETUTCDATE())
                    `);

                // b. Insert StockHistory
                await transaction.request()
                    .input('productId', sql.UniqueIdentifier, item.productId)
                    .input('action', sql.VarChar, 'IMPORT_PO')
                    .input('quantity', sql.Int, item.quantity)
                    .input('note', sql.NVarChar, 'Nhập từ phiếu nhập')
                    .input('createdBy', sql.UniqueIdentifier, req.user.id)
                    .query('INSERT INTO StockHistory (productId, action, quantity, note, createdBy, createdAt) VALUES (@productId, @action, @quantity, @note, @createdBy, GETUTCDATE())');

                // c. Update Products stock
                await transaction.request()
                    .input('productId', sql.UniqueIdentifier, item.productId)
                    .input('quantity', sql.Int, item.quantity)
                    .query('UPDATE Products SET stock = ISNULL(stock, 0) + @quantity WHERE id = @productId');
            }

            await transaction.commit();
            res.status(201).json({ success: true, message: 'Tạo phiếu nhập thành công' });
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Lỗi khi tạo phiếu nhập' });
    }
};

exports.deleteAdmin_supplier = async (req, res) => {
    try {
        const pool = await connectDB();
        // Check if supplier has purchase orders
        const check = await pool.request()
            .input('id', sql.UniqueIdentifier, req.params.id)
            .query('SELECT COUNT(*) as count FROM PurchaseOrders WHERE supplierId = @id');
            
        if (check.recordset[0].count > 0) {
            return res.status(400).json({ success: false, message: 'Không thể xoá nhà cung cấp đã có phiếu nhập!' });
        }
        
        await pool.request()
            .input('id', sql.UniqueIdentifier, req.params.id)
            .query('DELETE FROM Suppliers WHERE id = @id');
            
        res.json({ success: true, message: 'Xoá nhà cung cấp thành công' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

exports.deleteAdmin_purchase_order = async (req, res) => {
    try {
        const pool = await connectDB();
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            const items = await transaction.request()
                .input('poId', sql.UniqueIdentifier, req.params.id)
                .query('SELECT productId, quantity FROM StockImports WHERE purchaseOrderId = @poId');

            for (let item of items.recordset) {
                await transaction.request()
                    .input('productId', sql.UniqueIdentifier, item.productId)
                    .input('quantity', sql.Int, item.quantity)
                    .query('UPDATE Products SET stock = ISNULL(stock, 0) - @quantity WHERE id = @productId');
                    
                await transaction.request()
                    .input('productId', sql.UniqueIdentifier, item.productId)
                    .input('action', sql.VarChar, 'DELETE_PO')
                    .input('quantity', sql.Int, item.quantity)
                    .input('note', sql.NVarChar, 'Xoá phiếu nhập')
                    .input('createdBy', sql.UniqueIdentifier, req.user.id)
                    .query('INSERT INTO StockHistory (productId, action, quantity, note, createdBy, createdAt) VALUES (@productId, @action, @quantity, @note, @createdBy, GETUTCDATE())');
            }

            await transaction.request()
                .input('poId', sql.UniqueIdentifier, req.params.id)
                .query('DELETE FROM StockImports WHERE purchaseOrderId = @poId');

            await transaction.request()
                .input('poId', sql.UniqueIdentifier, req.params.id)
                .query('DELETE FROM PurchaseOrders WHERE id = @poId');

            await transaction.commit();
            res.json({ success: true, message: 'Xoá phiếu nhập và hoàn tác tồn kho thành công' });
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

exports.getAiInsights = async (req, res) => {
    try {
        if (!ai) {
            return res.status(503).json({ success: false, message: 'Tính năng AI chưa được cấu hình. Vui lòng thêm GEMINI_API_KEY vào file .env' });
        }
        
        const { dateRange, totalSales, totalOrders, topProducts } = req.body;
        
        const systemPrompt = `Bạn là Trợ lý phân tích kinh doanh (Data Analyst) cấp cao của nhà hàng TiMiFood.
Nhiệm vụ của bạn là đọc các số liệu bán hàng (doanh thu, số lượng đơn, các món bán chạy) mà hệ thống cung cấp, sau đó đưa ra một báo cáo phân tích ngắn gọn, chuyên nghiệp và sắc bén.
Báo cáo nên có cấu trúc:
1. Nhận xét tổng quan về tình hình kinh doanh (khen ngợi hoặc cảnh báo).
2. Phân tích nhóm món bán chạy (Tại sao lại bán chạy? Có xu hướng gì không?).
3. Gợi ý chiến lược: (Nên tạo combo nào? Nên chạy khuyến mãi mã gì? Nên loại bỏ hoặc cải thiện món nào?).
Vui lòng sử dụng Markdown để format đẹp mắt (dùng emoji vừa đủ, bôi đậm, gạch đầu dòng). Gọi người dùng là "Quản lý".`;

        let dataContext = `DỮ LIỆU KINH DOANH TIỆM TIMIFOOD:
- Thời gian phân tích: ${dateRange || 'Toàn thời gian'}
- Tổng doanh thu: ${totalSales}
- Số lượng sản phẩm đã bán: ${totalOrders}
- Danh sách món bán chạy nhất (Top list):
${(topProducts || []).map((p, i) => `${i+1}. ${p.title} (Bán: ${p.qty} - Thu: ${p.rev})`).join('\n')}`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                { role: 'user', parts: [{ text: dataContext }] }
            ],
            config: {
                systemInstruction: systemPrompt,
                temperature: 0.7
            }
        });

        console.log("Gemini full response:", JSON.stringify(response, null, 2));
        res.json({ success: true, insight: response.text });
    } catch (error) {
        console.error('Error generating AI Insights:', error);
        res.status(500).json({ success: false, message: 'Lỗi phân tích AI' });
    }
};



