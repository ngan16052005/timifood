
const { connectDB } = require('../src/config/db');
const bcrypt = require('bcryptjs');

async function check() {
    const pool = await connectDB();
    const result = await pool.request().query("SELECT password FROM Users WHERE phone='0387878744'");
    console.log('Password in DB:', result.recordset[0].password);
    
    const isMatch = await bcrypt.compare('123456', result.recordset[0].password);
    console.log('Match with 123456:', isMatch);
    process.exit(0);
}
check();
