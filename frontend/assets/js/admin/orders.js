async function changeStatus(id, newStatus) {
    try {
        await window.api.updateOrderStatus(id, newStatus);
        let msg = newStatus == 1 ? 'Đã duyệt đơn hàng!' : 'Đã xác nhận thanh toán!';
        toast({ title: 'Thành công', message: msg, type: 'success', duration: 2000 });

        // Refresh orders and UI
        const orders = await window.api.getOrders();
        showOrder(orders);
        await thongKe();

        // Re-render detail modal to update button
        await detailOrder(id);
    } catch (error) {
        toast({ title: 'Lỗi', message: 'Không thể cập nhật trạng thái!', type: 'error', duration: 2000 });
    }
}

async function processOrderAdmin(id) {
    if (confirm("Bạn có muốn duyệt đơn hàng này không?")) {
        try {
            await window.api.updateOrderStatus(id, 1);
            toast({ title: 'Thành công', message: 'Đã duyệt đơn hàng!', type: 'success', duration: 2000 });
            // Refresh orders
            const orders = await window.api.getOrders();
            showOrder(orders);
            // Refresh statistics
            await thongKe();
        } catch (error) {
            console.error("Failed to process order:", error);
            toast({ title: 'Lỗi', message: 'Không thể duyệt đơn hàng!', type: 'error', duration: 2000 });
        }
    }
}

// Xóa đơn hàng
async function deleteOrderAdmin(id) {
    console.log("Requesting deletion for order ID:", id);
    if (!id) {
        toast({ title: 'Lỗi', message: 'Mã đơn hàng không hợp lệ!', type: 'error', duration: 2000 });
        return;
    }
    if (confirm("Bạn có chắc chắn muốn xóa đơn hàng này?")) {
        try {
            const result = await window.api.deleteOrder(id);
            console.log("Delete result:", result);
            toast({ title: 'Thành công', message: 'Đã xóa đơn hàng!', type: 'success', duration: 2000 });
            // Refresh orders
            const orders = await window.api.getOrders();
            showOrder(orders);
            // Refresh statistics
            await thongKe();
        } catch (error) {
            console.error("Failed to delete order:", error);
            toast({ title: 'Lỗi', message: 'Không thể xóa đơn hàng! Kiểm tra console để biết chi tiết.', type: 'error', duration: 3000 });
        }
    }
}

// Format Date
function formatDate(date) {
    if (!date) return "Chưa rõ";
    let fm = new Date(date.toString());
    if (isNaN(fm.getTime())) return "Chưa rõ";
    let yyyy = fm.getFullYear();
    let mm = fm.getMonth() + 1;
    let dd = fm.getDate();
    if (dd < 10) dd = "0" + dd;
    if (mm < 10) mm = "0" + mm;
    return dd + "/" + mm + "/" + yyyy;
}


// Show order
function showOrder(arr) {
    let orderHtml = "";
    if (!Array.isArray(arr) || arr.length == 0) {
        orderHtml = `<td colspan="6">Không có dữ liệu</td>`
    } else {
        arr.forEach((item) => {
            let status = "";
            if (item.trangthai == 0) status = `<span class="status-no-complete">Chưa xử lý</span>`;
            else if (item.trangthai == 1) status = `<span class="status-processing">Đã xử lý</span>`;
            else if (item.trangthai == 2) status = `<span class="status-complete">Đã thanh toán</span>`;
            else if (item.trangthai == 3) status = `<span class="status-cancelled" style="background: #f5f5f5; color: #999; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">Đã hủy</span>`;
            let date = formatDate(item.thoigiandat);
            orderHtml += `
            <tr>
            <td>${item.id}</td>
            <td>${item.khachhang}</td>
            <td>${date}</td>
            <td>${vnd(item.tongtien)}</td>                               
            <td>${status}</td>
            <td class="control">
            <button class="btn-detail" id="" onclick="detailOrder('${item.id}')"><i class="fa-regular fa-eye"></i> Chi tiết</button>
            <button class="btn-delete" onclick="deleteOrderAdmin('${item.id}')"><i class="fa-regular fa-trash"></i></button>
            </td>
            </tr>      
            `;
        });
    }
    document.getElementById("showOrder").innerHTML = orderHtml;
}

let orders = localStorage.getItem("order") ? JSON.parse(localStorage.getItem("order")) : [];
// window.onload = showOrder(orders); // Removed conflicting assignment

// Get Order Details
async function getOrderDetails(madon) {
    try {
        return await window.api.getOrderDetails(madon);
    } catch (error) {
        console.error("Error fetching order details:", error);
        return [];
    }
}

