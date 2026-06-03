const nodemailer = require('nodemailer');
const dns = require('dns');

// We will resolve smtp.gmail.com to an IPv4 address manually
let transporter = null;

dns.resolve4('smtp.gmail.com', (err, addresses) => {
    if (err || !addresses || addresses.length === 0) {
        console.error('Failed to resolve smtp.gmail.com IPv4', err);
        return;
    }
    const ipv4 = addresses[0];
    console.log(`[Email] Resolved smtp.gmail.com to IPv4: ${ipv4}`);
    
    transporter = nodemailer.createTransport({
        host: ipv4, // Use explicit IPv4 address
        port: 587,
        secure: false, // true for 465, false for other ports (will use STARTTLS)
        tls: {
            servername: 'smtp.gmail.com' // Crucial for TLS certificate validation
        },
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS ? process.env.EMAIL_PASS.replace(/\s+/g, '') : undefined
        },
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 5000
    });

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        transporter.verify((error, success) => {
            if (error) {
                console.error("[Email] Nodemailer transporter verification failed:", error.message);
            } else {
                console.log("[Email] Nodemailer transporter connection established successfully and ready.");
            }
        });
    } else {
        console.warn("[Email] Nodemailer skipping validation: No credentials provided in environment.");
    }
});

async function sendOrderEmail(orderId, customerEmail, statusName, orderDetails, retries = 3) {
    if (!transporter) {
        console.error("[Email] Transporter not ready (DNS resolution failed)");
        return;
    }
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

async function sendContactEmail(name, email, subject, message) {
    console.log(`[Email] Sending contact message from ${name} (${email})`);
    
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn("[Email] Skipping contact email send: Missing credentials");
        return;
    }

    const mailOptions = {
        from: process.env.MAIL_FROM || process.env.EMAIL_USER,
        to: process.env.EMAIL_USER, // Send to admin email
        replyTo: email,
        subject: `[Liên Hệ Mới] ${subject}`,
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; max-width: 600px; border-radius: 10px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #B5292F; margin: 0;">TiMi Food - Liên Hệ Mới</h1>
                </div>
                <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <p><strong>Người gửi:</strong> ${name}</p>
                    <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
                    <p><strong>Tiêu đề:</strong> ${subject}</p>
                </div>
                <div style="border-top: 1px solid #eee; padding-top: 20px;">
                    <h3 style="color: #333; font-size: 16px;">Nội dung tin nhắn:</h3>
                    <p style="white-space: pre-wrap; line-height: 1.6; color: #444;">${message}</p>
                </div>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`[Email] Contact email sent successfully`);
    } catch (error) {
        console.error(`[Email] Failed to send contact email:`, error.message);
    }
}

async function sendReplyEmail(toEmail, originalSubject, replyMessage) {
    console.log(`[Email] Sending reply email to ${toEmail}`);
    
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn("[Email] Skipping reply email send: Missing credentials");
        return;
    }

    if (!transporter) {
        console.error("[Email] Transporter not ready (DNS resolution failed)");
        return;
    }

    const mailOptions = {
        from: `"TiMi Food" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: `Phản hồi: ${originalSubject}`,
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; max-width: 600px; border-radius: 10px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #B5292F; margin: 0;">TiMi Food</h1>
                    <p style="color: #666; font-size: 14px;">Bộ phận Hỗ trợ Khách hàng</p>
                </div>
                <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h2 style="color: #333; font-size: 18px; margin-top: 0;">Phản hồi cho yêu cầu của bạn</h2>
                    <p style="white-space: pre-wrap; line-height: 1.6; color: #444;">${replyMessage}</p>
                </div>
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #999; font-size: 12px;">
                    <p>Nếu bạn có thêm bất kỳ câu hỏi nào, xin vui lòng phản hồi lại email này.</p>
                    <p>&copy; 2026 TiMi Food. All rights reserved.</p>
                </div>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`[Email] Reply email sent successfully`);
    } catch (error) {
        console.error(`[Email] Failed to send reply email:`, error.message);
    }
}

module.exports = { transporter, sendOrderEmail, sendContactEmail, sendReplyEmail };
