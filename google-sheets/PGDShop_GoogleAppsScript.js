/**
 * ==============================================================================
 * PGDSHOP - GOOGLE APPS SCRIPT AUTOMATION & SYNC SUITE
 * ==============================================================================
 * Hướng dẫn sử dụng:
 * 1. Mở một Google Sheet mới (https://sheets.new)
 * 2. Vào menu "Tiện ích mở rộng" (Extensions) -> "Apps Script"
 * 3. Xóa code cũ, dán toàn bộ nội dung file này vào và bấm Save (Ctrl + S)
 * 4. Bấm Run hàm "onOpen" hoặc refresh lại Google Sheet.
 * 5. Trên thanh công cụ Google Sheet sẽ xuất hiện menu: "🏬 PGDShop POS" -> Bấm "🚀 Khởi tạo toàn bộ 8 Tab & Biểu đồ"
 * 6. Để nhận data tự động từ App/Web: Bấm "Triển khai" (Deploy) -> "Tùy chọn triển khai mới" -> "Ứng dụng web" (Web App)
 *    - Ai có quyền truy cập: "Bất kỳ ai" (Anyone)
 *    - Copy URL Web App dán vào file cấu hình .env của PGDShop
 * ==============================================================================
 */

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🏬 PGDShop POS')
    .addItem('🚀 Khởi tạo toàn bộ 8 Tab & Biểu đồ', 'setupAllTabs')
    .addItem('🔄 Cập nhật số liệu OpEx từ Kho Hàng', 'syncInventoryToOpex')
    .addItem('📈 Tạo lại Biểu đồ Cột/Nến Vốn Tài Chính', 'createCapitalChart')
    .addToUi();
}

function setupAllTabs() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. TAB: 1_KeHang (Quản lý kệ hàng)
  setupKeHang(ss);
  
  // 2. TAB: 2_CheBien_BOM (Món chế biến & Định lượng)
  setupCheBienBOM(ss);
  
  // 3. TAB: 3_DonHang_Online (Đơn hàng online)
  setupDonHangOnline(ss);
  
  // 4. TAB: 4_KhoHang_NhapXuat (Kho hàng nhập xuất)
  setupKhoHang(ss);
  
  // 5. TAB: 5_BanSi_HoaDon (Bán sỉ & Hóa đơn đỏ VAT)
  setupBanSi(ss);
  
  // 6. TAB: 6_CapEx (Chi phí máy móc, kệ, xe, tủ...)
  setupCapEx(ss);
  
  // 7. TAB: 7_OpEx (Chi phí vận hành, điện nước, vật tư, link kho hàng)
  setupOpEx(ss);
  
  // 8. TAB: 8_Von_TaiChinh (Vốn chênh lệch hàng tháng & biểu đồ nến/cột)
  setupVonTaiChinh(ss);
  
  SpreadsheetApp.getUi().alert('🎉 Chúc mừng! Đã khởi tạo hoàn tất toàn bộ 8 Tab dữ liệu và công thức liên kết.');
}

// -------------------------------------------------------------
// 1. QUẢN LÝ KỆ HÀNG
// -------------------------------------------------------------
function setupKeHang(ss) {
  let sheet = ss.getSheetByName('1_KeHang') || ss.insertSheet('1_KeHang');
  sheet.clear();
  sheet.setTabColor('#3B82F6'); // Blue
  
  const headers = [
    ['Mã Kệ', 'Dãy', 'Tầng', 'Sức Chứa (SP)', 'Số Lượng Hiện Tại', 'Tỉ Lệ Đầy (%)', 'Trạng Thái', 'Sản Phẩm Trưng Bày', 'Ghi Chú Vị Trí']
  ];
  sheet.getRange(1, 1, 1, headers[0].length).setValues(headers)
    .setBackground('#1E3A8A').setFontColor('#FFFFFF').setFontWeight('bold');
    
  const sampleData = [
    ['KE-A1-T1', 'A', 1, 50, 42, '=E2/D2', 'Đang sử dụng', 'Cà phê hạt Robusta 500g, Cà phê Arabica', 'Gần lối vào chính'],
    ['KE-A1-T2', 'A', 2, 50, 48, '=E3/D3', 'Gần đầy', 'Bột cacao nguyên chất, Sữa đặc Larose', 'Tầng mắt nhìn'],
    ['KE-B1-T1', 'B', 1, 80, 75, '=E4/D4', 'Gần đầy', 'Ly giấy 360ml, Ly giấy 500ml, Nắp cầu', 'Kệ bao bì F&B'],
    ['KE-B2-T1', 'B', 2, 40, 15, '=E5/D5', 'Còn trống', 'Giấy in bill nhiệt K80, Mực in A4', 'Khu vật tư tiêu hao']
  ];
  sheet.getRange(2, 1, sampleData.length, sampleData[0].length).setValues(sampleData);
  sheet.getRange('F2:F5').setNumberFormat('0.0%');
  sheet.autoResizeColumns(1, headers[0].length);
}

