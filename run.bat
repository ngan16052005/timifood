@echo off
color 0A
echo =======================================================
echo     TIMIFOOD - JAVA SPRING BOOT SERVER
echo =======================================================
echo.
echo Dang khoi dong may chu (Backend + Frontend)...
echo Vui long doi khoang 5-10 giay de he thong tai xong.
echo.

:: Chuyển vào thư mục backend và chạy server (mở cửa sổ mới)
cd backend-spring
start "TiMiFood Server" cmd /c "mvnw.cmd spring-boot:run"

:: Đợi 8 giây để server khởi động xong
timeout /t 8 /nobreak > nul

:: Tự động mở trình duyệt web
echo Mo trinh duyet web...
start http://localhost:8080

echo.
echo Hoan tat! De tat server, hay dong cua so "TiMiFood Server".
pause
