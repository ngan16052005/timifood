// Image Lazy Loading Fade-in
document.addEventListener('load', (e) => {
    if (e.target.tagName === 'IMG') {
        e.target.classList.add('loaded');
    }
}, true);

// Fallback cho các hình ảnh đã được load sẵn từ Cache (tránh tình trạng trắng ảnh)
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('img[loading="lazy"]').forEach(img => {
        if (img.complete) {
            img.classList.add('loaded');
        }
    });
});

// Doi sang dinh dang tien VND
function vnd(price) {
    if (price === null || price === undefined || isNaN(price)) return '0đ';
    return price.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
}

function renderStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= Math.floor(rating)) {
            stars += '<i class="fa-solid fa-star"></i>';
        } else if (i - 0.5 <= rating) {
            stars += '<i class="fa-solid fa-star-half-stroke"></i>';
        } else {
            stars += '<i class="fa-regular fa-star"></i>';
        }
    }
    return `<span class="stars">${stars}</span>`;
}

// Close popup 
const body = document.querySelector("body");
let modalContainer = document.querySelectorAll('.modal');
let modalBox = document.querySelectorAll('.mdl-cnt');
let formLogSign = document.querySelector('.forms');
const checkoutpage = document.querySelector(".checkout-page");

// Click vùng ngoài sẽ tắt Popup
modalContainer.forEach(item => {
    item.addEventListener('click', closeModal);
});

modalBox.forEach(item => {
    item.addEventListener('click', function (event) {
        event.stopPropagation();
    })
});

function closeModal() {
    modalContainer.forEach(item => {
        item.classList.remove('open');
    });
    console.log(modalContainer)
    body.style.overflow = "auto";
}

function openPolicyModal(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    const modal = document.querySelector('.policy-modal');
    if (modal) {
        modal.classList.add('open');
        body.style.overflow = "hidden";
    }
}

function closePolicyModal(event, accept = false) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    const modal = document.querySelector('.policy-modal');
    if (modal) {
        modal.classList.remove('open');
        body.style.overflow = "auto";
    }
    if (accept) {
        const checkbox = document.getElementById('checkbox-signup');
        if (checkbox) {
            checkbox.checked = true;
            // Clear the checkbox validation error if present
            const errorMsg = document.querySelector('.form-message-checkbox');
            if (errorMsg) {
                errorMsg.innerHTML = '';
            }
        }
    }
}

function increasingNumber(e) {
    let qty = e.parentNode.querySelector('.input-qty');
    if (parseInt(qty.value) < qty.max) {
        qty.value = parseInt(qty.value) + 1;
    } else {
        qty.value = qty.max;
    }
}

function decreasingNumber(e) {
    let qty = e.parentNode.querySelector('.input-qty');
    if (qty.value > qty.min) {
        qty.value = parseInt(qty.value) - 1;
    } else {
        qty.value = qty.min;
    }
}

//Xem chi tiet san pham
async function detailProduct(index) {
    let modal = document.querySelector('.modal.product-detail');
    try {
        const products = await window.api.getProducts();
        let infoProduct = products.find(sp => sp.id == index);
        if (!infoProduct) {
            console.error("Product not found:", index);
            return;
        }
        let modalHtml = `<div class="modal-header">
    <img class="product-image" src="${infoProduct.img}" alt="">
    </div>
    <div class="modal-body">
        <h2 class="product-title">${infoProduct.title}</h2>
        <div class="product-control">
            <div class="priceBox">
                <span class="current-price">${vnd(infoProduct.price)}</span>
            </div>
            <div class="buttons_added">
                <input class="minus is-form" type="button" value="-" onclick="decreasingNumber(this)">
                <input class="input-qty" max="100" min="1" name="" type="number" value="1">
                <input class="plus is-form" type="button" value="+" onclick="increasingNumber(this)">
            </div>
        </div>
        <p class="product-description">${infoProduct.desc}</p>
    </div>
    <div class="notebox">
            <p class="notebox-title">Ghi chú</p>
            <textarea class="text-note" id="popup-detail-note" placeholder="Nhập thông tin cần lưu ý..."></textarea>
        </div>
    <div class="modal-footer">
        <div class="price-total">
            <span class="thanhtien">Thành tiền</span>
            <span class="price">${vnd(infoProduct.price)}</span>
        </div>
        <div class="modal-footer-control">
            <button class="button-dathangngay" data-product="${infoProduct.id}">Đặt hàng ngay</button>
            <button class="button-dat" id="add-cart" onclick="animationCart()"><i class="fa-light fa-basket-shopping"></i></button>
        </div>
    </div>
    <div class="product-reviews-section">
        <h3 class="reviews-title">Đánh giá sản phẩm</h3>
        <div id="reviews-container">
            <p>Đang tải đánh giá...</p>
        </div>
        <div class="add-review-form" id="add-review-form">
            ${localStorage.getItem('currentuser') ? `
                <h4>Viết đánh giá của bạn</h4>
                <p class="review-hint"><i class="fa-light fa-circle-info"></i> Bạn chỉ có thể đánh giá những món đã mua thành công.</p>
                <div class="rating-input">
                    <span class="star" data-value="1"><i class="fa-regular fa-star"></i></span>
                    <span class="star" data-value="2"><i class="fa-regular fa-star"></i></span>
                    <span class="star" data-value="3"><i class="fa-regular fa-star"></i></span>
                    <span class="star" data-value="4"><i class="fa-regular fa-star"></i></span>
                    <span class="star" data-value="5"><i class="fa-regular fa-star"></i></span>
                </div>
                <textarea id="review-comment" placeholder="Chia sẻ cảm nhận của bạn về món ăn này..."></textarea>
                <button id="submit-review-btn" onclick="handleReviewSubmit('${infoProduct.id}')">Gửi đánh giá</button>
            ` : `
                <div class="guest-review-notice">
                    <p>Vui lòng <a href="javascript:;" onclick="openLoginModal()">đăng nhập</a> để đánh giá món ăn này.</p>
                </div>
            `}
        </div>
    </div>`;
        document.querySelector('#product-detail-content').innerHTML = modalHtml;
        modal.classList.add('open');
        body.style.overflow = "hidden";

        // Load reviews
        showReviews(infoProduct.id);

        // Initialize star rating
        initStarRating();
        //Cap nhat gia tien khi tang so luong san pham
        let tgbtn = document.querySelectorAll('.is-form');
        let qty = document.querySelector('.product-control .input-qty');
        let priceText = document.querySelector('.price');
        tgbtn.forEach(element => {
            element.addEventListener('click', () => {
                let price = infoProduct.price * parseInt(qty.value);
                priceText.innerHTML = vnd(price);
            });
        });
        // Them san pham vao gio hang
        let productbtn = document.querySelector('.button-dat');
        productbtn.addEventListener('click', (e) => {
            addCart(infoProduct.id);
        })
        // Mua ngay san pham
        let dathangngayBtn = document.querySelector('.button-dathangngay');
        dathangngayBtn.addEventListener('click', async (e) => {
            const qty = document.querySelector('.product-control .input-qty').value;
            const note = document.querySelector('#popup-detail-note').value;
            const productBuyNow = {
                ...infoProduct,
                soluong: parseInt(qty),
                note: note
            };
            await thanhtoanpage(2, productBuyNow);
            closeModal();
            checkoutpage.classList.add('active');
            body.style.overflow = "hidden";
        });
    } catch (error) {
        console.error("Error showing product detail:", error);
    }
}

async function showReviews(productId) {
    const reviewsContainer = document.getElementById('reviews-container');
    try {
        const reviews = await window.api.getReviews(productId);
        if (reviews.length === 0) {
            reviewsContainer.innerHTML = '<p class="no-reviews">Chưa có đánh giá nào cho sản phẩm này. Hãy là người đầu tiên đánh giá!</p>';
        } else {
            let reviewsHtml = '';
            reviews.forEach(review => {
                let stars = '';
                for (let i = 1; i <= 5; i++) {
                    stars += i <= review.rating ? '<i class="fa-solid fa-star"></i>' : '<i class="fa-regular fa-star"></i>';
                }
                reviewsHtml += `<div class="review-item">
                    <div class="review-header">
                        <span class="review-author">${review.customerName || 'Khách hàng'}</span>
                        <span class="review-date">${formatDate(review.reviewDate)}</span>
                    </div>
                    <div class="review-rating">${stars}</div>
                    <p class="review-comment">${review.comment}</p>
                </div>`;
            });
            reviewsContainer.innerHTML = reviewsHtml;
        }
    } catch (error) {
        console.error("Load reviews error:", error);
        reviewsContainer.innerHTML = '<p class="error-reviews">Không thể tải đánh giá.</p>';
    }
}

let currentRating = 0;
function initStarRating() {
    const stars = document.querySelectorAll('.rating-input .star');
    stars.forEach(star => {
        star.onclick = () => {
            currentRating = parseInt(star.getAttribute('data-value'));
            stars.forEach(s => {
                const val = parseInt(s.getAttribute('data-value'));
                if (val <= currentRating) {
                    s.innerHTML = '<i class="fa-solid fa-star"></i>';
                    s.classList.add('active');
                } else {
                    s.innerHTML = '<i class="fa-regular fa-star"></i>';
                    s.classList.remove('active');
                }
            });
        };
    });
}

async function handleReviewSubmit(productId) {
    const currentUser = localStorage.getItem('currentuser');
    if (!currentUser) {
        toast({ title: 'Cảnh báo', message: 'Vui lòng đăng nhập để gửi đánh giá!', type: 'warning', duration: 3000 });
        return;
    }

    if (currentRating === 0) {
        toast({ title: 'Cảnh báo', message: 'Vui lòng chọn số sao đánh giá!', type: 'warning', duration: 3000 });
        return;
    }

    const comment = document.getElementById('review-comment').value.trim();
    if (!comment) {
        toast({ title: 'Cảnh báo', message: 'Vui lòng nhập nội dung đánh giá!', type: 'warning', duration: 3000 });
        return;
    }

    try {
        const result = await window.api.submitReview({
            productId,
            rating: currentRating,
            comment
        });

        if (result.success) {
            toast({ title: 'Thành công', message: 'Cảm ơn bạn đã đánh giá sản phẩm!', type: 'success', duration: 3000 });
            document.getElementById('review-comment').value = '';
            currentRating = 0;
            const stars = document.querySelectorAll('.rating-input .star');
            stars.forEach(s => {
                s.innerHTML = '<i class="fa-regular fa-star"></i>';
                s.classList.remove('active');
            });
            showReviews(productId);
        } else {
            toast({ title: 'Lỗi', message: result.message || 'Gửi đánh giá thất bại!', type: 'error', duration: 3000 });
        }
    } catch (error) {
        console.error("Submit review error:", error);
        toast({ title: 'Lỗi', message: 'Lỗi máy chủ!', type: 'error', duration: 3000 });
    }
}


function animationCart() {
    document.querySelector(".count-product-cart").style.animation = "slidein ease 1s"
    setTimeout(() => {
        document.querySelector(".count-product-cart").style.animation = "none"
    }, 1000)
}

// Them SP vao gio hang
async function addCart(index) {
    let currentuser = localStorage.getItem('currentuser') ? JSON.parse(localStorage.getItem('currentuser')) : null;
    if (currentuser && !currentuser.cart) currentuser.cart = [];

    let soluongInput = document.querySelector('.product-control .input-qty');
    let soluong = soluongInput ? soluongInput.value : 1;
    let popupDetailNote = document.querySelector('#popup-detail-note');
    let note = (popupDetailNote && popupDetailNote.value != "") ? popupDetailNote.value : "Không có ghi chú";
    let productcart = {
        id: index,
        soluong: parseInt(soluong),
        note: note
    }

    if (currentuser) {
        // Logged in user
        let vitri = currentuser.cart.findIndex(item => item.id == productcart.id);
        if (vitri == -1) {
            currentuser.cart.push(productcart);
        } else {
            currentuser.cart[vitri].soluong = parseInt(currentuser.cart[vitri].soluong) + parseInt(productcart.soluong);
        }

        try {
            await window.api.updateCart(currentuser.cart);
            localStorage.setItem('currentuser', JSON.stringify(currentuser));
            updateAmount();
            closeModal();
            toast({ title: 'Thành công', message: 'Đã thêm món ăn vào giỏ hàng!', type: 'success', duration: 2000 });
        } catch (error) {
        toast({ title: 'Lỗi', message: 'Không thể kết nối đến máy chủ', type: 'error', duration: 3000 });
        }
    } else {
        // Guest user
        let guestCart = localStorage.getItem('cart') ? JSON.parse(localStorage.getItem('cart')) : [];
        let vitri = guestCart.findIndex(item => item.id == productcart.id);
        if (vitri == -1) {
            guestCart.push(productcart);
        } else {
            guestCart[vitri].soluong = parseInt(guestCart[vitri].soluong) + parseInt(productcart.soluong);
        }
        localStorage.setItem('cart', JSON.stringify(guestCart));
        updateAmount();
        closeModal();
        toast({ title: 'Thành công', message: 'Đã thêm món ăn vào giỏ hàng!', type: 'success', duration: 2000 });
    }
}