// -------------------------------------------------------------
// 2. QUẢN LÝ CHẾ BIẾN (BOM & RECIPES)
// -------------------------------------------------------------
function setupCheBienBOM(ss) {
  let sheet = ss.getSheetByName('2_CheBien_BOM') || ss.insertSheet('2_CheBien_BOM');
  sheet.clear();
  sheet.setTabColor('#F59E0B'); // Amber
  
  const headers = [
    ['Mã Món', 'Tên Món Chế Biến', 'Nguyên Liệu Thành Phần', 'ĐVT', 'Định Lượng / 1 Phần', 'Đơn Giá Vốn / ĐVT', 'Chi Phí Thành Phần (VNĐ)', 'Giá Bán Menu (VNĐ)', 'Tỉ Lệ Cost / Giá Bán']
  ];
  sheet.getRange(1, 1, 1, headers[0].length).setValues(headers)
    .setBackground('#78350F').setFontColor('#FFFFFF').setFontWeight('bold');
    
  const sampleData = [
    ['CF-SUADA', 'Cà phê sữa đá pha máy', 'Cà phê hạt Blend PGD', 'gram', 20, 200, '=E2*F2', 25000, '=G2/H2'],
    ['CF-SUADA', 'Cà phê sữa đá pha máy', 'Sữa đặc Ngôi sao', 'ml', 30, 70, '=E3*F3', 25000, '=G3/H3'],
    ['CF-SUADA', 'Cà phê sữa đá pha máy', 'Ly + Ống hút + Nắp', 'bộ', 1, 1200, '=E4*F4', 25000, '=G4/H4'],
    ['TRA-DAO', 'Trà đào cam sả', 'Cốt trà túi lọc Cozy', 'gói', 1, 2500, '=E5*F5', 35000, '=G5/H5'],
    ['TRA-DAO', 'Trà đào cam sả', 'Đào miếng ngâm Kronos', 'miếng', 2, 3000, '=E6*F6', 35000, '=G6/H6'],
    ['TRA-DAO', 'Trà đào cam sả', 'Siro đào & đường', 'ml', 25, 120, '=E7*F7', 35000, '=G7/H7']
  ];
  sheet.getRange(2, 1, sampleData.length, sampleData[0].length).setValues(sampleData);
  sheet.getRange('F2:H7').setNumberFormat('#,##0 "₫"');
  sheet.getRange('I2:I7').setNumberFormat('0.0%');
  sheet.autoResizeColumns(1, headers[0].length);
}

