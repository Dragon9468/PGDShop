// ==============================================================================
// PGDShop - Central Data Store & Supabase / LocalStorage / Google Sheets Hub
// ==============================================================================

import {
  Product,
  ShelfLocation,
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
    shelfCode: 'KE-A1-T1',
    isPrepared: false,
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
    shelfCode: 'KE-A1-T1',
    isPrepared: false,
  },
  {
    id: 'prod-03',
    barcode: '8935001003',
    name: 'Sữa đặc Phương Nam hộp 380g',
    category: 'TapHoa',
    unit: 'Hộp',
    costPrice: 18000,
    retailPrice: 24000,
    wholesalePrice: 20000,
    stockQuantity: 120,
    minStock: 24,
    shelfCode: 'KE-A1-T2',
    isPrepared: false,
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
    shelfCode: 'KE-B1-T1',
    isPrepared: false,
  },
  {
    id: 'prod-05',
    barcode: '8935001005',
    name: 'Giấy in nhiệt K80 phi 45 (Bọc bạc)',
    category: 'VanPhongPham',
    unit: 'Cuộn',
    costPrice: 6500,
    retailPrice: 10000,
    wholesalePrice: 7500,
    stockQuantity: 80,
    minStock: 15,
    shelfCode: 'KE-B2-T1',
    isPrepared: false,
  },
  // Các món chế biến tại quầy (F&B)
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
  },
];

const INITIAL_SHELVES: ShelfLocation[] = [
  {
    id: 'shelf-01',
    code: 'KE-A1-T1',
    aisle: 'A',
    tier: 1,
    capacity: 50,
    currentCount: 42,
    status: 'ACTIVE',
    notes: 'Kệ mặt tiền chính, trưng bày các dòng Cà phê hạt cao cấp',
    assignedProducts: ['Cà phê Robusta Mộc S18', 'Cà phê Arabica Cầu Đất'],
  },
  {
    id: 'shelf-02',
    code: 'KE-A1-T2',
    aisle: 'A',
    tier: 2,
    capacity: 60,
    currentCount: 52,
    status: 'ACTIVE',
    notes: 'Tầng ngang tầm mắt, nguyên liệu pha chế & đồ hộp',
    assignedProducts: ['Sữa đặc Phương Nam', 'Bột Cacao Đắk Lắk'],
  },
  {
    id: 'shelf-03',
    code: 'KE-B1-T1',
    aisle: 'B',
    tier: 1,
    capacity: 80,
    currentCount: 75,
    status: 'FULL',
    notes: 'Khu vực bao bì, ly giấy, túi xách F&B',
    assignedProducts: ['Ly giấy Kraft 500ml', 'Ống hút gạo tự hủy'],
  },
  {
    id: 'shelf-04',
    code: 'KE-B2-T1',
    aisle: 'B',
    tier: 2,
    capacity: 40,
    currentCount: 15,
    status: 'ACTIVE',
    notes: 'Vật tư tiêu hao văn phòng & quầy thu ngân',
    assignedProducts: ['Giấy in nhiệt K80', 'Ruy băng máy in'],
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
      { id: 'i1', ingredientName: 'Cà phê hạt Robusta Blend', unit: 'gram', quantityNeeded: 20, costPerUnit: 200 },
      { id: 'i2', ingredientName: 'Sữa đặc Ngôi sao', unit: 'ml', quantityNeeded: 25, costPerUnit: 70 },
      { id: 'i3', ingredientName: 'Bộ Ly giấy + Nắp + Ống hút', unit: 'bộ', quantityNeeded: 1, costPerUnit: 1200 },
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
      { id: 'i4', ingredientName: 'Cốt trà túi lọc Cozy', unit: 'gói', quantityNeeded: 1, costPerUnit: 2200 },
      { id: 'i5', ingredientName: 'Đào ngâm miếng Kronos', unit: 'miếng', quantityNeeded: 2, costPerUnit: 2500 },
      { id: 'i6', ingredientName: 'Cam vàng & Sả tươi', unit: 'phần', quantityNeeded: 1, costPerUnit: 2000 },
      { id: 'i7', ingredientName: 'Bộ Ly 500ml nắp cầu + ống hút to', unit: 'bộ', quantityNeeded: 1, costPerUnit: 1800 },
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
};

class StorageService {
  private supabase: SupabaseClient | null = null;

  constructor() {
    this.initSupabaseFromSettings();
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

  // --- Products ---
  public getProducts(): Product[] {
    return this.getItem('products', INITIAL_PRODUCTS);
  }
  public saveProducts(products: Product[]): void {
    this.setItem('products', products);
  }
  public addProduct(product: Product): void {
    const list = this.getProducts();
    list.unshift(product);
    this.saveProducts(list);
  }

  // --- Shelves (Tab 1) ---
  public getShelves(): ShelfLocation[] {
    return this.getItem('shelves', INITIAL_SHELVES);
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

  // --- Online Orders (Tab 3) ---
  public getOnlineOrders(): OnlineOrder[] {
    return this.getItem('online_orders', INITIAL_ONLINE_ORDERS);
  }
  public saveOnlineOrders(orders: OnlineOrder[]): void {
    this.setItem('online_orders', orders);
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
