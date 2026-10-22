# 🏬 PGDShop - Hệ Thống Quản Lý Cửa Hàng & POS Đa Nền Tảng

Hệ thống quản lý cửa hàng và bán hàng đa nền tảng (**App Máy Tính PC + Web Trực Tuyến + App Android**) được thiết kế chuyên biệt cho mô hình bán lẻ kết hợp chế biến F&B (đồ ăn, cà phê), bán sỉ hóa đơn đỏ và bán hàng online đa sàn.

---

## 🌟 Điểm Nổi Bật Của Hệ Thống

1. **Kiến Trúc Đa Nền Tảng (1 Codebase duy nhất)**:
   - **App trên máy (PC Windows Desktop)**: Chạy ở chế độ Kiosk/App không thanh địa chỉ, tương thích mọi máy quét barcode USB, máy in bill nhiệt K80/K58, và máy in A4.
   - **Web App**: Triển khai trực tiếp từ máy PC thông qua **Cloudflare Tunnel** (miễn phí SSL, gắn Domain riêng của bạn, không cần mở cổng router hay mua IP tĩnh).
   - **App Android (APK)**: Tích hợp sẵn mã nguồn **Capacitor Android** (`@capacitor/android`), dễ dàng xuất thành file APK cài trên điện thoại/máy tính bảng.

2. **Lưu Trữ & Đồng Bộ Chi Phí Thấp (Google Sheets + Supabase)**:
   - **Google Sheets**: Lưu trữ các báo cáo tài chính, biểu đồ nến chứng khoán theo dõi biến động vốn, bảng CapEx, OpEx và công thức liên kết tự động.
   - **Supabase (PostgreSQL + Realtime)**: Xử lý dữ liệu tần suất cao (sản phẩm, đơn hàng quầy POS, quét barcode, đối soát chuyển khoản ngân hàng VietQR).
   - **Tự động sao lưu GitHub**: Kịch bản tự động commit & push toàn bộ mã nguồn lên GitHub theo lịch định kỳ.

3. **Cơ Chế 2 Màn Hình (Dual Screen POS & CFD)**:
   - **Màn hình 1 (Thu ngân)**: Giao diện bán hàng, quét barcode siêu tốc, quản lý kho, công nợ sỉ, nút thanh toán **"Tiền Mặt"** một chạm.
   - **Màn hình 2 (Hướng ra khách hàng - Customer-Facing Display CFD)**: Khách hàng tự theo dõi giỏ hàng thời gian thực, có ô tự quét barcode sản phẩm, hiển thị **Mã VietQR Động** kèm số tiền và nội dung hóa đơn chính xác.
   - Đồng bộ tức thì 0ms qua công nghệ `BroadcastChannel` và `Supabase Realtime`.

4. **Thanh Toán Tự Động & Loa Thông Báo Bluetooth**:
   - Tự động sinh mã VietQR Napas 24/7 theo từng đơn hàng.
   - **Loa Bluetooth**: Tự động phát âm thanh giọng nói tiếng Việt chuẩn khi tiền vào tài khoản: *"Đã nhận thanh toán thành công [Số tiền] đồng từ ngân hàng. Cảm ơn quý khách!"*.
   - Tự động đếm ngược 3 giây và **Clear giỏ hàng** để đón lượt khách tiếp theo.
   - Nếu khách trả tiền mặt: Thu ngân bấm nút **"TIỀN MẶT"** -> Loa thông báo + In bill nhiệt + Tự động làm sạch giỏ hàng.

---

## 📁 Chi Tiết 8 Tab Nghiệp Vụ Quản Lý

