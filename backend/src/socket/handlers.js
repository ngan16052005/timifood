// Factory function - nhận io từ server.js
module.exports = function({ io, pool, sql }) {

    // Active Live Chat sessions in memory (Key: customerPhone)
    let activeChats = {};

    function getActiveChatsSummary() {
        return Object.values(activeChats).map(c => ({
            phone: c.phone,
            fullname: c.fullname,
            status: c.status,
            staffPhone: c.staffPhone,
            staffName: c.staffName,
            createdAt: c.createdAt,
            messages: c.messages,
            lastMessage: c.messages[c.messages.length - 1] || null
        }));
    }

    // Socket.io Connection
    io.on('connection', (socket) => {
        console.log('A user connected:', socket.id);
        
        socket.on('joinAdmin', () => {
            socket.join('adminRoom');
            console.log(`Socket ${socket.id} joined adminRoom`);
        });

        socket.on('joinUser', (userPhone) => {
            socket.join(`userRoom_${userPhone}`);
            console.log(`Socket ${socket.id} joined userRoom_${userPhone}`);
        });

        // --- LIVE CHAT REAL-TIME EVENT LISTENERS ---
        
        // Customer requests support
        socket.on('client_request_live_chat', async (data) => {
            const { phone, fullname } = data;
            if (!phone) return;

            console.log(`[LiveChat] Customer ${fullname} (${phone}) requested live support.`);
            
            let dbSessionId = null;
            if (pool && sql) {
                try {
                    const result = await pool.request()
                        .input('phone', sql.NVarChar, phone)
                        .input('name', sql.NVarChar, fullname || 'Khách vãng lai')
                        .input('status', sql.NVarChar, 'waiting')
                        .query(`
                            INSERT INTO ChatSessions (customerPhone, customerName, status, createdAt)
                            OUTPUT INSERTED.id
                            VALUES (@phone, @name, @status, GETDATE())
                        `);
                    dbSessionId = result.recordset[0].id;
                } catch (e) {
                    console.error('DB Error creating chat session:', e);
                }
            }

            // Initialize active chat session
            activeChats[phone] = {
                socketId: socket.id,
                dbSessionId: dbSessionId,
                phone: phone,
                fullname: fullname || 'Khách vãng lai',
                messages: [],
                status: 'waiting',
                staffPhone: null,
                staffName: null,
                createdAt: new Date()
            };

            // Inform customer
            socket.emit('live_chat_status', { status: 'waiting' });

            // Broadcast to all staff in adminRoom
            io.to('adminRoom').emit('new_chat_session', {
                phone: phone,
                fullname: activeChats[phone].fullname,
                status: 'waiting',
                createdAt: activeChats[phone].createdAt
            });
            
            io.to('adminRoom').emit('active_chats_updated', getActiveChatsSummary());
        });

        // Staff accepts and joins support chat
        socket.on('staff_join_chat', async (data) => {
            const { staffPhone, staffName, customerPhone } = data;
            if (!customerPhone || !activeChats[customerPhone]) {
                socket.emit('staff_join_error', { message: 'Phiên hỗ trợ này không còn tồn tại!' });
                return;
            }

            console.log(`[LiveChat] Staff ${staffName} (${staffPhone}) accepted chat with ${customerPhone}`);

            // Update session
            activeChats[customerPhone].status = 'chatting';
            activeChats[customerPhone].staffPhone = staffPhone;
            activeChats[customerPhone].staffName = staffName;

            if (pool && sql && activeChats[customerPhone].dbSessionId) {
                try {
                    await pool.request()
                        .input('staffPhone', sql.NVarChar, staffPhone)
                        .input('staffName', sql.NVarChar, staffName)
                        .input('status', sql.NVarChar, 'chatting')
                        .input('id', sql.UniqueIdentifier, activeChats[customerPhone].dbSessionId)
                        .query(`
                            UPDATE ChatSessions 
                            SET staffPhone = @staffPhone, staffName = @staffName, status = @status 
                            WHERE id = @id
                        `);
                } catch (e) {
                    console.error('DB Error updating chat session:', e);
                }
            }

            // Inform customer via userRoom_${customerPhone}
            io.to(`userRoom_${customerPhone}`).emit('chat_session_active', {
                staffName: staffName,
                status: 'chatting'
            });
            io.to(`userRoom_${customerPhone}`).emit('staff_join_chat', {
                staffName: staffName,
                status: 'chatting'
            });

            // Inform staff joining success and return current chat history
            socket.emit('staff_join_success', {
                customerPhone: customerPhone,
                fullname: activeChats[customerPhone].fullname,
                messages: activeChats[customerPhone].messages
            });

            // Broadcast updated chats to staff dashboard
            io.to('adminRoom').emit('active_chats_updated', getActiveChatsSummary());
        });

        // Route real-time message between customer and staff
        socket.on('send_chat_message', async (data) => {
            const phone = data.phone || data.room;
            const rawSender = data.sender; // 'customer' | 'client' | 'staff'
            const text = data.text;

            if (!phone || !activeChats[phone]) {
                console.log(`[LiveChat] [WARNING] Chat session not found for phone: ${phone}`);
                return;
            }

            const sender = (rawSender === 'staff' || rawSender === 'admin') ? 'staff' : 'customer';

            const msgObj = {
                sender: sender,
                text: text,
                timestamp: new Date()
            };

            // Save to memory log
            activeChats[phone].messages.push(msgObj);

            // Persist to DB
            if (pool && sql && activeChats[phone].dbSessionId) {
                try {
                    await pool.request()
                        .input('sessionId', sql.UniqueIdentifier, activeChats[phone].dbSessionId)
                        .input('sender', sql.NVarChar, sender)
                        .input('text', sql.NVarChar, text)
                        .query(`
                            INSERT INTO ChatMessages (sessionId, sender, text, timestamp) 
                            VALUES (@sessionId, @sender, @text, GETDATE())
                        `);
                } catch (e) {
                    console.error('DB Error inserting chat message:', e);
                }
            }

            console.log(`[LiveChat] [${sender.toUpperCase()}] to ${phone}: ${text}`);

            if (sender === 'customer') {
                // Forward to admins in adminRoom
                io.to('adminRoom').emit('receive_chat_message', {
                    customerPhone: phone,
                    sender: 'customer',
                    text: text,
                    message: msgObj
                });
            } else {
                // Forward to customer in userRoom_${phone}
                io.to(`userRoom_${phone}`).emit('receive_chat_message', {
                    customerPhone: phone,
                    sender: 'staff',
                    text: text,
                    message: msgObj
                });
            }

            // Broadcast updated active chats list to all admins (triggers automatic UI and message list re-render)
            io.to('adminRoom').emit('active_chats_updated', getActiveChatsSummary());
        });

        // Terminate chat session
        socket.on('end_live_chat', async (data) => {
            const { phone, sender } = data;
            if (!phone || !activeChats[phone]) return;

            console.log(`[LiveChat] Chat ended for client (${phone}) by ${sender}`);

            // Persist to DB
            if (pool && sql && activeChats[phone].dbSessionId) {
                try {
                    await pool.request()
                        .input('id', sql.UniqueIdentifier, activeChats[phone].dbSessionId)
                        .query(`UPDATE ChatSessions SET status = 'ended', endedAt = GETDATE() WHERE id = @id`);
                } catch (e) {
                    console.error('DB Error ending chat session:', e);
                }
            }

            // Notify client
            io.to(`userRoom_${phone}`).emit('chat_session_ended', {
                message: 'Cuộc trò chuyện đã kết thúc. Trợ lý ảo AI sẽ tiếp tục hỗ trợ bạn!'
            });

            // Cleanup
            delete activeChats[phone];

            // Broadcast update to admins
            io.to('adminRoom').emit('active_chats_updated', getActiveChatsSummary());
            io.to('adminRoom').emit('chat_session_ended_admin', { customerPhone: phone });
        });
        // --- SHIPPER LOCATION EVENTS (Legacy fallback) ---
        socket.on('shipperLocation', async (data) => {
            const { orderId, lat, lng, phone, isOnline } = data;
            io.emit('shipperLocation', data);
        });

        socket.on('error', (err) => {
            console.error(`[Socket] Connection error on socket ${socket.id}:`, err);
        });

        socket.on('disconnect', async () => {
            // ... (keep disconnect logic for live chat)
            for (const phone in activeChats) {
                if (activeChats[phone].socketId === socket.id) {
                    if (pool && sql && activeChats[phone].dbSessionId) {
                        try {
                            await pool.request()
                                .input('id', sql.UniqueIdentifier, activeChats[phone].dbSessionId)
                                .query(`UPDATE ChatSessions SET status = 'ended', endedAt = GETDATE() WHERE id = @id`);
                        } catch (e) {}
                    }
                    io.to('adminRoom').emit('chat_session_ended_admin', { customerPhone: phone });
                    delete activeChats[phone];
                    io.to('adminRoom').emit('active_chats_updated', getActiveChatsSummary());
                    break;
                }
            }
        });
    });

    // --- SHIPPER LOCATION NAMESPACE ---
    const shipperIo = io.of('/shipperLocation');
    shipperIo.on('connection', (socket) => {
        console.log('Shipper / Customer connected to /shipperLocation:', socket.id);

        socket.on('shipperLocation', async (data) => {
            const { orderId, lat, lng, phone, isOnline } = data;
            // Broadcast to all clients (customers tracking orders) in this namespace
            shipperIo.emit('shipperLocation', data);

            // Persist shipper location to DB
            if (pool && sql && phone) {
                try {
                    await pool.request()
                        .input('phone', sql.NVarChar, phone)
                        .input('lat', sql.Float, lat)
                        .input('lng', sql.Float, lng)
                        .input('isOnline', sql.Bit, isOnline ? 1 : 0)
                        .query(`
                            UPDATE Users 
                            SET currentLat = @lat, currentLng = @lng, isOnline = @isOnline 
                            WHERE phone = @phone AND userType = 3
                        `);
                } catch (e) {
                    console.error('DB Error updating shipper location:', e);
                }
            }
        });
    });

    return { activeChats, getActiveChatsSummary };
};
