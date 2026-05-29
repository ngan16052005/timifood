const { sql, connectDB } = require('../config/db');
const { createNotification } = require('../helpers/notification');
const { createLog } = require('../helpers/logger');
const { sendOrderEmail, sendReplyEmail } = require('../helpers/email');
const webpush = require('web-push');
const { GoogleGenAI } = require('@google/genai');
const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

let pool;
connectDB().then(p => pool = p).catch(console.error);

const copilotController = {
    postPushSubscribe: async (req, res) => {
    try {
        const { subscription } = req.body;
        const userId = req.user.id;
        
        if (!subscription || !subscription.endpoint) {
            return res.status(400).json({ success: false, message: 'Invalid subscription object' });
        }

        // Kiểm tra xem subscription endpoint đã tồn tại chưa
        const checkSub = await pool.request()
            .input('endpoint', sql.NVarChar, subscription.endpoint)
            .query('SELECT id FROM PushSubscriptions WHERE endpoint = @endpoint');
            
        if (checkSub.recordset.length === 0) {
            await pool.request()
                .input('userId', sql.UniqueIdentifier, userId)
                .input('endpoint', sql.NVarChar, subscription.endpoint)
                .input('p256dh', sql.NVarChar, subscription.keys.p256dh)
                .input('auth', sql.NVarChar, subscription.keys.auth)
                .query(`
                    INSERT INTO PushSubscriptions (userId, endpoint, p256dh, auth)
                    VALUES (@userId, @endpoint, @p256dh, @auth)
                `);
        }
        res.status(201).json({ success: true, message: 'Subscribed to push notifications' });
    } catch (error) {
        console.error('Lỗi khi lưu push subscription:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
},

    postChatAi: async (req, res) => {
    try {
        if (!ai) {
            return res.status(503).json({ success: false, message: 'Tính năng AI chưa được cấu hình. Vui lòng thử lại sau.' });
        }
        
        const { message, history } = req.body;
        if (!message) return res.status(400).json({ success: false, message: 'Thiếu tin nhắn' });

        // Lấy danh sách sản phẩm để AI tư vấn
        const productsResult = await pool.request().query('SELECT id, title, price, stock, category FROM Products');
        const menuText = productsResult.recordset.map(p => `- ${p.title} (Mã: ${p.id}, Giá: ${p.price}đ, Trạng thái: ${p.stock > 0 ? 'Còn hàng' : 'Hết hàng'}, Danh mục: ${p.category})`).join('\n');

        const systemPrompt = `Bạn tên là TiMi Assistant, trợ lý ảo thông minh và thân thiện của nhà hàng TiMiFood.
Nhiệm vụ của bạn là tư vấn cho khách hàng dựa trên Menu hiện tại của nhà hàng. Luôn xưng hô là "mình/TiMi" và gọi khách là "bạn", giọng điệu vui vẻ, lễ phép.
Nếu khách hỏi món không có trong Menu, hãy khéo léo giới thiệu món khác tương tự có sẵn.
Đặc biệt: Nếu bạn đang tư vấn/gợi ý một món ăn cụ thể có trong Menu, BẮT BUỘC PHẢI THÊM mã sản phẩm vào cuối câu trả lời theo đúng định dạng sau: [SUGGEST:MãSảnPhẩm] (Ví dụ: [SUGGEST:SP001]). Nếu không gợi ý món cụ thể, không được ghi thẻ này.

Thông tin về TiMiFood:
- Địa chỉ: Cơ sở 1 tại 165 Trần Quốc Chẩn, Hải Phòng. Cơ sở 2 tại 76 Nguyễn Thị Duệ, Hải Phòng.
- Giờ mở cửa: 7:00 - 22:00 tất cả các ngày trong tuần.
- Phí giao hàng: Freeship cho đơn từ 150k (bán kính 5km). Dưới 150k phí từ 15k-25k.
- Mã giảm giá: TIMI50 (Giảm 50% tối đa 50k), HELLOTIMI (Giảm 20k cho đơn từ 100k), FREESHIP (Miễn phí ship tối đa 30k cho đơn từ 150k). Nhập mã ở bước thanh toán.

Dưới đây là Menu nhà hàng hiện tại:
${menuText}`;

        // Format history for Gemini
        let rawContents = (history || []).map(msg => ({
            role: msg.role === 'customer' ? 'user' : 'model',
            parts: [{ text: msg.text }]
        }));

        // Thêm tin nhắn hiện tại
        rawContents.push({ role: 'user', parts: [{ text: message }] });

        // Đảm bảo các role xen kẽ nhau nghiêm ngặt (user -> model -> user)
        let contents = [];
        for (let msg of rawContents) {
            if (contents.length === 0 || contents[contents.length - 1].role !== msg.role) {
                contents.push(msg);
            } else {
                // Nếu trùng role, nối nội dung lại với nhau
                let lastMsg = contents[contents.length - 1];
                if (!lastMsg.parts[0].text.endsWith(msg.parts[0].text)) {
                    lastMsg.parts[0].text += "\n" + msg.parts[0].text;
                }
            }
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: contents,
            config: {
                systemInstruction: systemPrompt,
                temperature: 0.7,
            }
        });

        let replyText = response.text;
        let suggestedProduct = null;

        // Trích xuất thẻ [SUGGEST:MãSảnPhẩm] nếu có
        const suggestMatch = replyText.match(/\[SUGGEST:([aZAZ0-9_]+)\]/);
        if (suggestMatch) {
            suggestedProduct = suggestMatch[1];
            replyText = replyText.replace(/\[SUGGEST:[aZAZ0-9_]+\]/g, '').trim();
        }

        res.json({ 
            success: true, 
            reply: replyText,
            suggestedProduct: suggestedProduct
        });
    } catch (error) {
        console.error('Lỗi Gemini AI:', error);
        res.status(500).json({ success: false, message: 'Trợ lý AI đang bận, vui lòng thử lại sau.' });
    }
}
};

module.exports = copilotController;
