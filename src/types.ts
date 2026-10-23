// ==============================================================================
// PGDShop - TypeScript Definitions
// ==============================================================================

export type ProductCategory = 'TatCa' | 'TapHoa' | 'CheBien_FB' | 'BaoBi' | 'VanPhongPham';

export interface Product {
  id: string;
  barcode: string;
  name: string;
  category: ProductCategory;
  unit: string;
  costPrice: number;
  retailPrice: number;
  wholesalePrice: number;
  stockQuantity: number;
  minStock: number;
  shelfCode?: string;
  isPrepared: boolean; // Món do quán chế biến (Cà phê, trà, đồ ăn)
  imageUrl?: string;
}

// Loại thiết bị / giá trưng bày bán lẻ:
// KE: Kệ hàng, TL: Tủ lạnh, TM: Tủ mát, MO: Pegboard móc treo, RO: Rổ trái cây/rau củ, NC: Máy bán nước tự động
export type RetailDisplayType = 'KE' | 'TL' | 'TM' | 'MO' | 'RO' | 'NC';

export interface ShelfLocation {
  id: string;
  code: string; // VD: KE01-T1A, KE01-T1, TM01-T1A, TL01-T1, MO01-T1A, RO01-A, NC01-T1A
  displayType?: RetailDisplayType; // KE, TL, TM, MO, RO, NC
  displayNumber?: string; // 01, 02...
  tier: number; // Tầng 1, 2, 3
  slot?: string; // Ô A, B, C... (nếu chia ô trên cùng tầng)
  capacity: number;
  currentCount: number;
  status: 'ACTIVE' | 'FULL' | 'MAINTENANCE';
  notes: string;
  assignedProducts: string[];
}

export type WarehouseBulkUnit = 'Thùng' | 'Bao' | 'Kg' | 'Lít' | 'Can' | 'Két' | 'Cuộn' | 'Kiện';
export type WarehouseRackType = 'KS' | 'KL' | 'PL'; // KS: Kệ sắt, KL: Kho lạnh, PL: Pallet

export interface WarehouseLocation {
  id: string;
  code: string; // VD: KHO01-KS01, KHO01-KS02, KHO01-KL01
  warehouseNumber?: string; // 01, 02...
  rackType?: WarehouseRackType; // KS, KL, PL
  rackNumber?: string; // 01, 02...
  zone: string; // Khu A (Hàng khô), Khu B (Nguyên liệu pha chế), Khu C (Bao bì, vật tư)
  tier: number;
  capacity: number; // Sức chứa theo thùng / bao / can
  currentCount: number;
  status: 'ACTIVE' | 'FULL' | 'MAINTENANCE';
  notes: string;
}

export interface WarehouseItem {
  id: string;
  sku: string; // Mã lưu kho (WH-CF-01)
  name: string;
  category: 'NguyenLieu_FB' | 'HangKho_DongGoi' | 'BaoBi' | 'VanPhongPham';
  bulkUnit: WarehouseBulkUnit; // Thùng / Kg / Lít / Can / Bao...
  packageSpec: string; // Quy cách: "Thùng 24 lon", "Bao 30kg hạt Robusta", "Can 5L siro", "Thùng 48 hộp"
  importPrice: number; // Giá nhập sỉ (thùng/bao/lít/kg) - khác giá lẻ trên kệ
  stockQuantity: number; // Số lượng tồn kho theo bulkUnit
  minStock: number;
  locationCode: string; // Vị trí kho (VD: KHO-A1-T1)
  supplier: string;
  linkedShelfProductId?: string; // Liên kết tới sản phẩm ngoài kệ để chuyển kho lên kệ
  unitsPerBulk?: number; // Số đơn vị lẻ trong 1 đơn vị kho (VD: 1 thùng = 24 lon)
  imageUrl?: string;
}

export interface RecipeIngredient {
  id: string;
  ingredientName: string;
  unit: string;
  quantityNeeded: number;
  costPerUnit: number;
}

