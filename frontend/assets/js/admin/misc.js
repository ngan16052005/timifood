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

                const displayDate = r.reviewDate ? new Date(r.reviewDate).toLocaleDateString('vi-VN') : '---';

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
                        <button class="btn-delete" onclick="deleteReviewAdmin('${r.id}')">
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
                    <td>${new Date(item.importDate).toLocaleString('vi-VN')}</td>
                    <td>${item.note || '-'}</td>
                </tr>`;
            });
        }
        document.getElementById("show-stock-history").innerHTML = html;
        await loadInventoryStats();
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
            productId: productId,
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
                        <button class="btn-edit" onclick="openEditCategoryModal('${cat.id}', '${cat.name}')">
                            <i class="fa-light fa-pen-to-square"></i>
                        </button>
                        <button class="btn-delete" onclick="deleteCategory('${cat.id}')">
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
let inventoryChartInstance = null;
async function loadInventoryStats() {
    try {
        const response = await fetch('/api/inventory/stats', {
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
        });
        const data = await response.json();
        if (data.success) {
            const ctx = document.getElementById('inventoryChart');
            if (!ctx) return;
            
            if (inventoryChartInstance) {
                inventoryChartInstance.destroy();
            }
            
            const labels = data.data.map(item => item.title);
            const soldData = data.data.map(item => item.soldQuantity);
            const stockData = data.data.map(item => item.stock);
            
            const gradientSold = ctx.getContext('2d').createLinearGradient(0, 0, 0, 400);
            gradientSold.addColorStop(0, 'rgba(0, 184, 148, 0.9)');
            gradientSold.addColorStop(1, 'rgba(0, 184, 148, 0.4)');

            const gradientStock = ctx.getContext('2d').createLinearGradient(0, 0, 0, 400);
            gradientStock.addColorStop(0, 'rgba(9, 132, 227, 0.9)');
            gradientStock.addColorStop(1, 'rgba(9, 132, 227, 0.4)');

            inventoryChartInstance = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Đã bán (7 ngày)',
                            data: soldData,
                            backgroundColor: gradientSold,
                            borderRadius: 8,
                            borderSkipped: false,
                            barPercentage: 0.6,
                            categoryPercentage: 0.8
                        },
                        {
                            label: 'Tồn kho hiện tại',
                            data: stockData,
                            backgroundColor: gradientStock,
                            borderRadius: 8,
                            borderSkipped: false,
                            barPercentage: 0.6,
                            categoryPercentage: 0.8
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            labels: {
                                font: { family: 'Inter, sans-serif', size: 13, weight: '500' },
                                usePointStyle: true,
                                padding: 20
                            }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            titleColor: '#2d3436',
                            bodyColor: '#636e72',
                            borderColor: 'rgba(0,0,0,0.05)',
                            borderWidth: 1,
                            padding: 15,
                            boxPadding: 6,
                            usePointStyle: true,
                            titleFont: { family: 'Inter, sans-serif', size: 14, weight: 'bold' },
                            bodyFont: { family: 'Inter, sans-serif', size: 13 }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(0,0,0,0.03)',
                                drawBorder: false
                            },
                            ticks: {
                                font: { family: 'Inter, sans-serif', size: 12 },
                                color: '#b2bec3',
                                padding: 10
                            }
                        },
                        x: {
                            grid: { display: false, drawBorder: false },
                            ticks: {
                                font: { family: 'Inter, sans-serif', size: 12 },
                                color: '#636e72',
                                padding: 10
                            }
                        }
                    },
                    animation: {
                        y: { duration: 1500, easing: 'easeOutQuart' }
                    }
                }
            });
        }
    } catch (err) {
        console.error('Inventory chart error:', err);
    }
}
