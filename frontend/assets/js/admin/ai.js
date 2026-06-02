// AI COPILOT LOGIC
// ==========================================
async function openAIAssistantModal() {
    const modal = document.getElementById('ai-assistant-modal');
    const loading = document.getElementById('ai-loading');
    const resultContent = document.getElementById('ai-result-content');
    
    modal.classList.add('open');
    loading.style.display = 'flex';
    resultContent.style.display = 'none';
    resultContent.innerHTML = '';

    try {
        // Collect statistics data from DOM
        const quantityProductElement = document.getElementById("quantity-product");
        const quantityOrderElement = document.getElementById("quantity-order");
        const quantitySaleElement = document.getElementById("quantity-sale");
        
        let totalSales = quantitySaleElement ? quantitySaleElement.innerText : '0';
        let totalOrders = quantityOrderElement ? quantityOrderElement.innerText : '0';
        
        // Extract top products from table
        const topProducts = [];
        const tableRows = document.querySelectorAll("#showTk tr");
        tableRows.forEach(row => {
            const cells = row.querySelectorAll('td');
            if(cells.length >= 4) {
                topProducts.push({
                    title: cells[1].innerText,
                    qty: cells[2].innerText,
                    rev: cells[3].innerText
                });
            }
        });

        // Time range
        const timeStart = document.getElementById("time-start-tk")?.value || '';
        const timeEnd = document.getElementById("time-end-tk")?.value || '';
        const dateRange = (timeStart && timeEnd) ? `${timeStart} đến ${timeEnd}` : 'Toàn thời gian';

        // Call backend API
        const response = await fetch('/api/admin/ai-insights', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            },
            body: JSON.stringify({
                dateRange,
                totalSales,
                totalOrders,
                topProducts: topProducts.slice(0, 10) // Send top 10
            })
        });

        const data = await response.json();
        if (response.ok && data.success) {
            let formattedHtml = marked ? marked.parse(data.insight) : data.insight.replace(/\n/g, '<br>');
            resultContent.innerHTML = formattedHtml;
        } else {
            resultContent.innerHTML = `<div style="color: #e74c3c; text-align:center; padding: 20px;"><i class="fa-solid fa-triangle-exclamation" style="font-size:30px; margin-bottom:10px;"></i><br>${data.message || 'Có lỗi xảy ra khi phân tích dữ liệu'}</div>`;
        }
    } catch (error) {
        console.error('AI Insight Error:', error);
        resultContent.innerHTML = `<div style="color: #e74c3c; text-align:center; padding: 20px;">Lỗi kết nối tới AI. Vui lòng thử lại sau.</div>`;
    } finally {
        loading.style.display = 'none';
        resultContent.style.display = 'block';
    }
}

function closeAIAssistantModal() {
    document.getElementById('ai-assistant-modal').classList.remove('open');
}
// --- CHAT HISTORY (Phase 33) ---
function openChatHistoryModal() {
    document.querySelector('.chat-history-modal').classList.add('open');
    loadChatHistory();
}

function closeChatHistoryModal() {
    document.querySelector('.chat-history-modal').classList.remove('open');
}

async function loadChatHistory() {
    const phone = document.getElementById('chat-history-phone').value;
    const date = document.getElementById('chat-history-date').value;
    
    let url = '/api/chat/history?';
    if (phone) url += `phone=${phone}&`;
    if (date) url += `date=${date}`;

    try {
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await response.json();
        
        const tbody = document.getElementById('chat-history-list');
        tbody.innerHTML = '';
        
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center">Không tìm thấy lịch sử chat</td></tr>';
            return;
        }

        data.forEach(session => {
            const statusHtml = session.status === 'ended' 
                ? '<span class="status-badge" style="background:#f1f5f9; color:#64748b; padding:4px 8px; border-radius:4px;">Đã kết thúc</span>'
                : '<span class="status-badge" style="background:#dbeafe; color:#2563eb; padding:4px 8px; border-radius:4px;">Đang chat</span>';
                
            const staffName = session.staffName || '<i>Chưa có</i>';
            const dateStr = new Date(session.createdAt).toLocaleString('vi-VN');

            tbody.innerHTML += `
                <tr>
                    <td>#${session.id}</td>
                    <td>${dateStr}</td>
                    <td>${session.customerName} <br><small>${session.customerPhone}</small></td>
                    <td>${staffName}</td>
                    <td>${statusHtml}</td>
                    <td>
                        <div style="display: flex; gap: 8px; justify-content: center;">
                            <button class="btn-control" style="background:var(--red); color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer;" onclick="viewChatMessages('${session.id}')"><i class="fa-light fa-eye"></i> Xem</button>
                            <button class="btn-control" style="background:#ef4444; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer;" onclick="deleteChatSession('${session.id}')"><i class="fa-light fa-trash"></i> Xóa</button>
                        </div>
                    </td>
                </tr>
            `;
        });
    } catch (err) {
        console.error(err);
        alert('Lỗi khi tải lịch sử chat');
    }
}

function closeChatMessagesModal() {
    document.querySelector('.chat-messages-modal').classList.remove('open');
}

async function viewChatMessages(sessionId) {
    try {
        const response = await fetch(`/api/chat/history/${sessionId}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const messages = await response.json();
        
        const container = document.getElementById('chat-history-messages-content');
        container.innerHTML = '';
        
        if (messages.length === 0) {
            container.innerHTML = '<div style="text-align:center; padding:20px; color:#64748b;">Không có tin nhắn nào trong phiên này.</div>';
        } else {
            messages.forEach(msg => {
                const isCustomer = msg.sender === 'customer';
                const msgClass = isCustomer ? 'message-customer' : 'message-staff';
                const name = isCustomer ? 'Khách hàng' : 'Nhân viên';
                const time = new Date(msg.timestamp).toLocaleTimeString('vi-VN');
                
                container.innerHTML += `
                    <div class="chat-message ${msgClass}">
                        <div class="message-info">
                            <span class="message-sender">${name}</span>
                            <span class="message-time">${time}</span>
                        </div>
                        <div class="message-text">${msg.text}</div>
                    </div>
                `;
            });
        }
        
        document.querySelector('.chat-messages-modal').classList.add('open');
        setTimeout(() => {
            container.scrollTop = container.scrollHeight;
        }, 100);
        
    } catch (err) {
        console.error(err);
        alert('Lỗi khi tải tin nhắn');
    }
}

async function deleteChatSession(sessionId) {
    if (confirm('Bạn có chắc chắn muốn xóa phiên chat này không? Mọi tin nhắn bên trong cũng sẽ bị xóa vĩnh viễn.')) {
        try {
            const response = await fetch(`/api/chat/history/${sessionId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('token')
                }
            });
            
            const result = await response.json();
            if (response.ok && result.success) {
                if (typeof toast === 'function') {
                    toast({ title: 'Thành công', message: 'Đã xóa phiên chat!', type: 'success', duration: 3000 });
                } else {
                    alert('Đã xóa phiên chat!');
                }
                loadChatHistory(); // Tải lại danh sách
            } else {
                throw new Error(result.error || 'Lỗi khi xóa');
            }
        } catch (error) {
            console.error('Error deleting chat session:', error);
            if (typeof toast === 'function') {
                toast({ title: 'Lỗi', message: 'Không thể xóa phiên chat!', type: 'error', duration: 3000 });
            } else {
                alert('Không thể xóa phiên chat!');
            }
        }
    }
}

