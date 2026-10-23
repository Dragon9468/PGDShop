// ==============================================================================
// PGDShop - Central Data Store & Supabase / LocalStorage / Google Sheets Hub
// ==============================================================================

import {
  Product,
  ShelfLocation,
  WarehouseLocation,
  WarehouseItem,
  PreparedRecipe,
  OnlineOrder,
  InventoryTransaction,
  WholesaleCustomer,
  WholesaleInvoice,
  CapExAsset,
  OpExExpense,
  CapitalMetric,
  AppSettings,
  PosOrder,
} from '../types';
import { DEFAULT_BANK_CONFIG } from './vietqrService';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEY_PREFIX = 'pgd_pos_';

// -------------------------------------------------------------
// DỮ LIỆU KHỞI TẠO MẪU (MOCK DATA) ĐẦY ĐỦ 8 MODULE
// -------------------------------------------------------------
const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-01',
    barcode: '8935001001',
    name: 'Cà phê Robusta Mộc S18 (500g)',
    category: 'TapHoa',
    unit: 'Gói',
    costPrice: 95000,
    retailPrice: 145000,
    wholesalePrice: 115000,
    stockQuantity: 42,
    minStock: 10,
    shelfCode: 'KE01-T1A',
    isPrepared: false,
    imageUrl: 'https://images.unsplash.com/photo-1587734195503-904fca47e0e9?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'prod-02',
    barcode: '8935001002',
    name: 'Cà phê Arabica Cầu Đất (500g)',
    category: 'TapHoa',
    unit: 'Gói',
    costPrice: 135000,
    retailPrice: 195000,
    wholesalePrice: 160000,
    stockQuantity: 28,
    minStock: 8,
    shelfCode: 'KE01-T1B',
    isPrepared: false,
    imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'prod-03',
    barcode: '8935001003',
    caseBarcode: '18935001003',
    caseUnit: 'Thùng (48 hộp)',
    unitsPerCase: 48,
    casePrice: 1050000,
    name: 'Sữa đặc Phương Nam hộp 380g',
    category: 'TapHoa',
    unit: 'Hộp',
    costPrice: 18000,
    retailPrice: 24000,
    wholesalePrice: 20000,
    stockQuantity: 120,
    minStock: 24,
    shelfCode: 'KE01-T2',
    isPrepared: false,
    imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'prod-04',
    barcode: '8935001004',
    name: 'Ly giấy Kraft 500ml kèm nắp',
    category: 'BaoBi',
    unit: 'Cây (50 cái)',
    costPrice: 42000,
    retailPrice: 65000,
    wholesalePrice: 50000,
    stockQuantity: 35,
    minStock: 10,
    shelfCode: 'MO01-T1A',
    isPrepared: false,
    imageUrl: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'prod-05',
    barcode: '8935001005',
    caseBarcode: '18935001005',
    caseUnit: 'Thùng (50 cuộn)',
    unitsPerCase: 50,
    casePrice: 450000,
    name: 'Giấy in nhiệt K80 phi 45 (Bọc bạc)',
    category: 'VanPhongPham',
    unit: 'Cuộn',
    costPrice: 6500,
    retailPrice: 10000,
    wholesalePrice: 7500,
    stockQuantity: 80,
    minStock: 15,
    shelfCode: 'KE02-T1',
    isPrepared: false,
    imageUrl: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'prod-06',
    barcode: '8935001006',
    caseBarcode: '18935001006',
    caseUnit: 'Thùng (24 lon)',
    unitsPerCase: 24,
    casePrice: 260000,
    name: 'Nước ngọt Coca Cola lon 320ml (Ướp lạnh)',
    category: 'TapHoa',
    unit: 'Lon',
    costPrice: 8500,
    retailPrice: 12000,
    wholesalePrice: 10000,
    stockQuantity: 48,
    minStock: 12,
    shelfCode: 'TM01-T1A',
    isPrepared: false,
    imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'prod-07',
    barcode: '8935001007',
    name: 'Táo Envy New Zealand Tươi',
    category: 'TapHoa',
    unit: 'Kg',
    costPrice: 85000,
    retailPrice: 125000,
    wholesalePrice: 105000,
    stockQuantity: 25,
    minStock: 5,
    shelfCode: 'RO01-A',
    isPrepared: false,
    imageUrl: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'prod-08',
    barcode: '8935001008',
    name: 'Kem Ốc Quế Socola Merino',
    category: 'TapHoa',
    unit: 'Cây',
    costPrice: 12000,
    retailPrice: 18000,
    wholesalePrice: 15000,
    stockQuantity: 30,
    minStock: 8,
    shelfCode: 'TL01-T1',
    isPrepared: false,
    imageUrl: 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'prod-09',
    barcode: '8935001009',
    name: 'Trà Xanh Olong Tea+ Chai 455ml (Máy Bán Nước)',
    category: 'TapHoa',
    unit: 'Chai',
    costPrice: 8000,
    retailPrice: 12000,
    wholesalePrice: 10000,
    stockQuantity: 20,
    minStock: 5,
    shelfCode: 'NC01-T1A',
    isPrepared: false,
    imageUrl: 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=300&auto=format&fit=crop&q=80',
  },
  // Các món chế biến tại quầy (F&B) - Không có mã vị trí kệ vì bán trực tiếp tại chỗ
  {
    id: 'prod-fb-01',
    barcode: '2000000001',
    name: '☕ Cà Phê Sữa Đá Pha Máy',
    category: 'CheBien_FB',
    unit: 'Ly',
    costPrice: 6500, // Chi phí BOM
    retailPrice: 25000,
    wholesalePrice: 22000,
    stockQuantity: 999,
    minStock: 0,
    isPrepared: true,
    imageUrl: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'prod-fb-02',
    barcode: '2000000002',
    name: '☕ Cà Phê Đen Đá Pha Máy',
    category: 'CheBien_FB',
    unit: 'Ly',
    costPrice: 4200,
    retailPrice: 20000,
    wholesalePrice: 18000,
    stockQuantity: 999,
    minStock: 0,
    isPrepared: true,
    imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'prod-fb-03',
    barcode: '2000000003',
    name: '🍑 Trà Đào Cam Sả Tươi',
    category: 'CheBien_FB',
    unit: 'Ly',
    costPrice: 8500,
    retailPrice: 35000,
    wholesalePrice: 30000,
    stockQuantity: 999,
    minStock: 0,
    isPrepared: true,
    imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'prod-fb-04',
    barcode: '2000000004',
    name: '🥖 Bánh Mì Pate Chả Lụa Nóng',
    category: 'CheBien_FB',
    unit: 'Ổ',
    costPrice: 9000,
    retailPrice: 25000,
    wholesalePrice: 22000,
    stockQuantity: 999,
    minStock: 0,
    isPrepared: true,
    imageUrl: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=300&auto=format&fit=crop&q=80',
  },
];

