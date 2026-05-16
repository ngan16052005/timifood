
<!-- author: hgbaodev -->
# Đồ án môn lập trình web và ứng dụng

## Hướng dẫn chạy đồ án (Mô hình Client-Server với SQL Server)

1. **Cài đặt môi trường:** Đảm bảo bạn đã cài đặt [Node.js](https://nodejs.org/) và [SQL Server](https://www.microsoft.com/en-us/sql-server/sql-server-downloads).
2. **Cấu hình Database:**
   - Tạo một Database mới trong SQL Server (ví dụ: `TiMiFoodDB`).
   - Mở file `.env` trong thư mục dự án và cập nhật thông tin tài khoản SQL Server của bạn (`DB_USER`, `DB_PASSWORD`, `DB_SERVER`, `DB_DATABASE`).
3. **Cài đặt thư viện:** Mở terminal tại thư mục dự án và chạy lệnh:
   ```bash
   npm install
   ```
4. **Khởi tạo Database:** Chạy lệnh sau để tự động tạo bảng và chuyển dữ liệu từ JSON vào SQL Server:
   ```bash
   node initSqlDb.js
   ```
5. **Chạy Server:** Khởi động backend bằng lệnh:
   ```bash
   node server.js
   ```
   Server sẽ chạy tại: `http://localhost:3500
6. **Mở Website:** Mở file `index.html` bằng trình duyệt.

## Thông tin Admin
- Tài khoản: `hgbaodev` / `0123456789`
- Mật khẩu: `123456`
- Trang quản lý: `admin.html`

### Hình ảnh giao diện
![Alt text](./assets/img/screen.jpeg)
<h4 align="center">Trang chủ</h4>

![Alt text](./assets/img/img-github/admin-product.jpeg)
<h4 align="center">Chi tiết sản phẩm</h4>

![Alt text](./assets/img/img-github/giohang.jpeg)
<h4 align="center">Giỏ hàng</h4>

![Alt text](./assets/img/img-github/admin.jpeg)
<h4 align="center">Trang admin</h4>

![Alt text](./assets/img/img-github/admin-product.jpeg)
<h4 align="center">Quản lý sản phẩm</h4>

---

## 🚀 Nhật ký tiến độ dự án

### ✅ Giai đoạn 1: Xây dựng nền tảng Client-Server (Node.js)
- **Khởi tạo Backend:** Sử dụng Node.js và Express làm máy chủ điều hướng.
- **Tách biệt dữ liệu:** Chuyển đổi dữ liệu từ các biến cục bộ sang các file JSON tập trung (`products.json`, `users.json`).
- **Xây dựng API:** Thiết kế các đầu cuối (endpoints) cho việc lấy danh sách sản phẩm, đăng nhập và đăng ký tài khoản.
- **Tích hợp Frontend:** Tạo file `api.js` để đồng nhất việc gọi dữ liệu từ giao diện tới máy chủ thông qua phương thức `fetch`.

### ✅ Giai đoạn 2: Nâng cấp hệ quản trị cơ sở dữ liệu (SQL Server)
- **Tích hợp SQL Server:** Thay thế lưu trữ file JSON bằng cơ sở dữ liệu quan hệ SQL Server để đảm bảo tính bền vững và bảo mật.
- **Tối ưu hóa cấu hình:** Sử dụng biến môi trường (`.env`) để quản lý thông tin kết nối Database.
- **Script di trú dữ liệu:** Viết công cụ `initSqlDb.js` để tự động hóa việc tạo bảng và nạp dữ liệu cũ vào SQL Server chỉ với một câu lệnh.
- **Chuyển đổi truy vấn:** Cập nhật Backend để xử lý các câu lệnh SQL (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) thay cho việc đọc/ghi file trực tiếp.

### ✅ Giai đoạn 3: Tối ưu hóa trải nghiệm và đồng bộ hóa
- **Đồng bộ Async/Await:** Chuyển đổi toàn bộ logic nạp dữ liệu ở frontend sang cơ chế bất đồng bộ, giúp giao diện không bị giật lag khi tải dữ liệu từ server.
- **Tự động nhận diện hàm hiển thị:** Cập nhật `initialization.js` để tự động kích hoạt các hàm hiển thị sản phẩm tương ứng với cấu trúc trang chủ của đồ án.
- **Bảo mật đăng nhập:** Xác thực người dùng trực tiếp qua truy vấn Database, bảo vệ thông tin tài khoản Admin và Khách hàng.

### ✅ Giai đoạn 4: Hoàn thiện tính năng Quản trị và Thanh toán (Hiện tại)
- **Hệ thống Đơn hàng (Orders):** Xây dựng bảng `Orders` và `OrderDetails` trong SQL Server. Tích hợp quy trình lưu đơn hàng thực tế khi người dùng thanh toán.
- **Admin Dashboard toàn diện:** 
    - Hoàn thiện tính năng **Quản lý Sản phẩm**: Cho phép Thêm, Sửa, Xóa (Soft delete) sản phẩm trực tiếp từ giao diện Admin.
    - Hoàn thiện tính năng **Quản lý Người dùng**: Xem danh sách, khóa/mở khóa tài khoản khách hàng.
    - Hoàn thiện tính năng **Quản lý Đơn hàng**: Xem chi tiết đơn hàng, cập nhật trạng thái xử lý và cho phép Xóa đơn hàng (sử dụng Transaction để xóa sạch dữ liệu liên quan).
- **Tối ưu UI/UX Admin:** 
    - Triển khai phân trang (**10-12 sản phẩm/trang**) để tối ưu tốc độ tải.
    - Tích hợp hệ thống thông báo **Toast Message** chuyên nghiệp cho các thao tác thành công/thất bại.
    - Tối giản giao diện thao tác (chỉ sử dụng icon cho các nút Xóa) giúp bảng dữ liệu gọn gàng hơn.

### ✅ Giai đoạn 5: Bảo mật JWT và Nâng cấp Trải nghiệm
- **Xác thực JWT (JSON Web Token):** Triển khai cơ chế bảo mật tiêu chuẩn. Server cấp Token khi đăng nhập và yêu cầu Token hợp lệ cho mọi thao tác Quản trị (Add/Edit/Delete).
- **Server-side Search:** Tối ưu hóa tính năng tìm kiếm sản phẩm bằng SQL `LIKE` tại Backend, giúp giảm tải cho trình duyệt và tăng tốc độ phản hồi.
- **Loading UI/UX:** Thêm hiệu ứng Loading Overlay toàn trang khi nạp dữ liệu API, cải thiện cảm giác mượt mà và tính chuyên nghiệp cho ứng dụng.

### ✅ Giai đoạn 6: Hệ thống Báo cáo & Thống kê Chuyên sâu
- **Visual Analytics (Chart.js):** Tích hợp thư viện biểu đồ mạnh mẽ để trực quan hóa dữ liệu kinh doanh.
- **Phân tích hiệu suất:** 
    - Biểu đồ kết hợp (Line/Bar) cho Top 10 sản phẩm bán chạy nhất.
    - Biểu đồ hình khuyên (Doughnut) phân tích tỉ trọng doanh thu theo từng danh mục món ăn.
    - Biểu đồ vùng (Area Chart) theo dõi xu hướng dòng tiền theo từng ngày/tháng.
- **Modern Dashboard Design:** Cấu trúc lại trang Thống kê với ngôn ngữ thiết kế hiện đại (Card-based layout), đổ bóng mềm và hiệu ứng tương tác cao.

### ✅ Giai đoạn 7: Bảo mật Mật khẩu & Phân quyền Đa cấp (RBAC)
- **Bảo mật Hash (Bcrypt):** Nâng cấp hệ thống mã hóa mật khẩu bằng thuật toán `bcryptjs`, ngăn chặn việc lộ thông tin ngay cả khi cơ sở dữ liệu bị truy cập trái phép.
- **Phân quyền người dùng (RBAC):**
    - Phân tách rõ rệt 3 vai trò: **Quản trị viên** (Toàn quyền), **Nhân viên** (Xử lý đơn hàng), **Khách hàng** (Mua sắm).
    - Triển khai Middleware bảo mật tại Backend, chặn đứng các yêu cầu API trái phép dựa trên quyền hạn của người dùng.
    - Giao diện Admin tự động điều chỉnh linh hoạt: Chỉ hiển thị các chức năng tương ứng với quyền hạn của người đăng nhập.
- **Hệ thống Thông báo Thời gian thực:**
    - Triển khai cơ chế giám sát đơn hàng tự động (Polling), phát hiện đơn hàng mới trong vòng 10 giây.
    - Tích hợp thông báo âm thanh và hiệu ứng visual bắt mắt giúp Admin không bỏ lỡ bất kỳ đơn hàng nào.
    - Tối ưu hóa API với chế độ "Silent Mode", đảm bảo việc giám sát ngầm không ảnh hưởng đến trải nghiệm người dùng.
- **Xuất dữ liệu Excel:** Tích hợp tính năng kết xuất dữ liệu Đơn hàng/Sản phẩm ra file Excel chuyên nghiệp, phục vụ việc lưu trữ và báo cáo ngoại tuyến.

### ✅ Giai đoạn 8: Hệ thống Marketing & Ưu đãi (Vouchers)
- **Quản lý Voucher thông minh:** Thiết kế và triển khai hệ thống mã giảm giá đa dạng: Giảm theo phần trăm (%), giảm theo số tiền cố định (VND).
- **Điều kiện áp dụng chặt chẽ:** Tích hợp các ràng buộc thông minh như Giá trị đơn hàng tối thiểu, Mức giảm tối đa (cho %), và Ngày hết hạn tự động.
- **Trải nghiệm mua sắm mượt mà:** Khách hàng có thể nhập mã ngay tại trang Thanh toán, hệ thống tự động kiểm tra tính hợp lệ và tính toán lại tổng tiền trong tích tắc.
- **Minh bạch hóa đơn:** Lưu trữ chi tiết mã giảm giá và số tiền đã trừ vào từng đơn hàng trong cơ sở dữ liệu, giúp việc đối soát doanh thu chính xác 100%.

### ✅ Giai đoạn 9: Tương tác & Uy tín (Reviews & Ratings)
- **Hệ thống đánh giá đa chiều:** Khách hàng có thể để lại số sao (1-5) và bình luận chi tiết cho từng món ăn.
- **Tính toán tự động:** Backend tự động tính toán điểm trung bình (Average Rating) giúp khách hàng dễ dàng nhận diện những "best-seller" của cửa hàng.
- **Giao diện trực quan:** Hiển thị sao vàng và số lượt đánh giá ngay trên thẻ sản phẩm ở trang chủ, tạo hiệu ứng tin cậy ngay từ cái nhìn đầu tiên.
- **Ràng buộc Uy tín (Verified Purchase):** Chỉ cho phép khách hàng đã mua và nhận hàng thành công mới được quyền đánh giá, loại bỏ hoàn toàn các bình luận ảo.
- **Trải nghiệm thông minh:** Tự động ẩn form đánh giá với khách vãng lai (kèm lời mời đăng nhập) và cơ chế tự động lấy tên thật từ Database để đảm bảo thông tin luôn chính xác.

### ✅ Giai đoạn 10: Quản trị Kho hàng & Hệ thống Thông báo Toàn diện
- **Quản lý tồn kho (Inventory Control):**
    - Triển khai tính năng **Nhập kho (Stock In)** chuyên nghiệp với ghi nhận số lượng và ghi chú chi tiết.
    - Hệ thống **Lịch sử nhập kho (Stock History)** giúp theo dõi biến động hàng hóa theo thời gian.
    - Tự động cảnh báo và ngăn chặn đặt hàng khi sản phẩm hết hàng (Out of stock).
- **Hệ thống Thông báo (In-app Notifications):**
    - Xây dựng trung tâm thông báo nội bộ cho từng người dùng.
    - Thông báo xác nhận đơn hàng, cập nhật trạng thái giao hàng được gửi tự động.
    - Admin nhận thông báo tức thì khi có đơn hàng mới hoặc phản hồi từ khách hàng.
    - Hỗ trợ đánh dấu "Đã đọc", "Xóa tất cả" giúp quản lý thông báo gọn gàng.
- **Quản trị Đánh giá nâng cao:** Admin có quyền kiểm soát tuyệt đối các bình luận, hỗ trợ xóa các nội dung không phù hợp để duy trì môi trường mua sắm văn minh.
- **Di trú dữ liệu an toàn:** Cơ chế tự động nâng cấp (migration) mật khẩu cũ sang dạng mã hóa Bcrypt ngay khi người dùng đăng nhập, đảm bảo bảo mật mà không gây gián đoạn trải nghiệm.

### ✅ Giai đoạn 11: Trải nghiệm Chuyên sâu (Tracking, Payment & Email)
- **Hệ thống Order Tracking (Theo dõi đơn hàng):** 
    - Tích hợp thanh tiến trình (Progress Bar) trực quan ngay trong lịch sử đơn hàng.
    - Cho phép khách hàng theo dõi 4 giai đoạn quan trọng: Đã đặt hàng -> Đang chuẩn bị -> Đang giao hàng -> Đã nhận hàng.
- **Tích hợp Thanh toán Online (Simulation):**
    - Hỗ trợ đa dạng phương thức thanh toán: Tiền mặt, VNPAY, MoMo.
    - Quy trình thanh toán chuyên nghiệp với mã QR và giao diện mô phỏng xác nhận giao dịch thời gian thực.
- **Thông báo qua Email (Nodemailer Integration):**
    - Tự động gửi email xác nhận đơn hàng ngay khi khách hàng đặt hàng thành công.
    - Gửi email thông báo cập nhật trạng thái đơn hàng (xác nhận, đang giao, hoàn thành) để khách hàng luôn chủ động nắm bắt thông tin.

### ✅ Giai đoạn 12: Tối ưu hóa & Hoàn thiện Hệ thống (Final Polishing)
- **Đồng bộ Múi giờ Toàn diện:** Khắc phục triệt để lỗi lệch +7h bằng cách chuẩn hóa việc xử lý chuỗi thời gian từ Database lên giao diện (Admin & Client), đảm bảo tính chính xác tuyệt đối của dữ liệu.
- **Tối ưu hóa Quy trình Thanh toán (Checkout Optimization):**
    - Bổ sung tính năng chọn thời gian cho hình thức **Tự đến lấy**, giúp đa dạng hóa lựa chọn cho khách hàng.
    - Đồng bộ giao diện (UI/UX) Dropdown chọn giờ, tạo cảm giác chuyên nghiệp và thống nhất trên toàn ứng dụng.
    - Sửa đổi thông tin chi nhánh và địa chỉ phù hợp với thực tế vận hành tại Hải Phòng.
- **Nâng cấp Hệ thống Cảnh báo Admin:**
    - Cải tiến cơ chế **Toast Notification** và **Âm thanh thông báo**: Phân loại âm thanh riêng biệt cho đơn hàng mới (success) và đơn hàng bị hủy (warning).
    - Tự động làm mới danh sách đơn hàng và số liệu doanh thu trong thời gian thực khi có biến động từ phía khách hàng.
- **Tinh chỉnh Trải nghiệm Người dùng:** Loại bỏ các âm thanh không cần thiết ở phía Client để tăng tính riêng tư, chỉ giữ lại các thông báo thị giác (Toast) tinh tế.

---
*Dự án hiện đã đạt độ hoàn thiện cao nhất, sẵn sàng cho việc vận hành thực tế với hiệu suất và độ ổn định tối ưu.*
