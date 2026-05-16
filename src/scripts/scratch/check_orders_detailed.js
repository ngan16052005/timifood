const { connectDB } = require('../db');

async function checkOrdersDetailed() {
    try {
        const pool = await connectDB();
        const result = await pool.request().query('SELECT id, customerPhone, orderDate, status FROM Orders');
        console.log('--- All Orders ---');
        console.table(result.recordset);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkOrdersDetailed();
