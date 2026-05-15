
// Admin Notifications Logic
let adminNotifications = JSON.parse(localStorage.getItem('adminNotifications')) || [];

function addAdminNotification(title, message, type = 'info') {
    console.log(`[Notification] Adding: ${title} - ${message}`);
    const newNoti = {
        id: Date.now(),
        title: title,
        message: message,
        time: new Date().toLocaleString('vi-VN'),
        type: type,
        read: false
    };
    adminNotifications.unshift(newNoti);
    if (adminNotifications.length > 50) adminNotifications.pop();
    
    localStorage.setItem('adminNotifications', JSON.stringify(adminNotifications));
    updateAdminNotificationUI();
    
    // Play sound alert
    if (title.toLowerCase().includes('đơn hàng mới')) {
        playNotificationSound('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    } else if (title.toLowerCase().includes('hủy')) {
        playNotificationSound('https://assets.mixkit.co/active_storage/sfx/1110/1110-preview.mp3');
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

function markAdminNotificationsAsRead() {
    adminNotifications = adminNotifications.map(n => ({ ...n, read: true }));
    localStorage.setItem('adminNotifications', JSON.stringify(adminNotifications));
    updateAdminNotificationUI();
}

function clearAllAdminNotifications(event) {
    if (event) event.stopPropagation();
    adminNotifications = [];
    localStorage.setItem('adminNotifications', JSON.stringify(adminNotifications));
    updateAdminNotificationUI();
}


function markAsRead(id) {
    adminNotifications = adminNotifications.map(n => n.id === id ? { ...n, read: true } : n);
    localStorage.setItem('adminNotifications', JSON.stringify(adminNotifications));
    updateAdminNotificationUI();
}

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
        audio.play().catch(e => {
            console.warn("Audio blocked by browser. Click anywhere to enable sound.", e);
        });
    } catch (e) {
        console.error("Audio error:", e);
    }
}


