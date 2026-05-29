const { sql, connectDB } = require('../config/db');
const { createNotification } = require('../helpers/notification');
const { createLog } = require('../helpers/logger');
const { sendOrderEmail, sendReplyEmail } = require('../helpers/email');
const webpush = require('web-push');

let pool;
connectDB().then(p => pool = p).catch(console.error);

const favoriteController = {
    getFavorites: async (req, res) => {
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
},

    postFavorites: async (req, res) => {
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
},

    deleteFavoritesProductid: async (req, res) => {
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
}
};

module.exports = favoriteController;
