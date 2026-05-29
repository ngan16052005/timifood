const { sql, poolPromise } = require('../config/db');

exports.getNews = async (req, res) => {
    try {
        const result = await pool.request()
            .query('SELECT * FROM News WHERE status = 1 ORDER BY createdAt DESC');
        res.json({ success: true, data: result.recordset });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi lấy tin tức' });
    }
};

exports.getAdminNews = async (req, res) => {
    try {
        const result = await pool.request()
            .query('SELECT * FROM News ORDER BY createdAt DESC');
        res.json({ success: true, data: result.recordset });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi lấy tin tức admin' });
    }
};

exports.getNewsById = async (req, res) => {
    try {
        const result = await pool.request()
            .input('id', sql.UniqueIdentifier, req.params.id)
            .query('SELECT * FROM News WHERE id = @id');
        if (result.recordset.length === 0) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
        res.json({ success: true, data: result.recordset[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi lấy chi tiết tin tức' });
    }
};

exports.createNews = async (req, res) => {
    try {
        const { title, thumbnail, content, author, status } = req.body;
        await pool.request()
            .input('title', sql.NVarChar, title)
            .input('thumbnail', sql.NVarChar, thumbnail)
            .input('content', sql.NVarChar, content)
            .input('author', sql.NVarChar, author || 'Admin')
            .input('status', sql.Int, status !== undefined ? status : 1)
            .query(`
                INSERT INTO News (title, thumbnail, content, author, status) 
                VALUES (@title, @thumbnail, @content, @author, @status)
            `);
        res.json({ success: true, message: 'Thêm tin tức thành công' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi thêm tin tức' });
    }
};

exports.updateNews = async (req, res) => {
    try {
        const { title, thumbnail, content, author, status } = req.body;
        await pool.request()
            .input('id', sql.UniqueIdentifier, req.params.id)
            .input('title', sql.NVarChar, title)
            .input('thumbnail', sql.NVarChar, thumbnail)
            .input('content', sql.NVarChar, content)
            .input('author', sql.NVarChar, author)
            .input('status', sql.Int, status)
            .query(`
                UPDATE News 
                SET title = @title, thumbnail = @thumbnail, content = @content, 
                    author = @author, status = @status, updatedAt = GETDATE()
                WHERE id = @id
            `);
        res.json({ success: true, message: 'Cập nhật thành công' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi cập nhật tin tức' });
    }
};

exports.deleteNews = async (req, res) => {
    try {
        await pool.request()
            .input('id', sql.UniqueIdentifier, req.params.id)
            .query('DELETE FROM News WHERE id = @id');
        res.json({ success: true, message: 'Xóa thành công' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi xóa tin tức' });
    }
};

