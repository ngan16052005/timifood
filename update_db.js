const { sql, connectDB } = require('./db');

async function updateDB() {
    const pool = await connectDB();
    if (!pool) return;

    try {
        console.log('Updating database schema...');

        // Update Products table - add stock column
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Products') AND name = 'stock')
            ALTER TABLE Products ADD stock INT DEFAULT 0;
        `);

        // Update Orders table - add missing columns
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Orders') AND name = 'voucherCode')
            ALTER TABLE Orders ADD voucherCode NVARCHAR(50);
            
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Orders') AND name = 'discountAmount')
            ALTER TABLE Orders ADD discountAmount INT DEFAULT 0;
            
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Orders') AND name = 'shippingFee')
            ALTER TABLE Orders ADD shippingFee INT DEFAULT 0;
            
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Orders') AND name = 'paymentMethod')
            ALTER TABLE Orders ADD paymentMethod NVARCHAR(50) DEFAULT 'cash';
        `);

        // Create Vouchers table
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Vouchers' AND xtype='U')
            CREATE TABLE Vouchers (
                code NVARCHAR(50) PRIMARY KEY,
                discount INT,
                minOrder INT,
                expiryDate DATETIME,
                status INT DEFAULT 1
            )
        `);

        // Create Reviews table
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Reviews' AND xtype='U')
            CREATE TABLE Reviews (
                id INT IDENTITY(1,1) PRIMARY KEY,
                productId INT,
                customerPhone NVARCHAR(20),
                customerName NVARCHAR(255),
                rating INT,
                content NVARCHAR(MAX),
                date DATETIME DEFAULT GETDATE()
            )
        `);

        // Create StockHistory table
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='StockHistory' AND xtype='U')
            CREATE TABLE StockHistory (
                id INT IDENTITY(1,1) PRIMARY KEY,
                productId INT,
                quantity INT,
                note NVARCHAR(MAX),
                date DATETIME DEFAULT GETDATE()
            )
        `);

        // Create Notifications table
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Notifications' AND xtype='U')
            CREATE TABLE Notifications (
                id INT IDENTITY(1,1) PRIMARY KEY,
                userPhone NVARCHAR(20),
                title NVARCHAR(255),
                message NVARCHAR(MAX),
                type NVARCHAR(50),
                isRead BIT DEFAULT 0,
                createdAt DATETIME DEFAULT GETDATE()
            )
        `);

        console.log('Database schema updated successfully.');

        // Ensure some stock for products if they have 0 stock
        await pool.request().query(`UPDATE Products SET stock = 100 WHERE stock = 0 OR stock IS NULL`);
        console.log('Stock initialized for products.');

        process.exit(0);
    } catch (err) {
        console.error('Update DB Error:', err);
        process.exit(1);
    }
}

updateDB();
