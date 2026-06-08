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
        const { status, discountValue, discountType, minOrderValue, maxDiscount, expiryDate } = req.body;
        if (discountValue !== undefined) {
            await pool.request()
                .input('code', sql.NVarChar, code)
                .input('discountValue', sql.Int, discountValue)
                .input('discountType', sql.NVarChar, discountType.toString())
                .input('minOrderValue', sql.Int, minOrderValue)
                .input('maxDiscount', sql.Int, maxDiscount)
                .input('expiryDate', sql.DateTime, expiryDate)
                .query("UPDATE Vouchers SET discountType=@discountType, discountValue=@discountValue, minOrderValue=@minOrderValue, maxDiscount=@maxDiscount, endDate=@expiryDate WHERE code=@code");
            await req.app.locals.createLog(req.user.id, 'UPDATE_VOUCHER', "C?p nh?t voucher: " + code);
            return res.json({ success: true, message: 'C?p nh?t voucher th�nh c�ng' });
        }
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

exports.createRewardPackage = async (req, res) => {
    try {
        const { name, description, cost, codePrefix, discountType, discountValue, minOrder, color } = req.body;
        await pool.request()
            .input('name', sql.NVarChar, name)
            .input('description', sql.NVarChar, description)
            .input('cost', sql.Int, cost)
            .input('codePrefix', sql.VarChar, codePrefix)
            .input('discountType', sql.NVarChar, discountType.toString())
            .input('discountValue', sql.Int, discountValue)
            .input('minOrder', sql.Int, minOrder)
            .input('color', sql.NVarChar, color || '#ef4444')
            .query(`INSERT INTO RewardPackages (name, description, cost, codePrefix, discountType, discountValue, minOrder, color) 
                    VALUES (@name, @description, @cost, @codePrefix, @discountType, @discountValue, @minOrder, @color)`);
        
        await req.app.locals.createLog(req.user.id, 'CREATE_REWARD', `Thêm gói ưu đãi: ${name}`);
        res.json({ success: true, message: 'Thêm gói ưu đãi thành công' });
    } catch (err) {
        console.error("Create reward package error:", err);
        res.status(500).json({ success: false, message: 'Lỗi khi thêm gói ưu đãi' });
    }
};

exports.updateRewardPackage = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, cost, codePrefix, discountType, discountValue, minOrder, color, isActive } = req.body;
        
        await pool.request()
            .input('id', sql.Int, id)
            .input('name', sql.NVarChar, name)
            .input('description', sql.NVarChar, description)
            .input('cost', sql.Int, cost)
            .input('codePrefix', sql.VarChar, codePrefix)
            .input('discountType', sql.NVarChar, discountType.toString())
            .input('discountValue', sql.Int, discountValue)
            .input('minOrder', sql.Int, minOrder)
            .input('color', sql.NVarChar, color || '#ef4444')
            .input('isActive', sql.Bit, isActive !== undefined ? isActive : 1)
            .query(`UPDATE RewardPackages 
                    SET name=@name, description=@description, cost=@cost, codePrefix=@codePrefix, 
                        discountType=@discountType, discountValue=@discountValue, minOrder=@minOrder, color=@color, isActive=@isActive 
                    WHERE id=@id`);
                    
        await req.app.locals.createLog(req.user.id, 'UPDATE_REWARD', `Cập nhật gói ưu đãi: ID ${id}`);
        res.json({ success: true, message: 'Cập nhật gói ưu đãi thành công' });
    } catch (err) {
        console.error("Update reward package error:", err);
        res.status(500).json({ success: false, message: 'Lỗi khi cập nhật gói ưu đãi' });
    }
};

exports.deleteRewardPackage = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM RewardPackages WHERE id=@id');
            
        await req.app.locals.createLog(req.user.id, 'DELETE_REWARD', `Xóa gói ưu đãi: ID ${id}`);
        res.json({ success: true, message: 'Xóa gói ưu đãi thành công' });
    } catch (err) {
        console.error("Delete reward package error:", err);
        res.status(500).json({ success: false, message: 'Lỗi khi xóa gói ưu đãi' });
    }
};

exports.getAllRewardPackages = async (req, res) => {
    try {
        const result = await pool.request().query('SELECT * FROM RewardPackages ORDER BY cost ASC');
        res.json({ success: true, rewards: result.recordset });
    } catch (err) {
        console.error("Get all reward packages error:", err);
        res.status(500).json({ success: false, message: 'Error fetching reward packages' });
    }
};

