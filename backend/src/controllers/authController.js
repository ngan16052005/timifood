const { sql, connectDB } = require('../config/db');
let pool;
connectDB().then(p => pool = p).catch(console.error);
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { transporter } = require('../helpers/email');
const twilio = require('twilio');
const axios = require('axios');
const { OAuth2Client } = require('google-auth-library');
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const { SECRET_KEY } = require('../middleware/auth');

const otpStore = new Map();

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const result = await pool.request()
            .input('phone', sql.NVarChar, username)
            .query('SELECT * FROM Users WHERE phone=@phone');

        if (result.recordset.length > 0) {
            const user = result.recordset[0];

            let isMatch = false;
            try {
                isMatch = await bcrypt.compare(password, user.password);
            } catch (e) {
                // Not a hash, fallback to plain text comparison
            }

            // Support old plain text passwords and migrate them on the fly
            if (!isMatch && user.password === password) {
                console.log(`Migrating password for user: ${user.phone}`);
                const hashedPassword = await bcrypt.hash(password, 10);
                await pool.request()
                    .input('phone', sql.NVarChar, user.phone)
                    .input('password', sql.NVarChar, hashedPassword)
                    .query('UPDATE Users SET password=@password WHERE phone=@phone');
                isMatch = true;
            }

            if (isMatch) {
                // Create JWT Token
                const token = jwt.sign({ id: user.id, phone: user.phone, userType: user.userType },
                    SECRET_KEY,
                    { expiresIn: '24h' }
                );

                // Fetch cart items
                const cartResult = await pool.request()
                    .input('userId', sql.UniqueIdentifier, user.id)
                    .query(`
                        SELECT c.quantity as soluong, c.note as ghichu, p.* 
                        FROM CartItems c
                        JOIN Products p ON c.productId = p.id
                        WHERE c.userId = @userId
                    `);

                // Remove sensitive info
                const { password: _, cartData: __, ...safeUser } = user;
                safeUser.join = user.joinDate;
                safeUser.cart = cartResult.recordset;
                
                // Set HttpOnly cookie
                res.cookie('token', token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'strict',
                    maxAge: 24 * 60 * 60 * 1000 // 24 hours
                });
                
                res.json({ success: true, user: safeUser, token }); // Kept token in JSON for backward compatibility with mobile app
            } else {
                res.status(401).json({ success: false, message: 'Số điện thoại hoặc mật khẩu không đúng' });
            }
        } else {
            res.status(401).json({ success: false, message: 'Số điện thoại hoặc mật khẩu không đúng' });
        }
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ success: false, message: 'Database error' });
    }
};

exports.auth_google = async (req, res) => {
    try {
        const { credential } = req.body;
        if (!credential) return res.status(400).json({ success: false, message: 'Missing Google credential' });

        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const { email, name, picture } = payload;

        // Check if user exists by email
        const result = await pool.request()
            .input('email', sql.NVarChar, email)
            .query('SELECT * FROM Users WHERE email=@email');

        if (result.recordset.length > 0) {
            // User exists, log them in
            const user = result.recordset[0];
            const token = jwt.sign({ id: user.id, phone: user.phone, userType: user.userType },
                SECRET_KEY,
                { expiresIn: '24h' }
            );
            const cartResult = await pool.request()
                .input('userId', sql.UniqueIdentifier, user.id)
                .query(`
                    SELECT c.quantity as soluong, c.note as ghichu, p.* 
                    FROM CartItems c
                    JOIN Products p ON c.productId = p.id
                    WHERE c.userId = @userId
                `);

            const { password: _, cartData: __, ...safeUser } = user;
            safeUser.join = user.joinDate;
            safeUser.cart = cartResult.recordset;
            
            // Set HttpOnly cookie
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 24 * 60 * 60 * 1000 // 24 hours
            });
            
            res.json({ success: true, user: safeUser, token });
        } else {
            // User does not exist, ask for phone number to complete registration
            res.json({ 
                success: false, 
                status: 'require_phone', 
                message: 'Vui lòng cung cấp số điện thoại để hoàn tất đăng ký',
                googleInfo: { email, name, picture }
            });
        }
    } catch (err) {
        console.error("Google Login Error:", err);
        res.status(401).json({ success: false, message: 'Google authentication failed' });
    }
};