const INITIAL_SHELVES: ShelfLocation[] = [
  {
    id: 'shelf-01',
    code: 'KE01-T1A',
    displayType: 'KE',
    displayNumber: '01',
    tier: 1,
    slot: 'A',
    capacity: 35,
    currentCount: 22,
    status: 'ACTIVE',
    notes: 'Kệ 01 Tầng 1 Ô A - Cà phê Robusta mộc S18',
    assignedProducts: ['Cà phê Robusta Mộc S18 (500g)'],
  },
  {
    id: 'shelf-02',
    code: 'KE01-T1B',
    displayType: 'KE',
    displayNumber: '01',
    tier: 1,
    slot: 'B',
    capacity: 35,
    currentCount: 20,
    status: 'ACTIVE',
    notes: 'Kệ 01 Tầng 1 Ô B - Cà phê Arabica Cầu Đất',
    assignedProducts: ['Cà phê Arabica Cầu Đất (500g)'],
  },
  {
    id: 'shelf-03',
    code: 'KE01-T2',
    displayType: 'KE',
    displayNumber: '01',
    tier: 2,
    capacity: 60,
    currentCount: 52,
    status: 'ACTIVE',
    notes: 'Kệ 01 Tầng 2 (Full tầng) - Sữa đặc Phương Nam hộp 380g',
    assignedProducts: ['Sữa đặc Phương Nam hộp 380g'],
  },
  {
    id: 'shelf-04',
    code: 'TM01-T1A',
    displayType: 'TM',
    displayNumber: '01',
    tier: 1,
    slot: 'A',
    capacity: 50,
    currentCount: 48,
    status: 'ACTIVE',
    notes: 'Tủ mát 01 Tầng 1 Ô A - Nước ngọt ướp lạnh sẵn',
    assignedProducts: ['Nước ngọt Coca Cola lon 320ml (Ướp lạnh)'],
  },
  {
    id: 'shelf-05',
    code: 'TL01-T1',
    displayType: 'TL',
    displayNumber: '01',
    tier: 1,
    capacity: 40,
    currentCount: 30,
    status: 'ACTIVE',
    notes: 'Tủ lạnh đông 01 Tầng 1 (Full tầng) - Kem Merino & đồ đông',
    assignedProducts: ['Kem Ốc Quế Socola Merino'],
  },
  {
    id: 'shelf-06',
    code: 'MO01-T1A',
    displayType: 'MO',
    displayNumber: '01',
    tier: 1,
    slot: 'A',
    capacity: 40,
    currentCount: 35,
    status: 'ACTIVE',
    notes: 'Móc treo Pegboard 01 Hàng 1 Móc A - Ly giấy Kraft & túi',
    assignedProducts: ['Ly giấy Kraft 500ml kèm nắp'],
  },
  {
    id: 'shelf-07',
    code: 'RO01-A',
    displayType: 'RO',
    displayNumber: '01',
    tier: 1,
    slot: 'A',
    capacity: 30,
    currentCount: 25,
    status: 'ACTIVE',
    notes: 'Rổ trưng bày trái cây tươi Ô A - Táo Envy nhập khẩu',
    assignedProducts: ['Táo Envy New Zealand Tươi'],
  },
  {
    id: 'shelf-08',
    code: 'NC01-T1A',
    displayType: 'NC',
    displayNumber: '01',
    tier: 1,
    slot: 'A',
    capacity: 25,
    currentCount: 20,
    status: 'ACTIVE',
    notes: 'Máy bán nước tự động 01 Khay 1 Ô A - Trà Olong Tea+',
    assignedProducts: ['Trà Xanh Olong Tea+ Chai 455ml (Máy Bán Nước)'],
  },
  {
    id: 'shelf-09',
    code: 'KE02-T1',
    displayType: 'KE',
    displayNumber: '02',
    tier: 1,
    capacity: 50,
    currentCount: 15,
    status: 'ACTIVE',
    notes: 'Kệ 02 Tầng 1 (Full tầng) - Giấy in nhiệt quầy thu ngân',
    assignedProducts: ['Giấy in nhiệt K80 phi 45 (Bọc bạc)'],
  },
];

const INITIAL_WAREHOUSE_LOCATIONS: WarehouseLocation[] = [
  {
    id: 'wh-loc-01',
    code: 'KHO01-KS01',
    warehouseNumber: '01',
    rackType: 'KS',
    rackNumber: '01',
    zone: 'Khu A (Hàng Khô / Đóng Gói Sỉ)',
    tier: 1,
    capacity: 50,
    currentCount: 28,
    status: 'ACTIVE',
    notes: 'Kho 01 Kệ sắt 01 - Lưu trữ thùng lon, chai nước ngọt, thùng sữa đặc sỉ',
  },
  {
    id: 'wh-loc-02',
    code: 'KHO01-KS02',
    warehouseNumber: '01',
    rackType: 'KS',
    rackNumber: '02',
    zone: 'Khu B (Nguyên Liệu Cà Phê & Pha Chế)',
    tier: 1,
    capacity: 40,
    currentCount: 32,
    status: 'ACTIVE',
    notes: 'Kho 01 Kệ sắt 02 - Bao cà phê hạt mộc 30kg, bao cà phê Arabica',
  },
  {
    id: 'wh-loc-03',
    code: 'KHO01-KS03',
    warehouseNumber: '01',
    rackType: 'KS',
    rackNumber: '03',
    zone: 'Khu C (Bao Bì & Vật Tư Quán)',
    tier: 1,
    capacity: 60,
    currentCount: 45,
    status: 'ACTIVE',
    notes: 'Kho 01 Kệ sắt 03 - Thùng ly giấy 1000 cái, thùng giấy in K80',
  },
  {
    id: 'wh-loc-04',
    code: 'KHO01-KL01',
    warehouseNumber: '01',
    rackType: 'KL',
    rackNumber: '01',
    zone: 'Khu Lạnh (Kho Mát Bảo Quản Thực Phẩm)',
    tier: 1,
    capacity: 25,
    currentCount: 18,
    status: 'ACTIVE',
    notes: 'Kho 01 Kho lạnh 01 - Can siro đào, sữa tươi thanh trùng, bơ, sốt',
  },
  {
    id: 'wh-loc-05',
    code: 'KHO02-KS01',
    warehouseNumber: '02',
    rackType: 'KS',
    rackNumber: '01',
    zone: 'Kho Phụ 02 (Dự phòng mở rộng chuỗi)',
    tier: 1,
    capacity: 80,
    currentCount: 10,
    status: 'ACTIVE',
    notes: 'Kho 02 Kệ sắt 01 - Lưu trữ pallet & vật tư đợt cao điểm',
  },
];

