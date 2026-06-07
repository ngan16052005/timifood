// Image Lazy Loading Fade-in
document.addEventListener('load', (e) => {
    if (e.target.tagName === 'IMG') {
        e.target.classList.add('loaded');
    }
}, true);

console.log("Admin JS loaded - Review Update v2");

function checkLogin() {
    const currentUser = JSON.parse(localStorage.getItem('currentuser'));
    if (!currentUser || (currentUser.userType != 1 && currentUser.userType != 2)) {
        document.querySelector("body").innerHTML = `<div class="access-denied-section">
            <img class="access-denied-img" src="./assets/img/access-denied.webp" alt="" loading="lazy">
        </div>`;
        return false;
    }
    return true;
}

window.onload = async () => {
    if (!checkLogin()) return;

    const currentUser = JSON.parse(localStorage.getItem("currentuser"));
    applyPermissions(currentUser.userType);

    // Attach logout listener
    const logoutBtn = document.getElementById("logout-acc");
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (typeof socket !== 'undefined' && socket) {
                socket.disconnect();
            }
            localStorage.removeItem("currentuser");
            localStorage.removeItem("token");
            fetch(`${window.BACKEND_URL || ''}/api/logout`, { method: 'POST' }).finally(() => {
                window.location.href = "index.html";
            });
        });
    }

    // Initialize Notification System UI
    const adminNotiBtn = document.getElementById('admin-notification-btn');
    const adminNotiDropdown = document.getElementById('admin-notification-dropdown');

    if (adminNotiBtn && adminNotiDropdown) {
        if (typeof updateAdminNotificationUI === 'function') {
            updateAdminNotificationUI();
        }

        adminNotiBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            adminNotiDropdown.classList.toggle('active');
        });

        document.addEventListener('click', (e) => {
            if (!adminNotiBtn.contains(e.target)) {
                adminNotiDropdown.classList.remove('active');
            }
        });

        adminNotiDropdown.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    // Profile Dropdown Toggle
    const adminProfileBtn = document.getElementById('admin-profile-btn');
    const adminProfileDropdown = document.getElementById('admin-profile-dropdown');

    if (adminProfileBtn && adminProfileDropdown) {
        adminProfileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            adminProfileBtn.classList.toggle('active');
            adminProfileDropdown.classList.toggle('active');
        });

        document.addEventListener('click', (e) => {
            if (!adminProfileBtn.contains(e.target)) {
                adminProfileBtn.classList.remove('active');
                adminProfileDropdown.classList.remove('active');
            }
        });
    }

    // Header Title and Quick Search
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    const headerTitle = document.getElementById('admin-header-title');

    sidebarLinks.forEach(link => {
        link.addEventListener('click', function () {
            const sidebarText = this.querySelector('.hidden-sidebar');
            if (sidebarText && headerTitle) {
                const sectionName = sidebarText.innerText;
                if (sectionName !== 'Đăng xuất' && sectionName !== 'Trang chủ') {
                    headerTitle.innerText = sectionName;
                }
            }
        });
    });



    try {
        await initAdmin();
    } catch (err) {
        console.error("Admin init failed:", err);
    }

    // Set admin names
    if (currentUser) {
        const nameAcc = document.getElementById("name-acc");
        if (nameAcc) nameAcc.innerHTML = currentUser.fullname;

        const topName = document.getElementById('admin-top-name');
        if (topName) topName.innerText = currentUser.fullname;

        const topRole = document.querySelector('.admin-role');
        if (topRole) {
            let roleText = "Người quản lý";
            if (currentUser.userType == 1) {
                roleText = "Quản trị viên";
            } else if (currentUser.userType == 2) {
                roleText = "Nhân viên";
            }
            topRole.innerHTML = `${roleText} <i class="fa-solid fa-chevron-down"></i>`;
        }
    }
};

