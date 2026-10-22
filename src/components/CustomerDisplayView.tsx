import React, { useState, useEffect } from 'react';
import { CartItem, AppSettings } from '../types';
import { dualScreenSync } from '../services/dualScreenSync';
import { vietqrService } from '../services/vietqrService';
import { soundService } from '../services/soundService';
import {
  ShoppingCart,
  QrCode,
  CheckCircle,
  Barcode,
  Sparkles,
  Store,
  Trash2,
  Check,
  Printer,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CustomerDisplayViewProps {
  settings: AppSettings;
}

export const CustomerDisplayView: React.FC<CustomerDisplayViewProps> = ({ settings }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [finalAmount, setFinalAmount] = useState(0);

  // Trạng thái thanh toán
  const [isSuccess, setIsSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'VIETQR'>('VIETQR');
  const [paidAmount, setPaidAmount] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Lắng nghe phím bấm từ máy quét barcode khi cắm trực tiếp vào màn hình khách
  const [barcodeBuffer, setBarcodeBuffer] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Khi máy quét barcode nhấn Enter
      if (e.key === 'Enter') {
        const scanned = barcodeBuffer.trim();
        setBarcodeBuffer('');
        if (!scanned) return;

        if (scanned === 'THANHTOAN' || scanned === 'CHECKOUT') {
          handleTriggerPayment();
        } else if (scanned === 'XOA' || scanned === 'CLEAR' || scanned === 'HUY') {
          handleTriggerClear();
        } else {
          soundService.playBarcodeBeep();
          dualScreenSync.customerScannedBarcode(scanned);
        }
      } else if (e.key.length === 1) {
        setBarcodeBuffer((prev) => prev + e.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [barcodeBuffer, finalAmount]);

  useEffect(() => {
    // Đăng ký nhận đồng bộ từ màn hình thu ngân
    const unsubscribe = dualScreenSync.subscribe((msg) => {
      if (msg.type === 'SYNC_CART' && msg.payload) {
        setCart(msg.payload.items || []);
        setTotalAmount(msg.payload.totalAmount || 0);
        setDiscountAmount(msg.payload.discountAmount || 0);
        setFinalAmount(msg.payload.finalAmount || 0);
      } else if (msg.type === 'PAYMENT_COMPLETED' && msg.payload) {
        triggerSuccessScreen(
          msg.payload.paymentMethod || 'VIETQR',
          msg.payload.paidAmount || finalAmount
        );
      } else if (msg.type === 'CLEAR_CART') {
        setIsSuccess(false);
        setCart([]);
        setTotalAmount(0);
        setFinalAmount(0);
        setCountdown(null);
      }
    });

    return () => unsubscribe();
  }, [finalAmount]);

  // Kích hoạt thanh toán thành công
  const triggerSuccessScreen = (method: 'CASH' | 'VIETQR', amount: number) => {
    setIsSuccess(true);
    setPaymentMethod(method);
    setPaidAmount(amount);

    confetti({ particleCount: 130, spread: 80, origin: { y: 0.5 } });

    let left = settings.autoClearDelaySeconds || 3;
    setCountdown(left);
    const timer = setInterval(() => {
      left -= 1;
      setCountdown(left);
      if (left <= 0) {
        clearInterval(timer);
        setIsSuccess(false);
        setCart([]);
        setTotalAmount(0);
        setFinalAmount(0);
        setCountdown(null);
      }
    }, 1000);
  };

  // Hành động khi quét barcode "THANHTOAN"
  const handleTriggerPayment = () => {
    if (cart.length === 0 || finalAmount <= 0) return;
    soundService.announceTransferSuccess(finalAmount);
    dualScreenSync.notifyPaymentSuccess('VIETQR', finalAmount, '');
    triggerSuccessScreen('VIETQR', finalAmount);
  };

  // Hành động khi quét barcode "XOA"
  const handleTriggerClear = () => {
    soundService.playBarcodeBeep();
    soundService.speakVietnamese('Đã xóa giỏ hàng');
    dualScreenSync.clearCart();
    setCart([]);
    setTotalAmount(0);
    setFinalAmount(0);
  };

  // Tự động sinh mã VietQR động theo đúng tổng tiền hiện tại
  const dynamicQrUrl = vietqrService.generateDynamicQRUrl(
    settings.bankConfig,
    finalAmount,
    'PGD' + Math.floor(100 + Math.random() * 900)
  );

  return (
    <div className="cfd-fixed-container">
      {/* NẾU ĐÃ THANH TOÁN THÀNH CÔNG */}
      {isSuccess ? (
        <div
          style={{
            gridColumn: '1 / -1',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-card)',
            backdropFilter: 'blur(30px)',
            borderRadius: '16px',
            border: '2px solid var(--primary)',
            padding: '24px',
            textAlign: 'center',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
              border: '2px solid var(--primary)',
            }}
          >
            <CheckCircle size={52} color="var(--primary)" />
          </div>

          <h1 style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '8px' }}>
            THANH TOÁN THÀNH CÔNG!
          </h1>

          <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            {paymentMethod === 'VIETQR' ? 'Chuyển khoản VietQR 24/7' : 'Thanh toán tiền mặt'}
          </p>

          <div
            style={{
              fontSize: '2.8rem',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              color: '#fff',
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '10px 32px',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              marginBottom: '16px',
            }}
          >
            {new Intl.NumberFormat('vi-VN').format(paidAmount)} VNĐ
          </div>

          <div style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
            Cảm ơn Quý Khách!
          </div>

          {countdown !== null && (
            <div style={{ marginTop: '20px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Đón khách tiếp theo trong: <b style={{ color: '#fff' }}>{countdown}s</b>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* CỘT TRÁI: GIỎ HÀNG THỰC TẾ CỦA KHÁCH */}
          <div className="cfd-column">
            {/* Header gọn gàng: Tên shop */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Store size={22} color="var(--primary)" />
                <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff' }}>{settings.storeName}</span>
              </div>
              <span className="badge badge-success">Tự Quét Thanh Toán</span>
            </div>

            {/* Danh sách món trong giỏ (co giãn vừa khít 1 màn hình) */}
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', margin: '10px 0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {cart.length === 0 ? (
                <div
                  style={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-muted)',
                    gap: '10px',
                    textAlign: 'center',
                  }}
                >
                  <ShoppingCart size={48} strokeWidth={1.5} color="var(--text-muted)" />
                  <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Giỏ hàng đang trống
                  </div>
                  <div style={{ fontSize: '0.85rem' }}>
                    Quét mã vạch sản phẩm để bắt đầu tính tiền
                  </div>
                </div>
              ) : (
                cart.map((item, index) => (
                  <div
                    key={item.product.id || index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'rgba(255, 255, 255, 0.03)',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.98rem', fontWeight: 600, color: '#fff' }}>{item.product.name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {new Intl.NumberFormat('vi-VN').format(item.product.retailPrice)}đ / {item.product.unit}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>
                        {new Intl.NumberFormat('vi-VN').format(item.subtotal)}đ
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        SL: x{item.quantity}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Tổng tiền thanh toán (Luôn ghim dưới chân cột trái) */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '10px', marginTop: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 800 }}>TỔNG TIỀN:</span>
                <span
                  style={{
                    fontSize: '2rem',
                    fontWeight: 800,
                    color: 'var(--primary)',
                    fontFamily: 'var(--font-mono)',
                    textShadow: '0 0 16px var(--accent)',
                  }}
                >
                  {new Intl.NumberFormat('vi-VN').format(finalAmount)} VNĐ
                </span>
              </div>
            </div>

            {/* 2 MÃ BARCODE ĐẶC BIỆT: THANH TOÁN & XÓA */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '10px', borderTop: '1px dashed var(--border-color)', paddingTop: '8px' }}>
              {/* Nút / Mã Barcode THANH TOÁN */}
              <div
                className="cfd-barcode-sticker"
                onClick={handleTriggerPayment}
                title="Bấm hoặc bóp cò súng quét mã này để xác nhận đã chuyển tiền"
              >
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--primary)', fontWeight: 700 }}>
                    MÃ QUÉT XÁC NHẬN:
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.95rem', color: '#fff' }}>
                    *THANHTOAN*
                  </div>
                </div>
                <div style={{ background: 'var(--accent)', padding: '6px', borderRadius: '6px' }}>
                  <Check size={18} color="var(--primary)" />
                </div>
              </div>

              {/* Nút / Mã Barcode XÓA GIỎ */}
              <div
                className="cfd-barcode-sticker"
                onClick={handleTriggerClear}
                title="Bấm hoặc bóp cò súng quét mã này để xóa giỏ hàng"
              >
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#f87171', fontWeight: 700 }}>
                    MÃ QUÉT HỦY / LÀM LẠI:
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.95rem', color: '#fff' }}>
                    *XOA*
                  </div>
                </div>
                <div style={{ background: 'rgba(239, 68, 68, 0.15)', padding: '6px', borderRadius: '6px' }}>
                  <Trash2 size={18} color="#f87171" />
                </div>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: MÃ VIETQR TỰ ĐỘNG SINH (DYNAMIC QR) */}
          <div
            className="cfd-column"
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              background: 'var(--bg-card)',
            }}
          >
            {cart.length === 0 ? (
              <div style={{ padding: '20px', color: 'var(--text-muted)' }}>
                <QrCode size={64} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
                <h3 style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  MÃ QR THANH TOÁN TỰ ĐỘNG
                </h3>
                <p style={{ fontSize: '0.85rem', maxWidth: '300px', lineHeight: 1.4 }}>
                  Mã QR sẽ tự động hiển thị ngay khi quý khách quét món hàng đầu tiên
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                <div style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '6px', color: '#fff' }}>
                  QUÉT MÃ ĐỂ THANH TOÁN
                </div>

                {/* Khung ảnh QR tự động co giãn theo chiều cao màn hình */}
                <div
                  style={{
                    background: '#fff',
                    padding: '8px',
                    borderRadius: '10px',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
                    margin: '6px 0',
                    maxWidth: 'min(240px, 45vh)',
                    width: '100%',
                  }}
                >
                  <img
                    src={dynamicQrUrl}
                    alt="VietQR Tự Sinh"
                    style={{ width: '100%', height: 'auto', display: 'block' }}
                  />
                </div>

                {/* Thông tin tài khoản ngắn gọn */}
                <div
                  style={{
                    width: '100%',
                    maxWidth: '320px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '0.84rem',
                    textAlign: 'left',
                    marginTop: '6px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Ngân hàng:</span>
                    <b style={{ color: '#fff' }}>{settings.bankConfig.bankId}</b>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Số tài khoản:</span>
                    <b style={{ color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>
                      {settings.bankConfig.accountNo}
                    </b>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Chủ TK:</span>
                    <b style={{ color: '#fff' }}>{settings.bankConfig.accountName}</b>
                  </div>
                </div>

                <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--primary)' }}>
                  <div className="pulse-dot"></div>
                  <span>Loa tự động thông báo khi nhận tiền</span>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