const INITIAL_WAREHOUSE_ITEMS: WarehouseItem[] = [
  {
    id: 'wh-item-01',
    sku: 'WH-CF-01',
    barcode: '18935001001',
    name: 'Cà phê Hạt Robusta Mộc S18 (Bao Sỉ)',
    category: 'NguyenLieu_FB',
    bulkUnit: 'Bao',
    packageSpec: 'Bao 30kg hạt rang mộc',
    importPrice: 4800000,
    stockQuantity: 8,
    minStock: 2,
    locationCode: 'KHO01-KS02',
    supplier: 'Tổng Kho Cà Phê Ban Mê',
    unitsPerBulk: 60,
    linkedShelfProductId: 'prod-01',
    imageUrl: 'https://images.unsplash.com/photo-1587734195503-904fca47e0e9?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'wh-item-02',
    sku: 'WH-CF-02',
    barcode: '18935001002',
    name: 'Cà phê Arabica Cầu Đất (Bao Sỉ)',
    category: 'NguyenLieu_FB',
    bulkUnit: 'Bao',
    packageSpec: 'Bao 20kg hạt mộc',
    importPrice: 4400000,
    stockQuantity: 5,
    minStock: 2,
    locationCode: 'KHO01-KS02',
    supplier: 'Tổng Kho Cà Phê Ban Mê',
    unitsPerBulk: 40,
    linkedShelfProductId: 'prod-02',
    imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'wh-item-03',
    sku: 'WH-SUA-01',
    barcode: '18935001003',
    name: 'Sữa Đặc Phương Nam (Thùng Sỉ 48 Hộp)',
    category: 'HangKho_DongGoi',
    bulkUnit: 'Thùng',
    packageSpec: 'Thùng 48 lon (380g/lon)',
    importPrice: 840000,
    stockQuantity: 15,
    minStock: 4,
    locationCode: 'KHO01-KS01',
    supplier: 'Đại Lý Phân Phối Sữa Vinamilk',
    unitsPerBulk: 48,
    linkedShelfProductId: 'prod-03',
    imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'wh-item-04',
    sku: 'WH-LY-01',
    barcode: '18935001004',
    name: 'Ly Giấy Kraft 500ml Kèm Nắp (Thùng 1000 Cái)',
    category: 'BaoBi',
    bulkUnit: 'Thùng',
    packageSpec: 'Thùng 20 cây (50 cái/cây = 1000 cái)',
    importPrice: 820000,
    stockQuantity: 12,
    minStock: 3,
    locationCode: 'KHO01-KS03',
    supplier: 'Công ty Bao Bì Sài Gòn Xanh',
    unitsPerBulk: 20,
    linkedShelfProductId: 'prod-04',
    imageUrl: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'wh-item-05',
    sku: 'WH-GIAY-01',
    barcode: '18935001005',
    name: 'Giấy In Nhiệt K80 Phi 45 Bọc Bạc (Thùng 50 Cuộn)',
    category: 'VanPhongPham',
    bulkUnit: 'Thùng',
    packageSpec: 'Thùng 50 cuộn bọc bạc chống ẩm',
    importPrice: 320000,
    stockQuantity: 18,
    minStock: 5,
    locationCode: 'KHO01-KS03',
    supplier: 'Tổng Kho Thiết Bị An Nam',
    unitsPerBulk: 50,
    linkedShelfProductId: 'prod-05',
    imageUrl: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'wh-item-06',
    sku: 'WH-SIRO-01',
    barcode: '18935001006-CAN',
    name: 'Siro Đào Golden Farm (Can 5 Lít Pha Chế)',
    category: 'NguyenLieu_FB',
    bulkUnit: 'Can',
    packageSpec: 'Can 5 Lít đậm đặc',
    importPrice: 380000,
    stockQuantity: 10,
    minStock: 3,
    locationCode: 'KHO01-KL01',
    supplier: 'Cty Nguyên Liệu Pha Chế Việt',
    unitsPerBulk: 5,
    imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'wh-item-07',
    sku: 'WH-NUOC-01',
    barcode: '18935001006',
    name: 'Nước Ngọt Coca Cola (Thùng 24 Lon 320ml)',
    category: 'HangKho_DongGoi',
    bulkUnit: 'Thùng',
    packageSpec: 'Thùng 24 lon 320ml',
    importPrice: 195000,
    stockQuantity: 25,
    minStock: 5,
    locationCode: 'KHO01-KS01',
    supplier: 'Đại Lý Nước Giải Khát Miền Nam',
    unitsPerBulk: 24,
    linkedShelfProductId: 'prod-06',
    imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=300&auto=format&fit=crop&q=80',
  },
];

const INITIAL_RECIPES: PreparedRecipe[] = [
  {
    id: 'rec-01',
    productId: 'prod-fb-01',
    productName: 'Cà Phê Sữa Đá Pha Máy',
    prepTimeMinutes: 3,
    instructions: '1. Chiết xuất 40ml espresso đôi. 2. Cho 25ml sữa đặc vào ly. 3. Khuấy đều, thêm đá đầy ly. 4. Đổ espresso lên trên tạo tầng.',
    standardCost: 6500,
    retailPrice: 25000,
    ingredients: [
      { id: 'i1', ingredientName: 'Cà phê hạt Robusta Blend', unit: 'gram', quantityNeeded: 20, costPerUnit: 200, warehouseItemId: 'wh-item-01', warehouseLocationCode: 'KHO01-KS02' },
      { id: 'i2', ingredientName: 'Sữa đặc Phương Nam', unit: 'ml', quantityNeeded: 25, costPerUnit: 70, warehouseItemId: 'wh-item-03', warehouseLocationCode: 'KHO01-KS01' },
      { id: 'i3', ingredientName: 'Bộ Ly giấy + Nắp + Ống hút', unit: 'bộ', quantityNeeded: 1, costPerUnit: 1200, warehouseItemId: 'wh-item-04', warehouseLocationCode: 'KHO01-KS03' },
    ],
  },
  {
    id: 'rec-02',
    productId: 'prod-fb-03',
    productName: 'Trà Đào Cam Sả Tươi',
    prepTimeMinutes: 4,
    instructions: '1. Ủ cốt trà túi lọc 150ml. 2. Đập dập 1 nhánh sả, vắt 1/2 quả cam tươi. 3. Thêm 25ml siro đào + đường. 4. Lắc với đá và trang trí 2 miếng đào.',
    standardCost: 8500,
    retailPrice: 35000,
    ingredients: [
      { id: 'i4', ingredientName: 'Cốt trà túi lọc Cozy', unit: 'gói', quantityNeeded: 1, costPerUnit: 2200, warehouseLocationCode: 'KHO01-KL01' },
      { id: 'i5', ingredientName: 'Đào ngâm miếng Kronos', unit: 'miếng', quantityNeeded: 2, costPerUnit: 2500, warehouseLocationCode: 'KHO01-KL01' },
      { id: 'i6', ingredientName: 'Cam vàng & Sả tươi', unit: 'phần', quantityNeeded: 1, costPerUnit: 2000, warehouseLocationCode: 'KHO01-KL01' },
      { id: 'i7', ingredientName: 'Bộ Ly 500ml nắp cầu + ống hút to', unit: 'bộ', quantityNeeded: 1, costPerUnit: 1800, warehouseItemId: 'wh-item-04', warehouseLocationCode: 'KHO01-KS03' },
    ],
  },
];

