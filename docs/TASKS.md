# 📋 Kế hoạch & Nhật ký Tiến độ TiMiFood

Dưới đây là danh sách đầy đủ các hạng mục đã hoàn thiện trong quá trình phát triển hệ thống TiMiFood (Client-Server / SQL Server).

## ✅ Giai đoạn 1: Nền tảng Backend (Node.js & Express)

- [x] Khởi tạo máy chủ Express và cấu hình Server.
- [x] Chuyển đổi dữ liệu cứng sang hệ thống file JSON tập trung.
- [x] Xây dựng các API cơ bản: Lấy sản phẩm, Đăng nhập, Đăng ký.
- [x] Thiết lập `api.js` để đồng bộ giao tiếp Frontend-Backend.

## ✅ Giai đoạn 2: Hệ quản trị Database (SQL Server)

- [x] Thiết kế cấu trúc bảng SQL Server thay thế cho file JSON.
- [x] Cấu hình biến môi trường `.env` bảo mật thông tin kết nối.
- [x] Viết script `initSqlDb.js` di trú dữ liệu tự động.
- [x] Chuyển đổi toàn bộ truy vấn Backend sang SQL (CRUD).

## ✅ Giai đoạn 3: Tối ưu hóa Đồng bộ & Bảo mật

- [x] Triển khai Async/Await cho toàn bộ luồng dữ liệu Frontend.
- [x] Tự động hóa quá trình khởi tạo giao diện qua `initialization.js`.
- [x] Xác thực tài khoản Admin/Khách hàng trực tiếp từ Database.

## ✅ Giai đoạn 4: Quản trị (Admin) & Thanh toán (Checkout)

- [x] Thiết lập hệ thống `Orders` và `OrderDetails` (Transaction-based).
- [x] Admin: Quản lý Sản phẩm (Thêm, Sửa, Xóa mềm).
- [x] Admin: Quản lý Người dùng (Xem, Khóa/Mở tài khoản).
- [x] Admin: Quản lý Đơn hàng (Duyệt đơn, Xem chi tiết, Xóa dữ liệu sạch).
- [x] Tối ưu UI Admin: Phân trang, Toast Message, Icon actions.

## ✅ Giai đoạn 5: Bảo mật JWT & Server-side Search

- [x] Triển khai JSON Web Token (JWT) cho các API quản trị.
- [x] Tối ưu tìm kiếm sản phẩm bằng SQL `LIKE` tại Backend.
- [x] Thêm hiệu ứng Loading Overlay nâng cao trải nghiệm người dùng.

## ✅ Giai đoạn 6: Thống kê & Phân tích (Visual Analytics)

- [x] Tích hợp Chart.js trực quan hóa dữ liệu kinh doanh.
- [x] Biểu đồ Top sản phẩm, Doanh thu theo danh mục, Xu hướng dòng tiền.
- [x] Thiết kế Dashboard hiện đại dạng Card-based.

## ✅ Giai đoạn 7: Bcrypt & Phân quyền (RBAC)

- [x] Mã hóa mật khẩu người dùng bằng Bcryptjs.
- [x] Phân quyền đa cấp: Admin, Staff, Customer.
- [x] Hệ thống thông báo Admin thời gian thực (Polling & Sound alerts).
- [x] Chức năng xuất báo cáo đơn hàng ra file Excel.

## ✅ Giai đoạn 8: Marketing & Ưu đãi (Vouchers)

- [x] Quản lý mã giảm giá (Phần trăm & Số tiền cố định).
- [x] Ràng buộc voucher: Giá tối thiểu, Giảm tối đa, Hạn sử dụng.
- [x] Tích hợp áp dụng Voucher tại trang Checkout.

## ✅ Giai đoạn 9: Tương tác & Uy tín (Reviews)

- [x] Hệ thống Đánh giá & Bình luận sản phẩm (1-5 sao).
- [x] Tự động tính điểm trung bình sản phẩm.
- [x] Ràng buộc "Đã nhận hàng mới được đánh giá" (Verified Purchase).

## ✅ Giai đoạn 10: Quản trị Kho & Di trú Mật khẩu

- [x] Quản lý Nhập kho (Stock In) và Lịch sử nhập kho.
- [x] Cảnh báo hết hàng và chặn đặt hàng khi tồn kho = 0.
- [x] Cơ chế tự động di trú mật khẩu cũ sang Bcrypt khi đăng nhập.

## ✅ Giai đoạn 11: Tracking & Thanh toán Online (Simulation)

- [x] Order Tracking trực quan (Thanh tiến trình 4 giai đoạn).
- [x] Mô phỏng thanh toán VNPAY/MoMo với giao diện QR Code.
- [x] Tích hợp Nodemailer: Tự động gửi Email xác nhận và cập nhật trạng thái đơn.