export interface PreparedRecipe {
  id: string;
  productId: string;
  productName: string;
  prepTimeMinutes: number;
  instructions: string;
  ingredients: RecipeIngredient[];
  standardCost: number;
  retailPrice: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  subtotal: number;
}

export interface PosOrder {
  id: string;
  orderCode: string;
  cashierName: string;
  items: CartItem[];
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  paymentMethod: 'CASH' | 'VIETQR' | 'WHOLESALE';
  paymentStatus: 'PENDING' | 'PAID' | 'CANCELLED';
  transferContent: string;
  createdAt: string;
  paidAt?: string;
}

export type OnlinePlatform = 'Shopee' | 'GrabFood' | 'TikTokShop' | 'Web';

export interface OnlineOrder {
  id: string;
  orderCode: string;
  platform: OnlinePlatform;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  trackingCode: string;
  itemsSummary: string;
  totalAmount: number;
  platformFee: number;
  netRevenue: number;
  status: 'NEW' | 'PREPARING' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED';
  createdAt: string;
}

export interface InventorySlipItem {
  productName: string;
  unit: string;
  quantity: number;
  costPrice: number;
  total: number;
}

export interface InventoryTransaction {
  id: string;
  slipCode: string; // NK-20261022-01
  type: 'IN' | 'OUT';
  supplier: string;
  totalCost: number; // Đẩy vào OpEx
  notes: string;
  items: InventorySlipItem[];
  createdAt: string;
}

export interface WholesaleCustomer {
  id: string;
  companyName: string;
  taxId: string;
  address: string;
  contactPerson: string;
  phone: string;
  email: string;
  debtBalance: number;
}

export interface WholesaleInvoice {
  id: string;
  invoiceNumber: string; // HĐ-VAT-00128
  customerName: string;
  taxId: string;
  address: string;
  items: {
    name: string;
    unit: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }[];
  subtotal: number;
  vatRate: number; // 0.08 hoặc 0.10
  vatAmount: number;
  totalAmount: number;
  paymentStatus: 'PAID' | 'UNPAID' | 'PARTIAL';
  createdAt: string;
}

export interface CapExAsset {
  id: string;
  name: string;
  category: 'MÁY MÓC' | 'KỆ TỦ' | 'XE CỘ' | 'TỦ ĐÔNG/MÁT' | 'THIẾT BỊ IT';
  purchaseDate: string;
  originalValue: number;
  depreciationMonths: number;
  monthlyDepreciation: number;
  status: 'ACTIVE' | 'LIQUIDATED';
  notes: string;
}

export interface OpExExpense {
  id: string;
  category: 'ĐIỆN' | 'NƯỚC' | 'BẢO TRÌ' | 'VẬT TƯ' | 'NHẬP HÀNG KHO' | 'MẶT BẰNG' | 'LƯƠNG' | 'KHÁC';
  amount: number;
  expenseDate: string;
  isAutoFromInventory: boolean;
  notes: string;
}

export interface CapitalMetric {
  monthYear: string; // 2026-10
  openCapital: number;
  lowCapital: number;
  highCapital: number;
  closeCapital: number;
  revenue: number;
  cogsAndPurchases: number;
  opexSpent: number;
  netProfit: number;
  growthRate: number;
}

export interface BankConfig {
  bankId: string; // MB, VCB, ACB, TCB, VPB, TPB, ICB
  accountNo: string;
  accountName: string;
  template: 'compact' | 'compact2' | 'qr_only' | 'print';
}

export interface AppSettings {
  storeName: string;
  storeAddress: string;
  storePhone: string;
  storeTaxId: string;
  bankConfig: BankConfig;
  supabaseUrl: string;
  supabaseAnonKey: string;
  googleSheetsWebhookUrl: string;
  isAudioEnabled: boolean;
  voiceSpeed: number;
  autoClearDelaySeconds: number;
  mainTheme?: string;
  customerTheme?: string;
}