function applyPermissions(userType) {
    const sidebarItems = document.querySelectorAll(".sidebar-list-item");
    const sections = document.querySelectorAll(".section");

    if (userType == 2) { // Nhân viên (Staff)
        console.log("Quyền hạn: Nhân viên - Chỉ xem Đơn hàng & Hỗ trợ trực tuyến");

        // Các index menu cần ẩn: 0: Tổng quát, 1: Sản phẩm, 2: Danh mục, 3: Tài khoản, 5: Nhập kho, 6: Khuyến mãi, 7: Thống kê, 8: Đánh giá, 9: Nhật ký, 11: Liên hệ, 12: Tin tức
        const forbiddenIndexes = [0, 1, 2, 3, 5, 6, 7, 8, 9, 11, 12];
        forbiddenIndexes.forEach(index => {
            if (sidebarItems[index]) sidebarItems[index].style.display = 'none';
        });

        // Ẩn các tiêu đề (sidebar-group) nếu tất cả các item con của nó đều bị ẩn
        const sidebarGroups = document.querySelectorAll(".sidebar-group");
        sidebarGroups.forEach(group => {
            const items = group.querySelectorAll(".sidebar-list-item");
            let allHidden = true;
            items.forEach(item => {
                if (item.style.display !== 'none') {
                    allHidden = false;
                }
            });
            if (allHidden) {
                group.style.display = 'none';
            }
        });

        // Tự động gỡ bỏ active khỏi các mục khác và chuyển sang mục Đơn hàng (Index 4)
        const activeSidebar = document.querySelector(".sidebar-list-item.active");
        if (activeSidebar) activeSidebar.classList.remove("active");

        const activeSection = document.querySelector(".section.active");
        if (activeSection) activeSection.classList.remove("active");

        if (sidebarItems[4] && sections[4]) {
            sidebarItems[4].classList.add("active");
            sections[4].classList.add("active");

            // Cập nhật tiêu đề tiêu đề header
            const headerTitle = document.getElementById('admin-header-title');
            if (headerTitle) headerTitle.innerText = "Đơn hàng";
        }
    }
}


//do sidebar open and close
const menuIconButton = document.querySelector(".menu-icon-btn");
const sidebar = document.querySelector(".sidebar");
menuIconButton.addEventListener("click", () => {
    sidebar.classList.toggle("open");
});

// log out admin user
/*
let toogleMenu = document.querySelector(".profile");
let mune = document.querySelector(".profile-cropdown");
toogleMenu.onclick = function () {
    mune.classList.toggle("active");
};
*/

// tab for section
const sidebars = document.querySelectorAll(".sidebar-list-item.tab-content");
const sections = document.querySelectorAll(".section");

for (let i = 0; i < sidebars.length; i++) {
    sidebars[i].onclick = async function () {
        const currentUser = JSON.parse(localStorage.getItem("currentuser"));
        const isAdmin = currentUser && currentUser.userType == 1;
        const isStaff = currentUser && currentUser.userType == 2;

        // Kiểm tra quyền truy cập cho nhân viên
        // Chỉ cho phép Staff truy cập Đơn hàng (Index 4), Hỗ trợ trực tuyến (Index 10)
        const forbiddenForStaff = [0, 1, 2, 3, 5, 6, 7, 8, 9, 11, 12];
        if (isStaff && forbiddenForStaff.includes(i)) {
            toast({ title: 'Từ chối', message: 'Bạn không có quyền truy cập mục này!', type: 'error', duration: 3000 });
            return;
        }

        // Kiểm tra an toàn cho các trường hợp khác (không phải admin/staff)
        if (!isAdmin && !isStaff) {
            window.location.href = "index.html";
            return;
        }

        document.querySelector(".sidebar-list-item.active").classList.remove("active");
        document.querySelector(".section.active").classList.remove("active");
        sidebars[i].classList.add("active");
        sections[i].classList.add("active");

        // Nếu là tab Danh mục (Index 2)
        if (i === 2) {
            await showCategories();
        }

        // Nếu là tab Đơn hàng (Index 4)
        if (i === 4) {
            // Tự động đánh dấu các thông báo đơn hàng là đã đọc
            if (typeof adminNotifications !== 'undefined') {
                const unreadOrderNotis = adminNotifications.filter(n => !n.read && (n.type === 'order' || (n.title && n.title.toLowerCase().includes('đơn hàng'))));
                if (unreadOrderNotis.length > 0) {
                    for (let noti of unreadOrderNotis) {
                        if (typeof markAsRead === 'function') {
                            markAsRead(noti.id);
                        }
                    }
                }
            }
        }

        // Nếu là tab Nhập kho (Index 5)
        if (i === 5) {
            await loadPurchaseOrders();
            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.inventory-tab-content').forEach(content => content.style.display = 'none');
            document.querySelector('.tab-btn[onclick="switchInventoryTab(\\\'purchase-orders\\\')"]').classList.add('active');
            document.getElementById('tab-purchase-orders').style.display = 'block';
        }

        // Nếu là tab Thống kê (Index 7)
        if (i === 7) {
            await thongKe(0);
        }

        // Nếu là tab Đánh giá (Index 8)
        if (i === 8) {
            await showReviews();
            if (typeof adminNotifications !== 'undefined') {
                const unreadNotis = adminNotifications.filter(n => !n.read && (n.type === 'review' || (n.title && n.title.toLowerCase().includes('đánh giá'))));
                if (unreadNotis.length > 0) {
                    for (let noti of unreadNotis) {
                        if (typeof markAsRead === 'function') markAsRead(noti.id);
                    }
                }
            }
        }

        // Nếu là tab Nhật ký hệ thống (Index 9)
        if (i === 9) {
            await showLogs();
        }

        // Nếu là tab Hỗ trợ trực tuyến (Index 10)
        if (i === 10) {
            await loadLiveChatSessionsAdmin();
            if (typeof adminNotifications !== 'undefined') {
                const unreadNotis = adminNotifications.filter(n => !n.read && (n.type === 'chat' || (n.title && n.title.toLowerCase().includes('tin nhắn'))));
                if (unreadNotis.length > 0) {
                    for (let noti of unreadNotis) {
                        if (typeof markAsRead === 'function') markAsRead(noti.id);
                    }
                }
            }
        }

        // Nếu là tab Liên hệ (Index 11)
        if (i === 11) {
            await showContacts();
            if (typeof adminNotifications !== 'undefined') {
                const unreadNotis = adminNotifications.filter(n => !n.read && (n.type === 'contact' || (n.title && n.title.toLowerCase().includes('liên hệ'))));
                if (unreadNotis.length > 0) {
                    for (let noti of unreadNotis) {
                        if (typeof markAsRead === 'function') markAsRead(noti.id);
                    }
                }
            }
        }

        // Nếu là tab Tin tức (Index 12)
        if (i === 12) {
            if (typeof showNews === 'function') {
                await showNews();
            }
        }
    };
}

