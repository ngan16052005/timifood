require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '..', '.env') });
const { sql, connectDB } = require('../config/db');

async function migrate() {
    const pool = await connectDB();
    if (!pool) return;

    try {
        console.log('Running Enterprise Inventory Migration...');

        // 1. Create Suppliers table
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Suppliers' AND xtype='U')
            CREATE TABLE Suppliers (
                id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
                name NVARCHAR(255) NOT NULL,
                phone NVARCHAR(20),
                email NVARCHAR(255),
                address NVARCHAR(MAX),
                status INT DEFAULT 1,
                createdAt DATETIME DEFAULT GETDATE()
            )
        `);
        console.log('- Suppliers table checked/created');

        // 2. Create PurchaseOrders table
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='PurchaseOrders' AND xtype='U')
            CREATE TABLE PurchaseOrders (
                id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
                orderCode NVARCHAR(50) UNIQUE,
                supplierId UNIQUEIDENTIFIER NULL,
                staffId UNIQUEIDENTIFIER NULL,
                totalAmount FLOAT DEFAULT 0,
                note NVARCHAR(MAX),
                status INT DEFAULT 1, -- 1: Completed, 0: Draft/Cancelled
                importDate DATETIME DEFAULT GETDATE(),
                FOREIGN KEY (supplierId) REFERENCES Suppliers(id),
                FOREIGN KEY (staffId) REFERENCES Users(id)
            )
        `);
        console.log('- PurchaseOrders table checked/created');

        // 3. Update StockImports table to link to PurchaseOrders
        // Check if purchaseOrderId column exists
        const checkCol = await pool.request().query(`
            SELECT COLUMN_NAME
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = 'StockImports' AND COLUMN_NAME = 'purchaseOrderId'
        `);

        if (checkCol.recordset.length === 0) {
            await pool.request().query(`
                ALTER TABLE StockImports
                ADD purchaseOrderId UNIQUEIDENTIFIER NULL;
                
                ALTER TABLE StockImports
                ADD CONSTRAINT FK_StockImports_PurchaseOrders 
                FOREIGN KEY (purchaseOrderId) REFERENCES PurchaseOrders(id);
            `);
            console.log('- Added purchaseOrderId to StockImports');
        } else {
            console.log('- purchaseOrderId already exists in StockImports');
        }

        console.log('Migration Complete!');
        process.exit(0);
    } catch (err) {
        console.error('Migration Error:', err);
        process.exit(1);
    }
}

migrate();
