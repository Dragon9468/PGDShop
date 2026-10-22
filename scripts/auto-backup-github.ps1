# ==============================================================================
# PGDShop - Tự động sao lưu code lên GitHub (PowerShell Script)
# Có thể cài đặt chạy định kỳ qua Windows Task Scheduler (Mỗi ngày / Mỗi 2 tiếng)
# ==============================================================================

$ProjectDir = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectDir

$Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "🔄 BẮT ĐẦU SAO LƯU CODE PGDSHOP LÊN GITHUB" -ForegroundColor Yellow
Write-Host "⏰ Thời gian: $Timestamp" -ForegroundColor Gray
Write-Host "📁 Thư mục: $ProjectDir" -ForegroundColor Gray
Write-Host "===================================================" -ForegroundColor Cyan

# Kiểm tra thay đổi
$status = git status --porcelain
if ([string]::IsNullOrWhiteSpace($status)) {
    Write-Host "ℹ️ Không có thay đổi mới nào trong mã nguồn. Bỏ qua commit." -ForegroundColor Green
    exit 0
}

Write-Host "📦 Đang thêm các file thay đổi..." -ForegroundColor Yellow
git add .

Write-Host "📝 Đang commit..." -ForegroundColor Yellow
git commit -m "Auto backup: $Timestamp [PGDShop System Snapshot]"

Write-Host "🚀 Đang push lên GitHub..." -ForegroundColor Yellow
try {
    git push origin main
} catch {
    git push origin master
}

Write-Host "✅ ĐÃ SAO LƯU THÀNH CÔNG LÊN GITHUB!" -ForegroundColor Green
