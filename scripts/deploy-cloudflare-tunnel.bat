@echo off
chcp 65001 > nul
echo ==============================================================================
echo 🌐 PGDSHOP - HƯỚNG DẪN VÀ CHẠY CLOUDFLARE TUNNEL (DEPLOY WEB TỪ MÁY PC)
echo ==============================================================================
echo.
echo Hệ thống này giúp máy tính PC tại cửa hàng trở thành Server phát Web POS
echo ra Internet an toàn thông qua Cloudflare Tunnel:
echo  - KHÔNG cần mở cổng Router (No Port Forwarding)
echo  - KHÔNG cần IP tĩnh (Hỗ trợ mạng 4G/Wifi gia đình)
echo  - Tự động có HTTPS/SSL bảo mật miễn phí từ Cloudflare
echo  - Gắn trực tiếp Domain riêng của bạn (VD: pos.cuahangcuaban.com)
echo.
echo ==============================================================================
echo CÁC BƯỚC THIẾT LẬP LẦN ĐẦU:
echo 1. Tải cloudflared cho Windows: https://github.com/cloudflare/cloudflared/releases
echo    (Đặt file cloudflared.exe vào thư mục này hoặc C:\Windows\System32)
echo 2. Đăng nhập Cloudflare: 
echo    cloudflared tunnel login
echo 3. Tạo Tunnel mới (ví dụ tên pgdshop):
echo    cloudflared tunnel create pgdshop
echo 4. Gắn domain (Ví dụ pos.cuahang.vn):
echo    cloudflared tunnel route dns pgdshop pos.cuahang.vn
echo ==============================================================================
echo.

:: Kiểm tra xem cloudflared đã có chưa
where cloudflared >nul 2>nul
if %errorlevel% neq 0 (
    echo ⚠️ Chưa tìm thấy cloudflared trong hệ thống.
    echo 💡 Đang thử chạy chế độ Quick Tunnel tạm thời (không cần cấu hình):
    echo.
    echo Bấm phím bất kỳ để tải nhanh hoặc nhập lệnh chạy sau khi cài đặt...
    pause
    exit /b
)

echo 🚀 Đang khởi chạy Cloudflare Tunnel kết nối tới Web POS (localhost:3000)...
cloudflared tunnel --url http://localhost:3000
pause
