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
function showProductArr(arr) {
    let productHtml = "";
    if (arr.length == 0) {
        productHtml = `<div class="no-result"><div class="no-result-i"><i class="fa-light fa-face-sad-cry"></i></div><div class="no-result-h">Không có sản phẩm để hiển thị</div></div>`;
    } else {
        arr.forEach(product => {
            let btnCtl = product.status == 1 ?
                `<button class="btn-detail" onclick="hideProduct(${product.id})" title="Ẩn sản phẩm"><i class="fa-regular fa-eye-slash"></i></button>` :
                `<button class="btn-detail" onclick="showProductAdmin(${product.id})" title="Hiện sản phẩm"><i class="fa-regular fa-eye"></i></button>`;
            btnCtl += `<button class="btn-delete" onclick="deleteProductPermanently(${product.id})" title="Xóa vĩnh viễn"><i class="fa-regular fa-trash"></i></button>`;
            productHtml += `
            <div class="list">
                    <div class="list-left">
                    <img src="${product.img}" alt="" loading="lazy">
                    <div class="list-info">
                        <h4>${product.title}</h4>
                        <p class="list-note">${product.description || product.desc || ""}</p>
                        <span class="list-category">${product.category}</span>
                        <div class="list-stock ${product.stock < 10 ? 'low-stock' : ''}" style="margin-top: 5px; font-weight: 500; color: ${product.stock < 10 ? '#ef4444' : '#64748b'}">
                            <i class="fa-light fa-box-open"></i> Kho: ${product.stock} 
                            ${product.stock <= 0 ? '<span style="font-size: 11px; background: #fee2e2; color: #ef4444; padding: 2px 6px; border-radius: 4px; margin-left: 5px;">Hết hàng</span>' :
                    (product.stock < 10 ? '<span style="font-size: 11px; background: #fee2e2; color: #ef4444; padding: 2px 6px; border-radius: 4px; margin-left: 5px;">Sắp hết hàng</span>' : '')}
                        </div>
                    </div>
                </div>
                <div class="list-right">
                    <div class="list-price">
                    <span class="list-current-price">${vnd(product.price)}</span>                   
                    </div>
                    <div class="list-control">
                    <div class="list-tool">
                        <button class="btn-edit" onclick="editProduct(${product.id})"><i class="fa-light fa-pen-to-square"></i></button>
                        ${btnCtl}
                    </div>                       
                </div>
                </div> 
            </div>`;
        });
    }
    document.getElementById("show-product").innerHTML = productHtml;
}

async function showProduct() {
    let selectOp = document.getElementById('the-loai').value;
    let valeSearchInput = document.getElementById('form-search-product').value;
    try {
        productsData = await window.api.getProducts(valeSearchInput);
    } catch (err) {
        console.error("Failed to fetch products:", err);
        productsData = [];
    }

    if (!Array.isArray(productsData)) productsData = [];

    let result = [];
    if (selectOp == "Tất cả") {
        result = productsData.filter((item) => item.status == 1);
    } else if (selectOp == "Đã ẩn") {
        result = productsData.filter((item) => item.status == 0);
    } else {
        result = productsData.filter((item) => item.category == selectOp);
    }

    displayList(result, perPage, currentPage);
    setupPagination(result, perPage, currentPage);
}

let latestOrderId = 0;
let isFirstLoad = true;
let orderStatusSnapshot = {};

async function cancelSearchProduct() {
    document.getElementById('the-loai').value = "Tất cả";
    document.getElementById('form-search-product').value = "";
    currentPage = 1; // Reset to page 1
    await initAdmin();
}

async function initAdmin() {
    await showProduct();
    try {
        const currentUser = JSON.parse(localStorage.getItem("currentuser"));
        const isAdmin = currentUser && currentUser.userType == 1;
        const isStaff = currentUser && currentUser.userType == 2;

        const products = await window.api.getProducts(null, true);
        const orders = await window.api.getOrders(true);

        showOrder(orders);

        if (isAdmin) {
            const vouchers = await window.api.getVouchers(true);
            showVoucherArr(vouchers);
        }


        if (isAdmin) {
            const users = await window.api.getUsers(true);
            document.getElementById("amount-user").innerHTML = getAmoumtUser(users);
            document.getElementById("amount-product").innerHTML = getAmoumtProduct(products);
            document.getElementById("doanh-thu").innerHTML = vnd(getMoney(orders));
            showUserArr(users);
            await thongKe();
        }

        // Set latest order ID for notifications
        if (isFirstLoad) {
            if (orders && orders.length > 0) {
                const ids = orders.map(o => {
                    const numericPart = o.id.replace('DH', '');
                    return parseInt(numericPart) || 0;
                });
                latestOrderId = Math.max(...ids);
            }
            // Start clock
            updateClock();
            setInterval(updateClock, 1000);

            // Initial check for order list refresh
            startOrderListPolling();
            isFirstLoad = false;
        }
    } catch (error) {
        console.error("Failed to initialize admin stats:", error);
    }
}

function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const timeString = `${hours}:${minutes}:${seconds}`;
    const clockElement = document.getElementById('current-time');
    if (clockElement) {
        clockElement.textContent = timeString;
    }
}

function startOrderListPolling() {
    setInterval(async () => {
        try {
            const orders = await window.api.getOrders(true);
            if (Array.isArray(orders)) {
                const currentOrderCount = orders.length;
                const lastKnownCount = parseInt(localStorage.getItem('admin_last_order_count')) || 0;

                if (currentOrderCount !== lastKnownCount) {
                    localStorage.setItem('admin_last_order_count', currentOrderCount);
                    if (typeof showOrder === 'function') showOrder(orders);

                    // Update stats if we are on dashboard
                    const currentUser = JSON.parse(localStorage.getItem("currentuser"));
                    if (currentUser && currentUser.userType == 1) {
                        const doanhThuEl = document.getElementById("doanh-thu");
                        if (doanhThuEl) doanhThuEl.innerHTML = vnd(getMoney(orders));
                        if (typeof thongKe === 'function') await thongKe();
                    }
                }
            }
        } catch (error) {
            console.error("Order list polling failed:", error);
        }
    }, 5000);
}


// Redundant window.onload removed and merged into the main one at the top.




// window.onload and initialization moved to the top of the file

function createId(arr) {
    let id = arr.length;
    let check = arr.find((item) => item.id == id);
    while (check != null) {
        id++;
        check = arr.find((item) => item.id == id);
    }
    return id;
}
// Ẩn sản phẩm 
async function hideProduct(id) {
    if (confirm("Bạn có chắc muốn ẩn sản phẩm này?") == true) {
        try {
            const products = await window.api.getProducts();
            let product = products.find(item => item.id == id);
            if (product) {
                product.status = 0;
                await window.api.updateProduct(id, product);
                toast({ title: 'Thành công', message: 'Đã ẩn sản phẩm!', type: 'success', duration: 3000 });
                await initAdmin();
            }
        } catch (error) {
            console.error("Hide product error:", error);
            toast({ title: 'Lỗi', message: 'Không thể ẩn sản phẩm!', type: 'error', duration: 3000 });
        }
    }
}

// Hiện sản phẩm
async function showProductAdmin(id) {
    if (confirm("Bạn có chắc chắn muốn hiện sản phẩm này?") == true) {
        try {
            const products = await window.api.getProducts();
            let product = products.find(item => item.id == id);
            if (product) {
                product.status = 1;
                await window.api.updateProduct(id, product);
                toast({ title: 'Thành công', message: 'Đã hiện sản phẩm!', type: 'success', duration: 3000 });
                await initAdmin();
            }
        } catch (error) {
            console.error("Show product error:", error);
            toast({ title: 'Lỗi', message: 'Không thể hiện sản phẩm!', type: 'error', duration: 3000 });
        }
    }
}

// Xóa vĩnh viễn
async function deleteProductPermanently(id) {
    if (confirm("CẢNH BÁO: Bạn có chắc chắn muốn XÓA VĨNH VIỄN sản phẩm này? Thao tác này không thể hoàn tác.") == true) {
        try {
            await window.api.deleteProduct(id);
            toast({ title: 'Thành công', message: 'Đã xóa vĩnh viễn sản phẩm!', type: 'success', duration: 3000 });
            await initAdmin();
        } catch (error) {
            console.error("Permanent delete error:", error);
            const msg = error.message || "Không thể xóa vĩnh viễn sản phẩm!";
            toast({ title: 'Thất bại', message: msg, type: 'error', duration: 5000 });
        }
    }
}

var indexCur;
async function editProduct(id) {
    let index = productsData.findIndex(item => item.id == id);
    indexCur = index;

    document.querySelectorAll(".add-product-e").forEach(item => {
        item.style.display = "none";
    })
    document.querySelectorAll(".edit-product-e").forEach(item => {
        item.style.display = "block";
    })
    document.querySelector(".add-product").classList.add("open");

    document.querySelector(".upload-image-preview").src = productsData[index].img;
    document.getElementById("ten-mon").value = productsData[index].title;
    document.getElementById("gia-moi").value = productsData[index].price;
    document.getElementById("mo-ta").value = productsData[index].description || productsData[index].desc || "";
    document.getElementById("chon-mon").value = productsData[index].category;
    document.getElementById("stock").value = productsData[index].stock || 0;
}

function getPathImage(path) {
    let patharr = path.split("/");
    return "./assets/img/products/" + patharr[patharr.length - 1];
}

let btnUpdateProductIn = document.getElementById("update-product-button");
btnUpdateProductIn.addEventListener("click", async (e) => {
    e.preventDefault();
    if (indexCur === undefined || !productsData[indexCur]) {
        toast({ title: "Lỗi", message: "Không tìm thấy sản phẩm!", type: "error", duration: 3000 });
        return;
    }

    let idProduct = productsData[indexCur].id;
    let imgProductCur = getPathImage(document.querySelector(".upload-image-preview").src)
    let titleProductCur = document.getElementById("ten-mon").value;
    let curProductCur = document.getElementById("gia-moi").value;
    let descProductCur = document.getElementById("mo-ta").value;
    let categoryText = document.getElementById("chon-mon").value;
    let stockProductCur = document.getElementById("stock").value;

    if (titleProductCur == "" || curProductCur == "" || descProductCur == "" || stockProductCur == "") {
        toast({ title: "Cảnh báo", message: "Vui lòng nhập đầy đủ thông tin món!", type: "warning", duration: 3000, });
        return;
    }

    let productUpdate = {
        title: titleProductCur,
        img: imgProductCur,
        category: categoryText,
        price: parseInt(curProductCur),
        description: descProductCur,
        status: productsData[indexCur].status,
        stock: parseInt(stockProductCur)
    }

    try {
        await window.api.updateProduct(idProduct, productUpdate);
        toast({ title: "Thành công", message: "Cập nhật sản phẩm thành công!", type: "success", duration: 3000 });
        setDefaultValue();
        document.querySelector(".add-product").classList.remove("open");
        showProduct();
    } catch (error) {
        console.error("Update product error:", error);
        toast({ title: "Lỗi", message: error.message || "Không thể cập nhật sản phẩm!", type: "error", duration: 3000 });
    }
});

