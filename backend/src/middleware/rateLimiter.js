const rateLimit = require('express-rate-limit');

// Global Limiter - Ngăn chặn DDoS cơ bản (ví dụ 1000 request / 1 phút)
const globalLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 phút
    max: 1000, // Limit each IP to 1000 requests per `window`
    message: { success: false, message: 'Too many requests from this IP, please try again after a minute' },
    standardHeaders: true,
    legacyHeaders: false,
});

const loginLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 phút
    max: 10,
    message: { success: false, message: 'Bạn đã đăng nhập quá nhiều lần. Vui lòng thử lại sau 5 phút.' }
});

const otpLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 3,
    message: { success: false, message: 'Bạn đã yêu cầu gửi mã OTP quá nhiều lần. Vui lòng thử lại sau 5 phút.' }
});

const resetPasswordLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 5,
    message: { success: false, message: 'Bạn đã thực hiện khôi phục mật khẩu quá nhiều lần. Vui lòng thử lại sau 10 phút.' }
});

const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 giờ
    max: 10,
    message: { success: false, message: 'Bạn đã đăng ký quá nhiều tài khoản từ địa chỉ IP này. Vui lòng thử lại sau 1 giờ.' }
});

const changePasswordLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 5,
    message: { success: false, message: 'Bạn đã đổi mật khẩu quá nhiều lần. Vui lòng thử lại sau 10 phút.' }
});

const orderLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 phút
    max: 30, // Tối đa 30 đơn hàng từ 1 IP trong 15p
    message: { success: false, message: 'Bạn đã tạo quá nhiều đơn hàng. Vui lòng thử lại sau 15 phút.' }
});

module.exports = { globalLimiter, loginLimiter, otpLimiter, resetPasswordLimiter, registerLimiter, changePasswordLimiter, orderLimiter };
