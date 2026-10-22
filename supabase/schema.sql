-- ==============================================================================
-- PGDShop - Supabase PostgreSQL Schema & Realtime Setup
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. KỆ HÀNG (SHELF LOCATIONS)
CREATE TABLE IF NOT EXISTS shelf_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL, -- Ví dụ: KE-A1-T1 (Kệ A1, Tầng 1)
    aisle VARCHAR(20) NOT NULL,       -- Dãy A, B, C...
    tier INT NOT NULL DEFAULT 1,      -- Tầng 1, 2, 3...
    capacity INT DEFAULT 50,          -- Sức chứa tối đa (sản phẩm/thùng)
    current_count INT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, FULL, MAINTENANCE
    notes TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. SẢN PHẨM & HÀNG HÓA (PRODUCTS)
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    barcode VARCHAR(100) UNIQUE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL, -- 'TapHoa', 'CheBien_FB', 'BaoBi', 'VanPhongPham'
    unit VARCHAR(50) NOT NULL DEFAULT 'Cái', -- Ly, Chai, Gói, Kg, Hộp
    cost_price NUMERIC(15, 2) NOT NULL DEFAULT 0,      -- Giá vốn nhập
    retail_price NUMERIC(15, 2) NOT NULL DEFAULT 0,    -- Giá bán lẻ
    wholesale_price NUMERIC(15, 2) NOT NULL DEFAULT 0, -- Giá bán sỉ (chiết khấu)
    stock_quantity NUMERIC(15, 2) NOT NULL DEFAULT 0,  -- Số lượng tồn kho
    min_stock NUMERIC(15, 2) DEFAULT 5,                -- Cảnh báo tồn tối thiểu
    shelf_id UUID REFERENCES shelf_locations(id) ON DELETE SET NULL,
    is_prepared BOOLEAN DEFAULT false,                 -- Hàng chế biến F&B (Cà phê, trà, đồ ăn)
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. QUẢN LÝ CHẾ BIẾN (RECIPES & BOM - Bill of Materials)
CREATE TABLE IF NOT EXISTS recipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    prep_time_minutes INT DEFAULT 5,
    instructions TEXT,
    standard_cost NUMERIC(15, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS recipe_ingredients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
    ingredient_name VARCHAR(255) NOT NULL,
    unit VARCHAR(50) NOT NULL, -- ml, gram, cái (ly, ống hút)
    quantity_needed NUMERIC(10, 3) NOT NULL,
    estimated_cost NUMERIC(15, 2) DEFAULT 0
);

-- 4. ĐƠN HÀNG POS TẠI QUẦY (POS ORDERS & REALTIME CART)
CREATE TABLE IF NOT EXISTS pos_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_code VARCHAR(50) UNIQUE NOT NULL, -- PGD-20261022-001
    cashier_name VARCHAR(100) DEFAULT 'Thu ngân 1',
    total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    discount_amount NUMERIC(15, 2) DEFAULT 0,
    final_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    payment_method VARCHAR(20) DEFAULT 'VIETQR', -- 'VIETQR', 'CASH', 'WHOLESALE'
    payment_status VARCHAR(20) DEFAULT 'PENDING', -- 'PENDING', 'PAID', 'CANCELLED'
    transfer_content VARCHAR(100), -- Nội dung chuyển khoản dynamic: PGD001
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS pos_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES pos_orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    product_name VARCHAR(255) NOT NULL,
    unit_price NUMERIC(15, 2) NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL DEFAULT 1,
    subtotal NUMERIC(15, 2) NOT NULL
);

