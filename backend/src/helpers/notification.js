// Factory function - nhận pool, sql, io từ server.js
module.exports = function({ pool, sql, io }) {

    async function createNotification(userId, title, message, type = 'info') {
        console.log(`[Notification] Creating for ${userId}: ${title}`);
        try {
            if (!pool) {
                console.error("[Notification] Error: DB pool not initialized");
                return false;
            }
            const result = await pool.request()
                .input('userId', sql.VarChar, userId)
                .input('title', sql.NVarChar, title)
                .input('body', sql.NVarChar, message)
                .input('type', sql.VarChar, type)
                .query(`INSERT INTO Notifications (userId, title, body, type, readStatus, createdAt) 
                        OUTPUT INSERTED.id
                        VALUES (@userId, @title, @body, @type, 0, GETDATE())`);
            
            const newNotiId = result.recordset[0].id;
            console.log(`[Notification] Success: Created for ${userId}, ID: ${newNotiId}`);

            // Emit real-time notification
            const notiData = {
                id: newNotiId,
                title,
                message, // Frontend might still expect 'message' instead of 'body' in socket event
                body: message,
                type,
                createdAt: new Date().toISOString(),
                isRead: false,
                readStatus: false
            };

            if (userId === 'ADMIN') {
                io.to('adminRoom').emit('newNotification', notiData);
            } else {
                // Emit to the specific user's room
                io.to(`userRoom_${userId}`).emit('userNotification', notiData);
                console.log(`[Socket] Emitted userNotification to userRoom_${userId}:`, notiData);
            }

            return true;
        } catch (err) {
            console.error("[Notification] Error creating notification:", err);
            return false;
        }
    }

    return { createNotification };
};