//Show gio hang
async function showCart() {
    let currentuser = localStorage.getItem('currentuser') ? JSON.parse(localStorage.getItem('currentuser')) : null;
    if (currentuser && !currentuser.cart) currentuser.cart = [];
    let guestCart = localStorage.getItem('cart') ? JSON.parse(localStorage.getItem('cart')) : [];
    let cartToRender = currentuser ? currentuser.cart : guestCart;

    if (cartToRender.length != 0) {
        document.querySelector('.gio-hang-trong').style.display = 'none';
        document.querySelector('button.thanh-toan').classList.remove('disabled');
        let productcarthtml = '';
        const products = await window.api.getProducts();
        cartToRender.forEach(item => {
            let infoProductCart = products.find(sp => item.id == sp.id)
            if (infoProductCart) {
                let product = { ...infoProductCart, ...item };
                productcarthtml += `<li class="cart-item" data-id="${product.id}">
                <div class="cart-item-info">
                    <p class="cart-item-title">
                        ${product.title}
                    </p>
                    <span class="cart-item-price price" data-price="${product.price}">
                    ${vnd(parseInt(product.price))}
                    </span>
                </div>
                <p class="product-note"><i class="fa-light fa-pencil"></i><span>${product.note}</span></p>
                <div class="cart-item-control">
                    <button class="cart-item-delete" onclick="deleteCartItem('${product.id}',this)">Xóa</button>
                    <div class="buttons_added">
                        <input class="minus is-form" type="button" value="-" onclick="decreasingNumber(this)">
                        <input class="input-qty" max="100" min="1" name="" type="number" value="${product.soluong}">
                        <input class="plus is-form" type="button" value="+" onclick="increasingNumber(this)">
                    </div>
                </div>
            </li>`
            }
        });
        document.querySelector('.cart-list').innerHTML = productcarthtml;
        await updateCartTotal();
        saveAmountCart();
    } else {
        document.querySelector('.gio-hang-trong').style.display = 'flex';
        document.querySelector('.cart-list').innerHTML = '';
        document.querySelector('button.thanh-toan').classList.add('disabled');
        await updateCartTotal();
    }

    let modalCart = document.querySelector('.modal-cart');
    let containerCart = document.querySelector('.cart-container');
    let themmon = document.querySelector('.them-mon');
    modalCart.onclick = function () {
        closeCart();
    }
    themmon.onclick = function () {
        closeCart();
    }

    let btnThanhToan = document.querySelector('button.thanh-toan');
    btnThanhToan.onclick = function () {
        if (btnThanhToan.classList.contains('disabled')) return;

        if (!currentuser) {
            toast({ title: 'Cảnh báo', message: 'Vui lòng đăng nhập để thanh toán!', type: 'warning', duration: 3000 });
            // closeCart();
            openLoginModal();
            return;
        }
        closeCart();
        thanhtoanpage(1);
        document.querySelector('.checkout-page').classList.add('active');
    }

    containerCart.addEventListener('click', (e) => {
        e.stopPropagation();
    })
}

// Delete cart item
async function deleteCartItem(id, el) {
    let cartParent = el.parentNode.parentNode;
    let currentUser = localStorage.getItem('currentuser') ? JSON.parse(localStorage.getItem('currentuser')) : null;
    if (currentUser && !currentUser.cart) currentUser.cart = [];

    if (currentUser) {
        let vitri = currentUser.cart.findIndex(item => item.id == id);
        currentUser.cart.splice(vitri, 1);
        try {
            await window.api.updateCart(currentUser.cart);
            localStorage.setItem('currentuser', JSON.stringify(currentUser));
        } catch (error) {
        toast({ title: 'Lỗi', message: 'Không thể kết nối đến máy chủ', type: 'error', duration: 3000 });
            return;
        }
    } else {
        let guestCart = JSON.parse(localStorage.getItem('cart'));
        let vitri = guestCart.findIndex(item => item.id == id);
        guestCart.splice(vitri, 1);
        localStorage.setItem('cart', JSON.stringify(guestCart));
    }

    cartParent.remove();
    let currentCart = currentUser ? currentUser.cart : JSON.parse(localStorage.getItem('cart'));
    if (currentCart.length == 0) {
        document.querySelector('.gio-hang-trong').style.display = 'flex';
        document.querySelector('button.thanh-toan').classList.add('disabled');
    }
    await updateCartTotal();
    updateAmount();
}

//Update cart total
async function updateCartTotal() {
    const total = await getCartTotal();
    document.querySelector('.text-price').innerText = vnd(total);
}

// Lay tong tien don hang
async function getCartTotal() {
    let currentUser = localStorage.getItem('currentuser') ? JSON.parse(localStorage.getItem('currentuser')) : null;
    let guestCart = localStorage.getItem('cart') ? JSON.parse(localStorage.getItem('cart')) : [];
    let cart = currentUser ? (currentUser.cart || []) : guestCart;

    let tongtien = 0;
    if (cart.length > 0) {
        const products = await window.api.getProducts();
        cart.forEach(item => {
            let infoProductCart = products.find(sp => item.id == sp.id)
            if (infoProductCart) {
                tongtien += (parseInt(item.soluong) * parseInt(infoProductCart.price));
            }
        });
    }
    return tongtien;
}

// Get Product 
async function getProduct(item) {
    const products = await window.api.getProducts();
    let infoProductCart = products.find(sp => item.id == sp.id)
    let product = {
        ...infoProductCart,
        ...item
    }
    return product;
}

// Lay so luong hang

function getAmountCart() {
    let currentUser = localStorage.getItem('currentuser') ? JSON.parse(localStorage.getItem('currentuser')) : null;
    let guestCart = localStorage.getItem('cart') ? JSON.parse(localStorage.getItem('cart')) : [];
    let cart = currentUser ? (currentUser.cart || []) : guestCart;

    let amount = 0;
    cart.forEach(element => {
        amount += parseInt(element.soluong);
    });
    return amount;
}

//Update Amount Cart 
function updateAmount() {
    let amount = getAmountCart();
    document.querySelector('.count-product-cart').innerText = amount;
}

// Save Cart Info
function saveAmountCart() {
    let cartAmountbtn = document.querySelectorAll(".cart-item-control .is-form");
    let listProduct = document.querySelectorAll('.cart-item');
    let currentUser = localStorage.getItem('currentuser') ? JSON.parse(localStorage.getItem('currentuser')) : null;

    cartAmountbtn.forEach((btn, index) => {
        btn.addEventListener('click', async () => {
            let id = listProduct[parseInt(index / 2)].getAttribute("data-id");
            let cart = currentUser ? (currentUser.cart || []) : JSON.parse(localStorage.getItem('cart'));
            let productId = cart.find(item => item.id == id);
            productId.soluong = parseInt(listProduct[parseInt(index / 2)].querySelector(".input-qty").value);

            if (currentUser) {
                try {
                    await window.api.updateCart(currentUser.cart);
                    localStorage.setItem('currentuser', JSON.stringify(currentUser));
                } catch (error) {
                    console.error("Cart sync error:", error);
                }
            } else {
                localStorage.setItem('cart', JSON.stringify(cart));
            }
            await updateCartTotal();
            updateAmount();
        })
    });
}

// Open & Close Cart
async function openCart(e) {
    if (e) e.stopPropagation();
    await showCart();
    document.querySelector('.modal-cart').classList.add('open');
    body.style.overflow = "hidden";
}

function closeCart() {
    document.querySelector('.modal-cart').classList.remove('open');
    body.style.overflow = "auto";
    updateAmount();
}

// Open Search Advanced
document.querySelector(".filter-btn").addEventListener("click", (e) => {
    e.preventDefault();
    document.querySelector(".advanced-search").classList.toggle("open");
    document.getElementById("home-service").scrollIntoView();
})

document.querySelector(".form-search-input").addEventListener("click", (e) => {
    e.preventDefault();
    document.getElementById("home-service").scrollIntoView();
})

function closeSearchAdvanced() {
    document.querySelector(".advanced-search").classList.toggle("open");
}

//Open Search Mobile 
function openSearchMb() {
    document.querySelector(".header-middle-left").style.display = "none";
    document.querySelector(".header-middle-center").style.display = "block";
    document.querySelector(".header-middle-right-item.close").style.display = "block";
    let liItem = document.querySelectorAll(".header-middle-right-item.open");
    for (let i = 0; i < liItem.length; i++) {
        liItem[i].style.setProperty("display", "none", "important")
    }
}

//Close Search Mobile 
function closeSearchMb() {
    document.querySelector(".header-middle-left").style.display = "block";
    document.querySelector(".header-middle-center").style.display = "none";
    document.querySelector(".header-middle-right-item.close").style.display = "none";
    let liItem = document.querySelectorAll(".header-middle-right-item.open");
    for (let i = 0; i < liItem.length; i++) {
        liItem[i].style.setProperty("display", "block", "important")
    }
}

//Signup && Login Form

// Chuyen doi qua lai SignUp & Login 
let signup = document.querySelector('.signup-link');
let login = document.querySelector('.login-link');
let container = document.querySelector('.signup-login .modal-container');
login.addEventListener('click', () => {
    container.classList.add('active');
})

signup.addEventListener('click', () => {
    container.classList.remove('active');
    document.querySelector('.form-content.forgot-password').style.display = 'none';
    document.querySelector('.form-content.login').style.display = '';
})

// Quên mật khẩu
let forgotPasswordLink = document.querySelector('.forgot-password-link');
let backToLogin = document.querySelector('.back-to-login');
let forgotPasswordForm = document.querySelector('.form-content.forgot-password');
let loginForm = document.querySelector('.form-content.login');
let signUpForm = document.querySelector('.form-content.sign-up');

// Reset forgot form state khi chuyển form
forgotPasswordLink.addEventListener('click', () => {
    loginForm.style.display = 'none';
    forgotPasswordForm.style.display = 'block';

    // Reset về bước 1
    currentResetStep = 1;
    document.getElementById('otp-step').style.display = 'block';
    document.getElementById('password-reset-step').style.display = 'none';
    document.getElementById('forgot-password-button').innerText = 'Tiếp theo';

    document.getElementById('recovery-input').value = '';
    document.getElementById('otp-forgot').value = '';
    document.getElementById('new-password-forgot').value = '';
    document.getElementById('confirm-password-forgot').value = '';
    document.querySelector('.recovery-error').innerHTML = '';
    document.querySelector('.otpforgot-error').innerHTML = '';
    document.querySelector('.new-password-error').innerHTML = '';
    document.querySelector('.confirm-password-error').innerHTML = '';
    document.getElementById('recovery-input').readOnly = false;
    document.getElementById('send-otp-btn').innerText = 'Gửi mã';
    document.getElementById('send-otp-btn').disabled = false;
});

backToLogin.addEventListener('click', () => {
    forgotPasswordForm.style.display = 'none';
    loginForm.style.display = '';
});

// Logic đổi UI khi chọn phương thức khôi phục
const recoveryRadios = document.querySelectorAll('input[name="recovery-method"]');
const recoveryInput = document.getElementById('recovery-input');
const recoveryLabel = document.querySelector('.recovery-label');
const recoveryError = document.querySelector('.recovery-error');

recoveryRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
        recoveryInput.value = '';
        recoveryError.innerHTML = '';
        if (e.target.value === 'email') {
            recoveryLabel.innerText = 'Email tài khoản';
            recoveryInput.placeholder = 'Nhập email để nhận mã';
            recoveryInput.type = 'text';
        } else {
            recoveryLabel.innerText = 'Số điện thoại';
            recoveryInput.placeholder = 'Nhập số điện thoại (vd: 098...)';
            recoveryInput.type = 'tel';
        }
    });
});

