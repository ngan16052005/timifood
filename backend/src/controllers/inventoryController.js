const { sql, connectDB } = require('../config/db');
const cache = require('../config/cache');

exports.importStock = async (req, res) => {
    try {
        const pool = await connectDB();
        const { productId, quantity, importPrice, note } = req.body;

        if (!productId || !quantity || quantity <= 0 || !importPrice || importPrice < 0) {
            return res.status(400).json({ message: 'Dữ liệu nhập không hợp lệ.' });
        }

        const totalPrice = quantity * importPrice;
        const importedBy = req.user ? req.user.id : null;

        // Bắt đầu transaction
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            // 1. Lấy thông tin hiện tại của sản phẩm
            const prodReq = new sql.Request(transaction);
            const prodResult = await prodReq
                .input('id', sql.UniqueIdentifier, productId)
                .query('SELECT stock, movingAverageCost FROM Products WHERE id = @id');

            if (prodResult.recordset.length === 0) {
                throw new Error('Không tìm thấy sản phẩm.');
            }

            const product = prodResult.recordset[0];
            const currentStock = product.stock || 0;
            const currentMAC = product.movingAverageCost || 0;

            // 2. Tính toán Moving Average Cost mới
            // Công thức: ((Tồn kho HT * Giá HT) + (Số lượng nhập * Giá nhập)) / (Tồn kho HT + Số lượng nhập)
            let newMAC = 0;
            const newTotalStock = currentStock + quantity;
            
            if (newTotalStock > 0) {
                newMAC = ((currentStock * currentMAC) + totalPrice) / newTotalStock;
            } else {
                newMAC = importPrice; // Trường hợp tồn kho âm hoặc bằng 0
            }

            // 3. Thêm vào bảng StockImports
            const importReq = new sql.Request(transaction);
            await importReq
                .input('productId', sql.UniqueIdentifier, productId)
                .input('quantity', sql.Int, quantity)
                .input('importPrice', sql.Float, importPrice)
                .input('totalPrice', sql.Float, totalPrice)
                .input('note', sql.NVarChar, note || '')
                .input('importedBy', sql.UniqueIdentifier, importedBy)
                .query(`
                    INSERT INTO StockImports (productId, quantity, importPrice, totalPrice, note, importedBy, importDate)
                    VALUES (@productId, @quantity, @importPrice, @totalPrice, @note, @importedBy, GETDATE())
                `);

            // 4. Cập nhật lại số lượng và giá vốn trung bình cho Sản phẩm
            const updateProdReq = new sql.Request(transaction);
            await updateProdReq
                .input('id', sql.UniqueIdentifier, productId)
                .input('addStock', sql.Int, quantity)
                .input('newMAC', sql.Float, newMAC)
                .query(`
                    UPDATE Products 
                    SET stock = ISNULL(stock, 0) + @addStock,
                        movingAverageCost = @newMAC
                    WHERE id = @id
                `);

            await transaction.commit();
            cache.flushAll(); // Clear cached products so updated stock is fetched
            res.status(200).json({ success: true, message: 'Nhập kho thành công', newStock: newTotalStock, newMAC });
        } catch (err) {
            await transaction.rollback();
            throw err;
        }

    } catch (err) {
        console.error('Import stock error:', err);
        res.status(500).json({ success: false, message: err.message || 'Lỗi server' });
    }
};

