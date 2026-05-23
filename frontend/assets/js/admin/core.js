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
            localStorage.removeItem("currentuser");
            localStorage.removeItem("token");
            window.location.href = "index.html";
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

    const quickSearch = document.getElementById('quick-search-admin');
    if (quickSearch) {
        quickSearch.addEventListener('input', async (e) => {
            const query = e.target.value.toLowerCase();
            if (query.length > 0) {
                const orderTab = document.querySelector('.sidebar-list-item:nth-child(5)');
                if (orderTab && !orderTab.classList.contains('active')) {
                    orderTab.click();
                }
                const searchInput = document.getElementById('form-search-order');
                if (searchInput) {
                    searchInput.value = query;
                    findOrder();
                }
            }
        });
    }

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

        // Các index menu cần ẩn: 0: Tổng quát, 1: Sản phẩm, 2: Danh mục, 3: Tài khoản, 5: Nhập kho, 6: Khuyến mãi, 7: Thống kê, 8: Đánh giá, 9: Nhật ký
        const forbiddenIndexes = [0, 1, 2, 3, 5, 6, 7, 8, 9];
        forbiddenIndexes.forEach(index => {
            if (sidebarItems[index]) sidebarItems[index].style.display = 'none';
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
        // Chỉ cho phép Staff truy cập Đơn hàng (Index 4) và Hỗ trợ trực tuyến (Index 10)
        const forbiddenForStaff = [0, 1, 2, 3, 5, 6, 7, 8, 9];
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

        // Nếu là tab Nhập kho (Index 5)
        if (i === 5) {
            await showStockHistory();
        }

        // Nếu là tab Thống kê (Index 7)
        if (i === 7) {
            await thongKe(0);
        }

        // Nếu là tab Đánh giá (Index 8)
        if (i === 8) {
            await showReviews();
        }

        // Nếu là tab Nhật ký hệ thống (Index 9)
        if (i === 9) {
            await showLogs();
        }

        // Nếu là tab Hỗ trợ trực tuyến (Index 10)
        if (i === 10) {
            await loadLiveChatSessionsAdmin();
        }

        // Nếu là tab Liên hệ (Index 11)
        if (i === 11) {
            await showContacts();
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

function displayList(productAll, perPage, currentPage) {
    let start = (currentPage - 1) * perPage;
    let end = (currentPage - 1) * perPage + perPage;
    let productShow = productAll.slice(start, end);
    showProductArr(productShow);
}

function setupPagination(productAll, perPage) {
    document.querySelector('.page-nav-list').innerHTML = '';
    let page_count = Math.ceil(productAll.length / perPage);
    for (let i = 1; i <= page_count; i++) {
        let li = paginationChange(i, productAll, currentPage);
        document.querySelector('.page-nav-list').appendChild(li);
    }
}

function paginationChange(page, productAll, currentPage) {
    let node = document.createElement(`li`);
    node.classList.add('page-nav-item');
    node.innerHTML = `<a href="#">${page}</a>`;
    if (currentPage == page) node.classList.add('active');
    node.addEventListener('click', function () {
        currentPage = page;
        displayList(productAll, perPage, currentPage);
        let t = document.querySelectorAll('.page-nav-item.active');
        for (let i = 0; i < t.length; i++) {
            t[i].classList.remove('active');
        }
        node.classList.add('active');
    })
    return node;
}
let productsData = []; // Global products data storage

// Hiển thị danh sách sản phẩm 