let PHIVANCHUYEN = 30000;
// TiMiFood Store location (Lat, Lng). Default is somewhere in HCMC.
// You should change this to your actual store's coordinates.
const STORE_LATLNG = [10.762622, 106.660172];
let priceFinal = document.getElementById("checkout-cart-price-final");
let currentOrderVoucher = null;
let currentOrderDiscount = 0;
let currentShippingVoucher = null;
let currentShippingDiscount = 0;
let currentCheckoutProduct = null;
let currentTotalBill = 0;

// Trang thanh toan
async function thanhtoanpage(option, product) {
    currentCheckoutProduct = product; // Lưu lại để dùng khi bấm đặt hàng
    currentOrderVoucher = null;
    currentOrderDiscount = 0;
    currentShippingVoucher = null;
    currentShippingDiscount = 0;
    if (document.getElementById('unified-voucher-code')) document.getElementById('unified-voucher-code').value = "";
    if (document.getElementById('unified-voucher-message')) document.getElementById('unified-voucher-message').innerHTML = "";
    if (typeof renderAppliedVouchers === 'function') renderAppliedVouchers();
    if (document.getElementById('discount-amount-row')) document.getElementById('discount-amount-row').style.display = "none";
    // Kiểm tra xem có đang sửa đơn không
    const editingOrder = localStorage.getItem('editingOrder') ? JSON.parse(localStorage.getItem('editingOrder')) : null;
    const checkoutBtn = document.querySelector('.complete-checkout-btn');
    if (editingOrder && checkoutBtn) {
        checkoutBtn.innerText = 'Cập nhật đơn hàng';
    } else if (checkoutBtn) {
        checkoutBtn.innerText = 'Đặt hàng';
    }

    // Xu ly ngay nhan hang
    let today = new Date();
    let ngaymai = new Date();
    let ngaykia = new Date();
    ngaymai.setDate(today.getDate() + 1);
    ngaykia.setDate(today.getDate() + 2);
    let dateorderhtml = `<a href="javascript:;" class="pick-date active" data-date="${today.toISOString()}">
        <span class="text">Hôm nay</span>
        <span class="date">${today.getDate()}/${today.getMonth() + 1}</span>
        </a>
        <a href="javascript:;" class="pick-date" data-date="${ngaymai.toISOString()}">
            <span class="text">Ngày mai</span>
            <span class="date">${ngaymai.getDate()}/${ngaymai.getMonth() + 1}</span>
        </a>

        <a href="javascript:;" class="pick-date" data-date="${ngaykia.toISOString()}">
            <span class="text">Ngày kia</span>
            <span class="date">${ngaykia.getDate()}/${ngaykia.getMonth() + 1}</span>
    </a>`
    document.querySelector('.date-order').innerHTML = dateorderhtml;
    let pickdate = document.getElementsByClassName('pick-date')
    for (let i = 0; i < pickdate.length; i++) {
        pickdate[i].onclick = function () {
            document.querySelector(".pick-date.active").classList.remove("active");
            this.classList.add('active');
        }
    }

    let totalBillOrder = document.querySelector('.total-bill-order');
    let totalBillOrderHtml;
    // Xu ly don hang
    switch (option) {
        case 1: // Truong hop thanh toan san pham trong gio
            // Hien thi don hang
            await showProductCart();
            // Tinh tien
            const cartTotal = await getCartTotal();
            totalBillOrderHtml = `<div class="priceFlx">
            <div class="text">
                Tiền hàng 
                <span class="count">${getAmountCart()} món</span>
            </div>
            <div class="price-detail">
                <span id="checkout-cart-total">${vnd(cartTotal)}</span>
            </div>
        </div>
        <div class="priceFlx chk-ship">
            <div class="text">Phí vận chuyển</div>
            <div class="price-detail chk-free-ship">
                <span>${vnd(PHIVANCHUYEN)}</span>
            </div>
        </div>`;
            // Tong tien
            updateCheckoutTotal(cartTotal + PHIVANCHUYEN);
            break;
        case 2: // Truong hop mua ngay
            // Hien thi san pham
            showProductBuyNow(product);
            // Tinh tien
            totalBillOrderHtml = `<div class="priceFlx">
                <div class="text">
                    Tiền hàng 
                    <span class="count">${product.soluong} món</span>
                </div>
                <div class="price-detail">
                    <span id="checkout-cart-total">${vnd(product.soluong * product.price)}</span>
                </div>
            </div>
            <div class="priceFlx chk-ship">
                <div class="text">Phí vận chuyển</div>
                <div class="price-detail chk-free-ship">
                    <span>${vnd(PHIVANCHUYEN)}</span>
                </div>
            </div>`
            // Tong tien
            updateCheckoutTotal((product.soluong * product.price) + PHIVANCHUYEN);
            break;
    }

    // Tinh tien
    totalBillOrder.innerHTML = totalBillOrderHtml;

    // Xu ly hinh thuc giao hang
    let giaotannoi = document.querySelector('#giaotannoi');
    let tudenlay = document.querySelector('#tudenlay');
    let tudenlayGroup = document.querySelector('#tudenlay-group');
    let chkShip = document.querySelectorAll(".chk-ship");

    tudenlay.addEventListener('click', async () => {
        giaotannoi.classList.remove("active");
        tudenlay.classList.add("active");
        chkShip.forEach(item => {
            item.style.display = "none";
        });
        tudenlayGroup.style.display = "block";

        // Khi tự đến lấy, mặc định lấy địa chỉ của chi nhánh đầu tiên hoặc xóa trắng để khách chọn
        document.getElementById('diachinhan').value = "";

        switch (option) {
            case 1:
                const cartTotal = await getCartTotal();
                updateCheckoutTotal(cartTotal);
                break;
            case 2:
                updateCheckoutTotal((product.soluong * product.price));
                break;
        }

        if (currentOrderVoucher || currentShippingVoucher) {
            recalculateTotals(); 
        } else {
            let totalPrice = option === 1 ? await getCartTotal() : (product.soluong * product.price);
            updateCheckoutTotal(totalPrice);
        }
    })

    giaotannoi.addEventListener('click', async () => {
        tudenlay.classList.remove("active");
        giaotannoi.classList.add("active");
        chkShip.forEach(item => {
            item.style.display = "flex";
        });
        tudenlayGroup.style.display = "none";

        // Khôi phục lại địa chỉ của user nếu có
        const currentUser = JSON.parse(localStorage.getItem('currentuser'));
        if (currentUser && currentUser.address) {
            document.getElementById('diachinhan').value = currentUser.address;
        }

        switch (option) {
            case 1:
                const cartTotal = await getCartTotal();
                updateCheckoutTotal(cartTotal + PHIVANCHUYEN);
                break;
            case 2:
                updateCheckoutTotal((product.soluong * product.price) + PHIVANCHUYEN);
                break;
        }

        if (currentOrderVoucher || currentShippingVoucher) {
            recalculateTotals(); 
        } else {
            let totalPrice = option === 1 ? await getCartTotal() : (product.soluong * product.price);
            updateCheckoutTotal(totalPrice + PHIVANCHUYEN);
        }
    })

    // Lắng nghe sự kiện chọn chi nhánh
    let chinhanhRadios = document.querySelectorAll('input[name="chinhanh"]');
    chinhanhRadios.forEach(radio => {
        radio.addEventListener('change', function () {
            if (this.checked) {
                let label = document.querySelector(`label[for="${this.id}"]`).innerText;
                document.getElementById('diachinhan').value = "Lấy tại chi nhánh: " + label;
            }
        });
    });

    // Xu ly hinh thuc thanh toan
    let paymentItems = document.querySelectorAll('.payment-item');
    paymentItems.forEach(item => {
        item.onclick = function () {
            paymentItems.forEach(p => p.classList.remove('active'));
            this.classList.add('active');
        }
    });

    // Populate user info if logged in
    const currentUser = JSON.parse(localStorage.getItem('currentuser'));
    if (currentUser) {
        document.getElementById('tennguoinhan').value = currentUser.fullname || "";
        document.getElementById('sdtnhan').value = currentUser.phone || "";
        document.getElementById('diachinhan').value = currentUser.address || "";
    }

    // Lang nghe thay doi SDT de cap nhat QR Code dong
    const sdtNhanInput = document.getElementById('sdtnhan');
    if (sdtNhanInput) {
        sdtNhanInput.addEventListener('input', () => {
            if (currentTotalBill > 0) {
                updateDynamicQRCodes(currentTotalBill);
            }
        });
    }
}