// Show Order Detail
async function detailOrder(id) {
    document.querySelector(".modal.detail-order").classList.add("open");
    try {
        const orders = await window.api.getOrders();
        const products = await window.api.getProducts();
        // Lấy hóa đơn 
        let order = orders.find((item) => item.id == id);
        // Lấy chi tiết hóa đơn
        let ctDon = await getOrderDetails(id);

        let spHtml = `<div class="modal-detail-left"><div class="order-item-group">`;

        ctDon.forEach((item) => {
            let detaiSP = products.find(product => product.id == item.id);
            spHtml += `<div class="order-product">
                <div class="order-product-left">
                    <img src="${detaiSP ? detaiSP.img : './assets/img/blank-image.png'}" alt="" loading="lazy">
                    <div class="order-product-info">
                        <h4>${detaiSP ? detaiSP.title : 'Sản phẩm đã bị xóa'}</h4>
                        <p class="order-product-note"><i class="fa-light fa-pen"></i> ${item.note ? item.note : "Không có ghi chú"}</p>
                        <p class="order-product-quantity">SL: ${item.soluong}<p>
                    </div>
                </div>
                <div class="order-product-right">
                    <div class="order-product-price">
                        <span class="order-product-current-price">${vnd(item.price)}</span>
                    </div>                         
                </div>
            </div>`;
        });
        spHtml += `</div></div>`;
        spHtml += `<div class="modal-detail-right">
            <ul class="detail-order-group">
                <li class="detail-order-item">
                    <span class="detail-order-item-left"><i class="fa-light fa-calendar-days"></i> Ngày đặt hàng</span>
                    <span class="detail-order-item-right">${formatDate(order.thoigiandat)}</span>
                </li>
                <li class="detail-order-item">
                    <span class="detail-order-item-left"><i class="fa-light fa-truck"></i> Hình thức giao</span>
                    <span class="detail-order-item-right">${order.hinhthucgiao}</span>
                </li>
                <li class="detail-order-item">
                <span class="detail-order-item-left"><i class="fa-thin fa-person"></i> Người nhận</span>
                <span class="detail-order-item-right">${order.tenguoinhan}</span>
                </li>
                <li class="detail-order-item">
                <span class="detail-order-item-left"><i class="fa-light fa-phone"></i> Số điện thoại</span>
                <span class="detail-order-item-right">${order.sdtnhan}</span>
                </li>
                <li class="detail-order-item tb">
                    <span class="detail-order-item-left"><i class="fa-light fa-clock"></i> Thời gian giao</span>
                    <p class="detail-order-item-b">${(order.thoigiangiao == "" ? "" : (order.thoigiangiao + " - ")) + (order.ngaygiaohang ? formatDate(order.ngaygiaohang) : "Giao ngay")}</p>
                </li>
                <li class="detail-order-item tb">
                    <span class="detail-order-item-t"><i class="fa-light fa-location-dot"></i> Địa chỉ nhận</span>
                    <p class="detail-order-item-b">${order.diachinhan}</p>
                </li>
                <li class="detail-order-item tb">
                    <span class="detail-order-item-t"><i class="fa-light fa-note-sticky"></i> Ghi chú</span>
                    <p class="detail-order-item-b">${order.ghichu ? order.ghichu : "Không có ghi chú"}</p>
                </li>
            </ul>
        </div>`;
        document.querySelector(".modal-detail-order").innerHTML = spHtml;

        let classDetailBtn = "";
        let textDetailBtn = "";
        let onclickBtn = "";

        if (order.trangthai == 0) {
            classDetailBtn = "btn-chuaxuly";
            textDetailBtn = "Duyệt đơn";
            onclickBtn = `onclick="changeStatus('${order.id}', 1)"`;
        } else if (order.trangthai == 1) {
            classDetailBtn = "btn-processing";
            textDetailBtn = "Xác nhận thanh toán";
            onclickBtn = `onclick="changeStatus('${order.id}', 2)"`;
        } else if (order.trangthai == 2) {
            classDetailBtn = "btn-daxuly";
            textDetailBtn = "Đã thanh toán";
            onclickBtn = ""; // Disabled
        } else if (order.trangthai == 3) {
            classDetailBtn = "btn-cancelled";
            textDetailBtn = "Đã hủy";
            onclickBtn = ""; // Disabled
        }

        document.querySelector(
            ".modal-detail-bottom"
        ).innerHTML = `<div class="modal-detail-bottom-left">
            <div class="price-total">
                <span class="thanhtien">Thành tiền</span>
                <span class="price">${vnd(order.tongtien)}</span>
            </div>
        </div>
        <div class="modal-detail-bottom-right">
            <button class="modal-detail-btn btn-print" onclick="printOrderAdmin('${order.id}')">In hóa đơn</button>
            <button class="modal-detail-btn ${classDetailBtn}" ${onclickBtn}>${textDetailBtn}</button>
        </div>`;
    } catch (error) {
        console.error("Error showing order detail:", error);
    }
}

