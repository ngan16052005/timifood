const { sql, connectDB } = require('../config/db');

exports.getAllProducts = async (req, res) => {
    try {
        const pool = await connectDB();
        const { search } = req.query;
        let query = `
            SELECT p.*, 
                   COALESCE(AVG(CAST(r.rating AS FLOAT)), 0) as avgRating,
                   COUNT(r.id) as reviewCount
            FROM Products p
            LEFT JOIN Reviews r ON p.id = r.productId
        `;
        let request = pool.request();

        if (search) {
            query += ' WHERE p.title LIKE @search OR p.description LIKE @search';
            request.input('search', sql.NVarChar, `%${search}%`);
        }

        query += ' GROUP BY p.id, p.title, p.price, p.img, p.category, p.status, p.description, p.stock, p.minStock';

        const result = await request.query(query);
        const products = result.recordset.map(p => ({
            ...p,
            desc: p.description
        }));
        res.json(products);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching products', error: err.message });
    }
};

exports.addProduct = async (req, res) => {
    try {
        const pool = await connectDB();
        const { createLog } = require('../helpers/logger')({ pool, sql });
        const prod = req.body;
        if (!prod.title) return res.status(400).json({ message: 'Tên sản phẩm không được để trống' });

        // Check duplicate product title
        const existingProduct = await pool.request()
            .input('title', sql.NVarChar, prod.title)
            .query('SELECT TOP 1 id FROM Products WHERE title = @title');
        
        if (existingProduct.recordset.length > 0) {
            return res.status(400).json({ message: 'Tên sản phẩm đã tồn tại' });
        }

        const id = require('crypto').randomUUID();
        await pool.request()
            .input('id', sql.UniqueIdentifier, id)
            .input('title', sql.NVarChar, prod.title)
            .input('img', sql.NVarChar, prod.img || '')
            .input('category', sql.NVarChar, prod.category)
            .input('price', sql.Float, parseFloat(prod.price))
            .input('description', sql.NVarChar, prod.desc || '')
            .input('stock', sql.Int, parseInt(prod.stock) || 0)
            .input('minStock', sql.Int, parseInt(prod.minStock) || 5)
            .input('status', sql.Int, 1)
            .query(`INSERT INTO Products (id, title, img, category, price, description, status, stock, minStock) 
                    VALUES (@id, @title, @img, @category, @price, @description, @status, @stock, @minStock)`);
        
        await createLog(req.user.id, 'ADD_PRODUCT', `Thêm sản phẩm mới: ${prod.title} (ID: ${id})`);
        res.status(201).json({ success: true, message: 'Product added successfully' });
    } catch (err) {
        console.error('Error adding product:', err);
        res.status(500).json({ message: 'Error adding product: ' + err.message });
    }
};

exports.updateProduct = async (req, res) => {
    try {
        const pool = await connectDB();
        const { createLog } = require('../helpers/logger')({ pool, sql });
        const prod = req.body;
        await pool.request()
            .input('id', sql.UniqueIdentifier, req.params.id)
            .input('title', sql.NVarChar, prod.title)
            .input('img', sql.NVarChar, prod.img || '')
            .input('category', sql.NVarChar, prod.category)
            .input('price', sql.Float, parseFloat(prod.price))
            .input('description', sql.NVarChar, prod.desc || '')
            .input('stock', sql.Int, parseInt(prod.stock) || 0)
            .input('minStock', sql.Int, parseInt(prod.minStock) || 5)
            .input('status', sql.Int, parseInt(prod.status))
            .query(`UPDATE Products 
                    SET title=@title, img=@img, category=@category, price=@price, description=@description, status=@status, stock=@stock, minStock=@minStock 
                    WHERE id=@id`);
        
        await createLog(req.user.id, 'UPDATE_PRODUCT', `Cập nhật sản phẩm ID: ${req.params.id} (${prod.title})`);
        res.json({ success: true, message: 'Product updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error updating product' });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        const pool = await connectDB();
        const { createLog } = require('../helpers/logger')({ pool, sql });
        const id = req.params.id;
        
        // Check if product is in any order first
        const checkOrder = await pool.request()
            .input('id', sql.UniqueIdentifier, id)
            .query('SELECT TOP 1 * FROM OrderDetails WHERE productId=@id');

        if (checkOrder.recordset.length > 0) {
            return res.status(400).json({ message: 'Không thể xóa vĩnh viễn sản phẩm này vì đã có trong lịch sử đơn hàng. Vui lòng sử dụng chức năng Ẩn.' });
        }

        await pool.request()
            .input('id', sql.UniqueIdentifier, id)
            .query('DELETE FROM Products WHERE id = @id');
        
        await createLog(req.user.id, 'DELETE_PRODUCT', `Xóa vĩnh viễn sản phẩm ID: ${id}`);
        res.json({ success: true, message: 'Product deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error deleting product' });
    }
};

exports.getProductById = async (req, res) => {
    try {
        const pool = await connectDB();
        const result = await pool.request()
            .input('id', sql.UniqueIdentifier, req.params.id)
            .query('SELECT * FROM Products WHERE id = @id');
        if (result.recordset.length > 0) {
            const product = result.recordset[0];
            product.desc = product.description;
            res.json(product);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching product' });
    }
};