exports.auth_google_complete_registration = async (req, res) => {
    try {
        const { credential, phone } = req.body;
        if (!credential || !phone) return res.status(400).json({ success: false, message: 'Missing required fields' });

        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const { email, name } = payload;

        // Check if phone already exists
        const checkPhone = await pool.request()
            .input('phone', sql.NVarChar, phone)
            .query('SELECT * FROM Users WHERE phone=@phone');
        
        if (checkPhone.recordset.length > 0) {
            return res.status(400).json({ success: false, message: 'Số điện thoại này đã được đăng ký cho một tài khoản khác' });
        }

        // Generate a random strong password for Google users since they login via Google
        const randomPassword = Math.random().toString(36).slice(-10) + 'A1@';
        const hashedPassword = await bcrypt.hash(randomPassword, 10);

            const insertResult = await pool.request()
            .input('fullname', sql.NVarChar, name)
            .input('phone', sql.NVarChar, phone)
            .input('password', sql.NVarChar, hashedPassword)
            .input('address', sql.NVarChar, '')
            .input('email', sql.NVarChar, email)
            .input('status', sql.Int, 1)
            .input('userType', sql.Int, 0)
            .query('INSERT INTO Users (id, fullname, phone, password, address, email, status, userType) OUTPUT inserted.id VALUES (NEWID(), @fullname, @phone, @password, @address, @email, @status, @userType)');

        const newUserId = insertResult.recordset[0].id;

        // Create JWT Token
        const token = jwt.sign({ id: newUserId, phone: phone, userType: 0 },
            SECRET_KEY,
            { expiresIn: '24h' }
        );

        // Set HttpOnly cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000
        });

        res.status(201).json({
            success: true,
            message: 'Đăng ký thành công bằng Google',
            user: { fullname: name, phone, email, address: '', status: 1, userType: 0, cart: [] },
            token
        });
    } catch (err) {
        console.error("Google Registration Error:", err);
        res.status(500).json({ success: false, message: 'Registration failed' });
    }
};

exports.auth_facebook = async (req, res) => {
    try {
        const { accessToken } = req.body;
        if (!accessToken) return res.status(400).json({ success: false, message: 'Missing Facebook token' });

        // Verify token with Facebook Graph API
        const response = await axios.get(`https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${accessToken}`);
        const { email, name, picture } = response.data;
        const fbEmail = email || `${response.data.id}@facebook.com`; // Fallback if email is missing
        const avatarUrl = picture?.data?.url || '';

        // Check if user exists by email
        const result = await pool.request()
            .input('email', sql.NVarChar, fbEmail)
            .query('SELECT * FROM Users WHERE email=@email');

        if (result.recordset.length > 0) {
            // User exists, log them in
            const user = result.recordset[0];
            const token = jwt.sign({ id: user.id, phone: user.phone, userType: user.userType },
                SECRET_KEY,
                { expiresIn: '24h' }
            );
            const cartResult = await pool.request()
                .input('userId', sql.UniqueIdentifier, user.id)
                .query(`
                    SELECT c.quantity as soluong, c.note as ghichu, p.* 
                    FROM CartItems c
                    JOIN Products p ON c.productId = p.id
                    WHERE c.userId = @userId
                `);
            const { password: _, cartData: __, ...safeUser } = user;
            safeUser.join = user.joinDate;
            safeUser.cart = cartResult.recordset;
            
            // Set HttpOnly cookie
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 24 * 60 * 60 * 1000 // 24 hours
            });
            
            res.json({ success: true, user: safeUser, token });
        } else {
            // User does not exist, ask for phone number to complete registration
            res.json({ 
                success: false, 
                status: 'require_phone', 
                message: 'Vui lòng cung cấp số điện thoại để hoàn tất đăng ký',
                facebookInfo: { email: fbEmail, name, picture: avatarUrl }
            });
        }
    } catch (err) {
        console.error("Facebook Login Error:", err.response?.data || err.message);
        res.status(401).json({ success: false, message: 'Facebook authentication failed' });
    }
};