-- 5. ĐƠN HÀNG ONLINE (ONLINE ORDERS)
CREATE TABLE IF NOT EXISTS online_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_code VARCHAR(100) UNIQUE NOT NULL,
    platform VARCHAR(50) NOT NULL, -- Shopee, GrabFood, TikTokShop, Web
    customer_name VARCHAR(255),
    customer_phone VARCHAR(50),
    delivery_address TEXT,
    tracking_code VARCHAR(100),
    items_summary TEXT,
    total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    platform_fee NUMERIC(15, 2) DEFAULT 0, -- Phí sàn chiết khấu
    net_revenue NUMERIC(15, 2) NOT NULL DEFAULT 0,
    status VARCHAR(50) DEFAULT 'NEW', -- NEW, PREPARING, SHIPPING, DELIVERED, CANCELLED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 6. QUẢN LÝ KHO HÀNG (NHẬP/XUẤT KHO)
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slip_code VARCHAR(50) UNIQUE NOT NULL, -- NK-20261022-01, XK-20261022-01
    type VARCHAR(20) NOT NULL, -- 'IN' (Nhập kho), 'OUT' (Xuất hủy/điều chuyển)
    supplier VARCHAR(255),
    total_cost NUMERIC(15, 2) NOT NULL DEFAULT 0, -- Tổng tiền nhập -> tự động link vào OpEx
    notes TEXT,
    items JSONB, -- Mảng chi tiết mặt hàng nhập: [{name, qty, price, total}]
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 7. KHÁCH SỈ & HÓA ĐƠN ĐỎ VAT (WHOLESALE & RED INVOICE)
CREATE TABLE IF NOT EXISTS wholesale_customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(255) NOT NULL,
    tax_id VARCHAR(50) UNIQUE NOT NULL, -- Mã số thuế
    address TEXT NOT NULL,
    contact_person VARCHAR(100),
    phone VARCHAR(50),
    email VARCHAR(100),
    current_debt NUMERIC(15, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS wholesale_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(50) UNIQUE NOT NULL, -- HĐ-VAT-00128
    customer_id UUID REFERENCES wholesale_customers(id),
    customer_name VARCHAR(255) NOT NULL,
    tax_id VARCHAR(50) NOT NULL,
    subtotal NUMERIC(15, 2) NOT NULL,
    vat_rate NUMERIC(5, 2) DEFAULT 8.0, -- 8% hoặc 10%
    vat_amount NUMERIC(15, 2) NOT NULL,
    total_amount NUMERIC(15, 2) NOT NULL,
    items JSONB,
    payment_status VARCHAR(20) DEFAULT 'UNPAID', -- PAID, UNPAID, PARTIAL
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 8. CAPEX (CHI PHÍ TÀI SẢN CỐ ĐỊNH)
CREATE TABLE IF NOT EXISTS capex_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL, -- Máy pha cà phê Breville, Kệ sắt V lỗ 5 tầng, Tủ mát Sanaky...
    category VARCHAR(100) NOT NULL, -- 'MÁY MÓC', 'KỆ TỦ', 'XE CỘ', 'TỦ ĐÔNG/MÁT', 'THIẾT BỊ IT'
    purchase_date DATE NOT NULL,
    original_value NUMERIC(15, 2) NOT NULL,
    depreciation_months INT NOT NULL DEFAULT 24, -- Số tháng khấu hao
    monthly_depreciation NUMERIC(15, 2) NOT NULL, -- Khấu hao hàng tháng
    status VARCHAR(50) DEFAULT 'ACTIVE', -- ACTIVE, LIQUIDATED
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 9. OPEX (CHI PHÍ VẬN HÀNH HÀNG THÁNG)
CREATE TABLE IF NOT EXISTS opex_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category VARCHAR(100) NOT NULL, -- 'ĐIỆN', 'NƯỚC', 'BẢO TRÌ', 'VẬT TƯ (MỰC/GIẤY)', 'NHẬP HÀNG KHO', 'MẶT BẰNG', 'KHÁC'
    amount NUMERIC(15, 2) NOT NULL,
    expense_date DATE NOT NULL,
    is_auto_from_inventory BOOLEAN DEFAULT false, -- True nếu lấy tổng tiền từ Nhập Kho
    inventory_slip_id UUID REFERENCES inventory_transactions(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 10. VỐN & CHÊNH LỆCH TÀI CHÍNH THEO THÁNG (CAPITAL MONITORING)
CREATE TABLE IF NOT EXISTS capital_monthly (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    month_year VARCHAR(7) UNIQUE NOT NULL, -- '2026-08', '2026-09', '2026-10'
    opening_capital NUMERIC(15, 2) NOT NULL, -- Vốn đầu kỳ (Open)
    highest_capital NUMERIC(15, 2),          -- Đỉnh vốn trong tháng (High - nến chứng khoán)
    lowest_capital NUMERIC(15, 2),           -- Đáy vốn trong tháng (Low - nến chứng khoán)
    revenue NUMERIC(15, 2) NOT NULL DEFAULT 0,
    cogs_and_purchases NUMERIC(15, 2) NOT NULL DEFAULT 0,
    capex_spent NUMERIC(15, 2) NOT NULL DEFAULT 0,
    opex_spent NUMERIC(15, 2) NOT NULL DEFAULT 0,
    net_profit NUMERIC(15, 2) NOT NULL DEFAULT 0,
    closing_capital NUMERIC(15, 2) NOT NULL, -- Vốn cuối kỳ (Close)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 11. GIAO DỊCH NGÂN HÀNG (VIETQR / SEPAY / CASSO AUTO-MATCH)
CREATE TABLE IF NOT EXISTS bank_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id VARCHAR(100) UNIQUE NOT NULL,
    bank_code VARCHAR(50),
    amount NUMERIC(15, 2) NOT NULL,
    memo TEXT,
    order_code_matched VARCHAR(50),
    is_processed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- BẬT SUPABASE REALTIME CHO CÁC BẢNG CẦN ĐỒNG BỘ MÀN HÌNH TỨC THÌ
ALTER PUBLICATION supabase_realtime ADD TABLE pos_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE pos_order_items;
ALTER PUBLICATION supabase_realtime ADD TABLE bank_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE products;
