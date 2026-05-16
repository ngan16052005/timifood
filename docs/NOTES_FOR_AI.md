# 🧠 Lưu ý dành cho AI Assistant (Antigravity)

File này chứa các quy tắc, phong cách lập trình và những lưu ý quan trọng từ người dùng dành cho AI để đảm bảo sự đồng bộ và hiệu quả trong quá trình phát triển dự án TiMiFood.

---

## 🚀 Quy tắc chung
- **Giao diện (UI/UX):** Luôn ưu tiên sự hiện đại, tinh tế (Premium). Sử dụng các hiệu ứng mượt mà (micro-animations), màu sắc hài hòa và bố cục cân đối. Không làm các giao diện đơn giản quá mức.
- **Bảo mật:** Không bao giờ lưu mật khẩu (kể cả hash) ở client-side. Mọi thao tác nhạy cảm phải qua xác thực server-side.
- **Cấu trúc mã:** Giữ mã nguồn sạch sẽ, có comment giải thích các logic phức tạp. Đảm bảo tính đồng bộ giữa các file (ví dụ: Sidebar index phải khớp với HTML section index).

## 🛠️ Công nghệ & Kỹ thuật
- **Backend:** Node.js, Express, SQL Server (mssql).
- **Frontend:** Vanilla JS, HTML5, CSS3.
- **Dữ liệu:** Luôn ưu tiên lấy dữ liệu động từ Database thay vì hardcode.

## 📝 Ghi chú riêng từ người dùng
**Không được xoá code khi chưa kiểm tra kỹ lưỡng.Không được tự ý thay đổi cấu trúc HTML, CSS, JS khi chưa có sự cho phép của người dùng, luôn thông báo cho người dùng khi thực hiện thay đổi lớn, luôn hỏi lại khi không chắc chắn.**
**Luôn giao tiếp với người dùng bằng Tiếng Việt.**
**Luôn ưu tiên sửa đổi code trực tiếp và giữ nguyên cấu trúc, không tạo code mới nếu không cần thiết.**
**Luôn cập nhật các file .md trong quá trình phát triển và khi hoàn thành, đặc biệt là file TASKS.md và SCRATCH.md**
**Luôn ưu tiên các thay đổi nhỏ và dần dần để người dùng dễ kiểm soát, không thực hiện thay đổi lớn.**
**Luôn giữ nguyên style và giao diện của các component, không thay đổi style và giao diện của các component khi chưa có sự cho phép của người dùng.**
**Luôn cập nhật dự án lên github sau mỗi lần hoàn thành và có thông báo cho người dùng.**
**Luôn kiểm tra lại code sau khi hoàn thành và đảm bảo không có lỗi.**
*Cập nhật lần cuối: 16/05/2026*
