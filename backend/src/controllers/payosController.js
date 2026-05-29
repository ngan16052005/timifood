const { sql, connectDB } = require('../config/db');
const { createNotification } = require('../helpers/notification');
const { createLog } = require('../helpers/logger');
const { sendOrderEmail, sendReplyEmail } = require('../helpers/email');
const webpush = require('web-push');
const PayOS = require('@payos/node');
const payos = (process.env.PAYOS_CLIENT_ID && process.env.PAYOS_API_KEY && process.env.PAYOS_CHECKSUM_KEY) ? new PayOS(process.env.PAYOS_CLIENT_ID, process.env.PAYOS_API_KEY, process.env.PAYOS_CHECKSUM_KEY) : null;

let pool;
connectDB().then(p => pool = p).catch(console.error);

const payosController = {
    postPayosCreatePaymentLink: async (req, res) => {
    try {
        const { orderId, amount, description } = req.body;
        
        if (!orderId || !amount) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin đơn hàng hoặc số tiền' });
        }

        // PayOS orderCode must be an integer (max 2^53 - 1)
        // Extract number from DH001 -> 1
        const orderCode = parseInt(orderId.replace(/\D/g, '')) || Math.floor(Date.now() / 1000);
        
        // Use client's origin or standard localhost as fallback
        const clientOrigin = req.headers.origin || `http://localhost:${process.env.PORT || 3500}`;
        
        // Clean description: PayOS only accepts alphanumeric and spaces, no accents
        const cleanDesc = (description || `TiMiFood ${orderId}`)
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^aZAZ0-9 ]/g, "")
            .substring(0, 25);

        const paymentData = {
            orderCode: orderCode,
            amount: Math.round(amount),
            description: cleanDesc,
            cancelUrl: `${clientOrigin}/checkoutCancel.html?orderId=${orderId}`,
            returnUrl: `${clientOrigin}/checkoutSuccess.html?orderId=${orderId}`
        };

        if (!payos) {
            console.warn("[PayOS] SDK not initialized due to missing keys in .env. Returning warning.");
            return res.status(400).json({
                success: false,
                isMock: true,
                message: 'PayOS chưa được cấu hình. Vui lòng thêm PAYOS_CLIENT_ID, PAYOS_API_KEY, PAYOS_CHECKSUM_KEY vào tệp .env.'
            });
        }

        const paymentLinkResponse = await payos.createPaymentLink(paymentData);
        
        res.json({
            success: true,
            checkoutUrl: paymentLinkResponse.checkoutUrl,
            qrCode: paymentLinkResponse.qrCode
        });
    } catch (error) {
        console.error("PayOS Create Payment Link Error:", error);
        res.status(500).json({ success: false, message: error.message || 'Lỗi khi tạo liên kết thanh toán PayOS' });
    }
},

    postPayosWebhook: async (req, res) => {
    try {
        const webhookData = req.body;
        console.log("[PayOS Webhook] Received webhook payload:", JSON.stringify(webhookData, null, 2));

        if (!payos) {
            console.warn("[PayOS Webhook] PayOS SDK not initialized. Webhook cannot verify signature.");
            return res.status(400).json({ success: false, message: 'PayOS not configured on server' });
        }

        // Verify webhook signature (PayOS SDK handles this)
        let verifiedData;
        try {
            verifiedData = payos.verifyPaymentWebhookData(webhookData);
            console.log("[PayOS Webhook] Signature verified successfully:", verifiedData);
        } catch (err) {
            console.error("[PayOS Webhook] Signature verification failed:", err);
            return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
        }

        // PayOS verifiedData contains success and data attributes
        const orderCode = verifiedData.orderCode;
        
        if (orderCode) {
            // Map orderCode back to order ID
            const orderIdStr = 'DH' + orderCode.toString().padStart(3, '0');
            console.log(`[PayOS Webhook] Processing payment success for order: ${orderIdStr}`);

            // Fetch order from DB
            const orderResult = await pool.request()
                .input('id', sql.NVarChar, orderIdStr)
                .query('SELECT status, userId, totalPrice, receiverAddress, receiverPhone, note FROM Orders WHERE id = @id');
            
            if (orderResult.recordset.length > 0) {
                const order = orderResult.recordset[0];
                
                // Check if already paid to avoid double processing
                if (order.note && order.note.includes('[Đã thanh toán qua PayOS]')) {
                    console.log(`[PayOS Webhook] Order ${orderIdStr} was already marked as paid.`);
                    return res.json({ success: true, message: 'Already processed' });
                }

                const newNote = `[Đã thanh toán qua PayOS] ${order.note || ''}`.substring(0, 1000);
                
                // Update Order Note and change status to 1 (Đang giao)
                await pool.request()
                    .input('id', sql.NVarChar, orderIdStr)
                    .input('note', sql.NVarChar, newNote)
                    .query('UPDATE Orders SET status = 1, note = @note WHERE id = @id');
                
                console.log(`[PayOS Webhook] Order ${orderIdStr} marked as Paid/Delivering.`);

                // System Notification for customer
                await createNotification(
                    order.userId, 
                    "Thanh toán thành công", 
                    `Đơn hàng #${orderIdStr} đã được thanh toán thành công qua PayOS! Nhân viên đang chuẩn bị món ăn.`, 
                    "order"
                );
                
                // System Notification for Admin/Staff
                await createNotification(
                    "ADMIN", 
                    "Thanh toán đơn hàng", 
                    `Đơn hàng #${orderIdStr} từ ${order.userId} đã được thanh toán thành công qua PayOS`, 
                    "order"
                );
                
                // Log activity
                await createLog(order.userId, 'PAYOS_PAYMENT_SUCCESS', `Thanh toán thành công ${order.totalPrice}đ cho đơn hàng #${orderIdStr}`);
                
                // Send email confirmation
                const userResult = await pool.request()
                    .input('phone', sql.NVarChar, order.userId)
                    .query('SELECT email FROM Users WHERE phone = @phone');
                
                if (userResult.recordset.length > 0 && userResult.recordset[0].email) {
                    const customerEmail = userResult.recordset[0].email;
                    sendOrderEmail(orderIdStr, customerEmail, "Đã thanh toán qua PayOS (Đang giao hàng)", {
                        totalPrice: order.totalPrice,
                        receiverAddress: order.receiverAddress,
                        receiverPhone: order.receiverPhone
                    });
                }
            } else {
                console.warn(`[PayOS Webhook] Order with ID ${orderIdStr} not found in database.`);
            }
        }

        res.json({ success: true });
    } catch (error) {
        console.error("PayOS Webhook processing error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
}
};

module.exports = payosController;
