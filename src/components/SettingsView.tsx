import React, { useState } from 'react';
import { AppSettings, BankConfig } from '../types';
import { storageService } from '../services/storageService';
import { soundService } from '../services/soundService';
import { POPULAR_BANKS } from '../services/vietqrService';
import {
  Settings,
  Database,
  Table,
  CreditCard,
  Volume2,
  Barcode,
  Save,
  CheckCircle,
  Terminal,
  Smartphone,
  Globe,
  GitBranch,
  Palette,
  Sparkles,
  Printer,
  Monitor,
  Usb,
  Lock,
  Unlock,
  ExternalLink,
  Shield,
  Play,
} from 'lucide-react';
import { ThemePickerModal } from './ThemePickerModal';
import { THEMES, CATEGORIES } from '../lib/themes';
import { dualScreenSync } from '../services/dualScreenSync';
import { printService } from '../services/printService';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, onUpdateSettings }) => {
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [savedAlert, setSavedAlert] = useState(false);
  const [testBarcodeInput, setTestBarcodeInput] = useState('');
  const [barcodeTestSuccess, setBarcodeTestSuccess] = useState<string | null>(null);

  // Cấu hình Đa Trạm Multi-Station & Phần cứng Kiosk
  const [selectedStation, setSelectedStation] = useState<number>(1);
  const [stationModes, setStationModes] = useState<Record<number, boolean>>(() => ({
    1: localStorage.getItem('pgd_kiosk_mode_1') === 'true',
    2: localStorage.getItem('pgd_kiosk_mode_2') !== 'false', // Trạm 2 mặc định là Kiosk
    3: localStorage.getItem('pgd_kiosk_mode_3') !== 'false',
  }));
  const [stationPrinters, setStationPrinters] = useState<Record<number, string>>(() => ({
    1: localStorage.getItem('pgd_station_printer_1') || 'Máy In Bill Quầy 1 (USB001)',
    2: localStorage.getItem('pgd_station_printer_2') || 'Máy In Bill Kiosk 2 (USB002)',
    3: localStorage.getItem('pgd_station_printer_3') || 'Máy In Bill Kiosk 3 (USB003)',
  }));
  const [stationLocks, setStationLocks] = useState<Record<number, boolean>>(() => ({
    1: localStorage.getItem('pgd_kiosk_locked_1') === 'true',
    2: localStorage.getItem('pgd_kiosk_locked_2') === 'true',
    3: localStorage.getItem('pgd_kiosk_locked_3') === 'true',
  }));
  const [adminPin, setAdminPin] = useState<string>(() => {
    return localStorage.getItem('pgd_kiosk_pin') || '1234';
  });
  const [stationSerialStatus, setStationSerialStatus] = useState<Record<number, boolean>>({
    1: false,
    2: false,
    3: false,
  });
  const [stationSerialTest, setStationSerialTest] = useState<Record<number, string>>({});

  // Theme states
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [currentThemeId, setCurrentThemeId] = useState<string>(() => {
    return localStorage.getItem('pgd_theme') || settings.mainTheme || 'cyber-neon';
  });
  const [customerThemeId, setCustomerThemeId] = useState<string>(() => {
    return localStorage.getItem('pgd_customer_theme') || settings.customerTheme || 'sunset-glow';
  });
  const [selectedCatTab, setSelectedCatTab] = useState<'Light' | 'Dark' | 'Gradient' | 'Classic'>('Gradient');

  const handleApplyTheme = (themeId: string) => {
    setCurrentThemeId(themeId);
    setFormData((prev) => ({ ...prev, mainTheme: themeId }));
    localStorage.setItem('pgd_theme', themeId);
    document.documentElement.setAttribute('data-theme', themeId);
    soundService.playSuccessChime();
  };

  const handleApplyCustomerTheme = (themeId: string) => {
    setCustomerThemeId(themeId);
    setFormData((prev) => ({ ...prev, customerTheme: themeId }));
    localStorage.setItem('pgd_customer_theme', themeId);
    dualScreenSync.syncCustomerTheme(themeId);
    soundService.playSuccessChime();
  };

  const activeThemeObj = THEMES.find((t) => t.id === currentThemeId) || THEMES[0];

  // Gán cổng USB Serial cho súng quét của trạm
  const handlePairSerial = async (stationId: number) => {
    if (!('serial' in navigator)) {
      alert('Trình duyệt hiện tại không hỗ trợ Web Serial. Vui lòng mở trang này trên Google Chrome hoặc Microsoft Edge!');
      return;
    }
    try {
      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate: 9600 });
      setStationSerialStatus((prev) => ({ ...prev, [stationId]: true }));
      soundService.playSuccessChime();
      alert(`✅ Đã gán cổng USB thành công cho Trạm ${stationId}! Khi cắm súng quét ở cổng này, dữ liệu sẽ chỉ truyền riêng cho Trạm ${stationId}.`);

      const textDecoder = new TextDecoderStream();
      port.readable.pipeTo(textDecoder.writable);
      const reader = textDecoder.readable.getReader();
      let buffer = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          reader.releaseLock();
          break;
        }
        if (value) {
          buffer += value;
          if (buffer.includes('\r') || buffer.includes('\n')) {
            const lines = buffer.split(/[\r\n]+/);
            buffer = lines.pop() || '';
            for (const line of lines) {
              if (line.trim()) {
                setStationSerialTest((prev) => ({
                  ...prev,
                  [stationId]: `Đã quét từ cổng Trạm ${stationId}: ${line.trim()} lúc ${new Date().toLocaleTimeString('vi-VN')}`,
                }));
                soundService.playBarcodeBeep();
              }
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name !== 'NotFoundError') {
        console.warn('Serial error:', err);
      }
    }
  };

  // In thử bill test trên máy in của trạm
  const handleTestPrintBill = (stationId: number) => {
    const testOrder: any = {
      id: 'test-' + Date.now(),
      orderCode: `TEST-TRẠM-${stationId}`,
      cashierName: `Test Trạm ${stationId} (${stationPrinters[stationId] || 'Mặc định'})`,
      items: [
        {
          product: {
            id: 'p1',
            barcode: '8935001001',
            name: `Hóa Đơn Test - Trạm ${stationId}`,
            retailPrice: 25000,
            unit: 'Ly',
          },
          quantity: 1,
          subtotal: 25000,
        },
      ],
      totalAmount: 25000,
      discountAmount: 0,
      finalAmount: 25000,
      paymentMethod: 'CASH',
      paymentStatus: 'PAID',
      transferContent: `TEST TRAM ${stationId}`,
      createdAt: new Date().toISOString(),
    };
    printService.printThermalReceipt(testOrder, settings);
    soundService.playSuccessChime();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    storageService.saveSettings(formData);
    onUpdateSettings(formData);
    soundService.setEnabled(formData.isAudioEnabled);
    soundService.setVoiceRate(formData.voiceSpeed);

    // Lưu cấu hình Đa Trạm Multi-Station vào localStorage
    [1, 2, 3].forEach((sid) => {
      localStorage.setItem('pgd_kiosk_mode_' + sid, String(stationModes[sid]));
      localStorage.setItem('pgd_station_printer_' + sid, stationPrinters[sid]);
      localStorage.setItem('pgd_kiosk_locked_' + sid, String(stationLocks[sid]));
    });
    localStorage.setItem('pgd_kiosk_pin', adminPin);

    setSavedAlert(true);
    soundService.playSuccessChime();
    setTimeout(() => setSavedAlert(false), 3000);
  };

  const handleTestSpeaker = () => {
    soundService.playSuccessChime();
    setTimeout(() => {
      soundService.speakVietnamese(
        'Kiểm tra âm thanh thành công! Loa Bluetooth đang hoạt động rất tốt tại quầy thu ngân.'
      );
    }, 400);
  };

  const handleTestBarcodeGun = (code: string) => {
    if (!code) return;
    soundService.playBarcodeBeep();
    setBarcodeTestSuccess(`Đã nhận mã: ${code} lúc ${new Date().toLocaleTimeString('vi-VN')}`);
    setTestBarcodeInput('');
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Settings size={28} color="#38bdf8" />
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>CẤU HÌNH HỆ THỐNG & KẾT NỐI ĐA NỀN TẢNG</h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Thiết lập Theme giao diện Ftel, tài khoản ngân hàng VietQR, Supabase Realtime, Google Sheets Webhook và Thiết Bị Quầy.
          </p>
        </div>

        {savedAlert && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontWeight: 600 }}>
            <CheckCircle size={18} />
            <span>Đã lưu thành công!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* 0. BỘ SƯU TẬP GIAO DIỆN (FTEL THEME VAULT - 40 THEMES) */}
        <div className="glass-panel" style={{ padding: '20px', border: '1px solid rgba(118, 254, 40, 0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--primary)', fontSize: '1.15rem', fontWeight: 800 }}>
              <Palette size={22} />
              <span>Giao Diện & Bộ Sưu Tập Theme ({THEMES.length} Themes Ftel Multi-Agent)</span>
            </div>

            <button
              type="button"
              onClick={() => setIsThemeModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                borderRadius: '12px',
                background: 'var(--primary)',
                color: 'var(--primary-foreground, #090d16)',
                fontWeight: 800,
                fontSize: '0.88rem',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(118, 254, 40, 0.4)',
                transition: 'all 0.2s',
              }}
            >
              <Sparkles size={18} />
              <span>MỞ VÒNG XOAY HÀNH TINH (ROTARY WHEEL)</span>
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.04)', padding: '14px 18px', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Theme Đang Kích Hoạt (Thu Ngân):
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-primary)', marginTop: '2px' }}>
                {activeThemeObj.name} <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)', marginLeft: '8px' }}>({activeThemeObj.category} Planet)</span>
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {activeThemeObj.desc}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(0,0,0,0.4)', padding: '4px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '9999px', backgroundColor: activeThemeObj.primary }} />
                <span style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>{activeThemeObj.primary}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(0,0,0,0.4)', padding: '4px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '9999px', backgroundColor: activeThemeObj.secondary }} />
                <span style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>{activeThemeObj.secondary}</span>
              </div>
            </div>
          </div>

          {/* Cấu Hình Nhiều Màn Hình Độc Lập (Multi-Screen Display Themes) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', marginBottom: '18px', background: 'var(--bg-card)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '6px' }}>
                <Monitor size={16} />
                <span>Màn 1: Giao Diện Thu Ngân / Quản Trị:</span>
              </label>
              <select
                value={currentThemeId}
                onChange={(e) => handleApplyTheme(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '0.9rem', cursor: 'pointer' }}
              >
                {CATEGORIES.map((cat) => (
                  <optgroup key={cat} label={`Hành Tinh ${cat} (${THEMES.filter(t => t.category === cat).length} Themes)`}>
                    {THEMES.filter((t) => t.category === cat).map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.category})
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Theme quầy thu ngân, quản lý kho kệ và các nghiệp vụ bán lẻ.
              </div>
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 800, color: '#38bdf8', marginBottom: '6px' }}>
                <Smartphone size={16} />
                <span>Màn 2: Màn Hình Đối Diện Khách (CFD):</span>
              </label>
              <select
                value={customerThemeId}
                onChange={(e) => handleApplyCustomerTheme(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'var(--bg-surface)', border: '1.5px solid #38bdf8', color: 'var(--text-primary)', fontSize: '0.9rem', cursor: 'pointer' }}
              >
                {CATEGORIES.map((cat) => (
                  <optgroup key={cat} label={`Hành Tinh ${cat} (${THEMES.filter(t => t.category === cat).length} Themes)`}>
                    {THEMES.filter((t) => t.category === cat).map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.category})
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Theme màn hình khách tự phục vụ, tự động đồng bộ realtime.
              </div>
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 800, color: '#f59e0b', marginBottom: '6px' }}>
                <Globe size={16} />
                <span>Màn 3: Kiosk / Màn Khách 2 (Tương Lai):</span>
              </label>
              <select
                defaultValue="amber-gold"
                style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '0.9rem', cursor: 'pointer' }}
              >
                {THEMES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.category})
                  </option>
                ))}
              </select>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Sẵn sàng cấu hình khi lắp nhiều màn cho nhiều khách cùng thao tác.
              </div>
            </div>
          </div>

          {/* Cụm Tabs chọn nhanh theo hành tinh */}
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCatTab(cat)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: selectedCatTab === cat ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                    color: selectedCatTab === cat ? '#090d16' : '#fff',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  {cat === 'Light' && '☀️ '}
                  {cat === 'Dark' && '🌙 '}
                  {cat === 'Gradient' && '🌈 '}
                  {cat === 'Classic' && '🏛️ '}
                  {cat} Planet (10 Themes)
                </button>
              ))}
            </div>

            {/* Grid 10 Themes trong category */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
              {THEMES.filter((t) => t.category === selectedCatTab).map((t) => {
                const isSelected = t.id === currentThemeId;
                return (
                  <div
                    key={t.id}
                    onClick={() => handleApplyTheme(t.id)}
                    style={{
                      padding: '10px',
                      borderRadius: '10px',
                      background: isSelected ? 'rgba(118, 254, 40, 0.15)' : 'rgba(255,255,255,0.03)',
                      border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.88rem', fontWeight: 800, color: isSelected ? 'var(--primary)' : '#fff' }}>
                        {t.name}
                      </span>
                      <div style={{ display: 'flex', gap: '3px' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '9999px', backgroundColor: t.primary }} />
                        <span style={{ width: '10px', height: '10px', borderRadius: '9999px', backgroundColor: t.secondary }} />
                      </div>
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.3, height: '32px', overflow: 'hidden' }}>
                      {t.desc}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* MÃ VẠCH LỆNH CỐ ĐỊNH & MÁY IN BARCODE */}
        <div className="glass-panel" style={{ padding: '20px', border: '1px solid rgba(16, 185, 129, 0.35)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontSize: '1.15rem', fontWeight: 800 }}>
              <Barcode size={22} />
              <span>2 Mã Vạch Lệnh</span>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={() => printService.printBarcodeStickers(formData.storeName)}
              style={{ background: '#10b981', color: '#040d06', fontWeight: 800, padding: '10px 18px', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)' }}
            >
              <Printer size={16} />
              <span>IN 2 TEM</span>
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
            {/* TEM 1 */}
            <div style={{ background: '#fff', color: '#000', padding: '16px', borderRadius: '12px', border: '2.5px solid #059669', boxShadow: '0 4px 12px rgba(5, 150, 105, 0.15)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#059669' }}>
                  1. Thanh toán
                </span>
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '2.2rem', letterSpacing: '4px', fontWeight: 900, textAlign: 'center', color: '#000' }}>
                |||| | ||||| ||| |||
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: '1.15rem', textAlign: 'center', marginTop: '2px', color: '#059669' }}>
                *THANHTOAN*
              </div>
            </div>

            {/* TEM 2 */}
            <div style={{ background: '#fff', color: '#000', padding: '16px', borderRadius: '12px', border: '2.5px solid #dc2626', boxShadow: '0 4px 12px rgba(220, 38, 38, 0.15)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#dc2626' }}>
                  2. Hoàn tác
                </span>
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '2.2rem', letterSpacing: '4px', fontWeight: 900, textAlign: 'center', color: '#000' }}>
                ||| |||| | ||| ||||
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: '1.15rem', textAlign: 'center', marginTop: '2px', color: '#dc2626' }}>
                *XOA*
              </div>
            </div>
          </div>
        </div>

        {/* 1. THÔNG TIN CỬA HÀNG & TÀI KHOẢN NGÂN HÀNG VIETQR */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#38bdf8', fontSize: '1.1rem', fontWeight: 700 }}>
            <CreditCard size={20} />
            <span>1. Thông Tin Cửa Hàng & Tài Khoản Ngân Hàng (VietQR Động)</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Tên Cửa Hàng (In trên bill & CFD):</label>
              <input
                type="text"
                value={formData.storeName}
                onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '8px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Mã Số Thuế Cửa Hàng:</label>
              <input
                type="text"
                value={formData.storeTaxId}
                onChange={(e) => setFormData({ ...formData, storeTaxId: e.target.value })}
                style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '8px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Địa Chỉ Cửa Hàng:</label>
              <input
                type="text"
                value={formData.storeAddress}
                onChange={(e) => setFormData({ ...formData, storeAddress: e.target.value })}
                style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '8px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Số Điện Thoại Hotline:</label>
              <input
                type="text"
                value={formData.storePhone}
                onChange={(e) => setFormData({ ...formData, storePhone: e.target.value })}
                style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '8px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Ngân Hàng Thụ Hưởng (VietQR):</label>
              <select
                value={formData.bankConfig.bankId}
                onChange={(e) => setFormData({ ...formData, bankConfig: { ...formData.bankConfig, bankId: e.target.value } })}
                style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '8px' }}
              >
                {POPULAR_BANKS.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Số Tài Khoản Ngân Hàng:</label>
              <input
                type="text"
                value={formData.bankConfig.accountNo}
                onChange={(e) => setFormData({ ...formData, bankConfig: { ...formData.bankConfig, accountNo: e.target.value } })}
                style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '8px', fontFamily: 'var(--font-mono)' }}
              />
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Tên Chủ Tài Khoản (In hoa không dấu):</label>
              <input
                type="text"
                value={formData.bankConfig.accountName}
                onChange={(e) => setFormData({ ...formData, bankConfig: { ...formData.bankConfig, accountName: e.target.value.toUpperCase() } })}
                style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '8px' }}
              />
            </div>
          </div>
        </div>

        {/* 2. CẤU HÌNH SUPABASE & GOOGLE SHEETS */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#10b981', fontSize: '1.1rem', fontWeight: 700 }}>
            <Database size={20} />
            <span>2. Cấu Hình Supabase & Google Sheets (Chi Phí Cực Thấp)</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Supabase Project URL:</label>
              <input
                type="text"
                placeholder="https://xyzcompany.supabase.co"
                value={formData.supabaseUrl}
                onChange={(e) => setFormData({ ...formData, supabaseUrl: e.target.value })}
                style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '8px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Supabase Anon Public Key:</label>
              <input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={formData.supabaseAnonKey}
                onChange={(e) => setFormData({ ...formData, supabaseAnonKey: e.target.value })}
                style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '8px' }}
              />
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Google Sheets Apps Script Web App URL (Tùy chọn):</label>
              <input
                type="text"
                placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                value={formData.googleSheetsWebhookUrl}
                onChange={(e) => setFormData({ ...formData, googleSheetsWebhookUrl: e.target.value })}
                style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '8px' }}
              />
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>
                💡 File script tạo 8 Tab mẫu sẵn sàng tại: <code>google-sheets/PGDShop_GoogleAppsScript.js</code>
              </div>
            </div>
          </div>
        </div>

        {/* 3. CẤU HÌNH ĐA TRẠM KIOSK & GÁN THIẾT BỊ PHẦN CỨNG (MULTI-STATION & HARDWARE) */}
        <div className="glass-panel" style={{ padding: '20px', border: '1px solid rgba(56, 189, 248, 0.4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8', fontSize: '1.15rem', fontWeight: 800 }}>
              <Usb size={22} />
              <span>3. Cấu Hình Đa Trạm POS & Thiết Bị Phần Cứng (Cổng USB Súng Quét & Máy In Bill)</span>
            </div>

            {/* Nút bung mở màn hình trạm đang chọn */}
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => dualScreenSync.openCustomerDisplayWindow(selectedStation)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '0.85rem' }}
              title={`Mở cửa sổ màn hình phụ cho Trạm ${selectedStation} để kéo sang màn hình thứ ${selectedStation + 1}`}
            >
              <ExternalLink size={16} />
              <span>Bung Màn Hình Phụ Trạm {selectedStation}</span>
            </button>
          </div>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', marginBottom: '16px', lineHeight: 1.5 }}>
            Quản lý tập trung mọi thiết bị ngoại vi trên 1 PC: Phân định máy quét barcode theo cổng USB (chống nhảy mã sang trạm khác), gán máy in bill đích danh cho từng trạm và thiết lập khóa Kiosk toàn màn hình an toàn.
          </p>

          {/* Tab chọn trạm */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '18px' }}>
            {[1, 2, 3].map((sid) => (
              <button
                key={sid}
                type="button"
                onClick={() => setSelectedStation(sid)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '10px',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  border: selectedStation === sid ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                  background: selectedStation === sid ? 'var(--accent)' : 'rgba(255, 255, 255, 0.04)',
                  color: selectedStation === sid ? 'var(--primary)' : 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s',
                }}
              >
                <Monitor size={16} />
                <span>Trạm {sid} {sid === 1 ? '(Quầy Thu Ngân)' : `(Kiosk Tự Phục Vụ ${sid})`}</span>
              </button>
            ))}
          </div>

          {/* Chi tiết cấu hình cho Trạm đang chọn */}
          <div style={{ background: 'rgba(0, 0, 0, 0.25)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* A. Chế độ hoạt động */}
            <div>
              <label style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px', display: 'block' }}>
                ⚙️ A. Chế Độ Vận Hành Trạm {selectedStation}:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '12px',
                  borderRadius: '8px',
                  background: !stationModes[selectedStation] ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                  border: !stationModes[selectedStation] ? '1.5px solid #38bdf8' : '1px solid var(--border-color)',
                  cursor: 'pointer',
                }}>
                  <input
                    type="radio"
                    name={`kioskMode_${selectedStation}`}
                    checked={!stationModes[selectedStation]}
                    onChange={() => setStationModes((prev) => ({ ...prev, [selectedStation]: false }))}
                    style={{ marginTop: '3px' }}
                  />
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                      Màn Hình Phụ Đối Diện Khách (Đồng Bộ Quầy)
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Nhân viên thu ngân đứng quầy quét hàng trên máy chính, màn hình phụ tự động hiển thị giỏ hàng và mã VietQR cho khách xem.
                    </div>
                  </div>
                </label>

                <label style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '12px',
                  borderRadius: '8px',
                  background: stationModes[selectedStation] ? 'rgba(118, 254, 40, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                  border: stationModes[selectedStation] ? '1.5px solid var(--primary)' : '1px solid var(--border-color)',
                  cursor: 'pointer',
                }}>
                  <input
                    type="radio"
                    name={`kioskMode_${selectedStation}`}
                    checked={stationModes[selectedStation]}
                    onChange={() => setStationModes((prev) => ({ ...prev, [selectedStation]: true }))}
                    style={{ marginTop: '3px' }}
                  />
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--primary)' }}>
                      Kiosk Tự Phục Vụ Độc Lập (Self-Checkout Kiosk)
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Khách tự bóp cò súng quét lên từng sản phẩm, tự quét lệnh THANHTOAN để sinh VietQR nạp sẵn đúng số tiền, tự chốt đơn và in bill riêng.
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* B. Gán Cổng USB Súng Quét Barcode (Web Serial) */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '0.88rem', fontWeight: 800, color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Usb size={16} />
                  <span>B. Cổng USB Máy Quét Barcode Gán Riêng Cho Trạm {selectedStation}:</span>
                </label>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background: stationSerialStatus[selectedStation] ? '#dcfce7' : '#fee2e2',
                  color: stationSerialStatus[selectedStation] ? '#15803d' : '#b91c1c',
                }}>
                  {stationSerialStatus[selectedStation] ? '🟢 ĐÃ KẾT NỐI CỔNG COM RIÊNG' : '⚪ DÙNG CỔNG BÀN PHÍM CHUNG'}
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '10px', lineHeight: 1.4 }}>
                Khi cắm 2-3 súng quét trên cùng 1 PC, quét mã <b>USB Virtual COM</b> trên sổ tay súng quét rồi bấm nút dưới để gán cổng cho Trạm {selectedStation}. Mã quét sẽ truyền trực tiếp vào trạm này mà không bị nhảy nhầm hay cướp chuột!
              </p>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => handlePairSerial(selectedStation)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '0.85rem' }}
                >
                  <Usb size={16} color="#10b981" />
                  <span>{stationSerialStatus[selectedStation] ? 'Đổi Cổng USB Khác' : `Chọn Cổng USB Cho Máy Quét Trạm ${selectedStation}`}</span>
                </button>
                {stationSerialTest[selectedStation] && (
                  <span style={{ fontSize: '0.82rem', color: '#10b981', fontWeight: 600 }}>
                    ✅ {stationSerialTest[selectedStation]}
                  </span>
                )}
              </div>
            </div>

            {/* C. Máy In Bill Gán Cho Trạm */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
              <label style={{ fontSize: '0.88rem', fontWeight: 800, color: '#38bdf8', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Printer size={16} />
                <span>C. Tên Máy In Bill Riêng Cho Trạm {selectedStation}:</span>
              </label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  value={stationPrinters[selectedStation] || ''}
                  onChange={(e) => setStationPrinters((prev) => ({ ...prev, [selectedStation]: e.target.value }))}
                  placeholder={`Ví dụ: Máy In Bill Trạm ${selectedStation} (USB00${selectedStation})`}
                  style={{ flex: 1, minWidth: '240px', padding: '9px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '8px', fontSize: '0.88rem' }}
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => handleTestPrintBill(selectedStation)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', fontSize: '0.85rem' }}
                >
                  <Printer size={15} color="#38bdf8" />
                  <span>In Thử Bill Test Trạm {selectedStation}</span>
                </button>
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Khi khách ở Trạm {selectedStation} thanh toán xong, hóa đơn sẽ tự động gửi lệnh in ra máy in này.
              </div>
            </div>

            {/* D. Khóa Kiosk Toàn Màn Hình & Mã PIN */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '0.88rem', fontWeight: 800, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Lock size={16} />
                  <span>D. Chế Độ Khóa Màn Hình Kiosk (Chống Khách Tắt Web / Bấm Linh Tinh):</span>
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: stationLocks[selectedStation] ? 'rgba(239, 68, 68, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                  border: stationLocks[selectedStation] ? '1.5px solid #ef4444' : '1px solid var(--border-color)',
                  cursor: 'pointer',
                }}>
                  <input
                    type="checkbox"
                    checked={stationLocks[selectedStation]}
                    onChange={(e) => setStationLocks((prev) => ({ ...prev, [selectedStation]: e.target.checked }))}
                  />
                  <div>
                    <span style={{ fontWeight: 800, fontSize: '0.88rem', color: stationLocks[selectedStation] ? '#f87171' : 'var(--text-primary)' }}>
                      {stationLocks[selectedStation] ? '🔒 Bật Khóa Kiosk Toàn Màn Hình' : '🔓 Tắt Khóa (Mở Bình Thường)'}
                    </span>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Chặn chuột phải, chặn phím tắt F11, F12, Ctrl+W, Alt+F4 và khóa bôi đen chữ.
                    </div>
                  </div>
                </label>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <Shield size={14} color="#f59e0b" />
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Mã PIN Quản Trị Mở Khóa Kiosk:</span>
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    value={adminPin}
                    onChange={(e) => setAdminPin(e.target.value)}
                    placeholder="1234"
                    style={{ width: '100%', padding: '9px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)', color: 'var(--primary)', borderRadius: '8px', fontFamily: 'var(--font-mono)', letterSpacing: '4px', fontWeight: 800 }}
                  />
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Trên màn khách, quản lý chạm 3 lần vào logo shop hoặc bấm <code>Ctrl + Shift + K</code> để mở bàn phím nhập PIN.
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* 4. THỬ NGHIỆM THIẾT BỊ PHẦN CỨNG: LOA BLUETOOTH & SÚNG QUÉT */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#f59e0b', fontSize: '1.1rem', fontWeight: 700 }}>
            <Volume2 size={20} />
            <span>4. Kiểm Tra Thiết Bị Quầy (Loa Bluetooth & Súng Quét Barcode)</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* Test Loa Bluetooth */}
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <h4 style={{ fontSize: '0.95rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Volume2 size={16} color="#10b981" />
                <span>Loa Bluetooth / Loa Quầy Thu Ngân</span>
              </h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: 1.4 }}>
                Hệ thống tự động phát âm thanh qua thiết bị phát mặc định của máy tính (kết nối Bluetooth với bất kỳ loa nào).
              </p>
              <button type="button" className="btn btn-secondary" onClick={handleTestSpeaker}>
                <Volume2 size={16} />
                <span>Bấm Nghe Thử Loa Thông Báo</span>
              </button>
            </div>

            {/* Test Súng Barcode */}
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <h4 style={{ fontSize: '0.95rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Barcode size={16} color="#38bdf8" />
                <span>Kiểm Tra Súng Quét Mã Vạch (USB Barcode Gun)</span>
              </h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                Bấm chuột vào ô bên dưới và bóp cò súng quét lên một mã vạch bất kỳ:
              </p>
              <input
                type="text"
                placeholder="Bấm vào đây rồi bóp cò súng quét..."
                value={testBarcodeInput}
                onChange={(e) => setTestBarcodeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleTestBarcodeGun(testBarcodeInput);
                  }
                }}
                style={{ width: '100%', padding: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px' }}
              />
              {barcodeTestSuccess && (
                <div style={{ marginTop: '8px', color: '#10b981', fontSize: '0.85rem', fontWeight: 600 }}>
                  ✅ {barcodeTestSuccess}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 5. HƯỚNG DẪN TRIỂN KHAI KIOSK, CLOUDFLARE, GITHUB VÀ ANDROID */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#8b5cf6', fontSize: '1.1rem', fontWeight: 700 }}>
            <Terminal size={20} />
            <span>5. Hướng Dẫn Vận Hành PC Desktop, Kiosk Tự Khởi Động & Cloudflare</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', fontSize: '0.85rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '10px' }}>
              <div style={{ fontWeight: 700, color: '#f59e0b', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Monitor size={16} />
                <span>Khởi Động Kiosk Toàn Màn</span>
              </div>
              <p style={{ color: 'var(--text-primary)', lineHeight: 1.4 }}>
                Chạy <code>scripts/start-kiosk-stations.bat</code> để mở Chrome ở chế độ <code>--kiosk</code> (giấu thanh URL, giấu nút X tắt web, chống thoát màn hình).
              </p>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '10px' }}>
              <div style={{ fontWeight: 700, color: '#38bdf8', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Globe size={16} />
                <span>Cloudflare Deploy từ PC</span>
              </div>
              <p style={{ color: 'var(--text-primary)', lineHeight: 1.4 }}>
                Mở file <code>scripts/deploy-cloudflare-tunnel.bat</code> để kết nối máy tính cửa hàng với tên miền riêng (Cloudflare Tunnel miễn phí, không cần mở port).
              </p>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '10px' }}>
              <div style={{ fontWeight: 700, color: '#10b981', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <GitBranch size={16} />
                <span>Sao Lưu GitHub Tự Động</span>
              </div>
              <p style={{ color: 'var(--text-primary)', lineHeight: 1.4 }}>
                Chạy <code>scripts/auto-backup-github.bat</code> để tự động đưa toàn bộ mã nguồn lên GitHub. Có thể đặt lịch trong Windows Task Scheduler.
              </p>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '10px' }}>
              <div style={{ fontWeight: 700, color: '#a855f7', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Smartphone size={16} />
                <span>Xuất App Android (APK)</span>
              </div>
              <p style={{ color: 'var(--text-primary)', lineHeight: 1.4 }}>
                Chạy <code>npm run build</code> rồi <code>npx cap add android</code> và <code>npx cap open android</code> để build file cài đặt APK cho điện thoại.
              </p>
            </div>
          </div>
        </div>

        {/* Nút lưu */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button type="submit" className="btn btn-primary" style={{ padding: '12px 28px', fontSize: '1rem' }}>
            <Save size={18} />
            <span>Lưu Cấu Hình Hệ Thống</span>
          </button>
        </div>
      </form>

      {/* Modal Vòng Xoay Hành Tinh Theme */}
      <ThemePickerModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        currentTheme={currentThemeId}
        onSelectTheme={handleApplyTheme}
      />
    </div>
  );
};
