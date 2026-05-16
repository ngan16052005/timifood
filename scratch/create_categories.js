const { sql, connectDB } = require('../src/config/db');
require('dotenv').config();

async function createCategoriesTable() {
    try {
        const pool = await connectDB();
        
        // 1. Create Table
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Categories')
            BEGIN
                CREATE TABLE Categories (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    name NVARCHAR(100) NOT NULL UNIQUE
                )
            END
        `);
        console.log("Categories table created (or already exists).");

        // 2. Seed Data
        const currentCategories = [
            "Món chay", "Món mặn", "Món lẩu", "Món ăn vặt", "Món tráng miệng", "Nước uống"
        ];

        for (const cat of currentCategories) {
            await pool.request()
                .input('name', sql.NVarChar, cat)
                .query(`
                    IF NOT EXISTS (SELECT * FROM Categories WHERE name = @name)
                    BEGIN
                        INSERT INTO Categories (name) VALUES (@name)
                    END
                `);
        }
        console.log("Categories seeded successfully.");
        
        process.exit(0);
    } catch (err) {
        console.error("Migration error:", err);
        process.exit(1);
    }
}

createCategoriesTable();
