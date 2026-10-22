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
} from 'lucide-react';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, onUpdateSettings }) => {
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [savedAlert, setSavedAlert] = useState(false);
  const [testBarcodeInput, setTestBarcodeInput] = useState('');
  const [barcodeTestSuccess, setBarcodeTestSuccess] = useState<string | null>(null);

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
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '4px' }}>
            Thiết lập tài khoản ngân hàng VietQR, Supabase Realtime, Google Sheets Webhook, Loa Bluetooth và Thiết Bị Quầy.
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
        {/* 1. THÔNG TIN CỬA HÀNG & TÀI KHOẢN NGÂN HÀNG VIETQR */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#38bdf8', fontSize: '1.1rem', fontWeight: 700 }}>
            <CreditCard size={20} />
            <span>1. Thông Tin Cửa Hàng & Tài Khoản Ngân Hàng (VietQR Động)</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Tên Cửa Hàng (In trên bill & CFD):</label>
              <input
                type="text"
                value={formData.storeName}
                onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '8px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Mã Số Thuế Cửa Hàng:</label>
              <input
                type="text"
                value={formData.storeTaxId}
                onChange={(e) => setFormData({ ...formData, storeTaxId: e.target.value })}
                style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '8px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Địa Chỉ Cửa Hàng:</label>
              <input
                type="text"
                value={formData.storeAddress}
                onChange={(e) => setFormData({ ...formData, storeAddress: e.target.value })}
                style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '8px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Số Điện Thoại Hotline:</label>
              <input
                type="text"
                value={formData.storePhone}
                onChange={(e) => setFormData({ ...formData, storePhone: e.target.value })}
                style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '8px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Ngân Hàng Thụ Hưởng (VietQR):</label>
              <select
                value={formData.bankConfig.bankId}
                onChange={(e) => setFormData({ ...formData, bankConfig: { ...formData.bankConfig, bankId: e.target.value } })}
                style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '8px' }}
              >
                {POPULAR_BANKS.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Số Tài Khoản Ngân Hàng:</label>
              <input
                type="text"
                value={formData.bankConfig.accountNo}
                onChange={(e) => setFormData({ ...formData, bankConfig: { ...formData.bankConfig, accountNo: e.target.value } })}
                style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '8px', fontFamily: 'var(--font-mono)' }}
              />
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Tên Chủ Tài Khoản (In hoa không dấu):</label>
              <input
                type="text"
                value={formData.bankConfig.accountName}
                onChange={(e) => setFormData({ ...formData, bankConfig: { ...formData.bankConfig, accountName: e.target.value.toUpperCase() } })}
                style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '8px' }}
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
              <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Supabase Project URL:</label>
              <input
                type="text"
                placeholder="https://xyzcompany.supabase.co"
                value={formData.supabaseUrl}
                onChange={(e) => setFormData({ ...formData, supabaseUrl: e.target.value })}
                style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '8px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Supabase Anon Public Key:</label>
              <input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={formData.supabaseAnonKey}
                onChange={(e) => setFormData({ ...formData, supabaseAnonKey: e.target.value })}
                style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '8px' }}
              />
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Google Sheets Apps Script Web App URL (Tùy chọn):</label>
              <input
                type="text"
                placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                value={formData.googleSheetsWebhookUrl}
                onChange={(e) => setFormData({ ...formData, googleSheetsWebhookUrl: e.target.value })}
                style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '8px' }}
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
              <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: '12px', lineHeight: 1.4 }}>
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
              <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: '10px' }}>
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
                style={{ width: '100%', padding: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '6px' }}
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
              <p style={{ color: '#cbd5e1', lineHeight: 1.4 }}>
                Mở file <code>scripts/deploy-cloudflare-tunnel.bat</code> để kết nối máy tính cửa hàng với tên miền riêng (Cloudflare Tunnel miễn phí, không cần mở port).
              </p>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '10px' }}>
              <div style={{ fontWeight: 700, color: '#10b981', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <GitBranch size={16} />
                <span>Sao Lưu GitHub Tự Động</span>
              </div>
              <p style={{ color: '#cbd5e1', lineHeight: 1.4 }}>
                Chạy <code>scripts/auto-backup-github.bat</code> để tự động đưa toàn bộ mã nguồn lên GitHub. Có thể đặt lịch trong Windows Task Scheduler.
              </p>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '10px' }}>
              <div style={{ fontWeight: 700, color: '#f59e0b', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Smartphone size={16} />
                <span>Xuất App Android (APK)</span>
              </div>
              <p style={{ color: '#cbd5e1', lineHeight: 1.4 }}>
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
    </div>
  );
};