let btnAddProductIn = document.getElementById("add-product-button");
btnAddProductIn.addEventListener("click", async (e) => {
    e.preventDefault();
    let imgProduct = getPathImage(document.querySelector(".upload-image-preview").src)
    let tenMon = document.getElementById("ten-mon").value;
    let price = document.getElementById("gia-moi").value;
    let moTa = document.getElementById("mo-ta").value;
    let categoryText = document.getElementById("chon-mon").value;
    let stock = document.getElementById("stock").value;

    if (tenMon == "" || price == "" || moTa == "" || stock == "") {
        toast({ title: "Cảnh báo", message: "Vui lòng nhập đầy đủ thông tin món!", type: "warning", duration: 3000, });
        return;
    }

    if (isNaN(price)) {
        toast({ title: "Cảnh báo", message: "Giá phải ở dạng số!", type: "warning", duration: 3000, });
        return;
    }

    let product = {
        title: tenMon,
        img: imgProduct,
        category: categoryText,
        price: parseInt(price),
        description: moTa,
        stock: parseInt(stock) || 0,
        status: 1
    };

    try {
        await window.api.addProduct(product);
        toast({ title: "Thành công", message: "Thêm sản phẩm thành công!", type: "success", duration: 3000 });
        setDefaultValue();
        document.querySelector(".add-product").classList.remove("open");
        showProduct();
    } catch (error) {
        toast({ title: "Lỗi", message: error.message || "Không thể thêm sản phẩm!", type: "error", duration: 3000 });
    }
});

document.querySelector(".modal-close.product-form").addEventListener("click", () => {
    setDefaultValue();
})

function setDefaultValue() {
    document.querySelector(".upload-image-preview").src = "./assets/img/blank-image.png";
    document.getElementById("ten-mon").value = "";
    document.getElementById("gia-moi").value = "";
    document.getElementById("mo-ta").value = "";
    document.getElementById("stock").value = "";
    document.getElementById("chon-mon").value = "Món chay";
}

// Open Popup Modal
let btnAddProduct = document.getElementById("btn-add-product");
btnAddProduct.addEventListener("click", () => {
    document.querySelectorAll(".add-product-e").forEach(item => {
        item.style.display = "block";
    })
    document.querySelectorAll(".edit-product-e").forEach(item => {
        item.style.display = "none";
    })
    document.querySelector(".add-product").classList.add("open");
});

// Close Popup Modal
let closePopup = document.querySelectorAll(".modal-close");
let modalPopup = document.querySelectorAll(".modal");

for (let i = 0; i < closePopup.length; i++) {
    closePopup[i].onclick = () => {
        modalPopup[i].classList.remove("open");
    };
}

// On change Image
function uploadImage(el) {
    let path = "./assets/img/products/" + el.value.split("\\")[2];
    document.querySelector(".upload-image-preview").setAttribute("src", path);
}

// Đổi trạng thái đơn hàng
async function changeStatus(id, newStatus) {
    try {
        await window.api.updateOrderStatus(id, newStatus);
        let msg = newStatus == 1 ? 'Đã duyệt đơn hàng!' : 'Đã xác nhận thanh toán!';
        toast({ title: 'Thành công', message: msg, type: 'success', duration: 2000 });

        // Refresh orders and UI
        const orders = await window.api.getOrders();
        showOrder(orders);
        await thongKe();

        // Re-render detail modal to update button
        await detailOrder(id);
    } catch (error) {
        toast({ title: 'Lỗi', message: 'Không thể cập nhật trạng thái!', type: 'error', duration: 2000 });
    }
}

async function processOrderAdmin(id) {
    if (confirm("Bạn có muốn duyệt đơn hàng này không?")) {
        try {
            await window.api.updateOrderStatus(id, 1);
            toast({ title: 'Thành công', message: 'Đã duyệt đơn hàng!', type: 'success', duration: 2000 });
            // Refresh orders
            const orders = await window.api.getOrders();
            showOrder(orders);
            // Refresh statistics
            await thongKe();
        } catch (error) {
            console.error("Failed to process order:", error);
            toast({ title: 'Lỗi', message: 'Không thể duyệt đơn hàng!', type: 'error', duration: 2000 });
        }
    }
}

// Xóa đơn hàng
async function deleteOrderAdmin(id) {
    console.log("Requesting deletion for order ID:", id);
    if (!id) {
        toast({ title: 'Lỗi', message: 'Mã đơn hàng không hợp lệ!', type: 'error', duration: 2000 });
        return;
    }
    if (confirm("Bạn có chắc chắn muốn xóa đơn hàng này?")) {
        try {
            const result = await window.api.deleteOrder(id);
            console.log("Delete result:", result);
            toast({ title: 'Thành công', message: 'Đã xóa đơn hàng!', type: 'success', duration: 2000 });
            // Refresh orders
            const orders = await window.api.getOrders();
            showOrder(orders);
            // Refresh statistics
            await thongKe();
        } catch (error) {
            console.error("Failed to delete order:", error);
            toast({ title: 'Lỗi', message: 'Không thể xóa đơn hàng! Kiểm tra console để biết chi tiết.', type: 'error', duration: 3000 });
        }
    }
}

// Format Date
function formatDate(date) {
    if (!date) return "Chưa rõ";
    let fm = new Date(date.toString().replace('Z', ''));
    if (isNaN(fm.getTime())) return "Chưa rõ";
    let yyyy = fm.getFullYear();
    let mm = fm.getMonth() + 1;
    let dd = fm.getDate();
    if (dd < 10) dd = "0" + dd;
    if (mm < 10) mm = "0" + mm;
    return dd + "/" + mm + "/" + yyyy;
}


// Show order
function showOrder(arr) {
    let orderHtml = "";
    if (!Array.isArray(arr) || arr.length == 0) {
        orderHtml = `<td colspan="6">Không có dữ liệu</td>`
    } else {
        arr.forEach((item) => {
            let status = "";
            if (item.trangthai == 0) status = `<span class="status-no-complete">Chưa xử lý</span>`;
            else if (item.trangthai == 1) status = `<span class="status-processing">Đã xử lý</span>`;
            else if (item.trangthai == 2) status = `<span class="status-complete">Đã thanh toán</span>`;
            else if (item.trangthai == 3) status = `<span class="status-cancelled" style="background: #f5f5f5; color: #999; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">Đã hủy</span>`;
            let date = formatDate(item.thoigiandat);
            orderHtml += `
            <tr>
            <td>${item.id}</td>
            <td>${item.khachhang}</td>
            <td>${date}</td>
            <td>${vnd(item.tongtien)}</td>                               
            <td>${status}</td>
            <td class="control">
            <button class="btn-detail" id="" onclick="detailOrder('${item.id}')"><i class="fa-regular fa-eye"></i> Chi tiết</button>
            <button class="btn-delete" onclick="deleteOrderAdmin('${item.id}')"><i class="fa-regular fa-trash"></i></button>
            </td>
            </tr>      
            `;
        });
    }
    document.getElementById("showOrder").innerHTML = orderHtml;
}

let orders = localStorage.getItem("order") ? JSON.parse(localStorage.getItem("order")) : [];
// window.onload = showOrder(orders); // Removed conflicting assignment

// Get Order Details
async function getOrderDetails(madon) {
    try {
        return await window.api.getOrderDetails(madon);
    } catch (error) {
        console.error("Error fetching order details:", error);
        return [];
    }
}

