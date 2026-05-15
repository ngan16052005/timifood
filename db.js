const { Pool } = require('pg');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

// Cấu hình kết nối linh hoạt giữa Local và Vercel
const getProductionConfig = () => {
    const connectionString = process.env.POSTGRES_URL;
    if (!connectionString) return {};
    
    const finalConnectionString = connectionString.includes('sslmode=') 
        ? connectionString 
        : connectionString + (connectionString.includes('?') ? '&' : '?') + "sslmode=require";
        
    return { connectionString: finalConnectionString };
};

const connectionConfig = isProduction ? getProductionConfig() : {
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '123456',
    host: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_DATABASE || 'timifood',
    port: parseInt(process.env.DB_PORT) || 5432,
};

const pool = new Pool(connectionConfig);

async function connectDB() {
    try {
        // Kiểm tra kết nối
        const client = await pool.connect();
        console.log('Đã kết nối thành công tới PostgreSQL (' + (isProduction ? 'Vercel' : 'Local') + ')');
        client.release();
        return pool;
    } catch (err) {
        console.error('Lỗi kết nối Database: ', err);
        throw err;
    }
}

module.exports = {
    pool,
    connectDB
};
