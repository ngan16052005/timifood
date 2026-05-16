
// Admin Notifications Logic
let adminNotifications = [];
let lastAdminNotiId = null;

async function syncAdminNotifications() {
    try {
        const serverNotis = await window.api.getNotifications();
        if (Array.isArray(serverNotis)) {
            // Check for new notifications to show toast and play sound
            if (serverNotis.length > 0) {
                const latest = serverNotis[0];
                console.log("[Admin Noti] Poll check - Latest ID:", latest.id, "Last ID:", lastAdminNotiId);
                if (lastAdminNotiId !== null && latest.id > lastAdminNotiId && !latest.isRead) {
                    console.log("[Admin Noti] NEW NOTIFICATION DETECTED!");
                    // Show toast notification
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
                    console.log("[Admin Noti] Playing sound for:", latest.title);
                    if (latest.title.toLowerCase().includes('đơn hàng mới') || latest.title.toLowerCase().includes('đặt hàng') || latest.type === 'order') {
                        playNotificationSound('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
                    } else if (latest.title.toLowerCase().includes('hủy') || latest.type === 'cancel') {
                        playNotificationSound('https://assets.mixkit.co/active_storage/sfx/1110/1110-preview.mp3');
                    } else {
                        playNotificationSound(); // Default sound
                    }
                }
                lastAdminNotiId = latest.id;
            }

            adminNotifications = serverNotis.map(n => ({
                id: n.id,
                title: n.title,
                message: n.message,
                time: new Date(n.createdAt.replace('Z', '')).toLocaleString('vi-VN'),
                type: n.type,
                read: n.isRead
            }));
            updateAdminNotificationUI();
        }
    } catch (error) {
        console.error("Sync admin notifications error:", error);
    }
}

// Start syncing periodically every 3 seconds
setInterval(syncAdminNotifications, 3000);

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


