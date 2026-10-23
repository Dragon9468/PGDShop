import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Monitor,
  Layers,
  Coffee,
  Globe,
  Warehouse,
  Receipt,
  Truck,
  Zap,
  TrendingUp,
  Settings,
  Volume2,
  VolumeX,
  ExternalLink,
} from 'lucide-react';
import { dualScreenSync } from '../services/dualScreenSync';
import { soundService } from '../services/soundService';

export type ActiveTab =
  | 'pos'
  | 'customer_display'
  | 'shelves'
  | 'prepared'
  | 'online_orders'
  | 'inventory'
  | 'wholesale'
  | 'capex'
  | 'opex'
  | 'capital'
  | 'settings';

interface NavbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  isAudioOn: boolean;
  onToggleAudio: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  isAudioOn,
  onToggleAudio,
}) => {
  useEffect(() => {
    // Đọc theme đã lưu
    const saved = localStorage.getItem('pgd_theme') || 'cyber-neon';
    document.documentElement.setAttribute('data-theme', saved);
  }, []);

  const handleOpenDualScreen = () => {
    dualScreenSync.openCustomerDisplayWindow();
    soundService.playSuccessChime();
  };

  return (
    <header className="navbar">
      <div className="nav-brand" onClick={() => onTabChange('pos')}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ShoppingCart size={22} color="var(--primary)" />
          <span>PGDShop</span>
        </div>
        <span className="nav-brand-badge">POS</span>
      </div>

      <nav className="nav-tabs">
        <button
          className={`nav-tab-btn ${activeTab === 'pos' ? 'active' : ''}`}
          onClick={() => onTabChange('pos')}
          title="Thu ngân quầy POS"
        >
          <ShoppingCart size={15} />
          <span>Thu Ngân</span>
        </button>

        <button
          className={`nav-tab-btn ${activeTab === 'customer_display' ? 'active' : ''}`}
          onClick={() => onTabChange('customer_display')}
          title="Xem trước Màn hình phụ hướng ra khách (CFD)"
        >
          <Monitor size={15} />
          <span>Màn Khách</span>
        </button>

        <button
          className={`nav-tab-btn ${activeTab === 'shelves' ? 'active' : ''}`}
          onClick={() => onTabChange('shelves')}
          title="Quản lý kệ hàng trưng bày & vị trí"
        >
          <Layers size={15} />
          <span>1. Kệ Hàng</span>
        </button>

        <button
          className={`nav-tab-btn ${activeTab === 'prepared' ? 'active' : ''}`}
          onClick={() => onTabChange('prepared')}
          title="Quản lý chế biến F&B (Cà phê, đồ ăn, định lượng BOM)"
        >
          <Coffee size={15} />
          <span>2. Chế Biến</span>
        </button>

        <button
          className={`nav-tab-btn ${activeTab === 'online_orders' ? 'active' : ''}`}
          onClick={() => onTabChange('online_orders')}
          title="Đơn hàng Shopee, GrabFood, TikTok, Web"
        >
          <Globe size={15} />
          <span>3. Online</span>
        </button>

        <button
          className={`nav-tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => onTabChange('inventory')}
          title="Quản lý kho hàng, nhập/xuất & rollup chi phí sang OpEx"
        >
          <Warehouse size={15} />
          <span>4. Kho Hàng</span>
        </button>

        <button
          className={`nav-tab-btn ${activeTab === 'wholesale' ? 'active' : ''}`}
          onClick={() => onTabChange('wholesale')}
          title="Bán sỉ & Hóa đơn đỏ VAT A4"
        >
          <Receipt size={15} />
          <span>5. Bán Sỉ</span>
        </button>

        <button
          className={`nav-tab-btn ${activeTab === 'capex' ? 'active' : ''}`}
          onClick={() => onTabChange('capex')}
          title="Chi phí máy móc, kệ, xe, tủ, thiết bị IT"
        >
          <Truck size={15} />
          <span>6. CapEx</span>
        </button>

        <button
          className={`nav-tab-btn ${activeTab === 'opex' ? 'active' : ''}`}
          onClick={() => onTabChange('opex')}
          title="Chi phí vận hành: Điện nước, bảo trì, vật tư, kho hàng"
        >
          <Zap size={15} />
          <span>7. OpEx</span>
        </button>

        <button
          className={`nav-tab-btn ${activeTab === 'capital' ? 'active' : ''}`}
          onClick={() => onTabChange('capital')}
          title="Biểu đồ nến lượng tiền & Đánh giá dư địa mở rộng shop"
        >
          <TrendingUp size={15} />
          <span>8. Biểu Đồ Nến Tiền</span>
        </button>

        <button
          className={`nav-tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => onTabChange('settings')}
          title="Cài đặt hệ thống, Supabase, Google Sheets, VietQR"
        >
          <Settings size={15} />
          <span>Cài Đặt</span>
        </button>
      </nav>

      <div className="nav-actions">
        {/* Nút mở màn hình khách hàng trên màn hình phụ (Màn 2) */}
        <button
          className="btn btn-dual-screen"
          style={{ padding: '6px 10px', fontSize: '0.78rem' }}
          onClick={handleOpenDualScreen}
          title="Mở tab/cửa sổ màn hình đối diện khách hàng ra màn hình thứ 2"
        >
          <ExternalLink size={13} />
          <span>Màn Hình Phụ</span>
        </button>

        {/* Bật tắt loa giọng nói */}
        <button
          className="btn btn-secondary"
          style={{ padding: '6px 8px' }}
          onClick={onToggleAudio}
          title={isAudioOn ? 'Loa Bluetooth đang BẬT' : 'Loa đang TẮT'}
        >
          {isAudioOn ? <Volume2 size={15} color="var(--primary)" /> : <VolumeX size={15} color="#ef4444" />}
        </button>
      </div>
    </header>
  );
};
