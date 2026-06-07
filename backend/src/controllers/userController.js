const { sql, connectDB } = require('../config/db');
const bcrypt = require('bcryptjs');
let pool;
connectDB().then(p => pool = p).catch(console.error);

exports.getUsers = async (req, res) => {
    try {
        // Using global pool
        const result = await pool.request().query(`
            SELECT * FROM Users 
            ORDER BY (CASE WHEN userType = 1 THEN 0 WHEN userType = 2 THEN 1 ELSE 2 END) ASC, joinDate DESC
        `);
        const users = result.recordset.map(u => ({
            ...u,
            join: u.joinDate
        }));
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching users' });
    }
};

exports.getCurrentUser = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await pool.request()
            .input('id', sql.UniqueIdentifier, userId)
            .query('SELECT * FROM Users WHERE id = @id');
            
        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        const { password: _, ...userWithoutPassword } = result.recordset[0];
        res.json({ success: true, user: userWithoutPassword });
    } catch (err) {
        console.error("Get current user error:", err);
        res.status(500).json({ message: 'Error fetching current user' });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const { phone } = req.params;
        const { fullname, email, address, password, status, userType } = req.body;
        
        // Security check: Only Admin can update other users or change status/userType
        if (req.user.userType !== 1 && req.user.phone !== phone) {
            return res.status(403).json({ message: 'Bạn không có quyền cập nhật thông tin này' });
        }

        // If not admin, force these to remain unchanged (or use current values)
        let finalStatus = status;
        let finalUserType = userType;
        if (req.user.userType !== 1) {
            // Regular users cannot change their own status or type
            const currentUser = await pool.request()
                .input('phone', sql.NVarChar, phone)
                .query('SELECT status, userType, password FROM Users WHERE phone=@phone');
            if (currentUser.recordset.length > 0) {
                finalStatus = currentUser.recordset[0].status;
                finalUserType = currentUser.recordset[0].userType;
            }
        }
        
        // Hash password if it's not already hashed
        let finalPassword = password;
        if (password && !password.startsWith('$2')) {
            const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
            if (!strongPasswordRegex.test(password)) {
                return res.status(400).json({ message: 'Mật khẩu phải từ 8 ký tự, bao gồm chữ hoa, chữ thường và số' });
            }
            finalPassword = await bcrypt.hash(password, 10);
        } else if (!password) {
            // If password is not provided, keep current password
            const currentUser = await pool.request()
                .input('phone', sql.NVarChar, phone)
                .query('SELECT password FROM Users WHERE phone=@phone');
            if (currentUser.recordset.length > 0) {
                finalPassword = currentUser.recordset[0].password;
            }
        }

        await pool.request()
            .input('phone', sql.NVarChar, phone)
            .input('fullname', sql.NVarChar, fullname)
            .input('email', sql.NVarChar, email || '')
            .input('address', sql.NVarChar, address || '')
            .input('password', sql.NVarChar, finalPassword)
            .input('status', sql.Int, finalStatus)
            .input('userType', sql.Int, finalUserType)
            .query('UPDATE Users SET fullname = @fullname, email = @email, address = @address, password = @password, status = @status, userType = @userType WHERE phone = @phone');

        // Fetch and return the updated user (without password)
        const updatedUserResult = await pool.request()
            .input('phone', sql.NVarChar, phone)
            .query('SELECT * FROM Users WHERE phone = @phone');
        
        const { password: _, ...userWithoutPassword } = updatedUserResult.recordset[0];
        
        if (req.app.locals.createLog && req.user) {
            await req.app.locals.createLog(req.user.id, 'UPDATE_USER', `Cập nhật thông tin tài khoản: ${phone}`);
        }
        
        res.json({ success: true, message: 'Cập nhật thành công', user: userWithoutPassword });
    } catch (error) {
        console.error("Update user error:", error);
        res.status(500).json({ message: 'Lỗi server khi cập nhật tài khoản' });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { phone } = req.params;
        await pool.request()
            .input('phone', sql.NVarChar, phone)
            .query('DELETE FROM Users WHERE phone=@phone');
        await req.app.locals.createLog(req.user.id, 'DELETE_USER', `Xóa tài khoản: ${phone}`);
        res.json({ message: 'User deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting user' });
    }
};

exports.redeemVoucher = async (req, res) => {
    try {
        const { cost, code, discountType, discountValue, minOrder } = req.body;
        const userId = req.user.id;
        
        // Use global pool
        const userResult = await pool.request()
            .input('id', sql.UniqueIdentifier, userId)
            .query('SELECT points, phone FROM Users WHERE id = @id');
            
        if (userResult.recordset.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        const userPoints = userResult.recordset[0].points || 0;
        
        if (userPoints < cost) {
            return res.status(400).json({ message: 'Not enough points' });
        }
        
        // Deduct points
        await pool.request()
            .input('id', sql.UniqueIdentifier, userId)
            .input('cost', sql.Int, cost)
            .query('UPDATE Users SET points = points - @cost WHERE id = @id');
            
        // Insert into Vouchers
        const maxDiscount = 0;
        // 30 days from now
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30);
        
        await pool.request()
            .input('code', sql.NVarChar, code)
            .input('discountValue', sql.Int, discountValue)
            .input('discountType', sql.NVarChar, discountType.toString())
            .input('minOrder', sql.Int, minOrder)
            .input('maxDiscount', sql.Int, maxDiscount)
            .input('expiryDate', sql.DateTime, expiryDate)
            .input('userId', sql.UniqueIdentifier, userId)
            .query(`INSERT INTO Vouchers (code, description, discountType, discountValue, minOrderValue, maxDiscount, startDate, endDate, usageLimit, usedCount, status, userId) 
                    VALUES (@code, 'Loyalty Reward', @discountType, @discountValue, @minOrder, @maxDiscount, GETUTCDATE(), @expiryDate, 1, 0, 1, @userId)`);
                    
        // Fetch updated points
        const updatedUser = await pool.request()
            .input('id2', sql.UniqueIdentifier, userId)
            .query('SELECT points FROM Users WHERE id = @id2');
        const newPoints = updatedUser.recordset[0]?.points || 0;
        
        res.json({ success: true, message: 'Voucher redeemed successfully', newPoints });
    } catch (error) {
        console.error('Redeem error:', error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};