const INITIAL_ONLINE_ORDERS: OnlineOrder[] = [
  {
    id: 'onl-01',
    orderCode: 'SPX-882199',
    platform: 'Shopee',
    customerName: 'Trần Văn Kiên',
    customerPhone: '0918 223 344',
    deliveryAddress: '24 Đường số 5, P. An Phú, TP. Thủ Đức',
    trackingCode: 'SPX_VN_8821990',
    itemsSummary: '2x Cà phê Arabica (500g)',
    totalAmount: 390000,
    platformFee: 46800,
    netRevenue: 343200,
    status: 'DELIVERED',
    createdAt: '2026-10-21 14:20',
  },
  {
    id: 'onl-02',
    orderCode: 'GRAB-D2D-441',
    platform: 'GrabFood',
    customerName: 'Hoàng Thị Yến',
    customerPhone: '0988 556 778',
    deliveryAddress: 'Tòa nhà Landmark 81, P.22, Bình Thạnh',
    trackingCode: 'GRAB-SHIP-441',
    itemsSummary: '3x Cà Phê Sữa Đá, 1x Bánh Mì Pate',
    totalAmount: 100000,
    platformFee: 20000,
    netRevenue: 80000,
    status: 'SHIPPING',
    createdAt: '2026-10-22 08:35',
  },
  {
    id: 'onl-03',
    orderCode: 'TT-SHOP-9912',
    platform: 'TikTokShop',
    customerName: 'Nguyễn Đăng Quang',
    customerPhone: '0903 778 990',
    deliveryAddress: '15 Lê Duẩn, Bến Nghé, Quận 1',
    trackingCode: 'JNT-TT-99120',
    itemsSummary: '5x Cà phê Robusta Mộc S18',
    totalAmount: 725000,
    platformFee: 87000,
    netRevenue: 638000,
    status: 'PREPARING',
    createdAt: '2026-10-22 09:10',
  },
];

const INITIAL_INVENTORY_TRANSACTIONS: InventoryTransaction[] = [
  {
    id: 'inv-01',
    slipCode: 'NK-202610-01',
    type: 'IN',
    supplier: 'Tổng Kho Cà Phê Ban Mê',
    totalCost: 10800000,
    notes: 'Nhập kho đầu tháng hạt Robusta S18 mộc',
    items: [
      { productName: 'Hạt Cà Phê Robusta S18', unit: 'kg', quantity: 60, costPrice: 180000, total: 10800000 },
    ],
    createdAt: '2026-10-01',
  },
  {
    id: 'inv-02',
    slipCode: 'NK-202610-02',
    type: 'IN',
    supplier: 'Công ty Bao Bì Sài Gòn Xanh',
    totalCost: 8500000,
    notes: 'Nhập ly giấy Kraft 500ml và ống hút',
    items: [
      { productName: 'Ly giấy Kraft 500ml', unit: 'thùng', quantity: 10, costPrice: 850000, total: 8500000 },
    ],
    createdAt: '2026-10-08',
  },
  {
    id: 'inv-03',
    slipCode: 'NK-202610-03',
    type: 'IN',
    supplier: 'Tổng Kho Thiết Bị & Văn Phòng Phẩm An Nam',
    totalCost: 1300000,
    notes: 'Nhập 2 thùng giấy in nhiệt K80 phi 45',
    items: [
      { productName: 'Giấy in nhiệt K80 phi 45 (Thùng 100 cuộn)', unit: 'thùng', quantity: 2, costPrice: 650000, total: 1300000 },
    ],
    createdAt: '2026-10-15',
  },
  {
    id: 'inv-out-01',
    slipCode: 'XK-202610-01',
    type: 'OUT',
    supplier: 'Xuất lên Kệ KE01-T1A',
    totalCost: 185000,
    notes: 'Xuất 1 thùng (24 lon) Nước Ngọt Coca Cola lon 320ml lên kệ KE01-T1A',
    items: [
      { productName: 'Nước Ngọt Coca Cola Lon 320ml', unit: 'thùng', quantity: 1, costPrice: 185000, total: 185000 },
    ],
    createdAt: '2026-10-18',
  },
  {
    id: 'inv-out-02',
    slipCode: 'XCB-202610-01',
    type: 'OUT',
    supplier: 'Quầy Pha Chế (Bar / F&B)',
    totalCost: 4800000,
    notes: 'Xuất 1 bao (30kg) Cà phê hạt Robusta Blend từ vị trí KHO01-KS02 cho Quầy Pha Chế phục vụ khách',
    items: [
      { productName: 'Cà phê hạt Robusta Blend (Bao Sỉ)', unit: 'Bao', quantity: 1, costPrice: 4800000, total: 4800000 },
    ],
    createdAt: '2026-10-20',
  },
];

const INITIAL_WHOLESALE_CUSTOMERS: WholesaleCustomer[] = [
  {
    id: 'ws-cust-01',
    companyName: 'CÔNG TY TNHH CÔNG NGHỆ VÀ TRUYỀN THÔNG ALPHA',
    taxId: '0315889922',
    address: 'Tầng 18, Tòa nhà Bitexco, Q.1, TP.HCM',
    contactPerson: 'Anh Trần Hùng (Trưởng phòng Hành chính)',
    phone: '0913 889 900',
    email: 'admin@alphatech.vn',
    debtBalance: 0,
  },
  {
    id: 'ws-cust-02',
    companyName: 'CÔNG TY CỔ PHẦN ĐẦU TƯ BẤT ĐỘNG SẢN PHƯƠNG NAM',
    taxId: '0108994433',
    address: '124 Hoàng Quốc Việt, Cầu Giấy, Hà Nội',
    contactPerson: 'Chị Mai Chi (Phụ trách vật tư chuỗi)',
    phone: '0983 224 466',
    email: 'purchasing@phuongnamland.com',
    debtBalance: 28000000,
  },
];