// -------------------------------------------------------------
// 3. QUẢN LÝ ĐƠN HÀNG ONLINE
// -------------------------------------------------------------
function setupDonHangOnline(ss) {
  let sheet = ss.getSheetByName('3_DonHang_Online') || ss.insertSheet('3_DonHang_Online');
  sheet.clear();
  sheet.setTabColor('#10B981'); // Emerald
  
  const headers = [
    ['Mã Đơn Hàng', 'Ngày Tạo', 'Kênh Bán', 'Tên Khách Hàng', 'SĐT', 'Mã Vận Đơn', 'Tổng Tiền Hàng (VNĐ)', 'Phí Sàn Chiết Khấu (VNĐ)', 'Thực Thu Về Ví (VNĐ)', 'Trạng Thái']
  ];
  sheet.getRange(1, 1, 1, headers[0].length).setValues(headers)
    .setBackground('#064E3B').setFontColor('#FFFFFF').setFontWeight('bold');
    
  const sampleData = [
    ['SHOPEE-8821', '2026-10-20', 'Shopee', 'Nguyễn Văn Minh', '0912345678', 'SPX88210041VN', 320000, 38400, '=G2-H2', 'Đã giao thành công'],
    ['GRAB-4412', '2026-10-21', 'GrabFood', 'Trần Thị Thu', '0987654321', 'GRAB-D2D-441', 145000, 29000, '=G3-H3', 'Đã hoàn thành'],
    ['TIKTOK-9901', '2026-10-22', 'TikTokShop', 'Lê Hoàng Nam', '0903112233', 'JNT-TT-99012', 450000, 54000, '=G4-H4', 'Đang vận chuyển'],
    ['WEB-0012', '2026-10-22', 'Web Trực Tiếp', 'Phạm Hồng Ánh', '0944556677', 'GHN-PGD-0012', 280000, 0, '=G5-H5', 'Đang chuẩn bị hàng']
  ];
  sheet.getRange(2, 1, sampleData.length, sampleData[0].length).setValues(sampleData);
  sheet.getRange('G2:I5').setNumberFormat('#,##0 "₫"');
  sheet.autoResizeColumns(1, headers[0].length);
}

// -------------------------------------------------------------
// 4. QUẢN LÝ KHO HÀNG (NHẬP XUẤT)
// -------------------------------------------------------------
function setupKhoHang(ss) {
  let sheet = ss.getSheetByName('4_KhoHang_NhapXuat') || ss.insertSheet('4_KhoHang_NhapXuat');
  sheet.clear();
  sheet.setTabColor('#6366F1'); // Indigo
  
  const headers = [
    ['Mã Phiếu', 'Ngày Giao Dịch', 'Loại (Nhập/Xuất)', 'Nhà Cung Cấp / Nguồn', 'Mặt Hàng', 'ĐVT', 'Số Lượng', 'Đơn Giá Nhập (VNĐ)', 'Thành Tiền (VNĐ)', 'Người Nhận', 'Ghi Chú']
  ];
  sheet.getRange(1, 1, 1, headers[0].length).setValues(headers)
    .setBackground('#312E81').setFontColor('#FFFFFF').setFontWeight('bold');
    
  const sampleData = [
    ['NK-202610-01', '2026-10-01', 'Nhập Kho', 'NCC Cà Phê Ban Mê', 'Hạt Cà Phê Robusta S18 (Bao 30kg)', 'kg', 60, 180000, '=G2*H2', 'Kho Trưởng', 'Nhập đầu tháng'],
    ['NK-202610-02', '2026-10-05', 'Nhập Kho', 'Cty Bao Bì Sài Gòn', 'Ly Giấy Trắng 500ml (Thùng 1000 cái)', 'thùng', 10, 850000, '=G3*H3', 'Kho Trưởng', 'Bao bì F&B'],
    ['NK-202610-03', '2026-10-10', 'Nhập Kho', 'Tổng Kho Văn Phòng Phẩm An Nam', 'Giấy in bill nhiệt K80 phi 45 (Thùng 100 cuộn)', 'thùng', 2, 650000, '=G4*H4', 'Thu Ngân 1', 'Vật tư in bill quầy'],
    ['NK-202610-04', '2026-10-15', 'Nhập Kho', 'Đại lý Sữa Ông Thọ', 'Sữa đặc Phương Nam (Thùng 48 lon)', 'thùng', 5, 1150000, '=G5*H5', 'Kho Trưởng', 'Pha chế'],
    ['XK-202610-01', '2026-10-18', 'Xuất Hủy', 'Nội bộ', 'Ly Giấy Trắng 500ml', 'cái', 20, 850, '=G6*H6', 'Kho Trưởng', 'Hỏng do ướt mưa']
  ];
  sheet.getRange(2, 1, sampleData.length, sampleData[0].length).setValues(sampleData);
  sheet.getRange('H2:I6').setNumberFormat('#,##0 "₫"');
  
  // Tổng nhập kho để đối soát OpEx
  sheet.getRange('H8').setValue('TỔNG TIỀN NHẬP KHO THÁNG 10:').setFontWeight('bold');
  sheet.getRange('I8').setFormula('=SUMIF(C2:C6, "Nhập Kho", I2:I6)').setFontWeight('bold').setNumberFormat('#,##0 "₫"');
  sheet.autoResizeColumns(1, headers[0].length);
}

