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

        if (typeof loadPaginatedOrders === 'function') {
            await loadPaginatedOrders(1);
        } else {
            showOrder(orders);
        }

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
                    if (typeof loadPaginatedOrders === 'function') {
                        await loadPaginatedOrders(typeof currentOrderPage !== 'undefined' ? currentOrderPage : 1);
                    } else if (typeof showOrder === 'function') {
                        showOrder(orders);
                    }

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