## ✅ Giai đoạn 12: Tối ưu hóa Toàn diện & Nâng cấp Chuyên sâu (Final Polishing)

- [x] Đồng bộ múi giờ toàn hệ thống (Fix lỗi lệch +7h).
- [x] Thêm chọn giờ cho hình thức "Tự đến lấy" và đồng bộ UI Dropdown.
- [x] Phân loại âm thanh thông báo Admin (Đơn mới / Đơn hủy).
- [x] Triển khai tính năng **In hóa đơn (Print Invoice)** chuyên nghiệp cho Admin.
- [x] Xây dựng hệ thống **Quản lý danh mục (Category Management)** động:
  - [x] Cơ sở dữ liệu bảng `Categories`.
  - [x] Giao diện Admin: Thêm, Sửa, Xóa danh mục.
  - [x] Đồng bộ danh mục động lên Menu, Bộ lọc và Footer trang người dùng.
- [x] Dọn dẹp mã lỗi Console và tối ưu hóa hiệu suất ứng dụng.

## ✅ Giai đoạn 13: Bảo mật Tài khoản & Quyền riêng tư (Security & Privacy)

- [x] Triển khai API **Đổi mật khẩu (Change Password)** bảo mật phía Server.
- [x] Cơ chế xác thực mật khẩu cũ bằng `bcrypt.compare` trước khi đổi.
- [x] Loại bỏ hoàn toàn dữ liệu mật khẩu (ngay cả dạng hash) khỏi API Responses và LocalStorage.
- [x] Tối ưu hóa logic cập nhật thông tin cá nhân không phụ thuộc vào dữ liệu tạm tại Client.
- [x] Nâng cấp Modal Quản lý danh mục với giao diện Premium và trải nghiệm mượt mà.

---

## ✅ Giai đoạn 14: Ổn định Hệ thống & Trải nghiệm Người dùng (System Stabilization)

- [x] Chuẩn hóa toàn bộ thông báo hệ thống (**Toast Messages**) sang tiếng Việt chuyên nghiệp.
- [x] Kiểm tra và xác nhận tính ổn định của API đổi mật khẩu và bảo mật người dùng.
- [x] Rà soát và đồng bộ hóa ngôn ngữ (Success -> Thành công, Error -> Lỗi) trên toàn bộ ứng dụng.
- [x] Nâng cấp độ mạnh mật khẩu (**Strong Password Policy**): Tối thiểu 8 ký tự, bao gồm chữ hoa, chữ thường và số.
- [x] Tự động hóa việc băm mật khẩu (Hashing) khi cập nhật tài khoản từ trang Quản trị.

---

## 🚀 Giai đoạn 15: Hoàn thiện & Nâng cấp Chuyên sâu (Advanced Polish)

- [x] Nghiên cứu và triển khai tính năng **Quên mật khẩu (Forgot Password)** qua Email.
- [x] Tích hợp **Socket.io** để cập nhật thông báo đơn hàng mới Real-time cho Admin.
- [x] Tối ưu hóa hiệu suất tải trang với **Lazy Loading** hình ảnh.
- [x] Xây dựng hệ thống **Ghi log (Logging)** các hoạt động quản trị quan trọng.

---

## 🚀 Giai đoạn 16: Tối ưu Bảo mật, Kiểm thử Ổn định & Nâng cấp Trải nghiệm Tinh tế

- [x] **Bảo mật API:** Tích hợp bộ lọc Rate Limiting tại Backend cho các endpoint nhạy cảm (Login, Register, Send OTP, Reset/Change Password) chống brute-force và spam.
- [x] **Tinh chỉnh Vi tương tác (Micro-interactions):** Bổ sung hiệu ứng CSS hover/transition mượt mà cho giỏ hàng và các Modal.
- [x] **Báo cáo PDF:** Bổ sung tính năng "Xuất PDF" báo cáo doanh thu trực quan trên Admin Dashboard.
- [x] **Rà soát hệ thống:** Kiểm tra độ ổn định của kết nối Socket.io và xử lý các ngoại lệ gửi mail (Nodemailer).

---

## 🚀 Giai đoạn 17: Thông báo Trạng thái Đơn hàng thời gian thực hai chiều (Real-time Order Status Updates for Customers)

