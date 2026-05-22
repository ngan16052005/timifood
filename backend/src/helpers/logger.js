// Factory function - nhận pool, sql từ server.js
module.exports = function({ pool, sql }) {

    async function createLog(userPhone, action, details) {
        console.log(`[Log] ${userPhone}: ${action} - ${details}`);
        try {
            if (!pool) return false;
            await pool.request()
                .input('userPhone', sql.NVarChar, userPhone)
                .input('action', sql.NVarChar, action)
                .input('details', sql.NVarChar, details)
                .query('INSERT INTO SystemLogs (userPhone, action, details, createdAt) VALUES (@userPhone, @action, @details, GETDATE())');
            return true;
        } catch (err) {
            console.error("[Log] Error creating system log:", err);
            return false;
        }
    }

    return { createLog };
};
