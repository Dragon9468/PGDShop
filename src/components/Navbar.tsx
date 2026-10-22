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
  Palette,
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

export const FTEL_THEMES = [
  { id: 'cyber-neon', name: 'Cyber Neon (Mặc định Ftel)', color: '#76fe28' },
  { id: 'sunset-glow', name: 'Sunset Glow (FPT Cam)', color: '#F58220' },
  { id: 'ocean-deep', name: 'Ocean Deep (Xanh Biển)', color: '#06b6d4' },
  { id: 'aurora-night', name: 'Aurora Night (Bắc Cực)', color: '#84cc16' },
  { id: 'matrix-green', name: 'Matrix Green (Xanh Ma Trận)', color: '#10b981' },
  { id: 'amber-dark', name: 'Amber Dark (Đen Tối Giản)', color: '#ff9933' },
  { id: 'dracula-violet', name: 'Dracula Violet (Tím)', color: '#a855f7' },
];

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  isAudioOn,
  onToggleAudio,
}) => {
  const [time, setTime] = useState<string>('');
  const [currentTheme, setCurrentTheme] = useState<string>('cyber-neon');

  useEffect(() => {
    // Đọc theme đã lưu
    const saved = localStorage.getItem('pgd_theme') || 'cyber-neon';
    setCurrentTheme(saved);
    document.documentElement.setAttribute('data-theme', saved);

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

  const handleThemeChange = (themeId: string) => {
    setCurrentTheme(themeId);
    localStorage.setItem('pgd_theme', themeId);
    document.documentElement.setAttribute('data-theme', themeId);
  };

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
        {/* Bộ chọn Theme Ftel Multi-Agent */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Palette size={15} color="var(--primary)" />
          <select
            value={currentTheme}
            onChange={(e) => handleThemeChange(e.target.value)}
            style={{
              background: 'rgba(0,0,0,0.5)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              fontSize: '0.78rem',
              padding: '3px 6px',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
            title="Đổi giao diện Theme từ Ftel Multi-Agent"
          >
            {FTEL_THEMES.map((t) => (
              <option key={t.id} value={t.id} style={{ background: '#090d16', color: '#fff' }}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* Nút mở màn hình khách hàng trên màn hình phụ (Màn 2) */}
        <button
          className="btn btn-dual-screen"
          style={{ padding: '6px 10px', fontSize: '0.78rem' }}
          onClick={handleOpenDualScreen}
          title="Mở tab/cửa sổ màn hình đối diện khách hàng ra màn hình thứ 2"
        >
          <ExternalLink size={13} />
          <span>Màn Hình Phụ (CFD)</span>
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

        {/* Đồng hồ */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '0.76rem',
            color: 'var(--text-muted)',
            padding: '3px 6px',
            borderRadius: '4px',
            background: 'rgba(255, 255, 255, 0.04)',
          }}
        >
          <div className="pulse-dot"></div>
          <span style={{ fontFamily: 'var(--font-mono)' }}>{time}</span>
        </div>
      </div>
    </header>
  );
};