// Show Order Detail
async function detailOrder(id) {
    document.querySelector(".modal.detail-order").classList.add("open");
    try {
        const orders = await window.api.getOrders();
        const products = await window.api.getProducts();
        // Lấy hóa đơn 
        let order = orders.find((item) => item.id == id);
        // Lấy chi tiết hóa đơn
        let ctDon = await getOrderDetails(id);

        let spHtml = `<div class="modal-detail-left"><div class="order-item-group">`;

        ctDon.forEach((item) => {
            let detaiSP = products.find(product => product.id == item.id);
            spHtml += `<div class="order-product">
                <div class="order-product-left">
                    <img src="${detaiSP ? detaiSP.img : './assets/img/blank-image.png'}" alt="" loading="lazy">
                    <div class="order-product-info">
                        <h4>${detaiSP ? detaiSP.title : 'Sản phẩm đã bị xóa'}</h4>
                        <p class="order-product-note"><i class="fa-light fa-pen"></i> ${item.note ? item.note : "Không có ghi chú"}</p>
                        <p class="order-product-quantity">SL: ${item.soluong}<p>
                    </div>
                </div>
                <div class="order-product-right">
                    <div class="order-product-price">
                        <span class="order-product-current-price">${vnd(item.price)}</span>
                    </div>                         
                </div>
            </div>`;
        });
        spHtml += `</div></div>`;
        spHtml += `<div class="modal-detail-right">
            <ul class="detail-order-group">
                <li class="detail-order-item">
                    <span class="detail-order-item-left"><i class="fa-light fa-calendar-days"></i> Ngày đặt hàng</span>
                    <span class="detail-order-item-right">${formatDate(order.thoigiandat)}</span>
                </li>
                <li class="detail-order-item">
                    <span class="detail-order-item-left"><i class="fa-light fa-truck"></i> Hình thức giao</span>
                    <span class="detail-order-item-right">${order.hinhthucgiao}</span>
                </li>
                <li class="detail-order-item">
                <span class="detail-order-item-left"><i class="fa-thin fa-person"></i> Người nhận</span>
                <span class="detail-order-item-right">${order.tenguoinhan}</span>
                </li>
                <li class="detail-order-item">
                <span class="detail-order-item-left"><i class="fa-light fa-phone"></i> Số điện thoại</span>
                <span class="detail-order-item-right">${order.sdtnhan}</span>
                </li>
                <li class="detail-order-item tb">
                    <span class="detail-order-item-left"><i class="fa-light fa-clock"></i> Thời gian giao</span>
                    <p class="detail-order-item-b">${(order.thoigiangiao == "" ? "" : (order.thoigiangiao + " - ")) + (order.ngaygiaohang ? formatDate(order.ngaygiaohang) : "Giao ngay")}</p>
                </li>
                <li class="detail-order-item tb">
                    <span class="detail-order-item-t"><i class="fa-light fa-location-dot"></i> Địa chỉ nhận</span>
                    <p class="detail-order-item-b">${order.diachinhan}</p>
                </li>
                <li class="detail-order-item tb">
                    <span class="detail-order-item-t"><i class="fa-light fa-note-sticky"></i> Ghi chú</span>
                    <p class="detail-order-item-b">${order.ghichu ? order.ghichu : "Không có ghi chú"}</p>
                </li>
            </ul>
        </div>`;
        document.querySelector(".modal-detail-order").innerHTML = spHtml;

        let classDetailBtn = "";
        let textDetailBtn = "";
        let onclickBtn = "";

        if (order.trangthai == 0) {
            classDetailBtn = "btn-chuaxuly";
            textDetailBtn = "Duyệt đơn";
            onclickBtn = `onclick="changeStatus('${order.id}', 1)"`;
        } else if (order.trangthai == 1) {
            classDetailBtn = "btn-processing";
            textDetailBtn = "Xác nhận thanh toán";
            onclickBtn = `onclick="changeStatus('${order.id}', 2)"`;
        } else if (order.trangthai == 2) {
            classDetailBtn = "btn-daxuly";
            textDetailBtn = "Đã thanh toán";
            onclickBtn = ""; // Disabled
        } else if (order.trangthai == 3) {
            classDetailBtn = "btn-cancelled";
            textDetailBtn = "Đã hủy";
            onclickBtn = ""; // Disabled
        }

        document.querySelector(
            ".modal-detail-bottom"
        ).innerHTML = `<div class="modal-detail-bottom-left">
            <div class="price-total">
                <span class="thanhtien">Thành tiền</span>
                <span class="price">${vnd(order.tongtien)}</span>
            </div>
        </div>
        <div class="modal-detail-bottom-right">
            <button class="modal-detail-btn btn-print" onclick="printOrderAdmin('${order.id}')">In hóa đơn</button>
            <button class="modal-detail-btn ${classDetailBtn}" ${onclickBtn}>${textDetailBtn}</button>
        </div>`;
    } catch (error) {
        console.error("Error showing order detail:", error);
    }
}