// -------------------------------------------------------------
// 5. BÁN SỈ & HÓA ĐƠN ĐỎ (VAT INVOICE)
// -------------------------------------------------------------
function setupBanSi(ss) {
  let sheet = ss.getSheetByName('5_BanSi_HoaDon') || ss.insertSheet('5_BanSi_HoaDon');
  sheet.clear();
  sheet.setTabColor('#EC4899'); // Pink
  
  const headers = [
    ['Mã Đơn Sỉ', 'Ngày Xuất', 'Tên Công Ty / Khách Sỉ', 'Mã Số Thuế (MST)', 'Địa Chỉ Công Ty', 'Số Hóa Đơn Đỏ VAT', 'Tiền Hàng (VNĐ)', 'Thuế Suất VAT', 'Tiền Thuế VAT (VNĐ)', 'Tổng Thanh Toán (VNĐ)', 'Tình Trạng Hóa Đơn']
  ];
  sheet.getRange(1, 1, 1, headers[0].length).setValues(headers)
    .setBackground('#831843').setFontColor('#FFFFFF').setFontWeight('bold');
    
  const sampleData = [
    ['SI-202610-001', '2026-10-08', 'CÔNG TY TNHH CÔNG NGHỆ VÀ TRUYỀN THÔNG ALPHA', '0315889922', 'Tòa nhà Bitexco, Q.1, TP.HCM', 'HD-VAT-00101', 12500000, 0.08, '=G2*H2', '=G2+I2', 'Đã phát hành điện tử'],
    ['SI-202610-002', '2026-10-16', 'CÔNG TY CỔ PHẦN ĐẦU TƯ BẤT ĐỘNG SẢN PHƯƠNG NAM', '0108994433', '124 Hoàng Quốc Việt, Cầu Giấy, Hà Nội', 'HD-VAT-00102', 28000000, 0.08, '=G3*H3', '=G3+I3', 'Đã thanh toán & Xuất HĐ'],
    ['SI-202610-003', '2026-10-21', 'CHUỖI KHÁCH SẠN SUNSET BAY RESORT', '0402118877', 'Đường Võ Nguyên Giáp, Sơn Trà, Đà Nẵng', 'HD-VAT-00103', 45000000, 0.08, '=G4*H4', '=G4+I4', 'Chờ chuyển khoản (Công nợ 7 ngày)']
  ];
  sheet.getRange(2, 1, sampleData.length, sampleData[0].length).setValues(sampleData);
  sheet.getRange('G2:G4').setNumberFormat('#,##0 "₫"');
  sheet.getRange('H2:H4').setNumberFormat('0%');
  sheet.getRange('I2:J4').setNumberFormat('#,##0 "₫"');
  sheet.autoResizeColumns(1, headers[0].length);
}

