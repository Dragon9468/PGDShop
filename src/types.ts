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

export interface ShelfLocation {
  id: string;
  code: string; // VD: KE-A1-T1
  aisle: string; // Dãy A, B
  tier: number; // Tầng 1, 2, 3
  capacity: number;
  currentCount: number;
  status: 'ACTIVE' | 'FULL' | 'MAINTENANCE';
  notes: string;
  assignedProducts: string[];
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
}
