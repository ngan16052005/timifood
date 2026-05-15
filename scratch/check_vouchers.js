const { connectDB } = require('../db');

async function checkVouchers() {
    try {
        const pool = await connectDB();
        const result = await pool.request().query('SELECT * FROM Vouchers');
        console.log('--- Current Vouchers in DB ---');
        console.table(result.recordset);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkVouchers();