// -------------------------------------------------------------
// 6. CAPEX (CHI PHÍ TÀI SẢN CỐ ĐỊNH, THIẾT BỊ, KỆ...)
// -------------------------------------------------------------
function setupCapEx(ss) {
  let sheet = ss.getSheetByName('6_CapEx') || ss.insertSheet('6_CapEx');
  sheet.clear();
  sheet.setTabColor('#8B5CF6'); // Purple
  
  const headers = [
    ['Mã Tài Sản', 'Tên Thiết Bị / Tài Sản', 'Phân Loại', 'Ngày Đầu Tư', 'Nguyên Giá Đầu Tư (VNĐ)', 'Thời Gian Khấu Hao (Tháng)', 'Khấu Hao Hàng Tháng (VNĐ)', 'Tình Trạng Thiết Bị', 'Ghi Chú']
  ];
  sheet.getRange(1, 1, 1, headers[0].length).setValues(headers)
    .setBackground('#4C1D95').setFontColor('#FFFFFF').setFontWeight('bold');
    
  const sampleData = [
    ['TS-001', 'Máy pha cà phê 2 group Nuova Simonelli', 'Máy móc chế biến', '2026-01-15', 85000000, 36, '=E2/F2', 'Hoạt động tốt', 'Bảo trì định kỳ mỗi 6 tháng'],
    ['TS-002', 'Máy xay cà phê Fiorenzato F64E', 'Máy móc chế biến', '2026-01-15', 18500000, 24, '=E3/F3', 'Hoạt động tốt', 'Lưỡi xay titanium'],
    ['TS-003', 'Tủ đông mát 4 cánh Sanaky Inverter', 'Tủ đông/mát', '2026-02-10', 24000000, 48, '=E4/F4', 'Hoạt động tốt', 'Khu bảo quản nguyên liệu'],
    ['TS-004', 'Hệ thống kệ sắt V lỗ siêu tải (8 dãy)', 'Kệ hàng', '2026-01-20', 32000000, 60, '=E5/F5', 'Tốt', 'Khu vực kho và quầy'],
    ['TS-005', 'Xe máy Honda Wave giao hàng nội thành', 'Xe cộ', '2026-03-05', 21500000, 48, '=E6/F6', 'Hoạt động tốt', 'Giao hàng bán sỉ & online'],
    ['TS-006', 'Dàn máy POS 2 màn hình + Máy in K80 + Barcode', 'Thiết bị IT Quầy', '2026-01-18', 16500000, 24, '=E7/F7', 'Hoạt động tốt', 'Quầy thu ngân']
  ];
  sheet.getRange(2, 1, sampleData.length, sampleData[0].length).setValues(sampleData);
  sheet.getRange('E2:E7').setNumberFormat('#,##0 "₫"');
  sheet.getRange('G2:G7').setNumberFormat('#,##0 "₫"');
  
  sheet.getRange('D9').setValue('TỔNG VỐN ĐẦU TƯ CAPEX BAN ĐẦU:').setFontWeight('bold');
  sheet.getRange('E9').setFormula('=SUM(E2:E7)').setFontWeight('bold').setNumberFormat('#,##0 "₫"');
  sheet.getRange('F9').setValue('TỔNG KHẤU HAO / THÁNG:').setFontWeight('bold');
  sheet.getRange('G9').setFormula('=SUM(G2:G7)').setFontWeight('bold').setNumberFormat('#,##0 "₫"');
  sheet.autoResizeColumns(1, headers[0].length);
}

// -------------------------------------------------------------
// 7. OPEX (CHI PHÍ VẬN HÀNH ĐỊNH KỲ)
// -------------------------------------------------------------
function setupOpEx(ss) {
  let sheet = ss.getSheetByName('7_OpEx') || ss.insertSheet('7_OpEx');
  sheet.clear();
  sheet.setTabColor('#EF4444'); // Red
  
  const headers = [
    ['Tháng', 'Tiền Điện (VNĐ)', 'Tiền Nước (VNĐ)', 'Bảo Trì Thiết Bị (VNĐ)', 'Vật Tư (Giấy in K80, Mực, Túi)', 'Chi Phí Nhập Hàng (Tự động từ Kho)', 'Mặt Bằng (VNĐ)', 'Lương Nhân Viên (VNĐ)', 'Khấu Hao CapEx (Từ Tab 6)', 'Tổng Chi Phí OpEx (VNĐ)']
  ];
  sheet.getRange(1, 1, 1, headers[0].length).setValues(headers)
    .setBackground('#7F1D1D').setFontColor('#FFFFFF').setFontWeight('bold');
    
  // Công thức F2 lấy tự động tổng chi phí Nhập kho từ Tab 4 ('4_KhoHang_NhapXuat'!I8)
  // Công thức I2 lấy tự động từ Tab 6 ('6_CapEx'!G9)
  const sampleData = [
    ['2026-08', 4200000, 850000, 1200000, 1600000, 24500000, 15000000, 22000000, "='6_CapEx'!G9", '=SUM(B2:I2)'],
    ['2026-09', 4600000, 920000, 800000, 1750000, 28200000, 15000000, 24000000, "='6_CapEx'!G9", '=SUM(B3:I3)'],
    ['2026-10', 4350000, 890000, 500000, 1950000, "='4_KhoHang_NhapXuat'!I8", 15000000, 25000000, "='6_CapEx'!G9", '=SUM(B4:I4)']
  ];
  sheet.getRange(2, 1, sampleData.length, sampleData[0].length).setValues(sampleData);
  sheet.getRange('B2:J4').setNumberFormat('#,##0 "₫"');
  sheet.autoResizeColumns(1, headers[0].length);
}