exports.auth_facebook_complete_registration = async (req, res) => {
    try {
        const { accessToken, phone } = req.body;
        if (!accessToken || !phone) return res.status(400).json({ success: false, message: 'Missing required fields' });

        // Verify token with Facebook Graph API
        const response = await axios.get(`https://graph.facebook.com/me?fields=id,name,email&access_token=${accessToken}`);
        const { email, name } = response.data;
        const fbEmail = email || `${response.data.id}@facebook.com`;

        // Check if phone already exists
        const checkPhone = await pool.request()
            .input('phone', sql.NVarChar, phone)
            .query('SELECT * FROM Users WHERE phone=@phone');
        
        if (checkPhone.recordset.length > 0) {
            return res.status(400).json({ success: false, message: 'Số điện thoại này đã được đăng ký cho một tài khoản khác' });
        }

        // Generate a random strong password for Facebook users
        const randomPassword = Math.random().toString(36).slice(-10) + 'A1@';
        const hashedPassword = await bcrypt.hash(randomPassword, 10);

        const insertResult = await pool.request()
            .input('fullname', sql.NVarChar, name)
            .input('phone', sql.NVarChar, phone)
            .input('password', sql.NVarChar, hashedPassword)
            .input('address', sql.NVarChar, '')
            .input('email', sql.NVarChar, fbEmail)
            .input('status', sql.Int, 1)
            .input('userType', sql.Int, 0)
            .query('INSERT INTO Users (fullname, phone, password, address, email, status, userType) OUTPUT inserted.id VALUES (@fullname, @phone, @password, @address, @email, @status, @userType)');

        const newUserId = insertResult.recordset[0].id;

        // Create JWT Token
        const token = jwt.sign({ id: newUserId, phone: phone, userType: 0 },
            SECRET_KEY,
            { expiresIn: '24h' }
        );

        // Set HttpOnly cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000
        });

        res.status(201).json({
            success: true,
            message: 'Đăng ký thành công bằng Facebook',
            user: { fullname: name, phone, email: fbEmail, address: '', status: 1, userType: 0, cart: [] },
            token
        });
    } catch (err) {
        console.error("Facebook Registration Error:", err.response?.data || err.message);
        res.status(500).json({ success: false, message: 'Registration failed' });
    }
};

exports.send_otp = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ success: false, message: 'Vui lòng nhập Email' });

        const result = await pool.request()
            .input('email', sql.NVarChar, email)
            .query('SELECT phone FROM Users WHERE email = @email');
        
        if (result.recordset.length === 0) {
            return res.status(404).json({ success: false, message: 'Email này chưa được đăng ký tài khoản' });
        }

        const phone = result.recordset[0].phone;
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiry = Date.now() + 5 * 60 * 1000; // 5 mins
        
        // Use email as key in otpStore
        otpStore.set(email, { otp, phone, expiry });

        console.log(`[OTP DEBUG] Email: ${email}, Phone: ${phone}, OTP: ${otp}`);

        // Send actual email if configured
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            const mailOptions = {
                from: process.env.MAIL_FROM || process.env.EMAIL_USER,
                to: email,
                subject: '[TiMiFood] Mã xác thực khôi phục mật khẩu',
                html: `<h3>Mã OTP của bạn là: <b style="color: #ff5e3a; font-size: 24px;">${otp}</b></h3>
                       <p>Mã này có hiệu lực trong 5 phút. Vui lòng không chia sẻ mã này cho bất kỳ ai.</p>`
            };
            try {
                await transporter.sendMail(mailOptions);
                res.json({ success: true, message: 'OTP đã được gửi về Email của bạn' });
            } catch (mailError) {
                console.error("[Email OTP] Failed to send email via SMTP:", mailError);
                // Clean up OTP from store since it wasn't successfully sent
                otpStore.delete(email);
                res.status(500).json({ 
                    success: false, 
                    message: 'Không thể gửi email chứa mã OTP. Vui lòng liên hệ quản trị viên hoặc kiểm tra cấu hình SMTP.' 
                });
            }
        } else {
            res.json({ success: true, message: 'OTP đã được tạo (Xem log server)', debug: true });
        }
    } catch (err) {
        console.error("Send OTP error:", err);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ khi xử lý mã OTP.' });
    }
};