exports.getImportHistory = async (req, res) => {
    try {
        const pool = await connectDB();
        const result = await pool.request().query(`
            SELECT si.*, p.title as productName, u.fullname as importerName 
            FROM StockImports si
            JOIN Products p ON si.productId = p.id
            LEFT JOIN Users u ON si.importedBy = u.id
            ORDER BY si.importDate DESC
        `);
        res.status(200).json(result.recordset);
    } catch (err) {
        console.error('Get import history error:', err);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.getProfitReport = async (req, res) => {
    try {
        const pool = await connectDB();
        // Báo cáo lợi nhuận từ các đơn hàng đã hoàn thành (status = 2)
        const result = await pool.request().query(`
            SELECT 
                p.id as productId,
                p.title as productName,
                SUM(od.quantity) as totalSold,
                SUM(od.quantity * od.price) as totalRevenue,
                SUM(od.quantity * od.costPrice) as totalCOGS,
                (SUM(od.quantity * od.price) - SUM(od.quantity * od.costPrice)) as profit
            FROM OrderDetails od
            JOIN Orders o ON od.orderId = o.id
            JOIN Products p ON od.productId = p.id
            WHERE o.status = 2 -- Chỉ tính đơn đã giao xong
            GROUP BY p.id, p.title
            ORDER BY profit DESC
        `);
        res.status(200).json(result.recordset);
    } catch (err) {
        console.error('Get profit report error:', err);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// ================= SUPPLIERS =================
exports.getSuppliers = async (req, res) => {
    try {
        const pool = await connectDB();
        const result = await pool.request().query('SELECT * FROM Suppliers WHERE status = 1 ORDER BY createdAt DESC');
        res.status(200).json(result.recordset);
    } catch (err) {
        console.error('Get suppliers error:', err);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.createSupplier = async (req, res) => {
    try {
        const pool = await connectDB();
        const { name, phone, email, address } = req.body;
        if (!name) return res.status(400).json({ message: 'Tên nhà cung cấp là bắt buộc' });

        const result = await pool.request()
            .input('name', sql.NVarChar, name)
            .input('phone', sql.NVarChar, phone || '')
            .input('email', sql.NVarChar, email || '')
            .input('address', sql.NVarChar, address || '')
            .query(`
                INSERT INTO Suppliers (name, phone, email, address)
                OUTPUT INSERTED.*
                VALUES (@name, @phone, @email, @address)
            `);
        res.status(201).json({ success: true, supplier: result.recordset[0] });
    } catch (err) {
        console.error('Create supplier error:', err);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.updateSupplier = async (req, res) => {
    try {
        const pool = await connectDB();
        const { name, phone, email, address } = req.body;
        const { id } = req.params;

        await pool.request()
            .input('id', sql.UniqueIdentifier, id)
            .input('name', sql.NVarChar, name)
            .input('phone', sql.NVarChar, phone || '')
            .input('email', sql.NVarChar, email || '')
            .input('address', sql.NVarChar, address || '')
            .query(`
                UPDATE Suppliers
                SET name = @name, phone = @phone, email = @email, address = @address
                WHERE id = @id
            `);
        res.status(200).json({ success: true, message: 'Cập nhật thành công' });
    } catch (err) {
        console.error('Update supplier error:', err);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.deleteSupplier = async (req, res) => {
    try {
        const pool = await connectDB();
        const { id } = req.params;
        await pool.request()
            .input('id', sql.UniqueIdentifier, id)
            .query('UPDATE Suppliers SET status = 0 WHERE id = @id');
        res.status(200).json({ success: true, message: 'Xóa thành công' });
    } catch (err) {
        console.error('Delete supplier error:', err);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// ================= PURCHASE ORDERS =================
exports.getPurchaseOrders = async (req, res) => {
    try {
        const pool = await connectDB();
        const result = await pool.request().query(`
            SELECT po.*, s.name as supplierName, u.fullname as staffName
            FROM PurchaseOrders po
            LEFT JOIN Suppliers s ON po.supplierId = s.id
            LEFT JOIN Users u ON po.staffId = u.id
            ORDER BY po.importDate DESC
        `);
        res.status(200).json(result.recordset);
    } catch (err) {
        console.error('Get POs error:', err);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.getPurchaseOrderDetails = async (req, res) => {
    try {
        const pool = await connectDB();
        const { id } = req.params;

        const poResult = await pool.request()
            .input('id', sql.UniqueIdentifier, id)
            .query(`
                SELECT po.*, s.name as supplierName, s.phone as supplierPhone, s.address as supplierAddress, u.fullname as staffName
                FROM PurchaseOrders po
                LEFT JOIN Suppliers s ON po.supplierId = s.id
                LEFT JOIN Users u ON po.staffId = u.id
                WHERE po.id = @id
            `);

        if (poResult.recordset.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy phiếu nhập' });
        }

        const itemsResult = await pool.request()
            .input('poId', sql.UniqueIdentifier, id)
            .query(`
                SELECT si.*, p.title as productName, p.img as productImg
                FROM StockImports si
                JOIN Products p ON si.productId = p.id
                WHERE si.purchaseOrderId = @poId
            `);

        res.status(200).json({
            ...poResult.recordset[0],
            items: itemsResult.recordset
        });
    } catch (err) {
        console.error('Get PO details error:', err);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.createPurchaseOrder = async (req, res) => {
    try {
        const pool = await connectDB();
        const { supplierId, note, items } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ message: 'Phiếu nhập không có sản phẩm nào.' });
        }

        const staffId = req.user ? req.user.id : null;
        let totalAmount = 0;
        
        for (let item of items) {
            if (!item.productId || item.quantity <= 0 || item.importPrice < 0) {
                return res.status(400).json({ message: 'Dữ liệu sản phẩm không hợp lệ.' });
            }
            totalAmount += (item.quantity * item.importPrice);
        }

        const orderCode = 'PO' + Date.now().toString().slice(-6);

        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            // 1. Create Purchase Order
            const poReq = new sql.Request(transaction);
            const poResult = await poReq
                .input('orderCode', sql.NVarChar, orderCode)
                .input('supplierId', sql.UniqueIdentifier, supplierId || null)
                .input('staffId', sql.UniqueIdentifier, staffId)
                .input('totalAmount', sql.Float, totalAmount)
                .input('note', sql.NVarChar, note || '')
                .query(`
                    INSERT INTO PurchaseOrders (orderCode, supplierId, staffId, totalAmount, note)
                    OUTPUT INSERTED.id
                    VALUES (@orderCode, @supplierId, @staffId, @totalAmount, @note)
                `);

            const purchaseOrderId = poResult.recordset[0].id;

            // 2. Loop through items
            for (let item of items) {
                const prodReq = new sql.Request(transaction);
                const prodResult = await prodReq
                    .input('id', sql.UniqueIdentifier, item.productId)
                    .query('SELECT stock, movingAverageCost FROM Products WHERE id = @id');

                if (prodResult.recordset.length === 0) {
                    throw new Error('Sản phẩm không tồn tại: ' + item.productId);
                }

                const product = prodResult.recordset[0];
                const currentStock = product.stock || 0;
                const currentMAC = product.movingAverageCost || 0;

                let newMAC = 0;
                const newTotalStock = currentStock + item.quantity;
                const itemTotalPrice = item.quantity * item.importPrice;

                if (newTotalStock > 0) {
                    newMAC = ((currentStock * currentMAC) + itemTotalPrice) / newTotalStock;
                } else {
                    newMAC = item.importPrice;
                }

                // Insert StockImport
                const importReq = new sql.Request(transaction);
                await importReq
                    .input('purchaseOrderId', sql.UniqueIdentifier, purchaseOrderId)
                    .input('productId', sql.UniqueIdentifier, item.productId)
                    .input('quantity', sql.Int, item.quantity)
                    .input('importPrice', sql.Float, item.importPrice)
                    .input('totalPrice', sql.Float, itemTotalPrice)
                    .input('note', sql.NVarChar, note || '')
                    .input('importedBy', sql.UniqueIdentifier, staffId)
                    .query(`
                        INSERT INTO StockImports (purchaseOrderId, productId, quantity, importPrice, totalPrice, note, importedBy, importDate)
                        VALUES (@purchaseOrderId, @productId, @quantity, @importPrice, @totalPrice, @note, @importedBy, GETDATE())
                    `);

                // Update Product
                const updateProdReq = new sql.Request(transaction);
                await updateProdReq
                    .input('id', sql.UniqueIdentifier, item.productId)
                    .input('addStock', sql.Int, item.quantity)
                    .input('newMAC', sql.Float, newMAC)
                    .query(`
                        UPDATE Products 
                        SET stock = ISNULL(stock, 0) + @addStock,
                            movingAverageCost = @newMAC
                        WHERE id = @id
                    `);
            }

            await transaction.commit();
            cache.flushAll(); // Clear cached products so updated stock is fetched
            res.status(200).json({ success: true, message: 'Tạo phiếu nhập thành công', purchaseOrderId });
        } catch (err) {
            await transaction.rollback();
            throw err;
        }

    } catch (err) {
        console.error('Create PO error:', err);
        res.status(500).json({ success: false, message: err.message || 'Lỗi server' });
    }
};