const INITIAL_WHOLESALE_INVOICES: WholesaleInvoice[] = [
  {
    id: 'ws-inv-01',
    invoiceNumber: 'HD-VAT-00101',
    customerName: 'CÔNG TY TNHH CÔNG NGHỆ VÀ TRUYỀN THÔNG ALPHA',
    taxId: '0315889922',
    address: 'Tầng 18, Tòa nhà Bitexco, Q.1, TP.HCM',
    items: [
      { name: 'Cà phê Robusta Mộc S18 (Bao 10kg)', unit: 'bao', quantity: 5, unitPrice: 1700000, amount: 8500000 },
      { name: 'Cà phê Arabica Cầu Đất (Bao 10kg)', unit: 'bao', quantity: 2, unitPrice: 2000000, amount: 4000000 },
    ],
    subtotal: 12500000,
    vatRate: 0.08,
    vatAmount: 1000000,
    totalAmount: 13500000,
    paymentStatus: 'PAID',
    createdAt: '2026-10-10',
  },
];

const INITIAL_CAPEX: CapExAsset[] = [
  {
    id: 'capex-01',
    name: 'Máy Pha Cà Phê 2 Group Nuova Simonelli Appia Life',
    category: 'MÁY MÓC',
    purchaseDate: '2026-01-15',
    originalValue: 85000000,
    depreciationMonths: 36,
    monthlyDepreciation: 2361111,
    status: 'ACTIVE',
    notes: 'Máy chính quầy pha chế, công suất 350 ly/ngày',
  },
  {
    id: 'capex-02',
    name: 'Máy Xay Cà Phê Tự Động Fiorenzato F64E',
    category: 'MÁY MÓC',
    purchaseDate: '2026-01-15',
    originalValue: 18500000,
    depreciationMonths: 24,
    monthlyDepreciation: 770833,
    status: 'ACTIVE',
    notes: 'Lưỡi xay phẳng Titanium',
  },
  {
    id: 'capex-03',
    name: 'Tủ Đông Mát 4 Cánh Sanaky Inverter',
    category: 'TỦ ĐÔNG/MÁT',
    purchaseDate: '2026-02-10',
    originalValue: 24000000,
    depreciationMonths: 48,
    monthlyDepreciation: 500000,
    status: 'ACTIVE',
    notes: 'Bảo quản nguyên liệu pha chế & đồ tươi',
  },
  {
    id: 'capex-04',
    name: 'Hệ Thống Kệ Sắt V Lỗ Đa Năng 5 Tầng (8 Dãy)',
    category: 'KỆ TỦ',
    purchaseDate: '2026-01-20',
    originalValue: 32000000,
    depreciationMonths: 60,
    monthlyDepreciation: 533333,
    status: 'ACTIVE',
    notes: 'Khu vực trưng bày cửa hàng & kho phụ',
  },
  {
    id: 'capex-05',
    name: 'Dàn Máy POS 2 Màn Hình Cảm Ứng + Máy In Nhiệt K80 + Máy Quét Barcode',
    category: 'THIẾT BỊ IT',
    purchaseDate: '2026-01-18',
    originalValue: 16500000,
    depreciationMonths: 24,
    monthlyDepreciation: 687500,
    status: 'ACTIVE',
    notes: 'Phục vụ quầy thu ngân & màn hình đối diện khách hàng',
  },
  {
    id: 'capex-06',
    name: 'Xe Máy Honda Wave RSX Giao Hàng Bán Sỉ & Online',
    category: 'XE CỘ',
    purchaseDate: '2026-03-05',
    originalValue: 21500000,
    depreciationMonths: 48,
    monthlyDepreciation: 447917,
    status: 'ACTIVE',
    notes: 'Xe chuyên dụng giao hàng nội thành',
  },
];

const INITIAL_OPEX: OpExExpense[] = [
  {
    id: 'opex-01',
    category: 'ĐIỆN',
    amount: 4350000,
    expenseDate: '2026-10-05',
    isAutoFromInventory: false,
    notes: 'Tiền điện kinh doanh tháng 09 (EVN)',
  },
  {
    id: 'opex-02',
    category: 'NƯỚC',
    amount: 890000,
    expenseDate: '2026-10-06',
    isAutoFromInventory: false,
    notes: 'Tiền nước Sawaco tháng 09',
  },
  {
    id: 'opex-03',
    category: 'BẢO TRÌ',
    amount: 500000,
    expenseDate: '2026-10-12',
    isAutoFromInventory: false,
    notes: 'Thay ron máy pha cà phê và vệ sinh lưới lọc',
  },
  {
    id: 'opex-04',
    category: 'VẬT TƯ',
    amount: 1950000,
    expenseDate: '2026-10-15',
    isAutoFromInventory: false,
    notes: 'Giấy in nhiệt bill K80, túi chữ T mang đi, ống hút',
  },
  {
    id: 'opex-05',
    category: 'NHẬP HÀNG KHO',
    amount: 20600000, // Tự động rollup từ Tab 4 Kho hàng (10.8tr + 8.5tr + 1.3tr = 20.6tr)
    expenseDate: '2026-10-20',
    isAutoFromInventory: true,
    notes: 'Tổng chi phí mua nhập hàng kho trong tháng (Tự động từ Tab 4 Kho Hàng)',
  },
  {
    id: 'opex-06',
    category: 'MẶT BẰNG',
    amount: 15000000,
    expenseDate: '2026-10-01',
    isAutoFromInventory: false,
    notes: 'Tiền thuê mặt bằng kinh doanh tháng 10',
  },
  {
    id: 'opex-07',
    category: 'LƯƠNG',
    amount: 25000000,
    expenseDate: '2026-10-10',
    isAutoFromInventory: false,
    notes: 'Lương 2 thu ngân + 1 nhân viên kho/pha chế',
  },
];

