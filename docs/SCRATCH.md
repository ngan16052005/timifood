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

---
*Cập nhật lần cuối: 18/05/2026 bởi thaingan & AI Assistant.*
