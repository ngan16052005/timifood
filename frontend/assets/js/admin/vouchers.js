function showVoucherArr(arr) {
    const systemVouchers = arr ? arr.filter(v => v.description !== 'Loyalty Reward') : [];

    const generateHtml = (vouchers) => {
        if (!vouchers || vouchers.length == 0) {
            return `<tr><td colspan="7" style="text-align:center;">Không có mã giảm giá nào</td></tr>`;
        }
        let html = "";
        vouchers.forEach((v) => {
            let type = v.discountType == 0 ? "%" : (v.discountType == 2 ? "Phí ship" : (v.discountType == 3 ? "Freeship" : "VND"));
            let status = v.status == 1 ? `<span class="status-complete">Hoạt động</span>` : `<span class="status-no-complete">Tạm dừng</span>`;
            let expiry = formatDate(v.expiryDate);

            html += `<tr>
                <td><strong>${v.code}</strong></td>
                <td>${v.discountValue}${v.discountType == 0 ? '' : ' đ'}</td>
                <td>${type}</td>
                <td>${vnd(v.minOrder)}</td>
                <td>${expiry}</td>
                <td>${status}</td>
                <td class="control control-table">
                    <button class="btn-edit" onclick="toggleVoucher('${v.code}', ${v.status == 1 ? 0 : 1})" title="Bật/Tắt" style="margin-right: 5px;"><i class="fa-light fa-power-off"></i></button>
                    <button class="btn-edit" onclick="editVoucher('${encodeURIComponent(JSON.stringify(v))}')" title="Sửa" style="margin-right: 5px;"><i class="fa-light fa-pencil"></i></button>
                    <button class="btn-delete" onclick="deleteVoucher('${v.code}')" title="Xóa"><i class="fa-light fa-trash"></i></button>
                </td>
            </tr>`;
        });
        return html;
    };

    const target = document.getElementById("show-vouchers");
    if (target) target.innerHTML = generateHtml(systemVouchers);
}

let currentEditingVoucherCode = null;

function openVoucherModal() {
    currentEditingVoucherCode = null;
    document.querySelector(".modal.voucher h3.modal-container-title").innerText = "TẠO MÃ KHUYẾN MÃI MỚI";
    document.querySelector(".voucher-form").reset();
    document.getElementById("v-code").disabled = false;
    document.querySelector(".modal.voucher").classList.add("open");
}

function closeVoucherModal() {
    document.querySelector(".modal.voucher").classList.remove("open");
}

function editVoucher(vStrEncoded) {
    const v = JSON.parse(decodeURIComponent(vStrEncoded));
    currentEditingVoucherCode = v.code;
    document.querySelector(".modal.voucher h3.modal-container-title").innerText = "CHỈNH SỬA MÃ KHUYẾN MÃI";
    document.getElementById("v-code").value = v.code;
    document.getElementById("v-code").disabled = true; // Cannot edit code
    document.getElementById("v-value").value = v.discountValue;
    document.getElementById("v-type").value = v.discountType;
    document.getElementById("v-min").value = v.minOrderValue || v.minOrder || 0;
    document.getElementById("v-max").value = v.maxDiscount || 0;
    
    let d = new Date(v.endDate || v.expiryDate);
    document.getElementById("v-expiry").value = d.toISOString().split('T')[0];

    document.querySelector(".modal.voucher").classList.add("open");
}

