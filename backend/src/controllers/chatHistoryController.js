const { sql, connectDB } = require('../config/db');
const { createNotification } = require('../helpers/notification');
const { createLog } = require('../helpers/logger');
const { sendOrderEmail, sendReplyEmail } = require('../helpers/email');
const webpush = require('web-push');

let pool;
connectDB().then(p => pool = p).catch(console.error);

const chatHistoryController = {
    getChatHistory: async (req, res) => {
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
},

    getChatHistorySessionid: async (req, res) => {
    try {
        const result = await pool.request()
            .input('sessionId', sql.UniqueIdentifier, req.params.sessionId)
            .query('SELECT * FROM ChatMessages WHERE sessionId = @sessionId ORDER BY timestamp ASC');
        res.json(result.recordset);
    } catch (error) {
        console.error('Error fetching chat messages:', error);
        res.status(500).json({ success: false, message: 'Lỗi lấy tin nhắn chat' });
    }
},

    deleteChatHistorySessionid: async (req, res) => {
    try {
        await pool.request()
            .input('sessionId', sql.UniqueIdentifier, req.params.sessionId)
            .query('DELETE FROM ChatSessions WHERE id = @sessionId'); // Cascade will delete messages
        res.json({ success: true, message: 'Đã xóa phiên chat' });
    } catch (error) {
        console.error('Error deleting chat session:', error);
        res.status(500).json({ success: false, message: 'Lỗi xóa phiên chat' });
    }
}
};

module.exports = chatHistoryController;
