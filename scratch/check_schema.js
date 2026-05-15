const { connectDB } = require('../db');

async function checkSchema() {
    try {
        const pool = await connectDB();
        const result = await pool.request().query("SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Orders'");
        console.log('--- Orders Table Schema ---');
        console.table(result.recordset);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkSchema();
