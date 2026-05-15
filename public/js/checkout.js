const PHIVANCHUYEN = 30000;
let priceFinal = document.getElementById("checkout-cart-price-final");
let currentVoucher = null;
let currentDiscount = 0;
let currentCheckoutProduct = null;

// Trang thanh toan
async function thanhtoanpage(option, product) {
    currentCheckoutProduct = product; // Lưu lại để dùng khi bấm đặt hàng
    
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
        switch (option) {
            case 1:
                const cartTotal = await getCartTotal();
                updateCheckoutTotal(cartTotal);
                break;
            case 2:
                updateCheckoutTotal((product.soluong * product.price));
                break;
        }
    })

    giaotannoi.addEventListener('click', async () => {
        tudenlay.classList.remove("active");
        giaotannoi.classList.add("active");
        chkShip.forEach(item => {
            item.style.display = "flex";
        });
        tudenlayGroup.style.display = "none";
        switch (option) {
            case 1:
                const cartTotal = await getCartTotal();
                updateCheckoutTotal(cartTotal + PHIVANCHUYEN);
                break;
            case 2:
                updateCheckoutTotal((product.soluong * product.price) + PHIVANCHUYEN);
                break;
        }
    })

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
                    <div class="bill-product-control-qty">
                        <div class="bill-product-qty">x${item.soluong}</div>
                        <div class="bill-product-qty-btns">
                            <button onclick="changeQtyCheckout(${index}, -1)"><i class="fa-regular fa-minus"></i></button>
                            <button onclick="changeQtyCheckout(${index}, 1)"><i class="fa-regular fa-plus"></i></button>
                        </div>
                    </div>
                    <div class="bill-product-price">${vnd(detaiSP.price * item.soluong)}</div>
                </div>
            </div>`;
        }
    });
    document.getElementById('list-order-checkout').innerHTML = html;
}

window.changeQtyCheckout = async function(index, delta) {
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
        await window.api.updateCart(currentUser.phone, cart);
    }

    // Refresh UI
    updateAmount();
    await showProductCart();
    const cartTotal = await getCartTotal();
    const giaotannoi = document.querySelector("#giaotannoi");
    const shippingFee = (giaotannoi && giaotannoi.classList.contains("active")) ? PHIVANCHUYEN : 0;
    
    // Update the price display
    document.getElementById('checkout-cart-total').innerText = vnd(cartTotal);
    updateCheckoutTotal((cartTotal + shippingFee) - currentDiscount);
}

function showProductBuyNow(product) {
    let html = `<div class="bill-product">
        <div class="bill-product-img">
            <img src="${product.img}" alt="">
        </div>
        <div class="bill-product-info">
            <div class="bill-product-name">${product.title}</div>
            <div class="bill-product-qty">x${product.soluong}</div>
            <div class="bill-product-price">${vnd(product.price * product.soluong)}</div>
        </div>
    </div>`;
    document.getElementById('list-order-checkout').innerHTML = html;
}

function updateCheckoutTotal(total) {
    priceFinal.innerText = vnd(total);
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
            await window.api.updateCart(currentUser.phone, currentUser.cart);
        } else {
            localStorage.setItem('cart', cartBackup);
        }
        localStorage.removeItem('cartBackup');
        updateAmount();
    }

    // Reset editing state
    localStorage.removeItem('editingOrder');
    // Reset voucher state for next time
    currentVoucher = null;
    currentDiscount = 0;
    if (document.getElementById('voucher-code')) document.getElementById('voucher-code').value = "";
    if (document.getElementById('discount-amount-row')) document.getElementById('discount-amount-row').style.display = "none";
}

// Add this function to fill info when editing
window.fillEditOrderInfo = function(order) {
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

async function applyVoucher() {
    const codeInput = document.getElementById('voucher-code');
    const code = codeInput.value.trim();
    const msgBox = document.getElementById('voucher-message');
    const discountRow = document.getElementById('discount-amount-row');
    const discountValEl = document.getElementById('checkout-voucher-discount');
    
    if (!code) {
        msgBox.innerHTML = '<span style="color: #ef4444; font-size: 13px;">Vui lòng nhập mã giảm giá</span>';
        return;
    }

    try {
        console.log("Checking voucher:", code);
        const result = await window.api.checkVoucher(code);
        console.log("Voucher result:", result);

        if (result.success) {
            currentVoucher = result.voucher;
            
            // Calculate base total
            let baseTotal = 0;
            if (currentCheckoutProduct) {
                baseTotal = currentCheckoutProduct.price * currentCheckoutProduct.soluong;
            } else {
                baseTotal = await getCartTotal();
            }

            // check minOrder
            if (baseTotal < (currentVoucher.minOrder || 0)) {
                currentVoucher = null;
                currentDiscount = 0;
                discountRow.style.display = "none";
                msgBox.innerHTML = `<span style="color: #ef4444; font-size: 13px;">Đơn hàng tối thiểu ${vnd(currentVoucher.minOrder)} để dùng mã này</span>`;
                return;
            }

            // discountType: 0 = Percent, 1 = Fixed
            if (currentVoucher.discountType == 0) { 
                currentDiscount = (baseTotal * currentVoucher.discountValue) / 100;
                // Limit to maxDiscount if set
                if (currentVoucher.maxDiscount > 0 && currentDiscount > currentVoucher.maxDiscount) {
                    currentDiscount = currentVoucher.maxDiscount;
                }
            } else {
                currentDiscount = currentVoucher.discountValue;
            }

            // Limit discount to baseTotal
            if (currentDiscount > baseTotal) currentDiscount = baseTotal;

            // Update UI
            discountRow.style.display = "flex";
            discountValEl.innerText = "-" + vnd(currentDiscount);
            msgBox.innerHTML = `<span style="color: #00b894; font-size: 13px;">Đã áp dụng mã: ${currentVoucher.code}</span>`;
            
            // Recalculate Final Total
            const giaotannoi = document.querySelector("#giaotannoi");
            const shippingFee = (giaotannoi && giaotannoi.classList.contains("active")) ? PHIVANCHUYEN : 0;
            updateCheckoutTotal((baseTotal + shippingFee) - currentDiscount);
            
            toast({ title: 'Thành công', message: 'Áp dụng mã giảm giá thành công!', type: 'success', duration: 3000 });
        } else {
            currentVoucher = null;
            currentDiscount = 0;
            discountRow.style.display = "none";
            msgBox.innerHTML = `<span style="color: #ef4444; font-size: 13px;">${result.message || 'Mã không hợp lệ'}</span>`;
            
            // Recalculate Final Total without discount
            let baseTotal = 0;
            if (currentCheckoutProduct) {
                baseTotal = currentCheckoutProduct.price * currentCheckoutProduct.soluong;
            } else {
                baseTotal = await getCartTotal();
            }
            const giaotannoi = document.querySelector("#giaotannoi");
            const shippingFee = (giaotannoi && giaotannoi.classList.contains("active")) ? PHIVANCHUYEN : 0;
            updateCheckoutTotal(baseTotal + shippingFee);
        }
    } catch (error) {
        console.error("Voucher application error:", error);
        msgBox.innerHTML = '<span style="color: #ef4444; font-size: 13px;">Lỗi hệ thống khi kiểm tra mã</span>';
        
        // Reset state on error
        currentVoucher = null;
        currentDiscount = 0;
        discountRow.style.display = "none";
    }
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

function openPaymentSim(method, amount) {
    const modal = document.querySelector('.modal-payment-sim');
    const gateImg = document.getElementById('payment-gate-img');
    const qrImg = document.getElementById('payment-qr-img');
    const amountVal = document.getElementById('payment-amount-value');

    amountVal.innerText = vnd(amount);

    if (method === 'momo') {
        gateImg.src = './assets/img/momo-icon.png';
        qrImg.src = 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=MoMoPaymentSimulation';
    } else {
        gateImg.src = './assets/img/vnpay-icon.png';
        qrImg.src = 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=VNPAYPaymentSimulation';
    }

    modal.classList.add('open');
}

function closePaymentSim() {
    document.querySelector('.modal-payment-sim').classList.remove('open');
    pendingOrderData = null;
}

async function confirmPaymentSim() {
    if (pendingOrderData) {
        try {
            const result = await window.api.createOrder(pendingOrderData);
            if (result.success) {
                toast({ title: 'Thành công', message: 'Thanh toán và đặt hàng thành công!', type: 'success', duration: 3000 });
                closePaymentSim();
                closecheckout();
                // Clear cart if ordered from cart
                if (!pendingOrderData.isBuyNow) {
                    let currentUser = JSON.parse(localStorage.getItem('currentuser'));
                    currentUser.cart = [];
                    localStorage.setItem('currentuser', JSON.stringify(currentUser));
                    updateCartCount();
                }
            } else {
                toast({ title: 'Thất bại', message: result.message || 'Có lỗi xảy ra', type: 'error', duration: 3000 });
            }
        } catch (error) {
            console.error("Payment confirmation error:", error);
            toast({ title: 'Lỗi', message: 'Không thể kết nối máy chủ', type: 'error', duration: 3000 });
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

    if (!currentUser) {
        toast({ title: 'Cảnh báo', message: 'Vui lòng đăng nhập để đặt hàng!', type: 'warning', duration: 3000 });
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
            diachinhan = "273 An Dương Vương, Phường 3, Quận 5";
        } else if (chinhanh2 && chinhanh2.checked) {
            diachinhan = "04 Tôn Đức Thắng, Phường Bến Nghé, Quận 1";
        } else {
            toast({ title: 'Cảnh báo', message: 'Vui lòng chọn chi nhánh nhận hàng!', type: 'warning', duration: 3000 });
            return;
        }
        hinhthucgiao = tudenlay.innerText.trim();
    }

    // Thoi gian nhan hang
    if (giaongay.checked) {
        thoigiangiao = "Giao ngay khi xong";
    } else if (giaovaogio.checked) {
        thoigiangiao = document.querySelector(".choise-time").value;
    } else {
        toast({ title: 'Cảnh báo', message: 'Vui lòng chọn thời gian nhận hàng!', type: 'warning', duration: 3000 });
        return;
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

    // Phuong thuc thanh toan
    let paymentActive = document.querySelector('.payment-item.active');
    let paymentMethod = paymentActive ? paymentActive.getAttribute('data-payment') : 'cash';

    let donhang = {
        khachhang: currentUser.phone,
        hinhthucgiao: hinhthucgiao,
        ngaygiaohang: pickDateActive ? pickDateActive.getAttribute("data-date") : "",
        thoigiangiao: thoigiangiao,
        ghichu: document.querySelector(".note-order").value,
        tenguoinhan: tenNguoiNhan,
        sdtnhan: sdtNhan,
        diachinhan: diachinhan,
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
        pendingOrderData = donhang;
        openPaymentSim(paymentMethod, finalTotal);
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
            toast({ 
                title: 'Thành công', 
                message: editingOrder ? 'Cập nhật đơn hàng thành công!' : 'Đặt hàng thành công!', 
                type: 'success', 
                duration: 3000 
            });
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
                try { await window.api.updateCart(currentUser.phone, []); } catch(e) {}
            }
            
            // Cập nhật lại số lượng giỏ hàng trên icon
            if (typeof updateAmount === 'function') updateAmount();
            
            // Quay lại danh sách đơn hàng để thấy thay đổi
            if (typeof renderOrderProduct === 'function') await renderOrderProduct();

        } else {
            toast({ title: 'Thất bại', message: result.message || 'Có lỗi xảy ra', type: 'error', duration: 3000 });
        }
    } catch (error) {
        console.error("Order error:", error);
        toast({ title: 'Lỗi', message: 'Không thể kết nối máy chủ', type: 'error', duration: 3000 });
    }
}

// Global click listener for checkout button
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('complete-checkout-btn')) {
        xulyDathang(currentCheckoutProduct);
    }
});
