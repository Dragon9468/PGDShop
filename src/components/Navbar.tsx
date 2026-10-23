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
  ChevronDown,
  Plus,
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

  const [showStationMenu, setShowStationMenu] = useState(false);
  const [stationCount, setStationCount] = useState<number>(() => {
    return Number(localStorage.getItem('pgd_station_count')) || 2;
  });

  const handleOpenDualScreen = (stationId: number = 1) => {
    dualScreenSync.openCustomerDisplayWindow(stationId);
    soundService.playSuccessChime();
    setShowStationMenu(false);
  };

  const handleSpawnNewStation = () => {
    const nextStation = stationCount + 1;
    setStationCount(nextStation);
    localStorage.setItem('pgd_station_count', nextStation.toString());
    dualScreenSync.openCustomerDisplayWindow(nextStation);
    soundService.playSuccessChime();
    setShowStationMenu(false);
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

        {/* Đã bỏ tab Màn Khách theo yêu cầu người dùng, dùng nút bung màn phụ trên thanh công cụ */}

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
        {/* Cụm nút mở/bung màn hình khách hàng trên màn hình phụ (Hỗ trợ 1 PC ra nhiều màn trạm) */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <button
            className="btn btn-dual-screen"
            style={{ padding: '6px 10px', fontSize: '0.78rem', borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
            onClick={() => handleOpenDualScreen(1)}
            title="Mở tab/cửa sổ màn hình phụ Trạm 1"
          >
            <ExternalLink size={13} />
            <span>Màn Hình Phụ</span>
          </button>
          <button
            className="btn btn-dual-screen"
            style={{ padding: '6px 6px', fontSize: '0.78rem', borderLeft: '1px solid rgba(255,255,255,0.2)', borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
            onClick={() => setShowStationMenu(!showStationMenu)}
            title="Bung thêm màn phụ cho các trạm Kiosk khác (Trạm 2, Trạm 3...)"
          >
            <ChevronDown size={13} />
          </button>

          {showStationMenu && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                right: 0,
                zIndex: 9999,
                background: '#0f172a',
                border: '1.5px solid var(--primary)',
                borderRadius: '10px',
                padding: '8px',
                minWidth: '220px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
              }}
            >
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', padding: '4px 8px', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '4px' }}>
                🖥️ CHỌN MÀN PHỤ CẦN BUNG:
              </div>
              {Array.from({ length: stationCount }, (_, i) => i + 1).map((stId) => (
                <button
                  key={stId}
                  onClick={() => handleOpenDualScreen(stId)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    background: 'transparent',
                    border: 'none',
                    color: '#e2e8f0',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <span>📺 Trạm {stId} {stId === 1 ? '(Quầy chính)' : `(Kiosk ${stId})`}</span>
                  <ExternalLink size={12} color="var(--primary)" />
                </button>
              ))}

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '4px', paddingTop: '4px' }}>
                <button
                  onClick={handleSpawnNewStation}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid #10b981',
                    color: '#10b981',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <Plus size={14} />
                  <span>Bung thêm Trạm {stationCount + 1} mới</span>
                </button>
              </div>
            </div>
          )}
        </div>

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
