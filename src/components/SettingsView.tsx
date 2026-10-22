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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    storageService.saveSettings(formData);
    onUpdateSettings(formData);
    soundService.setEnabled(formData.isAudioEnabled);
    soundService.setVoiceRate(formData.voiceSpeed);

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
              <span>2 Mã Vạch Lệnh Tiện Ích Cố Định Quầy & Máy In Barcode</span>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={() => printService.printBarcodeStickers(formData.storeName)}
              style={{ background: '#10b981', color: '#040d06', fontWeight: 800, padding: '10px 18px', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)' }}
            >
              <Printer size={16} />
              <span>IN 2 TEM RA MÁY IN BARCODE / BILL K80</span>
            </button>
          </div>

          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
            Hệ thống đã thiết lập cố định 2 mã barcode lệnh: <b>THANHTOAN</b> (Sinh VietQR nạp đúng số tiền & xác nhận đơn) và <b>XOA</b> (Hoàn tác 1 số lượng món vừa bóp cò nhầm). Bạn có thể gắn máy in barcode decal (khổ 50x30mm) hoặc máy in bill nhiệt K80 để in dán quầy, hoặc cho phép khách chạm/click dạng button trên màn hình:
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
            {/* TEM 1 */}
            <div style={{ background: '#fff', color: '#000', padding: '16px', borderRadius: '12px', border: '2.5px solid #059669', boxShadow: '0 4px 12px rgba(5, 150, 105, 0.15)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#059669' }}>
                  1. MÃ LỆNH THANH TOÁN (THANHTOAN)
                </span>
                <span style={{ background: '#dcfce7', color: '#15803d', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>CỐ ĐỊNH</span>
              </div>
              <div style={{ fontSize: '0.76rem', color: '#64748b', marginBottom: '10px', lineHeight: 1.3 }}>
                Lần 1: Chốt đơn và sinh mã VietQR động nạp sẵn đúng số tiền • Lần 2: Xác nhận hoàn tất đơn khi tiền về.
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '2.2rem', letterSpacing: '4px', fontWeight: 900, textAlign: 'center', color: '#000' }}>
                |||| | ||||| ||| |||
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: '1.15rem', textAlign: 'center', marginTop: '2px', color: '#059669' }}>
                *THANHTOAN*
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', textAlign: 'center', marginTop: '6px' }}>
                Dán tại quầy thu ngân hoặc cạnh màn hình phụ CFD
              </div>
            </div>

            {/* TEM 2 */}
            <div style={{ background: '#fff', color: '#000', padding: '16px', borderRadius: '12px', border: '2.5px solid #dc2626', boxShadow: '0 4px 12px rgba(220, 38, 38, 0.15)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#dc2626' }}>
                  2. MÃ LỆNH HOÀN TÁC (XOA)
                </span>
                <span style={{ background: '#fee2e2', color: '#b91c1c', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>CỐ ĐỊNH</span>
              </div>
              <div style={{ fontSize: '0.76rem', color: '#64748b', marginBottom: '10px', lineHeight: 1.3 }}>
                Trừ 1 số lượng món vừa bóp cò nhầm (ví dụ khách mua 1 hộp giấy nhưng lỡ tay bóp cò 2 lần).
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '2.2rem', letterSpacing: '4px', fontWeight: 900, textAlign: 'center', color: '#000' }}>
                ||| |||| | ||| ||||
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: '1.15rem', textAlign: 'center', marginTop: '2px', color: '#dc2626' }}>
                *XOA*
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', textAlign: 'center', marginTop: '6px' }}>
                Dán trên thân hoặc cạnh chân đế súng quét barcode
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

        {/* 3. THỬ NGHIỆM THIẾT BỊ PHẦN CỨNG: LOA BLUETOOTH & SÚNG QUÉT */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#f59e0b', fontSize: '1.1rem', fontWeight: 700 }}>
            <Volume2 size={20} />
            <span>3. Kiểm Tra Thiết Bị Quầy (Loa Bluetooth & Súng Quét Barcode)</span>
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

        {/* 4. HƯỚNG DẪN TRIỂN KHAI CLOUDFLARE, GITHUB VÀ ANDROID */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#8b5cf6', fontSize: '1.1rem', fontWeight: 700 }}>
            <Terminal size={20} />
            <span>4. Hướng Dẫn Vận Hành PC Desktop, Web Cloudflare & App Android</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', fontSize: '0.85rem' }}>
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
              <div style={{ fontWeight: 700, color: '#f59e0b', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Smartphone size={16} />
                <span>Xuất App Android (APK)</span>
              </div>
              <p style={{ color: 'var(--text-primary)', lineHeight: 1.4 }}>
                Chạy <code>npm run build</code> rồi <code>npx cap add android</code> và <code>npx cap open android</code> để build file cài đặt APK cho điện thoại và máy tính bảng.
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
