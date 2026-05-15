const BASE_URL = window.location.origin + '/api';

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
    getProducts: async (search = "", silent = false) => {
        if (!silent) showLoader();
        try {
            let url = `${BASE_URL}/products`;
            if (search) url += `?search=${encodeURIComponent(search)}`;
            const response = await fetch(url, {
                headers: getHeaders()
            });
            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json();
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
    getCart: async (phone) => {
        try {
            const response = await fetch(`${BASE_URL}/cart/${phone}`, {
                headers: getHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error("Get cart error:", error);
            throw error;
        }
    },

    updateCart: async (phone, cartData) => {
        try {
            const response = await fetch(`${BASE_URL}/cart/${phone}`, {
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
    }
};
