async function thongKe(mode) {
    let categoryTk = document.getElementById("the-loai-tk").value;
    let ct = document.getElementById("form-search-tk").value;
    let timeStart = document.getElementById("time-start-tk").value;
    let timeEnd = document.getElementById("time-end-tk").value;
    if (timeEnd < timeStart && timeEnd != "" && timeStart != "") {
        alert("Lựa chọn thời gian sai !");
        return;
    }

    try {
        const [orders, products] = await Promise.all([
            window.api.getOrders(),
            window.api.getProducts()
        ]);

        if (!Array.isArray(orders) || !Array.isArray(products)) return;

        // Fetch all order details in parallel for better performance
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
                        ...item,
                        madon: order.id,
                        category: prod ? prod.category : 'Khác',
                        title: prod ? prod.title : 'Sản phẩm đã xóa',
                        img: prod ? prod.img : '',
                        time: order.thoigiandat,
                        quantity: item.soluong // Ensure quantity field exists
                    });
                });
            }
        });

        let result = categoryTk == "Tất cả" ? arrDetail : arrDetail.filter((item) => {
            return item.category == categoryTk;
        });

        result = ct == "" ? result : result.filter((item) => {
            return (item.title.toLowerCase().includes(ct.toLowerCase()));
        });

        if (timeStart != "" && timeEnd == "") {
            result = result.filter((item) => {
                return new Date(item.time) > new Date(timeStart).setHours(0, 0, 0);
            });
        } else if (timeStart == "" && timeEnd != "") {
            result = result.filter((item) => {
                return new Date(item.time) < new Date(timeEnd).setHours(23, 59, 59);
            });
        } else if (timeStart != "" && timeEnd != "") {
            result = result.filter((item) => {
                return (new Date(item.time) > new Date(timeStart).setHours(0, 0, 0) && new Date(item.time) < new Date(timeEnd).setHours(23, 59, 59)
                );
            });
        }
        await showThongKe(result, mode, timeStart, timeEnd);
    } catch (error) {
        console.error("Error generating statistics:", error);
    }
}

// Show số lượng sp, số lượng đơn bán, doanh thu
function showOverview(arr) {
    document.getElementById("quantity-product").innerText = arr.length;
    document.getElementById("quantity-order").innerText = arr.reduce((sum, cur) => (sum + parseInt(cur.quantity)), 0);
    document.getElementById("quantity-sale").innerText = vnd(arr.reduce((sum, cur) => (sum + parseInt(cur.doanhthu)), 0));
}

async function showThongKe(arr, mode, timeStart, timeEnd) {
    let orderHtml = "";
    let mergeObj = mergeObjThongKe(arr);
    showOverview(mergeObj);
    // Use background fetch for advanced charts to avoid blocking the table render
    initAdvancedCharts(timeStart, timeEnd);

    if (mode === 0) {
        document.getElementById("the-loai-tk").value = "Tất cả";
        document.getElementById("form-search-tk").value = "";
        document.getElementById("time-start-tk").value = "";
        document.getElementById("time-end-tk").value = "";
    }

    switch (mode) {
        case 1:
            mergeObj.sort((a, b) => parseInt(a.quantity) - parseInt(b.quantity))
            break;
        case 2:
            mergeObj.sort((a, b) => parseInt(b.quantity) - parseInt(a.quantity))
            break;
    }
    for (let i = 0; i < mergeObj.length; i++) {
        orderHtml += `
        <tr>
        <td>${i + 1}</td>
        <td><div class="prod-img-title"><img class="prd-img-tbl" src="${mergeObj[i].img}" alt="" loading="lazy"><p>${mergeObj[i].title}</p></div></td>
        <td>${mergeObj[i].quantity}</td>
        <td>${vnd(mergeObj[i].doanhthu)}</td>
        <td><button class="btn-detail product-order-detail" data-id="${mergeObj[i].id}"><i class="fa-regular fa-eye"></i> Chi tiết</button></td>
        </tr>      
        `;
    }
    document.getElementById("showTk").innerHTML = orderHtml;
    document.querySelectorAll(".product-order-detail").forEach(item => {
        let idProduct = item.getAttribute("data-id");
        item.addEventListener("click", () => {
            detailOrderProduct(arr, idProduct);
        })
    })
}

async function initAdvancedCharts(timeStart, timeEnd) {
    try {
        console.log("Fetching advanced stats report with dates:", timeStart, timeEnd);
        const report = await window.api.getStatsReport(timeStart, timeEnd);
        console.log("Stats Report received:", report);
        if (report) {
            updateStatisticsChart(report.topProducts);
            updateCategoryChart(report.categoryStats);
            updateTrendChart(report.monthlyRevenue);
        }
    } catch (error) {
        console.error("Error fetching advanced stats:", error);
    }
}

