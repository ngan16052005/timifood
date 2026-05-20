# 📝 SCRATCHPAD - Ghi chép nháp TiMiFood

File này dùng để lưu trữ các ý tưởng, đoạn code nháp, hoặc các ghi chú tạm thời trong quá trình phát triển dự án.

---

## 💡 Ý tưởng hiện tại
- [x] Triển khai hệ thống Live Chat Hybrid (AI Chatbot kết hợp Live Chat Nhân viên thời gian thực).
- [x] Quản lý phiên chat bằng Socket.io rooms, đồng bộ dữ liệu active chats qua API và luồng Socket.
- [x] Xây dựng UI Chat Panel cho Nhân viên/Admin: Split-Pane, Pulse notifications, Glassmorphism.
- [x] Xây dựng UI Chatbot Client: Nút gợi ý "Gặp nhân viên", hỏi thông tin vãng lai (Phone/Name), thoát phiên.
- [x] Dọn dẹp cảnh báo cú pháp/ngữ nghĩa HTML, chuẩn hóa label for và autocomplete cho toàn bộ form trong index.html và admin.html.

## 🛠️ Code nháp / Snippets
*   **API Route:** `GET /api/livechats` (Trả về các phiên hỗ trợ trực tuyến đang hoạt động)
*   **Socket.io Client Events:**
    *   `client_request_live_chat` (Gửi từ khách hàng để yêu cầu hỗ trợ)
    *   `staff_join_chat` (Gửi từ nhân viên để nhận phiên và phản hồi khách hàng)
    *   `send_chat_message` (Gửi tin nhắn qua lại trong room)
    *   `end_live_chat` (Đóng phiên, chuyển lại về chế độ AI Assistant)

## 📌 Ghi chú chuẩn hóa Form HTML (Chrome DevTools Issues):
*   Sử dụng thuộc tính `autocomplete` tiêu chuẩn:
    *   SĐT: `autocomplete="tel"`
    *   Họ tên: `autocomplete="name"`
    *   Email: `autocomplete="email"`
    *   Mật khẩu hiện tại: `autocomplete="current-password"`
    *   Mật khẩu mới / Đăng ký: `autocomplete="new-password"`
    *   Mã OTP: `autocomplete="one-time-code"`
*   Luôn đảm bảo `<label for="[INPUT_ID]">` khớp hoàn hảo với `id` của `<input>` tương ứng.

## 📌 Sửa lỗi Phân quyền & Khắc phục lỗi Voucher (Voucher RBAC & UI Bugs):
*   **Nguyên nhân:** Nhân viên (Staff, userType = 2) là "Người quản lý" có quyền xem tab "Khuyến mãi" ở sidebar, nhưng các API chỉnh sửa voucher (`POST`, `PUT`, `DELETE` /api/vouchers) trên Backend lại bị chặn bởi middleware `isAdmin` (chỉ cho phép userType = 1).
*   **Đồng thời:** Client-side fetch trong `api.js` không kiểm tra `response.ok`, dẫn đến việc click Tắt/Mở voucher hoặc Xóa voucher bị lỗi 403 Forbidden nhưng vẫn hiển thị thông báo "Thành công" giả do không nhảy vào block `catch`.
*   **Giải pháp:**
    1. Cập nhật các routes voucher trên Backend sang middleware `isStaffOrAdmin`.
    2. Cập nhật `api.js` để ném ra lỗi thật khi `response.ok === false`.
    3. Cập nhật `admin.js` để bắt được lỗi cụ thể từ Server và hiển thị qua Toast.

## 📌 Giới hạn quyền hạn Nhân viên nghiêm ngặt (Strict Staff Permissions Restriction):
*   **Yêu cầu mới:** Nhân viên chỉ có quyền truy cập vào hai tab là **Đơn hàng** (Index 4) và **Hỗ trợ trực tuyến** (Index 10). Các tab khác (Dashboard, Sản phẩm, Danh mục, Tài khoản, Nhập kho, Khuyến mãi, Thống kê, Đánh giá, Nhật ký) phải bị ẩn và cấm hoàn toàn.
*   **Giải pháp đã thực hiện:**
    1. Cập nhật mảng `forbiddenForStaff` trong `admin.js` thành `[0, 1, 2, 3, 5, 6, 7, 8, 9]`.
    2. Cập nhật hàm `applyPermissions` ẩn đi toàn bộ các tab bị cấm này, đồng thời tự động chuyển tab hiển thị và tiêu đề trang sang **Đơn hàng** trên lần tải đầu tiên.
    3. Khôi phục middleware bảo vệ `isAdmin` tại Backend (`server.js`) đối với tất cả các API Vouchers (`GET`, `POST`, `PUT`, `DELETE` /api/vouchers) và API Đánh giá (`GET` /api/admin/reviews).
    4. Cập nhật `admin.js` trong sự kiện `window.onload` để tự động dò tìm phần tử `.admin-role` và gán lại nội dung tương ứng (`Quản trị viên` cho userType 1 và `Nhân viên` cho userType 2) kết hợp giữ nguyên biểu tượng chevron dropdown.