// Gửi mã OTP (Hỗ trợ cả Email và SMS Twilio)
document.getElementById('send-otp-btn').addEventListener('click', async () => {
    const method = document.querySelector('input[name="recovery-method"]:checked').value;
    const inputValue = recoveryInput.value.trim();

    if (method === 'email' && !emailIsValid(inputValue)) {
        recoveryError.innerHTML = 'Vui lòng nhập email hợp lệ';
        return;
    } else if (method === 'sms' && inputValue.length < 9) {
        recoveryError.innerHTML = 'Vui lòng nhập sđt hợp lệ';
        return;
    }

    try {
        let sendBtn = document.getElementById('send-otp-btn');
        sendBtn.innerText = 'Đang gửi...';
        sendBtn.disabled = true;

        if (method === 'email') {
            const response = await fetch(`${window.BACKEND_URL || ''}/api/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: inputValue })
            });
            const data = await response.json();

            if (data.success) {
                recoveryError.innerHTML = '';
                recoveryInput.readOnly = true;
        toast({ title: 'Thành công', message: `Đổi thành công! Mã của bạn là: ${code}`, type: 'success', duration: 5000 });
                startCountdown(sendBtn);
            } else {
                recoveryError.innerHTML = data.message || 'Lỗi gửi mã';
                sendBtn.innerText = 'Gửi mã';
                sendBtn.disabled = false;
            }
        } else {
            // SMS via Firebase
            const result = await window.sendFirebaseOTP(inputValue);
            if (result.success) {
                recoveryError.innerHTML = '';
                recoveryInput.readOnly = true;
        toast({ title: 'Thành công', message: `Đổi thành công! Mã của bạn là: ${code}`, type: 'success', duration: 5000 });
                startCountdown(sendBtn);
            } else {
                recoveryError.innerHTML = 'Lỗi gửi mã SMS: ' + result.message;
                sendBtn.innerText = 'Gửi mã';
                sendBtn.disabled = false;
            }
        }

    } catch (error) {
        document.getElementById('send-otp-btn').innerText = 'Gửi mã';
        document.getElementById('send-otp-btn').disabled = false;
        toast({ title: 'Lỗi', message: 'Lỗi kết nối', type: 'error', duration: 3000 });
    }
});

function startCountdown(sendBtn) {
    let timeLeft = 60;
    let timer = setInterval(() => {
        if (timeLeft <= 0) {
            clearInterval(timer);
            sendBtn.innerText = 'Gửi lại mã';
            sendBtn.disabled = false;
        } else {
            sendBtn.innerText = `${timeLeft}s`;
            timeLeft--;
        }
    }, 1000);
}

let forgotPasswordBtn = document.getElementById('forgot-password-button');
let currentResetStep = 1; // 1: Verify OTP, 2: Reset Password

forgotPasswordBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    const method = document.querySelector('input[name="recovery-method"]:checked').value;
    let inputValue = recoveryInput.value.trim();
    let otp = document.getElementById('otp-forgot').value.trim();

    if (currentResetStep === 1) {
        if (!inputValue || otp.length !== 6) {
            if (!inputValue) recoveryError.innerHTML = 'Vui lòng nhập thông tin';
            if (otp.length !== 6) document.querySelector('.otpforgot-error').innerHTML = 'Nhập mã OTP 6 số';
            return;
        }

        try {
            forgotPasswordBtn.innerText = 'Đang xác thực...';

            if (method === 'email') {
                const response = await fetch(`${window.BACKEND_URL || ''}/api/verify-otp`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: inputValue, otp })
                });
                const data = await response.json();

                if (data.success) {
                    currentResetStep = 2;
                    document.getElementById('otp-step').style.display = 'none';
                    document.getElementById('password-reset-step').style.display = 'block';
                    forgotPasswordBtn.innerText = 'Đặt lại mật khẩu';
                    document.querySelector('.otpforgot-error').innerHTML = '';
                } else {
                    document.querySelector('.otpforgot-error').innerHTML = data.message || 'Mã OTP không đúng';
                    forgotPasswordBtn.innerText = 'Tiếp theo';
                }
            } else {
                // SMS Verification via Firebase
                if (!window.confirmationResult) {
                    document.querySelector('.otpforgot-error').innerHTML = 'Vui lòng nhấn nút Gửi mã trước.';
                    forgotPasswordBtn.innerText = 'Tiếp theo';
                    return;
                }

                try {
                    await window.confirmationResult.confirm(otp);
                    currentResetStep = 2;
                    document.getElementById('otp-step').style.display = 'none';
                    document.getElementById('password-reset-step').style.display = 'block';
                    forgotPasswordBtn.innerText = 'Đặt lại mật khẩu';
                    document.querySelector('.otpforgot-error').innerHTML = '';
                } catch (fbErr) {
                    document.querySelector('.otpforgot-error').innerHTML = 'Mã OTP không đúng hoặc đã hết hạn';
                    forgotPasswordBtn.innerText = 'Tiếp theo';
                }
            }
        } catch (err) {
            console.error('Lỗi xác thực:', err);
            document.querySelector('.otpforgot-error').innerHTML = 'Lỗi kết nối server';
            forgotPasswordBtn.innerText = 'Tiếp theo';
        }
    } else if (currentResetStep === 2) {
        let newPassword = document.getElementById('new-password-forgot').value;
        let confirmPassword = document.getElementById('confirm-password-forgot').value;
        const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

        if (!strongPasswordRegex.test(newPassword)) {
            document.querySelector('.new-password-error').innerHTML = 'Mật khẩu yếu';
            return;
        }
        if (newPassword !== confirmPassword) {
            document.querySelector('.confirm-password-error').innerHTML = 'Mật khẩu không khớp';
            return;
        }

        try {
            forgotPasswordBtn.innerText = 'Đang xử lý...';
            const endpoint = method === 'email' ? '/api/reset-password' : '/api/reset-password-by-phone';
            // for firebase we don't need to send OTP to backend, the backend just trusts it because firebase validated it
            const payload = method === 'email' ? { email: inputValue, otp, newPassword } : { phone: inputValue, newPassword };

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await response.json();

            if (data.success) {
                toast({ title: 'Thành công', message: 'Đã đổi mật khẩu thành công!', type: 'success', duration: 3000 });
                backToLogin.click();
            } else {
                toast({ title: 'Lỗi', message: data.message || 'Cập nhật thất bại', type: 'error', duration: 3000 });
                forgotPasswordBtn.innerText = 'Đặt lại mật khẩu';
            }
        } catch (err) {
            forgotPasswordBtn.innerText = 'Đặt lại mật khẩu';
            toast({ title: 'Lỗi', message: 'Lỗi kết nối server', type: 'error', duration: 3000 });
        }
    }
});

let signupbtn = document.getElementById('signup');
let loginbtn = document.getElementById('login');
let authContainer = document.getElementById('account-dropdown') || document.querySelector('.header-middle-right-item.dropdown');
let formsg = document.querySelector('.modal.signup-login')

signupbtn.addEventListener('click', (e) => {
    e.stopPropagation();
    formsg.classList.add('open');
    container.classList.remove('active');
    body.style.overflow = "hidden";
})

// Mở form đăng nhập khi nhấn vào vùng Đăng nhập / Đăng ký
authContainer.addEventListener('click', () => {
    let currentUser = localStorage.getItem('currentuser');
    if (!currentUser) {
        openLoginModal();
    }
})

function openLoginModal() {
    document.querySelector('.form-message-check-login').innerHTML = '';
    document.querySelector('.modal.signup-login').classList.add('open');
    document.querySelector('.signup-login .modal-container').classList.add('active');
    body.style.overflow = "hidden";
}


loginbtn.addEventListener('click', (e) => {
    e.stopPropagation();
    document.querySelector('.form-message-check-login').innerHTML = '';
    formsg.classList.add('open');
    container.classList.add('active');
    body.style.overflow = "hidden";
})

// Dang nhap & Dang ky

// Chức năng đăng ký
let signupButton = document.getElementById('signup-button');
let loginButton = document.getElementById('login-button');
signupButton.addEventListener('click', async () => {
    event.preventDefault();
    let fullNameUser = document.getElementById('fullname').value;
    let phoneUser = document.getElementById('phone').value;
    let passwordUser = document.getElementById('password').value;
    let passwordConfirmation = document.getElementById('password_confirmation').value;
    let checkSignup = document.getElementById('checkbox-signup').checked;

    // Password strength regex: min 8 chars, at least 1 upper, 1 lower, 1 digit
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

    let isValid = true;

    // Check validate
    if (fullNameUser.length == 0) {
        document.querySelector('.form-message-name').innerHTML = 'Vui lòng nhập họ vâ tên';
        document.getElementById('fullname').focus();
        isValid = false;
    } else if (fullNameUser.length < 3) {
        document.getElementById('fullname').value = '';
        document.querySelector('.form-message-name').innerHTML = 'Vui lòng nhập họ và tên lớn hơn 3 kí tự';
        isValid = false;
    } else {
        document.querySelector('.form-message-name').innerHTML = '';
    }

    if (phoneUser.length == 0) {
        document.querySelector('.form-message-phone').innerHTML = 'Vui lòng nhập vào số điện thoại';
        isValid = false;
    } else if (phoneUser.length != 10) {
        document.querySelector('.form-message-phone').innerHTML = 'Vui lòng nhập vào số điện thoại 10 số';
        document.getElementById('phone').value = '';
        isValid = false;
    } else {
        document.querySelector('.form-message-phone').innerHTML = '';
    }

    if (passwordUser.length == 0) {
        document.querySelector('.form-message-password').innerHTML = 'Vui lòng nhập mật khẩu';
        isValid = false;
    } else if (!strongPasswordRegex.test(passwordUser)) {
        document.querySelector('.form-message-password').innerHTML = 'Mật khẩu phải từ 8 ký tự, bao gồm chữ hoa, chữ thường và số';
        document.getElementById('password').value = '';
        isValid = false;
    } else {
        document.querySelector('.form-message-password').innerHTML = '';
    }

    if (passwordConfirmation.length == 0) {
        document.querySelector('.form-message-password-confi').innerHTML = 'Vui lòng nhập lại mật khẩu';
        isValid = false;
    } else if (passwordConfirmation !== passwordUser) {
        document.querySelector('.form-message-password-confi').innerHTML = 'Mật khẩu không khớp';
        document.getElementById('password_confirmation').value = '';
        isValid = false;
    } else {
        document.querySelector('.form-message-password-confi').innerHTML = '';
    }

    if (checkSignup != true) {
        document.querySelector('.form-message-checkbox').innerHTML = 'Vui lòng check đăng ký';
        isValid = false;
    } else {
        document.querySelector('.form-message-checkbox').innerHTML = '';
    }

    if (isValid) {
        let emailUser = document.getElementById('email-signup').value;
        if (emailUser.length == 0) {
            document.querySelector('.form-message-email').innerHTML = 'Vui lòng nhập email';
            isValid = false;
        } else if (!emailIsValid(emailUser)) {
            document.querySelector('.form-message-email').innerHTML = 'Email không hợp lệ';
            isValid = false;
        } else {
            document.querySelector('.form-message-email').innerHTML = '';
        }
    }

    if (isValid) {
        let emailUser = document.getElementById('email-signup').value;
        let user = {
            fullname: fullNameUser,
            phone: phoneUser,
            email: emailUser,
            password: passwordUser,
            address: '',
            status: 1,
            userType: 0
        }
        try {
            const result = await window.api.register(user);
            if (result.success) {
                localStorage.setItem('currentuser', JSON.stringify(result.user));
                localStorage.setItem('token', result.token);
                toast({ title: 'Thành công', message: 'Đã tạo tài khoản thành công!', type: 'success', duration: 3000 });
                closeModal();
                kiemtradangnhap();
                updateAmount();
            } else {
                toast({ title: 'Lỗi', message: result.message || 'Đăng ký thất bại!', type: 'error', duration: 3000 });
            }
        } catch (err) {
            toast({ title: 'Lỗi', message: 'Tài khoản đã tồn tại hoặc lỗi máy chủ!', type: 'error', duration: 3000 });
        }
    }
}
)

// Dang nhap
loginButton.addEventListener('click', async () => {
    event.preventDefault();
    let phonelog = document.getElementById('phone-login').value;
    let passlog = document.getElementById('password-login').value;

    if (phonelog.length == 0) {
        document.querySelector('.form-message.phonelog').innerHTML = 'Vui lòng nhập vào số điện thoại';
    } else {
        document.querySelector('.form-message.phonelog').innerHTML = '';
    }

    if (passlog.length == 0) {
        document.querySelector('.form-message-check-login').innerHTML = 'Vui lòng nhập mật khẩu';
    } else if (passlog.length < 6) {
        document.querySelector('.form-message-check-login').innerHTML = 'Vui lòng nhập mật khẩu lớn hơn 6 kí tự';
    } else {
        document.querySelector('.form-message-check-login').innerHTML = '';
    }

    if (phonelog && passlog) {
        try {
            const result = await window.api.login(phonelog, passlog);
            if (result.success) {
                if (result.user.status == 0) {
                    toast({ title: 'Cảnh báo', message: 'Tài khoản của bạn đã bị khóa!', type: 'warning', duration: 3000 });
                } else {
                    result.user = await syncCartOnLogin(result.user);

                    localStorage.setItem('currentuser', JSON.stringify(result.user));
                    toast({ title: 'Thành công', message: 'Đăng nhập thành công!', type: 'success', duration: 3000 });
                    closeModal();
                    kiemtradangnhap();
                    checkAdmin();
                    updateAmount();
                    updateCartTotal();
                }
            } else {
                toast({ title: 'Lỗi', message: result.message || 'Số điện thoại hoặc mật khẩu không đúng!', type: 'error', duration: 3000 });
            }
        } catch (err) {
        toast({ title: 'Lỗi', message: 'Không thể kết nối đến máy chủ', type: 'error', duration: 3000 });
        }
    }
})

function getMemberTier(points) {
    if (!points) return { name: 'Hạng Đồng', class: 'tier-bronze' };
    if (points >= 20000) return { name: 'Kim Cương', class: 'tier-diamond' };
    if (points >= 5000) return { name: 'Hạng Vàng', class: 'tier-gold' };
    if (points >= 1000) return { name: 'Hạng Bạc', class: 'tier-silver' };
    return { name: 'Hạng Đồng', class: 'tier-bronze' };
}

// Kiểm tra xem có tài khoản đăng nhập không ?
function kiemtradangnhap() {
    let currentUser = localStorage.getItem('currentuser');
    if (currentUser != null) {
        let user = JSON.parse(currentUser);
        let tier = getMemberTier(user.points || 0);
        document.querySelector('#account-dropdown .auth-container').innerHTML = `<span class="text-dndk">Tài khoản</span>
            <span class="text-tk">${user.fullname} <i class="fa-sharp fa-solid fa-caret-down"></i></span>`
        document.querySelector('#account-dropdown .header-middle-right-menu').innerHTML = `<li><a href="javascript:;" onclick="myAccount()"><i class="fa-light fa-circle-user"></i> Tài khoản của tôi</a></li>
            <li><a href="javascript:;" onclick="orderHistory()"><i class="fa-regular fa-bags-shopping"></i> Đơn hàng đã mua</a></li>
            <li><a href="javascript:;" onclick="openWishlist()"><i class="fa-regular fa-heart"></i> Sản phẩm yêu thích</a></li>
            <li><a href="javascript:;" onclick="openLoyaltyPage()"><i class="fa-light fa-crown"></i> Khách hàng thân thiết</a></li>
            <li><a href="javascript:;" onclick="window.api.subscribePushNotification()"><i class="fa-regular fa-bell"></i> Bật thông báo đẩy</a></li>
            <li class="border"><a id="logout" href="javascript:;"><i class="fa-light fa-right-from-bracket"></i> Thoát tài khoản</a></li>`
        document.querySelector('#logout').addEventListener('click', logOut)

        // Bắt đầu lắng nghe thông báo real-time qua socket
        if (typeof startUserNotifications === 'function') {
            startUserNotifications();
        }

        // Đăng ký nhận thông báo đẩy (Web Push)
        if (window.api && window.api.subscribePushNotification) {
            window.api.subscribePushNotification(true);
        }

        // Populate loyalty page details
        let loyaltyPageTierName = document.getElementById('loyalty-page-tier-name');
        let loyaltyPagePointsValue = document.getElementById('loyalty-page-points-value');
        let loyaltyPointsCard = document.querySelector('.loyalty-points-card');
        
        if (loyaltyPageTierName) loyaltyPageTierName.innerText = tier.name;
        if (loyaltyPagePointsValue) loyaltyPagePointsValue.innerText = (user.points || 0).toLocaleString();
        if (loyaltyPointsCard) {
            loyaltyPointsCard.className = 'loyalty-points-card ' + tier.class;
        }
    } else {
        let accountDropdown = document.querySelector('#account-dropdown .auth-container');
        if (accountDropdown) {
            accountDropdown.innerHTML = `<span class='text-dndk'>Đăng nhập / Đăng ký</span><span class='text-tk'>Tài khoản <i class='fa-sharp fa-solid fa-caret-down'></i></span>`;
        }
        let accountMenu = document.querySelector('#account-dropdown .header-middle-right-menu');
        if (accountMenu) {
            accountMenu.innerHTML = `<li><a id='login' href='javascript:;'><i class='fa-light fa-right-to-bracket'></i> Đăng nhập</a></li><li><a id='signup' href='javascript:;'><i class='fa-light fa-user-plus'></i> Đăng ký</a></li>`;

            let lBtn = document.getElementById('login');
            let sBtn = document.getElementById('signup');
            if (lBtn) lBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                document.querySelector('.form-message-check-login').innerHTML = '';
                document.querySelector('.modal.signup-login').classList.add('open');
                document.querySelector('.signup-login .modal-container').classList.add('active');
                document.body.style.overflow = 'hidden';
            });
            if (sBtn) sBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                document.querySelector('.modal.signup-login').classList.add('open');
                document.querySelector('.signup-login .modal-container').classList.remove('active');
                document.body.style.overflow = 'hidden';
            });
        }
    }
}

function logOut() {
    if (typeof userSocket !== 'undefined' && userSocket) {
        userSocket.disconnect();
    }
    localStorage.removeItem('currentuser');
    localStorage.removeItem('token');
    fetch(`${window.BACKEND_URL || ''}/api/logout`, { method: 'POST' });
    window.location = "/";
}

function checkAdmin() {
    let user = JSON.parse(localStorage.getItem('currentuser'));
    if (user && (user.userType == 1 || user.userType == 2)) {
        let node = document.createElement(`li`);
        node.innerHTML = `<a href="./admin.html"><i class="fa-light fa-gear"></i> Quản lý cửa hàng</a>`
        document.querySelector('#account-dropdown .header-middle-right-menu').prepend(node);
    }
}

// Window Load handling
window.addEventListener('load', async () => {
    kiemtradangnhap();
    checkAdmin();

    let user = localStorage.getItem('currentuser') ? JSON.parse(localStorage.getItem('currentuser')) : null;

    // Execute multiple init tasks in parallel to significantly reduce load time
    const initTasks = [];

    // 1. Sync cart
    if (user) {
        initTasks.push(
            window.api.getCart(user.phone).then(serverCart => {
                user.cart = serverCart;
                localStorage.setItem('currentuser', JSON.stringify(user));
            }).catch(error => console.error("Initial cart sync failed:", error))
        );
    }

    // 2. Load favorites
    initTasks.push(loadUserFavorites().catch(e => console.error(e)));

    // 3. Load products for home
    initTasks.push(showProductHome().catch(e => console.error(e)));

    // Wait for all network tasks to complete
    await Promise.all(initTasks);

    // Update UI
    updateAmount();
    await updateCartTotal(); // Uses cached or fetched products
    initSlider();
});

// Chuyển sang trang Khách hàng thân thiết
function openLoyaltyPage() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.getElementById('trangchu').classList.add('hide');
    document.getElementById('order-history').classList.remove('open');
    if (document.getElementById('wishlist-section')) document.getElementById('wishlist-section').classList.remove('open');
    document.getElementById('account-user').classList.remove('open');
    if (document.getElementById('loyalty-page')) document.getElementById('loyalty-page').classList.add('open');
    if (typeof renderRewardPackages === 'function') {
        renderRewardPackages();
    }
    if (typeof renderLoyaltyHistory === 'function') {
        renderLoyaltyHistory();
    }
}

// Chuyển đổi trang chủ và trang thông tin tài khoản
function myAccount() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.getElementById('trangchu').classList.add('hide');
    document.getElementById('order-history').classList.remove('open');
    if (document.getElementById('wishlist-section')) document.getElementById('wishlist-section').classList.remove('open');
    if (document.getElementById('loyalty-page')) document.getElementById('loyalty-page').classList.remove('open');
    document.getElementById('account-user').classList.add('open');
    userInfo();
}

// Chuyển đổi trang chủ và trang xem lịch sử đặt hàng 
function orderHistory() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.getElementById('account-user').classList.remove('open');
    if (document.getElementById('wishlist-section')) document.getElementById('wishlist-section').classList.remove('open');
    if (document.getElementById('loyalty-page')) document.getElementById('loyalty-page').classList.remove('open');
    document.getElementById('trangchu').classList.add('hide');
    document.getElementById('order-history').classList.add('open');
    renderOrderProduct();
}

async function openWishlist() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.getElementById('trangchu').classList.add('hide');
    document.getElementById('account-user').classList.remove('open');
    document.getElementById('order-history').classList.remove('open');
    if (document.getElementById('loyalty-page')) document.getElementById('loyalty-page').classList.remove('open');
    if (document.getElementById('wishlist-section')) document.getElementById('wishlist-section').classList.add('open');
    await renderFavorites();
}

function emailIsValid(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function userInfo() {
    let user = JSON.parse(localStorage.getItem('currentuser'));
    document.getElementById('infoname').value = user.fullname;
    document.getElementById('infophone').value = user.phone;
    document.getElementById('infoemail').value = user.email;
    document.getElementById('infoaddress').value = user.address;
    if (user.email == undefined) {
        infoemail.value = '';
    }
    if (user.address == undefined) {
        infoaddress.value = '';
    }
}

// Thay doi thong tin
async function changeInformation() {
    let user = JSON.parse(localStorage.getItem('currentuser'));
    let infoname = document.getElementById('infoname');
    let infoemail = document.getElementById('infoemail');
    let infoaddress = document.getElementById('infoaddress');

    if (infoemail.value.length > 0 && !emailIsValid(infoemail.value)) {
        document.querySelector('.inforemail-error').innerHTML = 'Vui lòng nhập lại email!';
        return;
    }

    try {
        const updatedData = {
            fullname: infoname.value,
            email: infoemail.value,
            address: infoaddress.value,
            status: user.status
        };
        const result = await window.api.updateUser(user.phone, updatedData);
        if (result && result.success) {
            // Update local storage with fresh data from server
            localStorage.setItem('currentuser', JSON.stringify({ ...user, ...result.user }));
            kiemtradangnhap();
            toast({ title: 'Thành công', message: 'Cập nhật thông tin thành công!', type: 'success', duration: 3000 });
        } else {
            toast({ title: 'Lỗi', message: result.message || 'Không thể cập nhật thông tin!', type: 'error', duration: 3000 });
        }
    } catch (error) {
        toast({ title: 'Lỗi', message: 'Không thể kết nối đến máy chủ', type: 'error', duration: 3000 });
    }
}
// Đổi mật khẩu 
async function changePassword() {
    let passwordCur = document.getElementById('password-cur-info');
    let passwordAfter = document.getElementById('password-after-info');
    let passwordConfirm = document.getElementById('password-comfirm-info');

    // Reset errors
    document.querySelector('.password-cur-info-error').innerHTML = '';
    document.querySelector('.password-after-info-error').innerHTML = '';
    document.querySelector('.password-after-comfirm-error').innerHTML = '';

    if (!passwordCur.value) {
        document.querySelector('.password-cur-info-error').innerHTML = 'Vui lòng nhập mật khẩu hiện tại';
        return;
    }
    if (passwordAfter.value.length < 8 || !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(passwordAfter.value)) {
        document.querySelector('.password-after-info-error').innerHTML = 'Mật khẩu mới phải từ 8 ký tự, bao gồm chữ hoa, chữ thường và số';
        return;
    }
    if (passwordAfter.value != passwordConfirm.value) {
        document.querySelector('.password-after-comfirm-error').innerHTML = 'Mật khẩu xác nhận không khớp';
        return;
    }

    try {
        const result = await window.api.changePassword(passwordCur.value, passwordAfter.value);
        if (result.success) {
            toast({ title: 'Thành công', message: 'Đổi mật khẩu thành công!', type: 'success', duration: 3000 });
            passwordCur.value = "";
            passwordAfter.value = "";
            passwordConfirm.value = "";
        }
    } catch (error) {
        toast({ title: 'Lỗi', message: 'Không thể kết nối đến máy chủ', type: 'error', duration: 3000 });
    }
}

// Helper functions replaced by API calls in specific components

// Quan ly don hang
let currentOrderFilter = 'all';
let currentOrderSearch = '';

async function filterOrders(status = null, btn = null) {
    if (status !== null) {
        currentOrderFilter = status;
        if (btn) {
            document.querySelectorAll('.order-tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        }
    }
    const searchInput = document.getElementById('order-search-input');
    if (searchInput) {
        currentOrderSearch = searchInput.value.trim().toLowerCase();
    }
    await renderOrderProduct();
}
async function renderOrderProduct() {
    let currentUser = JSON.parse(localStorage.getItem('currentuser'));
    if (!currentUser) return;

    let orderHtml = `<div class="order-history-group">`;
    try {
        const orders = await window.api.getOrders();
        let arrDonHang = orders.filter(o => o.userId === currentUser.id);
        const products = await window.api.getProducts();

        // Cập nhật lại user profile từ server để lấy points mới nhất
        try {
            const freshUserRes = await window.api.getCurrentUser();
            if (freshUserRes && freshUserRes.success && freshUserRes.user) {
                currentUser.points = freshUserRes.user.points || 0;
                localStorage.setItem('currentuser', JSON.stringify(currentUser));
                
                // Cập nhật luôn giá trị trên trang khách hàng thân thiết nếu đang mở
                const loyaltyPagePointsValue = document.getElementById('loyalty-page-points-value');
                if (loyaltyPagePointsValue) loyaltyPagePointsValue.innerText = (currentUser.points).toLocaleString();
            }
        } catch (err) {
            console.error('Không thể cập nhật thông tin TiMi Points mới nhất', err);
        }

        // Tính tổng chi tiêu (trạng thái = 2 là Hoàn thành)
        let totalSpent = arrDonHang.filter(o => o.trangthai === 2).reduce((sum, o) => sum + o.tongtien, 0);
        const totalSpentEl = document.getElementById('total-spent-amount');
        if (totalSpentEl) totalSpentEl.innerText = vnd(totalSpent);

        // Hiển thị TiMi Points
        const timiPointsEl = document.getElementById('timi-points-amount');
        if (timiPointsEl) timiPointsEl.innerText = (currentUser.points || 0).toLocaleString();

        // Lọc theo tab trạng thái
        if (currentOrderFilter !== 'all') {
            arrDonHang = arrDonHang.filter(o => o.trangthai == currentOrderFilter);
        }

        // Lọc theo từ khóa tìm kiếm (Mã đơn)
        if (currentOrderSearch !== '') {
            arrDonHang = arrDonHang.filter(o => o.id.toLowerCase().includes(currentOrderSearch));
        }

        if (arrDonHang.length == 0) {
            orderHtml = `<div class="empty-order-section"><img src="./assets/img/empty-order.jpg" alt="" class="empty-order-img" loading="lazy"><p>Không tìm thấy đơn hàng nào</p></div>`;
        } else {
            // Sắp xếp đơn mới nhất lên đầu
            arrDonHang.sort((a, b) => b.id.localeCompare(a.id));

            for (let item of arrDonHang) {
                let statusText = "";
                let statusClass = "";
                switch (item.trangthai) {
                    case 0: statusText = "Đang xử lý"; statusClass = "status-pending"; break;
                    case 1: statusText = "Đang giao"; statusClass = "status-shipping"; break;
                    case 2: statusText = "Hoàn thành"; statusClass = "status-completed"; break;
                    case 3: statusText = "Đã hủy"; statusClass = "status-pending"; break;
                }

                let productRowsHtml = "";
                let chiTietDon = await window.api.getOrderDetails(item.id);

                for (let sp of chiTietDon) {
                    let infosp = products.find(p => p.id == sp.id);
                    productRowsHtml += `
                        <div class="order-item-row">
                            <img class="order-item-img" src="${infosp ? infosp.img : './assets/img/blank-image.png'}" alt="" loading="lazy">
                            <div class="order-item-info">
                                <div class="order-item-name">${infosp ? infosp.title : 'Sản phẩm đã xóa'}</div>
                                <div class="order-item-meta">Số lượng: ${sp.soluong} ${sp.note ? `| Ghi chú: ${sp.note}` : ''}</div>
                            </div>
                            <div class="order-item-price">${vnd(sp.price)}</div>
                        </div>`;
                }

                let trackingHtml = (item.trangthai === 0 || item.trangthai === 1) ? renderOrderTracking(item.trangthai) : "";

                let controlButtons = `
                    <button class="btn-order-detail" onclick="detailOrderUser('${item.id}')">Xem chi tiết</button>
                `;
                if (item.trangthai === 0) {
                    controlButtons += `
                        <button class="btn-order-detail" onclick="editOrderUser('${item.id}')">Sửa đơn</button>
                        <button class="btn-order-detail" style="color: #ff4d4f; border-color: #ff4d4f" onclick="cancelOrderUser('${item.id}')">Hủy đơn</button>
                    `;
                } else if (item.trangthai === 1) {
                    controlButtons += `
                        <button class="btn-order-detail" style="color: #1890ff; border-color: #1890ff" onclick="trackOrderUser('${item.id}', this.getAttribute('data-address'))" data-address="${(item.diachinhan || '').replace(/"/g, '&quot;')}"><i class="fa-solid fa-motorcycle"></i> Theo dõi Shipper (Live)</button>
                    `;
                }

                // Cho phép xóa lịch sử hoặc Đặt lại nếu đã hoàn thành hoặc đã hủy
                if (item.trangthai === 2 || item.trangthai === 3) {
                    controlButtons += `
                        <button class="btn-order-detail" style="color: #52c41a; border-color: #52c41a;" onclick="reorderProducts('${item.id}')"><i class="fa-solid fa-rotate-right"></i> Đặt lại</button>
                        <button class="btn-order-detail" style="color: #ff4d4f; border-color: #ff4d4f" onclick="deleteOrderUser('${item.id}')"><i class="fa-regular fa-trash"></i> Xóa lịch sử</button>
                    `;
                }

                orderHtml += `
                <div class="order-history-card">
                    <div class="order-history-header">
                        <div>
                            <span class="order-id">Đơn hàng #${item.id}</span>
                            <span class="order-date">${formatDate(item.thoigian || new Date())}</span>
                        </div>
                        <span class="order-status-tag ${statusClass}">${statusText}</span>
                    </div>
                    <div class="order-history-body">
                        ${productRowsHtml}
                        ${trackingHtml}
                    </div>
                    <div class="order-history-footer">
                        <div class="order-total">
                            <span class="order-total-label">Tổng tiền: </span>
                            <span class="order-total-value">${vnd(item.tongtien)}</span>
                        </div>
                        <div class="order-actions">
                            ${controlButtons}
                        </div>
                    </div>
                </div>`;
            }
        }
        orderHtml += `</div>`;
        document.querySelector(".order-history-section").innerHTML = orderHtml;
    } catch (error) {
        console.error("Error rendering order history:", error);
    }
}

async function reorderProducts(orderId) {
    try {
        const details = await window.api.getOrderDetails(orderId);
        const products = await window.api.getProducts();

        let currentUser = JSON.parse(localStorage.getItem('currentuser'));
        if (!currentUser) return;

        let cart = currentUser.cart || [];
        let itemsAdded = 0;

        for (let d of details) {
            const prod = products.find(p => (p.id == d.productId || p.id == d.id) && p.status == 1);
            if (prod) {
                let exist = cart.find(item => item.id == prod.id);
                if (exist) {
                    exist.soluong = parseInt(exist.soluong) + parseInt(d.soluong);
                } else {
                    cart.push({
                        id: prod.id,
                        title: prod.title,
                        img: prod.img,
                        price: prod.price, // Dùng giá mới nhất của SP thay vì giá cũ trong đơn hàng
                        soluong: d.soluong,
                        note: d.note || ""
                    });
                }
                itemsAdded++;
            }
        }

        if (itemsAdded > 0) {
            currentUser.cart = cart;
            localStorage.setItem('currentuser', JSON.stringify(currentUser));
            await window.api.updateCart(currentUser.phone, cart);
            updateAmount();
            toast({ title: 'Thành công', message: `Đã thêm ${itemsAdded} món từ đơn cũ vào giỏ!`, type: 'success', duration: 3000 });
            // Tắt bảng order history và mở giỏ hàng
            document.getElementById('order-history').classList.remove('open');
            document.getElementById('trangchu').classList.remove('hide');

            // Cập nhật lại HTML giỏ hàng rồi mới mở modal
            await showCart();
            document.querySelector('.modal-cart').classList.add('open');
        } else {
            toast({ title: 'Thông báo', message: 'Tất cả món trong đơn này đã ngừng bán!', type: 'warning', duration: 3000 });
        }
    } catch (e) {
        console.error(e);
        toast({ title: 'Lỗi', message: 'Không thể kết nối đến máy chủ', type: 'error', duration: 3000 });
    }
}

async function deleteOrderUser(id) {
    if (confirm(`Bạn có chắc muốn xóa đơn hàng #${id} khỏi lịch sử không? Hành động này không thể hoàn tác.`)) {
        try {
            const result = await window.api.deleteOrder(id);
            if (result.success) {
                toast({ title: 'Thành công', message: 'Đã xóa đơn hàng khỏi lịch sử!', type: 'success', duration: 3000 });
                await renderOrderProduct();
            } else {
                toast({ title: 'Lỗi', message: result.message || 'Không thể xóa đơn hàng!', type: 'error', duration: 3000 });
            }
        } catch (error) {
            toast({ title: 'Lỗi', message: error.message || 'Lỗi máy chủ!', type: 'error', duration: 3000 });
        }
    }
}

function renderOrderTracking(status) {
    let steps = [
        { label: "Đã đặt hàng", icon: "fa-solid fa-receipt" },
        { label: "Đang chuẩn bị", icon: "fa-solid fa-pot-food" },
        { label: "Đang giao hàng", icon: "fa-solid fa-truck-fast" },
        { label: "Đã nhận hàng", icon: "fa-solid fa-house-chimney-check" }
    ];

    let progressWidth = "0%";
    let activeStep = -1;
    let completedSteps = [];

    switch (status) {
        case 0: // Chờ xử lý
            progressWidth = "12.5%";
            activeStep = 1;
            completedSteps = [0];
            break;
        case 1: // Đang giao
            progressWidth = "62.5%";
            activeStep = 2;
            completedSteps = [0, 1];
            break;
        case 2: // Hoàn thành
            progressWidth = "100%";
            activeStep = -1;
            completedSteps = [0, 1, 2, 3];
            break;
    }

    let stepsHtml = steps.map((step, index) => {
        let className = "order-tracking-step";
        if (completedSteps.includes(index)) className += " completed";
        if (index === activeStep) className += " active";

        return `
            <div class="${className}">
                <div class="step-icon"><i class="${step.icon}"></i></div>
                <span class="step-label">${step.label}</span>
            </div>
        `;
    }).join('');

    return `
        <div class="order-tracking-wrapper">
            <div class="order-tracking-bar">
                <div class="order-tracking-progress ${status !== 2 ? 'active' : ''}" style="width: ${progressWidth}"></div>
                ${stepsHtml}
            </div>
        </div>
    `;
}

async function cancelOrderUser(id) {
    if (confirm(`Bạn có chắc muốn hủy đơn hàng ${id}?`)) {
        try {
            const result = await window.api.cancelOrder(id);
            if (result.success) {
                toast({ title: 'Thành công', message: 'Đã hủy đơn hàng thành công!', type: 'success', duration: 3000 });
                await renderOrderProduct();
            } else {
                toast({ title: 'Lỗi', message: result.message || 'Không thể hủy đơn hàng!', type: 'error', duration: 3000 });
            }
        } catch (error) {
            toast({ title: 'Lỗi', message: error.message || 'Lỗi máy chủ!', type: 'error', duration: 3000 });
        }
    }
}

async function editOrderUser(id) {
    try {
        const orders = await window.api.getOrders();
        const order = orders.find(o => o.id == id);
        if (!order) {
            toast({ title: 'Lỗi', message: 'Không tìm thấy đơn hàng!', type: 'error', duration: 3000 });
            return;
        }

        const details = await window.api.getOrderDetails(id);
        const products = await window.api.getProducts();

        const orderItems = details.map(d => {
            const p = products.find(prod => prod.id === d.productId || prod.id === d.id);
            return {
                id: d.productId || d.id,
                title: p ? p.title : 'Sản phẩm đã bị xóa',
                img: p ? p.img : './assets/img/blank-image.png',
                price: d.price,
                soluong: d.soluong,
                note: d.note || ""
            };
        });

        // Sao lưu giỏ hàng hiện tại để khôi phục sau
        let currentUser = JSON.parse(localStorage.getItem('currentuser'));
        if (currentUser) {
            localStorage.setItem('cartBackup', JSON.stringify(currentUser.cart || []));
            currentUser.cart = orderItems;
            localStorage.setItem('currentuser', JSON.stringify(currentUser));
            await window.api.updateCart(currentUser.phone, currentUser.cart);
        } else {
            localStorage.setItem('cartBackup', localStorage.getItem('cart') || "[]");
            localStorage.setItem('cart', JSON.stringify(orderItems));
        }

        localStorage.setItem('editingOrder', JSON.stringify(order));

        // 2. Cập nhật giao diện giỏ hàng
        updateAmount();
        if (typeof showCart === 'function') showCart();


        // 3. Chuyển sang trang thanh toán
        thanhtoanpage(1);
        document.querySelector('.checkout-page').classList.add('active');

        // 4. Điền thông tin cũ vào trang thanh toán (Hàm này sẽ được định nghĩa trong checkout.js)
        if (window.fillEditOrderInfo) {
            window.fillEditOrderInfo(order);
        }

        toast({ title: 'Chế độ chỉnh sửa', message: `Đang chỉnh sửa đơn hàng ${id}`, type: 'info', duration: 3000 });
    } catch (error) {
        console.error("Error redirecting to edit:", error);
        toast({ title: 'Lỗi', message: 'Không thể kết nối đến máy chủ', type: 'error', duration: 3000 });
    }
}

// Xóa các hàm liên quan đến Modal cũ vì không dùng nữa
function closeOrderEditModal() {
    document.querySelector('.order-edit-modal').classList.remove('open');
}


// Get Order Details
// Order details are now fetched directly from API in renderOrderProduct

// Format Date
function formatDate(date) {
    let fm = new Date(date.toString());
    let yyyy = fm.getFullYear();
    let mm = fm.getMonth() + 1;
    let dd = fm.getDate();
    if (dd < 10) dd = '0' + dd;
    if (mm < 10) mm = '0' + mm;
    return dd + '/' + mm + '/' + yyyy;
}

// Xem chi tiet don hang
async function detailOrderUser(id) {
    try {
        const orders = await window.api.getOrders();
        let detail = orders.find(item => item.id == id);
        if (!detail) return;

        document.querySelector(".modal.detail-order").classList.add("open");
        let detailOrderHtml = `<ul class="detail-order-group">
            <li class="detail-order-item">
                <span class="detail-order-item-left"><i class="fa-light fa-calendar-days"></i> Ngày đặt hàng</span>
                <span class="detail-order-item-right">${formatDate(detail.thoigiandat)}</span>
            </li>
            <li class="detail-order-item">
                <span class="detail-order-item-left"><i class="fa-light fa-truck"></i> Hình thức giao</span>
                <span class="detail-order-item-right">${detail.hinhthucgiao}</span>
            </li>
            <li class="detail-order-item">
                <span class="detail-order-item-left"><i class="fa-light fa-clock"></i> Ngày nhận hàng</span>
                <span class="detail-order-item-right">${(detail.thoigiangiao == "" ? "" : (detail.thoigiangiao + " - ")) + (detail.ngaygiaohang ? formatDate(detail.ngaygiaohang) : "Giao ngay")}</span>
            </li>
            <li class="detail-order-item">
                <span class="detail-order-item-left"><i class="fa-light fa-location-dot"></i> Địa điểm nhận</span>
                <span class="detail-order-item-right">${detail.diachinhan}</span>
            </li>
            <li class="detail-order-item">
                <span class="detail-order-item-left"><i class="fa-thin fa-person"></i> Người nhận</span>
                <span class="detail-order-item-right">${detail.tenguoinhan}</span>
            </li>
            <li class="detail-order-item">
                <span class="detail-order-item-left"><i class="fa-light fa-phone"></i> Số điện thoại nhận</span>
                <span class="detail-order-item-right">${detail.sdtnhan}</span>
            </li>
        </ul>`
        if (detail.trangthai === 1) {
            detailOrderHtml += `
                <div class="shipper-tracking-container" style="margin-top: 20px;">
                    <h3 style="font-size: 16px; margin-bottom: 10px; font-weight: 600; color: #333;"><i class="fa-solid fa-motorcycle" style="color: var(--primary-color);"></i> Theo dõi Shipper (Live)</h3>
                    <div id="shipper-map-${detail.id}" style="height: 250px; border-radius: 10px; z-index: 1;"></div>
                </div>
            `;
        }

        document.querySelector(".detail-order-content").innerHTML = detailOrderHtml;

        if (detail.trangthai === 1) {
            setTimeout(() => {
                if (window.shipperMap) { window.shipperMap.remove(); }
                window.shipperMap = L.map('shipper-map-' + detail.id).setView([10.762622, 106.660172], 15);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(window.shipperMap);

                const shipperIcon = L.icon({
                    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3063/3063822.png',
                    iconSize: [40, 40]
                });
                window.shipperMarker = L.marker([10.762622, 106.660172], { icon: shipperIcon }).addTo(window.shipperMap);
                window.shipperMarker.bindPopup("<b>Shipper đang giao hàng</b>").openPopup();

                window.trackingOrderId = detail.id;
            }, 300);
        }
    } catch (error) {
        console.error("Error showing user order detail:", error);
    }
}

// Create id order 
function createId(arr) {
    let id = arr.length + 1;
    let check = arr.find(item => item.id == "DH" + id)
    while (check != null) {
        id++;
        check = arr.find(item => item.id == "DH" + id)
    }
    return "DH" + id;
}

// Back to top
window.onscroll = () => {
    let backtopTop = document.querySelector(".back-to-top")
    if (document.documentElement.scrollTop > 100) {
        backtopTop.classList.add("active");
    } else {
        backtopTop.classList.remove("active");
    }
}

// Auto hide header on scroll
const headerNav = document.querySelector(".header-bottom");
let lastScrollY = window.scrollY;

window.addEventListener("scroll", () => {
    if (lastScrollY < window.scrollY) {
        headerNav.classList.add("hide")
    } else {
        headerNav.classList.remove("hide")
    }
    lastScrollY = window.scrollY;
})

// Page
function renderProducts(showProduct) {
    let productHtml = '';
    const homeTitle = document.getElementById("home-title");
    const homeProducts = document.getElementById('home-products');

    // Bỏ qua nếu không phải trang chủ (không có phần tử home-products)
    if (!homeProducts) return;

    if (showProduct.length == 0) {
        if (homeTitle) homeTitle.style.display = "none";
        productHtml = `<div class="no-result"><div class="no-result-h">Tìm kiếm không có kết quả</div><div class="no-result-p">Xin lỗi, chúng tôi không thể tìm được kết quả hợp với tìm kiếm của bạn</div><div class="no-result-i"><i class="fa-light fa-face-sad-cry"></i></div></div>`;
    } else {
        if (homeTitle) homeTitle.style.display = "block";
        showProduct.forEach((product) => {
            let isFav = typeof userFavorites !== 'undefined' && userFavorites.includes(product.id);
            let favIcon = isFav ? '<i class="fa-solid fa-heart" style="color: #ff4d4f;"></i>' : '<i class="fa-regular fa-heart" style="color: #ff4d4f;"></i>';
            productHtml += `<div class="col-product">
            <article class="card-product" >
                <div class="card-header" style="position: relative;">
                    <a href="#" class="card-image-link" onclick="detailProduct('${product.id}')">
                    <img class="card-image" src="${product.img}" alt="${product.title}" loading="lazy">
                    </a>
                    <button class="btn-favorite" onclick="toggleFavorite('${product.id}', event, this)" style="position: absolute; top: 10px; right: 10px; background: rgba(255, 255, 255, 0.9); border: none; border-radius: 50%; width: 35px; height: 35px; cursor: pointer; box-shadow: 0 2px 10px rgba(0,0,0,0.1); z-index: 2; transition: all 0.3s; display: flex; align-items: center; justify-content: center; font-size: 1.1rem;">${favIcon}</button>
                </div>
                <div class="food-info">
                    <div class="card-content">
                        <div class="card-title">
                            <a href="#" class="card-title-link" onclick="detailProduct('${product.id}')">${product.title}</a>
                        </div>
                        <div class="card-rating">
                            ${renderStars(product.avgRating)}
                            <span class="review-count">(${product.reviewCount || 0})</span>
                        </div>
                    </div>
                    <div class="card-footer">
                        <div class="product-price">
                            <span class="current-price">${vnd(product.price)}</span>
                        </div>
                    <div class="product-buy">
                        <button onclick="detailProduct('${product.id}')" class="card-button order-item"><i class="fa-regular fa-cart-shopping-fast"></i> Đặt món</button>
                    </div> 
                </div>
                </div>
            </article>
        </div>`;
        });
    }
    homeProducts.innerHTML = productHtml;
}

function renderSkeletons(count = 12) {
    const homeProducts = document.getElementById('home-products');
    if (!homeProducts) return;

    let skeletonHtml = '';
    for (let i = 0; i < count; i++) {
        skeletonHtml += `
        <div class="col-product">
            <div class="skeleton-card">
                <div class="skeleton skeleton-image"></div>
                <div class="skeleton-content">
                    <div class="skeleton skeleton-text title"></div>
                    <div class="skeleton skeleton-text price"></div>
                    <div style="display: flex; gap: 5px; margin-top: 5px;">
                        <div class="skeleton skeleton-text" style="width: 20%; height: 14px;"></div>
                        <div class="skeleton skeleton-text" style="width: 30%; height: 14px;"></div>
                    </div>
                    <div class="skeleton skeleton-button"></div>
                </div>
            </div>
        </div>`;
    }
    homeProducts.innerHTML = skeletonHtml;
}

// Find Product
let productAll = [];
async function searchProducts(mode) {
    let valeSearchInput = document.querySelector('.form-search-input').value;
    let valueCategory = document.getElementById("advanced-search-category-select").value;
    let minPrice = document.getElementById("min-price").value;
    let maxPrice = document.getElementById("max-price").value;
    if (parseInt(minPrice) > parseInt(maxPrice) && minPrice != "" && maxPrice != "") {
        alert("Giá đã nhập sai !");
    }

    try {
        if (productAll.length == 0) {
            renderSkeletons(12);
            productAll = (await window.api.getProducts()).filter(item => item.status == 1);
        }

        let result = valueCategory == "Tất cả" ? productAll : productAll.filter((item) => {
            return item.category == valueCategory;
        });

        result = valeSearchInput == "" ? result : result.filter(item => {
            return item.title.toString().toUpperCase().includes(valeSearchInput.toString().toUpperCase());
        })



        if (minPrice == "" && maxPrice != "") {
            result = result.filter((item) => item.price <= maxPrice);
        } else if (minPrice != "" && maxPrice == "") {
            result = result.filter((item) => item.price >= minPrice);
        } else if (minPrice != "" && maxPrice != "") {
            result = result.filter((item) => item.price <= maxPrice && item.price >= minPrice);
        }

        if (mode !== undefined) {
            document.getElementById("home-service").scrollIntoView();
        }
        switch (mode) {
            case 0:
                result = await window.api.getProducts();
                document.querySelector('.form-search-input').value = "";
                document.getElementById("advanced-search-category-select").value = "Tất cả";
                document.getElementById("min-price").value = "";
                document.getElementById("max-price").value = "";
                break;
            case 1:
                result.sort((a, b) => a.price - b.price)
                break;
            case 2:
                result.sort((a, b) => b.price - a.price)
                break;
        }
        showHomeProduct(result);
    } catch (error) {
        console.error("Search error:", error);
    }
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
    renderProducts(productShow);
}

function showHomeProduct(products) {
    currentPage = 1; // Reset to first page when changing view
    let productActive = products.filter(item => item.status == 1)
    displayList(productActive, perPage, currentPage);
    setupPagination(productActive, perPage, currentPage);
}

// Thay thế window.onload cũ bằng hàm load dữ liệu thật
async function showProductHome() {
    try {
        renderSkeletons(12);
        const products = await window.api.getProducts();
        productAll = products.filter(item => item.status == 1);
        showHomeProduct(products);
    } catch (error) {
        console.error("Load home products error:", error);
    }
}

function setupPagination(productAll, perPage) {
    const navList = document.querySelector('.page-nav-list');
    if (!navList) return;

    navList.innerHTML = '';
    let page_count = Math.ceil(productAll.length / perPage);
    for (let i = 1; i <= page_count; i++) {
        let li = paginationChange(i, productAll, currentPage);
        navList.appendChild(li);
    }
}

function paginationChange(page, productAll, currentPage) {
    let node = document.createElement(`li`);
    node.classList.add('page-nav-item');
    node.innerHTML = `<a href="javascript:;">${page}</a>`;
    if (currentPage == page) node.classList.add('active');
    node.addEventListener('click', function () {
        currentPage = page;
        displayList(productAll, perPage, currentPage);
        let t = document.querySelectorAll('.page-nav-item.active');
        for (let i = 0; i < t.length; i++) {
            t[i].classList.remove('active');
        }
        node.classList.add('active');
        document.getElementById("home-service").scrollIntoView();
    })
    return node;
}

// Hiển thị chuyên mục
async function showCategory(category) {
    currentPage = 1; // Reset page
    document.getElementById('trangchu').classList.remove('hide');
    document.getElementById('trangchu').style.display = 'block';
    document.getElementById('account-user').classList.remove('open');
    document.getElementById('order-history').classList.remove('open');
    if (document.getElementById('loyalty-page')) document.getElementById('loyalty-page').classList.remove('open');
    const ns = document.getElementById('news-section');
    if (ns) ns.style.display = 'none';
    const nds = document.getElementById('news-detail-section');
    if (nds) nds.style.display = 'none';
    const ws = document.getElementById('wishlist-section');
    if (ws) {
        ws.style.display = 'none';
        ws.classList.remove('open');
    }

    try {
        if (productAll.length == 0) {
            renderSkeletons(12);
            const products = await window.api.getProducts();
            productAll = products.filter(item => item.status == 1);
        }

        let productSearch = productAll.filter(value => {
            return value.category.toString().toUpperCase().includes(category.toUpperCase());
        })
        let currentPageSeach = 1;
        displayList(productSearch, perPage, currentPageSeach);
        setupPagination(productSearch, perPage, currentPageSeach);
        document.getElementById("home-title").scrollIntoView();
    } catch (error) {
        console.error("Show category error:", error);
    }
}


// Slider Logic
let slideIndex = 0;
let sliderInterval;

function initSlider() {
    showSlides(slideIndex);
    resetSliderInterval();
}

function showSlides(n) {
    let slides = document.querySelectorAll(".slider-item");
    let dots = document.querySelectorAll(".dot");
    let wrapper = document.querySelector(".slider-wrapper");

    if (slides.length === 0) return;

    if (n >= slides.length) {
        slideIndex = 0;
    } else if (n < 0) {
        slideIndex = slides.length - 1;
    } else {
        slideIndex = n;
    }

    if (wrapper) {
        wrapper.style.transform = `translateX(-${slideIndex * 100}%)`;
    }

    dots.forEach((dot, index) => {
        if (index === slideIndex) {
            dot.classList.add("active");
        } else {
            dot.classList.remove("active");
        }
    });
}

function changeSlide(n) {
    slideIndex += n;
    showSlides(slideIndex);
    resetSliderInterval();
}

function currentSlide(n) {
    slideIndex = n;
    showSlides(slideIndex);
    resetSliderInterval();
}

function resetSliderInterval() {
    clearInterval(sliderInterval);
    sliderInterval = setInterval(() => {
        slideIndex++;
        showSlides(slideIndex);
    }, 5000); // Chuyển slide mỗi 5 giây
}

// Hệ thống thông báo cho người dùng (Theo dõi trạng thái đơn hàng)
let userOrderStatusSnapshot = {};
let isFirstUserLoad = true;

// Khởi tạo danh sách thông báo từ localStorage
let notifications = JSON.parse(localStorage.getItem('user_notifications')) || [];
let userSocket = null;

function startUserNotifications() {
    const currentUser = JSON.parse(localStorage.getItem('currentuser'));
    if (!currentUser) return;

    // Load initial notifications
    syncNotificationsFromServer();

    // Setup Socket.io real-time notification listener
    if (typeof io !== 'undefined') {
        if (!userSocket) {
            console.log('[Socket] Initializing Socket.io for user:', currentUser.id);
            userSocket = io(window.BACKEND_URL, { transports: ['websocket'] });

            userSocket.on('connect', () => {
                console.log('[Socket] Connected to server, joining rooms for ID and Phone');
                userSocket.emit('joinUser', currentUser.id);
                if (currentUser.phone) {
                    userSocket.emit('joinUser', currentUser.phone);
                }
            });

            userSocket.on('userNotification', async (noti) => {
                console.log('[Socket] Real-time user notification received:', noti);

                // Sync notification history from server & trigger the notification toast
                await syncNotificationsFromServer();

                // Dynamic synchronization: If order history is open, automatically refresh it
                const orderHistorySection = document.getElementById('order-history');
                if (orderHistorySection && orderHistorySection.classList.contains('open')) {
                    console.log('[Socket] Order history page is active, refreshing dynamically...');
                    if (typeof renderOrderProduct === 'function') {
                        await renderOrderProduct();
                    }
                }
            });

            userSocket.on('disconnect', (reason) => {
                console.warn('[Socket] User disconnected:', reason);
            });

            userSocket.on('connect_error', (error) => {
                console.error('[Socket] Connection error:', error);
            });
        } else if (userSocket.disconnected) {
            userSocket.connect();
        }
    } else {
        console.warn('[Socket] Socket.io library not loaded. Falling back to HTTP polling...');
        // Fallback to polling if Socket.io is not available
        if (!window.userNotiPollInterval) {
            window.userNotiPollInterval = setInterval(async () => {
                await syncNotificationsFromServer();
            }, 5000);
        }
    }
}

let lastNotificationId = null;

async function syncNotificationsFromServer() {
    try {
        const serverNotis = await window.api.getNotifications();
        if (Array.isArray(serverNotis)) {
            // Check for new notifications to show toast/sound
            if (serverNotis.length > 0) {
                const latest = serverNotis[0];
                if (lastNotificationId !== null && latest.id > lastNotificationId && !latest.isRead) {
                    toast({ title: latest.title, message: latest.message, type: latest.type === 'order' ? 'success' : 'info', duration: 8000 });

                    // Phát âm thanh đã bị loại bỏ theo yêu cầu
                }
                lastNotificationId = latest.id;
            }

            notifications = serverNotis.map(n => ({
                id: n.id,
                title: n.title,
                message: n.message,
                time: new Date(n.createdAt).toLocaleString('vi-VN'),
                unread: !n.isRead
            }));
            updateNotificationUI();
        }
    } catch (error) {
        console.error("Sync notifications error:", error);
    }
}

function addNotification(title, msg) {
    const newNoti = {
        id: Date.now(),
        title: title,
        message: msg,
        time: new Date().toLocaleString('vi-VN'),
        unread: true
    };
    notifications.unshift(newNoti);
    // Chỉ giữ lại 20 thông báo mới nhất
    if (notifications.length > 20) notifications.pop();

    localStorage.setItem('user_notifications', JSON.stringify(notifications));
    updateNotificationUI();
}

function updateNotificationUI() {
    const listEl = document.getElementById('notification-list');
    const countEl = document.querySelector('.notification-count');

    if (!listEl) return;

    if (notifications.length === 0) {
        listEl.innerHTML = '<li class="no-notification">Chưa có thông báo nào</li>';
        countEl.style.display = 'none';
        return;
    }

    const unreadCount = notifications.filter(n => n.unread).length;
    if (unreadCount > 0) {
        countEl.innerText = unreadCount;
        countEl.style.display = 'flex';
    } else {
        countEl.style.display = 'none';
    }


    listEl.innerHTML = notifications.map(n => `
        <li class="notification-item ${n.unread ? 'unread' : ''}" onclick="markAsRead('${n.id}')">
            <span class="notification-title">${n.title}</span>
            <span class="notification-msg">${n.message}</span>
            <span class="notification-time">${n.time}</span>
        </li>
    `).join('');
}

async function markAsRead(id) {
    try {
        await window.api.markNotificationAsRead(id);
        notifications = notifications.map(n => n.id === id ? { ...n, unread: false } : n);
        updateNotificationUI();
    } catch (error) {
        console.error("Mark as read error:", error);
    }
}

async function clearAllNotifications(event) {
    if (event) event.stopPropagation();
    if (confirm('Bạn có chắc muốn xóa tất cả thông báo?')) {
        try {
            await window.api.deleteAllNotifications();
            notifications = [];
            updateNotificationUI();
        } catch (error) {
            console.error("Clear notifications error:", error);
        }
    }
}



// --- Audio Unlocking Logic (Removed) ---

// Khởi chạy hệ thống thông báo khi trang web tải xong
window.addEventListener('load', () => {
    if (localStorage.getItem('currentuser')) {
        startUserNotifications();
    }

    // Xử lý đóng mở hộp thư thông báo bằng cách nhấn chuột
    const notiBtn = document.getElementById('notification-btn');
    const notiDropdown = document.getElementById('notification-dropdown');

    if (notiBtn && notiDropdown) {
        notiBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            notiDropdown.classList.toggle('active');
        });

        // Nhấn ra ngoài để đóng
        document.addEventListener('click', (e) => {
            if (!notiBtn.contains(e.target)) {
                notiDropdown.classList.remove('active');
            }
        });

        // Ngăn việc click bên trong dropdown làm đóng chính nó
        notiDropdown.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }
});