| STT | Tên Tab Sheet | Mục Đích & Cơ Chế Hoạt Động |
|---|---|---|
| 📦 **1** | `1_KeHang` | Quản lý sơ đồ vị trí kệ (Dãy A, B; Tầng 1, 2, 3), sức chứa, thanh phần trăm tỉ lệ đầy và sản phẩm trưng bày trên từng kệ. |
| ☕ **2** | `2_CheBien_BOM` | Quản lý các món chế biến tại quầy (Cà phê sữa đá, trà đào, đồ ăn...). Bảng định lượng nguyên liệu tiêu hao (BOM), tính giá Cost vốn chính xác và tỉ lệ lợi nhuận gộp từng món. |
| 🌐 **3** | `3_DonHang_Online` | Quản lý đơn hàng đa kênh: Shopee, GrabFood, TikTokShop, Web trực tiếp. Theo dõi mã vận đơn, tình trạng giao, chiết khấu phí sàn và thực thu ròng. |
| 🏬 **4** | `4_KhoHang_NhapXuat` | Quản lý phiếu nhập kho từ nhà cung cấp, xuất kho kiểm kê. **Đặc biệt: Tổng chi phí nhập kho được tự động liên kết (Rollup) sang mục "NHẬP HÀNG KHO" trong Tab 7 (OpEx)**. |
| 📑 **5** | `5_BanSi_HoaDon` | Quản lý khách hàng doanh nghiệp, Mã Số Thuế (MST), công nợ và xuất **Hóa Đơn Đỏ VAT khổ A4** chuẩn hóa (có thể in trực tiếp ra máy in A4). |
| 🚜 **6** | `6_CapEx` | Quản lý tài sản cố định: Máy móc pha chế, hệ thống kệ sắt, xe giao hàng, tủ đông/mát, thiết bị IT quầy thu ngân. Tự động tính khấu hao hàng tháng. |
| 💡 **7** | `7_OpEx` | Chi phí vận hành định kỳ: Tiền điện, nước, internet, bảo trì thiết bị, vật tư quầy (giấy in nhiệt K80, mực in), mặt bằng, lương nhân viên. **Chi phí nhập hàng lấy giá trị tổng tự động từ Tab 4 Kho Hàng**. |
| 📈 **8** | `8_Von_TaiChinh` | Theo dõi biến động vốn theo từng tháng theo định dạng **OHLC (Open - High - Low - Close)**. Vẽ biểu đồ nến/cột tài chính kiểu chứng khoán để theo dõi mức chênh lệch tiền và dòng tiền ròng. |

---

## 🚀 Hướng Dẫn Cài Đặt & Sử Dụng

### 1. Khởi động nhanh trên máy tính PC (Local POS)
```bash
# 1. Cài đặt các gói phụ thuộc (nếu chưa có)
npm install

# 2. Khởi chạy Server POS nội bộ
npm run dev

# 3. Mở nhanh App Desktop không thanh địa chỉ (Kiosk/App Mode):
# Chạy file: scripts\start-pc-app.bat
```
- Trình duyệt/App Thu Ngân sẽ mở tại: `http://localhost:3000/`
- Màn hình phụ hướng ra khách hàng (CFD) mở tại: `http://localhost:3000/#/customer-display`

---

