// Factory function - nhận pool, sql từ server.js
module.exports = function({ pool, sql }) {

    async function createLog(userId, action, details) {
        console.log(`[Log] ${userId}: ${action} - ${details}`);
        try {
            if (!pool) return false;
            await pool.request()
                .input('userId', sql.UniqueIdentifier, userId)
                .input('action', sql.NVarChar, action)
                .input('details', sql.NVarChar, details)
                .query('INSERT INTO SystemLogs (userId, action, details, createdAt) VALUES (@userId, @action, @details, GETUTCDATE())');
            return true;
        } catch (err) {
            console.error("[Log] Error creating system log:", err);
            return false;
        }
    }

    return { createLog };
};
