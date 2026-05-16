# 📋 Kế hoạch phát triển dự án TiMiFood

Dưới đây là danh sách các hạng mục cần nâng cấp để hoàn thiện hệ thống Client-Server sử dụng SQL Server.

## 🛠 Hạng mục ưu tiên cao (P0)
- [x] **Quản lý Đơn hàng (Orders):** 
    - [x] Tạo bảng `Orders` (Lưu thông tin khách hàng, tổng tiền, ngày đặt).
    - [x] Tạo bảng `OrderDetails` (Lưu chi tiết từng món ăn trong đơn).
    - [x] Viết API `POST /api/orders` để xử lý khi bấm nút "Thanh toán".
- [x] **Hoàn thiện chức năng Admin:**
    - [x] Chuyển đổi tính năng **Thêm sản phẩm** sang dùng API.
    - [x] Chuyển đổi tính năng **Sửa sản phẩm** sang dùng API.
    - [x] Chuyển đổi tính năng **Xóa sản phẩm** sang dùng API.

## ⚙️ Hạng mục tính năng (P1)
- [x] **Đồng bộ giỏ hàng:** Lưu thông tin giỏ hàng vào SQL Server khi người dùng đăng nhập.
- [x] **Bảo mật (Authentication):** Triển khai JWT Token để thay thế việc lưu user object trực tiếp ở localStorage.
- [x] **Quản lý trạng thái đơn hàng:** Cho phép Admin duyệt đơn (Chờ xử lý -> Đã thanh toán).

## 📊 Hạng mục thống kê (P2)
- [x] **Báo cáo doanh thu:** Tính tổng tiền theo ngày/tháng/năm từ Database.
- [x] **Top sản phẩm:** Thống kê các món ăn được đặt nhiều nhất.

## 🎨 Tối ưu giao diện (UI/UX)
- [x] Thêm hiệu ứng Loading khi chờ dữ liệu từ API.
- [x] Tối ưu hóa tìm kiếm (Search) trực tiếp bằng câu lệnh SQL `LIKE`.

## 🚀 Hạng mục mở rộng chuyên nghiệp (P3 - Đề xuất)
- [x] **Mã hóa mật khẩu:** Sử dụng `bcryptjs` để bảo mật thông tin người dùng trong Database (có cơ chế tự động di trú dữ liệu cũ).
- [x] **Xuất dữ liệu:** Chức năng xuất báo cáo doanh thu/đơn hàng ra file Excel chuyên nghiệp.
- [x] **Thông báo thời gian thực:** Hiển thị thông báo và phát âm thanh ngay lập tức cho Admin khi có đơn hàng mới.
- [x] **Phân quyền nhân viên:** Tách biệt tài khoản Super Admin (toàn quyền) và Nhân viên (chỉ xử lý đơn).

## Giai đoạn 3: Nâng cấp tính năng chuyên nghiệp (Roadmap)

### 1. Hệ thống Marketing & Ưu đãi
- [x] Thiết lập bảng `Vouchers` trong Database (Mã, mức giảm, hạn sử dụng).
- [x] Xây dựng giao diện quản lý Mã giảm giá cho Admin.
- [x] Tích hợp tính năng nhập mã giảm giá tại trang Thanh toán (Checkout).

### 2. Tương tác & Uy tín thương hiệu
- [x] Xây dựng hệ thống Đánh giá (Rating & Review) cho từng sản phẩm.
- [x] Ràng buộc "Đã mua hàng mới được đánh giá" để tăng độ uy tín.
- [x] Tự động lấy tên khách hàng từ Database nếu phiên đăng nhập bị thiếu.
- [x] Hiển thị số sao trung bình và bình luận của khách hàng tại trang chi tiết món ăn.
- [x] Cải thiện UI/UX: Ẩn form đánh giá khi chưa đăng nhập và thêm thông báo hướng dẫn.

### 3. Trải nghiệm khách hàng chuyên sâu
- [x] Hiển thị tiến trình đơn hàng (Order Tracking) cho khách (Đã đặt hàng -> Đang chuẩn bị -> Đang giao -> Hoàn thành).
- [x] Tích hợp thanh toán Online mô phỏng (VNPAY/MoMo) để đa dạng hóa phương thức thanh toán.
- [x] Gửi thông báo đơn hàng tự động qua Email (Nodemailer) khi đặt hàng và cập nhật trạng thái.

### 4. Quản trị & Báo cáo nâng cao
- [x] Thống kê Top 5 món ăn bán chạy nhất theo tháng.
- [x] Quản lý số lượng tồn kho (Inventory) và cảnh báo khi sắp hết hàng.
- [x] Biểu đồ so sánh doanh thu giữa các tháng để đánh giá tăng trưởng.

---

*Lưu ý: Các mục trên được sắp xếp theo mức độ ưu tiên từ trên xuống dưới để tối ưu hóa việc vận hành kinh doanh.* 

---
*Ghi chú: Đánh dấu [x] để xác nhận đã hoàn thành.*
