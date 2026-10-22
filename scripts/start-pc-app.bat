@echo off
chcp 65001 > nul
echo ==============================================================================
echo 🏬 PGDSHOP - KHỞI ĐỘNG ỨNG DỤNG MÁY TÍNH (PC DESKTOP APP)
echo ==============================================================================
echo.

cd /d "%~dp0\.."

:: 1. Khởi động Web Server ngầm trên máy PC
echo 🚀 Đang khởi động Server POS nội bộ (Port 3000)...
start /b cmd /c "npm run dev"

:: Đợi 2 giây cho Server sẵn sàng
timeout /t 2 /nobreak > nul

:: 2. Khởi động Ứng dụng Desktop (Chromium App Mode)
echo 💻 Đang mở giao diện App Thu Ngân trên màn hình chính...
if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" (
    start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --app=http://localhost:3000
) else if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --app=http://localhost:3000
) else (
    start http://localhost:3000
)

echo.
echo ✅ ĐÃ MỞ APP THÀNH CÔNG!
echo 💡 Để mở màn hình phụ hướng ra khách hàng: Nhấn nút 'Mở Màn Hình Phụ (CFD)' trong App Thu Ngân.
echo ==============================================================================