const INITIAL_CAPITAL: CapitalMetric[] = [
  {
    monthYear: '2026-05',
    openCapital: 200000000,
    lowCapital: 190000000,
    highCapital: 218000000,
    closeCapital: 215000000,
    revenue: 88000000,
    cogsAndPurchases: 45000000,
    opexSpent: 73000000,
    netProfit: 15000000,
    growthRate: 0.075,
  },
  {
    monthYear: '2026-06',
    openCapital: 215000000,
    lowCapital: 208000000,
    highCapital: 235000000,
    closeCapital: 232000000,
    revenue: 100000000,
    cogsAndPurchases: 50000000,
    opexSpent: 83000000,
    netProfit: 17000000,
    growthRate: 0.079,
  },
  {
    monthYear: '2026-07',
    openCapital: 232000000,
    lowCapital: 225000000,
    highCapital: 258000000,
    closeCapital: 254000000,
    revenue: 114000000,
    cogsAndPurchases: 56000000,
    opexSpent: 92000000,
    netProfit: 22000000,
    growthRate: 0.095,
  },
  {
    monthYear: '2026-08',
    openCapital: 254000000,
    lowCapital: 245000000,
    highCapital: 282000000,
    closeCapital: 278000000,
    revenue: 129000000,
    cogsAndPurchases: 62000000,
    opexSpent: 105000000,
    netProfit: 24000000,
    growthRate: 0.094,
  },
  {
    monthYear: '2026-09',
    openCapital: 278000000,
    lowCapital: 269000000,
    highCapital: 310000000,
    closeCapital: 305000000,
    revenue: 150000000,
    cogsAndPurchases: 70000000,
    opexSpent: 123000000,
    netProfit: 27000000,
    growthRate: 0.097,
  },
  {
    monthYear: '2026-10',
    openCapital: 305000000,
    lowCapital: 298000000,
    highCapital: 345000000,
    closeCapital: 341000000,
    revenue: 177000000,
    cogsAndPurchases: 82000000,
    opexSpent: 141000000,
    netProfit: 36000000,
    growthRate: 0.118,
  },
];

const INITIAL_SETTINGS: AppSettings = {
  storeName: 'PGDSHOP - CỬA HÀNG BÁN LẺ & F&B',
  storeAddress: '124 Hoàng Quốc Việt, Cầu Giấy, Hà Nội',
  storePhone: '0901 234 567',
  storeTaxId: '0318992211',
  bankConfig: DEFAULT_BANK_CONFIG,
  supabaseUrl: '',
  supabaseAnonKey: '',
  googleSheetsWebhookUrl: '',
  isAudioEnabled: true,
  voiceSpeed: 1.0,
  autoClearDelaySeconds: 3,
  mainTheme: 'cyber-neon',
  customerTheme: 'sunset-glow',
};

class StorageService {
  private supabase: SupabaseClient | null = null;

  constructor() {
    this.initSupabaseFromSettings();
  }

  public getSupabaseClient(): SupabaseClient | null {
    return this.supabase;
  }

  private initSupabaseFromSettings() {
    const settings = this.getSettings();
    if (settings.supabaseUrl && settings.supabaseAnonKey) {
      try {
        this.supabase = createClient(settings.supabaseUrl, settings.supabaseAnonKey);
      } catch (err) {
        console.warn('Failed to init Supabase client:', err);
      }
    }
  }

