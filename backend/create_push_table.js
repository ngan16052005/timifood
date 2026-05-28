const sql = require('mssql');
require('dotenv').config({ path: '../.env' });

async function run() {
    try {
        const pool = await sql.connect({
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            server: process.env.DB_SERVER,
            database: process.env.DB_DATABASE,
            options: { encrypt: false, enableArithAbort: true }
        });
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='PushSubscriptions' and xtype='U')
            CREATE TABLE PushSubscriptions (
                id INT IDENTITY(1,1) PRIMARY KEY,
                userPhone VARCHAR(20) NOT NULL,
                endpoint NVARCHAR(MAX) NOT NULL,
                p256dh NVARCHAR(MAX) NOT NULL,
                auth NVARCHAR(MAX) NOT NULL,
                createdAt DATETIME DEFAULT GETDATE()
            )
        `);
        console.log('PushSubscriptions table created/exists.');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
run();
