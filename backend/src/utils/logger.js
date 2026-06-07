const { sql, connectDB } = require('../config/db');

/**
 * Log admin or system action to SystemLogs table
 * @param {string} userId - ID of the user performing the action (UniqueIdentifier)
 * @param {string} action - Action type (e.g. 'ADD_PRODUCT', 'UPDATE_ORDER', 'DELETE_USER')
 * @param {string} details - Detailed description of the action
 */
async function logSystemAction(userId, action, details) {
    try {
        const pool = await connectDB();
        await pool.request()
            .input('userId', sql.UniqueIdentifier, userId || null)
            .input('action', sql.NVarChar, action)
            .input('details', sql.NVarChar, details)
            .query(`
                INSERT INTO SystemLogs (userId, action, details, createdAt)
                VALUES (@userId, @action, @details, GETUTCDATE())
            `);
    } catch (err) {
        console.error("Error logging system action:", err);
    }
}

module.exports = { logSystemAction };