// -------------------------------------------------------------
// 8. VỐN & TÀI CHÍNH (CAPITAL TRACKING & STOCK CANDLESTICK CHART)
// -------------------------------------------------------------
function setupVonTaiChinh(ss) {
  let sheet = ss.getSheetByName('8_Von_TaiChinh') || ss.insertSheet('8_Von_TaiChinh');
  sheet.clear();
  sheet.setTabColor('#059669'); // Green
  
  // Thiết kế bảng theo định dạng OHLC (Open, High, Low, Close) của đồ thị nến chứng khoán để vẽ trực tiếp
  const headers = [
    ['Tháng', 'Vốn Mở Đầu Kỳ (Open)', 'Đáy Vốn Thấp Nhất (Low)', 'Đỉnh Vốn Cao Nhất (High)', 'Vốn Đóng Cuối Kỳ (Close)', 'Doanh Thu Quầy & Online', 'Doanh Thu Bán Sỉ', 'Tổng Chi Phí OpEx', 'Lợi Nhuận Ròng (VNĐ)', 'Tăng Trưởng Vốn (%)']
  ];
  sheet.getRange(1, 1, 1, headers[0].length).setValues(headers)
    .setBackground('#064E3B').setFontColor('#FFFFFF').setFontWeight('bold');
    
  // Công thức Lợi Nhuận Ròng I = F + G - H
  // Chênh lệch Vốn Close E = B + I
  const sampleData = [
    ['2026-05', 200000000, 190000000, 218000000, 215000000, 68000000, 20000000, 73000000, '=F2+G2-H2', '=(E2-B2)/B2'],
    ['2026-06', 215000000, 208000000, 235000000, 232000000, 75000000, 25000000, 83000000, '=F3+G3-H3', '=(E3-B3)/B3'],
    ['2026-07', 232000000, 225000000, 258000000, 254000000, 82000000, 32000000, 92000000, '=F4+G4-H4', '=(E4-B4)/B4'],
    ['2026-08', 254000000, 245000000, 282000000, 278000000, 89000000, 40000000, "='7_OpEx'!J2", '=F5+G5-H5', '=(E5-B5)/B5'],
    ['2026-09', 278000000, 269000000, 310000000, 305000000, 98000000, 52000000, "='7_OpEx'!J3", '=F6+G6-H6', '=(E6-B6)/B6'],
    ['2026-10', 305000000, 298000000, 345000000, 341000000, 112000000, 65000000, "='7_OpEx'!J4", '=F7+G7-H7', '=(E7-B7)/B7']
  ];
  sheet.getRange(2, 1, sampleData.length, sampleData[0].length).setValues(sampleData);
  sheet.getRange('B2:I7').setNumberFormat('#,##0 "₫"');
  sheet.getRange('J2:J7').setNumberFormat('+0.0%;-0.0%;0.0%');
  sheet.autoResizeColumns(1, headers[0].length);
  
  createCapitalChart(sheet);
}