// --- DYNAMIC CATEGORY LOADING ---
async function loadCategories() {
    try {
        const categories = await window.api.getCategories();


        // 1. Top Menu
        const mainMenu = document.getElementById("main-menu-categories");
        if (mainMenu) {
            // Keep "Trang chủ"
            let html = '<li class="menu-list-item"><a href="index.html" class="menu-link">Trang chủ</a></li>';
            categories.forEach(cat => {
                html += `
                    <li class="menu-list-item" onclick="showCategory('${cat.name}')">
                        <a href="javascript:;" class="menu-link">${cat.name}</a>
                    </li>
                `;
            });
            // Add "Khác"
            html += `
                <li class="menu-list-item" onclick="showCategory('Món khác')">
                    <a href="javascript:;" class="menu-link">Món khác</a>
                </li>
            `;
            mainMenu.innerHTML = html;
        }

        // 2. Advanced Search Select
        const searchSelect = document.getElementById("advanced-search-category-select");
        if (searchSelect) {
            let html = '<option>Tất cả</option>';
            categories.forEach(cat => {
                html += `<option>${cat.name}</option>`;
            });
            html += `<option>Món khác</option>`;
            searchSelect.innerHTML = html;
        }

        // 3. Footer Categories
        const footerMenu = document.getElementById("footer-categories");
        if (footerMenu) {
            let html = "";
            // Show only first 5 categories in footer to keep it neat
            categories.slice(0, 5).forEach(cat => {
                html += `
                    <li class="widget-contact-item">
                        <a href="javascript:;" onclick="showCategory('${cat.name}')">
                            <i class="fa-regular fa-arrow-right"></i>
                            <span>${cat.name}</span>
                        </a>
                    </li>
                `;
            });
            footerMenu.innerHTML = html;
        }
    } catch (error) {
        console.error("Load categories error:", error);
    }
}