- [x] **Socket.io Rooms cho Khách hàng:** Triển khai cơ chế phân phòng theo số điện thoại (`userRoom_${userPhone}`) của người dùng giúp gửi nhận thông báo an toàn, bảo mật và chính xác.
- [x] **Chuyển đổi từ Polling sang Real-time:** Loại bỏ hoàn toàn cơ chế truy vấn định kỳ (Polling 3 giây/lần) cũ, thay thế bằng luồng sự kiện Socket.io thời gian thực tiết kiệm băng thông và tài nguyên CPU.
- [x] **Hiển thị Toast & Cập nhật UI Tự động:** Lắng nghe sự kiện đổi trạng thái đơn hàng để hiển thị Toast thông báo và tự động tải lại danh sách đơn hàng/tiến trình (Progress Bar Tracking) trên trang "Đơn hàng đã mua" ngay khi nhận được tín hiệu.
- [x] **Tích hợp Đồng bộ Khởi chạy/Đăng xuất:** Tự động thiết lập kết nối Socket khi mở trang hoặc đăng nhập thành công, và ngắt kết nối an toàn khi người dùng đăng xuất.

---

## 🚀 Giai đoạn 18: Trợ lý Khách hàng thông minh (Smart AI Chatbot Assistant)

- [x] **Thiết kế Giao diện Glassmorphism Premium:** Phát triển chatbot widget nổi với hiệu ứng mờ nhòe kính mờ thời thượng, bố trí góc dưới bên phải màn hình mượt mà, phản hồi responsive toàn diện.
- [x] **Đồng bộ hóa 'Thêm vào giỏ' thời gian thực:** Tích hợp nút đặt món trực tiếp ngay trong thẻ sản phẩm của hộp thoại chat, đồng bộ hoàn hảo giỏ hàng local và giỏ hàng server với cơ chế hiển thị Toast và animation lắc giỏ hàng nguyên bản.
- [x] **Tra cứu đơn hàng qua timeline trực quan:** Hỗ trợ khách hàng (cả tài khoản đăng nhập lẫn khách vãng lai qua số điện thoại) tra cứu trạng thái đơn hàng real-time, biểu diễn tiến trình dạng Timeline sắc sảo.
- [x] **Phản hồi tự động qua bộ từ khóa thông minh:** Tự động phản hồi nhanh chóng và chính xác các thắc mắc phổ biến của người dùng về thời gian mở cửa, địa chỉ chi nhánh, chính sách freeship, cách đặt hàng cùng hiệu ứng gõ chữ sinh động.

---

## ✅ Giai đoạn 19: Triển khai Hệ thống Live Chat trực tiếp Khách hàng - Nhân viên thời gian thực (Real-time Live Chat Escalation System)

- [x] **Quản lý phiên chat In-Memory (Backend):** Lưu trữ động trạng thái các phiên chat trực tiếp (`waiting`, `active`, `ended`) kèm đầy đủ lịch sử hội thoại trên máy chủ.
- [x] **Cổng socket Live Chat đa hướng:** Thiết lập cổng giao tiếp Socket.io thời gian thực kết nối luồng tin nhắn hai chiều giữa khách hàng và nhân viên hỗ trợ trực tuyến.
- [x] **Giao diện Admin Chat Panel Premium:** Thiết kế Split-Pane kính mờ (Glassmorphism) sang xịn mịn, tích hợp hiệu ứng nhấp nháy Pulse báo hiệu phiên đang chờ tiếp nhận và bong bóng tin nhắn phân màu trực quan.
- [x] **Tích hợp logic điều khiển Client & Admin:** Nâng cấp AI Chatbot để chuyển đổi mượt mà sang chế độ Gặp nhân viên, tự động thu thập thông tin khách hàng vãng lai, chuyển đổi luồng tin nhắn qua cổng socket và dễ dàng đóng phiên kết nối trả về cho Trợ lý ảo.

---

## ✅ Giai đoạn 20: Chuẩn hóa ngữ nghĩa HTML & Tối ưu hóa Form Trực quan (HTML Semantic Cleanups & Autofill Standards)

- [x] **Dọn dẹp cảnh báo cú pháp/ngữ nghĩa:** Phân tích cấu trúc các biểu mẫu (Đăng nhập, Đăng ký, Khôi phục mật khẩu, Đổi mật khẩu) và sửa đổi triệt để các thuộc tính `for` của `<label>` bị trống hoặc lệch `id` của `<input>`.
- [x] **Giải quyết xung đột ID giữa các Modal:** Tách biệt và chỉnh sửa `for` của label Số điện thoại và Mật khẩu ở form Đăng nhập để trỏ đúng `id="phone-login"` và `id="password-login"`, không còn bị trỏ lệch sang các trường của form Đăng ký.
- [x] **Tích hợp Autocomplete nâng cao:** Bổ sung thuộc tính `autocomplete` tiêu chuẩn cho toàn bộ trường nhập liệu (`autocomplete="name"`, `autocomplete="tel"`, `autocomplete="email"`, `autocomplete="current-password"`, `autocomplete="new-password"`, `autocomplete="one-time-code"`) giúp cải thiện tính bảo mật, hỗ trợ trình duyệt tự động điền cực kỳ tiện lợi.
- [x] **Đồng bộ hóa ID & Name hợp lệ:** Thiết lập đầy đủ thuộc tính `id` và `name` đồng bộ trên toàn bộ các ô nhập dữ liệu, loại bỏ hoàn toàn các lỗi cảnh báo trong tab "Issues" của Chrome Developer Tools, đảm bảo chuẩn SEO và khả năng truy cập cao.

