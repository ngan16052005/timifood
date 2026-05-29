const { sql, connectDB } = require('../config/db');
const { createNotification } = require('../helpers/notification');
const { createLog } = require('../helpers/logger');
const { sendOrderEmail, sendReplyEmail } = require('../helpers/email');
const webpush = require('web-push');

let pool;
connectDB().then(p => pool = p).catch(console.error);

const livechatController = {
    getLivechats: async (req, res) => {
    try {
        const isStaff = req.user.userType === 1 || req.user.userType === 2;
        if (!isStaff) return res.status(403).json({ message: 'Quyền truy cập bị từ chối!' });
        res.json(req.app.locals.getActiveChatsSummary());
    } catch (err) {
        console.error("Fetch livechats API error:", err);
        res.status(500).json({ message: 'Lỗi khi tải các phiên chat!' });
    }
}
};

module.exports = livechatController;