// Call on load
document.addEventListener('DOMContentLoaded', loadCategories);

// --- WISHLIST / FAVORITES ---
let userFavorites = [];

async function loadUserFavorites() {
    let currentUser = localStorage.getItem('currentuser') ? JSON.parse(localStorage.getItem('currentuser')) : null;
    if (!currentUser) {
        userFavorites = [];
        return;
    }
    userFavorites = await window.api.getFavorites();
}

async function toggleFavorite(productId, event, btnElement) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }
    let currentUser = localStorage.getItem('currentuser') ? JSON.parse(localStorage.getItem('currentuser')) : null;
    if (!currentUser) {
        toast({ title: 'Cảnh báo', message: 'Vui lòng đăng nhập để sử dụng tính năng Yêu thích!', type: 'warning', duration: 3000 });
        openLoginModal();
        return;
    }

    try {
        if (userFavorites.includes(productId)) {
            await window.api.removeFavorite(productId);
            userFavorites = userFavorites.filter(id => id !== productId);
            if (btnElement) btnElement.innerHTML = '<i class="fa-regular fa-heart" style="color: #ff4d4f;"></i>';
            toast({ title: 'Thành công', message: 'Đã bỏ yêu thích món ăn', type: 'success', duration: 2000 });
        } else {
            await window.api.addFavorite(productId);
            userFavorites.push(productId);
            if (btnElement) btnElement.innerHTML = '<i class="fa-solid fa-heart" style="color: #ff4d4f;"></i>';
            toast({ title: 'Thành công', message: 'Đã thêm món ăn vào yêu thích', type: 'success', duration: 2000 });
        }

        const wishlistSection = document.getElementById('wishlist-section');
        if (wishlistSection && wishlistSection.classList.contains('open')) {
            renderFavorites();
        }
    } catch (e) {
        toast({ title: 'Lỗi', message: 'Không thể kết nối đến máy chủ', type: 'error', duration: 3000 });
    }
}