---

## ✅ Giai đoạn 21: Sửa lỗi phân quyền Voucher & Tối ưu hóa API Client-Side Error handling (Voucher RBAC Fix & Client Error Handling)

- [x] **Sửa lỗi Phân quyền (RBAC Fix):** Thay thế `isAdmin` bằng `isStaffOrAdmin` cho các API quản lý mã giảm giá (`POST`, `PUT`, `DELETE` /api/vouchers) trên Backend để tài khoản Nhân viên (Staff, e.g. Nguyễn Văn Ngân SĐT 0345975990) có thể tạo, tắt/bật (toggle) và xóa mã giảm giá đồng bộ với giao diện Admin Panel.
- [x] **Cải thiện Xử lý Lỗi Client-Side:** Cập nhật `api.js` (`updateVoucherStatus`, `deleteVoucher`) để ném ra lỗi rõ ràng khi phản hồi HTTP từ Server không phải là 2xx (response.ok = false).
- [x] **Tương tác Toast Message Chính xác:** Cập nhật `admin.js` (`toggleVoucher`, `deleteVoucher`) để bắt lỗi và hiển thị chính xác thông báo lỗi cụ thể từ Server thay vì luôn hiển thị thông báo "Thành công" giả.

---

## ✅ Giai đoạn 22: Giới hạn nghiêm ngặt quyền hạn Nhân viên (Strict Staff Permissions Restriction)

- [x] **Giới hạn menu hiển thị:** Ẩn toàn bộ các tab quản lý khác trên thanh Sidebar (Dashboard, Sản phẩm, Danh mục, Tài khoản, Nhập kho, Khuyến mãi, Thống kê, Đánh giá, Nhật ký hệ thống). Chỉ cho phép Nhân viên (Staff, userType = 2) nhìn thấy và truy cập hai tab là **Đơn hàng** (Index 4) và **Hỗ trợ trực tuyến** (Index 10).
- [x] **Cải thiện Điều hướng Tự động:** Xử lý triệt để việc gỡ bỏ lớp `active` mặc định của trang tổng quát khi Nhân viên tải trang lần đầu, đảm bảo giao diện luôn tự động chuyển trực tiếp sang trang **Đơn hàng** cùng tiêu đề header đồng bộ.
- [x] **Thắt chặt Bảo mật API Backend:** Khôi phục middleware bảo vệ `isAdmin` cho toàn bộ các API quản lý mã giảm giá (`GET`, `POST`, `PUT`, `DELETE` /api/vouchers) và API quản lý đánh giá của Admin (`GET` /api/admin/reviews), ngăn chặn tuyệt đối việc Nhân viên cố tình gửi yêu cầu trực tiếp qua cổng API.
- [x] **Hiển thị chức vụ động:** Cập nhật vùng thông tin cá nhân ở góc trên bên phải để hiển thị chính xác chức vụ của tài khoản đăng nhập bên dưới tên (ví dụ: hiển thị "Nhân viên" cho Staff và "Quản trị viên" cho Admin) thay vì luôn hiển thị cứng chữ "Người quản lý".

---

## ✅ Giai đoạn 23: Triển khai Giao diện Điều Khoản & Chính Sách Người Dùng Toàn Diện (Comprehensive Website Policy Implementation)

- [x] **Tích hợp Modal Điều Khoản & Chính Sách Glassmorphism:** Phát triển modal chính sách cao cấp với hiệu ứng mờ nhòe kính mờ thời thượng (`backdrop-filter: blur(15px)`), góc bo mềm mại và đổ bóng sâu, cấu trúc nội dung khoa học chuẩn quy định thương mại điện tử gồm 4 mục chính (Bảo mật, Đặt hàng, Giao nhận, Khuyến mãi).
- [x] **Hỗ trợ Đa Điểm Kích Hoạt (Multi-Trigger Integration):** Đồng bộ hóa việc kích hoạt modal tại tất cả các điểm chạm khách hàng: Liên kết "Chính sách" trên thanh điều hướng đầu trang (Header), nút "Điều khoản" ở chân trang (Footer), và liên kết "chính sách trang web" ngay trong form Đăng ký tài khoản.
- [x] **Tối ưu Hóa Trải Nghiệm Điều Khiển (UX Control Optimization):** Ngăn chặn hoàn toàn hiện tượng điều hướng sai hướng (hủy liên kết `#` mặc định), ngăn chặn sự kiện nổi bọt ảnh hưởng đến các ô nhập liệu khác, tích hợp cơ chế đóng linh hoạt qua cả nút "Đồng ý & Đóng" lẫn biểu tượng "X" truyền thống.
- [x] Responsive & Customized Scrollbar: Cấu hình thanh cuộn tùy chỉnh siêu mỏng mang tính thẩm mỹ cao và tương thích tối đa với mọi độ phân giải màn hình từ máy tính để bàn đến các thiết bị di động thông minh.

