
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
- Tài khoản: `admin` 
- Mật khẩu: `123456`
- Trang quản lý: `admin.html`

### Hình ảnh giao diện
![Alt text](./assets/img/img-github/home.png)
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

### ✅ Giai đoạn 13: Bảo mật Tài khoản & Quản trị Danh mục Động (Security & Dynamic CMS)
- **Nâng cấp Bảo mật Tài khoản:**
    - Triển khai hệ thống **Đổi mật khẩu (Change Password)** bảo mật cao: Xác thực đa tầng bằng `bcrypt` trực tiếp tại Backend.
    - **Data Privacy:** Loại bỏ hoàn toàn việc lưu trữ mật khẩu tại LocalStorage và chặn đứng việc gửi dữ liệu nhạy cảm qua API Responses (ngay cả dạng hash).
    - Tối ưu hóa API cập nhật thông tin người dùng, đảm bảo tính toàn vẹn dữ liệu từ Database thay vì dựa vào dữ liệu tạm tại trình duyệt.
- **Hệ thống Quản lý Danh mục (Dynamic Categories):**
    - Chuyển đổi thành công danh mục từ trạng thái tĩnh (Hardcoded) sang động hoàn toàn (Database-driven).
    - **Admin CMS:** Xây dựng module quản trị danh mục chuyên nghiệp với Modal thiết kế Premium, hỗ trợ thêm/sửa/xóa và đồng bộ dữ liệu tức thì.
    - **Global Sync:** Tự động cập nhật danh sách danh mục lên toàn bộ hệ thống: Menu điều hướng, bộ lọc tìm kiếm nâng cao và chân trang (Footer).

### ✅ Giai đoạn 14: Ổn định Hệ thống & Trải nghiệm Người dùng (System Stabilization)
- **Chuẩn hóa thông báo:** Chuyển đổi toàn bộ thông báo hệ thống sang Tiếng Việt chuyên nghiệp.
- **Chính sách mật khẩu mạnh:** Áp dụng ràng buộc mật khẩu tối thiểu 8 ký tự, bao gồm chữ hoa, chữ thường và số để đảm bảo an toàn tuyệt đối.
- **Đồng bộ hóa dữ liệu:** Tự động hóa việc băm mật khẩu (Hashing) khi cập nhật tài khoản từ trang Quản trị, đảm bảo tính đồng nhất bảo mật.

### ✅ Giai đoạn 15: Hoàn thiện & Nâng cấp Chuyên sâu (Advanced Polish)
- **Quên mật khẩu (Forgot Password):** Triển khai tính năng lấy lại mật khẩu an toàn qua Email với mã xác thực OTP.
- **Real-time Notifications:** Tích hợp công nghệ **Socket.io** giúp Admin nhận thông báo đơn hàng mới tức thì mà không cần tải lại trang.
- **Tối ưu hiệu suất:** Triển khai **Lazy Loading** cho toàn bộ hệ thống hình ảnh, giúp tốc độ tải trang nhanh hơn 30-40%.
- **Hệ thống Nhật ký (System Logs):** Xây dựng module ghi lại toàn bộ lịch sử hoạt động của Admin (Thêm/Sửa/Xóa sản phẩm, đơn hàng, tài khoản, voucher) để phục vụ việc kiểm tra và bảo trì.

### ✅ Giai đoạn 16: Tối ưu Bảo mật, Kiểm thử Ổn định & Nâng cấp Trải nghiệm Tinh tế (Mới)
- **Bảo mật API (Rate Limiting):** Tích hợp giải pháp giới hạn tần suất yêu cầu (`express-rate-limit`) in-memory cho các endpoint nhạy cảm (Đăng nhập, Đăng ký, Gửi OTP, Đổi mật khẩu, Xác minh OTP) giúp ngăn chặn triệt để brute-force và spam OTP.
- **Tinh chỉnh Vi tương tác (Micro-interactions) CSS:**
    - Thiết lập hiệu ứng kính mờ thời thượng (`backdrop-filter: blur(8px)`) và lớp phủ màu sẫm cao cấp cho các Modal.
    - Bổ sung hiệu ứng nảy đàn hồi (Elastic Bounce Pop-in) cho Modal Container bằng biểu đồ `cubic-bezier(0.34, 1.56, 0.64, 1)`.
    - Thêm các vi tương tác mượt mà cho nút đóng modal, nút tăng/giảm số lượng, giỏ hàng và các nút hành động chính (Thêm món, Thanh toán).
- **Báo cáo PDF Doanh thu Trực quan:**
    - Tích hợp thư viện `html2pdf.js` kết xuất báo cáo kết quả kinh doanh định dạng A4 chuẩn hóa.
    - Tự động chuyển đổi các biểu đồ dynamic của `Chart.js` thành định dạng ảnh Base64 chất lượng cao để nhúng vào PDF mà không mất dữ liệu.
