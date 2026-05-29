const { sql, connectDB } = require('../config/db');
let pool;
connectDB().then(p => pool = p).catch(console.error);

exports.getInventoryStats = async (req, res) => {
    try {
        const result = await pool.request().query(`
            SELECT TOP 10 p.title, p.stock, p.minStock, SUM(od.quantity) as soldQuantity 
            FROM OrderDetails od
            JOIN Orders o ON od.orderId = o.id
            JOIN Products p ON od.productId = p.id
            WHERE o.orderDate >= DATEADD(day, -7, GETDATE())
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
            SELECT MONTH(CAST(o.orderDate AS DATE)) as month, SUM(o.totalPrice) as revenue
            FROM Orders o
            WHERE o.status = 2 
            AND YEAR(CAST(o.orderDate AS DATE)) = YEAR(GETDATE())
            GROUP BY MONTH(CAST(o.orderDate AS DATE))
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
            .input('id', sql.Int, id)
            .query('DELETE FROM Reviews WHERE id = @id');
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
            SELECT sh.*, sh.createdAt as importDate, p.title as productTitle 
            FROM StockHistory sh 
            JOIN Products p ON sh.productId = p.id 
            ORDER BY sh.createdAt DESC
        `);
        res.json(result.recordset);
    } catch (err) {
        console.error("Fetch stock history error:", err);
        res.status(500).json({ message: 'Error fetching stock history' });
    }
};

exports.getAdmin_logs = async (req, res) => {
    try {
        if (!pool) return res.status(500).json({ message: 'Database pool not initialized' });
        const result = await pool.request()
            .query('SELECT * FROM SystemLogs ORDER BY createdAt DESC');
        res.json(result.recordset);
    } catch (err) {
        console.error("Get logs error:", err);
        res.status(500).json({ message: 'Error fetching system logs' });
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
                .query('INSERT INTO StockHistory (productId, action, quantity, note, createdBy, createdAt) VALUES (@productId, @action, @quantity, @note, @createdBy, GETDATE())');

            // 2. Update Product stock
            await transaction.request()
                .input('productId', sql.UniqueIdentifier, productId)
                .input('quantity', sql.Int, quantity)
                .query('UPDATE Products SET stock = ISNULL(stock, 0) + @quantity WHERE id = @productId');

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

