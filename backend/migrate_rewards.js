const { connectDB, sql } = require('./src/config/db');

async function migrate() {
    try {
        const pool = await connectDB();
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='RewardPackages' and xtype='U')
            BEGIN
                CREATE TABLE RewardPackages (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    name NVARCHAR(100) NOT NULL,
                    description NVARCHAR(255) NOT NULL,
                    cost INT NOT NULL,
                    codePrefix VARCHAR(20) NOT NULL,
                    discountType NVARCHAR(50) NOT NULL,
                    discountValue INT NOT NULL,
                    minOrder INT NOT NULL,
                    color NVARCHAR(50) NOT NULL DEFAULT '#ef4444',
                    isActive BIT DEFAULT 1
                );

                INSERT INTO RewardPackages (name, description, cost, codePrefix, discountType, discountValue, minOrder, color)
                VALUES 
                (N'Giảm 20.000đ', N'Áp dụng cho đơn hàng từ 100k', 200, 'TIMI20K', '1', 20000, 100000, '#FFD700'),
                (N'Giảm 50.000đ', N'Áp dụng cho đơn hàng từ 200k', 500, 'TIMI50K', '1', 50000, 200000, '#ef4444'),
                (N'Freeship 30k', N'Miễn phí vận chuyển', 300, 'FREESHIP30', '2', 30000, 0, '#8b5cf6');
                
                PRINT 'Created table RewardPackages and inserted defaults.';
            END
            ELSE
            BEGIN
                PRINT 'Table RewardPackages already exists.';
            END
        `);
        console.log("Migration completed successfully.");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}

migrate();