---

## ✅ Giai đoạn 24: Sửa lỗi hiển thị Banner Trang chủ & Chặn trùng lặp Sản phẩm/Danh mục (Banner Path Fix & Duplicate Validation)

- [x] **Sửa lỗi Banner trắng ở Trang chủ:** Chuyển đổi toàn bộ đường dẫn tuyệt đối `/assets/` thành đường dẫn tương đối `./assets/` trong `index.html`, `admin.html` và `checkout.js`.
- [x] **Khắc phục lỗi trễ tải ảnh Banner (Lazy-loading above-the-fold):** Thay thế `loading="lazy"` thành `fetchpriority="high"` cho slide ảnh đầu tiên (`banner-6.png`) giúp loại bỏ hiện tượng hiển thị khung trắng khi tải trang.
- [x] **Kiểm tra trùng lặp Danh mục (Duplicate Category Validation):** Tích hợp kiểm tra trùng lặp tên danh mục (không phân biệt hoa thường và khoảng trắng thừa) khi thêm mới hoặc chỉnh sửa danh mục cả ở phía Server (`POST` & `PUT` `/api/categories`) và Client.
- [x] **Kiểm tra trùng lặp Sản phẩm (Duplicate Product Validation):** Tích hợp kiểm tra trùng lặp tên món ăn (không phân biệt hoa thường và khoảng trắng thừa) khi thêm mới hoặc chỉnh sửa món ăn cả ở phía Server (`POST` & `PUT` `/api/products`) và Client.
- [x] **Cập nhật hiển thị lỗi trực quan:** Cải tiến khối `catch` trong file `admin.js` để bắt và hiển thị chính xác thông báo lỗi trùng lặp từ Server qua hệ thống Toast.

---
*Cập nhật lần cuối: 18/05/2026 bởi thaingan & AI Assistant.*

---

## ✅ Giai đoạn 25: Căn chỉnh & Tối ưu hóa Giao diện Form Nhập kho và Khuyến mãi (Stock In & Voucher Forms UI/UX Polish)

- [x] **Thiết kế lại Modal Nhập kho (Stock In Form):** Mở rộng kích thước modal đạt chuẩn `480px`, bo tròn góc `16px` cực kỳ hiện đại, giãn cách các dòng `margin-bottom: 20px` rộng rãi, xóa bỏ tình trạng nhãn và ô nhập liệu chạm nhau.
- [x] **Đồng bộ hóa Modal Khuyến mãi (Voucher Form):** Tạo kiểu đồng bộ với giao diện Nhập kho mới, định hình phông nền slate nhạt thời thượng, bo viền tinh tế và tối ưu hiển thị ô nhập liệu/nút lưu.
- [x] **Tinh chỉnh Nút xác nhận & Hiệu ứng hover:** Loại bỏ thuộc tính căn giữa tuyệt đối thủ công, tối ưu nút bấm full-width với hiệu ứng bóng mờ `box-shadow` nổi bật, tích hợp chuyển động hover mượt mà và chuyển màu êm ái.
- [x] **Kiểm thử giao diện tự động:** Xác nhận tính ổn định và thẩm mỹ của form Nhập kho qua trình duyệt tự động và lưu trữ ảnh chụp màn hình kiểm chứng.

---

## ✅ Giai đoạn 26: Tích hợp mã QR Thanh toán Động (Dynamic QR Payment Integration)

- [x] **Mã QR động tại màn hình Checkout:** Tích hợp sinh mã QR thanh toán động cho cả VNPAY (qua VietQR API ngân hàng MB) và MoMo (qua link nhantien.momo.vn) dựa trên tổng số tiền thực tế của đơn hàng (sau khi cộng phí ship, áp mã giảm giá).
- [x] **Mã QR động tại Modal mô phỏng thanh toán:** Cập nhật màn hình popup mô phỏng thanh toán khi nhấn đặt hàng bằng thẻ online để tự động điền số tiền và nội dung chuyển khoản động theo thông tin đơn hàng.
- [x] **Nội dung chuyển khoản tùy biến và tự động:** Tự động tạo nội dung chuyển khoản dạng `TiMiFood <Số điện thoại>` (không chứa dấu và ký tự đặc biệt) đồng thời tự động cập nhật lại mã QR bất cứ khi nào khách hàng nhập/thay đổi Số điện thoại người nhận.

