@echo off
chcp 65001 > nul
title PGDShop - Kiosk Multi-Station Launcher

echo ==============================================================================
echo             PGDSHOP - CHẠY KIOSK ĐA TRẠM MÀN HÌNH KHÁCH
echo ==============================================================================
echo.
echo Hệ thống sẽ mở các trạm Kiosk ở chế độ Toàn Màn Hình (Kiosk Mode)
echo chống khách nghịch tắt web, che hoàn toàn thanh Taskbar Windows.
echo.
echo [1] Mở Trạm 1 (Kiosk 1)
echo [2] Mở Trạm 2 (Kiosk 2)
echo [3] Mở CẢ 2 TRẠM (Trạm 1 + Trạm 2)
echo [4] Thoát
echo.

set /p choice="Nhập lựa chọn của bạn (1-4): "

if "%choice%"=="1" goto station1
if "%choice%"=="2" goto station2
if "%choice%"=="3" goto stationBoth
if "%choice%"=="4" goto end

:station1
echo Đang mở Trạm 1...
start "" "chrome.exe" --kiosk --app="http://localhost:3000/#/customer-display?station=1" --disable-pinch --overscroll-history-navigation=0
goto end

:station2
echo Đang mở Trạm 2...
start "" "chrome.exe" --kiosk --app="http://localhost:3000/#/customer-display?station=2" --disable-pinch --overscroll-history-navigation=0
goto end

:stationBoth
echo Đang mở Trạm 1 và Trạm 2...
start "" "chrome.exe" --app="http://localhost:3000/#/customer-display?station=1" --window-name="Station1"
timeout /t 2 > nul
start "" "chrome.exe" --app="http://localhost:3000/#/customer-display?station=2" --window-name="Station2"
echo.
echo Mẹo: Hãy kéo cửa sổ Trạm 1 sang Màn hình phụ 1, cửa sổ Trạm 2 sang Màn hình phụ 2
echo rồi bấm nút [Khóa Kiosk] trên góc màn hình để khóa toàn màn hình chống tắt web!
goto end

:end
echo Hoàn tất.
pause