async function printOrderAdmin(id) {
    try {
        const orders = await window.api.getOrders();
        const products = await window.api.getProducts();
        let order = orders.find((item) => item.id == id);
        let ctDon = await window.api.getOrderDetails(id);

        if (!order) return;

        let itemsHtml = "";
        ctDon.forEach((item, index) => {
            let detaiSP = products.find(p => p.id == item.id);
            itemsHtml += `
                <tr>
                    <td style="padding: 12px 5px; color: #666;">${index + 1}</td>
                    <td style="padding: 12px 5px;">
                        <div style="font-weight: 600; color: #333;">${detaiSP ? detaiSP.title : 'Sản phẩm đã xóa'}</div>
                        <div style="font-size: 11px; color: #888;">${item.note ? 'Ghi chú: ' + item.note : ''}</div>
                    </td>
                    <td style="padding: 12px 5px; text-align: center;">${item.soluong}</td>
                    <td style="padding: 12px 5px; text-align: right;">${vnd(item.price)}</td>
                    <td style="padding: 12px 5px; text-align: right; font-weight: 600;">${vnd(item.price * item.soluong)}</td>
                </tr>
            `;
        });

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Hóa đơn TiMi Food - ${order.id}</title>
                    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
                    <style>
                        * { box-sizing: border-box; -webkit-print-color-adjust: exact; }
                        body { font-family: 'Inter', sans-serif; line-height: 1.6; color: #1a1a1a; padding: 40px; background: #fff; margin: 0; }
                        .bill-container { max-width: 800px; margin: 0 auto; position: relative; }
                        
                        /* Header */
                        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 50px; border-bottom: 4px solid #f0f0f0; padding-bottom: 20px; }
                        .brand h1 { margin: 0; font-size: 32px; font-weight: 800; color: #b5292f; letter-spacing: -1px; }
                        .brand p { margin: 5px 0 0; font-size: 13px; color: #666; font-weight: 500; }
                        .order-meta { text-align: right; }
                        .order-meta h2 { margin: 0; font-size: 20px; color: #333; }
                        .order-meta p { margin: 2px 0; font-size: 13px; color: #888; }

                        /* Info Sections */
                        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
                        .info-box h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #999; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
                        .info-box p { margin: 4px 0; font-size: 14px; }
                        .info-box strong { color: #333; }

                        /* Table */
                        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                        table th { background: #f9f9f9; padding: 12px 5px; text-align: left; font-size: 12px; text-transform: uppercase; color: #666; border-bottom: 2px solid #eee; }
                        table tr { border-bottom: 1px solid #f0f0f0; }
                        
                        /* Totals */
                        .totals { margin-left: auto; width: 300px; }
                        .total-item { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
                        .total-item.grand-total { border-top: 2px solid #333; margin-top: 10px; padding-top: 15px; font-size: 20px; font-weight: 800; color: #b5292f; }

                        /* Stamp */
                        .stamp { position: absolute; top: 150px; right: 50px; transform: rotate(-15deg); border: 4px double #27ae60; color: #27ae60; font-size: 24px; font-weight: 800; padding: 10px 20px; border-radius: 10px; opacity: 0.3; text-transform: uppercase; pointer-events: none; }
                        ${order.trangthai != 2 ? '.stamp { display: none; }' : ''}

                        /* Footer */
                        .footer { margin-top: 60px; text-align: center; border-top: 1px dashed #eee; padding-top: 30px; }
                        .footer p { margin: 5px 0; font-size: 13px; color: #888; }
                        .footer .thanks { font-size: 16px; font-weight: 600; color: #333; margin-bottom: 10px; }

                        @media print {
                            body { padding: 0; }
                            .bill-container { max-width: 100%; }
                        }
                    </style>
                </head>
                <body>
                    <div class="bill-container">
                        <div class="stamp">ĐÃ THANH TOÁN</div>
                        
                        <div class="header">
                            <div class="brand">
                                <h1>TIMI FOOD</h1>
                                <p>Tinh hoa ẩm thực Việt - Phục vụ tận tâm</p>
                            </div>
                            <div class="order-meta">
                                <h2>HÓA ĐƠN BÁN HÀNG</h2>
                                <p>Mã đơn: <strong>${order.id}</strong></p>
                                <p>Ngày: ${formatDate(order.thoigiandat)}</p>
                            </div>
                        </div>

                        <div class="info-grid">
                            <div class="info-box">
                                <h3>ĐƠN VỊ CUNG CẤP</h3>
                                <p><strong>TiMi Food Chi Nhánh Hải Phòng</strong></p>
                                <p>Địa chỉ: 165 Trần Quốc Chẩn, Chu Văn An, Hải Phòng</p>
                                <p>Hotline: 0345.975.990</p>
                                <p>Website: timifood.com.vn</p>
                            </div>
                            <div class="info-box">
                                <h3>THÔNG TIN KHÁCH HÀNG</h3>
                                <p><strong>Khách hàng:</strong> ${order.tenguoinhan}</p>
                                <p><strong>Điện thoại:</strong> ${order.sdtnhan}</p>
                                <p><strong>Địa chỉ:</strong> ${order.diachinhan}</p>
                                <p><strong>Hình thức:</strong> ${order.hinhthucgiao}</p>
                            </div>
                        </div>

                        <table>
                            <thead>
                                <tr>
                                    <th style="width: 40px;">STT</th>
                                    <th>CHI TIẾT MÓN ĂN</th>
                                    <th style="width: 60px; text-align: center;">SL</th>
                                    <th style="width: 120px; text-align: right;">ĐƠN GIÁ</th>
                                    <th style="width: 140px; text-align: right;">THÀNH TIỀN</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${itemsHtml}
                            </tbody>
                        </table>

                        <div class="totals">
                            <div class="total-item">
                                <span>Tiền hàng:</span>
                                <span>${vnd(order.tongtien - (order.hinhthucgiao == "Tự đến lấy" ? 0 : 30000))}</span>
                            </div>
                            <div class="total-item">
                                <span>Phí vận chuyển:</span>
                                <span>${order.hinhthucgiao == "Tự đến lấy" ? "0đ" : vnd(30000)}</span>
                            </div>
                            <div class="total-item grand-total">
                                <span>TỔNG CỘNG:</span>
                                <span>${vnd(order.tongtien)}</span>
                            </div>
                        </div>

                        <div class="footer">
                            <p class="thanks">Cảm ơn quý khách đã tin tưởng và ủng hộ!</p>
                            <p>Vui lòng giữ lại hóa đơn để đối soát khi cần thiết.</p>
                            <p style="margin-top: 15px; font-weight: 600;">TiMi Food - Ăn ngon, sống khỏe!</p>
                        </div>
                    </div>
                    <script>
                        window.onload = function() { 
                            setTimeout(() => {
                                window.print(); 
                                window.close(); 
                            }, 500);
                        }
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    } catch (error) {
        console.error("Print error:", error);
        toast({ title: 'Lỗi', message: 'Không thể khởi tạo bản in!', type: 'error', duration: 3000 });
    }
}

// Find Order
async function findOrder() {
    let tinhTrang = parseInt(document.getElementById("tinh-trang").value);
    let ct = document.getElementById("form-search-order").value;
    let timeStart = document.getElementById("time-start").value;
    let timeEnd = document.getElementById("time-end").value;

    if (timeEnd < timeStart && timeEnd != "" && timeStart != "") {
        alert("Lựa chọn thời gian sai !");
        return;
    }
    try {
        const orders = await window.api.getOrders();
        let result = tinhTrang == 3 ? orders : orders.filter((item) => {
            return item.trangthai == tinhTrang;
        });
        result = ct == "" ? result : result.filter((item) => {
            return (item.khachhang.toLowerCase().includes(ct.toLowerCase()) || item.id.toString().toLowerCase().includes(ct.toLowerCase()));
        });

        if (timeStart != "" && timeEnd == "") {
            result = result.filter((item) => {
                return new Date(item.thoigiandat.replace('Z', '')) >= new Date(timeStart).setHours(0, 0, 0);
            });
        } else if (timeStart == "" && timeEnd != "") {
            result = result.filter((item) => {
                return new Date(item.thoigiandat.replace('Z', '')) <= new Date(timeEnd).setHours(23, 59, 59);
            });
        } else if (timeStart != "" && timeEnd != "") {
            result = result.filter((item) => {
                return (new Date(item.thoigiandat.replace('Z', '')) >= new Date(timeStart).setHours(0, 0, 0) && new Date(item.thoigiandat.replace('Z', '')) <= new Date(timeEnd).setHours(23, 59, 59)
                );
            });
        }
        showOrder(result);
    } catch (error) {
        console.error("Error searching orders:", error);
    }
}

async function cancelSearchOrder() {
    document.getElementById("tinh-trang").value = 3;
    document.getElementById("form-search-order").value = "";
    document.getElementById("time-start").value = "";
    document.getElementById("time-end").value = "";
    await initAdmin();
}

// Statistics reset logic
async function thongKe(mode) {
    let categoryTk = document.getElementById("the-loai-tk").value;
    let ct = document.getElementById("form-search-tk").value;
    let timeStart = document.getElementById("time-start-tk").value;
    let timeEnd = document.getElementById("time-end-tk").value;
    if (timeEnd < timeStart && timeEnd != "" && timeStart != "") {
        alert("Lựa chọn thời gian sai !");
        return;
    }

    try {
        const [orders, products] = await Promise.all([
            window.api.getOrders(),
            window.api.getProducts()
        ]);

        if (!Array.isArray(orders) || !Array.isArray(products)) return;

        // Fetch all order details in parallel for better performance
        const allDetailsResults = await Promise.all(
            orders.map(order => window.api.getOrderDetails(order.id))
        );

        let arrDetail = [];
        orders.forEach((order, index) => {
            if (order.trangthai != 2) return;
            const details = allDetailsResults[index];
            if (Array.isArray(details)) {
                details.forEach(item => {
                    let prod = products.find(p => p.id == item.id);
                    arrDetail.push({
                        ...item,
                        madon: order.id,
                        category: prod ? prod.category : 'Khác',
                        title: prod ? prod.title : 'Sản phẩm đã xóa',
                        img: prod ? prod.img : '',
                        time: order.thoigiandat,
                        quantity: item.soluong // Ensure quantity field exists
                    });
                });
            }
        });

        let result = categoryTk == "Tất cả" ? arrDetail : arrDetail.filter((item) => {
            return item.category == categoryTk;
        });

        result = ct == "" ? result : result.filter((item) => {
            return (item.title.toLowerCase().includes(ct.toLowerCase()));
        });

        if (timeStart != "" && timeEnd == "") {
            result = result.filter((item) => {
                return new Date(item.time.replace('Z', '')) > new Date(timeStart).setHours(0, 0, 0);
            });
        } else if (timeStart == "" && timeEnd != "") {
            result = result.filter((item) => {
                return new Date(item.time.replace('Z', '')) < new Date(timeEnd).setHours(23, 59, 59);
            });
        } else if (timeStart != "" && timeEnd != "") {
            result = result.filter((item) => {
                return (new Date(item.time.replace('Z', '')) > new Date(timeStart).setHours(0, 0, 0) && new Date(item.time.replace('Z', '')) < new Date(timeEnd).setHours(23, 59, 59)
                );
            });
        }
        await showThongKe(result, mode);
    } catch (error) {
        console.error("Error generating statistics:", error);
    }
}

// Show số lượng sp, số lượng đơn bán, doanh thu
function showOverview(arr) {
    document.getElementById("quantity-product").innerText = arr.length;
    document.getElementById("quantity-order").innerText = arr.reduce((sum, cur) => (sum + parseInt(cur.quantity)), 0);
    document.getElementById("quantity-sale").innerText = vnd(arr.reduce((sum, cur) => (sum + parseInt(cur.doanhthu)), 0));
}

async function showThongKe(arr, mode) {
    let orderHtml = "";
    let mergeObj = mergeObjThongKe(arr);
    showOverview(mergeObj);
    // Use background fetch for advanced charts to avoid blocking the table render
    initAdvancedCharts();

    if (mode === 0) {
        document.getElementById("the-loai-tk").value = "Tất cả";
        document.getElementById("form-search-tk").value = "";
        document.getElementById("time-start-tk").value = "";
        document.getElementById("time-end-tk").value = "";
    }

    switch (mode) {
        case 1:
            mergeObj.sort((a, b) => parseInt(a.quantity) - parseInt(b.quantity))
            break;
        case 2:
            mergeObj.sort((a, b) => parseInt(b.quantity) - parseInt(a.quantity))
            break;
    }
    for (let i = 0; i < mergeObj.length; i++) {
        orderHtml += `
        <tr>
        <td>${i + 1}</td>
        <td><div class="prod-img-title"><img class="prd-img-tbl" src="${mergeObj[i].img}" alt="" loading="lazy"><p>${mergeObj[i].title}</p></div></td>
        <td>${mergeObj[i].quantity}</td>
        <td>${vnd(mergeObj[i].doanhthu)}</td>
        <td><button class="btn-detail product-order-detail" data-id="${mergeObj[i].id}"><i class="fa-regular fa-eye"></i> Chi tiết</button></td>
        </tr>      
        `;
    }
    document.getElementById("showTk").innerHTML = orderHtml;
    document.querySelectorAll(".product-order-detail").forEach(item => {
        let idProduct = item.getAttribute("data-id");
        item.addEventListener("click", () => {
            detailOrderProduct(arr, idProduct);
        })
    })
}

async function initAdvancedCharts() {
    try {
        console.log("Fetching advanced stats report...");
        const report = await window.api.getStatsReport();
        console.log("Stats Report received:", report);
        if (report) {
            updateStatisticsChart(report.topProducts);
            updateCategoryChart(report.categoryStats);
            updateTrendChart(report.monthlyRevenue);
        }
    } catch (error) {
        console.error("Error fetching advanced stats:", error);
    }
}

let myChart, categoryChart, trendChart;
function updateStatisticsChart(topProducts) {
    const canvas = document.getElementById('statisticsChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const labels = topProducts.map(item => item.title.length > 15 ? item.title.substring(0, 15) + "..." : item.title);
    const revenueData = topProducts.map(item => item.totalRevenue);
    const quantityData = topProducts.map(item => item.totalQuantity);

    if (myChart) myChart.destroy();
    if (labels.length === 0) return;

    myChart = new Chart(ctx, {
        type: 'line', // Set main type to line to emphasize curves
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Doanh thu (VNĐ)',
                    data: revenueData,
                    borderColor: '#6366f1',
                    backgroundColor: (context) => {
                        const chart = context.chart;
                        const { ctx, chartArea } = chart;
                        if (!chartArea) return null;
                        const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
                        gradient.addColorStop(0, 'rgba(99, 102, 241, 0)');
                        gradient.addColorStop(1, 'rgba(99, 102, 241, 0.3)');
                        return gradient;
                    },
                    borderWidth: 4,
                    fill: true,
                    tension: 0.6,
                    cubicInterpolationMode: 'monotone',
                    pointBackgroundColor: '#fff',
                    pointBorderColor: '#6366f1',
                    pointBorderWidth: 3,
                    pointRadius: 5,
                    yAxisID: 'y',
                    order: 1
                },
                {
                    label: 'Số lượng bán',
                    data: quantityData,
                    type: 'bar', // Set quantity to bar
                    backgroundColor: 'rgba(236, 72, 153, 0.6)',
                    borderColor: '#ec4899',
                    borderWidth: 1,
                    borderRadius: 15,
                    barThickness: 30,
                    yAxisID: 'y1',
                    order: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 25,
                        font: { size: 13, weight: '500' }
                    }
                },
                title: {
                    display: false
                },
                tooltip: {
                    backgroundColor: '#1e293b',
                    padding: 15,
                    borderRadius: 12,
                    usePointStyle: true,
                    callbacks: {
                        label: (context) => context.datasetIndex === 0 ?
                            ` Doanh thu: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(context.raw)}` :
                            ` Số lượng: ${context.raw} món`
                    }
                }
            },
            scales: {
                y: {
                    type: 'linear',
                    position: 'left',
                    grid: { color: 'rgba(0, 0, 0, 0.04)', drawBorder: false },
                    ticks: { callback: v => v >= 1000000 ? (v / 1000000) + 'M' : v >= 1000 ? (v / 1000) + 'k' : v }
                },
                y1: {
                    type: 'linear',
                    position: 'right',
                    grid: { display: false },
                    beginAtZero: true,
                    suggestedMax: Math.max(...quantityData) + 2 // Giúp đường line không bị sát mép trên nếu data bằng nhau
                },
                x: { grid: { display: false } }
            }
        }
    });
}

function updateCategoryChart(categoryStats) {
    const canvas = document.getElementById('categoryChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const labels = categoryStats.map(item => item.category);
    const data = categoryStats.map(item => item.revenue);

    if (categoryChart) categoryChart.destroy();
    if (labels.length === 0) return;

    categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#FFCD56'
                ],
                hoverOffset: 15,
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { boxWidth: 12, padding: 15 } },
                title: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.raw / total) * 100).toFixed(1);
                            return `${context.label}: ${percentage}% (${new Intl.NumberFormat('vi-VN').format(context.raw)}₫)`;
                        }
                    }
                }
            },
            cutout: '65%'
        }
    });
}

function updateTrendChart(monthlyRevenue) {
    const canvas = document.getElementById('trendChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const months = ["Th1", "Th2", "Th3", "Th4", "Th5", "Th6", "Th7", "Th8", "Th9", "Th10", "Th11", "Th12"];
    const labels = monthlyRevenue.map(item => months[item.month - 1]);
    const data = monthlyRevenue.map(item => item.revenue);

    if (trendChart) trendChart.destroy();
    if (labels.length === 0) return;

    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(75, 192, 192, 0.4)');
    gradient.addColorStop(1, 'rgba(75, 192, 192, 0)');

    trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Doanh thu tháng (VNĐ)',
                data: data,
                fill: true,
                backgroundColor: gradient,
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 4,
                tension: 0.6,
                cubicInterpolationMode: 'monotone',
                pointBackgroundColor: '#fff',
                pointBorderColor: 'rgba(75, 192, 192, 1)',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 8,
                pointHoverBackgroundColor: 'rgba(75, 192, 192, 1)',
                pointHoverBorderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: { display: false },
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { callback: v => v >= 1000000 ? (v / 1000000) + 'M' : v >= 1000 ? (v / 1000) + 'k' : v }
                },
                x: { grid: { display: false } }
            }
        }
    });
}