async function renderFavorites() {
    const wishlistContainer = document.getElementById('wishlist-products');
    if (!wishlistContainer) return;

    if (userFavorites.length === 0) {
        wishlistContainer.innerHTML = `<div class="empty-order-section" style="grid-column: 1/-1; text-align: center; padding: 50px 0;"><i class="fa-regular fa-heart-crack" style="font-size: 5rem; color: #ccc; margin-bottom: 20px;"></i><p>Bạn chưa có món ăn yêu thích nào</p></div>`;
        return;
    }

    const products = await window.api.getProducts();
    const favProducts = products.filter(p => userFavorites.includes(p.id));

    let productHtml = '';
    favProducts.forEach((product) => {
        let favIcon = '<i class="fa-solid fa-heart" style="color: #ff4d4f;"></i>';
        productHtml += `<div class="col-product" style="width: 100%">
        <article class="card-product" >
            <div class="card-header" style="position: relative;">
                <a href="#" class="card-image-link" onclick="detailProduct('${product.id}')">
                <img class="card-image" src="${product.img}" alt="${product.title}" loading="lazy">
                </a>
                <button class="btn-favorite" onclick="toggleFavorite('${product.id}', event, this)" style="position: absolute; top: 10px; right: 10px; background: rgba(255, 255, 255, 0.9); border: none; border-radius: 50%; width: 35px; height: 35px; cursor: pointer; box-shadow: 0 2px 10px rgba(0,0,0,0.1); z-index: 2; display: flex; align-items: center; justify-content: center; font-size: 1.1rem;">${favIcon}</button>
            </div>
            <div class="food-info">
                <div class="card-content">
                    <div class="card-title">
                        <a href="#" class="card-title-link" onclick="detailProduct('${product.id}')">${product.title}</a>
                    </div>
                    <div class="card-rating">
                        ${renderStars(product.avgRating)}
                        <span class="review-count">(${product.reviewCount || 0})</span>
                    </div>
                </div>
                <div class="card-footer">
                    <div class="product-price">
                        <span class="current-price">${vnd(product.price)}</span>
                    </div>
                <div class="product-buy">
                    <button onclick="detailProduct('${product.id}')" class="card-button order-item"><i class="fa-regular fa-cart-shopping-fast"></i> Đặt món</button>
                </div> 
            </div>
            </div>
        </article>
    </div>`;
    });
    wishlistContainer.innerHTML = productHtml;
}