---

## ✅ Giai đoạn 27: Tích hợp Cổng Thanh toán PayOS Thực tế & Webhook Tự động (PayOS Real Payment Gateway Integration)

- [x] **Tích hợp PayOS SDK (@payos/node):** Cài đặt và cấu hình thư viện `@payos/node` v2.x, khởi tạo SDK có điều kiện dựa trên biến môi trường với cơ chế graceful fallback.
- [x] **API tạo liên kết thanh toán (POST /api/payos/create-payment-link):** Endpoint bảo mật (JWT) nhận orderId, amount, description để trả về `checkoutUrl` và `qrCode` thật từ PayOS.
- [x] **API Webhook (POST /api/payos/webhook):** Endpoint nhận kết quả thanh toán từ PayOS, xác minh chữ ký, cập nhật trạng thái đơn hàng, gửi thông báo và email tự động.
- [x] **Nâng cấp luồng Checkout Online:** Đơn hàng được lưu vào DB trước, sau đó gọi API PayOS. Thành công → hiển thị QR thật + nút mở cổng thanh toán. Thất bại → fallback mô phỏng + banner cảnh báo vàng.
- [x] **Trang kết quả thanh toán:** Tạo `checkout-success.html` và `checkout-cancel.html` với giao diện cao cấp.
- [x] **Cấu hình .env mẫu:** Bổ sung placeholder cho 3 key PayOS kèm hướng dẫn.
- [x] **Cập nhật api.js:** Thêm hàm `createPayOSPaymentLink` vào `window.api`.
- [x] **Cập nhật server.js:** Trả về `orderId` trong response của `createOrder` để client sử dụng.

---

## ✅ Giai đoạn 28: Tối ưu Bảo mật & Refactor Code (Security Hardening & Code Cleanup)

- [x] **Di chuyển SECRET_KEY vào biến môi trường:** Chuyển khóa bí mật JWT từ hardcode trong `server.js` sang file `.env` (`JWT_SECRET`), tăng cường bảo mật và linh hoạt khi triển khai.
- [x] **Cải thiện cấu hình CORS:** Nâng cấp từ `origin: "*"` tĩnh sang đọc từ biến môi trường `CORS_ORIGIN`, hỗ trợ cấu hình nhiều domain bằng dấu phẩy, sẵn sàng cho triển khai production.
- [x] **Xóa route trùng lặp (Dead Code):** Phát hiện và loại bỏ route `DELETE /api/orders/:id` bị trùng lặp (dead code — không bao giờ được thực thi do Express ưu tiên route đăng ký trước).
- [x] **Thêm scripts NPM tiêu chuẩn:** Bổ sung `npm start` và `npm run dev` vào `package.json` thay vì chạy thủ công `node server.js`.
- [x] **Tạo file `.env.example`:** Cung cấp file mẫu cấu hình biến môi trường với hướng dẫn chi tiết bằng tiếng Việt, giúp cài đặt nhanh chóng khi clone dự án.
- [x] **Tách `server.js` thành modules:** Giảm từ 2109 dòng → 1713 dòng bằng cách tách:
  - `src/middleware/auth.js` — JWT authentication, phân quyền Admin/Staff
  - `src/middleware/rateLimiter.js` — Rate limiting cho login, OTP, đăng ký, đổi mật khẩu
  - `src/helpers/email.js` — Nodemailer transporter & gửi email đơn hàng
  - `src/helpers/notification.js` — Tạo thông báo + phát Socket.io real-time
  - `src/helpers/logger.js` — Ghi log hoạt động hệ thống
  - `src/socket/handlers.js` — Socket.io handlers & Live Chat sessions

---

## ✅ Giai đoạn 29: Tối ưu SEO & Meta Tags (SEO Optimization)
>
> **Độ khó:** ⭐ | **Thời gian ước tính:** ~1 giờ

- [x] **Meta Tags đầy đủ:** Thêm `<meta description>`, `<meta keywords>`, Open Graph (`og:title`, `og:description`, `og:image`), Twitter Card cho trang chủ và trang admin.
- [x] **Cấu trúc Heading chuẩn SEO:** Đảm bảo mỗi trang chỉ có 1 thẻ `<h1>`, sử dụng phân cấp `<h2>`, `<h3>` hợp lý.
- [x] **Tạo `robots.txt`:** Cho phép crawler index trang chủ, chặn trang admin và API.
- [x] **Tạo `sitemap.xml`:** Liệt kê các trang chính của website.
- [x] **Favicon chuẩn đa kích thước:** Thêm favicon `16x16`, `32x32`, `180x180` (Apple Touch Icon) và `192x192` (Android).
- [x] **Nén tài nguyên (Gzip/Compression):** Thêm middleware `compression` vào Express để giảm dung lượng response.

