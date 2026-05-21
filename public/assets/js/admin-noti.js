// Admin Notifications Logic
let adminNotifications = [];
let lastAdminNotiId = null;

// Socket.io for real-time notifications
const socket = io();

socket.on('connect', () => {
    console.log('[Socket] Connected to server');
    socket.emit('joinAdmin');
    
    // Nếu đây là kết nối lại thành công sau khi mất mạng/restart server
    if (window.socketWasDisconnected) {
        if (typeof toast === 'function') {
            toast({ 
                title: 'Đã kết nối lại', 
                message: 'Hệ thống thông báo thời gian thực đã hoạt động bình thường.', 
                type: 'success', 
                duration: 4000 
            });
        }
        window.socketWasDisconnected = false;
        
        // Đồng bộ lại thông báo từ DB ngay lập tức để không bị lỡ đơn hàng mới phát sinh khi mất kết nối
        syncAdminNotifications();
    }
});

socket.on('disconnect', (reason) => {
    console.warn('[Socket] Disconnected from server:', reason);
    window.socketWasDisconnected = true;
    
    if (typeof toast === 'function') {
        toast({ 
            title: 'Mất kết nối Real-time', 
            message: 'Đang thử tự động kết nối lại tới máy chủ...', 
            type: 'warning', 
            duration: 5000 
        });
    }

    if (reason === 'io server disconnect') {
        // Nếu ngắt kết nối do phía server, kết nối lại thủ công
        socket.connect();
    }
});

socket.on('connect_error', (error) => {
    console.error('[Socket] Connection error:', error);
    window.socketWasDisconnected = true;
});

socket.on('newNotification', (latest) => {
    console.log('[Socket] New notification received:', latest);
    
    // Check if this notification is already in our list
    if (adminNotifications.some(n => n.id === latest.id)) return;

    // Show toast and play sound
    if (typeof toast === 'function') {
        let toastType = 'info';
        if (latest.type === 'order') toastType = 'success';
        if (latest.type === 'cancel' || latest.title.toLowerCase().includes('hủy')) toastType = 'warning';

        toast({ 
            title: latest.title, 
            message: latest.message, 
            type: toastType, 
            duration: 8000 
        });
    }

    // Play appropriate sound
    if (latest.title.toLowerCase().includes('đơn hàng mới') || latest.title.toLowerCase().includes('đặt hàng') || latest.type === 'order') {
        playNotificationSound('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    } else if (latest.title.toLowerCase().includes('hủy') || latest.type === 'cancel') {
        playNotificationSound('https://assets.mixkit.co/active_storage/sfx/1110/1110-preview.mp3');
    } else {
        playNotificationSound(); // Default sound
    }

    // Add to list and update UI
    adminNotifications.unshift({
        id: latest.id,
        title: latest.title,
        message: latest.message,
        time: new Date(latest.createdAt.replace('Z', '')).toLocaleString('vi-VN'),
        type: latest.type,
        read: latest.isRead
    });
    updateAdminNotificationUI();
    
    // Auto refresh specific tabs if active
    if (latest.title && latest.title.toLowerCase().includes('liên hệ')) {
        if (typeof showContacts === 'function') {
            showContacts();
        }
    }
});

async function syncAdminNotifications() {
    try {
        const serverNotis = await window.api.getNotifications();
        if (Array.isArray(serverNotis)) {
            adminNotifications = serverNotis.map(n => ({
                id: n.id,
                title: n.title,
                message: n.message,
                time: new Date(n.createdAt.replace('Z', '')).toLocaleString('vi-VN'),
                type: n.type,
                read: n.isRead
            }));
            updateAdminNotificationUI();
            
            if (adminNotifications.length > 0) {
                lastAdminNotiId = adminNotifications[0].id;
            }
        }
    } catch (error) {
        console.error("Sync admin notifications error:", error);
    }
}

function updateAdminNotificationUI() {
    const list = document.querySelector('.admin-notification-list');
    const badge = document.querySelector('.admin-notification-count');
    
    if (!list) return;
    
    const unreadCount = adminNotifications.filter(n => !n.read).length;
    if (unreadCount > 0) {
        badge.textContent = unreadCount;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
    
    if (adminNotifications.length === 0) {
        list.innerHTML = '<div class="no-notification">Không có thông báo mới</div>';
        return;
    }
    
    list.innerHTML = adminNotifications.map(noti => `
        <li class="admin-noti-item ${noti.read ? '' : 'unread'}" onclick="markAsRead(${noti.id})">
            <span class="admin-noti-title">${noti.title}</span>
            <span class="admin-noti-msg">${noti.message}</span>
            <span class="admin-noti-time">${noti.time}</span>
        </li>
    `).join('');
}

async function markAdminNotificationsAsRead() {
    try {
        await window.api.markAllNotificationsAsRead();
        adminNotifications = adminNotifications.map(n => ({ ...n, read: true }));
        updateAdminNotificationUI();
    } catch (error) {
        console.error("Mark all as read error:", error);
    }
}

async function markAsRead(id) {
    try {
        await window.api.markNotificationAsRead(id);
        adminNotifications = adminNotifications.map(n => n.id === id ? { ...n, read: true } : n);
        updateAdminNotificationUI();
    } catch (error) {
        console.error("Mark as read error:", error);
    }
}

async function clearAllAdminNotifications(event) {
    if (event) event.stopPropagation();
    if (confirm("Bạn có muốn xóa tất cả thông báo?")) {
        try {
            await window.api.deleteAllNotifications();
            adminNotifications = [];
            updateAdminNotificationUI();
        } catch (error) {
            console.error("Delete all notifications error:", error);
        }
    }
}

// Initialization
window.addEventListener('DOMContentLoaded', () => {
    syncAdminNotifications();
});

let audioUnlocked = false;

function unlockAudio() {
    if (audioUnlocked) return;
    const audio = new Audio();
    audio.play().then(() => {
        audioUnlocked = true;
        console.log("Audio system: Ready");
        document.removeEventListener('click', unlockAudio);
        document.removeEventListener('keydown', unlockAudio);
    }).catch(() => {
        // Still blocked, wait for next interaction
    });
}


document.addEventListener('click', unlockAudio);
document.addEventListener('keydown', unlockAudio);

function playNotificationSound(url = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3') {
    try {
        const audio = new Audio(url);
        audio.volume = 1.0;
        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
            playPromise.then(_ => {
                console.log("[Admin Noti] Sound played successfully");
            }).catch(error => {
                console.warn("[Admin Noti] Audio playback failed. Please click on the page to enable sound.", error);
                // Optionally show a small toast or indicator that sound is muted
            });
        }
    } catch (e) {
        console.error("[Admin Noti] Audio system error:", e);
    }
}


