const { sql, connectDB } = require('./db');
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
                id INT IDENTITY(1,1) PRIMARY KEY,
                fullname NVARCHAR(255),
                phone NVARCHAR(20) UNIQUE,
                password NVARCHAR(255),
                address NVARCHAR(MAX),
                email NVARCHAR(255),
                status INT DEFAULT 1,
                joinDate DATETIME DEFAULT GETDATE(),
                userType INT DEFAULT 0,
                cartData NVARCHAR(MAX)
            )
        `);

        // Create Products table
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Products' AND xtype='U')
            CREATE TABLE Products (
                id INT PRIMARY KEY,
                title NVARCHAR(255),
                img NVARCHAR(MAX),
                category NVARCHAR(100),
                price FLOAT,
                description NVARCHAR(MAX),
                status INT DEFAULT 1
            )
        `);

        // Create Orders table
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Orders' AND xtype='U')
            CREATE TABLE Orders (
                id NVARCHAR(50) PRIMARY KEY,
                customerPhone NVARCHAR(20),
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

        // Create OrderDetails table
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='OrderDetails' AND xtype='U')
            CREATE TABLE OrderDetails (
                orderId NVARCHAR(50),
                productId INT,
                price FLOAT,
                quantity INT,
                note NVARCHAR(MAX),
                FOREIGN KEY (orderId) REFERENCES Orders(id)
            )
        `);

        console.log('Tables checked/created.');

        // Import Users from JSON if table is empty
        const userCount = await pool.request().query('SELECT COUNT(*) as count FROM Users');
        if (userCount.recordset[0].count === 0) {
            console.log('Importing users from JSON...');
            const usersData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'users.json'), 'utf8'));
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
            const productsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'products.json'), 'utf8'));
            for (const prod of productsData) {
                await pool.request()
                    .input('id', sql.Int, prod.id)
                    .input('title', sql.NVarChar, prod.title)
                    .input('img', sql.NVarChar, prod.img)
                    .input('category', sql.NVarChar, prod.category)
                    .input('price', sql.Float, prod.price)
                    .input('description', sql.NVarChar, prod.desc)
                    .input('status', sql.Int, prod.status)
                    .query('INSERT INTO Products (id, title, img, category, price, description, status) VALUES (@id, @title, @img, @category, @price, @description, @status)');
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