---

## ✅ Giai đoạn 30: Trang Giới thiệu & Liên hệ (About Us & Contact Page)
>
> **Độ khó:** ⭐⭐ | **Thời gian ước tính:** 2-3 giờ

- [x] **Trang Giới thiệu (`about.html`):** Thiết kế trang "Về chúng tôi" với câu chuyện thương hiệu TiMiFood, sứ mệnh, tầm nhìn, đội ngũ — phong cách Premium Glassmorphism.
- [x] **Trang Liên hệ (`contact.html`):** Form liên hệ gửi email qua API, nhúng Google Maps, hiển thị thông tin chi nhánh, số hotline.
- [x] **Hiệu ứng Scroll Animation:** Sử dụng Intersection Observer API để tạo hiệu ứng fade-in, slide-up khi cuộn trang.
- [x] **Cập nhật Navigation:** Thêm link "Giới thiệu" và "Liên hệ" vào footer (theo yêu cầu không thêm vào trang chủ header).

---

## ✅ Giai đoạn 31: Nâng cấp trang Đơn hàng Khách hàng (Customer Order History Upgrade)
>
> **Độ khó:** ⭐⭐ | **Thời gian ước tính:** 2-3 giờ

- [x] **Giao diện Card Timeline:** Thiết kế lại trang "Đơn hàng đã mua" sang dạng card timeline đẹp mắt, hiện đại hơn.
- [x] **Bộ lọc trạng thái:** Thêm tab/filter lọc theo trạng thái (Tất cả / Chờ xử lý / Đang giao / Hoàn thành / Đã hủy).
- [x] **Tìm kiếm đơn hàng:** Ô tìm kiếm theo mã đơn hàng (`DH001`, `DH002`...).
- [x] **Tổng chi tiêu tích lũy:** Hiển thị tổng số tiền khách hàng đã chi qua tất cả đơn hàng hoàn thành.
- [x] **Nút Đặt lại (Re-order):** Cho phép khách hàng đặt lại toàn bộ món ăn từ đơn hàng cũ với 1 click.

---

## ✅ Giai đoạn 32: Sản phẩm Yêu thích — Wishlist (Favorites / Wishlist Feature)
>
> **Độ khó:** ⭐⭐ | **Thời gian ước tính:** 2-3 giờ

- [x] **Nút ❤️ trên thẻ sản phẩm:** Thêm icon trái tim trên mỗi card sản phẩm, toggle yêu thích/bỏ yêu thích.
- [x] **Bảng `Favorites` trong Database:** Tạo bảng lưu trữ wishlist (`userPhone`, `productId`, `addedAt`).
- [x] **API Wishlist (CRUD):** Endpoints: GET danh sách yêu thích, POST thêm, DELETE xóa.
- [x] **Trang/Mục Yêu thích:** Hiển thị danh sách sản phẩm yêu thích riêng của từng khách hàng với nút "Thêm vào giỏ hàng nhanh".

---

## ✅ Giai đoạn 33: Lịch sử Chat & Lưu trữ Database (Chat History Persistence)
>
> **Độ khó:** ⭐⭐⭐ | **Thời gian ước tính:** 3-4 giờ

- [x] **Bảng `ChatSessions` + `ChatMessages`:** Tạo cấu trúc database lưu trữ phiên chat và tin nhắn, thay thế in-memory hiện tại.
- [x] **Lưu trữ tự động:** Mọi tin nhắn Live Chat được ghi vào DB song song với broadcast Socket.io.
- [x] **Admin xem lại lịch sử chat:** Giao diện cho Admin duyệt lại các phiên hỗ trợ cũ theo ngày, SĐT khách hàng.
- [x] **Thống kê hỗ trợ:** Dashboard hiển thị: Tổng phiên chat / Thời gian phản hồi trung bình / Nhân viên xử lý nhiều nhất.

---

## ✅ Giai đoạn 34: Tái cấu trúc thư mục dự án (Project Restructuring)
>
> **Độ khó:** ⭐⭐ | **Thời gian ước tính:** 1-2 giờ