const closeBtn = document.querySelectorAll('.section');
console.log(closeBtn[0])
for (let i = 0; i < closeBtn.length; i++) {
    closeBtn[i].addEventListener('click', (e) => {
        sidebar.classList.add("open");
    })
}

// Get amount product
function getAmoumtProduct(products) {
    return products.length;
}

// Get amount user
function getAmoumtUser(users) {
    return users.length;
}

// Get total money (Only include Paid orders)
function getMoney(orders) {
    let tongtien = 0;
    if (Array.isArray(orders)) {
        orders.forEach(item => {
            if (item.trangthai == 2) {
                tongtien += item.tongtien || 0;
            }
        });
    }
    return tongtien;
}



// Doi sang dinh dang tien VND
function vnd(price) {
    if (price === null || price === undefined || isNaN(price)) return '0đ';
    return price.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
}

// Phân trang 
let perPage = 12;
let currentPage = 1;
let totalPage = 0;
let perProducts = [];

function displayList(productShow) {
    showProductArr(productShow);
}

function setupPagination(totalPages) {
    document.querySelector('.page-nav-list').innerHTML = '';
    for (let i = 1; i <= totalPages; i++) {
        let li = paginationChange(i);
        document.querySelector('.page-nav-list').appendChild(li);
    }
}

function printAdminInvoice(invoiceHTML) {
    let printWindow = window.open('', '_blank');
    printWindow.document.write(invoiceHTML);
    printWindow.document.close();
    printWindow.print();
}

// Global Admin Search Logic
let cachedAdminData = { products: null, orders: null, users: null };

async function loadAdminDataIfNeeded() {
    try {
        if (!cachedAdminData.products) cachedAdminData.products = await window.api.getProducts("", true);
    } catch (e) { cachedAdminData.products = []; }

    try {
        if (!cachedAdminData.orders) cachedAdminData.orders = await window.api.getOrders(true);
    } catch (e) { cachedAdminData.orders = []; }

    try {
        if (!cachedAdminData.users) cachedAdminData.users = await window.api.getUsers(true);
    } catch (e) { cachedAdminData.users = []; }
}

