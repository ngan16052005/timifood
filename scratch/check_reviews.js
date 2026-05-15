const { sql, connectDB } = require('../db');

async function check() {
    try {
        const pool = await connectDB();
        if (!pool) {
            console.log("Could not connect to DB");
            return;
        }

        console.log("--- REVIEWS TABLE SCHEMA ---");
        const schema = await pool.request().query("SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Reviews'");
        console.table(schema.recordset);

        console.log("\n--- REVIEWS DATA SAMPLE ---");
        const data = await pool.request().query("SELECT TOP 5 * FROM Reviews");
        console.table(data.recordset);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
