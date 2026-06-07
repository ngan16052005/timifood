const { sql, connectDB } = require('../config/db');
const { createNotification } = require('../helpers/notification');
const { createLog } = require('../helpers/logger');
const { sendOrderEmail, sendReplyEmail } = require('../helpers/email');
const webpush = require('web-push');

let pool;
connectDB().then(p => pool = p).catch(console.error);

const notificationController = {
    getNotifications: async (req, res) => {
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
},

    putNotificationsIdRead: async (req, res) => {
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
            .input('id', sql.UniqueIdentifier, id)
            .input('userId', sql.NVarChar, userId)
            .query(query);
        res.json({ success: true });
    } catch (err) {
        console.error("Mark notification read error:", err);
        res.status(500).json({ message: 'Lỗi khi cập nhật thông báo' });
    }
},

    putNotificationsReadAll: async (req, res) => {
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
},

    deleteNotificationsId: async (req, res) => {
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
            .input('id', sql.UniqueIdentifier, id)
            .input('userId', sql.NVarChar, userId)
            .query(query);
        res.json({ success: true });
    } catch (err) {
        console.error("Delete notification error:", err);
        res.status(500).json({ message: 'Lỗi khi xóa thông báo' });
    }
},

    deleteNotifications: async (req, res) => {
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
}
};

module.exports = notificationController;