// -------------------------------------------------------------
// TỰ ĐỘNG TẠO BIỂU ĐỒ NẾN / CỘT CHỨNG KHOÁN (CANDLESTICK / BAR CHART)
// -------------------------------------------------------------
function createCapitalChart(sheet) {
  if (!sheet) {
    sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('8_Von_TaiChinh');
  }
  if (!sheet) return;
  
  // Xóa các biểu đồ cũ nếu có
  const existingCharts = sheet.getCharts();
  for (let i = 0; i < existingCharts.length; i++) {
    sheet.removeChart(existingCharts[i]);
  }
  
  // 1. Tạo biểu đồ Nến chứng khoán (Candlestick Chart) chuẩn Open - Low - High - Close
  // Columns: A (Tháng), C (Low), B (Open), E (Close), D (High)
  try {
    const rangeCandle = sheet.getRange('A1:E7');
    const candleChart = sheet.newChart()
      .setChartType(Charts.ChartType.CANDLESTICK)
      .addRange(rangeCandle)
      .setPosition(9, 1, 10, 10)
      .setOption('title', '📈 BIỂU ĐỒ NẾN CHỨNG KHOÁN BIẾN ĐỘNG VỐN (OPEN - HIGH - LOW - CLOSE)')
      .setOption('legend', { position: 'none' })
      .setOption('candlestick', {
        fallingColor: { strokeWidth: 2, fill: '#EF4444', stroke: '#DC2626' }, // Nến giảm: Đỏ
        risingColor: { strokeWidth: 2, fill: '#10B981', stroke: '#059669' }   // Nến tăng: Xanh lá
      })
      .setOption('width', 850)
      .setOption('height', 380)
      .build();
    sheet.insertChart(candleChart);
  } catch (err) {
    Logger.log('Candlestick fallback to Column: ' + err);
  }
  
  // 2. Tạo biểu đồ cột So sánh Doanh Thu vs Chi Phí OpEx vs Lợi Nhuận
  try {
    const rangeColumn = sheet.getRange('A1:A7');
    const rangeRev = sheet.getRange('F1:F7');
    const rangeExp = sheet.getRange('H1:H7');
    const rangeProfit = sheet.getRange('I1:I7');
    
    const barChart = sheet.newChart()
      .setChartType(Charts.ChartType.COLUMN)
      .addRange(rangeColumn)
      .addRange(rangeRev)
      .addRange(rangeExp)
      .addRange(rangeProfit)
      .setPosition(27, 1, 10, 10)
      .setOption('title', '📊 SO SÁNH DOANH THU QUẦY - OPEX - LỢI NHUẬN RÒNG THEO THÁNG')
      .setOption('colors', ['#3B82F6', '#EF4444', '#10B981'])
      .setOption('width', 850)
      .setOption('height', 360)
      .build();
    sheet.insertChart(barChart);
  } catch (err) {
    Logger.log('Bar chart error: ' + err);
  }
}

// -------------------------------------------------------------
// WEB APP API (POST / GET) - NHẬN DATA TỪ POS HOẶC SUPABASE
// -------------------------------------------------------------
function doPost(e) {
  try {
    const postData = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Ghi nhận dữ liệu tùy theo action
    if (postData.action === 'ADD_ORDER') {
      const orderSheet = ss.getSheetByName('3_DonHang_Online');
      orderSheet.appendRow([
        postData.orderCode,
        new Date().toISOString().slice(0, 10),
        postData.platform || 'POS Quầy',
        postData.customerName || 'Khách Lẻ',
        postData.customerPhone || '',
        postData.trackingCode || '',
        postData.totalAmount || 0,
        postData.fee || 0,
        (postData.totalAmount || 0) - (postData.fee || 0),
        'Đã hoàn thành'
      ]);
    } else if (postData.action === 'ADD_INVENTORY') {
      const invSheet = ss.getSheetByName('4_KhoHang_NhapXuat');
      invSheet.appendRow([
        postData.slipCode,
        new Date().toISOString().slice(0, 10),
        postData.type || 'Nhập Kho',
        postData.supplier || '',
        postData.itemName || '',
        postData.unit || 'cái',
        postData.quantity || 1,
        postData.costPrice || 0,
        (postData.quantity || 1) * (postData.costPrice || 0),
        postData.receiver || 'Thu ngân',
        postData.notes || ''
      ]);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ status: 'SUCCESS', message: 'Dữ liệu đã được lưu vào Google Sheet' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'ERROR', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({ status: 'ONLINE', app: 'PGDShop Google Sheets Sync API' }))
    .setMimeType(ContentService.MimeType.JSON);
}