// showThongKe(createObj()) // Removed undefined call

function mergeObjThongKe(arr) {
    let result = [];
    arr.forEach(item => {
        let check = result.find(i => i.id == item.id) // Không tìm thấy gì trả về undefined

        if (check) {
            check.quantity = parseInt(check.quantity) + parseInt(item.quantity);
            check.doanhthu += parseInt(item.price) * parseInt(item.quantity);
        } else {
            const newItem = { ...item }
            newItem.doanhthu = newItem.price * newItem.quantity;
            result.push(newItem);
        }

    });
    return result;
}

function detailOrderProduct(arr, id) {
    let orderHtml = "";
    arr.forEach(item => {
        if (item.id == id) {
            orderHtml += `<tr>
            <td>${item.madon}</td>
            <td>${item.quantity}</td>
            <td>${vnd(item.price)}</td>
            <td>${formatDate(item.time)}</td>
            </tr>      
            `;
        }
    });
    document.getElementById("show-product-order-detail").innerHTML = orderHtml
    document.querySelector(".modal.detail-order-product").classList.add("open")
}

// User
let addAccount = document.getElementById('signup-button');
let updateAccount = document.getElementById("btn-update-account")

document.querySelector(".modal.signup .modal-close").addEventListener("click", () => {
    signUpFormReset();
})

function openCreateAccount() {
    document.querySelector(".signup").classList.add("open");
    document.querySelectorAll(".edit-account-e").forEach(item => {
        item.style.display = "none"
    })
    document.querySelectorAll(".add-account-e").forEach(item => {
        item.style.display = "block"
    })
}

function signUpFormReset() {
    document.getElementById('fullname').value = ""
    document.getElementById('user-email').value = ""
    document.getElementById('phone').value = ""
    document.getElementById('password').value = ""
    document.querySelector('.form-message-name').innerHTML = '';
    document.querySelector('.form-message-email').innerHTML = '';
    document.querySelector('.form-message-phone').innerHTML = '';
    document.querySelector('.form-message-password').innerHTML = '';
}

function showUserArr(arr) {
    let accountHtml = '';
    if (!Array.isArray(arr) || arr.length == 0) {
        accountHtml = `<td colspan="5">Không có dữ liệu</td>`
    } else {
        arr.forEach((account, index) => {
            let roleLabel = "";
            if (account.userType == 1) roleLabel = `<span class="status-complete" style="background-color: #ff4757;">Quản trị</span>`;
            else if (account.userType == 2) roleLabel = `<span class="status-complete" style="background-color: #3742fa;">Nhân viên</span>`;
            else roleLabel = `<span class="status-no-complete" style="background-color: #747d8c;">Khách hàng</span>`;

            let tinhtrang = account.status == 0 ? `<span class="status-no-complete">Bị khóa</span>` : `<span class="status-complete">Hoạt động</span>`;
            accountHtml += ` <tr>
            <td>${index + 1}</td>
            <td>${account.fullname}</td>
            <td>${account.phone}</td>
            <td>${account.email || 'Chưa có'}</td>
            <td>${formatDate(account.join)}</td>
            <td>${roleLabel}</td>
            <td>${tinhtrang}</td>
            <td class="control control-table">
            <button class="btn-edit" id="edit-account" onclick="editAccount('${account.phone}')" ><i class="fa-light fa-pen-to-square"></i></button>
            <button class="btn-delete" id="delete-account" onclick="deleteAcount('${account.phone}')"><i class="fa-regular fa-trash"></i></button>
            </td>
        </tr>`
        })
    }
    document.getElementById('show-user').innerHTML = accountHtml;
}

async function showUser() {
    let tinhTrang = parseInt(document.getElementById("tinh-trang-user").value);
    let ct = document.getElementById("form-search-user").value;
    let timeStart = document.getElementById("time-start-user").value;
    let timeEnd = document.getElementById("time-end-user").value;

    if (timeEnd < timeStart && timeEnd != "" && timeStart != "") {
        alert("Lựa chọn thời gian sai !");
        return;
    }

    try {
        const accounts = await window.api.getUsers();
        let result = tinhTrang == 2 ? accounts : accounts.filter(item => item.status == tinhTrang);

        result = ct == "" ? result : result.filter((item) => {
            return (item.fullname.toLowerCase().includes(ct.toLowerCase()) || item.phone.toString().toLowerCase().includes(ct.toLowerCase()));
        });

        if (timeStart != "" && timeEnd == "") {
            result = result.filter((item) => {
                return new Date(item.join.replace('Z', '')) >= new Date(timeStart).setHours(0, 0, 0);
            });
        } else if (timeStart == "" && timeEnd != "") {
            result = result.filter((item) => {
                return new Date(item.join.replace('Z', '')) <= new Date(timeEnd).setHours(23, 59, 59);
            });
        } else if (timeStart != "" && timeEnd != "") {
            result = result.filter((item) => {
                return (new Date(item.join.replace('Z', '')) >= new Date(timeStart).setHours(0, 0, 0) && new Date(item.join.replace('Z', '')) <= new Date(timeEnd).setHours(23, 59, 59)
                );
            });
        }
        showUserArr(result);
    } catch (error) {
        console.error("Error searching users:", error);
    }
}

async function cancelSearchUser() {
    document.getElementById("tinh-trang-user").value = 2;
    document.getElementById("form-search-user").value = "";
    document.getElementById("time-start-user").value = "";
    document.getElementById("time-end-user").value = "";
    await initAdmin();
}

// Removed duplicate window.onload assignment

async function deleteAcount(phone) {
    if (confirm("Bạn có chắc muốn xóa?")) {
        try {
            await window.api.deleteUser(phone);
            toast({ title: 'Thành công', message: 'Xóa tài khoản thành công!', type: 'success', duration: 3000 });
            showUser();
        } catch (error) {
            toast({ title: 'Lỗi', message: 'Không thể xóa tài khoản!', type: 'error', duration: 3000 });
        }
    }
}

let indexFlag;
async function editAccount(phone) {
    document.querySelector(".signup").classList.add("open");
    document.querySelectorAll(".add-account-e").forEach(item => {
        item.style.display = "none"
    })
    document.querySelectorAll(".edit-account-e").forEach(item => {
        item.style.display = "block"
    })
    try {
        const accounts = await window.api.getUsers();
        let user = accounts.find(item => item.phone == phone);
        if (!user) return;

        document.getElementById("fullname").value = user.fullname;
        document.getElementById("user-email").value = user.email || "";
        document.getElementById("phone").value = user.phone;
        document.getElementById("phone").disabled = true; // Don't allow changing phone
        document.getElementById("password").value = user.password;
        document.getElementById("user-role").value = user.userType;
        document.getElementById("user-status").checked = user.status == 1 ? true : false;
    } catch (error) {
        console.error("Edit account fetch error:", error);
    }
}

updateAccount.addEventListener("click", async (e) => {
    e.preventDefault();
    let fullname = document.getElementById("fullname").value;
    let email = document.getElementById("user-email").value;
    let phone = document.getElementById("phone").value;
    let password = document.getElementById("password").value;
    let userRole = document.getElementById("user-role").value;
    let status = document.getElementById("user-status").checked ? 1 : 0;

    if (fullname == "" || phone == "" || password == "" || email == "") {
        toast({ title: 'Cảnh báo', message: 'Vui lòng nhập đầy đủ thông tin!', type: 'warning', duration: 3000 });
        return;
    }

    if (!emailIsValid(email)) {
        document.querySelector('.form-message-email').innerHTML = 'Email không hợp lệ';
        return;
    }

    try {
        const userObj = {
            fullname: fullname,
            email: email,
            phone: phone,
            password: password,
            userType: parseInt(userRole),
            status: status
        };
        await window.api.updateUser(phone, userObj);
        toast({ title: 'Thành công', message: 'Cập nhật tài khoản thành công!', type: 'success', duration: 3000 });
        document.querySelector(".modal.signup").classList.remove("open");
        signUpFormReset();
        showUser();
    } catch (error) {
        toast({ title: 'Lỗi', message: 'Không thể cập nhật tài khoản!', type: 'error', duration: 3000 });
    }
});

addAccount.addEventListener("click", async (e) => {
    e.preventDefault();
    let fullname = document.getElementById("fullname").value;
    let email = document.getElementById("user-email").value;
    let phone = document.getElementById("phone").value;
    let password = document.getElementById("password").value;
    let userRole = document.getElementById("user-role").value;

    if (fullname == "" || phone == "" || password == "" || email == "") {
        toast({ title: 'Cảnh báo', message: 'Vui lòng nhập đầy đủ thông tin!', type: 'warning', duration: 3000 });
        return;
    }

    if (!emailIsValid(email)) {
        document.querySelector('.form-message-email').innerHTML = 'Email không hợp lệ';
        return;
    }

    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!strongPasswordRegex.test(password)) {
        toast({ title: 'Chú ý', message: 'Mật khẩu phải từ 8 ký tự, bao gồm chữ hoa, chữ thường và số!', type: 'warning', duration: 3000 });
        return;
    }

    let user = {
        fullname: fullname,
        email: email,
        phone: phone,
        password: password,
        status: 1,
        userType: parseInt(userRole),
        join: new Date().toISOString()
    }

    try {
        const result = await window.api.register(user);
        if (result.success) {
            toast({ title: 'Thành công', message: 'Tạo tài khoản thành công!', type: 'success', duration: 3000 });
            document.querySelector(".signup").classList.remove("open");
            showUser();
            signUpFormReset();
        } else {
            toast({ title: 'Thất bại', message: result.message || 'Lỗi khi tạo tài khoản!', type: 'error', duration: 3000 });
        }
    } catch (error) {
        toast({ title: 'Lỗi', message: 'Tài khoản đã tồn tại hoặc lỗi server!', type: 'error', duration: 3000 });
    }
});