exports.verify_otp = (req, res) => {
    const { email, otp } = req.body;
    const stored = otpStore.get(email);
    
    if (!stored || stored.otp !== otp || Date.now() > stored.expiry) {
        return res.status(400).json({ success: false, message: 'Mã OTP không đúng hoặc đã hết hạn' });
    }
    
    res.json({ success: true, message: 'Mã xác thực chính xác' });
};

exports.reset_password = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        
        // Verify OTP
        const stored = otpStore.get(email);
        if (!stored || stored.otp !== otp || Date.now() > stored.expiry) {
            return res.status(400).json({ success: false, message: 'Mã OTP không đúng hoặc đã hết hạn' });
        }

        // Backend strong password validation
        const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (!strongPasswordRegex.test(newPassword)) {
            return res.status(400).json({ success: false, message: 'Mật khẩu phải từ 8 ký tự, bao gồm chữ hoa, chữ thường và số' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        await pool.request()
            .input('phone', sql.NVarChar, stored.phone)
            .input('password', sql.NVarChar, hashedPassword)
            .query('UPDATE Users SET password = @password WHERE phone = @phone');
        
        otpStore.delete(email); // Clear OTP after success
        res.json({ success: true, message: 'Password updated successfully' });
    } catch (err) {
        console.error("Reset password error:", err);
        res.status(500).json({ success: false, message: 'Database error' });
    }
};

exports.send_otp_sms = async (req, res) => {
    try {
        const { phone } = req.body;
        if (!phone) return res.status(400).json({ success: false, message: 'Thiếu số điện thoại' });

        let formattedPhone = phone;
        if (formattedPhone.startsWith('0')) {
            formattedPhone = '+84' + formattedPhone.substring(1);
        } else if (!formattedPhone.startsWith('+')) {
            formattedPhone = '+84' + formattedPhone;
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        otpStore.set(phone, { otp, expiry: Date.now() + 60000 }); // 60s
        
        console.log(`[Twilio] OTP for ${formattedPhone}: ${otp}`);

        if (accountSid !== 'YOUR_ACCOUNT_SID') {
            const twilioClient = new twilio(accountSid, authToken);
            await twilioClient.messages.create({
                body: `TIMIFOOD: Ma OTP cua ban la ${otp}. Khong chia se ma nay cho bat ky ai.`,
                from: twilioPhone,
                to: formattedPhone
            });
        }

        res.json({ success: true, message: 'Mã OTP đã được gửi!', debug: true });
    } catch (err) {
        console.error("Lỗi gửi SMS OTP:", err);
        res.status(500).json({ success: false, message: 'Không thể gửi SMS. Hãy đảm bảo số đt đã được verify trên Twilio.' });
    }
};

exports.verify_otp_sms = async (req, res) => {
    try {
        const { phone, otp } = req.body;
        const stored = otpStore.get(phone);
        
        if (!stored || stored.otp !== otp || Date.now() > stored.expiry) {
            return res.status(400).json({ success: false, message: 'Mã OTP không đúng hoặc đã hết hạn' });
        }
        
        res.json({ success: true, message: 'Mã xác thực chính xác' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.reset_password_by_phone = async (req, res) => {
    try {
        let { phone, newPassword } = req.body;
        
        // Normalize phone (+8498 -> 098) to match database
        if (phone.startsWith('+84')) {
            phone = '0' + phone.substring(3);
        }

        // Backend strong password validation
        const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (!strongPasswordRegex.test(newPassword)) {
            return res.status(400).json({ success: false, message: 'Mật khẩu phải từ 8 ký tự, bao gồm chữ hoa, chữ thường và số' });
        }

        const checkUser = await pool.request()
            .input('phone', sql.NVarChar, phone)
            .query('SELECT * FROM Users WHERE phone=@phone');
            
        if (checkUser.recordset.length === 0) {
            return res.status(400).json({ success: false, message: 'Số điện thoại chưa được đăng ký.' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        await pool.request()
            .input('phone', sql.NVarChar, phone)
            .input('password', sql.NVarChar, hashedPassword)
            .query('UPDATE Users SET password = @password WHERE phone = @phone');
        
        otpStore.delete(phone); // Clear OTP after success
        res.json({ success: true, message: 'Password updated successfully' });
    } catch (err) {
        console.error("Reset password error:", err);
        res.status(500).json({ success: false, message: 'Database error' });
    }
};

exports.register = async (req, res) => {
    try {
        const newUser = req.body;
        const checkUser = await pool.request()
            .input('phone', sql.NVarChar, newUser.phone)
            .query('SELECT * FROM Users WHERE phone=@phone');

        if (checkUser.recordset.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Backend strong password validation
        const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (!strongPasswordRegex.test(newUser.password)) {
            return res.status(400).json({ message: 'Mật khẩu phải từ 8 ký tự, bao gồm chữ hoa, chữ thường và số' });
        }

        const hashedPassword = await bcrypt.hash(newUser.password, 10);

        const insertResult = await pool.request()
            .input('fullname', sql.NVarChar, newUser.fullname)
            .input('phone', sql.NVarChar, newUser.phone)
            .input('password', sql.NVarChar, hashedPassword)
            .input('address', sql.NVarChar, newUser.address || '')
            .input('email', sql.NVarChar, newUser.email || '')
            .input('status', sql.Int, 1)
            .input('userType', sql.Int, 0)
            .query('INSERT INTO Users (id, fullname, phone, password, address, email, status, userType) OUTPUT inserted.id VALUES (NEWID(), @fullname, @phone, @password, @address, @email, @status, @userType)');

        newUser.id = insertResult.recordset[0].id;

        // Create JWT Token for the new user
        const token = jwt.sign({ id: newUser.id, phone: newUser.phone, userType: 0 },
            SECRET_KEY,
            { expiresIn: '24h' }
        );

        // Set HttpOnly cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000
        });

        // Return user info WITHOUT password, and include an empty cart
        const { password, ...userWithoutPassword } = newUser;
        res.status(201).json({
            success: true,
            message: 'User created successfully',
            user: { ...userWithoutPassword, status: 1, userType: 0, cart: [] },
            token
        });
    } catch (err) {
        console.error("Register error:", err);
        res.status(500).json({ success: false, message: 'Error registering user' });
    }
};

exports.change_password = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin' });
        }

        const result = await pool.request()
            .input('phone', sql.NVarChar, userId)
            .query('SELECT password FROM Users WHERE phone=@phone');

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }

        const user = result.recordset[0];
        const isMatch = await bcrypt.compare(currentPassword, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Mật khẩu hiện tại không đúng' });
        }

        // Backend strong password validation
        const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (!strongPasswordRegex.test(newPassword)) {
            return res.status(400).json({ message: 'Mật khẩu mới phải từ 8 ký tự, bao gồm chữ hoa, chữ thường và số' });
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        await pool.request()
            .input('phone', sql.NVarChar, userId)
            .input('password', sql.NVarChar, hashedNewPassword)
            .query('UPDATE Users SET password=@password WHERE phone=@phone');

        res.json({ success: true, message: 'Đổi mật khẩu thành công' });
    } catch (err) {
        console.error("Change password error:", err);
        res.status(500).json({ message: 'Lỗi khi đổi mật khẩu' });
    }
};

exports.logout = async (req, res) => {
    res.cookie('token', '', { 
        httpOnly: true, 
        expires: new Date(0) 
    });
    res.json({ success: true, message: 'Đăng xuất thành công' });
};