### 2. Triển khai Web từ máy PC ra Internet bằng Cloudflare Tunnel (Miễn phí)
1. Tải công cụ `cloudflared` chính thức: [Cloudflare Tunnel Releases](https://github.com/cloudflare/cloudflared/releases).
2. Mở file [deploy-cloudflare-tunnel.bat](file:///d:/Phongdata/Coding/PGDShop/scripts/deploy-cloudflare-tunnel.bat) trong thư mục `scripts/`:
   ```cmd
   scripts\deploy-cloudflare-tunnel.bat
   ```
3. Cloudflare sẽ tự động cấp một đường link HTTPS bảo mật (hoặc bạn gắn tên miền riêng ví dụ `pos.cuahangcuaban.com`).
4. Bất kỳ máy tính, điện thoại nào cũng có thể truy cập Web POS từ xa an toàn mà **không cần mở cổng Modem Router**.

---

### 3. Tự Động Sao Lưu Mã Nguồn Lên GitHub
Chạy file [auto-backup-github.bat](file:///d:/Phongdata/Coding/PGDShop/scripts/auto-backup-github.bat) hoặc PowerShell script:
```powershell
powershell -ExecutionPolicy Bypass -File scripts\auto-backup-github.ps1
```
> **Mẹo**: Bạn có thể đưa file này vào **Windows Task Scheduler** để máy tính tự động backup code lên GitHub mỗi ngày vào lúc 22h00.

---

### 4. Thiết lập Google Sheets (Tạo tự động 8 Tab & Biểu đồ nến chứng khoán)
1. Mở một Google Sheet trắng mới ([sheets.new](https://sheets.new)).
2. Vào menu **Tiện ích mở rộng (Extensions)** -> **Apps Script**.
3. Mở file mã nguồn [PGDShop_GoogleAppsScript.js](file:///d:/Phongdata/Coding/PGDShop/google-sheets/PGDShop_GoogleAppsScript.js).
4. Copy toàn bộ code dán vào Apps Script và bấm **Save (Ctrl + S)**.
5. F5 lại Google Sheet, trên thanh menu sẽ xuất hiện: **"🏬 PGDShop POS"** -> Chọn **"🚀 Khởi tạo toàn bộ 8 Tab & Biểu đồ"**.
6. Google Sheet sẽ tự động sinh toàn bộ 8 Tab, định dạng tiền tệ Việt Nam Đồng (VNĐ), thiết lập các công thức liên kết Kho Hàng -> OpEx và vẽ biểu đồ nến chứng khoán theo dõi vốn!
7. Bấm **Triển khai (Deploy)** -> **Ứng dụng web (Web App)** để lấy URL dán vào phần **Cài Đặt** trong ứng dụng POS.

---

### 5. Thiết lập Supabase (Cơ sở dữ liệu Realtime)
1. Tạo một project mới trên [Supabase.com](https://supabase.com) (Gói miễn phí hoàn toàn đủ dùng).
2. Vào mục **SQL Editor** trong Supabase Dashboard.
3. Mở file [schema.sql](file:///d:/Phongdata/Coding/PGDShop/supabase/schema.sql) trong thư mục `supabase/`.
4. Copy toàn bộ câu lệnh SQL và bấm **Run**.
5. Copy **Project URL** và **Anon Key** dán vào tab **Cài Đặt** trên ứng dụng POS.

---

### 6. Xuất App Android (Cài đặt trên điện thoại / máy tính bảng)
Dự án đã được cấu hình sẵn với Capacitor:
```bash
# 1. Build mã nguồn Web
npm run build

# 2. Thêm nền tảng Android (chỉ chạy lần đầu)
npx cap add android

# 3. Đồng bộ code sang Android Studio
npx cap sync

# 4. Mở trong Android Studio để xuất file APK
npx cap open android
```

---

## 🛠️ Hướng Dẫn Vận Hành Phần Cứng Tại Cửa Hàng

- **Súng quét mã vạch (USB Barcode Gun)**:
  Cắm dây USB vào máy tính. Máy quét hoạt động dạng bàn phím chuẩn HID. Khi bóp cò, máy sẽ tự động đọc mã vạch, phát tiếng "bíp" và đưa sản phẩm vào giỏ hàng ngay lập tức.
- **Loa Bluetooth**:
  Bật Bluetooth trên máy tính PC Windows, ghép nối (Pair) với loa Bluetooth tại quầy. Ứng dụng sẽ tự động truyền giọng nói tiếng Việt chuẩn Napas thông báo số tiền nhận được.
- **2 Màn hình (Dual Screen Setup)**:
  Cắm thêm 1 màn hình phụ vào cổng HDMI của máy tính PC. Nhấn tổ hợp phím `Windows + P` -> Chọn **Extend (Mở rộng màn hình)**. Kéo cửa sổ Màn hình khách hàng (`/#/customer-display`) sang màn hình thứ 2 và nhấn `F11` để phóng to toàn màn hình.
- **Máy in bill nhiệt (K80 / K58)**:
  Hỗ trợ in trực tiếp từ trình duyệt mà không cần cài đặt driver phức tạp.
- **Máy in A4 (Hóa đơn đỏ VAT)**:
  Trong tab **"5. Bán Sỉ (VAT)"**, bấm nút **"In A4"** để xuất bản in khổ giấy A4 tiêu chuẩn có đầy đủ chữ ký số và con dấu doanh nghiệp.
