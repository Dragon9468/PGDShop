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
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleOpenDualScreen = () => {
    dualScreenSync.openCustomerDisplayWindow();
    soundService.playSuccessChime();
  };

  return (
    <header className="navbar">
      <div className="nav-brand" onClick={() => onTabChange('pos')}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShoppingCart size={24} color="#38bdf8" />
          <span>PGDShop</span>
        </div>
        <span className="nav-brand-badge">POS v1.0</span>
      </div>

      <nav className="nav-tabs">
        <button
          className={`nav-tab-btn ${activeTab === 'pos' ? 'active' : ''}`}
          onClick={() => onTabChange('pos')}
          title="Màn hình thu ngân quầy POS"
        >
          <ShoppingCart size={16} />
          <span>Thu Ngân</span>
        </button>

        <button
          className={`nav-tab-btn ${activeTab === 'customer_display' ? 'active' : ''}`}
          onClick={() => onTabChange('customer_display')}
          title="Xem thử Màn hình đối diện khách hàng"
        >
          <Monitor size={16} />
          <span>Màn Hình Khách (CFD)</span>
        </button>

        <button
          className={`nav-tab-btn ${activeTab === 'shelves' ? 'active' : ''}`}
          onClick={() => onTabChange('shelves')}
          title="Quản lý kệ hàng trưng bày & vị trí"
        >
          <Layers size={16} />
          <span>1. Kệ Hàng</span>
        </button>

        <button
          className={`nav-tab-btn ${activeTab === 'prepared' ? 'active' : ''}`}
          onClick={() => onTabChange('prepared')}
          title="Quản lý chế biến F&B (Cà phê, đồ ăn, định lượng BOM)"
        >
          <Coffee size={16} />
          <span>2. Chế Biến</span>
        </button>

        <button
          className={`nav-tab-btn ${activeTab === 'online_orders' ? 'active' : ''}`}
          onClick={() => onTabChange('online_orders')}
          title="Đơn hàng Shopee, GrabFood, TikTok, Web"
        >
          <Globe size={16} />
          <span>3. Đơn Online</span>
        </button>

        <button
          className={`nav-tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => onTabChange('inventory')}
          title="Quản lý kho hàng, nhập/xuất & rollup chi phí sang OpEx"
        >
          <Warehouse size={16} />
          <span>4. Kho Hàng</span>
        </button>

        <button
          className={`nav-tab-btn ${activeTab === 'wholesale' ? 'active' : ''}`}
          onClick={() => onTabChange('wholesale')}
          title="Bán sỉ & Hóa đơn đỏ VAT A4"
        >
          <Receipt size={16} />
          <span>5. Bán Sỉ (VAT)</span>
        </button>

        <button
          className={`nav-tab-btn ${activeTab === 'capex' ? 'active' : ''}`}
          onClick={() => onTabChange('capex')}
          title="Chi phí mua máy móc, kệ, xe, tủ, thiết bị IT"
        >
          <Truck size={16} />
          <span>6. CapEx</span>
        </button>

        <button
          className={`nav-tab-btn ${activeTab === 'opex' ? 'active' : ''}`}
          onClick={() => onTabChange('opex')}
          title="Chi phí vận hành: Điện nước, bảo trì, vật tư, kho hàng"
        >
          <Zap size={16} />
          <span>7. OpEx</span>
        </button>

        <button
          className={`nav-tab-btn ${activeTab === 'capital' ? 'active' : ''}`}
          onClick={() => onTabChange('capital')}
          title="Theo dõi vốn & biểu đồ nến chứng khoán theo tháng"
        >
          <TrendingUp size={16} />
          <span>8. Vốn & Dòng Tiền</span>
        </button>

        <button
          className={`nav-tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => onTabChange('settings')}
          title="Cài đặt hệ thống, Supabase, Google Sheets, VietQR"
        >
          <Settings size={16} />
          <span>Cài Đặt</span>
        </button>
      </nav>

      <div className="nav-actions">
        {/* Nút mở màn hình khách hàng trên màn hình phụ (Màn hình 2) */}
        <button
          className="btn btn-dual-screen"
          onClick={handleOpenDualScreen}
          title="Mở tab/cửa sổ màn hình đối diện khách hàng ra màn hình thứ 2"
        >
          <ExternalLink size={15} />
          <span style={{ fontSize: '0.82rem' }}>Mở Màn Hình Phụ (CFD)</span>
        </button>

        {/* Nút bật tắt loa giọng nói */}
        <button
          className="btn btn-secondary"
          style={{ padding: '8px 10px' }}
          onClick={onToggleAudio}
          title={isAudioOn ? 'Loa Bluetooth đang BẬT' : 'Loa đang TẮT'}
        >
          {isAudioOn ? <Volume2 size={16} color="#10b981" /> : <VolumeX size={16} color="#ef4444" />}
        </button>

        {/* Trạng thái Realtime Sync */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.8rem',
            color: '#94a3b8',
            padding: '4px 8px',
            borderRadius: '6px',
            background: 'rgba(255, 255, 255, 0.04)',
          }}
          title="Đang đồng bộ tức thì 2 màn hình + Supabase + Google Sheets"
        >
          <div className="pulse-dot"></div>
          <span style={{ fontFamily: 'var(--font-mono)' }}>{time}</span>
        </div>
      </div>
    </header>
  );
};