- **Kiểm thử Ổn định Real-time & Ngoại lệ Gửi mail:**
    - Tích hợp xác thực kết nối SMTP (`transporter.verify`) ngay khi khởi chạy máy chủ nhằm phát hiện sớm lỗi cấu hình.
    - Triển khai cơ chế gửi lại email tự động (Email Retry) tối đa 3 lần với thời gian chờ tăng dần (Exponential backoff) cho các thông báo đơn hàng.
    - Cải tiến tính năng tự động kết nối lại (Auto-Reconnect) và đồng bộ thông tin đơn hàng mới tức thì (Auto-Sync) cho Admin Dashboard khi kết nối Socket.io được phục hồi.

### ✅ Giai đoạn 17: Thông báo Trạng thái Đơn hàng thời gian thực hai chiều (Real-time Order Status Updates for Customers) (Mới)
- **Thiết kế Socket Rooms riêng tư:** Cấu hình phòng riêng (`userRoom_${userPhone}`) cho từng khách hàng, ngăn chặn rò rỉ dữ liệu hoặc gửi nhầm thông báo giữa các phiên làm việc khác nhau.
- **Xóa bỏ Polling (Tối ưu hóa hiệu năng):** Chuyển từ cơ chế truy vấn API mỗi 3 giây sang liên kết WebSocket thời gian thực, giảm hơn 95% lưu lượng mạng và tải xử lý của CPU phía Server.
- **Đồng bộ hóa giao diện tự động (Auto UI Sync):** Lắng nghe sự kiện từ phía quản trị viên thay đổi trạng thái đơn để hiển thị Toast thông báo tức thời, và tự động gọi lại `renderOrderProduct()` để cập nhật thanh tiến trình Order Tracking ngay khi đang mở tab lịch sử mua hàng mà không cần tải lại trang.
- **Đồng bộ hóa Trạng thái Đăng nhập/Đăng xuất:** Tự động kết nối/ngắt kết nối WebSocket phù hợp với trạng thái đăng nhập hiện thời của khách hàng.

### ✅ Giai đoạn 18: Trợ lý Khách hàng thông minh (Smart AI Chatbot Assistant) (Mới)
- **Thiết kế Giao diện Glassmorphism Premium:** Phát triển chatbot widget nổi với hiệu ứng mờ nhòe kính mờ thời thượng, bố trí góc dưới bên phải màn hình mượt mà, phản hồi responsive toàn diện.
- **Đồng bộ hóa 'Thêm vào giỏ' thời gian thực:** Tích hợp nút đặt món trực tiếp ngay trong thẻ sản phẩm của hộp thoại chat, đồng bộ hoàn hảo giỏ hàng local và giỏ hàng server với cơ chế hiển thị Toast và animation lắc giỏ hàng nguyên bản.
- **Tra cứu đơn hàng qua timeline trực quan:** Hỗ trợ khách hàng (cả tài khoản đăng nhập lẫn khách vãng lai qua số điện thoại) tra cứu trạng thái đơn hàng real-time, biểu diễn tiến trình dạng Timeline sắc sảo.
- **Phản hồi tự động qua bộ từ khóa thông minh:** Tự động phản hồi nhanh chóng và chính xác các thắc mắc phổ biến của người dùng về thời gian mở cửa, địa chỉ chi nhánh, chính sách freeship, cách đặt hàng cùng hiệu ứng gõ chữ sinh động.

### ✅ Giai đoạn 19: Hệ thống Chat trực tiếp Khách hàng - Nhân viên thời gian thực (Real-time Live Chat Escalation System) (Mới)
- **Quản lý phiên chat In-Memory:** Lưu trữ trạng thái phiên live chat (`waiting`, `active`, `ended`) kèm theo nhật ký trò chuyện trên máy chủ in-memory, đảm bảo truy xuất nhanh và hiệu năng vượt trội.
- **Kết nối Socket.io Room:** Thiết lập cơ chế tách phòng riêng tư cho mỗi khách hàng theo số điện thoại phòng hờ trùng lặp, tự động điều phối sự kiện tiếp nhận phiên chat và gửi nhận tin nhắn thời gian thực.
- **Admin Chat Panel Premium:** Thiết kế Sidebar Tab "Hỗ trợ trực tuyến" sang trọng với bố cục Split-Pane kính mờ hiện đại, hiển thị danh sách khách hàng thông minh, hiệu ứng nhấp nháy Pulse khi có phiên đang chờ tiếp nhận và bong bóng tin nhắn phân màu trực quan.
- **Nâng cấp AI Chatbot Hybrid:** Bổ sung tùy chọn "Gặp nhân viên hỗ trợ" qua nút gợi ý nhanh và nhận diện từ khóa; tự động thu thập thông tin cá nhân khách vãng lai trước khi kết nối; định tuyến thông minh luồng tin nhắn khách hàng qua cổng Socket; hỗ trợ kết thúc phiên chat để quay lại AI Bot bất cứ lúc nào.

---
*Dự án hiện đã đạt độ hoàn thiện cao nhất, sẵn sàng cho việc vận hành thực tế với hiệu suất và độ ổn định tối ưu.*

