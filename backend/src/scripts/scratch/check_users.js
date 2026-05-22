const { connectDB } = require('../../config/db');

async function checkUsers() {
    try {
        const pool = await connectDB();
        const result = await pool.request().query('SELECT id, fullname, phone, userType, status FROM Users');
        console.log('--- Current Users in DB ---');
        console.table(result.recordset);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkUsers();
