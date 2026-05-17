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

---
*Cập nhật lần cuối: 17/05/2026 bởi thaingan & AI Assistant.*