async function saveVoucher() {
    let code = document.getElementById("v-code").value;
    let value = document.getElementById("v-value").value;
    let type = document.getElementById("v-type").value;
    let min = document.getElementById("v-min").value;
    let max = document.getElementById("v-max").value;
    let expiry = document.getElementById("v-expiry").value;

    if (!code || !value || !expiry) {
        toast({ title: 'Lỗi', message: 'Vui lòng nhập đầy đủ thông tin bắt buộc!', type: 'error', duration: 3000 });
        return;
    }

    try {
        const payload = {
            code,
            discountValue: parseInt(value),
            discountType: parseInt(type),
            minOrderValue: parseInt(min) || 0,
            maxDiscount: parseInt(max) || 0,
            expiryDate: expiry
        };

        if (currentEditingVoucherCode) {
            // Edit
            const response = await fetch(`${window.BACKEND_URL || ''}/api/vouchers/${currentEditingVoucherCode}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            if (result.success) {
                toast({ title: 'Thành công', message: 'Đã cập nhật mã giảm giá!', type: 'success', duration: 3000 });
                closeVoucherModal();
                await initAdmin();
            } else {
                toast({ title: 'Lỗi', message: result.message || 'Không thể cập nhật!', type: 'error', duration: 3000 });
            }
        } else {
            // Create
            const response = await window.api.createVoucher(payload);
            if (response.success) {
                toast({ title: 'Thành công', message: 'Đã tạo mã giảm giá mới!', type: 'success', duration: 3000 });
                closeVoucherModal();
                await initAdmin();
            } else {
                toast({ title: 'Lỗi', message: response.message || 'Không thể tạo mã!', type: 'error', duration: 3000 });
            }
        }
    } catch (error) {
        toast({ title: 'Lỗi', message: 'Lỗi kết nối server!', type: 'error', duration: 3000 });
    }
}

async function toggleVoucher(code, status) {
    try {
        await window.api.updateVoucherStatus(code, status);
        toast({ title: 'Thành công', message: 'Đã cập nhật trạng thái!', type: 'success', duration: 3000 });
        await initAdmin();
    } catch (error) {
        toast({ title: 'Lỗi', message: error.message || 'Không thể cập nhật trạng thái!', type: 'error', duration: 3000 });
    }
}

async function deleteVoucher(code) {
    if (confirm(`Bạn có chắc muốn xóa mã ${code}?`)) {
        try {
            await window.api.deleteVoucher(code);
            toast({ title: 'Thành công', message: 'Đã xóa mã giảm giá!', type: 'success', duration: 3000 });
            await initAdmin();
        } catch (error) {
            toast({ title: 'Lỗi', message: error.message || 'Không thể xóa mã!', type: 'error', duration: 3000 });
        }
    }
}
// --- REWARD PACKAGES MANAGEMENT ---

async function loadAdminRewardPackages() {
    try {
        const response = await fetch(`${window.BACKEND_URL || ''}/api/vouchers/rewards/all`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const result = await response.json();
        if (result.success) {
            showRewardPackagesArr(result.rewards);
        } else {
            console.error("Lỗi khi tải gói ưu đãi:", result.message);
        }
    } catch (error) {
        console.error("Lỗi kết nối:", error);
    }
}

function showRewardPackagesArr(packages) {
    const target = document.getElementById("show-rewards");
    if (!target) return;

    if (!packages || packages.length === 0) {
        target.innerHTML = `<tr><td colspan="7" style="text-align:center;">Không có gói ưu đãi nào</td></tr>`;
        return;
    }

    let html = "";
    packages.forEach(p => {
        let type = p.discountType == 0 ? "%" : (p.discountType == 2 ? "Phí ship" : (p.discountType == 3 ? "Freeship" : "VND"));
        let status = p.isActive == 1 ? `<span class="status-complete">Hoạt động</span>` : `<span class="status-no-complete">Tạm dừng</span>`;
        
        // Format the object to safely pass it as JSON string
        const pJson = JSON.stringify(p).replace(/'/g, "&#39;").replace(/"/g, "&quot;");

        html += `<tr>
            <td><strong>${p.name}</strong><br><small>${p.codePrefix}</small></td>
            <td>${p.cost} TiMi</td>
            <td>${type}</td>
            <td>${p.discountValue}${p.discountType == 0 ? '' : ' đ'}</td>
            <td>${vnd(p.minOrder)}</td>
            <td>${status}</td>
            <td class="control control-table">
                <button class="btn-edit" onclick="toggleRewardPackage('${pJson}', ${p.isActive == 1 ? 0 : 1})" style="margin-right: 5px;" title="Bật/Tắt"><i class="fa-light fa-power-off"></i></button>
                <button class="btn-edit" onclick="editRewardPackage('${pJson}')" style="margin-right: 5px;" title="Sửa"><i class="fa-light fa-pencil"></i></button>
                <button class="btn-delete" onclick="deleteRewardPackage(${p.id})" title="Xóa"><i class="fa-light fa-trash"></i></button>
            </td>
        </tr>`;
    });
    target.innerHTML = html;
}

function openRewardModal() {
    document.getElementById("r-id").value = "";
    document.querySelector(".reward-form").reset();
    document.querySelector(".modal.reward").classList.add("open");
}

function closeRewardModal() {
    document.querySelector(".modal.reward").classList.remove("open");
}

function editRewardPackage(pStr) {
    const p = JSON.parse(pStr);
    document.getElementById("r-id").value = p.id;
    document.getElementById("r-name").value = p.name;
    document.getElementById("r-desc").value = p.description || "";
    document.getElementById("r-cost").value = p.cost;
    document.getElementById("r-prefix").value = p.codePrefix;
    document.getElementById("r-type").value = p.discountType;
    document.getElementById("r-value").value = p.discountValue;
    document.getElementById("r-min").value = p.minOrder;
    document.getElementById("r-color").value = p.color || "";
    document.getElementById("r-active").checked = p.isActive == 1;

    document.querySelector(".modal.reward").classList.add("open");
}

async function saveRewardPackage() {
    const id = document.getElementById("r-id").value;
    const name = document.getElementById("r-name").value;
    const desc = document.getElementById("r-desc").value;
    const cost = document.getElementById("r-cost").value;
    const prefix = document.getElementById("r-prefix").value;
    const type = document.getElementById("r-type").value;
    const value = document.getElementById("r-value").value;
    const min = document.getElementById("r-min").value;
    const color = document.getElementById("r-color").value;
    const isActive = document.getElementById("r-active").checked ? 1 : 0;

    if (!name || !cost || !prefix || !value) {
        toast({ title: 'Lỗi', message: 'Vui lòng nhập đầy đủ thông tin bắt buộc!', type: 'error', duration: 3000 });
        return;
    }

    const payload = {
        name,
        description: desc,
        cost: parseInt(cost),
        codePrefix: prefix,
        discountType: parseInt(type),
        discountValue: parseInt(value),
        minOrder: parseInt(min) || 0,
        color,
        isActive
    };

    try {
        const url = id 
            ? `${window.BACKEND_URL || ''}/api/vouchers/rewards/${id}` 
            : `${window.BACKEND_URL || ''}/api/vouchers/rewards`;
        
        const response = await fetch(url, {
            method: id ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.success) {
            toast({ title: 'Thành công', message: id ? 'Đã cập nhật gói ưu đãi!' : 'Đã tạo gói ưu đãi mới!', type: 'success', duration: 3000 });
            closeRewardModal();
            loadAdminRewardPackages();
        } else {
            toast({ title: 'Lỗi', message: result.message || 'Thao tác thất bại!', type: 'error', duration: 3000 });
        }
    } catch (error) {
        toast({ title: 'Lỗi', message: 'Lỗi kết nối server!', type: 'error', duration: 3000 });
    }
}

async function deleteRewardPackage(id) {
    if (confirm(`Bạn có chắc muốn xóa gói ưu đãi này? Hành động này không thể hoàn tác.`)) {
        try {
            const response = await fetch(`${window.BACKEND_URL || ''}/api/vouchers/rewards/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const result = await response.json();

            if (result.success) {
                toast({ title: 'Thành công', message: 'Đã xóa gói ưu đãi!', type: 'success', duration: 3000 });
                loadAdminRewardPackages();
            } else {
                toast({ title: 'Lỗi', message: result.message || 'Không thể xóa!', type: 'error', duration: 3000 });
            }
        } catch (error) {
            toast({ title: 'Lỗi', message: 'Lỗi kết nối server!', type: 'error', duration: 3000 });
        }
    }
}

async function toggleRewardPackage(pStr, status) {
    const p = JSON.parse(pStr);
    p.isActive = status;
    try {
        const response = await fetch(`${window.BACKEND_URL || ''}/api/vouchers/rewards/${p.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(p)
        });
        const result = await response.json();
        
        if (result.success) {
            toast({ title: 'Thành công', message: 'Đã cập nhật trạng thái gói ưu đãi!', type: 'success', duration: 3000 });
            loadAdminRewardPackages();
        } else {
            toast({ title: 'Lỗi', message: result.message || 'Không thể cập nhật trạng thái!', type: 'error', duration: 3000 });
        }
    } catch (error) {
        toast({ title: 'Lỗi', message: 'Lỗi kết nối server!', type: 'error', duration: 3000 });
    }
}
