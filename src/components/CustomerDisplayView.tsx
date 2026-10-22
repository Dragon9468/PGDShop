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
  CreditCard,
  Smile,
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
  const [orderCode, setOrderCode] = useState('PGD261022-001');

  // Trạng thái thanh toán
  const [isSuccess, setIsSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'VIETQR'>('VIETQR');
  const [paidAmount, setPaidAmount] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Ô quét mã tự phục vụ cho khách
  const [selfScanBarcode, setSelfScanBarcode] = useState('');

  useEffect(() => {
    // Đăng ký lắng nghe sự kiện đồng bộ từ Màn Hình Thu Ngân
    const unsubscribe = dualScreenSync.subscribe((msg) => {
      if (msg.type === 'SYNC_CART' && msg.payload) {
        setCart(msg.payload.items || []);
        setTotalAmount(msg.payload.totalAmount || 0);
        setDiscountAmount(msg.payload.discountAmount || 0);
        setFinalAmount(msg.payload.finalAmount || 0);
        if (msg.payload.orderCode) setOrderCode(msg.payload.orderCode);
      } else if (msg.type === 'PAYMENT_COMPLETED' && msg.payload) {
        setIsSuccess(true);
        setPaymentMethod(msg.payload.paymentMethod || 'VIETQR');
        setPaidAmount(msg.payload.paidAmount || finalAmount);

        // Hiệu ứng pháo hoa chúc mừng khách
        confetti({
          particleCount: 150,
          spread: 90,
          origin: { y: 0.6 },
        });

        // Đếm ngược 3 giây tự động trở về màn hình chờ đón khách sau
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
      } else if (msg.type === 'CLEAR_CART') {
        setIsSuccess(false);
        setCart([]);
        setTotalAmount(0);
        setFinalAmount(0);
        setCountdown(null);
      }
    });

    return () => unsubscribe();
  }, [finalAmount, settings.autoClearDelaySeconds]);

  // Khách tự quét mã barcode
  const handleCustomerScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selfScanBarcode.trim()) return;

    soundService.playBarcodeBeep();
    dualScreenSync.customerScannedBarcode(selfScanBarcode.trim());
    setSelfScanBarcode('');
  };

  const dynamicQrUrl = vietqrService.generateDynamicQRUrl(
    settings.bankConfig,
    finalAmount,
    orderCode
  );

  return (
    <div className="cfd-container">
      {/* NẾU ĐÃ THANH TOÁN THÀNH CÔNG: MÀN HÌNH CHÚC MỪNG TOÀN DIỆN */}
      {isSuccess ? (
        <div
          style={{
            gridColumn: '1 / -1',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(15, 23, 42, 0.9)',
            backdropFilter: 'blur(30px)',
            borderRadius: '24px',
            border: '2px solid #10b981',
            padding: '60px 40px',
            boxShadow: '0 0 60px rgba(16, 185, 129, 0.4)',
            textAlign: 'center',
            animation: 'modalIn 0.3s ease',
          }}
        >
          <div
            style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '24px',
              border: '2px solid #10b981',
            }}
          >
            <CheckCircle size={72} color="#10b981" />
          </div>

          <h1 style={{ fontSize: '3rem', fontWeight: 800, color: '#10b981', marginBottom: '12px' }}>
            THANH TOÁN THÀNH CÔNG!
          </h1>

          <p style={{ fontSize: '1.4rem', color: '#cbd5e1', marginBottom: '16px' }}>
            {paymentMethod === 'VIETQR' ? 'Chuyển khoản VietQR 24/7' : 'Thanh toán tiền mặt tại quầy'}
          </p>

          <div
            style={{
              fontSize: '2.8rem',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              color: '#fff',
              background: 'rgba(255, 255, 255, 0.06)',
              padding: '12px 36px',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              marginBottom: '24px',
            }}
          >
            {new Intl.NumberFormat('vi-VN').format(paidAmount)} VNĐ
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8', fontSize: '1.2rem' }}>
            <Smile size={24} />
            <span>Cảm ơn Quý Khách & Hẹn Gặp Lại!</span>
          </div>

          {countdown !== null && (
            <div style={{ marginTop: '28px', color: '#64748b', fontSize: '1rem' }}>
              Sẵn sàng cho khách tiếp theo trong: <b style={{ color: '#fff' }}>{countdown} giây</b>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* CỘT TRÁI: GIỎ HÀNG CỦA KHÁCH + TỰ QUÉT MÃ */}
          <div className="cfd-cart-card">
            {/* Header Màn Hình Khách */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Store size={32} color="#38bdf8" />
                <div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>{settings.storeName}</h2>
                  <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Màn hình đối diện khách hàng</p>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>MÃ ĐƠN HÀNG</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#38bdf8' }}>{orderCode}</div>
              </div>
            </div>

            {/* Khung Khách Tự Quét Barcode */}
            <form onSubmit={handleCustomerScanSubmit} style={{ margin: '16px 0' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  borderRadius: '12px',
                  padding: '10px 16px',
                }}
              >
                <Barcode size={24} color="#38bdf8" />
                <input
                  type="text"
                  placeholder="Quý khách có thể tự quét mã vạch sản phẩm tại đây..."
                  value={selfScanBarcode}
                  onChange={(e) => setSelfScanBarcode(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#fff',
                    fontSize: '1rem',
                    width: '100%',
                  }}
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '6px 14px', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                >
                  Quét
                </button>
              </div>
            </form>

            {/* Danh sách sản phẩm trong giỏ */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', margin: '8px 0' }}>
              {cart.length === 0 ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '240px',
                    color: '#64748b',
                    gap: '12px',
                  }}
                >
                  <ShoppingCart size={54} strokeWidth={1.5} color="#475569" />
                  <p style={{ fontSize: '1.2rem', color: '#94a3b8' }}>Giỏ hàng hiện đang trống</p>
                  <p style={{ fontSize: '0.9rem', color: '#64748b' }}>
                    Thu ngân hoặc Quý khách vui lòng quét mã vạch sản phẩm để bắt đầu
                  </p>
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
                      padding: '12px 16px',
                      borderRadius: '10px',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{item.product.name}</div>
                      <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                        Đơn giá: {new Intl.NumberFormat('vi-VN').format(item.product.retailPrice)}đ / {item.product.unit}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                        {new Intl.NumberFormat('vi-VN').format(item.subtotal)}đ
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 600 }}>
                        Số lượng: x{item.quantity}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Tổng hóa đơn */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#94a3b8', fontSize: '1.1rem' }}>
                <span>Tổng tiền hàng:</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>{new Intl.NumberFormat('vi-VN').format(totalAmount)}đ</span>
              </div>
              {discountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#f87171', fontSize: '1.1rem' }}>
                  <span>Chiết khấu / Giảm giá:</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>-{new Intl.NumberFormat('vi-VN').format(discountAmount)}đ</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '12px' }}>
                <span style={{ fontSize: '1.4rem', fontWeight: 800 }}>TỔNG THANH TOÁN:</span>
                <span style={{ fontSize: '2.4rem', fontWeight: 800, color: '#10b981', fontFamily: 'var(--font-mono)', textShadow: '0 0 20px rgba(16, 185, 129, 0.4)' }}>
                  {new Intl.NumberFormat('vi-VN').format(finalAmount)} VNĐ
                </span>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: MÃ VIETQR ĐỘNG TOÁN BỘ MÀN HÌNH */}
          <div className="cfd-qr-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <QrCode size={28} color="#38bdf8" />
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>QUÉT MÃ ĐỂ THANH TOÁN 24/7</h2>
            </div>

            <p style={{ fontSize: '0.95rem', color: '#94a3b8', maxWidth: '380px', lineHeight: 1.4 }}>
              Mở ứng dụng ngân hàng hoặc ví điện tử bất kỳ quét mã bên dưới. Số tiền và nội dung sẽ được điền tự động chính xác!
            </p>

            {/* Ảnh VietQR động */}
            <div className="vietqr-image-box" style={{ maxWidth: '340px' }}>
              <img src={dynamicQrUrl} alt="Mã VietQR Động Quét Thanh Toán" />
            </div>

            {/* Chi tiết chuyển khoản */}
            <div
              style={{
                width: '100%',
                maxWidth: '380px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '14px',
                textAlign: 'left',
                fontSize: '0.95rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#94a3b8' }}>Ngân hàng thụ hưởng:</span>
                <b style={{ color: '#fff' }}>{settings.bankConfig.bankId}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#94a3b8' }}>Số tài khoản:</span>
                <b style={{ color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>{settings.bankConfig.accountNo}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#94a3b8' }}>Chủ tài khoản:</span>
                <b style={{ color: '#fff' }}>{settings.bankConfig.accountName}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '6px', marginTop: '6px' }}>
                <span style={{ color: '#94a3b8' }}>Nội dung chuyển:</span>
                <b style={{ color: '#fbbf24', fontFamily: 'var(--font-mono)' }}>{orderCode}</b>
              </div>
            </div>

            <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontSize: '0.9rem' }}>
              <div className="pulse-dot"></div>
              <span>Hệ thống tự động phát loa và in hóa đơn ngay khi nhận tiền</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
