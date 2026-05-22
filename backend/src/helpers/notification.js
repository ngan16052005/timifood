// Factory function - nhận pool, sql, io từ server.js
module.exports = function({ pool, sql, io }) {

    async function createNotification(userPhone, title, message, type = 'info') {
        console.log(`[Notification] Creating for ${userPhone}: ${title}`);
        try {
            if (!pool) {
                console.error("[Notification] Error: DB pool not initialized");
                return false;
            }
            const result = await pool.request()
                .input('userPhone', sql.NVarChar, userPhone)
                .input('title', sql.NVarChar, title)
                .input('message', sql.NVarChar, message)
                .input('type', sql.NVarChar, type)
                .query(`INSERT INTO Notifications (userPhone, title, message, type, isRead, createdAt) 
                        OUTPUT INSERTED.id
                        VALUES (@userPhone, @title, @message, @type, 0, GETDATE())`);
            
            const newNotiId = result.recordset[0].id;
            console.log(`[Notification] Success: Created for ${userPhone}, ID: ${newNotiId}`);

            // Emit real-time notification
            const notiData = {
                id: newNotiId,
                title,
                message,
                type,
                createdAt: new Date().toISOString(),
                isRead: false
            };

            if (userPhone === 'ADMIN') {
                io.to('adminRoom').emit('newNotification', notiData);
            } else {
                // Emit to the specific user's room!
                io.to(`userRoom_${userPhone}`).emit('userNotification', notiData);
                console.log(`[Socket] Emitted userNotification to userRoom_${userPhone}:`, notiData);
            }

            return true;
        } catch (err) {
            console.error("[Notification] Error creating notification:", err);
            return false;
        }
    }

    return { createNotification };
};
