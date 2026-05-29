const { sql, connectDB } = require('../config/db');
const { createNotification } = require('../helpers/notification');
const { createLog } = require('../helpers/logger');
const { sendOrderEmail, sendReplyEmail } = require('../helpers/email');
const webpush = require('web-push');

let pool;
connectDB().then(p => pool = p).catch(console.error);

const reviewController = {
    getProductsIdReviews: async (req, res) => {
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
},

    postReviews: async (req, res) => {
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
}
};

module.exports = reviewController;
