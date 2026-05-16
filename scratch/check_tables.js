const { sql, connectDB } = require('../src/config/db');
require('dotenv').config();

async function checkTables() {
    try {
        const pool = await connectDB();
        const result = await pool.request().query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'");
        console.log("Tables in database:");
        result.recordset.forEach(row => console.log("- " + row.TABLE_NAME));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkTables();
