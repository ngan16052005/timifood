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
                    <button class="btn-edit" onclick="toggleVoucher('${v.code}', ${v.status == 1 ? 0 : 1})"><i class="fa-light fa-power-off"></i></button>
                    <button class="btn-delete" onclick="deleteVoucher('${v.code}')"><i class="fa-light fa-trash"></i></button>
                </td>
            </tr>`;
        });
        return html;
    };

    const target = document.getElementById("show-vouchers");
    if (target) target.innerHTML = generateHtml(systemVouchers);
}

function openVoucherModal() {
    document.querySelector(".modal.voucher").classList.add("open");
}

function closeVoucherModal() {
    document.querySelector(".modal.voucher").classList.remove("open");
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
        const response = await window.api.createVoucher({
            code,
            discountValue: parseInt(value),
            discountType: parseInt(type),
            minOrder: parseInt(min) || 0,
            maxDiscount: parseInt(max) || 0,
            expiryDate: expiry
        });

        if (response.success) {
            toast({ title: 'Thành công', message: 'Đã tạo mã giảm giá mới!', type: 'success', duration: 3000 });
            closeVoucherModal();
            await initAdmin();
        } else {
            toast({ title: 'Lỗi', message: response.message || 'Không thể tạo mã!', type: 'error', duration: 3000 });
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
// --- REVIEW MANAGEMENT FUNCTIONS ---