async function showProductCart() {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (cart.length === 0) {
        let currentUser = JSON.parse(localStorage.getItem('currentuser'));
        if (currentUser && currentUser.cart) cart = currentUser.cart;
    }

    if (cart.length === 0) return;

    let products = await window.api.getProducts();
    let html = "";
    cart.forEach((item, index) => {
        let detaiSP = products.find(p => p.id == item.id);
        if (detaiSP) {
            html += `<div class="bill-product">
                <div class="bill-product-img">
                    <img src="${detaiSP.img}" alt="">
                </div>
                <div class="bill-product-info">
                    <div class="bill-product-name">${detaiSP.title}</div>
                    <div class="checkout-product-qty">
                        <button class="checkout-qty-btn" onclick="changeQtyCheckout('${index}', -1)"><i class="fa-regular fa-minus"></i></button>
                        <input class="checkout-qty-input" type="text" value="${item.soluong}" readonly>
                        <button class="checkout-qty-btn" onclick="changeQtyCheckout('${index}', 1)"><i class="fa-regular fa-plus"></i></button>
                    </div>
                    <div class="bill-product-price">${vnd(detaiSP.price * item.soluong)}</div>
                </div>
            </div>`;
        }
    });
    document.getElementById('list-order-checkout').innerHTML = html;
}

window.changeQtyCheckout = async function (index, delta) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    let currentUser = JSON.parse(localStorage.getItem('currentuser'));

    if (cart.length === 0 && currentUser && currentUser.cart) {
        cart = currentUser.cart;
    }

    if (cart[index]) {
        cart[index].soluong = parseInt(cart[index].soluong) + delta;
        if (cart[index].soluong < 1) {
            if (confirm("Bạn có muốn xóa món này khỏi đơn hàng không?")) {
                cart.splice(index, 1);
            } else {
                cart[index].soluong = 1;
            }
        }
    }

    // Update source
    if (localStorage.getItem('cart')) {
        localStorage.setItem('cart', JSON.stringify(cart));
    }
    if (currentUser) {
        currentUser.cart = cart;
        localStorage.setItem('currentuser', JSON.stringify(currentUser));
        await window.api.updateCart(cart);
    }

    // Refresh UI
    updateAmount();
    await showProductCart();
    const cartTotal = await getCartTotal();
    const giaotannoi = document.querySelector("#giaotannoi");
    const shippingFee = (giaotannoi && giaotannoi.classList.contains("active")) ? PHIVANCHUYEN : 0;

    // Update the price display
    document.getElementById('checkout-cart-total').innerText = vnd(cartTotal);
    
    if (currentOrderVoucher || currentShippingVoucher) {
        recalculateTotals(); 
    } else {
        updateCheckoutTotal(cartTotal + shippingFee);
    }
}

function showProductBuyNow(product) {
    let html = `<div class="bill-product">
        <div class="bill-product-img">
            <img src="${product.img}" alt="">
        </div>
        <div class="bill-product-info">
            <div class="bill-product-name">${product.title}</div>
            <div class="checkout-product-qty">
                <button class="checkout-qty-btn" onclick="changeQtyBuyNow(-1)"><i class="fa-regular fa-minus"></i></button>
                <input class="checkout-qty-input" type="text" value="${product.soluong}" readonly>
                <button class="checkout-qty-btn" onclick="changeQtyBuyNow(1)"><i class="fa-regular fa-plus"></i></button>
            </div>
            <div class="bill-product-price">${vnd(product.price * product.soluong)}</div>
        </div>
    </div>`;
    document.getElementById('list-order-checkout').innerHTML = html;
}

