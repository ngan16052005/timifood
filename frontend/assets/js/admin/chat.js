async function loadLiveChatSessionsAdmin() {
    try {
        // Clear badge
        const badge = document.getElementById('livechat-badge');
        if (badge) {
            badge.style.display = 'none';
            badge.textContent = '0';
        }

        const chats = await window.api.getLiveChats();
        activeAdminSessions = Object.values(chats);
        renderChatSessionsAdmin();
    } catch (err) {
        console.error('Failed to load active chats:', err);
    }
}

// Render the list of chat sessions on the left panel
function renderChatSessionsAdmin() {
    const listElement = document.getElementById('chat-sessions-list');
    if (!listElement) return;

    if (activeAdminSessions.length === 0) {
        listElement.innerHTML = '<li class="no-session">Không có phiên hỗ trợ nào hoạt động</li>';
        return;
    }

    listElement.innerHTML = activeAdminSessions.map(session => {
        const isActive = currentActiveCustomerPhone === session.phone ? 'active' : '';
        const statusLabel = session.status === 'waiting' ? 'Đang chờ' : 'Đang chat';
        const lastMsg = (session.messages && session.messages.length > 0) ? session.messages[session.messages.length - 1].text : 'Yêu cầu live chat...';

        return `
            <li class="chat-session-item ${isActive}" onclick="selectCustomerSessionAdmin('${session.phone}')">
                <div class="session-info">
                    <span class="name">${session.fullname || 'Khách hàng'}</span>
                    <span class="phone">SĐT: ${session.phone}</span>
                    <span class="last-message" style="font-size: 12px; color: #64748b; text-overflow: ellipsis; white-space: nowrap; overflow: hidden; max-width: 180px; display: inline-block;">${lastMsg}</span>
                </div>
                <span class="session-status ${session.status}">${statusLabel}</span>
            </li>
        `;
    }).join('');
}

// Select and open chat session with a customer
function selectCustomerSessionAdmin(phone) {
    const session = activeAdminSessions.find(s => s.phone === phone);
    if (!session) return;

    currentActiveCustomerPhone = phone;

    // UI Updates
    document.getElementById('chat-window-placeholder').style.display = 'none';
    document.getElementById('chat-window-active').style.display = 'flex';
    document.getElementById('chat-customer-name').innerText = session.fullname || 'Khách hàng';
    document.getElementById('chat-customer-phone').innerText = `SĐT: ${session.phone}`;

    renderChatSessionsAdmin(); // update active styling in list

    // Join live chat session via socket
    const currentUser = JSON.parse(localStorage.getItem('currentuser'));
    const staffName = currentUser ? currentUser.fullname : 'Nhân viên';
    const staffPhone = currentUser ? currentUser.phone : '';

    if (typeof socket !== 'undefined') {
        socket.emit('staff_join_chat', {
            customerPhone: phone,
            staffPhone: staffPhone,
            staffName: staffName
        });
    }

    renderActiveChatMessages(session.messages);
}

// Render message logs
function renderActiveChatMessages(messages) {
    const msgContainer = document.getElementById('chat-window-messages');
    if (!msgContainer) return;

    if (!messages || messages.length === 0) {
        msgContainer.innerHTML = '<div style="text-align: center; color: #94a3b8; font-size: 13px; margin-top: 20px;">Chưa có tin nhắn nào trong phiên này</div>';
        return;
    }

    msgContainer.innerHTML = messages.map(msg => {
        const isCustomer = msg.sender === 'customer';
        const senderClass = isCustomer ? 'customer' : 'staff';
        const formattedTime = new Date(msg.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

        return `
            <div class="chat-msg-admin ${senderClass}">
                <div class="chat-msg-text">${msg.text}</div>
                <span class="chat-msg-time">${formattedTime}</span>
            </div>
        `;
    }).join('');

    // Auto scroll to bottom
    setTimeout(() => {
        msgContainer.scrollTop = msgContainer.scrollHeight;
    }, 50);
}

// Send Admin Chat Message
function sendAdminChatMessage() {
    const input = document.getElementById('chat-admin-input');
    if (!input || !input.value.trim() || !currentActiveCustomerPhone) return;

    const messageText = input.value.trim();
    input.value = '';

    if (typeof socket !== 'undefined') {
        socket.emit('send_chat_message', {
            room: currentActiveCustomerPhone,
            sender: 'staff',
            text: messageText
        });
    }
}

// Handle enter key to send message
function handleAdminChatKeypress(event) {
    if (event.key === 'Enter') {
        sendAdminChatMessage();
    }
}

// End Live Chat Session (Admin closes it)
function endLiveChatSessionAdmin() {
    if (!currentActiveCustomerPhone) return;

    if (confirm('Bạn có chắc chắn muốn đóng phiên hỗ trợ trực tuyến này? Khách hàng sẽ được trả lại cho AI Bot.')) {
        if (typeof socket !== 'undefined') {
            socket.emit('end_live_chat', {
                customerPhone: currentActiveCustomerPhone
            });
        }
        closeActiveChatWindow();
    }
}

// Close and clean UI active session
function closeActiveChatWindow() {
    currentActiveCustomerPhone = null;
    document.getElementById('chat-window-active').style.display = 'none';
    document.getElementById('chat-window-placeholder').style.display = 'flex';
    renderChatSessionsAdmin();
}

// ============================================
//               CONTACTS MANAGEMENT
// ============================================
