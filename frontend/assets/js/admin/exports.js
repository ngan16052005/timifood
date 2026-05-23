async function exportOrdersToExcel() {
    showLoader();
    try {
        const orders = await window.api.getOrders();
        if (!orders || orders.length === 0) {
            toast({ title: 'Cảnh báo', message: 'Không có dữ liệu đơn hàng để xuất!', type: 'warning', duration: 3000 });
            return;
        }

        const data = orders.map(o => ({
            "Mã đơn": o.id,
            "Khách hàng": o.khachhang,
            "Ngày đặt": formatDate(o.thoigiandat),
            "Tổng tiền (VNĐ)": o.tongtien,
            "Trạng thái": o.trangthai == 0 ? "Chưa xử lý" : (o.trangthai == 1 ? "Đã xử lý" : "Đã thanh toán"),
            "Hình thức giao": o.hinhthucgiao,
            "Người nhận": o.tenguoinhan,
            "Số điện thoại": o.sdtnhan,
            "Địa chỉ nhận": o.diachinhan
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Danh sách đơn hàng");

        // Auto-size columns
        const maxWidths = Object.keys(data[0]).map(key =>
            Math.max(...data.map(obj => obj[key] ? obj[key].toString().length : 0), key.length)
        );
        worksheet["!cols"] = maxWidths.map(w => ({ w: w + 2 }));

        XLSX.writeFile(workbook, `TiMiFood_DonHang_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.xlsx`);
        toast({ title: 'Thành công', message: 'Đã xuất file Excel đơn hàng!', type: 'success', duration: 3000 });
    } catch (error) {
        console.error("Export error:", error);
        toast({ title: 'Lỗi', message: 'Không thể xuất file Excel!', type: 'error', duration: 3000 });
    } finally {
        hideLoader();
    }
}

async function exportStatisticsToExcel() {
    showLoader();
    try {
        // We reuse the logic from thongKe to get current filtered data
        const [orders, products] = await Promise.all([
            window.api.getOrders(),
            window.api.getProducts()
        ]);

        const allDetailsResults = await Promise.all(
            orders.map(order => window.api.getOrderDetails(order.id))
        );

        let arrDetail = [];
        orders.forEach((order, index) => {
            if (order.trangthai != 2) return;
            const details = allDetailsResults[index];
            if (Array.isArray(details)) {
                details.forEach(item => {
                    let prod = products.find(p => p.id == item.id);
                    arrDetail.push({
                        id: item.id,
                        title: prod ? prod.title : 'Sản phẩm đã xóa',
                        category: prod ? prod.category : 'Khác',
                        quantity: item.soluong,
                        doanhthu: item.price * item.soluong
                    });
                });
            }
        });

        // Merge products
        let mergeObj = [];
        arrDetail.forEach(item => {
            let vitri = mergeObj.findIndex(res => res.id == item.id);
            if (vitri == -1) {
                mergeObj.push(item);
            } else {
                mergeObj[vitri].quantity += item.quantity;
                mergeObj[vitri].doanhthu += item.doanhthu;
            }
        });

        if (mergeObj.length === 0) {
            toast({ title: 'Cảnh báo', message: 'Không có dữ liệu thống kê để xuất!', type: 'warning', duration: 3000 });
            return;
        }

        const data = mergeObj.map((item, index) => ({
            "STT": index + 1,
            "Tên sản phẩm": item.title,
            "Loại": item.category,
            "Số lượng bán": item.quantity,
            "Doanh thu (VNĐ)": item.doanhthu
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Báo cáo doanh thu");

        XLSX.writeFile(workbook, `TiMiFood_BaoCaoDoanhThu_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.xlsx`);
        toast({ title: 'Thành công', message: 'Đã xuất báo cáo thành công!', type: 'success', duration: 3000 });
    } catch (error) {
        console.error("Export stats error:", error);
        toast({ title: 'Lỗi', message: 'Không thể xuất báo cáo!', type: 'error', duration: 3000 });
    } finally {
        hideLoader();
    }
}

async function exportStatisticsToPDF() {
    showLoader();
    try {
        const currentCategory = document.getElementById("the-loai-tk").value || "Tất cả";
        const timeStart = document.getElementById("time-start-tk").value;
        const timeEnd = document.getElementById("time-end-tk").value;

        let filterRange = "Tất cả thời gian";
        if (timeStart && timeEnd) {
            filterRange = `Từ ${formatDate(timeStart)} Đến ${formatDate(timeEnd)}`;
        } else if (timeStart) {
            filterRange = `Từ ${formatDate(timeStart)}`;
        } else if (timeEnd) {
            filterRange = `Đến ${formatDate(timeEnd)}`;
        }

        const tableBody = document.getElementById("showTk");
        if (!tableBody || tableBody.children.length === 0) {
            toast({ title: 'Cảnh báo', message: 'Không có dữ liệu thống kê nào để xuất PDF!', type: 'warning', duration: 3000 });
            return;
        }

        const qtyProductVal = document.getElementById("quantity-product").innerText;
        const qtyOrderVal = document.getElementById("quantity-order").innerText;
        const qtySaleVal = document.getElementById("quantity-sale").innerText;

        let chart1Img = "";
        let chart2Img = "";
        let chart3Img = "";

        if (myChart) chart1Img = myChart.toBase64Image();
        if (categoryChart) chart2Img = categoryChart.toBase64Image();
        if (trendChart) chart3Img = trendChart.toBase64Image();

        let tableRowsHtml = "";
        const rows = tableBody.querySelectorAll("tr");
        rows.forEach(row => {
            const cells = row.querySelectorAll("td");
            if (cells.length >= 4) {
                const stt = cells[0].innerText;
                const pTag = cells[1].querySelector("p");
                const title = pTag ? pTag.innerText : cells[1].innerText;
                const quantity = cells[2].innerText;
                const revenue = cells[3].innerText;

                tableRowsHtml += `
                <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: center;">${stt}</td>
                    <td style="padding: 8px 10px; border: 1px solid #e2e8f0; font-weight: 500;">${title}</td>
                    <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: center;">${quantity}</td>
                    <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: right; font-weight: 600; color: #10b981;">${revenue}</td>
                </tr>
                `;
            }
        });

        const tempContainer = document.createElement("div");
        tempContainer.style.position = "absolute";
        tempContainer.style.left = "-9999px";
        tempContainer.style.top = "-9999px";

        const currentDate = new Date().toLocaleString('vi-VN');

        tempContainer.innerHTML = `
        <div id="pdf-report-document" style="padding: 40px; font-family: Arial, sans-serif; color: #1e293b; background: #fff; width: 750px; box-sizing: border-box;">
            <!-- Brand Header -->
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #6366f1; padding-bottom: 15px; margin-bottom: 25px;">
                <div>
                    <h1 style="margin: 0; font-size: 28px; color: #4f46e5; font-weight: 800;">TiMi Food</h1>
                    <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b; letter-spacing: 0.5px;">Hệ thống quản lý ẩm thực thông minh</p>
                </div>
                <div style="text-align: right;">
                    <h2 style="margin: 0; font-size: 18px; color: #1e293b; font-weight: 700; text-transform: uppercase;">Báo cáo doanh thu & hiệu suất</h2>
                    <p style="margin: 5px 0 0 0; font-size: 11px; color: #64748b;">Thời điểm xuất: ${currentDate}</p>
                </div>
            </div>

            <!-- Filters -->
            <div style="background: #f8fafc; border-radius: 8px; padding: 12px 18px; margin-bottom: 25px; border-left: 5px solid #6366f1; font-size: 12px; line-height: 1.6;">
                <table style="width: 100%; border: none;">
                    <tr>
                        <td style="width: 50%; padding: 2px 0;"><strong>Người xuất báo cáo:</strong> Ban Quản trị TiMi Food</td>
                        <td style="width: 50%; padding: 2px 0;"><strong>Thời gian lọc:</strong> ${filterRange}</td>
                    </tr>
                    <tr>
                        <td style="padding: 2px 0;"><strong>Danh mục lọc:</strong> ${currentCategory}</td>
                        <td style="padding: 2px 0;"><strong>Trạng thái đơn hàng:</strong> Đã thanh toán (Hoàn tất)</td>
                    </tr>
                </table>
            </div>

            <!-- Summary metrics -->
            <div style="display: flex; justify-content: space-between; gap: 15px; margin-bottom: 30px;">
                <div style="flex: 1; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 12px; text-align: center;">
                    <p style="margin: 0 0 6px 0; font-size: 11px; color: #1e3a8a; font-weight: 600; text-transform: uppercase;">Mặt hàng có doanh thu</p>
                    <h3 style="margin: 0; font-size: 20px; color: #1d4ed8; font-weight: 800;">${qtyProductVal}</h3>
                </div>
                <div style="flex: 1; background: #fdf2f8; border: 1px solid #fbcfe8; border-radius: 8px; padding: 12px; text-align: center;">
                    <p style="margin: 0 0 6px 0; font-size: 11px; color: #831843; font-weight: 600; text-transform: uppercase;">Số lượng bán ra</p>
                    <h3 style="margin: 0; font-size: 20px; color: #be185d; font-weight: 800;">${qtyOrderVal}</h3>
                </div>
                <div style="flex: 1; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 12px; text-align: center;">
                    <p style="margin: 0 0 6px 0; font-size: 11px; color: #064e3b; font-weight: 600; text-transform: uppercase;">Tổng doanh thu thu về</p>
                    <h3 style="margin: 0; font-size: 20px; color: #047857; font-weight: 800;">${qtySaleVal}</h3>
                </div>
            </div>

            <!-- Charts Row 1 -->
            <div style="margin-bottom: 25px;">
                <h3 style="font-size: 14px; font-weight: 700; margin: 0 0 12px 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; color: #1e293b; text-transform: uppercase;">I. Hiệu suất top sản phẩm & Cơ cấu doanh thu</h3>
                <div style="display: flex; gap: 15px;">
                    <div style="flex: 1.5; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; text-align: center; background: #fff;">
                        <p style="margin: 0 0 8px 0; font-size: 10px; color: #64748b; font-weight: 600;">Top 10 Sản phẩm bán chạy nhất</p>
                        ${chart1Img ? `<img src="${chart1Img}" style="width: 100%; height: auto; max-height: 200px;" />` : `<div style="padding: 40px 0; color: #94a3b8; font-size: 11px;">Không có biểu đồ</div>`}
                    </div>
                    <div style="flex: 1; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; text-align: center; background: #fff;">
                        <p style="margin: 0 0 8px 0; font-size: 10px; color: #64748b; font-weight: 600;">Cơ cấu doanh thu theo Danh mục</p>
                        ${chart2Img ? `<img src="${chart2Img}" style="width: 100%; height: auto; max-height: 200px;" />` : `<div style="padding: 40px 0; color: #94a3b8; font-size: 11px;">Không có biểu đồ</div>`}
                    </div>
                </div>
            </div>

            <!-- Page Break -->
            <div style="page-break-before: always; height: 10px;"></div>

            <!-- Charts Row 2 - Revenue Trend -->
            <div style="margin-bottom: 25px;">
                <h3 style="font-size: 14px; font-weight: 700; margin: 0 0 12px 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; color: #1e293b; text-transform: uppercase;">II. Xu hướng doanh thu theo thời gian</h3>
                <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; text-align: center; background: #fff;">
                    <p style="margin: 0 0 8px 0; font-size: 10px; color: #64748b; font-weight: 600;">Biểu đồ xu hướng doanh thu 12 tháng</p>
                    ${chart3Img ? `<img src="${chart3Img}" style="width: 100%; height: auto; max-height: 160px;" />` : `<div style="padding: 40px 0; color: #94a3b8; font-size: 11px;">Không có biểu đồ</div>`}
                </div>
            </div>

            <!-- Detailed Table -->
            <div style="margin-bottom: 30px;">
                <h3 style="font-size: 14px; font-weight: 700; margin: 0 0 12px 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; color: #1e293b; text-transform: uppercase;">III. Bảng chi tiết doanh thu món ăn</h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
                    <thead>
                        <tr style="background: #6366f1; color: #fff; text-align: left;">
                            <th style="padding: 6px 8px; border: 1px solid #e2e8f0; text-align: center; width: 80px;">STT</th>
                            <th style="padding: 6px 8px; border: 1px solid #e2e8f0;">Tên món ăn</th>
                            <th style="padding: 6px 8px; border: 1px solid #e2e8f0; text-align: center; width: 120px;">Số lượng bán</th>
                            <th style="padding: 6px 8px; border: 1px solid #e2e8f0; text-align: right; width: 150px;">Doanh thu thu về</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRowsHtml}
                    </tbody>
                </table>
            </div>

            <!-- Footers and Signatures -->
            <div style="display: flex; justify-content: space-between; margin-top: 40px; font-size: 12px;">
                <div style="text-align: center; width: 220px;">
                    <p style="margin: 0; font-weight: 600;">Người lập báo cáo</p>
                    <p style="margin: 4px 0 35px 0; font-style: italic; color: #64748b; font-size: 10px;">(Ký và ghi rõ họ tên)</p>
                    <p style="margin: 0; font-weight: 700;">Ban Quản trị TiMi Food</p>
                </div>
                <div style="text-align: center; width: 220px;">
                    <p style="margin: 0; font-weight: 600;">Xác nhận Ban Giám đốc</p>
                    <p style="margin: 4px 0 35px 0; font-style: italic; color: #64748b; font-size: 10px;">(Ký tên và đóng dấu)</p>
                    <p style="margin: 0; font-weight: 700;">TiMi Food Co., Ltd</p>
                </div>
            </div>
        </div>
        `;

        document.body.appendChild(tempContainer);

        const opt = {
            margin: [10, 10, 10, 10],
            filename: `TiMiFood_BaoCaoDoanhThu_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, letterRendering: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        const element = document.getElementById("pdf-report-document");
        await html2pdf().set(opt).from(element).save();

        document.body.removeChild(tempContainer);
        toast({ title: 'Thành công', message: 'Đã xuất báo cáo PDF doanh thu thành công!', type: 'success', duration: 3000 });
    } catch (error) {
        console.error("PDF export error:", error);
        toast({ title: 'Lỗi', message: 'Không thể xuất báo cáo PDF!', type: 'error', duration: 3000 });
    } finally {
        hideLoader();
    }
}
