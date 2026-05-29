const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { loginLimiter, registerLimiter, otpLimiter, resetPasswordLimiter, changePasswordLimiter } = require('../middleware/rateLimiter');

router.post('/login', loginLimiter, authController.login);
router.post('/auth/google', loginLimiter, authController.auth_google);
router.post('/auth/google/complete-registration', registerLimiter, authController.auth_google_complete_registration);
router.post('/auth/facebook', loginLimiter, authController.auth_facebook);
router.post('/auth/facebook/complete-registration', registerLimiter, authController.auth_facebook_complete_registration);
router.post('/send-otp', otpLimiter, authController.send_otp);
router.post('/verify-otp', (req, res) => {
    const { email, otp } = req.body;
    const stored = otpStore.get(email);
    
    if (!stored || stored.otp !== otp || Date.now() > stored.expiry) {
        return res.status(400).json({ success: false, message: 'Mã OTP không đúng hoặc đã hết hạn' });
    }
    
    res.json({ success: true, message: 'Mã xác thực chính xác' });
});

// Reset Password with OTP
app.post('/api/reset-password', resetPasswordLimiter, authController.verify_otp);
router.post('/send-otp-sms', authController.send_otp_sms);
router.post('/verify-otp-sms', authController.verify_otp_sms);
router.post('/reset-password-by-phone', resetPasswordLimiter, authController.reset_password_by_phone);
router.post('/register', registerLimiter, authController.register);
router.post('/change-password', authenticateToken, changePasswordLimiter, authController.change_password);

module.exports = router;
