const initDatabase = async (pool) => {
    try {
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SystemLogs')
            BEGIN
                CREATE TABLE SystemLogs (
                    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
                    userId UNIQUEIDENTIFIER,
                    action NVARCHAR(100),
                    details NVARCHAR(MAX),
                    createdAt DATETIME DEFAULT GETDATE()
                )
            END
            
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Contacts')
            BEGIN
                CREATE TABLE Contacts (
                    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
                    name NVARCHAR(100),
                    email NVARCHAR(100),
                    subject NVARCHAR(200),
                    message NVARCHAR(MAX),
                    status INT DEFAULT 0, -- 0: Unread, 1: Read/Resolved
                    createdAt DATETIME DEFAULT GETDATE()
                )
            END

            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'News')
            BEGIN
                CREATE TABLE News (
                    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
                    title NVARCHAR(255),
                    thumbnail NVARCHAR(MAX),
                    content NVARCHAR(MAX),
                    author NVARCHAR(100),
                    status INT DEFAULT 1, -- 1: Active, 0: Hidden
                    createdAt DATETIME DEFAULT GETDATE(),
                    updatedAt DATETIME DEFAULT GETDATE()
                )
            END

            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Favorites')
            BEGIN
                CREATE TABLE Favorites (
                    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
                    userId UNIQUEIDENTIFIER NOT NULL,
                    productId UNIQUEIDENTIFIER NOT NULL,
                    createdAt DATETIME DEFAULT GETDATE(),
                    CONSTRAINT UQ_User_Product UNIQUE (userId, productId)
                )
            END

            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ChatSessions')
            BEGIN
                CREATE TABLE ChatSessions (
                    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
                    customerId UNIQUEIDENTIFIER,
                    customerName NVARCHAR(100),
                    staffId UNIQUEIDENTIFIER,
                    staffName NVARCHAR(100),
                    status NVARCHAR(20) DEFAULT 'waiting', -- waiting, chatting, ended
                    createdAt DATETIME DEFAULT GETDATE(),
                    endedAt DATETIME
                )
            END

            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ChatMessages')
            BEGIN
                CREATE TABLE ChatMessages (
                    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
                    sessionId UNIQUEIDENTIFIER FOREIGN KEY REFERENCES ChatSessions(id) ON DELETE CASCADE,
                    sender NVARCHAR(20), -- 'customer' or 'staff'
                    text NVARCHAR(MAX),
                    timestamp DATETIME DEFAULT GETDATE()
                )
            END
            IF COL_LENGTH('Products', 'minStock') IS NULL
            BEGIN
                ALTER TABLE Products ADD minStock INT DEFAULT 5;
                EXEC('UPDATE Products SET minStock = 5 WHERE minStock IS NULL');
            END
            
            -- Thêm Index để tối ưu tìm kiếm
            IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IDX_Users_Phone' AND object_id = OBJECT_ID('Users'))
            BEGIN
                CREATE INDEX IDX_Users_Phone ON Users(phone);
            END
            
            IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IDX_Orders_OrderCode' AND object_id = OBJECT_ID('Orders'))
            BEGIN
                CREATE INDEX IDX_Orders_OrderCode ON Orders(orderCode);
            END
            
            IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IDX_Orders_UserId' AND object_id = OBJECT_ID('Orders'))
            BEGIN
                CREATE INDEX IDX_Orders_UserId ON Orders(userId);
            END
        `);
        console.log('Database and indexes initialized successfully.');
    } catch (err) {
        console.error('Failed to initialize database tables or indexes:', err);
    }
};

module.exports = initDatabase;
