const { sql, poolPromise } = require('./backend/src/config/db'); 
async function deleteTest() { 
    try { 
        const pool = await poolPromise; 
        await pool.request().query("DELETE FROM News"); 
        console.log('deleted test data'); 
        process.exit(0); 
    } catch(e) { 
        console.error(e); 
        process.exit(1); 
    } 
} 
deleteTest();