window.changeQtyBuyNow = function (delta) {
    if (!currentCheckoutProduct) return;

    currentCheckoutProduct.soluong += delta;
    if (currentCheckoutProduct.soluong < 1) {
        currentCheckoutProduct.soluong = 1;
    }

    // Refresh UI
    showProductBuyNow(currentCheckoutProduct);

    // Update Billing Summary
    const itemTotal = currentCheckoutProduct.soluong * currentCheckoutProduct.price;
    document.getElementById('checkout-cart-total').innerText = vnd(itemTotal);
    document.querySelector('.total-bill-order .count').innerText = `${currentCheckoutProduct.soluong} món`;

    const giaotannoi = document.querySelector("#giaotannoi");
    const shippingFee = (giaotannoi && giaotannoi.classList.contains("active")) ? PHIVANCHUYEN : 0;

    if (currentOrderVoucher || currentShippingVoucher) {
        recalculateTotals(); 
    } else {
        updateCheckoutTotal(itemTotal + shippingFee);
    }
}

function updateCheckoutTotal(total) {
    currentTotalBill = total;
    priceFinal.innerText = vnd(total);
    updateDynamicQRCodes(total);
}

function updateDynamicQRCodes(amount) {
    if (!amount || amount <= 0) return;

    const currentUser = localStorage.getItem('currentuser') ? JSON.parse(localStorage.getItem('currentuser')) : null;
    const phoneInput = document.getElementById('sdtnhan');
    const phone = phoneInput && phoneInput.value.trim() ? phoneInput.value.trim() : (currentUser ? currentUser.phone : 'Guest');

    // Loai bo dau tieng Viet, ky tu dac biet cho noi dung chuyen khoan
    const description = `TiMiFood ${phone}`.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9 ]/g, "");

    // 1. Cap nhat mini QR VNPAY (MB Bank 24888816052005)
    const vnpayMiniQR = document.querySelector('.payment-item[data-payment="vnpay"] .payment-qr-mini img');
    if (vnpayMiniQR) {
        vnpayMiniQR.src = `https://img.vietqr.io/image/MB-24888816052005-qr_only.png?amount=${amount}&addInfo=${encodeURIComponent(description)}&accountName=${encodeURIComponent("NGUYEN VAN NGAN")}`;
    }

    // 2. Cap nhat mini QR MoMo (0345975990)
    const momoMiniQR = document.querySelector('.payment-item[data-payment="momo"] .payment-qr-mini img');
    if (momoMiniQR) {
        momoMiniQR.src = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`https://nhantien.momo.vn/0345975990/${amount}`)}`;
    }
}

// Close Page Checkout
async function closecheckout() {
    document.querySelector(".checkout-page").classList.remove('active');
    body.style.overflow = "auto";

    // Khôi phục giỏ hàng cũ nếu có backup
    const cartBackup = localStorage.getItem('cartBackup');
    if (cartBackup) {
        let currentUser = JSON.parse(localStorage.getItem('currentuser'));
        if (currentUser) {
            currentUser.cart = JSON.parse(cartBackup);
            localStorage.setItem('currentuser', JSON.stringify(currentUser));
            await window.api.updateCart(currentUser.cart);
        } else {
            localStorage.setItem('cart', cartBackup);
        }
        localStorage.removeItem('cartBackup');
        updateAmount();
    }

    // Reset editing state
    localStorage.removeItem('editingOrder');
    // Reset voucher state for next time
    currentOrderVoucher = null;
    currentOrderDiscount = 0;
    currentShippingVoucher = null;
    currentShippingDiscount = 0;
    if (document.getElementById('unified-voucher-code')) document.getElementById('unified-voucher-code').value = "";
    if (document.getElementById('discount-amount-row')) document.getElementById('discount-amount-row').style.display = "none";
    if (document.getElementById('unified-voucher-message')) document.getElementById('unified-voucher-message').innerHTML = "";
    if (typeof renderAppliedVouchers === 'function') renderAppliedVouchers();
}

// Add this function to fill info when editing
window.fillEditOrderInfo = function (order) {
    setTimeout(() => {
        if (document.getElementById('tennguoinhan')) document.getElementById('tennguoinhan').value = order.tenguoinhan || "";
        if (document.getElementById('sdtnhan')) document.getElementById('sdtnhan').value = order.sdtnhan || "";
        if (document.getElementById('diachinhan')) document.getElementById('diachinhan').value = order.diachinhan || "";
        if (document.querySelector(".note-order")) document.querySelector(".note-order").value = order.ghichu || "";

        // Handle delivery type
        if (order.hinhthucgiao === "Giao tận nơi") {
            const btn = document.querySelector('#giaotannoi');
            if (btn) btn.click();
        } else {
            const btn = document.querySelector('#tudenlay');
            if (btn) btn.click();
        }
    }, 200);
}

window.removeUnifiedVoucher = function(type) {
    if (type === 'order') {
        currentOrderVoucher = null;
        currentOrderDiscount = 0;
    } else if (type === 'shipping') {
        currentShippingVoucher = null;
        currentShippingDiscount = 0;
    }
    
    document.getElementById('unified-voucher-code').value = "";
    document.getElementById('unified-voucher-message').innerHTML = "";
    
    recalculateTotals();
    renderAppliedVouchers();
}

window.renderAppliedVouchers = function() {
    const container = document.getElementById('applied-vouchers-container');
    if (!container) return;
    
    let html = '';
    if (currentOrderVoucher) {
        html += `
        <div style="display: flex; justify-content: space-between; align-items: center; background: #e6f7ff; border: 1px solid #91d5ff; border-radius: 4px; padding: 6px 10px; font-size: 12px;">
            <div><span style="font-weight: 600; color: #0050b3;">[Đơn hàng]</span> ${currentOrderVoucher.code}</div>
            <button onclick="removeUnifiedVoucher('order')" style="background: none; border: none; color: #ff4d4f; cursor: pointer; font-weight: bold;"><i class="fa-solid fa-times"></i></button>
        </div>`;
    }
    if (currentShippingVoucher) {
        html += `
        <div style="display: flex; justify-content: space-between; align-items: center; background: #e6f7ff; border: 1px solid #91d5ff; border-radius: 4px; padding: 6px 10px; font-size: 12px;">
            <div><span style="font-weight: 600; color: #0050b3;">[Vận chuyển]</span> ${currentShippingVoucher.code}</div>
            <button onclick="removeUnifiedVoucher('shipping')" style="background: none; border: none; color: #ff4d4f; cursor: pointer; font-weight: bold;"><i class="fa-solid fa-times"></i></button>
        </div>`;
    }
    container.innerHTML = html;
}

window.applyUnifiedVoucher = async function(inputCode) {
    const codeInput = document.getElementById('unified-voucher-code');
    const msgBox = document.getElementById('unified-voucher-message');
    
    let code = '';
    if (typeof inputCode === 'string') {
        code = inputCode;
    } else if (codeInput) {
        code = codeInput.value.trim();
    }

    if (!code) {
        if (msgBox) msgBox.innerHTML = '<span style="color: #ef4444; font-size: 13px;">Vui lòng nhập mã giảm giá</span>';
        return;
    }

    try {
        console.log("Checking voucher:", code);
        const result = await window.api.checkVoucher(code);
        console.log("Voucher result:", result);

        if (result.success) {
            const voucher = result.voucher;
            
            if (voucher.discountType == 0 || voucher.discountType == 1) {
                currentOrderVoucher = voucher;
                if (codeInput && !codeInput.value) codeInput.value = "";
            } else if (voucher.discountType == 2 || voucher.discountType == 3) {
                currentShippingVoucher = voucher;
                if (codeInput && !codeInput.value) codeInput.value = "";
            }
            
            if (msgBox) msgBox.innerHTML = `<span style="color: #00b894; font-size: 13px;">Đã áp dụng mã: ${voucher.code}</span>`;
            if (codeInput) codeInput.value = "";
            
            await recalculateTotals();
            renderAppliedVouchers();
            toast({ title: 'Thành công', message: 'Áp dụng mã giảm giá thành công!', type: 'success', duration: 3000 });
        } else {
            if (msgBox) msgBox.innerHTML = `<span style="color: #ef4444; font-size: 13px;">${result.message || 'Mã không hợp lệ'}</span>`;
        }
    } catch (error) {
        console.error("Voucher application error:", error);
        if (msgBox) msgBox.innerHTML = '<span style="color: #ef4444; font-size: 13px;">Lỗi hệ thống khi kiểm tra mã</span>';
    }
};

window.recalculateTotals = async function() {
    let baseTotal = 0;
    if (currentCheckoutProduct) {
        baseTotal = currentCheckoutProduct.price * currentCheckoutProduct.soluong;
    } else {
        baseTotal = await getCartTotal();
    }

    const giaotannoi = document.querySelector("#giaotannoi");
    const shippingFee = (giaotannoi && giaotannoi.classList.contains("active")) ? PHIVANCHUYEN : 0;
    
    // Process Order Voucher
    if (currentOrderVoucher) {
        if (baseTotal < (currentOrderVoucher.minOrder || 0)) {
            currentOrderVoucher = null;
            currentOrderDiscount = 0;
            const msgBox = document.getElementById('unified-voucher-message');
            if (msgBox) msgBox.innerHTML = `<span style="color: #ef4444; font-size: 13px;">Đơn hàng chưa đạt tối thiểu ${vnd(currentOrderVoucher.minOrder)} để dùng mã đơn hàng</span>`;
        } else {
            if (currentOrderVoucher.discountType == 0) {
                currentOrderDiscount = (baseTotal * currentOrderVoucher.discountValue) / 100;
                if (currentOrderVoucher.maxDiscount > 0 && currentOrderDiscount > currentOrderVoucher.maxDiscount) {
                    currentOrderDiscount = currentOrderVoucher.maxDiscount;
                }
            } else if (currentOrderVoucher.discountType == 1) {
                currentOrderDiscount = currentOrderVoucher.discountValue;
            }
            if (currentOrderDiscount > baseTotal) currentOrderDiscount = baseTotal;
        }
    } else {
        currentOrderDiscount = 0;
    }
    
    // Process Shipping Voucher
    if (currentShippingVoucher) {
        if (baseTotal < (currentShippingVoucher.minOrder || 0)) {
            currentShippingVoucher = null;
            currentShippingDiscount = 0;
            const msgBox = document.getElementById('unified-voucher-message');
            if (msgBox) msgBox.innerHTML = `<span style="color: #ef4444; font-size: 13px;">Đơn hàng chưa đạt tối thiểu ${vnd(currentShippingVoucher.minOrder)} để dùng mã Freeship</span>`;
        } else if (shippingFee === 0) {
            currentShippingVoucher = null;
            currentShippingDiscount = 0;
            const msgBox = document.getElementById('unified-voucher-message');
            if (msgBox) msgBox.innerHTML = `<span style="color: #ef4444; font-size: 13px;">Đơn hàng không có phí vận chuyển</span>`;
        } else {
            if (currentShippingVoucher.discountType == 2) {
                currentShippingDiscount = currentShippingVoucher.discountValue;
            } else if (currentShippingVoucher.discountType == 3) {
                currentShippingDiscount = shippingFee;
            }
            if (currentShippingDiscount > shippingFee) currentShippingDiscount = shippingFee;
        }
    } else {
        currentShippingDiscount = 0;
    }
    
    if (typeof renderAppliedVouchers === 'function') renderAppliedVouchers();
    
    // Update discount amount UI
    const discountRow = document.getElementById('discount-amount-row');
    const discountValEl = document.getElementById('checkout-voucher-discount');
    const totalDiscount = currentOrderDiscount + currentShippingDiscount;
    if (discountRow && discountValEl) {
        if (totalDiscount > 0) {
            discountRow.style.display = "flex";
            discountValEl.innerText = "-" + vnd(totalDiscount);
        } else {
            discountRow.style.display = "none";
        }
    }
    
    updateCheckoutTotal(baseTotal + shippingFee - currentOrderDiscount - currentShippingDiscount);
}

async function getCartTotal() {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (cart.length === 0) {
        let currentUser = JSON.parse(localStorage.getItem('currentuser'));
        if (currentUser && currentUser.cart) cart = currentUser.cart;
    }

    if (cart.length === 0) return 0;

    let products = await window.api.getProducts();
    return cart.reduce((sum, item) => {
        let p = products.find(prod => prod.id == item.id);
        return sum + (p ? p.price * item.soluong : 0);
    }, 0);
}

// Mo phong thanh toan online
let pendingOrderData = null;
let currentSimOrderId = null;

async function openPaymentSim(method, amount, orderId) {
    const modal = document.querySelector('.modal-payment-sim');
    const gateImg = document.getElementById('payment-gate-img');
    const qrImg = document.getElementById('payment-qr-img');
    const amountVal = document.getElementById('payment-amount-value');
    const warningBanner = document.getElementById('payment-sim-warning');
    const payosLink = document.getElementById('payment-payos-link');

    currentSimOrderId = orderId;
    amountVal.innerText = vnd(amount);

    if (warningBanner) warningBanner.style.display = 'none';
    if (payosLink) payosLink.style.display = 'none';

    if (method === 'momo') {
        gateImg.src = './assets/img/icons/momo-icon.png';
    } else {
        gateImg.src = './assets/img/icons/vnpay-icon.png';
    }

    // Cố gắng tạo link PayOS thật từ backend
    try {
        const currentUser = localStorage.getItem('currentuser') ? JSON.parse(localStorage.getItem('currentuser')) : null;
        const description = `TiMiFood ${orderId}`;

        const payosResult = await window.api.createPayOSPaymentLink(orderId, amount, description);
        if (payosResult && payosResult.success) {
            // Hiển thị QR của PayOS và nút thanh toán trực tiếp
            // PayOS trả về qrCode là chuỗi text EMVCo, cần dùng API để tạo ảnh QR
            const qrDataStr = payosResult.qrCode || payosResult.checkoutUrl;
            qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrDataStr)}`;
            
            if (payosLink) {
                payosLink.href = payosResult.checkoutUrl;
                payosLink.style.display = 'inline-block';
            }
        } else {
            throw new Error("PayOS chưa được cấu hình");
        }
    } catch (err) {
        console.warn("[Checkout] Không tạo được liên kết PayOS thật, chuyển sang chế độ mô phỏng:", err.message);

        // Chuyển sang chế độ mô phỏng (Mock/Simulation)
        if (warningBanner) warningBanner.style.display = 'block';

        const currentUser = localStorage.getItem('currentuser') ? JSON.parse(localStorage.getItem('currentuser')) : null;
        const phoneInput = document.getElementById('sdtnhan');
        const phone = phoneInput && phoneInput.value.trim() ? phoneInput.value.trim() : (currentUser ? currentUser.phone : 'Guest');
        const description = `TiMiFood ${phone}`.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9 ]/g, "");

        if (method === 'momo') {
            qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`https://nhantien.momo.vn/0345975990/${amount}`)}`;
        } else {
            qrImg.src = `https://img.vietqr.io/image/MB-24888816052005-qr_only.png?amount=${amount}&addInfo=${encodeURIComponent(description)}&accountName=${encodeURIComponent("NGUYEN VAN NGAN")}`;
        }
    }

    modal.classList.add('open');
}

