const sql = require('mssql');
require('dotenv').config();

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function run() {
    try {
        let pool = await sql.connect(config);
        
        console.log("--- PRODUCTS TABLE ---");
        let products = await pool.request().query("SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Products'");
        console.table(products.recordset);

        console.log("\n--- STOCKHISTORY TABLE (Mine) ---");
        let stockH = await pool.request().query("SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'StockHistory'");
        console.table(stockH.recordset);

        console.log("\n--- INVENTORYLOG TABLE (Existing?) ---");
        let invLog = await pool.request().query("SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'InventoryLog'");
        console.table(invLog.recordset);

        console.log("\n--- REVIEWS TABLE ---");
        let reviews = await pool.request().query("SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Reviews'");
        console.table(reviews.recordset);

    } catch (err) {
        console.error(err);
    } finally {
        sql.close();
    }
}

run();
