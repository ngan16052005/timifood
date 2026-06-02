async function showContacts() {
    try {
        const response = await fetch('/api/contacts', {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            }
        });
        const contacts = await response.json();

        const searchQuery = document.getElementById('form-search-contact')?.value.toLowerCase() || "";

        const filtered = contacts.filter(c =>
            (c.name && c.name.toLowerCase().includes(searchQuery)) ||
            (c.email && c.email.toLowerCase().includes(searchQuery)) ||
            (c.subject && c.subject.toLowerCase().includes(searchQuery))
        );

        let html = "";
        if (filtered.length === 0) {
            html = `<tr><td colspan="6" style="text-align: center;">Không có liên hệ nào</td></tr>`;
        } else {
            filtered.forEach(c => {
                let statusBadge = '';
                if (c.status == 0) {
                    statusBadge = `<span style="background: #fee2e2; color: #ef4444; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">Chưa đọc</span>`;
                } else if (c.status == 1) {
                    statusBadge = `<span style="background: #fef08a; color: #a16207; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">Đã đọc</span>`;
                } else {
                    statusBadge = `<span style="background: #dcfce3; color: #22c55e; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">Đã phản hồi</span>`;
                }

                html += `
                <tr style="${c.status == 0 ? 'background-color: #f8fafc;' : ''}">
                    <td style="${c.status == 0 ? 'font-weight: bold;' : ''}">${c.name}</td>
                    <td>${c.email}</td>
                    <td style="${c.status == 0 ? 'font-weight: bold;' : ''}">${c.subject}</td>
                    <td>${formatDate(c.createdAt)}</td>
                    <td>${statusBadge}</td>
                    <td>
                        <button class="btn-detail" onclick='viewContact(${JSON.stringify(c).replace(/'/g, "&#39;")})' title="Xem chi tiết & Phản hồi"><i class="fa-regular fa-eye"></i></button>
                        <button class="btn-delete" onclick="deleteContact('${c.id}')" title="Xóa"><i class="fa-regular fa-trash"></i></button>
                    </td>
                </tr>`;
            });
        }

        const tbody = document.getElementById('show-contacts');
        if (tbody) tbody.innerHTML = html;

    } catch (error) {
        console.error("Error fetching contacts:", error);
    }
}

function viewContact(contact) {
    const content = document.getElementById('contact-detail-content');
    if (content) {
        content.innerHTML = `
            <div style="margin-bottom: 15px;"><strong>Người gửi:</strong> ${contact.name} (${contact.email})</div>
            <div style="margin-bottom: 15px;"><strong>Thời gian:</strong> ${formatDate(contact.createdAt)}</div>
            <div style="margin-bottom: 15px;"><strong>Tiêu đề:</strong> ${contact.subject}</div>
            <div style="margin-bottom: 15px;"><strong>Nội dung:</strong></div>
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; white-space: pre-wrap; border: 1px solid #e2e8f0; margin-bottom: 20px;">${contact.message}</div>
            
            <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 20px;">
                <h4 style="margin-bottom: 10px; color: #1e293b;">Soạn tin nhắn phản hồi</h4>
                ${contact.status == 2 ? '<div style="margin-bottom: 10px; color: #16a34a; font-size: 13px; font-weight: 600;"><i class="fa-solid fa-circle-check"></i> Đã gửi phản hồi cho liên hệ này</div>' : ''}
                <textarea id="contact-reply-msg" placeholder="Nhập nội dung phản hồi gửi qua email cho khách..." style="width: 100%; min-height: 100px; padding: 12px; border: 1px solid #cbd5e1; border-radius: 8px; outline: none; margin-bottom: 10px; resize: vertical;"></textarea>
                <div style="text-align: right;">
                    <button id="btn-send-reply" onclick="sendContactReply('${contact.id}')" style="background-color: var(--red); color: white; border: none; padding: 10px 20px; border-radius: 6px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 8px;">
                        <i class="fa-light fa-paper-plane-top"></i> Gửi phản hồi
                    </button>
                </div>
            </div>
        `;
    }

    document.querySelector('.view-contact-modal').classList.add('open');

    // Mark as read if unread
    if (contact.status == 0) {
        fetch(`/api/contacts/${contact.id}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            },
            body: JSON.stringify({ status: 1 })
        }).then(() => {
            showContacts();
        });
    }
}

async function sendContactReply(id) {
    const msgInput = document.getElementById('contact-reply-msg');
    const replyMessage = msgInput.value.trim();
    
    if (!replyMessage) {
        if(typeof toast === 'function') toast({ title: 'Lỗi', message: 'Vui lòng nhập nội dung phản hồi!', type: 'warning', duration: 3000 });
        else alert('Vui lòng nhập nội dung phản hồi!');
        return;
    }
    
    const btn = document.getElementById('btn-send-reply');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Đang gửi...';
    btn.disabled = true;

    try {
        const response = await fetch(`/api/contacts/${id}/reply`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            },
            body: JSON.stringify({ replyMessage })
        });
        
        const result = await response.json();
        if (response.ok && result.success) {
            toast({ title: 'Thành công', message: 'Đã gửi phản hồi qua email!', type: 'success', duration: 3000 });
            msgInput.value = '';
            showContacts();
            closeContactModal();
        } else {
            throw new Error(result.message || 'Lỗi gửi phản hồi');
        }
    } catch (error) {
        console.error("Error sending reply:", error);
        toast({ title: 'Lỗi', message: 'Không thể gửi phản hồi. Vui lòng thử lại!', type: 'error', duration: 3000 });
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

function closeContactModal() {
    document.querySelector('.view-contact-modal').classList.remove('open');
}

async function deleteContact(id) {
    if (confirm("Bạn có chắc chắn muốn xóa liên hệ này?")) {
        try {
            const response = await fetch(`/api/contacts/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('token')
                }
            });
            
            if (response.ok) {
                toast({ title: 'Thành công', message: 'Đã xóa liên hệ!', type: 'success', duration: 2000 });
                showContacts();
            } else {
                toast({ title: 'Lỗi', message: 'Không thể xóa liên hệ!', type: 'error', duration: 2000 });
            }
        } catch (error) {
            console.error("Error deleting contact:", error);
        }
    }
}

// ==========================================