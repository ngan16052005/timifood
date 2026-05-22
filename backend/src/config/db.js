const sql = require('mssql');
require('dotenv').config();

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

async function connectDB() {
    if (poolPromise) return poolPromise;

    poolPromise = new sql.ConnectionPool(config).connect()
        .then(pool => {
            console.log('Connected to SQL Server');
            return pool;
        })
        .catch(err => {
            poolPromise = null;
            console.error('Database Connection Failed! ', err);
            throw err;
        });

    return poolPromise;
}

module.exports = {
    sql,
    connectDB
};
