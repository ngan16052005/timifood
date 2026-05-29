const { sql, connectDB } = require('../config/db');
const cache = require('../config/cache');
let pool;
connectDB().then(p => pool = p).catch(console.error);

exports.getAllCategories = async (req, res) => {
    try {
        if (cache.has('categories')) {
            return res.json(cache.get('categories'));
        }
        const pool = await connectDB();
        const result = await pool.request().query('SELECT * FROM Categories ORDER BY name ASC');
        cache.set('categories', result.recordset);
        res.json(result.recordset);
    } catch (err) {
        console.error("Fetch categories error:", err);
        res.status(500).json({ message: 'Lỗi khi tải danh mục' });
    }
};

exports.addCategory = async (req, res) => {
    try {
        const pool = await connectDB();
        const { createLog } = require('../helpers/logger')({ pool, sql });
        const { name } = req.body;
        if (!name) return res.status(400).json({ message: 'Tên danh mục không được để trống' });

        // Check duplicate category name (case-insensitive)
        const existingCategory = await pool.request()
            .input('name', sql.NVarChar, name.trim())
            .query('SELECT TOP 1 id FROM Categories WHERE LOWER(TRIM(name)) = LOWER(@name)');
        if (existingCategory.recordset.length > 0) {
            return res.status(400).json({ success: false, message: 'Tên danh mục đã tồn tại!' });
        }

        await pool.request()
            .input('name', sql.NVarChar, name)
            .query('INSERT INTO Categories (name) VALUES (@name)');
        
        await req.app.locals.createLog(req.user.id, 'ADD_CATEGORY', `Thêm danh mục: ${name}`);
        cache.del('categories');
        res.status(201).json({ success: true, message: 'Thêm danh mục thành công' });
    } catch (err) {
        if (err.number === 2627) { // Unique constraint violation
            return res.status(400).json({ message: 'Tên danh mục đã tồn tại!' });
        }
        console.error("Add category error:", err);
        res.status(500).json({ message: 'Lỗi khi thêm danh mục' });
    }
};

exports.updateCategory = async (req, res) => {
    try {
        const pool = await connectDB();
        const { createLog } = require('../helpers/logger')({ pool, sql });
        const { id } = req.params;
        const { name } = req.body;
        if (!name) return res.status(400).json({ message: 'Tên danh mục không được để trống' });

        // Check duplicate category name excluding current (case-insensitive)
        const existingCategory = await pool.request()
            .input('id', sql.Int, parseInt(id))
            .input('name', sql.NVarChar, name.trim())
            .query('SELECT TOP 1 id FROM Categories WHERE LOWER(TRIM(name)) = LOWER(@name) AND id != @id');
        if (existingCategory.recordset.length > 0) {
            return res.status(400).json({ success: false, message: 'Tên danh mục đã tồn tại cho một danh mục khác!' });
        }
        
        await pool.request()
            .input('id', sql.Int, id)
            .input('name', sql.NVarChar, name)
            .query('UPDATE Categories SET name = @name WHERE id = @id');
        
        await req.app.locals.createLog(req.user.id, 'UPDATE_CATEGORY', `Cập nhật danh mục ID: ${id} sang: ${name}`);
        cache.del('categories');
        res.json({ success: true, message: 'Cập nhật danh mục thành công' });
    } catch (err) {
        console.error("Update category error:", err);
        res.status(500).json({ message: 'Lỗi khi cập nhật danh mục' });
    }
};

exports.deleteCategory = async (req, res) => {
    try {
        const pool = await connectDB();
        const { createLog } = require('../helpers/logger')({ pool, sql });
        const { id } = req.params;
        
        // Check if category is in use
        const catCheck = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT name FROM Categories WHERE id = @id');
        
        if (catCheck.recordset.length === 0) return res.status(404).json({ message: 'Không tìm thấy danh mục' });
        
        const catName = catCheck.recordset[0].name;
        const productCheck = await pool.request()
            .input('name', sql.NVarChar, catName)
            .query('SELECT COUNT(*) as count FROM Products WHERE category = @name');
        
        if (productCheck.recordset[0].count > 0) {
            return res.status(400).json({ message: 'Không thể xóa danh mục đang có sản phẩm' });
        }

        await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM Categories WHERE id = @id');
        
        await req.app.locals.createLog(req.user.id, 'DELETE_CATEGORY', `Xóa danh mục: ${catName} (ID: ${id})`);
        cache.del('categories');
        res.json({ success: true, message: 'Xóa danh mục thành công' });
    } catch (err) {
        console.error("Delete category error:", err);
        res.status(500).json({ message: 'Lỗi khi xóa danh mục' });
    }
};
