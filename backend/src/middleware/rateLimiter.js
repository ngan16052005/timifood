const rateLimiterStore = new Map();

const rateLimiter = (limitCount, windowMs, message) => {
    return (req, res, next) => {
        const now = Date.now();
        // Dọn dẹp bộ nhớ định kỳ (xác suất 10% mỗi request) để tránh rò rỉ bộ nhớ
        if (Math.random() < 0.1) {
            for (const [key, value] of rateLimiterStore.entries()) {
                if (now > value.resetTime) {
                    rateLimiterStore.delete(key);
                }
            }
        }

        const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const routeKey = `${ip}:${req.path}`;
        
        let clientData = rateLimiterStore.get(routeKey);
        
        if (!clientData) {
            rateLimiterStore.set(routeKey, {
                count: 1,
                resetTime: now + windowMs
            });
            return next();
        }
        
        if (now > clientData.resetTime) {
            clientData.count = 1;
            clientData.resetTime = now + windowMs;
            return next();
        }
        
        clientData.count++;
        if (clientData.count > limitCount) {
            return res.status(429).json({
                success: false,
                message: message || 'Bạn đã thực hiện quá nhiều yêu cầu. Vui lòng thử lại sau.'
            });
        }
        
        next();
    };
};

const loginLimiter = rateLimiter(10, 5 * 60 * 1000, 'Bạn đã đăng nhập quá nhiều lần. Vui lòng thử lại sau 5 phút.');
const otpLimiter = rateLimiter(3, 5 * 60 * 1000, 'Bạn đã yêu cầu gửi mã OTP quá nhiều lần. Vui lòng thử lại sau 5 phút.');
const resetPasswordLimiter = rateLimiter(5, 10 * 60 * 1000, 'Bạn đã thực hiện khôi phục mật khẩu quá nhiều lần. Vui lòng thử lại sau 10 phút.');
const registerLimiter = rateLimiter(10, 60 * 60 * 1000, 'Bạn đã đăng ký quá nhiều tài khoản từ địa chỉ IP này. Vui lòng thử lại sau 1 giờ.');
const changePasswordLimiter = rateLimiter(5, 10 * 60 * 1000, 'Bạn đã đổi mật khẩu quá nhiều lần. Vui lòng thử lại sau 10 phút.');

module.exports = { rateLimiter, loginLimiter, otpLimiter, resetPasswordLimiter, registerLimiter, changePasswordLimiter };
