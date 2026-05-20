const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

async function sendOrderEmail(orderId, customerEmail, statusName, orderDetails, retries = 3) {
    console.log(`[Email] Sending order update for #${orderId} to ${customerEmail}`);
    
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || !customerEmail || customerEmail === 'your-email@gmail.com') {
        console.warn("[Email] Skipping email send: Missing credentials or default placeholder email");
        return;
    }

    const mailOptions = {
        from: process.env.MAIL_FROM || process.env.EMAIL_USER,
        to: customerEmail,
        subject: `TiMi Food - Cập nhật đơn hàng #${orderId}`,
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; max-width: 600px; border-radius: 10px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #B5292F; margin: 0;">TiMi Food</h1>
                    <p style="color: #666; font-size: 14px;">Cảm ơn bạn đã tin tưởng dịch vụ của chúng tôi!</p>
                </div>
                <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h2 style="color: #333; font-size: 18px; margin-top: 0;">Thông báo trạng thái đơn hàng</h2>
                    <p>Chào bạn,</p>
                    <p>Đơn hàng <strong>#${orderId}</strong> của bạn đã được cập nhật trạng thái mới:</p>
                    <div style="background: #B5292F; color: white; padding: 10px 20px; display: inline-block; border-radius: 5px; font-weight: bold; font-size: 16px;">
                        ${statusName}
                    </div>
                </div>
                <div style="border-top: 1px solid #eee; padding-top: 20px;">
                    <h3 style="color: #333; font-size: 16px;">Thông tin đơn hàng:</h3>
                    <table style="width: 100%; font-size: 14px;">
                        <tr>
                            <td style="color: #666; padding: 5px 0;">Tổng thanh toán:</td>
                            <td style="text-align: right; font-weight: bold; color: #ee4d2d;">${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(orderDetails.totalPrice)}</td>
                        </tr>
                        <tr>
                            <td style="color: #666; padding: 5px 0;">Địa chỉ giao hàng:</td>
                            <td style="text-align: right;">${orderDetails.receiverAddress}</td>
                        </tr>
                        <tr>
                            <td style="color: #666; padding: 5px 0;">Số điện thoại:</td>
                            <td style="text-align: right;">${orderDetails.receiverPhone}</td>
                        </tr>
                    </table>
                </div>
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #999; font-size: 12px;">
                    <p>Đây là email tự động, vui lòng không phản hồi email này.</p>
                    <p>&copy; 2026 TiMi Food. All rights reserved.</p>
                </div>
            </div>
        `
    };

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            await transporter.sendMail(mailOptions);
            console.log(`[Email] Email sent successfully to ${customerEmail} (Attempt ${attempt}/${retries})`);
            return;
        } catch (error) {
            console.error(`[Email] Attempt ${attempt} failed to send email:`, error.message);
            if (attempt === retries) {
                console.error("[Email] All retry attempts exhausted. Failed to send order email.");
            } else {
                const backoffMs = attempt * 2000;
                console.log(`[Email] Retrying in ${backoffMs}ms...`);
                await new Promise(resolve => setTimeout(resolve, backoffMs));
            }
        }
    }
}

module.exports = { transporter, sendOrderEmail };