// Google OAuth2 Initialization
let currentGoogleCredential = null;

window.addEventListener('load', function () {
    if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
        google.accounts.id.initialize({
            client_id: '271217781583-u9nmt5r90t5fmqo8bjre19a5481t0ekb.apps.googleusercontent.com',
            callback: handleGoogleCredentialResponse,
            context: 'use',
            ux_mode: 'popup',
            cancel_on_tap_outside: false
        });

        // Render Google Login Button
        const loginContainer = document.getElementById('google-login-btn-container');
        if (loginContainer) {
            google.accounts.id.renderButton(
                loginContainer,
                { theme: 'outline', size: 'large', width: 175, text: 'signin', locale: 'vi' }
            );
        }

        // Render Google Signup Button
        const signupContainer = document.getElementById('google-signup-btn-container');
        if (signupContainer) {
            google.accounts.id.renderButton(
                signupContainer,
                { theme: 'outline', size: 'large', width: 175, text: 'signin', locale: 'vi' }
            );
        }
    }
});

async function handleGoogleCredentialResponse(response) {
    if (!response.credential) return;

    try {
        const res = await fetch(`${window.BACKEND_URL}/api/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ credential: response.credential })
        });

        const data = await res.json();
        if (data.success) {
            // User exists, log them in
            data.user = await syncCartOnLogin(data.user);
            localStorage.setItem('currentuser', JSON.stringify(data.user));
            localStorage.setItem('token', data.token);
            toast({ title: 'Thành công', message: 'Đăng nhập thành công bằng Google!', type: 'success', duration: 3000 });
            closeModal();
            kiemtradangnhap();
            checkAdmin();
            updateAmount();
            updateCartTotal();
            if (typeof startUserNotifications === 'function') startUserNotifications();
        } else if (data.status === 'require_phone') {
            // New user, show phone number input form
            currentGoogleCredential = response.credential;
            document.querySelector('.login').style.display = 'none';
            document.querySelector('.sign-up').style.display = 'none';
            document.querySelector('.google-complete').style.display = 'block';

            if (data.googleInfo) {
                if (data.googleInfo.picture) document.getElementById('google-user-avatar').src = data.googleInfo.picture;
                if (data.googleInfo.name) document.getElementById('google-user-name').innerText = data.googleInfo.name;
                if (data.googleInfo.email) document.getElementById('google-user-email').innerText = data.googleInfo.email;
            }
        } else {
            toast({ title: 'Lỗi', message: data.message || 'Đăng nhập thất bại', type: 'error', duration: 3000 });
        }
    } catch (err) {
        toast({ title: 'Lỗi', message: 'Lỗi kết nối máy chủ', type: 'error', duration: 3000 });
    }
}

// Handle complete registration
const googleCompleteBtn = document.getElementById('google-complete-button');
if (googleCompleteBtn) {
    googleCompleteBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const phone = document.getElementById('google-phone').value;
        const phoneError = document.querySelector('.google-phone-error');

        if (!phone) {
            phoneError.innerText = 'Vui lòng nhập số điện thoại';
            return;
        } else if (phone.length !== 10) {
            phoneError.innerText = 'Số điện thoại phải có 10 chữ số';
            return;
        } else {
            phoneError.innerText = '';
        }

        googleCompleteBtn.innerText = 'Đang xử lý...';
        googleCompleteBtn.disabled = true;

        try {
            const res = await fetch(`${window.BACKEND_URL}/api/auth/google/complete-registration`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ credential: currentGoogleCredential, phone })
            });

            const data = await res.json();
            if (data.success) {
                data.user = await syncCartOnLogin(data.user);
                localStorage.setItem('currentuser', JSON.stringify(data.user));
                localStorage.setItem('token', data.token);
                toast({ title: 'Thành công', message: 'Tạo tài khoản thành công bằng Google!', type: 'success', duration: 3000 });
                closeModal();
                kiemtradangnhap();
                updateAmount();
                if (typeof startUserNotifications === 'function') startUserNotifications();
            } else {
                toast({ title: 'Lỗi', message: data.message || 'Đăng ký thất bại', type: 'error', duration: 3000 });
            }
        } catch (err) {
            toast({ title: 'Lỗi', message: 'Lỗi kết nối máy chủ', type: 'error', duration: 3000 });
        } finally {
            googleCompleteBtn.innerText = 'Xác nhận & Đăng nhập';
            googleCompleteBtn.disabled = false;
        }
    });
}

// Facebook OAuth2 Initialization
let currentFacebookToken = null;
// fbAsyncInit moved to head of HTML to prevent race condition

function loginWithFacebook() {
    if (typeof FB === 'undefined') {
        toast({ title: 'Lỗi', message: 'Không thể tải Facebook SDK', type: 'error', duration: 3000 });
        return;
    }

    FB.login(function (response) {
        if (response.authResponse) {
            handleFacebookCredentialResponse(response.authResponse.accessToken);
        } else {
            console.log('User cancelled login or did not fully authorize.');
        }
    }, { scope: 'public_profile,email' });
}

async function handleFacebookCredentialResponse(accessToken) {
    try {
        const res = await fetch(`${window.BACKEND_URL}/api/auth/facebook`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accessToken })
        });

        const data = await res.json();
        if (data.success) {
            // User exists, log them in
            data.user = await syncCartOnLogin(data.user);
            localStorage.setItem('currentuser', JSON.stringify(data.user));
            localStorage.setItem('token', data.token);
            toast({ title: 'Thành công', message: 'Đăng nhập thành công bằng Facebook!', type: 'success', duration: 3000 });
            closeModal();
            kiemtradangnhap();
            checkAdmin();
            updateAmount();
            updateCartTotal();
            if (typeof startUserNotifications === 'function') startUserNotifications();
        } else if (data.status === 'require_phone') {
            // New user, show phone number input form
            currentFacebookToken = accessToken;
            document.querySelector('.login').style.display = 'none';
            document.querySelector('.sign-up').style.display = 'none';
            document.querySelector('.facebook-complete').style.display = 'block';

            if (data.facebookInfo) {
                if (data.facebookInfo.picture) document.getElementById('fb-user-avatar').src = data.facebookInfo.picture;
                if (data.facebookInfo.name) document.getElementById('fb-user-name').innerText = data.facebookInfo.name;
                if (data.facebookInfo.email) document.getElementById('fb-user-email').innerText = data.facebookInfo.email;
            }
        } else {
            toast({ title: 'Lỗi', message: data.message || 'Đăng nhập thất bại', type: 'error', duration: 3000 });
        }
    } catch (err) {
        toast({ title: 'Lỗi', message: 'Lỗi kết nối máy chủ', type: 'error', duration: 3000 });
    }
}

// Handle complete registration Facebook
const fbCompleteBtn = document.getElementById('fb-complete-button');
if (fbCompleteBtn) {
    fbCompleteBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const phone = document.getElementById('fb-phone').value;
        const phoneError = document.querySelector('.fb-phone-error');

        if (!phone) {
            phoneError.innerText = 'Vui lòng nhập số điện thoại';
            return;
        } else if (phone.length !== 10) {
            phoneError.innerText = 'Số điện thoại phải có 10 chữ số';
            return;
        } else {
            phoneError.innerText = '';
        }

        fbCompleteBtn.innerText = 'Đang xử lý...';
        fbCompleteBtn.disabled = true;

        try {
            const res = await fetch(`${window.BACKEND_URL}/api/auth/facebook/complete-registration`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accessToken: currentFacebookToken, phone })
            });

            const data = await res.json();
            if (data.success) {
                data.user = await syncCartOnLogin(data.user);
                localStorage.setItem('currentuser', JSON.stringify(data.user));
                localStorage.setItem('token', data.token);
                toast({ title: 'Thành công', message: 'Tạo tài khoản thành công bằng Facebook!', type: 'success', duration: 3000 });
                closeModal();
                kiemtradangnhap();
                updateAmount();
                if (typeof startUserNotifications === 'function') startUserNotifications();
            } else {
                toast({ title: 'Lỗi', message: data.message || 'Đăng ký thất bại', type: 'error', duration: 3000 });
            }
        } catch (err) {
            toast({ title: 'Lỗi', message: 'Lỗi kết nối máy chủ', type: 'error', duration: 3000 });
        } finally {
            fbCompleteBtn.innerText = 'Xác nhận & Đăng nhập';
            fbCompleteBtn.disabled = false;
        }
    });
}

// ===================== NEWS SECTION LOGIC =====================
let globalNewsList = [];

async function showNewsSection() {
    const trangchu = document.getElementById('trangchu');
    if (!trangchu) {
        window.location.href = 'index.html?view=news';
        return;
    }
    trangchu.style.display = 'none';
    const wishlistSection = document.getElementById('wishlist-section');
    if (wishlistSection) {
        wishlistSection.style.display = 'none';
        wishlistSection.classList.remove('open');
    }

    document.getElementById('news-detail-section').style.display = 'none';
    document.getElementById('news-section').style.display = 'block';

    const res = await window.api.getNews();
    if (res.success) {
        globalNewsList = res.data;
        const newsListContainer = document.getElementById('news-list');

        if (globalNewsList.length === 0) {
            newsListContainer.innerHTML = '<div class="no-result" style="grid-column: 1 / -1; margin-top: 40px;"><div class="no-result-i" style="font-size: 80px; color: #cbd5e1; margin-bottom: 20px;"><i class="fa-light fa-newspaper"></i></div><div class="no-result-h" style="font-size: 1.2rem; color: #64748b;">Chưa có bài viết / tin tức nào</div></div>';
            return;
        }

        let html = '';
        globalNewsList.forEach(item => {
            const dateStr = new Date(item.createdAt).toLocaleDateString('vi-VN');
            html += `
                <div class="news-card" style="background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); cursor: pointer; transition: transform 0.3s ease, box-shadow 0.3s ease;" onclick="readNews('${item.id}')" onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='0 10px 25px rgba(0,0,0,0.1)';" onmouseout="this.style.transform='none'; this.style.boxShadow='0 4px 15px rgba(0,0,0,0.05)';">
                    <img src="${item.thumbnail}" alt="" style="width: 100%; height: 200px; object-fit: cover;" onerror="this.src='./assets/img/blank-image.png'">
                    <div class="news-card-body" style="padding: 20px;">
                        <h3 style="font-size: 1.1rem; color: #1e293b; margin-bottom: 10px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; line-height: 1.4;">${item.title}</h3>
                        <div style="display: flex; justify-content: space-between; color: #64748b; font-size: 0.85rem; margin-top: 15px;">
                            <span><i class="fa-light fa-user-pen"></i> ${item.author}</span>
                            <span><i class="fa-light fa-calendar"></i> ${dateStr}</span>
                        </div>
                    </div>
                </div>
            `;
        });
        newsListContainer.innerHTML = html;
    }
}

function readNews(id) {
    const item = globalNewsList.find(n => n.id === id);
    if (!item) return;

    document.getElementById('news-section').style.display = 'none';
    document.getElementById('news-detail-section').style.display = 'block';

    const dateStr = new Date(item.createdAt).toLocaleDateString('vi-VN');
    const html = `
        <h1 style="font-size: 2rem; color: #1e293b; margin-bottom: 15px; line-height: 1.3;">${item.title}</h1>
        <div style="display: flex; gap: 20px; color: #64748b; font-size: 0.95rem; margin-bottom: 30px; padding-bottom: 15px; border-bottom: 1px solid #e2e8f0;">
            <span><i class="fa-light fa-user-pen"></i> Tác giả: <strong>${item.author}</strong></span>
            <span><i class="fa-light fa-calendar"></i> Xuất bản: ${dateStr}</span>
        </div>
        <div class="news-content-body" style="font-size: 1.05rem; line-height: 1.8; color: #334155;">
            <img src="${item.thumbnail}" style="max-width: 100%; height: auto; max-height: 400px; object-fit: cover; border-radius: 8px; margin-bottom: 25px; display: block;" onerror="this.style.display='none'">
            ${item.content}
        </div>
    `;

    document.getElementById('news-detail-content').innerHTML = html;
    window.scrollTo(0, 0);
}

// Listen for view parameters to open specific sections like News from other pages
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('view') === 'news') {
        setTimeout(() => {
            if (typeof showNewsSection === 'function') {
                showNewsSection();
            }
        }, 100);
    }
});

// Helper function to sync cart when user logs in via any method
async function syncCartOnLogin(user) {
    let serverCart = user.cart || [];
    let guestCart = localStorage.getItem('cart') ? JSON.parse(localStorage.getItem('cart')) : [];

    if (guestCart.length > 0) {
        guestCart.forEach(guestItem => {
            let vitri = serverCart.findIndex(serverItem => serverItem.id == guestItem.id);
            if (vitri == -1) {
                serverCart.push(guestItem);
            } else {
                serverCart[vitri].soluong += guestItem.soluong;
            }
        });
        // Update server with merged cart
        try {
            await window.api.updateCart(serverCart);
        } catch (e) {
            console.error("Failed to sync cart to server:", e);
        }
        // Clear guest cart
        localStorage.removeItem('cart');
    }
    user.cart = serverCart;
    return user;
}


// Shipper Socket Listener
if (typeof io !== 'undefined') {
    const shipperSocket = io(window.BACKEND_URL + '/shipperLocation', { transports: ['websocket'] });
    shipperSocket.on('shipperLocation', (data) => {
        if (window.shipperMap && window.shipperMarker && window.trackingOrderId === data.orderId) {
            window.shipperMarker.setLatLng([data.lat, data.lng]);
            window.shipperMap.panTo([data.lat, data.lng]);
        }
    });
}

window.trackOrderUser = async function (id, address) {
    try {
        let trackingModal = document.querySelector('.modal.tracking-order');
        if (!trackingModal) {
            const modalHtml = `
                <div class="modal tracking-order">
                    <div class="modal-container mdl-cnt" style="max-width: 800px; width: 90%;">
                        <h3 class="modal-container-title"><i class="fa-solid fa-motorcycle" style="color: var(--primary-color);"></i> Theo dõi Shipper (Live)</h3>
                        <button class="form-close" onclick="document.querySelector('.modal.tracking-order').classList.remove('open')"><i class="fa-regular fa-xmark"></i></button>
                        <div class="tracking-order-content" style="padding: 20px;">
                            <div id="shipper-map-standalone" style="height: 450px; border-radius: 10px; z-index: 1; width: 100%; position: relative;"></div>
                            <div style="margin-top: 15px; text-align: center; font-size: 15px; font-weight: 500;">
                                Đơn hàng: <span id="tracking-order-id-label" style="color: var(--primary-color);"></span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            trackingModal = document.querySelector('.modal.tracking-order');
            trackingModal.addEventListener('click', (e) => {
                if (e.target === trackingModal) {
                    trackingModal.classList.remove('open');
                }
            });
        }

        document.getElementById('tracking-order-id-label').innerText = id;
        trackingModal.classList.add('open');

        setTimeout(() => {
            if (window.shipperMap) {
                window.shipperMap.off();
                window.shipperMap.remove();
                window.shipperMap = null;
            }
            // re-create the map container if leaflet complains about "Map container is already initialized"
            const mapParent = document.getElementById('shipper-map-standalone').parentElement;
            document.getElementById('shipper-map-standalone').remove();
            mapParent.insertAdjacentHTML('afterbegin', '<div id="shipper-map-standalone" style="height: 350px; border-radius: 10px; z-index: 1; width: 100%; position: relative;"></div>');

            window.shipperMap = L.map('shipper-map-standalone').setView([10.762622, 106.660172], 15);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(window.shipperMap);

            const shipperIcon = L.icon({
                iconUrl: 'https://cdn-icons-png.flaticon.com/512/3063/3063822.png',
                iconSize: [40, 40]
            });
            window.shipperMarker = L.marker([10.762622, 106.660172], { icon: shipperIcon }).addTo(window.shipperMap);
            window.shipperMarker.bindPopup("<b>Shipper đang giao hàng</b>").openPopup();

            // Hàm vẽ marker của người dùng/điểm đến
            const drawUserMarker = (lat, lng, popupText = "<b>Điểm giao hàng của bạn</b>") => {
                const userIcon = L.icon({
                    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
                    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                    shadowSize: [41, 41]
                });
                if (window.userMarker) {
                    window.shipperMap.removeLayer(window.userMarker);
                }
                window.userMarker = L.marker([lat, lng], { icon: userIcon }).addTo(window.shipperMap);
                window.userMarker.bindPopup(popupText).openPopup();

                // Tự động zoom để thấy cả shipper và bạn
                if (window.shipperMarker) {
                    const bounds = L.latLngBounds([
                        window.shipperMarker.getLatLng(),
                        [lat, lng]
                    ]);
                    window.shipperMap.fitBounds(bounds, { padding: [50, 50] });
                }
            };

            // Luôn dùng GPS của thiết bị để xác định vị trí thực tế của khách hàng
            if (navigator.geolocation) {
                document.getElementById('map-address-text') && (document.getElementById('map-address-text').textContent = "Đang tải vị trí GPS...");
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const lat = position.coords.latitude;
                        const lng = position.coords.longitude;
                        drawUserMarker(lat, lng, "<b>Vị trí hiện tại của bạn</b>");
                    },
                    (error) => {
                        console.log("GPS Error:", error);
                        // Fallback nếu không có GPS
                    },
                    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                );
            }

            window.trackingOrderId = id;

            // force map resize
            window.shipperMap.invalidateSize();
        }, 300);
    } catch (error) {
        console.error(error);
        toast({ title: 'Lỗi', message: 'Không thể kết nối đến máy chủ', type: 'error', duration: 3000 });
    }
};