## 📌 Triển khai Giao diện Điều Khoản & Chính Sách Người Dùng Toàn Diện (Comprehensive Website Policy Implementation):
*   **Thiết kế Modal:** Sử dụng cấu trúc modal Glassmorphic kết hợp bóng mịn màng, tiêu đề header chứa icon `fa-shield-heart` thương hiệu, tích hợp thanh cuộn siêu mỏng thẩm mỹ.
*   **Hỗ trợ Trigger linh hoạt:**
    1. Liên kết "Chính sách" trên thanh điều hướng đầu trang (`header-top-right`).
    2. Nút "Điều khoản" ở chân trang (`widget-contact`).
    3. Liên kết "chính sách trang web" ngay trong form Đăng ký tài khoản (`checkbox-signup`).
*   **Logic điều khiển:** Định nghĩa hàm `openPolicyModal(event)` và `closePolicyModal(event)` trong `main.js` để kiểm soát đóng mở, dừng sự kiện nổi bọt (`event.stopPropagation()`) và ngăn ngừa chuyển hướng mặc định của liên kết (`event.preventDefault()`).

## 📌 Sửa lỗi Banner & Kiểm tra trùng lặp (Banner Path & Duplicate Validation):
*   **Sửa lỗi đường dẫn Banner:** Live Server / Custom hosts không nhận diện được `/assets/...` dạng tuyệt đối. Chuyển sang relative paths `./assets/...` sửa triệt để lỗi 404 cho Banner, Icons, Momo/VNPAY.
*   **Tránh Lazy Loading Above-The-Fold:** Banner đầu tiên hiển thị ngay lập tức nên việc để `loading="lazy"` khiến ảnh 2MB+ tải trễ, để lại khoảng trống trắng. Đã chuyển thành `fetchpriority="high"` để hiển thị tức thì.
*   **Kiểm tra trùng lặp Sản phẩm & Danh mục:**
    *   Tách biệt so sánh không phân biệt hoa thường (`LOWER`) và khoảng trắng thừa (`TRIM`).
    *   Kiểm tra trùng khi tạo mới và khi chỉnh sửa (loại trừ bản ghi hiện tại qua điều kiện `id != @id`).
    *   BBubble lỗi từ API lên và hiển thị qua Toast dạng đỏ đẹp mắt.

## 📌 Căn chỉnh & Tối ưu hóa Giao diện Form Nhập kho và Khuyến mãi (Stock In & Voucher Forms UI/UX Polish):
*   **Modal Nhập kho (Stock In):**
    *   Sửa lỗi form cũ quá chật hẹp, các nhãn dính liền ô nhập liệu gây mất thẩm mỹ.
    *   Mở rộng chiều rộng container lên `480px`, bổ sung đệm `30px`, bo tròn cực đẹp `16px`.
    *   Định dạng lại tiêu đề căn giữa chuẩn thẻ card, gạch dưới phân tách nhẹ nhàng.
    *   Cung cấp cấu hình slate nhạt cho các ô `select`, `input`, và `textarea` (cao `90px` chống resize).
    *   Thay đổi nút bấm thành full-width, di chuyển tĩnh không định vị tuyệt đối đè chồng, thêm bóng đổ đỏ tinh tế chuẩn nhận diện.
*   **Modal Khuyến mãi (Voucher):**
    *   Cập nhật cấu hình hoàn toàn đồng bộ với form Nhập kho mới, đem lại trải nghiệm quản trị thống nhất và hiện đại toàn diện.

## 📌 Tích hợp mã QR Thanh toán Động (Dynamic QR Payment Integration):
*   **Mục tiêu:** Nâng cấp hệ thống thanh toán để thay thế các ảnh QR Code tĩnh lỗi thời bằng mã QR động tạo thời gian thực, chứa chính xác số tiền cần thanh toán và nội dung chuyển khoản tự động.
*   **Giải pháp đã thực hiện:**
    1.  **VNPAY (VietQR qua Ngân hàng MB):** Sử dụng API miễn phí của VietQR (`https://img.vietqr.io/image/MB-24888816052005-qr_only.png`) để sinh mã QR động.
    2.  **MoMo (Ví điện tử):** Sử dụng dịch vụ link nhận tiền MoMo (`https://nhantien.momo.vn/0345975990/<amount>`) kết hợp API sinh QR code (`https://api.qrserver.com/`) để sinh ảnh QR khi quét sẽ mở ứng dụng MoMo và tự động điền số tiền.
    3.  **Tự động cập nhật:** Lắng nghe sự kiện thay đổi của trường Số điện thoại người nhận (`sdtnhan`) và bất kỳ sự thay đổi tổng tiền nào (cập nhật giỏ hàng, phí vận chuyển, áp dụng voucher) để tái tạo mã QR ngay lập tức, đảm bảo nội dung chuyển khoản dạng `TiMiFood <Số điện thoại>` (chuẩn hóa không dấu và ký tự đặc biệt) luôn chính xác.
    4.  **Đồng bộ hóa:** Đồng bộ hóa ảnh QR hiển thị cả trên accordion mini tại trang checkout và cửa sổ mô phỏng thanh toán trực tuyến.

---
*Cập nhật lần cuối: 20/05/2026 bởi thaingan & AI Assistant.*