- [x] **Phân tách Frontend & Backend:** Tách biệt hoàn toàn mã nguồn Frontend (HTML, CSS, JS, Assets) và Backend (Node.js, Cấu hình, Models, Routes) thành 2 thư mục riêng rẽ (`frontend/` và `backend/`).
- [x] **Cập nhật Server Path:** Cấu hình lại Express tĩnh (`express.static`) để trỏ đến đúng thư mục `frontend` mới.
- [x] **Tối ưu Package.json:** Cập nhật script khởi động `npm start` để tự động chạy file `server.js` từ thư mục backend, giúp việc chạy dự án vô cùng mượt mà mà không ảnh hưởng tới biến môi trường `.env`.

## ✅ Giai đoạn 35: Tích hợp Đăng nhập bằng Google (Google OAuth2)
>
> **Độ khó:** ⭐⭐⭐ | **Thời gian ước tính:** 2-3 giờ

- [x] **Cài đặt thư viện:** Bổ sung gói `google-auth-library` để backend có khả năng giải mã và xác thực an toàn chuỗi JWT từ Google gửi sang.
- [x] **Giao diện chuẩn Google:** Tích hợp `accounts.google.com/gsi/client` để render nút "Đăng nhập với Google" / "Đăng ký với Google" tự động dưới form đăng nhập/đăng ký, kèm hiệu ứng hover và nhận diện thương hiệu chuẩn xác từ Google.
- [x] **Luồng xử lý linh hoạt (Social Login Flow):**
  - Khi khách hàng nhấn vào Google Login, Backend sẽ xác thực JWT token.
  - Nếu Email Google **đã tồn tại** trong hệ thống -> Tạo Token nội bộ (TiMiFood Token) và tự động đăng nhập mượt mà.
  - Nếu Email Google **chưa từng tồn tại** -> Hiển thị Modal phụ: "Hoàn tất đăng ký". Ở bước này, do Google không cấp Số điện thoại, hệ thống yêu cầu khách hàng nhập Số điện thoại lần đầu để định danh cho mọi đơn hàng sau này. Hệ thống hiển thị luôn cả Avatar, Tên và Email lấy từ Google để xác nhận.
- [x] **Bảo mật biến môi trường:** Bổ sung trường `GOOGLE_CLIENT_ID` vào `.env` và `.env.example` để người dùng có thể linh hoạt gắn key Google Cloud Console thật.

## ✅ Giai đoạn 36: Tích hợp Đăng nhập bằng Facebook (Facebook Login)
>
> **Độ khó:** ⭐⭐⭐ | **Thời gian ước tính:** 2 giờ

- [x] **Tích hợp SDK Facebook:** Thêm SDK JS của Facebook vào giao diện người dùng.
- [x] **Nút Đăng nhập/Đăng ký:** Bổ sung nút Facebook kế bên nút Google.
- [x] **Xác thực Backend (Axios):** Sử dụng Axios để gọi API Graph Facebook nhằm xác thực token an toàn.
- [x] **Luồng hoàn tất Đăng ký:** Tạo form phụ nhập Số điện thoại đối với tài khoản Facebook mới lần đầu đăng nhập.

---

## 🌍 Giai đoạn 37: Đa ngôn ngữ (i18n) với Google Translate API
>
> **Độ khó:** ⭐⭐ | **Thời gian ước tính:** 1 giờ

- [x] **Tích hợp Google Translate API:** Khởi tạo bộ máy dịch tự động của Google vào hệ thống.
- [x] **Giao diện Dropdown Tùy chỉnh:** Thiết kế lại hoàn toàn menu chọn ngôn ngữ sao cho đồng bộ với thiết kế Premium của TiMiFood.
- [x] **Hỗ trợ 6 Ngôn ngữ:** Cấu hình chuyển đổi linh hoạt giữa Tiếng Việt, Tiếng Anh, Tiếng Trung, Tiếng Hàn, Tiếng Nhật và Tiếng Pháp.
- [x] **Cookie Management:** Quản lý cookie `googtrans` để tự động kích hoạt ngôn ngữ dựa trên lựa chọn của người dùng.

---

## 🧪 Giai đoạn 38: Kiểm thử Tự động (Automated Testing Framework)
>
> **Độ khó:** ⭐⭐⭐ | **Thời gian ước tính:** 2 giờ

- [x] **Cài đặt Môi trường:** Tích hợp `jest` và `supertest` làm devDependencies.
- [x] **Cấu hình Package.json:** Tạo script `npm test` chuyên dụng để chạy kiểm thử.
- [x] **API Integration Tests:** Xây dựng kịch bản kiểm thử (Test Suites) cho các API cốt lõi như Lấy danh sách sản phẩm, Lấy danh mục và Đăng nhập.
- [x] **Xác thực tự động:** Đảm bảo hệ thống trả về đúng HTTP Status Code (200, 401) và cấu trúc dữ liệu theo thiết kế chuẩn.

---
*Cập nhật lần cuối: 23/05/2026 bởi thaingan & AI Assistant.*
