const { connectDB } = require('../db');

async function fixDH009() {
    try {
        const pool = await connectDB();
        await pool.request().query("UPDATE Orders SET orderDate = GETDATE() WHERE id = 'DH009'");
        console.log('Fixed DH009 timestamp to current local time.');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

fixDH009();
