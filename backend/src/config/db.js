const sql = require('mssql');
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '..', '.env') });

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    port: parseInt(process.env.DB_PORT),
    options: {
        encrypt: true, // For Azure
        trustServerCertificate: true, // For local development
        useUTC: false // Fix timezone conversion for GETDATE()
    }
};

let poolPromise;

async function connectDB(retries = 5, delay = 5000) {
    if (poolPromise) return poolPromise;

    poolPromise = new sql.ConnectionPool(config).connect()
        .then(pool => {
            console.log('✅ Connected to SQL Server successfully');
            return pool;
        })
        .catch(async (err) => {
            poolPromise = null;
            console.error(`❌ Database Connection Failed! Retries left: ${retries}`);
            if (retries > 0) {
                console.log(`⏳ Retrying in ${delay / 1000} seconds...`);
                await new Promise(res => setTimeout(res, delay));
                return connectDB(retries - 1, delay);
            } else {
                console.error('🚨 Could not connect to database after maximum retries. Shutting down gracefully.');
                process.exit(1);
            }
        });

    return poolPromise;
}

module.exports = {
    sql,
    connectDB
};