let myChart, categoryChart, trendChart;
function updateStatisticsChart(topProducts) {
    const canvas = document.getElementById('statisticsChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const labels = topProducts.map(item => item.title.length > 15 ? item.title.substring(0, 15) + "..." : item.title);
    const revenueData = topProducts.map(item => item.totalRevenue);
    const quantityData = topProducts.map(item => item.totalQuantity);

    if (myChart) myChart.destroy();
    if (labels.length === 0) return;

    myChart = new Chart(ctx, {
        type: 'line', // Set main type to line to emphasize curves
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Doanh thu (VNĐ)',
                    data: revenueData,
                    borderColor: '#6366f1',
                    backgroundColor: (context) => {
                        const chart = context.chart;
                        const { ctx, chartArea } = chart;
                        if (!chartArea) return null;
                        const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
                        gradient.addColorStop(0, 'rgba(99, 102, 241, 0)');
                        gradient.addColorStop(1, 'rgba(99, 102, 241, 0.3)');
                        return gradient;
                    },
                    borderWidth: 4,
                    fill: true,
                    tension: 0.6,
                    cubicInterpolationMode: 'monotone',
                    pointBackgroundColor: '#fff',
                    pointBorderColor: '#6366f1',
                    pointBorderWidth: 3,
                    pointRadius: 5,
                    yAxisID: 'y',
                    order: 1
                },
                {
                    label: 'Số lượng bán',
                    data: quantityData,
                    type: 'bar', // Set quantity to bar
                    backgroundColor: 'rgba(236, 72, 153, 0.6)',
                    borderColor: '#ec4899',
                    borderWidth: 1,
                    borderRadius: 15,
                    barThickness: 30,
                    yAxisID: 'y1',
                    order: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 25,
                        font: { size: 13, weight: '500' }
                    }
                },
                title: {
                    display: false
                },
                tooltip: {
                    backgroundColor: '#1e293b',
                    padding: 15,
                    borderRadius: 12,
                    usePointStyle: true,
                    callbacks: {
                        label: (context) => context.datasetIndex === 0 ?
                            ` Doanh thu: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(context.raw)}` :
                            ` Số lượng: ${context.raw} món`
                    }
                }
            },
            scales: {
                y: {
                    type: 'linear',
                    position: 'left',
                    grid: { color: 'rgba(0, 0, 0, 0.04)', drawBorder: false },
                    ticks: { callback: v => v >= 1000000 ? (v / 1000000) + 'M' : v >= 1000 ? (v / 1000) + 'k' : v }
                },
                y1: {
                    type: 'linear',
                    position: 'right',
                    grid: { display: false },
                    beginAtZero: true,
                    suggestedMax: Math.max(...quantityData) + 2 // Giúp đường line không bị sát mép trên nếu data bằng nhau
                },
                x: { grid: { display: false } }
            }
        }
    });
}

function updateCategoryChart(categoryStats) {
    const canvas = document.getElementById('categoryChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const labels = categoryStats.map(item => item.category);
    const data = categoryStats.map(item => item.revenue);

    if (categoryChart) categoryChart.destroy();
    if (labels.length === 0) return;

    categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#FFCD56'
                ],
                hoverOffset: 15,
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { boxWidth: 12, padding: 15 } },
                title: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.raw / total) * 100).toFixed(1);
                            return `${context.label}: ${percentage}% (${new Intl.NumberFormat('vi-VN').format(context.raw)}₫)`;
                        }
                    }
                }
            },
            cutout: '65%'
        }
    });
}

function updateTrendChart(monthlyRevenue) {
    const canvas = document.getElementById('trendChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const months = ["Th1", "Th2", "Th3", "Th4", "Th5", "Th6", "Th7", "Th8", "Th9", "Th10", "Th11", "Th12"];
    const labels = monthlyRevenue.map(item => months[item.month - 1]);
    const data = monthlyRevenue.map(item => item.revenue);

    if (trendChart) trendChart.destroy();
    if (labels.length === 0) return;

    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(75, 192, 192, 0.4)');
    gradient.addColorStop(1, 'rgba(75, 192, 192, 0)');

    trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Doanh thu tháng (VNĐ)',
                data: data,
                fill: true,
                backgroundColor: gradient,
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 4,
                tension: 0.6,
                cubicInterpolationMode: 'monotone',
                pointBackgroundColor: '#fff',
                pointBorderColor: 'rgba(75, 192, 192, 1)',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 8,
                pointHoverBackgroundColor: 'rgba(75, 192, 192, 1)',
                pointHoverBorderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: { display: false },
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { callback: v => v >= 1000000 ? (v / 1000000) + 'M' : v >= 1000 ? (v / 1000) + 'k' : v }
                },
                x: { grid: { display: false } }
            }
        }
    });
}

// showThongKe(createObj()) // Removed undefined call

function mergeObjThongKe(arr) {
    let result = [];
    arr.forEach(item => {
        let check = result.find(i => i.id == item.id) // Không tìm thấy gì trả về undefined

        if (check) {
            check.quantity = parseInt(check.quantity) + parseInt(item.quantity);
            check.doanhthu += parseInt(item.price) * parseInt(item.quantity);
        } else {
            const newItem = { ...item }
            newItem.doanhthu = newItem.price * newItem.quantity;
            result.push(newItem);
        }

    });
    return result;
}

function detailOrderProduct(arr, id) {
    let orderHtml = "";
    arr.forEach(item => {
        if (item.id == id) {
            orderHtml += `<tr>
            <td>${item.madon}</td>
            <td>${item.quantity}</td>
            <td>${vnd(item.price)}</td>
            <td>${formatDate(item.time)}</td>
            </tr>      
            `;
        }
    });
    document.getElementById("show-product-order-detail").innerHTML = orderHtml
    document.querySelector(".modal.detail-order-product").classList.add("open")
}

// User
let addAccount = document.getElementById('signup-button');
let updateAccount = document.getElementById("btn-update-account")

document.querySelector(".modal.signup .modal-close").addEventListener("click", () => {
    signUpFormReset();
})
