const { connectDB } = require('../db');

async function checkOrders() {
    try {
        const pool = await connectDB();
        const result = await pool.request().query('SELECT TOP 10 * FROM Orders ORDER BY thoigiandat DESC');
        console.log('--- Latest Orders in DB ---');
        console.table(result.recordset);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkOrders();
