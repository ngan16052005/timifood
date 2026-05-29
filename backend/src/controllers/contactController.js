const { sql, connectDB } = require('../config/db');
const { createNotification } = require('../helpers/notification');
const { createLog } = require('../helpers/logger');
const { sendOrderEmail, sendReplyEmail } = require('../helpers/email');
const webpush = require('web-push');

let pool;
connectDB().then(p => pool = p).catch(console.error);

const contactController = {
    postContact: async (req, res) => {
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
},

    getContacts: async (req, res) => {
    try {
        const result = await pool.request().query('SELECT * FROM Contacts ORDER BY createdAt DESC');
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi lấy danh sách liên hệ' });
    }
},

    putContactsIdStatus: async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        await pool.request()
            .input('id', sql.UniqueIdentifier, id)
            .input('status', sql.Int, status)
            .query('UPDATE Contacts SET status = @status WHERE id = @id');
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi cập nhật trạng thái liên hệ' });
    }
},

    postContactsIdReply: async (req, res) => {
    try {
        const { id } = req.params;
        const { replyMessage } = req.body;
        
        // 1. Get contact info
        const result = await pool.request()
            .input('id', sql.UniqueIdentifier, id)
            .query('SELECT * FROM Contacts WHERE id = @id');
            
        if (result.recordset.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy liên hệ' });
        }
        
        const contact = result.recordset[0];
        
        // 2. Send email
        await sendReplyEmail(contact.email, contact.subject, replyMessage);
        
        // 3. Update status to Replied (2)
        await pool.request()
            .input('id', sql.UniqueIdentifier, id)
            .query('UPDATE Contacts SET status = 2 WHERE id = @id');
            
        res.json({ success: true, message: 'Đã gửi phản hồi thành công' });
    } catch (error) {
        console.error('Error sending reply:', error);
        res.status(500).json({ success: false, message: 'Đã xảy ra lỗi khi gửi phản hồi' });
    }
},

    deleteContactsId: async (req, res) => {
    try {
        const { id } = req.params;
        await pool.request()
            .input('id', sql.UniqueIdentifier, id)
            .query('DELETE FROM Contacts WHERE id = @id');
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi xóa liên hệ' });
    }
}
};

module.exports = contactController;
