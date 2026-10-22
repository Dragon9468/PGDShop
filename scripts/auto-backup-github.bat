@echo off
chcp 65001 > nul
echo ===================================================
echo 🔄 PGDSHOP - TỰ ĐỘNG SAO LƯU CODE LÊN GITHUB
echo ===================================================

cd /d "%~dp0\.."

:: Lấy thời gian hiện tại
set "datetime=%date% %time%"

:: Kiểm tra git status
echo 🔍 Đang kiểm tra thay đổi mã nguồn...
git status -s

echo 📦 Đang đưa thay đổi vào Git Stage (git add .)...
git add .

echo 📝 Đang tạo bản sao lưu commit...
git commit -m "Auto backup: %datetime% - PGDShop POS Updates"

echo 🚀 Đang đẩy dữ liệu lên GitHub (git push)...
git push origin main || git push origin master

echo.
echo ✅ Hoàn tất sao lưu mã nguồn lên GitHub thành công lúc %datetime%!
echo ===================================================
timeout /t 5