function closePaymentSim() {
    document.querySelector('.modal-payment-sim').classList.remove('open');
    pendingOrderData = null;
    currentSimOrderId = null;
}

async function confirmPaymentSim() {
    if (currentSimOrderId) {
        try {
            // Gọi API mô phỏng thanh toán PayOS
            const result = await window.api.simulatePayosPayment(currentSimOrderId);
            if (result.success) {
                toast({ title: 'Thành công', message: 'Xác nhận thanh toán thành công (Mô phỏng)!', type: 'success', duration: 3000 });
                closePaymentSim();
                closecheckout();

                // Đồng bộ thông báo để admin thấy ngay
                if (typeof syncNotificationsFromServer === 'function') {
                    syncNotificationsFromServer();
                }

                if (typeof renderOrderProduct === 'function') await renderOrderProduct();
            } else {
                toast({ title: 'Lỗi', message: result.message || 'Lỗi khi cập nhật đơn hàng!', type: 'error', duration: 3000 });
            }
        } catch (error) {
            console.error("Payment confirmation error:", error);
            toast({ title: 'Lỗi', message: 'Không thể kết nối máy chủ!', type: 'error', duration: 3000 });
        }
    }
}

// Thong tin cac don hang da mua - Xu ly khi nhan nut dat hang
async function xulyDathang(product) {
    let diachinhan = "";
    let hinhthucgiao = "";
    let thoigiangiao = "";
    let giaotannoi = document.querySelector("#giaotannoi");
    let tudenlay = document.querySelector("#tudenlay");
    let giaongay = document.querySelector("#giaongay");
    let giaovaogio = document.querySelector("#deliverytime");
    let currentUser = localStorage.getItem('currentuser') ? JSON.parse(localStorage.getItem('currentuser')) : null;

    if (!currentUser || !currentUser.id) {
        toast({ title: 'Cảnh báo', message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng xuất và đăng nhập lại!', type: 'warning', duration: 4000 });
        return;
    }

    const editingOrder = localStorage.getItem('editingOrder') ? JSON.parse(localStorage.getItem('editingOrder')) : null;

    // Kiem tra thong tin nhan hang
    let tenNguoiNhan = document.querySelector("#tennguoinhan").value;
    let sdtNhan = document.querySelector("#sdtnhan").value;
    if (!tenNguoiNhan || !sdtNhan) {
        toast({ title: 'Cảnh báo', message: 'Vui lòng nhập tên và số điện thoại người nhận!', type: 'warning', duration: 3000 });
        return;
    }

    // Hinh thuc giao & Dia chi nhan hang
    if (giaotannoi.classList.contains("active")) {
        diachinhan = document.querySelector("#diachinhan").value;
        if (!diachinhan) {
            toast({ title: 'Cảnh báo', message: 'Vui lòng nhập địa chỉ nhận hàng!', type: 'warning', duration: 3000 });
            return;
        }
        hinhthucgiao = giaotannoi.innerText.trim();
    }
    if (tudenlay.classList.contains("active")) {
        let chinhanh1 = document.querySelector("#chinhanh-1");
        let chinhanh2 = document.querySelector("#chinhanh-2");
        if (chinhanh1 && chinhanh1.checked) {
            diachinhan = "165 Trần Quốc Chẩn, Chu Văn An, Hải Phòng";
        } else if (chinhanh2 && chinhanh2.checked) {
            diachinhan = "76 Nguyễn Thị Duệ, Chu Văn An, Hải Phòng";
        } else {
            toast({ title: 'Cảnh báo', message: 'Vui lòng chọn chi nhánh nhận hàng!', type: 'warning', duration: 3000 });
            return;
        }
        hinhthucgiao = tudenlay.innerText.trim();
    }

    // Thoi gian nhan hang
    if (giaotannoi.classList.contains("active")) {
        if (giaongay && giaongay.checked) {
            thoigiangiao = "Giao ngay khi xong";
        } else if (giaovaogio && giaovaogio.checked) {
            thoigiangiao = document.querySelector(".choise-time").value;
        } else {
            toast({ title: 'Cảnh báo', message: 'Vui lòng chọn thời gian nhận hàng!', type: 'warning', duration: 3000 });
            return;
        }
    } else {
        let layngay = document.querySelector("#layngay");
        let pickuptime = document.querySelector("#pickuptime");
        if (layngay && layngay.checked) {
            thoigiangiao = "Chuẩn bị ngay (15-30 phút)";
        } else if (pickuptime && pickuptime.checked) {
            thoigiangiao = document.querySelector(".choise-time-pickup").value;
        } else {
            toast({ title: 'Cảnh báo', message: 'Vui lòng chọn thời gian đến lấy!', type: 'warning', duration: 3000 });
            return;
        }
    }

    let tongtien = 0;
    let chitiet = [];
    let products = await window.api.getProducts();
    if (product == undefined) {
        // Lấy giỏ hàng từ localStorage thay vì currentUser.cart để hỗ trợ chế độ sửa đơn
        let cart = JSON.parse(localStorage.getItem('cart')) || currentUser.cart || [];
        cart.forEach(item => {
            let detaiSP = products.find(p => p.id == item.id);
            let price = detaiSP ? detaiSP.price : item.price;
            tongtien += price * item.soluong;
            chitiet.push({
                id: item.id,
                price: price,
                soluong: item.soluong,
                note: item.note || ""
            });
        });
    } else {
        tongtien = product.soluong * product.price;
        chitiet.push({
            id: product.id,
            price: product.price,
            soluong: product.soluong,
            note: product.note || ""
        });
    }

    const pickDateActive = document.querySelector(".pick-date.active");
    const isGiaoTanNoi = giaotannoi.classList.contains("active");
    const shippingFee = isGiaoTanNoi ? PHIVANCHUYEN : 0;
    const finalTotal = (tongtien + shippingFee) - currentDiscount;

    // Tự động tìm tọa độ GPS nếu khách chỉ nhập chữ (không chọn trên bản đồ)
    let finalLat = selectedLatLng ? selectedLatLng.lat : null;
    let finalLng = selectedLatLng ? selectedLatLng.lng : null;

    if (!finalLat && !finalLng && isGiaoTanNoi && diachinhan) {
        try {
            document.querySelector('.complete-checkout-btn').innerText = "Đang quét tọa độ...";
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(diachinhan)}&limit=1&countrycodes=vn`);
            const data = await response.json();
            if (data && data.length > 0) {
                finalLat = parseFloat(data[0].lat);
                finalLng = parseFloat(data[0].lon);
            }
        } catch (e) {
            console.error("Auto geocode error:", e);
        } finally {
            document.querySelector('.complete-checkout-btn').innerText = "HOÀN TẤT ĐẶT HÀNG";
        }
    }

    // Phuong thuc thanh toan
    let paymentActive = document.querySelector('.payment-item.active');
    let paymentMethod = paymentActive ? paymentActive.getAttribute('data-payment') : 'cash';

    let donhang = {
        khachhang: currentUser.id,
        hinhthucgiao: hinhthucgiao,
        ngaygiaohang: pickDateActive ? pickDateActive.getAttribute("data-date") : "",
        thoigiangiao: thoigiangiao,
        ghichu: document.querySelector(".note-order").value,
        tenguoinhan: tenNguoiNhan,
        sdtnhan: sdtNhan,
        diachinhan: diachinhan,
        lat: finalLat,
        lng: finalLng,
        tongtien: finalTotal,
        discountAmount: currentDiscount,
        voucherCode: currentVoucher ? currentVoucher.code : null,
        shippingFee: shippingFee,
        paymentMethod: paymentMethod,
        isBuyNow: product !== undefined,
        chitiet: chitiet
    };

    // Neu thanh toan online
    if (paymentMethod !== 'cash') {
        try {
            // Lưu đơn hàng trước với trạng thái status = 0 (Chờ xử lý)
            const result = await window.api.createOrder(donhang);
            if (result.success) {
                // Mở modal thanh toán (truyền thêm orderId mới tạo)
                await openPaymentSim(paymentMethod, finalTotal, result.orderId);

                // Xoá giỏ hàng sau khi đặt thành công
                if (product == undefined) {
                    let currentUserObj = JSON.parse(localStorage.getItem('currentuser'));
                    currentUserObj.cart = [];
                    localStorage.setItem('currentuser', JSON.stringify(currentUserObj));
                    if (typeof updateCartCount === 'function') updateCartCount();
                    try { await window.api.updateCart([]); } catch (e) { }
                }
            } else {
                toast({ title: 'Lỗi', message: result.message || 'Lỗi khi tạo đơn hàng!', type: 'error', duration: 3000 });
            }
        } catch (error) {
            console.error("Lỗi khi tạo đơn hàng online:", error);
            toast({ title: 'Lỗi', message: 'Không thể kết nối máy chủ!', type: 'error', duration: 3000 });
        }
        return;
    }

    // Xử lý lưu đơn
    try {
        let result;
        if (editingOrder) {
            // Chế độ sửa đơn
            result = await window.api.updateOrder(editingOrder.id, donhang);
        } else {
            // Chế độ đặt mới
            result = await window.api.createOrder(donhang);
        }

        if (result.success) {
            if (editingOrder) {
                toast({
                    title: 'Thành công',
                    message: 'Cập nhật đơn hàng thành công!',
                    type: 'success',
                    duration: 3000
                });
            } else {
                toast({
                    title: 'Thành công',
                    message: 'Đặt hàng thành công!',
                    type: 'success',
                    duration: 3000
                });
                
                // Đồng bộ Notifications để cập nhật danh sách thông báo nếu có
                if (typeof syncNotificationsFromServer === 'function') {
                    syncNotificationsFromServer();
                }
            }
            closecheckout();

            // Clear cart logic
            // Làm sạch giỏ hàng và trạng thái sửa
            localStorage.removeItem('cart');
            localStorage.removeItem('editingOrder');
            localStorage.removeItem('cartBackup');

            let currentUser = JSON.parse(localStorage.getItem('currentuser'));
            if (currentUser) {
                currentUser.cart = [];
                localStorage.setItem('currentuser', JSON.stringify(currentUser));
                // Đồng bộ giỏ hàng trống lên server
                try { await window.api.updateCart([]); } catch (e) { }
            }

            // Cập nhật lại số lượng giỏ hàng trên icon
            if (typeof updateAmount === 'function') updateAmount();

            // Quay lại danh sách đơn hàng để thấy thay đổi
            if (typeof renderOrderProduct === 'function') await renderOrderProduct();

        } else {
            toast({ title: 'Lỗi', message: result.message || 'Đã có lỗi xảy ra khi đặt hàng!', type: 'error', duration: 3000 });
        }
    } catch (error) {
        console.error("Order error:", error);
        toast({ title: 'Lỗi', message: 'Không thể kết nối máy chủ!', type: 'error', duration: 3000 });
    }
}

// Global click listener for checkout button
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('complete-checkout-btn')) {
        xulyDathang(currentCheckoutProduct);
    }
});

// Map Integration Logic - Standardized & Improved
let map = null;
let mapMarker = null;
let selectedAddress = "";
let selectedLatLng = null;

// Custom Red Marker Icon
const redIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

async function reverseGeocode(lat, lng) {
    try {
        document.getElementById('selected-address-preview').innerText = "Đang xác định địa chỉ...";
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=vi`);
        const data = await response.json();

        if (data && data.address) {
            const addr = data.address;
            const components = [];
            // Lọc địa chỉ tinh gọn cho Việt Nam
            if (addr.house_number) components.push(addr.house_number);
            if (addr.road) components.push(addr.road);
            if (addr.suburb || addr.neighborhood) components.push(addr.suburb || addr.neighborhood);
            if (addr.city_district || addr.district) components.push(addr.city_district || addr.district);
            if (addr.city || addr.province || addr.state) components.push(addr.city || addr.province || addr.state);

            selectedAddress = components.join(', ');
            document.getElementById('selected-address-preview').innerText = selectedAddress;
        } else {
            selectedAddress = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
            document.getElementById('selected-address-preview').innerText = selectedAddress;
        }
    } catch (error) {
        console.error("Geocoding error:", error);
        selectedAddress = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        document.getElementById('selected-address-preview').innerText = "Vị trí: " + selectedAddress;
    }
}

async function onMapClick(e) {
    const { lat, lng } = e.latlng;

    // Smooth pan to the clicked location
    map.flyTo(e.latlng, map.getZoom());

    if (mapMarker) {
        mapMarker.setLatLng(e.latlng);
    } else {
        mapMarker = L.marker(e.latlng, { icon: redIcon }).addTo(map);
    }

    await reverseGeocode(lat, lng);
}

window.openMapModal = function () {
    const modal = document.querySelector('.modal-map');
    modal.classList.add('open');

    if (!map) {
        // Default center: Ho Chi Minh City
        map = L.map('map-container', {
            zoomControl: false,
            scrollWheelZoom: true
        }).setView([10.762622, 106.660172], 13);
        L.control.zoom({ position: 'bottomright' }).addTo(map);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        map.on('click', onMapClick);

        // Location found handler
        map.on('locationfound', function (e) {
            map.flyTo(e.latlng, 16);
            if (mapMarker) mapMarker.setLatLng(e.latlng);
            else mapMarker = L.marker(e.latlng, { icon: redIcon }).addTo(map);
            reverseGeocode(e.latlng.lat, e.latlng.lng);
            toast({ title: 'Thành công', message: 'Đã tìm thấy vị trí của bạn!', type: 'success', duration: 2000 });
        });

        // Location error handler
        map.on('locationerror', function (e) {
            console.error("Location error:", e.message);
            toast({ title: 'Lỗi định vị', message: 'Không thể lấy vị trí. Vui lòng cấp quyền Vị trí trên trình duyệt hoặc bật Cài đặt vị trí của Windows!', type: 'error', duration: 4000 });
        });

    }

    // Try to auto-locate on open
    map.locate({ setView: false, enableHighAccuracy: true });

    setTimeout(() => {
        map.invalidateSize();
    }, 400);
}

window.closeMapModal = function () {
    document.querySelector('.modal-map').classList.remove('open');
}

window.confirmMapAddress = function () {
    if (selectedAddress) {
        document.getElementById('diachinhan').value = selectedAddress;

        // Calculate distance and update shipping fee
        if (mapMarker) {
            selectedLatLng = mapMarker.getLatLng();
            const storePoint = L.latLng(STORE_LATLNG[0], STORE_LATLNG[1]);
            const userPoint = mapMarker.getLatLng();
            const distanceMeters = storePoint.distanceTo(userPoint);
            const distanceKm = distanceMeters / 1000;

            if (distanceKm <= 5) {
                PHIVANCHUYEN = 0;
            } else if (distanceKm <= 10) {
                PHIVANCHUYEN = 15000;
            } else {
                PHIVANCHUYEN = 30000;
            }

            // Show toast about shipping fee update
            toast({
                title: 'Đã cập nhật phí vận chuyển',
                message: `Khoảng cách: ${distanceKm.toFixed(1)}km - Phí ship mới: ${vnd(PHIVANCHUYEN)}`,
                type: 'info',
                duration: 4000
            });

            // Re-render checkout totals
            const shippingDisplay = document.querySelector('.chk-free-ship span');
            if (shippingDisplay) shippingDisplay.innerText = vnd(PHIVANCHUYEN);

            if (currentCheckoutProduct) {
                // Buy Now mode
                const itemTotal = currentCheckoutProduct.soluong * currentCheckoutProduct.price;
                const shippingFee = (document.querySelector("#giaotannoi") && document.querySelector("#giaotannoi").classList.contains("active")) ? PHIVANCHUYEN : 0;
                updateCheckoutTotal((itemTotal + shippingFee) - currentDiscount);
            } else {
                // Cart mode
                getCartTotal().then(cartTotal => {
                    const shippingFee = (document.querySelector("#giaotannoi") && document.querySelector("#giaotannoi").classList.contains("active")) ? PHIVANCHUYEN : 0;
                    updateCheckoutTotal((cartTotal + shippingFee) - currentDiscount);
                });
            }
        }

        closeMapModal();
    } else {
        toast({ title: 'Thông báo', message: 'Vui lòng chọn một vị trí trên bản đồ!', type: 'warning', duration: 3000 });
    }
}

window.searchAddressOnMap = async function (e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    const query = document.getElementById('search-map-input').value;
    if (!query) return;

    try {
        // Focus search on Vietnam
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&accept-language=vi&countrycodes=vn`);
        const data = await response.json();

        if (data && data.length > 0) {
            const { lat, lon } = data[0];
            const newLatLng = new L.LatLng(lat, lon);

            map.flyTo(newLatLng, 17); // Smooth fly to location

            if (mapMarker) {
                mapMarker.setLatLng(newLatLng);
            } else {
                mapMarker = L.marker(newLatLng, { icon: redIcon }).addTo(map);
            }

            await reverseGeocode(lat, lon);
        } else {
            toast({ title: 'Thông báo', message: 'Không tìm thấy địa chỉ này. Thử từ khóa khác nhé!', type: 'info' });
        }
    } catch (error) {
        console.error("Search error:", error);
    }
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && document.activeElement && document.activeElement.id === 'search-map-input') {
        searchAddressOnMap(e);
    }
});

window.closeVoucherModal = function() {
    let modal = document.querySelector('.voucher-list-modal');
    if (modal) modal.classList.remove('open');
}

window.applyVoucherFromModal = function(code) {
    let input = document.getElementById('unified-voucher-code');
    if (input) {
        input.value = code;
        closeVoucherModal();
        applyUnifiedVoucher();
    }
}

window.showAvailableVouchers = async function() {
    try {
        let modal = document.querySelector('.voucher-list-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.className = 'modal voucher-list-modal';
            modal.innerHTML = `
                <div class="modal-container" style="max-width: 450px; background: #f8fafc; border-radius: 12px; padding: 0;">
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; background: #fff; border-bottom: 1px solid #eee; border-radius: 12px 12px 0 0;">
                        <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: #333;"><i class="fa-solid fa-ticket" style="color: #ffb30e; margin-right: 8px;"></i> Chọn mã ưu đãi</h3>
                        <button onclick="closeVoucherModal()" style="background: none; border: none; font-size: 18px; color: #888; cursor: pointer;"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    <div id="voucher-list-content" style="padding: 15px 20px; max-height: 400px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px;">
                        <div style="text-align: center; color: #888; font-size: 14px;">Đang tải...</div>
                    </div>
                    <div style="padding: 15px 20px; background: #fff; border-top: 1px solid #eee; border-radius: 0 0 12px 12px; text-align: right;">
                        <button onclick="closeVoucherModal()" style="padding: 8px 16px; background: #f1f5f9; color: #334155; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">Đóng</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            
            // Add click outside to close
            modal.addEventListener('click', function(e) {
                if (e.target === modal) {
                    closeVoucherModal();
                }
            });
        }
        
        modal.classList.add('open');
        let contentDiv = document.getElementById('voucher-list-content');
        contentDiv.innerHTML = '<div style="text-align: center; color: #888; font-size: 14px;">Đang tải...</div>';

        const vouchers = await window.api.getActiveVouchers(true);
        if (vouchers && vouchers.length > 0) {
            let html = '';
            vouchers.forEach(v => {
                let isShipping = v.type === "shipping";
                let iconColor = isShipping ? "#10b981" : "#f97316";
                let bgBadge = isShipping ? "#ecfdf5" : "#fff7ed";
                let textBadge = isShipping ? "#059669" : "#c2410c";
                let typeText = isShipping ? "Freeship" : (v.type === "percent" ? "Giảm %" : "Giảm tiền");
                
                html += `
                    <div style='display: flex; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; align-items: center; gap: 12px; transition: 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.02);'>
                        <div style='width: 48px; height: 48px; background: ${bgBadge}; border-radius: 50%; display: flex; justify-content: center; align-items: center; flex-shrink: 0;'>
                            <i class='fa-solid fa-ticket' style='color: ${iconColor}; font-size: 20px;'></i>
                        </div>
                        <div style='flex: 1;'>
                            <h4 style='margin: 0; font-size: 14px; font-weight: 700; color: #1e293b;'>${v.code}</h4>
                            <p style='margin: 4px 0 0 0; font-size: 13px; color: #64748b;'>${v.description || 'Ưu đãi đặc biệt'}</p>
                            <span style='display: inline-block; margin-top: 6px; padding: 2px 8px; background: ${bgBadge}; color: ${textBadge}; font-size: 11px; font-weight: 600; border-radius: 4px;'>${typeText}</span>
                        </div>
                        <button onclick="applyVoucherFromModal('${v.code}')" style='background: #ef4444; color: #fff; border: none; padding: 6px 14px; border-radius: 6px; font-weight: 600; font-size: 13px; cursor: pointer; white-space: nowrap;'>Dùng ngay</button>
                    </div>
                `;
            });
            contentDiv.innerHTML = html;
        } else {
            contentDiv.innerHTML = '<div style="text-align: center; color: #888; font-size: 14px; padding: 20px 0;">Hiện chưa có mã ưu đãi nào khả dụng!</div>';
        }
    } catch (err) {
        console.error("Lỗi khi tải mã giảm giá:", err);
        let contentDiv = document.getElementById('voucher-list-content');
        if (contentDiv) contentDiv.innerHTML = '<div style="text-align: center; color: #ef4444; font-size: 14px; padding: 20px 0;">Lỗi khi tải danh sách mã!</div>';
    }
}
