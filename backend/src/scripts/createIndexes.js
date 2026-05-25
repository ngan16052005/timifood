require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });
const { sql, connectDB } = require('../config/db');

async function createIndexes() {
    try {
        const pool = await connectDB();
        console.log("Đang kết nối Database, bắt đầu đánh Index...");
        
        // Index on Users table
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Users_Phone' AND object_id = OBJECT_ID('Users'))
            BEGIN
                CREATE INDEX IX_Users_Phone ON Users(phone);
            END
        `);
        console.log("=> Tạo thành công Index: IX_Users_Phone (Tìm kiếm User siêu tốc qua số điện thoại)");

        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Users_Email' AND object_id = OBJECT_ID('Users'))
            BEGIN
                CREATE INDEX IX_Users_Email ON Users(email);
            END
        `);
        console.log("=> Tạo thành công Index: IX_Users_Email (Tìm kiếm User siêu tốc qua email)");

        // Index on Products table
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Products_Category' AND object_id = OBJECT_ID('Products'))
            BEGIN
                CREATE INDEX IX_Products_Category ON Products(category);
            END
        `);
        console.log("=> Tạo thành công Index: IX_Products_Category (Tăng tốc độ truy xuất món ăn theo danh mục)");

        // Index on Orders table
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Orders_CustomerPhone' AND object_id = OBJECT_ID('Orders'))
            BEGIN
                CREATE INDEX IX_Orders_CustomerPhone ON Orders(customerPhone);
            END
        `);
        console.log("=> Tạo thành công Index: IX_Orders_CustomerPhone (Tăng tốc lấy lịch sử đơn hàng của khách)");
        
        console.log("✅ Hoàn tất tối ưu hoá Database! Hệ thống hiện tại có thể xử lý hàng chục ngàn dữ liệu không lo chậm.");
    } catch (err) {
        console.error("Lỗi khi tạo indexes:", err);
    } finally {
        process.exit(0);
    }
}
createIndexes();