async function handleGlobalAdminSearch() {
    const input = document.getElementById('quick-search-admin').value.trim().toLowerCase();
    const suggestBox = document.getElementById('admin-search-suggest');
    
    if (input === "") {
        suggestBox.classList.remove('show');
        return;
    }

    // Show loading text while fetching initially
    if (!cachedAdminData.products || !cachedAdminData.orders || !cachedAdminData.users) {
        suggestBox.innerHTML = '<div class="admin-suggest-empty">Đang tải dữ liệu...</div>';
        suggestBox.classList.add('show');
        await loadAdminDataIfNeeded();
    }

    const products = Array.isArray(cachedAdminData.products) ? cachedAdminData.products : [];
    const orders = Array.isArray(cachedAdminData.orders) ? cachedAdminData.orders : [];
    const users = Array.isArray(cachedAdminData.users) ? cachedAdminData.users : [];

    const currentUser = JSON.parse(localStorage.getItem("currentuser"));
    const isStaff = currentUser && currentUser.userType == 2;

    // Filter Products (Skip if Staff)
    let pResult = isStaff ? [] : products.filter(p => (p.title || "").toLowerCase().includes(input) || String(p.id || "").toLowerCase().includes(input)).slice(0, 3);
    // Filter Orders
    let oResult = orders.filter(o => String(o.id || "").toLowerCase().includes(input) || String(o.khachhang || "").toLowerCase().includes(input)).slice(0, 3);
    // Filter Users (Skip if Staff)
    let uResult = isStaff ? [] : users.filter(u => String(u.phone || "").includes(input) || (u.name || "").toLowerCase().includes(input)).slice(0, 3);

    if (pResult.length === 0 && oResult.length === 0 && uResult.length === 0) {
        suggestBox.innerHTML = '<div class="admin-suggest-empty">Không tìm thấy kết quả nào.</div>';
        return;
    }

    let html = '';

    // Render Orders
    oResult.forEach(o => {
        html += `
        <div class="admin-suggest-item" onclick="jumpToAdminOrder('${o.id}')">
            <div class="admin-suggest-icon" style="color: #ff9800; background: #fff3e0;"><i class="fa-light fa-receipt"></i></div>
            <div class="admin-suggest-info">
                <span class="admin-suggest-title">Đơn hàng: ${o.id}</span>
                <span class="admin-suggest-subtitle">Khách: ${o.khachhang || 'N/A'} - ${vnd(o.tongtien)}</span>
            </div>
            <span class="admin-suggest-type">Đơn hàng</span>
        </div>`;
    });

    // Render Products
    pResult.forEach(p => {
        let imgSrc = p.img || './assets/img/blank-image.png';
        html += `
        <div class="admin-suggest-item" onclick="jumpToAdminProduct('${p.id}')">
            <div class="admin-suggest-icon" style="background: transparent; padding: 0; overflow: hidden;">
                <img src="${imgSrc}" alt="${p.title}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">
            </div>
            <div class="admin-suggest-info">
                <span class="admin-suggest-title">${p.title}</span>
                <span class="admin-suggest-subtitle">Mã: ${p.id} - ${vnd(p.price)}</span>
            </div>
            <span class="admin-suggest-type">Sản phẩm</span>
        </div>`;
    });

    // Render Users
    uResult.forEach(u => {
        html += `
        <div class="admin-suggest-item" onclick="jumpToAdminUser('${u.phone}')">
            <div class="admin-suggest-icon" style="color: #2196f3; background: #e3f2fd;"><i class="fa-light fa-user"></i></div>
            <div class="admin-suggest-info">
                <span class="admin-suggest-title">${u.name}</span>
                <span class="admin-suggest-subtitle">SĐT: ${u.phone}</span>
            </div>
            <span class="admin-suggest-type">Khách hàng</span>
        </div>`;
    });

    suggestBox.innerHTML = html;
    suggestBox.classList.add('show');
}

// Navigation helpers for search results
function jumpToAdminOrder(id) {
    document.getElementById('quick-search-admin').value = '';
    document.getElementById('admin-search-suggest').classList.remove('show');
    switchAdminTab("Đơn hàng");
    if(typeof detailOrder === 'function') detailOrder(id);
}

function jumpToAdminProduct(id) {
    document.getElementById('quick-search-admin').value = '';
    document.getElementById('admin-search-suggest').classList.remove('show');
    switchAdminTab("Sản phẩm");
    if(typeof editProduct === 'function') editProduct(id);
}

function jumpToAdminUser(phone) {
    document.getElementById('quick-search-admin').value = '';
    document.getElementById('admin-search-suggest').classList.remove('show');
    switchAdminTab("Tài khoản");
    if(typeof editAccount === 'function') editAccount(phone);
}

function switchAdminTab(name) {
    const sidebars = document.querySelectorAll('.sidebar-list-item.tab-content');
    const sections = document.querySelectorAll('.section');
    for (let i = 0; i < sidebars.length; i++) {
        if (sidebars[i].innerText.includes(name)) {
            document.querySelector(".sidebar-list-item.active")?.classList.remove("active");
            document.querySelector(".section.active")?.classList.remove("active");
            sidebars[i].classList.add("active");
            sections[i].classList.add("active");
            break;
        }
    }
}

// Hide suggest box on click outside
document.addEventListener('click', (e) => {
    const suggestBox = document.getElementById('admin-search-suggest');
    const searchInput = document.getElementById('quick-search-admin');
    if (suggestBox && suggestBox.classList.contains('show')) {
        if (!e.target.closest('.header-search')) {
            suggestBox.classList.remove('show');
        }
    }
});

function paginationChange(page) {
    let node = document.createElement(`li`);
    node.classList.add('page-nav-item');
    node.innerHTML = `<a href="#">${page}</a>`;
    if (currentPage == page) node.classList.add('active');
    node.addEventListener('click', function (e) {
        e.preventDefault();
        currentPage = page;
        if (typeof showProduct === 'function') {
            showProduct(); // Reload products from server with new page
        }
    });
    return node;
}
let productsData = []; // Global products data storage

// Hiển thị danh sách sản phẩm 