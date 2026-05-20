// Factory function - nhận io từ server.js
module.exports = function({ io }) {

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
        socket.on('client_request_live_chat', (data) => {
            const { phone, fullname } = data;
            if (!phone) return;

            console.log(`[LiveChat] Customer ${fullname} (${phone}) requested live support.`);
            
            // Initialize active chat session
            activeChats[phone] = {
                socketId: socket.id,
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
        socket.on('staff_join_chat', (data) => {
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
        socket.on('send_chat_message', (data) => {
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
        socket.on('end_live_chat', (data) => {
            const { phone, sender } = data;
            if (!phone || !activeChats[phone]) return;

            console.log(`[LiveChat] Chat ended for client (${phone}) by ${sender}`);

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

        socket.on('error', (err) => {
            console.error(`[Socket] Connection error on socket ${socket.id}:`, err);
        });

        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
            
            // Find if disconnected user had an active chat session
            for (const phone in activeChats) {
                if (activeChats[phone].socketId === socket.id) {
                    console.log(`[LiveChat] Client (${phone}) disconnected, ending chat session`);
                    io.to('adminRoom').emit('chat_session_ended_admin', { customerPhone: phone });
                    delete activeChats[phone];
                    io.to('adminRoom').emit('active_chats_updated', getActiveChatsSummary());
                    break;
                }
            }
        });
    });

    return { activeChats, getActiveChatsSummary };
};