// Logout listener moved to window.onload above

// --- Export to Excel Functions ---
async function exportOrdersToExcel() {
    showLoader();
    try {
        const orders = await window.api.getOrders();
        if (!orders || orders.length === 0) {
            toast({ title: 'Cảnh báo', message: 'Không có dữ liệu đơn hàng để xuất!', type: 'warning', duration: 3000 });
            return;
        }

        const data = orders.map(o => ({
            "Mã đơn": o.id,
            "Khách hàng": o.khachhang,
            "Ngày đặt": formatDate(o.thoigiandat),
            "Tổng tiền (VNĐ)": o.tongtien,
            "Trạng thái": o.trangthai == 0 ? "Chưa xử lý" : (o.trangthai == 1 ? "Đã xử lý" : "Đã thanh toán"),
            "Hình thức giao": o.hinhthucgiao,
            "Người nhận": o.tenguoinhan,
            "Số điện thoại": o.sdtnhan,
            "Địa chỉ nhận": o.diachinhan
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Danh sách đơn hàng");

        // Auto-size columns
        const maxWidths = Object.keys(data[0]).map(key =>
            Math.max(...data.map(obj => obj[key] ? obj[key].toString().length : 0), key.length)
        );
        worksheet["!cols"] = maxWidths.map(w => ({ w: w + 2 }));

        XLSX.writeFile(workbook, `TiMiFood_DonHang_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.xlsx`);
        toast({ title: 'Thành công', message: 'Đã xuất file Excel đơn hàng!', type: 'success', duration: 3000 });
    } catch (error) {
        console.error("Export error:", error);
        toast({ title: 'Lỗi', message: 'Không thể xuất file Excel!', type: 'error', duration: 3000 });
    } finally {
        hideLoader();
    }
}

async function exportStatisticsToExcel() {
    showLoader();
    try {
        // We reuse the logic from thongKe to get current filtered data
        const [orders, products] = await Promise.all([
            window.api.getOrders(),
            window.api.getProducts()
        ]);

        const allDetailsResults = await Promise.all(
            orders.map(order => window.api.getOrderDetails(order.id))
        );

        let arrDetail = [];
        orders.forEach((order, index) => {
            if (order.trangthai != 2) return;
            const details = allDetailsResults[index];
            if (Array.isArray(details)) {
                details.forEach(item => {
                    let prod = products.find(p => p.id == item.id);
                    arrDetail.push({
                        id: item.id,
                        title: prod ? prod.title : 'Sản phẩm đã xóa',
                        category: prod ? prod.category : 'Khác',
                        quantity: item.soluong,
                        doanhthu: item.price * item.soluong
                    });
                });
            }
        });

        // Merge products
        let mergeObj = [];
        arrDetail.forEach(item => {
            let vitri = mergeObj.findIndex(res => res.id == item.id);
            if (vitri == -1) {
                mergeObj.push(item);
            } else {
                mergeObj[vitri].quantity += item.quantity;
                mergeObj[vitri].doanhthu += item.doanhthu;
            }
        });

        if (mergeObj.length === 0) {
            toast({ title: 'Cảnh báo', message: 'Không có dữ liệu thống kê để xuất!', type: 'warning', duration: 3000 });
            return;
        }

        const data = mergeObj.map((item, index) => ({
            "STT": index + 1,
            "Tên sản phẩm": item.title,
            "Loại": item.category,
            "Số lượng bán": item.quantity,
            "Doanh thu (VNĐ)": item.doanhthu
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Báo cáo doanh thu");

        XLSX.writeFile(workbook, `TiMiFood_BaoCaoDoanhThu_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.xlsx`);
        toast({ title: 'Thành công', message: 'Đã xuất báo cáo thành công!', type: 'success', duration: 3000 });
    } catch (error) {
        console.error("Export stats error:", error);
        toast({ title: 'Lỗi', message: 'Không thể xuất báo cáo!', type: 'error', duration: 3000 });
    } finally {
        hideLoader();
    }
}

async function exportStatisticsToPDF() {
    showLoader();
    try {
        const currentCategory = document.getElementById("the-loai-tk").value || "Tất cả";
        const timeStart = document.getElementById("time-start-tk").value;
        const timeEnd = document.getElementById("time-end-tk").value;

        let filterRange = "Tất cả thời gian";
        if (timeStart && timeEnd) {
            filterRange = `Từ ${formatDate(timeStart)} Đến ${formatDate(timeEnd)}`;
        } else if (timeStart) {
            filterRange = `Từ ${formatDate(timeStart)}`;
        } else if (timeEnd) {
            filterRange = `Đến ${formatDate(timeEnd)}`;
        }

        const tableBody = document.getElementById("showTk");
        if (!tableBody || tableBody.children.length === 0) {
            toast({ title: 'Cảnh báo', message: 'Không có dữ liệu thống kê nào để xuất PDF!', type: 'warning', duration: 3000 });
            return;
        }

        const qtyProductVal = document.getElementById("quantity-product").innerText;
        const qtyOrderVal = document.getElementById("quantity-order").innerText;
        const qtySaleVal = document.getElementById("quantity-sale").innerText;

        let chart1Img = "";
        let chart2Img = "";
        let chart3Img = "";

        if (myChart) chart1Img = myChart.toBase64Image();
        if (categoryChart) chart2Img = categoryChart.toBase64Image();
        if (trendChart) chart3Img = trendChart.toBase64Image();

        let tableRowsHtml = "";
        const rows = tableBody.querySelectorAll("tr");
        rows.forEach(row => {
            const cells = row.querySelectorAll("td");
            if (cells.length >= 4) {
                const stt = cells[0].innerText;
                const pTag = cells[1].querySelector("p");
                const title = pTag ? pTag.innerText : cells[1].innerText;
                const quantity = cells[2].innerText;
                const revenue = cells[3].innerText;

                tableRowsHtml += `
                <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: center;">${stt}</td>
                    <td style="padding: 8px 10px; border: 1px solid #e2e8f0; font-weight: 500;">${title}</td>
                    <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: center;">${quantity}</td>
                    <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: right; font-weight: 600; color: #10b981;">${revenue}</td>
                </tr>
                `;
            }
        });

        const tempContainer = document.createElement("div");
        tempContainer.style.position = "absolute";
        tempContainer.style.left = "-9999px";
        tempContainer.style.top = "-9999px";

        const currentDate = new Date().toLocaleString('vi-VN');

        tempContainer.innerHTML = `
        <div id="pdf-report-document" style="padding: 40px; font-family: Arial, sans-serif; color: #1e293b; background: #fff; width: 750px; box-sizing: border-box;">
            <!-- Brand Header -->
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #6366f1; padding-bottom: 15px; margin-bottom: 25px;">
                <div>
                    <h1 style="margin: 0; font-size: 28px; color: #4f46e5; font-weight: 800;">TiMi Food</h1>
                    <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b; letter-spacing: 0.5px;">Hệ thống quản lý ẩm thực thông minh</p>
                </div>
                <div style="text-align: right;">
                    <h2 style="margin: 0; font-size: 18px; color: #1e293b; font-weight: 700; text-transform: uppercase;">Báo cáo doanh thu & hiệu suất</h2>
                    <p style="margin: 5px 0 0 0; font-size: 11px; color: #64748b;">Thời điểm xuất: ${currentDate}</p>
                </div>
            </div>

            <!-- Filters -->
            <div style="background: #f8fafc; border-radius: 8px; padding: 12px 18px; margin-bottom: 25px; border-left: 5px solid #6366f1; font-size: 12px; line-height: 1.6;">
                <table style="width: 100%; border: none;">
                    <tr>
                        <td style="width: 50%; padding: 2px 0;"><strong>Người xuất báo cáo:</strong> Ban Quản trị TiMi Food</td>
                        <td style="width: 50%; padding: 2px 0;"><strong>Thời gian lọc:</strong> ${filterRange}</td>
                    </tr>
                    <tr>
                        <td style="padding: 2px 0;"><strong>Danh mục lọc:</strong> ${currentCategory}</td>
                        <td style="padding: 2px 0;"><strong>Trạng thái đơn hàng:</strong> Đã thanh toán (Hoàn tất)</td>
                    </tr>
                </table>
            </div>

            <!-- Summary metrics -->
            <div style="display: flex; justify-content: space-between; gap: 15px; margin-bottom: 30px;">
                <div style="flex: 1; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 12px; text-align: center;">
                    <p style="margin: 0 0 6px 0; font-size: 11px; color: #1e3a8a; font-weight: 600; text-transform: uppercase;">Mặt hàng có doanh thu</p>
                    <h3 style="margin: 0; font-size: 20px; color: #1d4ed8; font-weight: 800;">${qtyProductVal}</h3>
                </div>
                <div style="flex: 1; background: #fdf2f8; border: 1px solid #fbcfe8; border-radius: 8px; padding: 12px; text-align: center;">
                    <p style="margin: 0 0 6px 0; font-size: 11px; color: #831843; font-weight: 600; text-transform: uppercase;">Số lượng bán ra</p>
                    <h3 style="margin: 0; font-size: 20px; color: #be185d; font-weight: 800;">${qtyOrderVal}</h3>
                </div>
                <div style="flex: 1; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 12px; text-align: center;">
                    <p style="margin: 0 0 6px 0; font-size: 11px; color: #064e3b; font-weight: 600; text-transform: uppercase;">Tổng doanh thu thu về</p>
                    <h3 style="margin: 0; font-size: 20px; color: #047857; font-weight: 800;">${qtySaleVal}</h3>
                </div>
            </div>

            <!-- Charts Row 1 -->
            <div style="margin-bottom: 25px;">
                <h3 style="font-size: 14px; font-weight: 700; margin: 0 0 12px 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; color: #1e293b; text-transform: uppercase;">I. Hiệu suất top sản phẩm & Cơ cấu doanh thu</h3>
                <div style="display: flex; gap: 15px;">
                    <div style="flex: 1.5; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; text-align: center; background: #fff;">
                        <p style="margin: 0 0 8px 0; font-size: 10px; color: #64748b; font-weight: 600;">Top 10 Sản phẩm bán chạy nhất</p>
                        ${chart1Img ? `<img src="${chart1Img}" style="width: 100%; height: auto; max-height: 200px;" />` : `<div style="padding: 40px 0; color: #94a3b8; font-size: 11px;">Không có biểu đồ</div>`}
                    </div>
                    <div style="flex: 1; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; text-align: center; background: #fff;">
                        <p style="margin: 0 0 8px 0; font-size: 10px; color: #64748b; font-weight: 600;">Cơ cấu doanh thu theo Danh mục</p>
                        ${chart2Img ? `<img src="${chart2Img}" style="width: 100%; height: auto; max-height: 200px;" />` : `<div style="padding: 40px 0; color: #94a3b8; font-size: 11px;">Không có biểu đồ</div>`}
                    </div>
                </div>
            </div>

            <!-- Page Break -->
            <div style="page-break-before: always; height: 10px;"></div>

            <!-- Charts Row 2 - Revenue Trend -->
            <div style="margin-bottom: 25px;">
                <h3 style="font-size: 14px; font-weight: 700; margin: 0 0 12px 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; color: #1e293b; text-transform: uppercase;">II. Xu hướng doanh thu theo thời gian</h3>
                <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; text-align: center; background: #fff;">
                    <p style="margin: 0 0 8px 0; font-size: 10px; color: #64748b; font-weight: 600;">Biểu đồ xu hướng doanh thu 12 tháng</p>
                    ${chart3Img ? `<img src="${chart3Img}" style="width: 100%; height: auto; max-height: 160px;" />` : `<div style="padding: 40px 0; color: #94a3b8; font-size: 11px;">Không có biểu đồ</div>`}
                </div>
            </div>

            <!-- Detailed Table -->
            <div style="margin-bottom: 30px;">
                <h3 style="font-size: 14px; font-weight: 700; margin: 0 0 12px 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; color: #1e293b; text-transform: uppercase;">III. Bảng chi tiết doanh thu món ăn</h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
                    <thead>
                        <tr style="background: #6366f1; color: #fff; text-align: left;">
                            <th style="padding: 6px 8px; border: 1px solid #e2e8f0; text-align: center; width: 80px;">STT</th>
                            <th style="padding: 6px 8px; border: 1px solid #e2e8f0;">Tên món ăn</th>
                            <th style="padding: 6px 8px; border: 1px solid #e2e8f0; text-align: center; width: 120px;">Số lượng bán</th>
                            <th style="padding: 6px 8px; border: 1px solid #e2e8f0; text-align: right; width: 150px;">Doanh thu thu về</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRowsHtml}
                    </tbody>
                </table>
            </div>

            <!-- Footers and Signatures -->
            <div style="display: flex; justify-content: space-between; margin-top: 40px; font-size: 12px;">
                <div style="text-align: center; width: 220px;">
                    <p style="margin: 0; font-weight: 600;">Người lập báo cáo</p>
                    <p style="margin: 4px 0 35px 0; font-style: italic; color: #64748b; font-size: 10px;">(Ký và ghi rõ họ tên)</p>
                    <p style="margin: 0; font-weight: 700;">Ban Quản trị TiMi Food</p>
                </div>
                <div style="text-align: center; width: 220px;">
                    <p style="margin: 0; font-weight: 600;">Xác nhận Ban Giám đốc</p>
                    <p style="margin: 4px 0 35px 0; font-style: italic; color: #64748b; font-size: 10px;">(Ký tên và đóng dấu)</p>
                    <p style="margin: 0; font-weight: 700;">TiMi Food Co., Ltd</p>
                </div>
            </div>
        </div>
        `;

        document.body.appendChild(tempContainer);

        const opt = {
            margin: [10, 10, 10, 10],
            filename: `TiMiFood_BaoCaoDoanhThu_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, letterRendering: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        const element = document.getElementById("pdf-report-document");
        await html2pdf().set(opt).from(element).save();

        document.body.removeChild(tempContainer);
        toast({ title: 'Thành công', message: 'Đã xuất báo cáo PDF doanh thu thành công!', type: 'success', duration: 3000 });
    } catch (error) {
        console.error("PDF export error:", error);
        toast({ title: 'Lỗi', message: 'Không thể xuất báo cáo PDF!', type: 'error', duration: 3000 });
    } finally {
        hideLoader();
    }
}

function showVoucherArr(arr) {
    let html = "";
    if (!arr || arr.length == 0) {
        html = `<tr><td colspan="7" style="text-align:center;">Không có mã giảm giá nào</td></tr>`;
    } else {
        arr.forEach((v) => {
            let type = v.discountType == 0 ? "%" : "VND";
            let status = v.status == 1 ? `<span class="status-complete">Hoạt động</span>` : `<span class="status-no-complete">Tạm dừng</span>`;
            let expiry = formatDate(v.expiryDate);

            html += `<tr>
                <td><strong>${v.code}</strong></td>
                <td>${v.discountValue}${v.discountType == 0 ? '' : ' đ'}</td>
                <td>${type}</td>
                <td>${vnd(v.minOrder)}</td>
                <td>${expiry}</td>
                <td>${status}</td>
                <td class="control control-table">
                    <button class="btn-edit" onclick="toggleVoucher('${v.code}', ${v.status == 1 ? 0 : 1})"><i class="fa-light fa-power-off"></i></button>
                    <button class="btn-delete" onclick="deleteVoucher('${v.code}')"><i class="fa-light fa-trash"></i></button>
                </td>
            </tr>`;
        });
    }
    const target = document.getElementById("show-vouchers");
    if (target) target.innerHTML = html;
}

function openVoucherModal() {
    document.querySelector(".modal.voucher").classList.add("open");
}

function closeVoucherModal() {
    document.querySelector(".modal.voucher").classList.remove("open");
}

async function saveVoucher() {
    let code = document.getElementById("v-code").value;
    let value = document.getElementById("v-value").value;
    let type = document.getElementById("v-type").value;
    let min = document.getElementById("v-min").value;
    let max = document.getElementById("v-max").value;
    let expiry = document.getElementById("v-expiry").value;

    if (!code || !value || !expiry) {
        toast({ title: 'Lỗi', message: 'Vui lòng nhập đầy đủ thông tin bắt buộc!', type: 'error', duration: 3000 });
        return;
    }

    try {
        const response = await window.api.createVoucher({
            code,
            discountValue: parseInt(value),
            discountType: parseInt(type),
            minOrder: parseInt(min) || 0,
            maxDiscount: parseInt(max) || 0,
            expiryDate: expiry
        });

        if (response.success) {
            toast({ title: 'Thành công', message: 'Đã tạo mã giảm giá mới!', type: 'success', duration: 3000 });
            closeVoucherModal();
            await initAdmin();
        } else {
            toast({ title: 'Lỗi', message: response.message || 'Không thể tạo mã!', type: 'error', duration: 3000 });
        }
    } catch (error) {
        toast({ title: 'Lỗi', message: 'Lỗi kết nối server!', type: 'error', duration: 3000 });
    }
}

async function toggleVoucher(code, status) {
    try {
        await window.api.updateVoucherStatus(code, status);
        toast({ title: 'Thành công', message: 'Đã cập nhật trạng thái!', type: 'success', duration: 3000 });
        await initAdmin();
    } catch (error) {
        toast({ title: 'Lỗi', message: error.message || 'Không thể cập nhật trạng thái!', type: 'error', duration: 3000 });
    }
}

async function deleteVoucher(code) {
    if (confirm(`Bạn có chắc muốn xóa mã ${code}?`)) {
        try {
            await window.api.deleteVoucher(code);
            toast({ title: 'Thành công', message: 'Đã xóa mã giảm giá!', type: 'success', duration: 3000 });
            await initAdmin();
        } catch (error) {
            toast({ title: 'Lỗi', message: error.message || 'Không thể xóa mã!', type: 'error', duration: 3000 });
        }
    }
}
// --- REVIEW MANAGEMENT FUNCTIONS ---

async function showReviews() {
    try {
        console.log("Fetching reviews...");
        const reviews = await window.api.getAdminReviews();
        console.log("Reviews fetched:", reviews);

        const searchInput = document.getElementById('form-search-review')?.value.toLowerCase() || "";

        let filteredReviews = reviews;
        if (searchInput) {
            filteredReviews = reviews.filter(r =>
                r.productTitle.toLowerCase().includes(searchInput) ||
                r.customerName.toLowerCase().includes(searchInput) ||
                r.comment.toLowerCase().includes(searchInput)
            );
        }

        let html = "";
        if (!filteredReviews || filteredReviews.length === 0) {
            html = '<tr><td colspan="7" style="text-align:center;">Không có đánh giá nào</td></tr>';
        } else {
            filteredReviews.forEach(r => {
                const stars = Array(5).fill(0).map((_, i) =>
                    i < r.rating ? '<i class="fa-solid fa-star" style="color: #ffc107;"></i>' : '<i class="fa-regular fa-star"></i>'
                ).join('');

                const displayDate = r.reviewDate ? new Date(r.reviewDate.replace('Z', '')).toLocaleDateString('vi-VN') : '---';

                const commentText = r.comment || "";
                html += `
                <tr>
                    <td>${r.id}</td>
                    <td><strong>${r.productTitle}</strong></td>
                    <td>${r.customerName}</td>
                    <td><div class="stars-display">${stars}</div></td>
                    <td title="${commentText}">${commentText.length > 50 ? commentText.substring(0, 50) + '...' : commentText}</td>
                    <td>${displayDate}</td>
                    <td class="control">
                        <button class="btn-delete" onclick="deleteReviewAdmin(${r.id})">
                            <i class="fa-regular fa-trash"></i> Xóa
                        </button>
                    </td>
                </tr>`;
            });
        }
        const container = document.getElementById("show-reviews");
        if (container) {
            container.innerHTML = html;
        } else {
            console.error("Element #show-reviews not found!");
        }
    } catch (error) {
        console.error("Show reviews error:", error);
        toast({ title: 'Lỗi', message: 'Không thể tải danh sách đánh giá!', type: 'error', duration: 3000 });
    }
}

async function deleteReviewAdmin(id) {
    if (confirm("Bạn có chắc chắn muốn xóa đánh giá này? Thao tác này không thể hoàn tác.")) {
        try {
            const result = await window.api.deleteReview(id);
            if (result.success) {
                toast({ title: 'Thành công', message: 'Đã xóa đánh giá!', type: 'success', duration: 3000 });
                await showReviews();
            }
        } catch (error) {
            console.error("Delete review error:", error);
            toast({ title: 'Thất bại', message: 'Không thể xóa đánh giá!', type: 'error', duration: 3000 });
        }
    }
}

// --- STOCK MANAGEMENT LOGIC ---
async function showStockHistory() {
    try {
        const history = await window.api.getStockHistory();
        let html = "";
        if (history.length === 0) {
            html = `<tr><td colspan="5" style="text-align: center; padding: 20px;">Chưa có lịch sử nhập kho</td></tr>`;
        } else {
            history.forEach(item => {
                html += `
                <tr>
                    <td>#${item.id}</td>
                    <td>${item.productTitle}</td>
                    <td style="color: #00b894; font-weight: bold;">+${item.quantity}</td>
                    <td>${new Date(item.importDate.replace('Z', '')).toLocaleString('vi-VN')}</td>
                    <td>${item.note || '-'}</td>
                </tr>`;
            });
        }
        document.getElementById("show-stock-history").innerHTML = html;
    } catch (error) {
        console.error("Show stock history error:", error);
    }
}

async function openStockInModal() {
    try {
        const products = await window.api.getProducts("", true);
        let html = '<option value="">-- Chọn sản phẩm --</option>';
        products.forEach(p => {
            html += `<option value="${p.id}">${p.title} (Kho: ${p.stock})</option>`;
        });
        document.getElementById("stock-product-select").innerHTML = html;
        document.querySelector(".modal.stock-in").classList.add("open");
    } catch (error) {
        toast({ title: "Lỗi", message: "Không thể lấy danh sách sản phẩm!", type: "error", duration: 3000 });
    }
}

function closeStockInModal() {
    document.querySelector(".modal.stock-in").classList.remove("open");
    document.getElementById("stock-in-form").reset();
}

async function submitStockIn() {
    const productId = document.getElementById("stock-product-select").value;
    const quantity = document.getElementById("stock-quantity").value;
    const note = document.getElementById("stock-note").value;

    if (!productId || !quantity || quantity <= 0) {
        toast({ title: "Cảnh báo", message: "Vui lòng chọn sản phẩm và nhập số lượng hợp lệ!", type: "warning", duration: 3000 });
        return;
    }

    try {
        await window.api.stockIn({
            productId: parseInt(productId),
            quantity: parseInt(quantity),
            note: note
        });
        toast({ title: "Thành công", message: "Nhập hàng thành công!", type: "success", duration: 3000 });
        closeStockInModal();
        await showStockHistory();
        if (typeof showProduct === 'function') showProduct();
    } catch (error) {
        toast({ title: "Lỗi", message: error.message || "Không thể nhập hàng!", type: "error", duration: 3000 });
    }
}
// --- CATEGORY MANAGEMENT FUNCTIONS ---
async function showCategories() {
    try {
        const categories = await window.api.getCategories();
        let html = "";
        categories.forEach(cat => {
            html += `
                <tr>
                    <td>${cat.id}</td>
                    <td>${cat.name}</td>
                    <td>
                        <button class="btn-edit" onclick="openEditCategoryModal(${cat.id}, '${cat.name}')">
                            <i class="fa-light fa-pen-to-square"></i>
                        </button>
                        <button class="btn-delete" onclick="deleteCategory(${cat.id})">
                            <i class="fa-light fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
        document.getElementById("show-categories").innerHTML = html;
    } catch (error) {
        console.error("Show categories error:", error);
    }
}

function openAddCategoryModal() {
    document.querySelector(".category-title").innerText = "THÊM DANH MỤC";
    document.getElementById("category-submit-text").innerText = "XÁC NHẬN THÊM";
    document.getElementById("category-id").value = "";
    document.getElementById("category-name").value = "";
    document.querySelector(".category-modal").classList.add("open");
}

function openEditCategoryModal(id, name) {
    document.querySelector(".category-title").innerText = "CHỈNH SỬA DANH MỤC";
    document.getElementById("category-submit-text").innerText = "XÁC NHẬN LƯU";
    document.getElementById("category-id").value = id;
    document.getElementById("category-name").value = name;
    document.querySelector(".category-modal").classList.add("open");
}

function closeCategoryModal() {
    document.querySelector(".category-modal").classList.remove("open");
}

async function submitCategory() {
    const id = document.getElementById("category-id").value;
    const name = document.getElementById("category-name").value.trim();

    if (!name) {
        toast({ title: "Lỗi", message: "Tên danh mục không được để trống!", type: "error" });
        return;
    }

    try {
        if (id) {
            await window.api.updateCategory(id, name);
            toast({ title: "Thành công", message: "Cập nhật danh mục thành công!", type: "success" });
        } else {
            await window.api.addCategory(name);
            toast({ title: "Thành công", message: "Thêm danh mục mới thành công!", type: "success" });
        }
        closeCategoryModal();
        await showCategories();
        await loadCategoriesToSelect(); // Update selects in forms
    } catch (error) {
        toast({ title: "Lỗi", message: error.message || "Lỗi xử lý danh mục!", type: "error" });
    }
}

async function deleteCategory(id) {
    if (!confirm("Bạn có chắc chắn muốn xóa danh mục này?")) return;

    try {
        await window.api.deleteCategory(id);
        toast({ title: "Thành công", message: "Xóa danh mục thành công!", type: "success" });
        await showCategories();
        await loadCategoriesToSelect();
    } catch (error) {
        toast({ title: "Lỗi", message: error.message || "Lỗi khi xóa danh mục!", type: "error" });
    }
}

async function loadCategoriesToSelect() {
    try {
        const categories = await window.api.getCategories();

        // 1. Add/Edit Product Modal Select
        const chonMonSelect = document.getElementById("chon-mon");
        if (chonMonSelect) {
            let html = categories.map(cat => `<option>${cat.name}</option>`).join("");
            chonMonSelect.innerHTML = html;
        }

        // 2. Statistics Filter Select
        const theLoaiTkSelect = document.getElementById("the-loai-tk");
        if (theLoaiTkSelect) {
            let html = '<option>Tất cả</option>' + categories.map(cat => `<option>${cat.name}</option>`).join("") + '<option>Món khác</option>';
            theLoaiTkSelect.innerHTML = html;
        }

        // 3. Main Product Filter (if exists in admin or shared logic)
        // ...
    } catch (error) {
        console.error("Load categories to select error:", error);
    }
}

// Update initialization to load dynamic categories
const originalOnload = window.onload;
window.onload = async () => {
    if (originalOnload) await originalOnload();
    await loadCategoriesToSelect();
};
// --- System Logs Functions ---
async function showLogs() {
    const searchInput = document.getElementById("form-search-log");
    const searchVal = searchInput ? searchInput.value.toLowerCase() : "";
    try {
        const logs = await window.api.getLogs();
        if (!Array.isArray(logs)) return;

        const filteredLogs = logs.filter(log =>
            log.action.toLowerCase().includes(searchVal) ||
            log.userPhone.toLowerCase().includes(searchVal) ||
            log.details.toLowerCase().includes(searchVal)
        );
        showLogsArr(filteredLogs);
    } catch (error) {
        console.error("Error showing logs:", error);
    }
}

function showLogsArr(arr) {
    let html = '';
    if (!arr || arr.length === 0) {
        html = '<tr><td colspan="5">Không có dữ liệu nhật ký</td></tr>';
    } else {
        arr.forEach((log, index) => {
            let actionLabel = log.action;
            let actionClass = "status-no-complete";

            if (log.action.includes('ADD')) actionClass = "status-complete";
            if (log.action.includes('DELETE')) actionClass = "status-pending";

            html += `
                <tr>
                    <td>${index + 1}</td>
                    <td><b>${log.userPhone}</b></td>
                    <td><span class="${actionClass}" style="padding: 2px 8px; border-radius: 4px; font-size: 0.8rem;">${actionLabel}</span></td>
                    <td style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${log.details}">${log.details}</td>
                    <td>${new Date(log.createdAt).toLocaleString('vi-VN')}</td>
                </tr>
            `;
        });
    }
    document.getElementById("show-logs").innerHTML = html;
}

// --- 💬 Admin Live Chat Support System ---

let activeAdminSessions = [];
let currentActiveCustomerPhone = null;

// Initialize admin socket listener for live chat when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
    // Listen for socket events
    if (typeof socket !== 'undefined') {
        // When a new live chat session request comes in or gets updated
        socket.on('active_chats_updated', (chats) => {
            console.log('[Socket] Active chats updated:', chats);
            activeAdminSessions = Object.values(chats);
            renderChatSessionsAdmin();

            // If the currently viewed session is in the updated list, update its messages too
            if (currentActiveCustomerPhone) {
                const currentSession = activeAdminSessions.find(s => s.phone === currentActiveCustomerPhone);
                if (currentSession) {
                    renderActiveChatMessages(currentSession.messages);
                } else {
                    // Session was ended by customer or another agent
                    toast({ title: 'Thông báo', message: 'Phiên hỗ trợ đã kết thúc.', type: 'info' });
                    closeActiveChatWindow();
                }
            }
        });

        socket.on('receive_chat_message', (data) => {
            console.log('[Socket] Received message:', data);
            if (data.sender === 'customer') {
                if (typeof playNotificationSound === 'function') {
                    playNotificationSound('https://assets.mixkit.co/active_storage/sfx/1110/1110-preview.mp3');
                }

                // Show notification badge if not on the live chat tab
                const liveChatTab = document.querySelectorAll('.sidebar-list-item.tab-content')[10];
                if (liveChatTab && !liveChatTab.classList.contains('active')) {
                    const badge = document.getElementById('livechat-badge');
                    if (badge) {
                        badge.style.display = 'inline-block';
                        const currentVal = parseInt(badge.textContent || '0');
                        badge.textContent = currentVal + 1;
                    }
                }
            }
        });
    }
});

// Load live chat sessions from API
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
                        <button class="btn-delete" onclick="deleteContact(${c.id})" title="Xóa"><i class="fa-regular fa-trash"></i></button>
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
                    <button id="btn-send-reply" onclick="sendContactReply(${contact.id})" style="background-color: #3b82f6; color: white; border: none; padding: 10px 20px; border-radius: 6px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 8px;">
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
                            <button class="btn-control" style="background:#3b82f6; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer;" onclick="viewChatMessages(${session.id})"><i class="fa-light fa-eye"></i> Xem</button>
                            <button class="btn-control" style="background:#ef4444; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer;" onclick="deleteChatSession(${session.id})"><i class="fa-light fa-trash"></i> Xóa</button>
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

