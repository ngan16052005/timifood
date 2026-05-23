const translations = {
    vi: {
        "nav.home": "TRANG CHỦ",
        "nav.snacks": "MÓN ĂN VẶT",
        "nav.vegan": "MÓN CHAY",
        "nav.hotpot": "MÓN LẨU",
        "nav.salty": "MÓN MẶN",
        "nav.dessert": "MÓN TRÁNG MIỆNG",
        "nav.drinks": "NƯỚC UỐNG",
        "nav.others": "MÓN KHÁC",
        "nav.about": "GIỚI THIỆU",
        "nav.contact": "LIÊN HỆ",
        "header.search": "Tìm kiếm món ăn...",
        "header.filter": "Lọc",
        "header.login": "Đăng nhập / Đăng ký",
        "header.account": "Tài khoản",
        "header.notification": "Thông báo",
        "header.cart": "Giỏ hàng"
    },
    en: {
        "nav.home": "HOME",
        "nav.snacks": "SNACKS",
        "nav.vegan": "VEGAN",
        "nav.hotpot": "HOTPOT",
        "nav.salty": "MAIN COURSE",
        "nav.dessert": "DESSERTS",
        "nav.drinks": "DRINKS",
        "nav.others": "OTHERS",
        "nav.about": "ABOUT US",
        "nav.contact": "CONTACT",
        "header.search": "Search for food...",
        "header.filter": "Filter",
        "header.login": "Login / Register",
        "header.account": "Account",
        "header.notification": "Notifications",
        "header.cart": "Cart"
    }
};

// Hàm thay đổi ngôn ngữ
function setLanguage(lang) {
    localStorage.setItem('appLang', lang);
    applyTranslations(lang);
    updateLangUI(lang);
}

// Hàm áp dụng ngôn ngữ lên giao diện
function applyTranslations(lang) {
    const dict = translations[lang];
    if (!dict) return;

    // Quét tất cả các thẻ có thuộc tính data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dict[key]) {
            // Xử lý riêng cho input placeholder
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.placeholder = dict[key];
            } else {
                // Giữ lại icon nếu có (thường dùng innerHTML có chứa <i>)
                // Để đơn giản, ở đây ta chỉ thay đổi textNode hoặc dùng innerText.
                // Lưu ý: nếu trong HTML có icon, cấu trúc HTML cần bọc chữ vào thẻ <span> riêng.
                el.innerText = dict[key];
            }
        }
    });
}

// Hàm cập nhật giao diện của nút chọn ngôn ngữ
function updateLangUI(lang) {
    const btnVi = document.getElementById('btn-lang-vi');
    const btnEn = document.getElementById('btn-lang-en');
    
    if (btnVi && btnEn) {
        if (lang === 'vi') {
            btnVi.classList.add('active-lang');
            btnEn.classList.remove('active-lang');
        } else {
            btnEn.classList.add('active-lang');
            btnVi.classList.remove('active-lang');
        }
    }
}

// Khởi tạo ngôn ngữ khi tải trang
document.addEventListener('DOMContentLoaded', () => {
    // Mặc định là Tiếng Việt
    const savedLang = localStorage.getItem('appLang') || 'vi';
    applyTranslations(savedLang);
    updateLangUI(savedLang);
});
