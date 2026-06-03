let BACKEND_URL;
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    BACKEND_URL = 'http://localhost:3500'; // Hỗ trợ chạy qua Live Server
} else {
    BACKEND_URL = window.location.origin; // Hỗ trợ tự động nhận Ngrok, Render, hoặc Domain thật
}

const BASE_URL = `${BACKEND_URL}/api`;
window.BACKEND_URL = BACKEND_URL;

const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

const showLoader = () => {
    const loader = document.getElementById('loading-overlay');
    if (loader) loader.classList.add('show');
};

const hideLoader = () => {
    const loader = document.getElementById('loading-overlay');
    if (loader) loader.classList.remove('show');
};

window.api = {
    subscribePushNotification: async (silent = false) => {
        let loadingToast = null;
        try {
            if (!silent && typeof toast !== 'undefined') {
                loadingToast = toast({ title: 'Đang xử lý', message: 'Đang đăng ký thông báo đẩy...', type: 'info', duration: 10000 });
            }
            const token = localStorage.getItem('token');
            if (!token) {
                if (!silent && typeof toast !== 'undefined') toast({ title: 'Lỗi', message: 'Vui lòng đăng nhập để nhận thông báo.', type: 'warning', duration: 3000 });
                return;
            }

            if (!('serviceWorker' in navigator)) {
                if (!silent && typeof toast !== 'undefined') toast({ title: 'Lỗi', message: 'Trình duyệt không hỗ trợ Service Worker.', type: 'error', duration: 4000 });
                return;
            }
            if (!('PushManager' in window)) {
                if (!silent && typeof toast !== 'undefined') toast({ title: 'Lỗi', message: 'Trình duyệt không hỗ trợ Push Notifications hoặc bạn đang không dùng HTTPS.', type: 'error', duration: 5000 });
                return;
            }
            
            let registration = await navigator.serviceWorker.getRegistration();
            if (!registration) {
                registration = await navigator.serviceWorker.register('./sw.js');
                await navigator.serviceWorker.ready;
            }

            let subscription = await registration.pushManager.getSubscription();
            if (!subscription) {
                const permission = await Notification.requestPermission();
                if (permission !== 'granted') {
                    if (!silent && typeof toast !== 'undefined') toast({ title: 'Cảnh báo', message: 'Bạn đã chặn quyền hiển thị thông báo. Hãy mở khóa trong cài đặt trình duyệt.', type: 'warning', duration: 5000 });
                    return;
                }

                // Fetch public key
                const response = await fetch(`${BASE_URL}/push/public-key`);
                const data = await response.json();
                if (!data.publicKey) {
                    if (!silent && typeof toast !== 'undefined') toast({ title: 'Lỗi', message: 'Không thể lấy Public Key từ Server.', type: 'error', duration: 4000 });
                    return;
                }
                
                // Convert Base64URL to Uint8Array
                const padding = '='.repeat((4 - data.publicKey.length % 4) % 4);
                const base64 = (data.publicKey + padding).replace(/\-/g, '+').replace(/_/g, '/');
                const rawData = window.atob(base64);
                const outputArray = new Uint8Array(rawData.length);
                for (let i = 0; i < rawData.length; ++i) {
                    outputArray[i] = rawData.charCodeAt(i);
                }
                
                subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: outputArray
                });
            }
            
            // Gửi subscription lên server
            await fetch(`${BASE_URL}/push/subscribe`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ subscription })
            });
            console.log('Push notification subscribed successfully');
            if (!silent && typeof toast !== 'undefined') {
                toast({ title: 'Thành công', message: 'Đã bật thông báo đẩy! Bạn sẽ nhận được thông báo khi đơn hàng cập nhật.', type: 'success', duration: 4000 });
            }
        } catch (error) {
            console.error('Lỗi khi đăng ký push notification:', error);
            if (typeof toast !== 'undefined') {
                toast({ title: 'Thất bại', message: 'Không thể bật thông báo. Lỗi: ' + error.message, type: 'error', duration: 4000 });
            }
        } finally {
            if (loadingToast && loadingToast.parentNode) {
                loadingToast.parentNode.removeChild(loadingToast);
            }
        }
    },

    getPaginatedProducts: async (page = 1, limit = 10, category = "Tất cả", search = "") => {
        showLoader();
        try {
            let url = `${BASE_URL}/products/admin/paginated?page=${page}&limit=${limit}&category=${encodeURIComponent(category)}`;
            if (search) url += `&search=${encodeURIComponent(search)}`;
            
            const response = await fetch(url, {
                headers: getHeaders()
            });
            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json();
        } catch (error) {
            console.error("Failed to fetch paginated products:", error);
            throw error;
        } finally {
            hideLoader();
        }
    },

    getProducts: async (search = "", silent = false) => {
        if (!search && window._productsCache && (Date.now() - window._productsCacheTime < 300000)) {
            return window._productsCache;
        }

        if (!silent) showLoader();
        try {
            let url = `${BASE_URL}/products`;
            if (search) url += `?search=${encodeURIComponent(search)}`;
            const response = await fetch(url, {
                headers: getHeaders()
            });
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            if (!search) {
                window._productsCache = data;
                window._productsCacheTime = Date.now();
            }
            return data;
        } catch (error) {
            console.error("Failed to fetch products:", error);
            throw error;
        } finally {
            if (!silent) hideLoader();
        }
    },

    login: async (username, password) => {
        showLoader();
        try {
            const response = await fetch(`${BASE_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();
            if (data.success && data.token) {
                localStorage.setItem('token', data.token);
            }
            return data;
        } catch (error) {
            console.error("Login failed:", error);
            throw error;
        } finally {
            hideLoader();
        }
    },

    register: async (userData) => {
        try {
            const response = await fetch(`${BASE_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
            return await response.json();
        } catch (error) {
            console.error("Registration failed:", error);
            throw error;
        }
    },

    // --- Order APIs ---
    createOrder: async (orderData) => {
        showLoader();
        try {
            const response = await fetch(`${BASE_URL}/orders`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(orderData)
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Order creation failed');
            }
            return await response.json();
        } catch (error) {
            console.error("Order error:", error);
            throw error;
        } finally {
            hideLoader();
        }
    },

    getOrders: async (silent = false) => {
        if (!silent) showLoader();
        try {
            const response = await fetch(`${BASE_URL}/orders`, {
                headers: getHeaders()
            });
            if (!response.ok) throw new Error('Failed to fetch orders');
            return await response.json();
        } catch (error) {
            console.error("Get orders error:", error);
            throw error;
        } finally {
            if (!silent) hideLoader();
        }
    },

    getOrdersPaginated: async (page = 1, limit = 10, status = 3, search = '', startDate = '', endDate = '', silent = false) => {
        if (!silent) showLoader();
        try {
            let queryUrl = `${BASE_URL}/orders/paginated?page=${page}&limit=${limit}&status=${status}`;
            if (search) queryUrl += `&search=${encodeURIComponent(search)}`;
            if (startDate) queryUrl += `&startDate=${encodeURIComponent(startDate)}`;
            if (endDate) queryUrl += `&endDate=${encodeURIComponent(endDate)}`;

            const response = await fetch(queryUrl, {
                headers: getHeaders()
            });
            if (!response.ok) throw new Error('Failed to fetch paginated orders');
            return await response.json();
        } catch (error) {
            console.error("Get paginated orders error:", error);
            throw error;
        } finally {
            if (!silent) hideLoader();
        }
    },
    getOrderDetails: async (id) => {
        showLoader();
        try {
            const response = await fetch(`${BASE_URL}/orders/${id}/details`, {
                headers: getHeaders()
            });
            if (!response.ok) throw new Error('Failed to fetch order details');
            return await response.json();
        } catch (error) {
            console.error("Order details error:", error);
            throw error;
        } finally {
            hideLoader();
        }
    },

    cancelOrder: async (id) => {
        showLoader();
        try {
            const response = await fetch(`${BASE_URL}/orders/${id}/cancel`, {
                method: 'PUT',
                headers: getHeaders()
            });

            const contentType = response.headers.get("content-type");
            if (!response.ok) {
                if (contentType && contentType.indexOf("application/json") !== -1) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Hủy đơn hàng thất bại');
                } else {
                    // If not JSON (like a 404 HTML page)
                    if (response.status === 404) {
                        throw new Error('Đường dẫn API không tồn tại. Vui lòng khởi động lại Server!');
                    }
                    throw new Error(`Lỗi hệ thống (${response.status}). Vui lòng thử lại sau!`);
                }
            }
            return await response.json();
        } catch (error) {
            console.error("Cancel order error:", error);
            throw error;
        } finally {
            hideLoader();
        }
    },

    updateOrder: async (id, orderData) => {
        showLoader();
        try {
            const response = await fetch(`${BASE_URL}/orders/${id}/update`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(orderData)
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Cập nhật đơn hàng thất bại');
            }
            return await response.json();
        } catch (error) {
            console.error("Update order error:", error);
            throw error;
        } finally {
            hideLoader();
        }
    },

    // --- Product CRUD APIs ---
    addProduct: async (productData) => {
        window._productsCache = null;
        showLoader();
        try {
            const response = await fetch(`${BASE_URL}/products`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(productData)
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Lỗi khi thêm sản phẩm');
            }
            return await response.json();
        } catch (error) {
            console.error("Add product error:", error);
            throw error;
        } finally {
            hideLoader();
        }
    },

    updateProduct: async (id, productData) => {
        window._productsCache = null;
        showLoader();
        try {
            const response = await fetch(`${BASE_URL}/products/${id}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(productData)
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Lỗi khi cập nhật sản phẩm');
            }
            return await response.json();
        } catch (error) {
            console.error("Update product error:", error);
            throw error;
        } finally {
            hideLoader();
        }
    },

    deleteProduct: async (id) => {
        window._productsCache = null;
        showLoader();
        try {
            const response = await fetch(`${BASE_URL}/products/${id}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Lỗi khi xóa sản phẩm');
            }
            return await response.json();
        } catch (error) {
            console.error("Delete product error:", error);
            throw error;
        } finally {
            hideLoader();
        }
    },

    // --- User Management APIs ---
    getUsers: async (silent = false) => {
        if (!silent) showLoader();
        try {
            const response = await fetch(`${BASE_URL}/users`, {
                headers: getHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error("Get users error:", error);
            throw error;
        } finally {
            if (!silent) hideLoader();
        }
    },

    updateUser: async (phone, userData) => {
        try {
            const response = await fetch(`${BASE_URL}/users/${phone}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(userData)
            });
            return await response.json();
        } catch (error) {
            console.error("Update user error:", error);
            throw error;
        }
    },

    deleteUser: async (phone) => {
        try {
            const response = await fetch(`${BASE_URL}/users/${phone}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error("Delete user error:", error);
            throw error;
        }
    },

    // --- Order Detail & Status APIs ---
    getOrderDetails: async (orderId) => {
        try {
            const response = await fetch(`${BASE_URL}/orders/${orderId}/details`, {
                headers: getHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error("Get order details error:", error);
            throw error;
        }
    },

    updateOrderStatus: async (orderId, status) => {
        showLoader();
        try {
            const response = await fetch(`${BASE_URL}/orders/${orderId}/status`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify({ status })
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Lỗi khi cập nhật trạng thái');
            }
            return await response.json();
        } catch (error) {
            console.error("Update order status error:", error);
            throw error;
        } finally {
            hideLoader();
        }
    },

    // --- VOUCHERS ---
    getVouchers: async (silent = false) => {
        if (!silent) showLoader();
        try {
            const response = await fetch(`${BASE_URL}/vouchers`, {
                headers: getHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error("Get vouchers error:", error);
            throw error;
        } finally {
            if (!silent) hideLoader();
        }
    },

    checkVoucher: async (code) => {
        try {
            const response = await fetch(`${BASE_URL}/vouchers/${code}`);
            return await response.json();
        } catch (error) {
            console.error("Check voucher error:", error);
            throw error;
        }
    },

    createVoucher: async (voucherData) => {
        showLoader();
        try {
            const response = await fetch(`${BASE_URL}/vouchers`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(voucherData)
            });
            return await response.json();
        } catch (error) {
            console.error("Create voucher error:", error);
            throw error;
        } finally {
            hideLoader();
        }
    },

    updateVoucherStatus: async (code, status) => {
        showLoader();
        try {
            const response = await fetch(`${BASE_URL}/vouchers/${code}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify({ status })
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Lỗi khi cập nhật trạng thái');
            }
            return await response.json();
        } catch (error) {
            console.error("Update voucher error:", error);
            throw error;
        } finally {
            hideLoader();
        }
    },

    deleteVoucher: async (code) => {
        showLoader();
        try {
            const response = await fetch(`${BASE_URL}/vouchers/${code}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Lỗi khi xóa mã giảm giá');
            }
            return await response.json();
        } catch (error) {
            console.error("Delete voucher error:", error);
            throw error;
        } finally {
            hideLoader();
        }
    },


    deleteOrder: async (orderId) => {
        try {
            const response = await fetch(`${BASE_URL}/orders/${orderId}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error("Delete order error:", error);
            throw error;
        }
    },

    // --- Cart Synchronization APIs ---
    getCart: async () => {
        try {
            const response = await fetch(`${BASE_URL}/cart`, {
                headers: getHeaders()
            });
            if (!response.ok) {
                console.error("Failed to fetch cart, status:", response.status);
                return [];
            }
            return await response.json();
        } catch (error) {
            console.error("Get cart error:", error);
            return [];
        }
    },

    updateCart: async (cartData) => {
        try {
            const response = await fetch(`${BASE_URL}/cart`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(cartData)
            });
            return await response.json();
        } catch (error) {
            console.error("Update cart error:", error);
            throw error;
        }
    },

    // --- FAVORITES APIs ---
    getFavorites: async () => {
        try {
            const response = await fetch(`${BASE_URL}/favorites`, {
                headers: getHeaders()
            });
            if (!response.ok) return [];
            return await response.json();
        } catch (error) {
            console.error("Get favorites error:", error);
            return [];
        }
    },

    addFavorite: async (productId) => {
        try {
            const response = await fetch(`${BASE_URL}/favorites`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ productId })
            });
            return await response.json();
        } catch (error) {
            console.error("Add favorite error:", error);
            throw error;
        }
    },

    removeFavorite: async (productId) => {
        try {
            const response = await fetch(`${BASE_URL}/favorites/${productId}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error("Remove favorite error:", error);
            throw error;
        }
    },

    getReviews: async (productId) => {
        try {
            const response = await fetch(`${BASE_URL}/products/${productId}/reviews`);
            return await response.json();
        } catch (error) {
            console.error("Get reviews error:", error);
            throw error;
        }
    },

    submitReview: async (reviewData) => {
        try {
            const response = await fetch(`${BASE_URL}/reviews`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(reviewData)
            });
            return await response.json();
        } catch (error) {
            console.error("Submit review error:", error);
            throw error;
        }
    },

    getAdminReviews: async () => {
        showLoader();
        try {
            const response = await fetch(`${BASE_URL}/admin/reviews`, {
                headers: getHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error("Admin get reviews error:", error);
            throw error;
        } finally {
            hideLoader();
        }
    },

    getStatsReport: async () => {
        try {
            const response = await fetch(`${BASE_URL}/admin/stats/report`, {
                headers: getHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error("Get stats report error:", error);
            throw error;
        }
    },

    getProfitReport: async () => {
        try {
            const response = await fetch(`${BASE_URL}/inventory/profit-report`, {
                headers: getHeaders()
            });
            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json();
        } catch (error) {
            console.error("Get profit report error:", error);
            throw error;
        }
    },

    getLogs: async (page = 1, search = '') => {
        showLoader();
        try {
            const queryParams = new URLSearchParams({ page, search });
            const response = await fetch(`${BASE_URL}/admin/logs?${queryParams.toString()}`, {
                headers: getHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error("Failed to fetch logs:", error);
            throw error;
        } finally {
            hideLoader();
        }
    },

    clearLogs: async () => {
        showLoader();
        try {
            const response = await fetch(`${BASE_URL}/admin/logs`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error("Failed to clear logs:", error);
            throw error;
        } finally {
            hideLoader();
        }
    },

    deleteLog: async (id) => {
        showLoader();
        try {
            const response = await fetch(`${BASE_URL}/admin/logs/${id}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error("Failed to delete log:", error);
            throw error;
        } finally {
            hideLoader();
        }
    },

    deleteReview: async (id) => {
        showLoader();
        try {
            const response = await fetch(`${BASE_URL}/admin/reviews/${id}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error("Admin delete review error:", error);
            throw error;
        } finally {
            hideLoader();
        }
    },

    getStockHistory: async () => {
        try {
            const response = await fetch(`${BASE_URL}/admin/stock-history`, {
                headers: getHeaders()
            });
            if (!response.ok) throw new Error('Failed to fetch stock history');
            return await response.json();
        } catch (error) {
            console.error("Stock history error:", error);
            throw error;
        }
    },

    stockIn: async (data) => {
        try {
            const response = await fetch(`${BASE_URL}/admin/stock-in`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || 'Failed to update stock');
            }
            return await response.json();
        } catch (error) {
            console.error("Stock in error:", error);
            throw error;
        }
    },

    getNotifications: async () => {
        try {
            const response = await fetch(`${BASE_URL}/notifications`, {
                headers: getHeaders()
            });
            if (!response.ok) return [];
            return await response.json();
        } catch (error) {
            console.error("Fetch notifications error:", error);
            return [];
        }
    },

    markNotificationAsRead: async (id) => {
        try {
            await fetch(`${BASE_URL}/notifications/${id}/read`, {
                method: 'PUT',
                headers: getHeaders()
            });
        } catch (error) {
            console.error("Mark notification read error:", error);
        }
    },

    markAllNotificationsAsRead: async () => {
        try {
            await fetch(`${BASE_URL}/notifications/read-all`, {
                method: 'PUT',
                headers: getHeaders()
            });
        } catch (error) {
            console.error("Mark all read error:", error);
        }
    },

    deleteNotification: async (id) => {
        try {
            await fetch(`${BASE_URL}/notifications/${id}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
        } catch (error) {
            console.error("Delete notification error:", error);
        }
    },

    deleteAllNotifications: async () => {
        try {
            await fetch(`${BASE_URL}/notifications`, {
                method: 'DELETE',
                headers: getHeaders()
            });
        } catch (error) {
            console.error("Delete all notifications error:", error);
        }
    },

    // --- CATEGORIES ---
    getCategories: async () => {
        try {
            const response = await fetch(`${BASE_URL}/categories`);
            if (!response.ok) throw new Error('Failed to fetch categories');
            return await response.json();
        } catch (error) {
            console.error("Get categories error:", error);
            throw error;
        }
    },

    addCategory: async (name) => {
        showLoader();
        try {
            const response = await fetch(`${BASE_URL}/categories`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ name })
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || 'Lỗi khi thêm danh mục');
            }
            return await response.json();
        } catch (error) {
            console.error("Add category error:", error);
            throw error;
        } finally {
            hideLoader();
        }
    },

    updateCategory: async (id, name) => {
        showLoader();
        try {
            const response = await fetch(`${BASE_URL}/categories/${id}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify({ name })
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || 'Lỗi khi cập nhật danh mục');
            }
            return await response.json();
        } catch (error) {
            console.error("Update category error:", error);
            throw error;
        } finally {
            hideLoader();
        }
    },

    deleteCategory: async (id) => {
        showLoader();
        try {
            const response = await fetch(`${BASE_URL}/categories/${id}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || 'Lỗi khi xóa danh mục');
            }
            return await response.json();
        } catch (error) {
            console.error("Delete category error:", error);
            throw error;
        } finally {
            hideLoader();
        }
    },

    changePassword: async (currentPassword, newPassword) => {
        showLoader();
        try {
            const response = await fetch(`${BASE_URL}/change-password`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ currentPassword, newPassword })
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || 'Lỗi khi đổi mật khẩu');
            }
            return result;
        } catch (error) {
            console.error("Change password API error:", error);
            throw error;
        } finally {
            hideLoader();
        }
    },

    getLiveChats: async () => {
        try {
            const response = await fetch(`${BASE_URL}/livechats`, {
                headers: getHeaders()
            });
            if (!response.ok) throw new Error('Không thể tải danh sách phiên chat');
            return await response.json();
        } catch (error) {
            console.error("getLiveChats error:", error);
            throw error;
        }
    },

    createPayOSPaymentLink: async (orderId, amount, description) => {
        showLoader();
        try {
            const response = await fetch(`${BASE_URL}/payos/create-payment-link`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ orderId, amount, description })
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Không thể tạo liên kết thanh toán PayOS');
            }
            return await response.json();
        } catch (error) {
            console.error("PayOS API error:", error);
            throw error;
        } finally {
            hideLoader();
        }
    },

    // --- NEWS APIs ---
    getNews: async () => {
        try {
            const response = await fetch(`${BASE_URL}/news`);
            if (!response.ok) throw new Error('Failed to fetch news');
            return await response.json();
        } catch (error) {
            console.error("Get news error:", error);
            return { success: false, data: [] };
        }
    },

    getAdminNews: async () => {
        try {
            const response = await fetch(`${BASE_URL}/admin/news`, {
                headers: getHeaders()
            });
            if (!response.ok) throw new Error('Failed to fetch news');
            return await response.json();
        } catch (error) {
            console.error("Get admin news error:", error);
            throw error;
        }
    },
    
    addNews: async (newsData) => {
        showLoader();
        try {
            const response = await fetch(`${BASE_URL}/admin/news`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(newsData)
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || 'Lỗi khi thêm bài viết');
            }
            return await response.json();
        } catch (error) {
            console.error("Add news error:", error);
            throw error;
        } finally {
            hideLoader();
        }
    },

    updateNews: async (id, newsData) => {
        showLoader();
        try {
            const response = await fetch(`${BASE_URL}/admin/news/${id}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(newsData)
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || 'Lỗi khi cập nhật bài viết');
            }
            return await response.json();
        } catch (error) {
            console.error("Update news error:", error);
            throw error;
        } finally {
            hideLoader();
        }
    },

    deleteNews: async (id) => {
        showLoader();
        try {
            const response = await fetch(`${BASE_URL}/admin/news/${id}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || 'Lỗi khi xóa bài viết');
            }
            return await response.json();
        } catch (error) {
            console.error("Delete news error:", error);
            throw error;
        } finally {
            hideLoader();
        }
    },

    getSuppliers: async () => {
        try {
            const response = await fetch(`${BASE_URL}/admin/suppliers`, { headers: getHeaders() });
            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },
    
    addSupplier: async (data) => {
        try {
            const response = await fetch(`${BASE_URL}/admin/suppliers`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    getPurchaseOrders: async () => {
        try {
            const response = await fetch(`${BASE_URL}/admin/purchase-orders`, { headers: getHeaders() });
            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    createPurchaseOrder: async (data) => {
        try {
            const response = await fetch(`${BASE_URL}/admin/purchase-orders`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }
};
