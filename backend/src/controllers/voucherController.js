const { sql, connectDB } = require('../config/db');
let pool;
connectDB().then(p => pool = p).catch(console.error);

exports.getVouchers = async (req, res) => {
    try {
        // Using global pool
        const result = await pool.request().query('SELECT * FROM Vouchers ORDER BY endDate DESC');
        const vouchers = result.recordset.map(v => ({
            ...v,
            minOrder: v.minOrderValue,
            expiryDate: v.endDate
        }));
        res.json(vouchers);
    } catch (error) {
        console.error("Get vouchers error:", error);
        res.status(500).json({ message: 'Lỗi server khi lấy danh sách voucher' });
    }
};

exports.getActiveVouchers = async (req, res) => {
    try {
        let query = 'SELECT * FROM Vouchers WHERE status = 1 AND CAST(endDate AS DATE) >= CAST(GETUTCDATE() AS DATE) AND (userId IS NULL';
        const request = pool.request();
        if (req.user) {
            query += ' OR userId = @userId';
            request.input('userId', sql.UniqueIdentifier, req.user.id);
        }
        query += ') ORDER BY endDate DESC';
        const result = await request.query(query);
        const vouchers = result.recordset.map(v => ({
            ...v,
            minOrder: v.minOrderValue,
            expiryDate: v.endDate
        }));
        res.json(vouchers);
    } catch (error) {
        console.error("Get active vouchers error:", error);
        res.status(500).json({ message: 'Lỗi server khi lấy danh sách voucher' });
    }
};

exports.getVoucherByCode = async (req, res) => {
    try {
        const { code } = req.params;
        const request = pool.request().input('code', sql.NVarChar, code);
        
        let query = 'SELECT * FROM Vouchers WHERE code = @code AND status = 1 AND CAST(endDate AS DATE) >= CAST(GETUTCDATE() AS DATE) AND (userId IS NULL';
        if (req.user) {
            query += ' OR userId = @userId';
            request.input('userId', sql.UniqueIdentifier, req.user.id);
        }
        query += ')';

        const result = await request.query(query);

        if (result.recordset && result.recordset.length > 0) {
            const voucher = result.recordset[0];
            voucher.minOrder = voucher.minOrderValue;
            res.json({ success: true, voucher: voucher });
        } else {
            res.json({ success: false, message: 'Mã giảm giá không tồn tại hoặc đã hết hạn' });
        }
    } catch (error) {
        console.error("Check voucher error:", error);
        res.status(500).json({ message: 'Lỗi server khi kiểm tra voucher' });
    }
};

exports.createVoucher = async (req, res) => {
    try {
        const { code, discountValue, discountType, minOrder, maxDiscount, expiryDate } = req.body;
        // Using global pool
        await pool.request()
            .input('code', sql.NVarChar, code)
            .input('discountValue', sql.Int, discountValue)
            .input('discountType', sql.NVarChar, discountType.toString())
            .input('minOrder', sql.Int, minOrder)
            .input('maxDiscount', sql.Int, maxDiscount)
            .input('expiryDate', sql.DateTime, expiryDate)
            .query(`INSERT INTO Vouchers (code, description, discountType, discountValue, minOrderValue, maxDiscount, startDate, endDate, usageLimit, usedCount, status) 
                    VALUES (@code, '', @discountType, @discountValue, @minOrder, @maxDiscount, GETUTCDATE(), @expiryDate, 1000, 0, 1)`);
        await req.app.locals.createLog(req.user.id, 'ADD_VOUCHER', `Tạo mã giảm giá mới: ${code}`);
        res.json({ success: true, message: 'Tạo mã giảm giá thành công' });
    } catch (error) {
        console.error("Create voucher error:", error);
        if (error.number === 2627) { // SQL Server primary key violation
            res.status(400).json({ message: 'Mã giảm giá này đã tồn tại!' });
        } else {
            res.status(500).json({ message: 'Lỗi server: ' + error.message });
        }
    }
};

exports.updateVoucher = async (req, res) => {
    try {
        const { code } = req.params;
        const { status } = req.body;
        // Using global pool
        await pool.request()
            .input('code', sql.NVarChar, code)
            .input('status', sql.Int, status)
            .query('UPDATE Vouchers SET status = @status WHERE code = @code');
        await req.app.locals.createLog(req.user.id, 'UPDATE_VOUCHER', `Cập nhật trạng thái voucher: ${code} (Status: ${status})`);
        res.json({ success: true, message: 'Cập nhật trạng thái voucher thành công' });
    } catch (error) {
        console.error("Update voucher error:", error);
        res.status(500).json({ message: 'Lỗi server khi cập nhật voucher' });
    }
};

exports.deleteVoucher = async (req, res) => {
    try {
        const { code } = req.params;
        // Using global pool
        await pool.request()
            .input('code', sql.NVarChar, code)
            .query('DELETE FROM Vouchers WHERE code = @code');
        await req.app.locals.createLog(req.user.id, 'DELETE_VOUCHER', `Xóa mã giảm giá: ${code}`);
        res.json({ success: true, message: 'Xóa mã giảm giá thành công' });
    } catch (error) {
        console.error("Delete voucher error:", error);
        res.status(500).json({ message: 'Lỗi server khi xóa voucher' });
    }
};

exports.getRewardPackages = async (req, res) => {
    try {
        const result = await pool.request().query('SELECT * FROM RewardPackages WHERE isActive = 1 ORDER BY cost ASC');
        res.json({ success: true, rewards: result.recordset });
    } catch (err) {
        console.error("Get reward packages error:", err);
        res.status(500).json({ success: false, message: 'Error fetching reward packages' });
    }
};
