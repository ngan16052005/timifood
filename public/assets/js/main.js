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
        if(!infoProduct) {
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
                <button id="submit-review-btn" onclick="handleReviewSubmit(${infoProduct.id})">Gửi đánh giá</button>
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
    setTimeout(()=>{
        document.querySelector(".count-product-cart").style.animation = "none"
    },1000)
}

// Them SP vao gio hang
async function addCart(index) {
    let currentuser = localStorage.getItem('currentuser') ? JSON.parse(localStorage.getItem('currentuser')) : null;
    
    let soluongInput = document.querySelector('.product-control .input-qty');
    let soluong = soluongInput ? soluongInput.value : 1;
    let popupDetailNote = document.querySelector('#popup-detail-note');
    let note = (popupDetailNote && popupDetailNote.value != "") ? popupDetailNote.value : "Không có ghi chú";
    let productcart = {
        id: index,
        soluong: parseInt(soluong),
        note: note
    }

    if(currentuser) {
        // Logged in user
        let vitri = currentuser.cart.findIndex(item => item.id == productcart.id);
        if (vitri == -1) {
            currentuser.cart.push(productcart);
        } else {
            currentuser.cart[vitri].soluong = parseInt(currentuser.cart[vitri].soluong) + parseInt(productcart.soluong);
        }
        
        try {
            await window.api.updateCart(currentuser.phone, currentuser.cart);
            localStorage.setItem('currentuser', JSON.stringify(currentuser));
            updateAmount();
            closeModal();
            toast({ title: 'Thành công', message: 'Đã thêm món ăn vào giỏ hàng!', type: 'success', duration: 2000 });
        } catch (error) {
            toast({ title: 'Lỗi', message: 'Không thể đồng bộ giỏ hàng!', type: 'error', duration: 3000 });
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
                    <button class="cart-item-delete" onclick="deleteCartItem(${product.id},this)">Xóa</button>
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
    
    if (currentUser) {
        let vitri = currentUser.cart.findIndex(item => item.id == id);
        currentUser.cart.splice(vitri, 1);
        try {
            await window.api.updateCart(currentUser.phone, currentUser.cart);
            localStorage.setItem('currentuser', JSON.stringify(currentUser));
        } catch (error) {
            toast({ title: 'Lỗi', message: 'Không thể cập nhật giỏ hàng!', type: 'error', duration: 3000 });
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
    let cart = currentUser ? currentUser.cart : guestCart;
    
    let tongtien = 0;
    if (cart.length > 0) {
        const products = await window.api.getProducts();
        cart.forEach(item => {
            let infoProductCart = products.find(sp => item.id == sp.id)
            if(infoProductCart) {
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
            let cart = currentUser ? currentUser.cart : JSON.parse(localStorage.getItem('cart'));
            let productId = cart.find(item => item.id == id);
            productId.soluong = parseInt(listProduct[parseInt(index / 2)].querySelector(".input-qty").value);
            
            if(currentUser) {
                try {
                    await window.api.updateCart(currentUser.phone, currentUser.cart);
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
document.querySelector(".filter-btn").addEventListener("click",(e) => {
    e.preventDefault();
    document.querySelector(".advanced-search").classList.toggle("open");
    document.getElementById("home-service").scrollIntoView();
})

document.querySelector(".form-search-input").addEventListener("click",(e) => {
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
    for(let i = 0; i < liItem.length; i++) {
        liItem[i].style.setProperty("display", "none", "important")
    }
}

//Close Search Mobile 
function closeSearchMb() {
    document.querySelector(".header-middle-left").style.display = "block";
    document.querySelector(".header-middle-center").style.display = "none";
    document.querySelector(".header-middle-right-item.close").style.display = "none";
    let liItem = document.querySelectorAll(".header-middle-right-item.open");
    for(let i = 0; i < liItem.length; i++) {
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
    document.querySelector('.form-content.login').style.display = 'block';
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
    
    document.getElementById('email-forgot').value = '';
    document.getElementById('otp-forgot').value = '';
    document.getElementById('new-password-forgot').value = '';
    document.getElementById('confirm-password-forgot').value = '';
    document.querySelector('.emailforgot-error').innerHTML = '';
    document.querySelector('.otpforgot-error').innerHTML = '';
    document.querySelector('.new-password-error').innerHTML = '';
    document.querySelector('.confirm-password-error').innerHTML = '';
    document.getElementById('email-forgot').readOnly = false;
    document.getElementById('send-otp-btn').innerText = 'Gửi mã';
    document.getElementById('send-otp-btn').disabled = false;
});

backToLogin.addEventListener('click', () => {
    forgotPasswordForm.style.display = 'none';
    loginForm.style.display = 'block';
});

// Gửi mã OTP
document.getElementById('send-otp-btn').addEventListener('click', async () => {
    let email = document.getElementById('email-forgot').value;
    if (!emailIsValid(email)) {
        document.querySelector('.emailforgot-error').innerHTML = 'Vui lòng nhập email hợp lệ';
        return;
    }
    
    try {
        let sendBtn = document.getElementById('send-otp-btn');
        sendBtn.innerText = 'Đang gửi...';
        sendBtn.disabled = true;

        const response = await fetch('/api/send-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        const data = await response.json();
        
        if (data.success) {
            document.querySelector('.emailforgot-error').innerHTML = '';
            document.getElementById('email-forgot').readOnly = true;
            
            let msg = data.message;
            if (data.debug) {
                msg = "OTP đã được tạo! Xem trong Server Terminal.";
            }
            toast({ title: 'Thành công', message: msg, type: 'success', duration: 5000 });
            
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
        } else {
            document.querySelector('.emailforgot-error').innerHTML = data.message || 'Lỗi gửi mã';
            sendBtn.innerText = 'Gửi mã';
            sendBtn.disabled = false;
        }
    } catch (error) {
        document.getElementById('send-otp-btn').innerText = 'Gửi mã';
        document.getElementById('send-otp-btn').disabled = false;
        toast({ title: 'Lỗi', message: 'Lỗi kết nối server', type: 'error', duration: 3000 });
    }
});

let forgotPasswordBtn = document.getElementById('forgot-password-button');
let currentResetStep = 1; // 1: Verify OTP, 2: Reset Password

forgotPasswordBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    let email = document.getElementById('email-forgot').value;
    let otp = document.getElementById('otp-forgot').value;

    if (currentResetStep === 1) {
        if (!emailIsValid(email) || otp.length !== 6) {
            if (!emailIsValid(email)) document.querySelector('.emailforgot-error').innerHTML = 'Nhập email';
            if (otp.length !== 6) document.querySelector('.otpforgot-error').innerHTML = 'Nhập mã OTP 6 số';
            return;
        }

        try {
            forgotPasswordBtn.innerText = 'Đang xác thực...';
            const response = await fetch('/api/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp })
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
        } catch (err) {
            forgotPasswordBtn.innerText = 'Tiếp theo';
            toast({ title: 'Lỗi', message: 'Lỗi server', type: 'error', duration: 3000 });
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
            const response = await fetch('/api/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp, newPassword })
            });
            const data = await response.json();

            if (data.success) {
                toast({ title: 'Thành công', message: 'Đã đổi mật khẩu!', type: 'success', duration: 3000 });
                backToLogin.click();
            } else {
                toast({ title: 'Lỗi', message: data.message || 'Thất bại', type: 'error', duration: 3000 });
                forgotPasswordBtn.innerText = 'Đặt lại mật khẩu';
            }
        } catch (err) {
            forgotPasswordBtn.innerText = 'Đặt lại mật khẩu';
            toast({ title: 'Lỗi', message: 'Lỗi server', type: 'error', duration: 3000 });
        }
    }
});

let signupbtn = document.getElementById('signup');
let loginbtn = document.getElementById('login');
let authContainer = document.querySelector('.header-middle-right-item.dropdown');
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
                    // Fetch cart from server after login
                    let serverCart = await window.api.getCart(result.user.phone);
                    let guestCart = localStorage.getItem('cart') ? JSON.parse(localStorage.getItem('cart')) : [];
                    
                    // Merge carts
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
                        await window.api.updateCart(result.user.phone, serverCart);
                        // Clear guest cart
                        localStorage.removeItem('cart');
                    }
                    
                    result.user.cart = serverCart;
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
            toast({ title: 'Lỗi', message: 'Không thể kết nối đến máy chủ!', type: 'error', duration: 3000 });
        }
    }
})

// Kiểm tra xem có tài khoản đăng nhập không ?
function kiemtradangnhap() {
    let currentUser = localStorage.getItem('currentuser');
    if (currentUser != null) {
        let user = JSON.parse(currentUser);
        document.querySelector('.auth-container').innerHTML = `<span class="text-dndk">Tài khoản</span>
            <span class="text-tk">${user.fullname} <i class="fa-sharp fa-solid fa-caret-down"></span>`
        document.querySelector('.header-middle-right-menu').innerHTML = `<li><a href="javascript:;" onclick="myAccount()"><i class="fa-light fa-circle-user"></i> Tài khoản của tôi</a></li>
            <li><a href="javascript:;" onclick="orderHistory()"><i class="fa-regular fa-bags-shopping"></i> Đơn hàng đã mua</a></li>
            <li class="border"><a id="logout" href="javascript:;"><i class="fa-light fa-right-from-bracket"></i> Thoát tài khoản</a></li>`
        document.querySelector('#logout').addEventListener('click',logOut)
    }
}

function logOut() {
    localStorage.removeItem('currentuser');
    localStorage.removeItem('token');
    window.location = "/";
}

function checkAdmin() {
    let user = JSON.parse(localStorage.getItem('currentuser'));
    if(user && (user.userType == 1 || user.userType == 2)) {
        let node = document.createElement(`li`);
        node.innerHTML = `<a href="./admin.html"><i class="fa-light fa-gear"></i> Quản lý cửa hàng</a>`
        document.querySelector('.header-middle-right-menu').prepend(node);
    } 
}

// Window Load handling
window.addEventListener('load', async () => {
    kiemtradangnhap();
    checkAdmin();
    
    // Sync cart from server on load if logged in
    let user = localStorage.getItem('currentuser') ? JSON.parse(localStorage.getItem('currentuser')) : null;
    if(user) {
        try {
            const serverCart = await window.api.getCart(user.phone);
            user.cart = serverCart;
            localStorage.setItem('currentuser', JSON.stringify(user));
        } catch (error) {
            console.error("Initial cart sync failed:", error);
        }
    }

    updateAmount();
    await updateCartTotal();
    await showProductHome();
    initSlider();
});

// Chuyển đổi trang chủ và trang thông tin tài khoản
function myAccount() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.getElementById('trangchu').classList.add('hide');
    document.getElementById('order-history').classList.remove('open');
    document.getElementById('account-user').classList.add('open');
    userInfo();
}

// Chuyển đổi trang chủ và trang xem lịch sử đặt hàng 
function orderHistory() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.getElementById('account-user').classList.remove('open');
    document.getElementById('trangchu').classList.add('hide');
    document.getElementById('order-history').classList.add('open');
    renderOrderProduct();
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
        toast({ title: 'Lỗi', message: 'Không thể cập nhật thông tin!', type: 'error', duration: 3000 });
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
        toast({ title: 'Lỗi', message: error.message || 'Không thể đổi mật khẩu!', type: 'error', duration: 3000 });
    }
}

// Helper functions replaced by API calls in specific components

// Quan ly don hang
async function renderOrderProduct() {
    let currentUser = JSON.parse(localStorage.getItem('currentuser'));
    if(!currentUser) return;
    
    let orderHtml = `<div class="order-history-group">`;
    try {
        const orders = await window.api.getOrders();
        let arrDonHang = orders.filter(o => o.khachhang === currentUser.phone);
        const products = await window.api.getProducts();

        if (arrDonHang.length == 0) {
            orderHtml = `<div class="empty-order-section"><img src="./assets/img/empty-order.jpg" alt="" class="empty-order-img"><p>Chưa có đơn hàng nào</p></div>`;
        } else {
            // Sắp xếp đơn mới nhất lên đầu
            arrDonHang.sort((a, b) => b.id.localeCompare(a.id));

            for(let item of arrDonHang) {
                let statusText = "";
                let statusClass = "";
                switch(item.trangthai) {
                    case 0: statusText = "Đang xử lý"; statusClass = "status-pending"; break;
                    case 1: statusText = "Đang giao"; statusClass = "status-shipping"; break;
                    case 2: statusText = "Hoàn thành"; statusClass = "status-completed"; break;
                    case 3: statusText = "Đã hủy"; statusClass = "status-pending"; break;
                }

                let productRowsHtml = "";
                let chiTietDon = await window.api.getOrderDetails(item.id);
                
                for(let sp of chiTietDon) {
                    let infosp = products.find(p => p.id == sp.id);
                    productRowsHtml += `
                        <div class="order-item-row">
                            <img class="order-item-img" src="${infosp ? infosp.img : './assets/img/blank-image.png'}" alt="">
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
                }
                
                // Cho phép xóa lịch sử nếu đã hoàn thành hoặc đã hủy
                if (item.trangthai === 2 || item.trangthai === 3) {
                    controlButtons += `
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

    switch(status) {
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
        toast({ title: 'Lỗi', message: 'Không thể tải thông tin đơn hàng!', type: 'error', duration: 3000 });
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
    let fm = new Date(date.toString().replace('Z', ''));
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
        if(!detail) return;

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
        document.querySelector(".detail-order-content").innerHTML = detailOrderHtml;
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
    if(lastScrollY < window.scrollY) {
        headerNav.classList.add("hide")
    } else {
        headerNav.classList.remove("hide")
    }
    lastScrollY = window.scrollY;
})

// Page
function renderProducts(showProduct) {
    let productHtml = '';
    if(showProduct.length == 0) {
        document.getElementById("home-title").style.display = "none";
        productHtml = `<div class="no-result"><div class="no-result-h">Tìm kiếm không có kết quả</div><div class="no-result-p">Xin lỗi, chúng tôi không thể tìm được kết quả hợp với tìm kiếm của bạn</div><div class="no-result-i"><i class="fa-light fa-face-sad-cry"></i></div></div>`;
    } else {
        document.getElementById("home-title").style.display = "block";
        showProduct.forEach((product) => {
            productHtml += `<div class="col-product">
            <article class="card-product" >
                <div class="card-header">
                    <a href="#" class="card-image-link" onclick="detailProduct(${product.id})">
                    <img class="card-image" src="${product.img}" alt="${product.title}">
                    </a>
                </div>
                <div class="food-info">
                    <div class="card-content">
                        <div class="card-title">
                            <a href="#" class="card-title-link" onclick="detailProduct(${product.id})">${product.title}</a>
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
                        <button onclick="detailProduct(${product.id})" class="card-button order-item"><i class="fa-regular fa-cart-shopping-fast"></i> Đặt món</button>
                    </div> 
                </div>
                </div>
            </article>
        </div>`;
        });
    }
    document.getElementById('home-products').innerHTML = productHtml;
}

// Find Product
let productAll = [];
async function searchProducts(mode) {
    let valeSearchInput = document.querySelector('.form-search-input').value;
    let valueCategory = document.getElementById("advanced-search-category-select").value;
    let minPrice = document.getElementById("min-price").value;
    let maxPrice = document.getElementById("max-price").value;
    if(parseInt(minPrice) > parseInt(maxPrice) && minPrice != "" && maxPrice != "") {
        alert("Giá đã nhập sai !");
    }

    try {
        if (productAll.length == 0) productAll = (await window.api.getProducts()).filter(item => item.status == 1);
        
        let result = valueCategory == "Tất cả" ? productAll : productAll.filter((item) => {
            return item.category == valueCategory;
        });

        result = valeSearchInput == "" ? result : result.filter(item => {
            return item.title.toString().toUpperCase().includes(valeSearchInput.toString().toUpperCase());
        })

        if(minPrice == "" && maxPrice != "") {
            result = result.filter((item) => item.price <= maxPrice);
        } else if (minPrice != "" && maxPrice == "") {
            result = result.filter((item) => item.price >= minPrice);
        } else if(minPrice != "" && maxPrice != "") {
            result = result.filter((item) => item.price <= maxPrice && item.price >= minPrice);
        }

        document.getElementById("home-service").scrollIntoView();
        switch (mode){
            case 0:
                result = await window.api.getProducts();
                document.querySelector('.form-search-input').value = "";
                document.getElementById("advanced-search-category-select").value = "Tất cả";
                document.getElementById("min-price").value = "";
                document.getElementById("max-price").value = "";
                break;
            case 1:
                result.sort((a,b) => a.price - b.price)
                break;
            case 2:
                result.sort((a,b) => b.price - a.price)
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
        const products = await window.api.getProducts();
        productAll = products.filter(item => item.status == 1);
        showHomeProduct(products);
    } catch (error) {
        console.error("Load home products error:", error);
    }
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
    document.getElementById('account-user').classList.remove('open');
    document.getElementById('order-history').classList.remove('open');
    
    try {
        if (productAll.length == 0) {
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

function startUserNotifications() {
    const currentUser = JSON.parse(localStorage.getItem('currentuser'));
    if (!currentUser) return;

    // Load initial notifications
    syncNotificationsFromServer();

    // Poll for new notifications every 3 seconds
    setInterval(async () => {
        await syncNotificationsFromServer();
    }, 3000);
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
                }
                lastNotificationId = latest.id;
            }

            notifications = serverNotis.map(n => ({
                id: n.id,
                title: n.title,
                message: n.message,
                time: new Date(n.createdAt.replace('Z', '')).toLocaleString('vi-VN'),
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
        <li class="notification-item ${n.unread ? 'unread' : ''}" onclick="markAsRead(${n.id})">
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



