require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '..', '.env') });
const { sql, connectDB } = require('../config/db');
const fs = require('fs');
const path = require('path');

async function initializeDB() {
    const pool = await connectDB();
    if (!pool) return;

    try {
        console.log('Creating tables...');

        // Create Users table
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Users' AND xtype='U')
            CREATE TABLE Users (
                id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
                fullname NVARCHAR(255),
                phone NVARCHAR(20) UNIQUE,
                password NVARCHAR(255),
                address NVARCHAR(MAX),
                email NVARCHAR(255),
                status INT DEFAULT 1,
                joinDate DATETIME DEFAULT GETDATE(),
                userType INT DEFAULT 0
            )
        `);

        // Create Products table
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Products' AND xtype='U')
            CREATE TABLE Products (
                id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
                title NVARCHAR(255),
                img NVARCHAR(MAX),
                category NVARCHAR(100),
                price FLOAT,
                description NVARCHAR(MAX),
                status INT DEFAULT 1,
                stock INT DEFAULT 100
            )
        `);

        // Create Orders table
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Orders' AND xtype='U')
            CREATE TABLE Orders (
                id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
                orderCode NVARCHAR(50) UNIQUE,
                userId UNIQUEIDENTIFIER,
                orderDate DATETIME DEFAULT GETDATE(),
                totalPrice FLOAT,
                deliveryType NVARCHAR(100),
                deliveryTime NVARCHAR(100),
                deliveryDate DATETIME,
                receiverName NVARCHAR(255),
                receiverPhone NVARCHAR(20),
                receiverAddress NVARCHAR(MAX),
                note NVARCHAR(MAX),
                status INT DEFAULT 0 -- 0: Pending, 1: Processed
            )
        `);

        // Create PushSubscriptions table
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='PushSubscriptions' AND xtype='U')
            CREATE TABLE PushSubscriptions (
                id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
                userId UNIQUEIDENTIFIER,
                endpoint NVARCHAR(MAX),
                p256dh NVARCHAR(MAX),
                auth NVARCHAR(MAX)
            )
        `);

        // Create OrderDetails table
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='OrderDetails' AND xtype='U')
            CREATE TABLE OrderDetails (
                orderId UNIQUEIDENTIFIER,
                productId UNIQUEIDENTIFIER,
                price FLOAT,
                quantity INT,
                note NVARCHAR(MAX),
                FOREIGN KEY (orderId) REFERENCES Orders(id),
                FOREIGN KEY (productId) REFERENCES Products(id)
            )
        `);

        // Create CartItems table
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='CartItems' AND xtype='U')
            CREATE TABLE CartItems (
                id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
                userId UNIQUEIDENTIFIER,
                productId UNIQUEIDENTIFIER,
                quantity INT,
                note NVARCHAR(MAX),
                createdAt DATETIME DEFAULT GETDATE(),
                FOREIGN KEY (userId) REFERENCES Users(id),
                FOREIGN KEY (productId) REFERENCES Products(id)
            )
        `);

        // Create Favorites table
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Favorites' AND xtype='U')
            CREATE TABLE Favorites (
                id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
                userId UNIQUEIDENTIFIER,
                productId UNIQUEIDENTIFIER,
                createdAt DATETIME DEFAULT GETDATE(),
                FOREIGN KEY (userId) REFERENCES Users(id),
                FOREIGN KEY (productId) REFERENCES Products(id)
            )
        `);

        // Create ChatSessions table
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ChatSessions' AND xtype='U')
            CREATE TABLE ChatSessions (
                id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
                customerId UNIQUEIDENTIFIER,
                customerPhone NVARCHAR(20),
                customerName NVARCHAR(255),
                staffId UNIQUEIDENTIFIER,
                staffPhone NVARCHAR(20),
                staffName NVARCHAR(255),
                status NVARCHAR(50) DEFAULT 'waiting',
                createdAt DATETIME DEFAULT GETDATE(),
                endedAt DATETIME
            )
        `);

        // Create ChatMessages table
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ChatMessages' AND xtype='U')
            CREATE TABLE ChatMessages (
                id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
                sessionId UNIQUEIDENTIFIER,
                sender NVARCHAR(50),
                text NVARCHAR(MAX),
                timestamp DATETIME DEFAULT GETDATE(),
                FOREIGN KEY (sessionId) REFERENCES ChatSessions(id)
            )
        `);

        // Create Indexes for performance optimization
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='IX_Orders_userId')
                CREATE INDEX IX_Orders_userId ON Orders(userId);
            
            IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='IX_OrderDetails_orderId')
                CREATE INDEX IX_OrderDetails_orderId ON OrderDetails(orderId);
                
            IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='IX_OrderDetails_productId')
                CREATE INDEX IX_OrderDetails_productId ON OrderDetails(productId);
                
            IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='IX_CartItems_userId')
                CREATE INDEX IX_CartItems_userId ON CartItems(userId);
                
            IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='IX_Favorites_userId')
                CREATE INDEX IX_Favorites_userId ON Favorites(userId);
                
            IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='IX_PushSubscriptions_userId')
                CREATE INDEX IX_PushSubscriptions_userId ON PushSubscriptions(userId);
        `);

        console.log('Tables checked/created.');

        // Create Reviews table
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Reviews')
            BEGIN
                CREATE TABLE Reviews (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    productId UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Products(id) ON DELETE CASCADE,
                    userId UNIQUEIDENTIFIER,
                    rating INT,
                    comment NVARCHAR(MAX),
                    createdAt DATETIME DEFAULT GETDATE()
                );
            END
        `);

        // Create Categories table
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Categories')
            BEGIN
                CREATE TABLE Categories (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    name NVARCHAR(255) NOT NULL,
                    description NVARCHAR(MAX) NULL,
                    icon NVARCHAR(255) NULL
                )
            END
        `);

        // Create Notifications table
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Notifications')
            BEGIN
                CREATE TABLE Notifications (
                    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
                    userId VARCHAR(50) NOT NULL,
                    title NVARCHAR(255) NOT NULL,
                    body NVARCHAR(MAX) NOT NULL,
                    type VARCHAR(50) NOT NULL,
                    readStatus BIT DEFAULT 0,
                    createdAt DATETIME DEFAULT GETDATE(),
                    actionUrl NVARCHAR(MAX) NULL
                )
            END
        `);

        // Create Contacts table
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Contacts')
            BEGIN
                CREATE TABLE Contacts (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    name NVARCHAR(255) NOT NULL,
                    email VARCHAR(255) NOT NULL,
                    phone VARCHAR(20) NULL,
                    subject NVARCHAR(255) NULL,
                    message NVARCHAR(MAX) NOT NULL,
                    status INT DEFAULT 0,
                    createdAt DATETIME DEFAULT GETDATE()
                )
            END
        `);

        // Create News table
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'News')
            BEGIN
                CREATE TABLE News (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    title NVARCHAR(255) NOT NULL,
                    slug VARCHAR(255) NULL,
                    thumbnail VARCHAR(255) NULL,
                    content NVARCHAR(MAX) NOT NULL,
                    author NVARCHAR(100) NULL,
                    status VARCHAR(50) DEFAULT 'published',
                    views INT DEFAULT 0,
                    createdAt DATETIME DEFAULT GETDATE(),
                    updatedAt DATETIME DEFAULT GETDATE()
                )
            END
        `);

        // Create StockHistory table
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'StockHistory')
            BEGIN
                CREATE TABLE StockHistory (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    productId UNIQUEIDENTIFIER NOT NULL,
                    action VARCHAR(50) NOT NULL,
                    quantity INT NOT NULL,
                    note NVARCHAR(255) NULL,
                    createdBy UNIQUEIDENTIFIER NULL,
                    createdAt DATETIME DEFAULT GETDATE()
                )
            END
        `);

        // Create SystemLogs table
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SystemLogs')
            BEGIN
                CREATE TABLE SystemLogs (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    userId UNIQUEIDENTIFIER NULL,
                    action VARCHAR(100) NOT NULL,
                    details NVARCHAR(MAX) NULL,
                    createdAt DATETIME DEFAULT GETDATE()
                )
            END
        `);

        // Create Vouchers table
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Vouchers')
            BEGIN
                CREATE TABLE Vouchers (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    code VARCHAR(50) UNIQUE NOT NULL,
                    description NVARCHAR(255) NULL,
                    discountType VARCHAR(50) NOT NULL,
                    discountValue INT NOT NULL,
                    minOrderValue INT DEFAULT 0,
                    maxDiscount INT NULL,
                    startDate DATETIME NULL,
                    endDate DATETIME NULL,
                    usageLimit INT DEFAULT 0,
                    usedCount INT DEFAULT 0,
                    status INT DEFAULT 1
                )
            END
        `);

        // Import Users from JSON if table is empty
        const userCount = await pool.request().query('SELECT COUNT(*) as count FROM Users');
        if (userCount.recordset[0].count === 0) {
            console.log('Importing users from JSON...');
            const usersData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'users_backup.json'), 'utf8'));
            for (const user of usersData) {
                await pool.request()
                    .input('fullname', sql.NVarChar, user.fullname)
                    .input('phone', sql.NVarChar, user.phone)
                    .input('password', sql.NVarChar, user.password)
                    .input('address', sql.NVarChar, user.address || '')
                    .input('email', sql.NVarChar, user.email || '')
                    .input('status', sql.Int, user.status)
                    .input('userType', sql.Int, user.userType || 0)
                    .query('INSERT INTO Users (fullname, phone, password, address, email, status, userType) VALUES (@fullname, @phone, @password, @address, @email, @status, @userType)');
            }
            console.log('Users imported.');
        }

        // Import Products from JSON if table is empty
        const prodCount = await pool.request().query('SELECT COUNT(*) as count FROM Products');
        if (prodCount.recordset[0].count === 0) {
            console.log('Importing products from JSON...');
            const productsData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'products_backup.json'), 'utf8'));
            for (const prod of productsData) {
                await pool.request()
                    .input('title', sql.NVarChar, prod.title)
                    .input('img', sql.NVarChar, prod.img)
                    .input('category', sql.NVarChar, prod.category)
                    .input('price', sql.Float, prod.price)
                    .input('description', sql.NVarChar, prod.desc || prod.description)
                    .input('status', sql.Int, prod.status)
                    .query('INSERT INTO Products (title, img, category, price, description, status) VALUES (@title, @img, @category, @price, @description, @status)');
            }
            console.log('Products imported.');
        }

        console.log('Database initialization complete.');
        process.exit(0);
    } catch (err) {
        console.error('Initialization Error:', err);
        process.exit(1);
    }
}

initializeDB();
