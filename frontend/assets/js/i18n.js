// Logic xử lý đa ngôn ngữ qua Google Translate (Ẩn widget mặc định)

function changeLang(langCode, langName) {
    // Lưu tên hiển thị vào localStorage để giữ lại sau khi reload
    localStorage.setItem('selectedLangName', langName);
    
    // Cookie của Google Translate có định dạng: googtrans=/vi/en
    // Set cookie cho cả domain hiện tại và domain gốc
    const cookieString = `/vi/${langCode}`;
    document.cookie = `googtrans=${cookieString}; path=/`;
    document.cookie = `googtrans=${cookieString}; domain=.${document.domain}; path=/`;
    
    // Reload lại trang để áp dụng
    window.location.reload();
}

document.addEventListener('DOMContentLoaded', () => {
    // Cập nhật lại Text hiển thị của ngôn ngữ hiện tại
    const savedLangName = localStorage.getItem('selectedLangName');
    if (savedLangName) {
        const langTextEl = document.querySelector('.current-lang-text');
        if (langTextEl) {
            langTextEl.innerHTML = `${savedLangName} <i class="fa-sharp fa-solid fa-caret-down"></i>`;
        }
    }
});