// Tự động thêm biểu tượng mắt để ẩn/hiện mật khẩu cho tất cả các ô nhập mật khẩu
document.addEventListener('DOMContentLoaded', () => {
    // Tìm tất cả các input type password
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    passwordInputs.forEach(input => {
        // Tạo wrapper để chứa input và icon
        const wrapper = document.createElement('div');
        wrapper.style.position = 'relative';
        wrapper.style.display = 'flex';
        wrapper.style.alignItems = 'center';
        wrapper.style.width = '100%';

        // Chèn wrapper vào trước input
        input.parentNode.insertBefore(wrapper, input);
        // Di chuyển input vào trong wrapper
        wrapper.appendChild(input);

        // Thêm padding right để chữ không đè lên icon
        input.style.paddingRight = '40px';

        // Tạo icon mắt
        const icon = document.createElement('i');
        icon.className = 'fa-regular fa-eye-slash toggle-password-icon';
        icon.style.position = 'absolute';
        icon.style.right = '15px';
        icon.style.cursor = 'pointer';
        icon.style.color = '#888';
        icon.style.zIndex = '10';
        icon.title = 'Hiện mật khẩu';

        // Xử lý sự kiện click để ẩn/hiện
        icon.addEventListener('click', function () {
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
                icon.title = 'Ẩn mật khẩu';
            } else {
                input.type = 'password';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
                icon.title = 'Hiện mật khẩu';
            }
        });

        // Thêm icon vào wrapper
        wrapper.appendChild(icon);
    });
});



// --- Scroll To Top ---
const scrollToTopBtn = document.getElementById('scrollToTopBtn');

if (scrollToTopBtn) {
    window.addEventListener('scroll', () => {
        if (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) {
            scrollToTopBtn.style.display = 'flex';
            scrollToTopBtn.classList.add('show');
        } else {
            scrollToTopBtn.style.display = 'none';
            scrollToTopBtn.classList.remove('show');
        }
    });

    scrollToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}


// === LOYALTY FEATURE ===
async function renderRewardPackages() {
    const container = document.getElementById('reward-packages-container');
    if (!container) return;

    try {
        const response = await window.api.getRewardPackages();
        if (response.success && response.rewards) {
            let html = '';
            response.rewards.forEach(pkg => {
                // Determine styling based on color
                let bgLight = '#fff8e1';
                let textCol = pkg.color || '#f59e0b';
                
                // Quick hack to map colors to light backgrounds
                if (pkg.color === '#ef4444') { bgLight = '#fee2e2'; }
                else if (pkg.color === '#8b5cf6') { bgLight = '#ede9fe'; }
                else if (pkg.color === '#FFD700') { bgLight = '#fff8e1'; }
                else { bgLight = pkg.color + '20'; } // 20% opacity hex if needed
                
                html += `
                <div class="voucher-item" style="border: 1px solid #eee; border-radius: 12px; padding: 20px; background: #fff; box-shadow: 0 4px 6px rgba(0,0,0,0.05); position: relative; overflow: hidden; transition: transform 0.2s;">
                    <div style="position: absolute; top: 0; left: 0; width: 4px; height: 100%; background: ${pkg.color};"></div>
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
                        <div>
                            <h5 style="margin: 0 0 5px 0; font-size: 1.1rem; color: #333;">${pkg.name}</h5>
                            <p style="margin: 0; font-size: 0.85rem; color: #666;">${pkg.description}</p>
                        </div>
                        <div style="background: ${bgLight}; color: ${textCol}; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 0.85rem; white-space: nowrap;">
                            ${pkg.cost} Điểm
                        </div>
                    </div>
                    <button class="btn btn-primary" onclick="redeemVoucher(${pkg.id}, '${pkg.name}', ${pkg.cost})" style="width: 100%; padding: 10px; border-radius: 6px; font-weight: 500; border: none; background: #ef4444; color: white; cursor: pointer;">Đổi ngay</button>
                </div>
                `;
            });
            container.innerHTML = html;
        } else {
            container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #666;">Không có ưu đãi nào hiện hành.</div>';
        }
    } catch (err) {
        console.error('Lỗi khi tải gói ưu đãi:', err);
        container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #ef4444;">Đã xảy ra lỗi khi tải ưu đãi.</div>';
    }
}

async function redeemVoucher(packageId, name, cost) {
    let user = JSON.parse(localStorage.getItem('currentuser'));
    let token = localStorage.getItem('token');
    if (!user || !token) {
        toast({ title: 'Lỗi', message: 'Vui lòng đăng nhập để đổi ưu đãi', type: 'error', duration: 3000 });
        return;
    }
    
    // Check points optimistic UI validation
    if ((user.points || 0) < cost) {
        toast({ title: 'Lỗi', message: 'Không đủ điểm để đổi', type: 'error', duration: 3000 });
        return;
    }

    try {
        const response = await fetch(window.BACKEND_URL + '/api/users/redeem', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ packageId })
        });
        
        const data = await response.json();
        if (!response.ok || !data.success) {
            toast({ title: 'Thất bại', message: data.message || 'Lỗi khi đổi ưu đãi', type: 'error', duration: 3000 });
            return;
        }
        
        // Cập nhật điểm từ server (chính xác từ DB)
        user.points = (data.newPoints !== undefined) ? data.newPoints : Math.max(0, (user.points || 0) - cost);
        localStorage.setItem('currentuser', JSON.stringify(user));
        
        // Lưu lịch sử
        let history = JSON.parse(localStorage.getItem('loyalty_history')) || [];
        history.unshift({
            name: name,
            cost: cost,
            code: code,
            date: new Date().toISOString()
        });
        localStorage.setItem('loyalty_history', JSON.stringify(history));
        
        kiemtradangnhap();
        if (typeof renderLoyaltyHistory === 'function') renderLoyaltyHistory();
        
        toast({ title: 'Thành công', message: `Đổi thành công! Mã của bạn là: ${code}`, type: 'success', duration: 5000 });
    } catch(err) {
        toast({ title: 'Lỗi', message: 'Không thể kết nối đến máy chủ', type: 'error', duration: 3000 });
    }
}

function renderLoyaltyHistory() {
    let history = JSON.parse(localStorage.getItem('loyalty_history')) || [];
    let listContainer = document.getElementById('loyalty-history-list');
    if (!listContainer) return;
    
    if (history.length === 0) {
        listContainer.innerHTML = 'Chưa có lịch sử đổi ưu đãi nào.';
        return;
    }
    
    let html = '';
    history.forEach(item => {
        let d = new Date(item.date);
        let dateStr = d.toLocaleDateString('vi-VN') + ' ' + d.toLocaleTimeString('vi-VN');
        html += `
        <div style="border-bottom: 1px solid #eee; padding: 12px 0; display: flex; justify-content: space-between; align-items: center;">
            <div>
                <strong style="color: #333;">${item.name}</strong>
                <div style="font-size: 0.8rem; color: #888; margin-top: 4px;">${dateStr}</div>
            </div>
            <div style="text-align: right;">
                <div style="color: #ef4444; font-weight: bold; margin-bottom: 4px;">-${item.cost} Điểm</div>
                <div style="background: #e2e8f0; padding: 3px 8px; border-radius: 4px; font-family: monospace; color: #3b82f6; font-size: 0.85rem; letter-spacing: 1px; font-weight: bold;">${item.code}</div>
            </div>
        </div>
        `;
    });
    listContainer.innerHTML = html;
}