  private getItem<T>(key: string, defaultValue: T): T {
    if (typeof window === 'undefined') return defaultValue;
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PREFIX + key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private setItem<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(value));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }

  // Helper chuẩn hóa mã vị trí cũ sang chuẩn mới theo quy định
  private migrateLocationCode(code?: string): string | undefined {
    if (!code) return code;
    const c = code.trim().toUpperCase();
    if (c === 'KE-A1-T1') return 'KE01-T1A';
    if (c === 'KE-A1-T2') return 'KE01-T2';
    if (c === 'KE-B1-T1') return 'MO01-T1A';
    if (c === 'KE-B2-T1') return 'KE02-T1';
    if (c === 'KHO-A1-T1') return 'KHO01-KS01';
    if (c === 'KHO-B1-T1') return 'KHO01-KS02';
    if (c === 'KHO-C1-T1') return 'KHO01-KS03';
    if (c === 'KHO-LANH-01') return 'KHO01-KL01';
    return code;
  }

  // --- Products ---
  public getProducts(): Product[] {
    const list = this.getItem<Product[]>('products', INITIAL_PRODUCTS);
    let hasChanges = false;

    // Đảm bảo bổ sung các mặt hàng mẫu mới (TM01-T1A, TL01-T1, RO01-A, NC01-T1A) nếu chưa có
    for (const initP of INITIAL_PRODUCTS) {
      if (!list.some((p) => p.id === initP.id)) {
        list.push(initP);
        hasChanges = true;
      }
    }

    const migrated = list.map((item) => {
      let changed = false;
      let newItem = { ...item };

      // Chế biến: Không có mã vị trí kệ vì làm và bán tại chỗ
      if (newItem.isPrepared && newItem.shelfCode) {
        delete newItem.shelfCode;
        changed = true;
      } else if (newItem.shelfCode) {
        const updatedCode = this.migrateLocationCode(newItem.shelfCode);
        if (updatedCode !== newItem.shelfCode) {
          newItem.shelfCode = updatedCode;
          changed = true;
        }
      }

      if (!newItem.imageUrl) {
        const fallback = INITIAL_PRODUCTS.find((p) => p.id === newItem.id);
        if (fallback?.imageUrl) {
          newItem.imageUrl = fallback.imageUrl;
          changed = true;
        }
      }

      if (!newItem.caseBarcode) {
        const fallback = INITIAL_PRODUCTS.find((p) => p.id === newItem.id);
        if (fallback?.caseBarcode) {
          newItem.caseBarcode = fallback.caseBarcode;
          newItem.caseUnit = fallback.caseUnit;
          newItem.unitsPerCase = fallback.unitsPerCase;
          newItem.casePrice = fallback.casePrice;
          changed = true;
        }
      }

      if (changed) hasChanges = true;
      return newItem;
    });

    if (hasChanges) {
      this.saveProducts(migrated);
    }
    return migrated;
  }
  public saveProducts(products: Product[]): void {
    this.setItem('products', products);
  }
  public addProduct(product: Product): void {
    const list = this.getProducts();
    list.unshift(product);
    this.saveProducts(list);
  }
  public updateProduct(product: Product): void {
    const list = this.getProducts().map((p) => (p.id === product.id ? product : p));
    this.saveProducts(list);
  }
  public deleteProduct(id: string): void {
    const list = this.getProducts().filter((p) => p.id !== id);
    this.saveProducts(list);
  }

  // --- Shelves (Tab 1) ---
  public getShelves(): ShelfLocation[] {
    const list = this.getItem<ShelfLocation[]>('shelves', INITIAL_SHELVES);
    // Nếu dữ liệu cũ trong localStorage vẫn mang mã cũ như KE-A1-T1, tự động nâng cấp sang INITIAL_SHELVES mới
    const hasOldCode = list.some((s) => s.code.includes('KE-') || !s.displayType);
    if (hasOldCode) {
      this.saveShelves(INITIAL_SHELVES);
      return INITIAL_SHELVES;
    }
    return list;
  }
  public saveShelves(shelves: ShelfLocation[]): void {
    this.setItem('shelves', shelves);
  }

  // --- Recipes (Tab 2) ---
  public getRecipes(): PreparedRecipe[] {
    return this.getItem('recipes', INITIAL_RECIPES);
  }
  public saveRecipes(recipes: PreparedRecipe[]): void {
    this.setItem('recipes', recipes);
  }
  public addRecipe(recipe: PreparedRecipe, createProduct: boolean = true): void {
    const list = this.getRecipes();
    list.unshift(recipe);
    this.saveRecipes(list);

    if (createProduct) {
      const newProd: Product = {
        id: recipe.productId || 'prod-fb-' + Date.now(),
        barcode: '20' + Math.floor(10000000 + Math.random() * 90000000),
        name: recipe.productName,
        category: 'CheBien_FB',
        unit: 'Phần',
        costPrice: recipe.standardCost,
        retailPrice: recipe.retailPrice,
        wholesalePrice: Math.round(recipe.retailPrice * 0.9),
        stockQuantity: 999,
        minStock: 0,
        isPrepared: true,
      };
      this.addProduct(newProd);
    }
  }
  public updateRecipe(recipe: PreparedRecipe): void {
    const list = this.getRecipes().map((r) => (r.id === recipe.id ? recipe : r));
    this.saveRecipes(list);

    const prodList = this.getProducts();
    const prod = prodList.find((p) => p.id === recipe.productId || p.name === recipe.productName);
    if (prod) {
      prod.costPrice = recipe.standardCost;
      prod.retailPrice = recipe.retailPrice;
      this.saveProducts(prodList);
    }
  }
  public deleteRecipe(id: string): void {
    const list = this.getRecipes().filter((r) => r.id !== id);
    this.saveRecipes(list);
  }

  // --- Online Orders (Tab 3) ---
  public getOnlineOrders(): OnlineOrder[] {
    return this.getItem('online_orders', INITIAL_ONLINE_ORDERS);
  }
  public saveOnlineOrders(orders: OnlineOrder[]): void {
    this.setItem('online_orders', orders);
  }

  // --- Warehouse & Inventory (Tab 4) ---
  public getWarehouseItems(): WarehouseItem[] {
    const list = this.getItem<WarehouseItem[]>('warehouse_items', INITIAL_WAREHOUSE_ITEMS);
    let changed = false;
    const migrated = list.map((item) => {
      let itemChanged = false;
      let newItem = { ...item };
      const updatedLoc = this.migrateLocationCode(newItem.locationCode);
      if (updatedLoc && updatedLoc !== newItem.locationCode) {
        itemChanged = true;
        newItem.locationCode = updatedLoc;
      }
      if (!newItem.barcode) {
        const initItem = INITIAL_WAREHOUSE_ITEMS.find((w) => w.id === newItem.id || w.sku === newItem.sku);
        if (initItem?.barcode) {
          newItem.barcode = initItem.barcode;
          itemChanged = true;
        }
      }
      if (itemChanged) changed = true;
      return newItem;
    });
    if (changed) {
      this.saveWarehouseItems(migrated);
    }
    return migrated;
  }
  public saveWarehouseItems(items: WarehouseItem[]): void {
    this.setItem('warehouse_items', items);
  }
  public addWarehouseItem(item: WarehouseItem): void {
    const list = this.getWarehouseItems();
    list.unshift(item);
    this.saveWarehouseItems(list);
  }
  public updateWarehouseItem(item: WarehouseItem): void {
    const list = this.getWarehouseItems().map((w) => (w.id === item.id ? item : w));
    this.saveWarehouseItems(list);
  }
  public deleteWarehouseItem(id: string): void {
    const list = this.getWarehouseItems().filter((w) => w.id !== id);
    this.saveWarehouseItems(list);
  }
  public getWarehouseLocations(): WarehouseLocation[] {
    const list = this.getItem<WarehouseLocation[]>('warehouse_locations', INITIAL_WAREHOUSE_LOCATIONS);
    const hasOldCode = list.some((l) => l.code.includes('KHO-') || !l.rackType);
    if (hasOldCode) {
      this.saveWarehouseLocations(INITIAL_WAREHOUSE_LOCATIONS);
      return INITIAL_WAREHOUSE_LOCATIONS;
    }
    return list;
  }
  public saveWarehouseLocations(locations: WarehouseLocation[]): void {
    this.setItem('warehouse_locations', locations);
  }

  // Xuất kho lên kệ bán lẻ: Trừ số lượng thùng/bao/can trong kho và cộng vào sản phẩm trên kệ
  public transferWarehouseToShelf(warehouseItemId: string, bulkQuantity: number, targetShelfCode?: string): boolean {
    const whList = this.getWarehouseItems();
    const itemIndex = whList.findIndex((w) => w.id === warehouseItemId);
    if (itemIndex === -1) return false;
    const whItem = whList[itemIndex];
    if (whItem.stockQuantity < bulkQuantity) return false;

    whItem.stockQuantity -= bulkQuantity;
    this.saveWarehouseItems(whList);

    // Tìm sản phẩm trên kệ để cộng dồn tồn kho
    const productList = this.getProducts();
    const targetProd = productList.find((p) => p.id === whItem.linkedShelfProductId || p.name.includes(whItem.name.split('(')[0].trim()));
    const unitsPerBulk = whItem.unitsPerBulk || 1;
    const addedUnits = bulkQuantity * unitsPerBulk;

    if (targetProd) {
      targetProd.stockQuantity += addedUnits;
      if (targetShelfCode) {
        targetProd.shelfCode = targetShelfCode;
      }
      this.saveProducts(productList);
    }

    // Ghi log giao dịch xuất kho
    const slipCode = `XK-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${Math.floor(10 + Math.random() * 90)}`;
    const newTx: InventoryTransaction = {
      id: 'inv-out-' + Date.now(),
      slipCode,
      type: 'OUT',
      supplier: 'Xuất lên Kệ ' + (targetShelfCode || targetProd?.shelfCode || 'KE01-T1A'),
      totalCost: bulkQuantity * whItem.importPrice,
      notes: `Xuất ${bulkQuantity} ${whItem.bulkUnit} (${addedUnits} ${whItem.packageSpec}) từ vị trí ${whItem.locationCode} ra kệ`,
      items: [
        {
          productName: whItem.name,
          unit: whItem.bulkUnit,
          quantity: bulkQuantity,
          costPrice: whItem.importPrice,
          total: bulkQuantity * whItem.importPrice,
        },
      ],
      createdAt: new Date().toISOString().slice(0, 10),
    };
    this.addInventoryTransaction(newTx);
    return true;
  }

  // Xuất kho cho quầy chế biến (F&B / Pha chế): Trừ số lượng nguyên liệu trong kho và ghi nhận phiếu xuất kho chế biến
  public transferWarehouseToPreparation(
    warehouseItemId: string,
    bulkQuantity: number,
    purpose: string = 'Quầy Pha Chế (Bar / F&B)',
    notes?: string
  ): boolean {
    const whList = this.getWarehouseItems();
    const itemIndex = whList.findIndex((w) => w.id === warehouseItemId);
    if (itemIndex === -1) return false;
    const whItem = whList[itemIndex];
    if (whItem.stockQuantity < bulkQuantity) return false;

    whItem.stockQuantity -= bulkQuantity;
    this.saveWarehouseItems(whList);

    const unitsPerBulk = whItem.unitsPerBulk || 1;
    const addedUnits = bulkQuantity * unitsPerBulk;

    // Ghi log giao dịch xuất kho chế biến
    const slipCode = `XCB-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${Math.floor(10 + Math.random() * 90)}`;
    const newTx: InventoryTransaction = {
      id: 'inv-out-cb-' + Date.now(),
      slipCode,
      type: 'OUT',
      supplier: purpose,
      totalCost: bulkQuantity * whItem.importPrice,
      notes: notes || `Xuất ${bulkQuantity} ${whItem.bulkUnit} (${addedUnits} ${whItem.packageSpec}) từ vị trí ${whItem.locationCode} cho ${purpose}`,
      items: [
        {
          productName: whItem.name,
          unit: whItem.bulkUnit,
          quantity: bulkQuantity,
          costPrice: whItem.importPrice,
          total: bulkQuantity * whItem.importPrice,
        },
      ],
      createdAt: new Date().toISOString().slice(0, 10),
    };
    this.addInventoryTransaction(newTx);
    return true;
  }

  // --- Inventory Transactions (Tab 4) ---
  public getInventoryTransactions(): InventoryTransaction[] {
    return this.getItem('inventory_trans', INITIAL_INVENTORY_TRANSACTIONS);
  }
  public saveInventoryTransactions(trans: InventoryTransaction[]): void {
    this.setItem('inventory_trans', trans);
    // Tự động đồng bộ sang OpEx
    this.recalculateInventoryCostToOpEx();
  }
  public addInventoryTransaction(tx: InventoryTransaction): void {
    const list = this.getInventoryTransactions();
    list.unshift(tx);
    this.saveInventoryTransactions(list);
  }

  // --- Wholesale (Tab 5) ---
  public getWholesaleCustomers(): WholesaleCustomer[] {
    return this.getItem('wholesale_customers', INITIAL_WHOLESALE_CUSTOMERS);
  }
  public saveWholesaleCustomers(customers: WholesaleCustomer[]): void {
    this.setItem('wholesale_customers', customers);
  }
  public getWholesaleInvoices(): WholesaleInvoice[] {
    return this.getItem('wholesale_invoices', INITIAL_WHOLESALE_INVOICES);
  }
  public saveWholesaleInvoices(invoices: WholesaleInvoice[]): void {
    this.setItem('wholesale_invoices', invoices);
  }

  // --- CapEx (Tab 6) ---
  public getCapEx(): CapExAsset[] {
    return this.getItem('capex_assets', INITIAL_CAPEX);
  }
  public saveCapEx(assets: CapExAsset[]): void {
    this.setItem('capex_assets', assets);
  }

  // --- OpEx (Tab 7) ---
  public getOpEx(): OpExExpense[] {
    return this.getItem('opex_expenses', INITIAL_OPEX);
  }
  public saveOpEx(expenses: OpExExpense[]): void {
    this.setItem('opex_expenses', expenses);
  }

  // Tự động tính tổng chi phí nhập kho và update dòng 'NHẬP HÀNG KHO' trong OpEx
  public recalculateInventoryCostToOpEx(): void {
    const invList = this.getInventoryTransactions();
    const totalInventoryInCost = invList
      .filter((tx) => tx.type === 'IN')
      .reduce((sum, tx) => sum + tx.totalCost, 0);

    const opexList = this.getOpEx();
    const invOpExIndex = opexList.findIndex((item) => item.category === 'NHẬP HÀNG KHO');

    if (invOpExIndex >= 0) {
      opexList[invOpExIndex].amount = totalInventoryInCost;
    } else {
      opexList.push({
        id: 'opex-auto-inv',
        category: 'NHẬP HÀNG KHO',
        amount: totalInventoryInCost,
        expenseDate: new Date().toISOString().slice(0, 10),
        isAutoFromInventory: true,
        notes: 'Tổng chi phí mua nhập hàng kho trong tháng (Tự động từ Tab 4 Kho Hàng)',
      });
    }
    this.setItem('opex_expenses', opexList);
  }

  // --- Capital (Tab 8) ---
  public getCapital(): CapitalMetric[] {
    return this.getItem('capital_metrics', INITIAL_CAPITAL);
  }
  public saveCapital(metrics: CapitalMetric[]): void {
    this.setItem('capital_metrics', metrics);
  }

  // --- POS Orders History ---
  public getPosOrders(): PosOrder[] {
    return this.getItem('pos_orders_history', []);
  }
  public savePosOrder(order: PosOrder): void {
    const list = this.getPosOrders();
    list.unshift(order);
    this.setItem('pos_orders_history', list);

    // Gửi dữ liệu sang Google Sheets nếu đã cấu hình Webhook URL
    this.sendToGoogleSheetsWebhook('ADD_ORDER', {
      orderCode: order.orderCode,
      platform: 'POS Quầy',
      customerName: 'Khách Lẻ',
      totalAmount: order.finalAmount,
      fee: 0,
    });
  }

  // --- Settings ---
  public getSettings(): AppSettings {
    return this.getItem('app_settings', INITIAL_SETTINGS);
  }
  public saveSettings(settings: AppSettings): void {
    this.setItem('app_settings', settings);
    this.initSupabaseFromSettings();
  }

  // --- Sync Webhook to Google Sheets ---
  public async sendToGoogleSheetsWebhook(action: string, payload: Record<string, unknown>): Promise<boolean> {
    const settings = this.getSettings();
    if (!settings.googleSheetsWebhookUrl) return false;

    try {
      await fetch(settings.googleSheetsWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action, ...payload }),
        mode: 'no-cors',
      });
      return true;
    } catch (e) {
      console.warn('Google Sheets Webhook error:', e);
      return false;
    }
  }
}

export const storageService = new StorageService();
