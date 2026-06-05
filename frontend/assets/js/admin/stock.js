function switchInventoryTab(tabId) {
    document.querySelectorAll('.admin-tabs .tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.tab-btn[onclick="switchInventoryTab('${tabId}')"]`).classList.add('active');
    
    document.querySelectorAll('.inventory-tab-content').forEach(content => content.style.display = 'none');
    document.getElementById(`tab-${tabId}`).style.display = 'block';
    
    if (tabId === 'suppliers') {
        loadSuppliers();
    } else if (tabId === 'history') {
        loadStockHistory();
    } else {
        loadPurchaseOrders();
    }
}

async function loadPurchaseOrders() {
    try {
        const response = await api.getPurchaseOrders();
        const tbody = document.getElementById('show-purchase-orders');
        if (!tbody) return;
        
        if (!response.data || response.data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Chưa có dữ liệu</td></tr>';
            return;
        }
        
        let html = '';
        response.data.forEach(item => {
            html += `<tr>
                <td>PO-${item.id.substring(0,8)}</td>
                <td>${item.supplierName || 'N/A'}</td>
                <td style="color: var(--primary-color); font-weight: bold;">${item.totalAmount.toLocaleString('vi-VN')}₫</td>
                <td>${item.staffName || 'Admin'}</td>
                <td>${new Date(item.importDate).toLocaleString('vi-VN')}</td>
                <td>${item.note || ''}</td>
                <td>
                    <span style="color: green; margin-right: 10px;">Hoàn tất</span>
                    <button onclick="deletePurchaseOrder('${item.id}')" style="background:none; border:none; color:red; cursor:pointer;" title="Xoá phiếu nhập"><i class="fa-regular fa-trash"></i></button>
                </td>
            </tr>`;
        });
        tbody.innerHTML = html;
    } catch (error) {
        console.error("Lỗi khi tải phiếu nhập:", error);
    }
}

async function loadSuppliers() {
    try {
        const response = await api.getSuppliers();
        const tbody = document.getElementById('show-suppliers');
        if (!tbody) return;
        
        if (!response.data || response.data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Chưa có dữ liệu</td></tr>';
            return;
        }
        
        let html = '';
        response.data.forEach(item => {
            html += `<tr>
                <td style="font-weight: bold;">${item.name}</td>
                <td>${item.phone}</td>
                <td>${item.email || ''}</td>
                <td>${item.address || ''}</td>
                <td>
                    <span style="color: green; margin-right: 10px;">Đang hợp tác</span>
                    <button onclick="deleteSupplier('${item.id}')" style="background:none; border:none; color:red; cursor:pointer;" title="Xoá nhà cung cấp"><i class="fa-regular fa-trash"></i></button>
                </td>
            </tr>`;
        });
        tbody.innerHTML = html;
    } catch (error) {
        console.error("Lỗi khi tải nhà cung cấp:", error);
    }
}

async function loadStockHistory() {
    try {
        const response = await api.getStockHistory();
        const history = response.data || response;
        const tbody = document.getElementById('show-stock-history');
        if (!tbody) return;
        
        if (!history || history.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Chưa có dữ liệu</td></tr>';
            return;
        }
        
        let html = '';
        history.forEach(item => {
            const poLabel = item.purchaseOrderId ? 'PO-' + item.purchaseOrderId.substring(0,8).toUpperCase() : item.id;
            const importPriceStr = item.importPrice ? item.importPrice.toLocaleString('vi-VN') + '₫' : '-';
            const totalPriceStr = item.totalPrice ? item.totalPrice.toLocaleString('vi-VN') + '₫' : '-';
            
            const isImport = item.action === 'IMPORT' || item.action === 'IMPORT_PO';
            const sign = isImport ? '+' : '-';
            
            let actionHtml = '-';
            if (item.action === 'IMPORT' || item.action === 'EXPORT' || item.action === 'DELETE_PO') {
                actionHtml = `<button onclick="deleteStockHistory('${item.id}')" style="background:none; border:none; color:red; cursor:pointer;" title="Xoá"><i class="fa-regular fa-trash"></i></button>`;
            }

            html += `<tr>
                <td>${poLabel}</td>
                <td style="font-weight: bold;">${item.productTitle || item.productId}</td>
                <td><span style="color: ${isImport ? 'green' : 'red'};">${sign}${item.quantity}</span></td>
                <td>${importPriceStr}</td>
                <td>${totalPriceStr}</td>
                <td>${new Date(item.createdAt).toLocaleString('vi-VN')}</td>
                <td>${actionHtml}</td>
            </tr>`;
        });
        tbody.innerHTML = html;
    } catch (error) {
        console.error("Lỗi khi tải chi tiết lô nhập:", error);
    }
}

function openSupplierModal() {
    document.getElementById('supplier-form').reset();
    document.getElementById('supplier-modal').classList.add('open');
}

function closeSupplierModal() {
    document.getElementById('supplier-modal').classList.remove('open');
}

async function submitSupplier() {
    const name = document.getElementById('supplier-name').value;
    const phone = document.getElementById('supplier-phone').value;
    const email = document.getElementById('supplier-email').value;
    const address = document.getElementById('supplier-address').value;
    
    try {
        const res = await api.addSupplier({ name, phone, email, address });
        if (res.success) {
            toast({ title: "Thành công", message: res.message, type: "success" });
            closeSupplierModal();
            loadSuppliers();
        } else {
            toast({ title: "Lỗi", message: res.message, type: "error" });
        }
    } catch (error) {
        toast({ title: "Lỗi", message: "Không thể thêm nhà cung cấp", type: "error" });
    }
}

async function openPurchaseOrderModal() {
    document.getElementById('po-form').reset();
    document.getElementById('po-items-body').innerHTML = '';
    calculatePOTotal();
    
    try {
        // Load suppliers into select
        const supplierRes = await api.getSuppliers();
        const select = document.getElementById('po-supplier');
        select.innerHTML = '<option value="">Chọn nhà cung cấp...</option>';
        if (supplierRes.data) {
            supplierRes.data.forEach(s => {
                select.innerHTML += `<option value="${s.id}">${s.name}</option>`;
            });
        }
        
        // Cache products for row adding
        if (!window.cachedProducts) {
            const prodRes = await api.getProducts();
            window.cachedProducts = prodRes.data || prodRes;
        }
        
        // Add one initial row
        addPOItemRow();
        
        document.getElementById('po-modal').classList.add('open');
    } catch (error) {
        toast({ title: "Lỗi", message: "Lỗi khi tải dữ liệu", type: "error" });
    }
}

function closePurchaseOrderModal() {
    document.getElementById('po-modal').classList.remove('open');
}

function addPOItemRow() {
    const tbody = document.getElementById('po-items-body');
    const tr = document.createElement('tr');
    tr.className = 'po-item-row';
    
    let prodOptions = '<option value="">Chọn sản phẩm...</option>';
    if (window.cachedProducts) {
        window.cachedProducts.forEach(p => {
            prodOptions += `<option value="${p.id}">${p.title} - Tồn: ${p.stock}</option>`;
        });
    }
    
    tr.innerHTML = `
        <td><select class="form-control po-product-select" required onchange="calculatePOTotal()">${prodOptions}</select></td>
        <td><input type="number" class="form-control po-quantity" min="1" value="1" required oninput="calculatePOTotal()"></td>
        <td><input type="number" class="form-control po-price" min="0" value="0" required oninput="calculatePOTotal()"></td>
        <td><button type="button" onclick="this.parentElement.parentElement.remove(); calculatePOTotal()" style="background:none; border:none; color:red; cursor:pointer;"><i class="fa-regular fa-trash"></i></button></td>
    `;
    tbody.appendChild(tr);
}

function calculatePOTotal() {
    let total = 0;
    document.querySelectorAll('.po-item-row').forEach(row => {
        const qty = parseInt(row.querySelector('.po-quantity').value) || 0;
        const price = parseInt(row.querySelector('.po-price').value) || 0;
        total += qty * price;
    });
    document.getElementById('po-total-amount').innerText = total.toLocaleString('vi-VN') + '₫';
    return total;
}

async function submitPurchaseOrder() {
    const supplierId = document.getElementById('po-supplier').value;
    const note = document.getElementById('po-note').value;
    
    const items = [];
    let valid = true;
    
    document.querySelectorAll('.po-item-row').forEach(row => {
        const productId = row.querySelector('.po-product-select').value;
        const quantity = parseInt(row.querySelector('.po-quantity').value);
        const importPrice = parseInt(row.querySelector('.po-price').value);
        
        if (!productId || quantity <= 0 || importPrice < 0) {
            valid = false;
        } else {
            items.push({ productId, quantity, importPrice });
        }
    });
    
    if (!valid || items.length === 0) {
        toast({ title: "Lỗi", message: "Vui lòng nhập đầy đủ và chính xác thông tin sản phẩm", type: "error" });
        return;
    }
    
    const totalAmount = calculatePOTotal();
    
    try {
        const res = await api.createPurchaseOrder({ supplierId, note, totalAmount, items });
        if (res.success) {
            toast({ title: "Thành công", message: res.message, type: "success" });
            closePurchaseOrderModal();
            loadPurchaseOrders();
        } else {
            toast({ title: "Lỗi", message: res.message, type: "error" });
        }
    } catch (error) {
        toast({ title: "Lỗi", message: "Lỗi khi tạo phiếu nhập", type: "error" });
    }
}

async function deleteSupplier(id) {
    if (!confirm('Bạn có chắc chắn muốn xoá nhà cung cấp này?')) return;
    try {
        const res = await api.deleteSupplier(id);
        if (res.success) {
            toast({ title: "Thành công", message: res.message, type: "success" });
            loadSuppliers();
        } else {
            toast({ title: "Lỗi", message: res.message, type: "error" });
        }
    } catch (error) {
        toast({ title: "Lỗi", message: "Lỗi khi xoá nhà cung cấp", type: "error" });
    }
}

async function deletePurchaseOrder(id) {
    if (!confirm('Bạn có chắc chắn muốn xoá phiếu nhập này? Tồn kho sẽ bị hoàn tác!')) return;
    try {
        const res = await api.deletePurchaseOrder(id);
        if (res.success) {
            toast({ title: "Thành công", message: res.message, type: "success" });
            loadPurchaseOrders();
            if (typeof loadStockHistory === 'function') loadStockHistory();
            if (typeof loadInventoryStats === 'function') loadInventoryStats();
        } else {
            toast({ title: "Lỗi", message: res.message, type: "error" });
        }
    } catch (error) {
        toast({ title: "Lỗi", message: "Lỗi khi xoá phiếu nhập", type: "error" });
    }
}

async function deleteStockHistory(id) {
    if (!confirm('Bạn có chắc chắn muốn xoá lịch sử này? Tồn kho sẽ bị hoàn tác!')) return;
    try {
        const res = await api.deleteStockHistory(id);
        if (res.success) {
            toast({ title: "Thành công", message: res.message, type: "success" });
            loadStockHistory();
            if (typeof loadInventoryStats === 'function') loadInventoryStats();
        } else {
            toast({ title: "Lỗi", message: res.message, type: "error" });
        }
    } catch (error) {
        toast({ title: "Lỗi", message: "Lỗi khi xoá lịch sử", type: "error" });
    }
}

// Attach to window
window.switchInventoryTab = switchInventoryTab;
window.loadPurchaseOrders = loadPurchaseOrders;
window.loadSuppliers = loadSuppliers;
window.loadStockHistory = loadStockHistory;
window.openSupplierModal = openSupplierModal;
window.openPurchaseOrderModal = openPurchaseOrderModal;
window.closeSupplierModal = closeSupplierModal;
window.closePurchaseOrderModal = closePurchaseOrderModal;
window.submitSupplier = submitSupplier;
window.submitPurchaseOrder = submitPurchaseOrder;
window.addPOItemRow = addPOItemRow;
window.calculatePOTotal = calculatePOTotal;
window.deleteSupplier = deleteSupplier;
window.deletePurchaseOrder = deletePurchaseOrder;
window.deleteStockHistory = deleteStockHistory;