async function printOrderAdmin(id) {
    try {
        const orders = await window.api.getOrders();
        const products = await window.api.getProducts();
        let order = orders.find((item) => item.id == id);
        let ctDon = await window.api.getOrderDetails(id);

        if (!order) return;

        let itemsHtml = "";
        ctDon.forEach((item, index) => {
            let detaiSP = products.find(p => p.id == item.id);
            itemsHtml += `
                <tr>
                    <td style="padding: 12px 5px; color: #666;">${index + 1}</td>
                    <td style="padding: 12px 5px;">
                        <div style="font-weight: 600; color: #333;">${detaiSP ? detaiSP.title : 'Sản phẩm đã xóa'}</div>
                        <div style="font-size: 11px; color: #888;">${item.note ? 'Ghi chú: ' + item.note : ''}</div>
                    </td>
                    <td style="padding: 12px 5px; text-align: center;">${item.soluong}</td>
                    <td style="padding: 12px 5px; text-align: right;">${vnd(item.price)}</td>
                    <td style="padding: 12px 5px; text-align: right; font-weight: 600;">${vnd(item.price * item.soluong)}</td>
                </tr>
            `;
        });

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Hóa đơn TiMi Food - ${order.id}</title>
                    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
                    <style>
                        * { box-sizing: border-box; -webkit-print-color-adjust: exact; }
                        body { font-family: 'Inter', sans-serif; line-height: 1.6; color: #1a1a1a; padding: 40px; background: #fff; margin: 0; }
                        .bill-container { max-width: 800px; margin: 0 auto; position: relative; }
                        
                        /* Header */
                        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 50px; border-bottom: 4px solid #f0f0f0; padding-bottom: 20px; }
                        .brand h1 { margin: 0; font-size: 32px; font-weight: 800; color: #b5292f; letter-spacing: -1px; }
                        .brand p { margin: 5px 0 0; font-size: 13px; color: #666; font-weight: 500; }
                        .order-meta { text-align: right; }
                        .order-meta h2 { margin: 0; font-size: 20px; color: #333; }
                        .order-meta p { margin: 2px 0; font-size: 13px; color: #888; }

                        /* Info Sections */
                        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
                        .info-box h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #999; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
                        .info-box p { margin: 4px 0; font-size: 14px; }
                        .info-box strong { color: #333; }

                        /* Table */
                        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                        table th { background: #f9f9f9; padding: 12px 5px; text-align: left; font-size: 12px; text-transform: uppercase; color: #666; border-bottom: 2px solid #eee; }
                        table tr { border-bottom: 1px solid #f0f0f0; }
                        
                        /* Totals */
                        .totals { margin-left: auto; width: 300px; }
                        .total-item { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
                        .total-item.grand-total { border-top: 2px solid #333; margin-top: 10px; padding-top: 15px; font-size: 20px; font-weight: 800; color: #b5292f; }

                        /* Stamp */
                        .stamp { position: absolute; top: 150px; right: 50px; transform: rotate(-15deg); border: 4px double #27ae60; color: #27ae60; font-size: 24px; font-weight: 800; padding: 10px 20px; border-radius: 10px; opacity: 0.3; text-transform: uppercase; pointer-events: none; }
                        ${order.trangthai != 2 ? '.stamp { display: none; }' : ''}

                        /* Footer */
                        .footer { margin-top: 60px; text-align: center; border-top: 1px dashed #eee; padding-top: 30px; }
                        .footer p { margin: 5px 0; font-size: 13px; color: #888; }
                        .footer .thanks { font-size: 16px; font-weight: 600; color: #333; margin-bottom: 10px; }

                        @media print {
                            body { padding: 0; }
                            .bill-container { max-width: 100%; }
                        }
                    </style>
                </head>
                <body>
                    <div class="bill-container">
                        <div class="stamp">ĐÃ THANH TOÁN</div>
                        
                        <div class="header">
                            <div class="brand">
                                <h1>TIMI FOOD</h1>
                                <p>Tinh hoa ẩm thực Việt - Phục vụ tận tâm</p>
                            </div>
                            <div class="order-meta">
                                <h2>HÓA ĐƠN BÁN HÀNG</h2>
                                <p>Mã đơn: <strong>${order.id}</strong></p>
                                <p>Ngày: ${formatDate(order.thoigiandat)}</p>
                            </div>
                        </div>

                        <div class="info-grid">
                            <div class="info-box">
                                <h3>ĐƠN VỊ CUNG CẤP</h3>
                                <p><strong>TiMi Food Chi Nhánh Hải Phòng</strong></p>
                                <p>Địa chỉ: 165 Trần Quốc Chẩn, Chu Văn An, Hải Phòng</p>
                                <p>Hotline: 0345.975.990</p>
                                <p>Website: timifood.com.vn</p>
                            </div>
                            <div class="info-box">
                                <h3>THÔNG TIN KHÁCH HÀNG</h3>
                                <p><strong>Khách hàng:</strong> ${order.tenguoinhan}</p>
                                <p><strong>Điện thoại:</strong> ${order.sdtnhan}</p>
                                <p><strong>Địa chỉ:</strong> ${order.diachinhan}</p>
                                <p><strong>Hình thức:</strong> ${order.hinhthucgiao}</p>
                            </div>
                        </div>

                        <table>
                            <thead>
                                <tr>
                                    <th style="width: 40px;">STT</th>
                                    <th>CHI TIẾT MÓN ĂN</th>
                                    <th style="width: 60px; text-align: center;">SL</th>
                                    <th style="width: 120px; text-align: right;">ĐƠN GIÁ</th>
                                    <th style="width: 140px; text-align: right;">THÀNH TIỀN</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${itemsHtml}
                            </tbody>
                        </table>

                        <div class="totals">
                            <div class="total-item">
                                <span>Tiền hàng:</span>
                                <span>${vnd(order.tongtien - (order.hinhthucgiao == "Tự đến lấy" ? 0 : 30000))}</span>
                            </div>
                            <div class="total-item">
                                <span>Phí vận chuyển:</span>
                                <span>${order.hinhthucgiao == "Tự đến lấy" ? "0đ" : vnd(30000)}</span>
                            </div>
                            <div class="total-item grand-total">
                                <span>TỔNG CỘNG:</span>
                                <span>${vnd(order.tongtien)}</span>
                            </div>
                        </div>

                        <div class="footer">
                            <p class="thanks">Cảm ơn quý khách đã tin tưởng và ủng hộ!</p>
                            <p>Vui lòng giữ lại hóa đơn để đối soát khi cần thiết.</p>
                            <p style="margin-top: 15px; font-weight: 600;">TiMi Food - Ăn ngon, sống khỏe!</p>
                        </div>
                    </div>
                    <script>
                        window.onload = function() { 
                            setTimeout(() => {
                                window.print(); 
                                window.close(); 
                            }, 500);
                        }
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    } catch (error) {
        console.error("Print error:", error);
        toast({ title: 'Lỗi', message: 'Không thể khởi tạo bản in!', type: 'error', duration: 3000 });
    }
}

// Find Order
async function findOrder() {
    let tinhTrang = parseInt(document.getElementById("tinh-trang").value);
    let ct = document.getElementById("form-search-order").value;
    let timeStart = document.getElementById("time-start").value;
    let timeEnd = document.getElementById("time-end").value;

    if (timeEnd < timeStart && timeEnd != "" && timeStart != "") {
        alert("Lựa chọn thời gian sai !");
        return;
    }
    try {
        const orders = await window.api.getOrders();
        let result = tinhTrang == 3 ? orders : orders.filter((item) => {
            return item.trangthai == tinhTrang;
        });
        result = ct == "" ? result : result.filter((item) => {
            return (item.khachhang.toLowerCase().includes(ct.toLowerCase()) || item.id.toString().toLowerCase().includes(ct.toLowerCase()));
        });

        if (timeStart != "" && timeEnd == "") {
            result = result.filter((item) => {
                return new Date(item.thoigiandat) >= new Date(timeStart).setHours(0, 0, 0);
            });
        } else if (timeStart == "" && timeEnd != "") {
            result = result.filter((item) => {
                return new Date(item.thoigiandat) <= new Date(timeEnd).setHours(23, 59, 59);
            });
        } else if (timeStart != "" && timeEnd != "") {
            result = result.filter((item) => {
                return (new Date(item.thoigiandat) >= new Date(timeStart).setHours(0, 0, 0) && new Date(item.thoigiandat) <= new Date(timeEnd).setHours(23, 59, 59)
                );
            });
        }
        showOrder(result);
    } catch (error) {
        console.error("Error searching orders:", error);
    }
}

async function cancelSearchOrder() {
    document.getElementById("tinh-trang").value = 3;
    document.getElementById("form-search-order").value = "";
    document.getElementById("time-start").value = "";
    document.getElementById("time-end").value = "";
    await initAdmin();
}

// Statistics reset logic