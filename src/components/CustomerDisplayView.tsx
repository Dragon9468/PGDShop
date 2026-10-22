import React, { useState, useEffect } from 'react';
import { CartItem, AppSettings } from '../types';
import { dualScreenSync, CheckoutStatus } from '../services/dualScreenSync';
import { vietqrService } from '../services/vietqrService';
import { soundService } from '../services/soundService';
import {
  ShoppingCart,
  QrCode,
  CheckCircle,
  Barcode,
  Sparkles,
  Store,
  RotateCcw,
  Check,
  CreditCard,
  ScanLine,
  Loader2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { paymentWebhookService } from '../services/paymentWebhookService';

interface CustomerDisplayViewProps {
  settings: AppSettings;
}

export const CustomerDisplayView: React.FC<CustomerDisplayViewProps> = ({ settings }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [finalAmount, setFinalAmount] = useState(0);
  const [orderCode, setOrderCode] = useState<string>('');
  const [checkoutStatus, setCheckoutStatus] = useState<CheckoutStatus>('SCANNING');
  const [lastScannedId, setLastScannedId] = useState<string | null>(null);

  // Theme riêng biệt cho màn hình khách (CFD) - Độc lập với thu ngân
  const [customerTheme, setCustomerTheme] = useState<string>(() => {
    return localStorage.getItem('pgd_customer_theme') || settings.customerTheme || 'sunset-glow';
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash.includes('customer-display')) {
      document.documentElement.setAttribute('data-theme', customerTheme);
    }
  }, [customerTheme]);

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
        const scanned = barcodeBuffer.trim().toUpperCase();
        setBarcodeBuffer('');
        if (!scanned) return;

        if (scanned === 'THANHTOAN' || scanned === 'CHECKOUT') {
          handleTriggerPaymentBarcode();
        } else if (scanned === 'XOA' || scanned === 'CLEAR' || scanned === 'HUY') {
          handleTriggerUndoBarcode();
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
  }, [barcodeBuffer, cart, finalAmount, checkoutStatus, lastScannedId]);

  useEffect(() => {
    // Đăng ký nhận đồng bộ từ màn hình thu ngân
    const unsubscribe = dualScreenSync.subscribe((msg) => {
      if (msg.type === 'SYNC_CART' && msg.payload) {
        setCart(msg.payload.items || []);
        setTotalAmount(msg.payload.totalAmount || 0);
        setDiscountAmount(msg.payload.discountAmount || 0);
        setFinalAmount(msg.payload.finalAmount || 0);
        if (msg.payload.orderCode) {
          setOrderCode(msg.payload.orderCode);
        }
        if (msg.payload.checkoutStatus) {
          setCheckoutStatus(msg.payload.checkoutStatus);
        }
      } else if (msg.type === 'SET_CHECKOUT_STATUS' && msg.payload) {
        if (msg.payload.checkoutStatus) {
          setCheckoutStatus(msg.payload.checkoutStatus);
        }
        if (msg.payload.finalAmount !== undefined) {
          setFinalAmount(msg.payload.finalAmount);
        }
      } else if (msg.type === 'SET_CUSTOMER_THEME' && msg.payload?.customerTheme) {
        setCustomerTheme(msg.payload.customerTheme);
        localStorage.setItem('pgd_customer_theme', msg.payload.customerTheme);
        if (typeof window !== 'undefined' && window.location.hash.includes('customer-display')) {
          document.documentElement.setAttribute('data-theme', msg.payload.customerTheme);
        }
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
        setOrderCode('');
        setCheckoutStatus('SCANNING');
        setCountdown(null);
      }
    });

    return () => unsubscribe();
  }, [finalAmount]);

  // Lắng nghe Webhook trực tiếp khi CFD chạy độc lập trên màn hình khách
  useEffect(() => {
    if (checkoutStatus === 'AWAITING_PAYMENT' && orderCode && finalAmount > 0) {
      paymentWebhookService.startMonitoring(orderCode, finalAmount, (tx) => {
        soundService.announceTransferSuccess(tx.amount || finalAmount);
        dualScreenSync.notifyPaymentSuccess('VIETQR', tx.amount || finalAmount, orderCode);
        triggerSuccessScreen('VIETQR', tx.amount || finalAmount);
      });
    }
    return () => {
      if (checkoutStatus !== 'AWAITING_PAYMENT') {
        paymentWebhookService.stopMonitoring();
      }
    };
  }, [checkoutStatus, orderCode, finalAmount]);

  // Kích hoạt thanh toán thành công
  const triggerSuccessScreen = (method: 'CASH' | 'VIETQR', amount: number) => {
    setIsSuccess(true);
    setPaymentMethod(method);
    setPaidAmount(amount);
    setCheckoutStatus('COMPLETED');

    confetti({ particleCount: 130, spread: 80, origin: { y: 0.5 } });

    let left = settings.autoClearDelaySeconds || 4;
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
        setOrderCode('');
        setCheckoutStatus('SCANNING');
        setCountdown(null);
      }
    }, 1000);
  };

  // Hành động khi quét barcode "THANHTOAN" -> Chốt đơn và sinh VietQR động
  const handleTriggerPaymentBarcode = () => {
    if (cart.length === 0 || finalAmount <= 0) {
      soundService.speakVietnamese('Giỏ hàng trống. Vui lòng quét món hàng trước.');
      return;
    }

    // Lần 1: Sinh mã VietQR động
    if (checkoutStatus === 'SCANNING') {
      const code = orderCode || vietqrService.generateOrderCode();
      setOrderCode(code);
      setCheckoutStatus('AWAITING_PAYMENT');
      dualScreenSync.syncCartToCustomerDisplay(cart, totalAmount, discountAmount, finalAmount, code, 'AWAITING_PAYMENT');
      soundService.playSuccessChime();
      soundService.speakVietnamese(
        `Tổng tiền là ${finalAmount.toLocaleString('vi-VN')} đồng. Mời quý khách quét mã VietQR để thanh toán.`
      );
    } 
    // Khi đang ở màn hình QR: Tuyệt đối KHÔNG xác nhận tiền thủ công! App tự bắt webhook
    else if (checkoutStatus === 'AWAITING_PAYMENT') {
      soundService.playBarcodeBeep();
      soundService.speakVietnamese(
        'Mã VietQR đã sẵn sàng. Hệ thống đang tự động bắt webhook nhận tiền ngân hàng.'
      );
    }
  };

  // Hành động khi quét barcode "XOA" -> HOÀN TÁC 1 SỐ LƯỢNG MÓN VỪA QUÉT
  const handleTriggerUndoBarcode = () => {
    if (cart.length === 0) {
      soundService.speakVietnamese('Giỏ hàng trống, không có món để hoàn tác.');
      return;
    }

    // Tìm món cần hoàn tác: ưu tiên lastScannedId, hoặc lấy món cuối cùng trong giỏ
    let targetIndex = -1;
    if (lastScannedId) {
      targetIndex = cart.findIndex((i) => i.product.id === lastScannedId);
    }
    if (targetIndex === -1) {
      targetIndex = cart.length - 1;
    }

    const targetItem = cart[targetIndex];
    if (!targetItem) return;

    soundService.playBarcodeBeep();
    let updatedCart = [...cart];

    if (targetItem.quantity > 1) {
      const newQty = targetItem.quantity - 1;
      updatedCart[targetIndex] = {
        ...targetItem,
        quantity: newQty,
        subtotal: newQty * targetItem.product.retailPrice,
      };
      soundService.speakVietnamese(
        `Đã hoàn tác 1 ${targetItem.product.name}. Còn lại ${newQty} món.`
      );
    } else {
      updatedCart.splice(targetIndex, 1);
      soundService.speakVietnamese(`Đã xóa món ${targetItem.product.name} khỏi giỏ.`);
    }

    const newTotal = updatedCart.reduce((sum, item) => sum + item.subtotal, 0);
    const newFinal = Math.max(0, newTotal - discountAmount);

    setCart(updatedCart);
    setTotalAmount(newTotal);
    setFinalAmount(newFinal);

    // Nếu giỏ hàng về 0, trở về trạng thái SCANNING
    const newStatus = updatedCart.length === 0 ? 'SCANNING' : checkoutStatus;
    setCheckoutStatus(newStatus);

    dualScreenSync.syncCartToCustomerDisplay(
      updatedCart,
      newTotal,
      discountAmount,
      newFinal,
      '',
      newStatus
    );
  };

  // Tự động sinh mã VietQR động theo đúng tổng tiền và mã đơn dynamic
  const dynamicQrUrl = vietqrService.generateDynamicQRUrl(
    settings.bankConfig,
    finalAmount,
    orderCode || 'PGDSHOP'
  );

  return (
    <div className="cfd-fixed-container" data-theme={customerTheme}>
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
              color: 'var(--text-primary)',
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
            Cảm ơn Quý Khách! Hẹn gặp lại!
          </div>

          {countdown !== null && (
            <div style={{ marginTop: '20px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Đón khách tiếp theo trong: <b style={{ color: 'var(--text-primary)' }}>{countdown}s</b>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* CỘT TRÁI: GIỎ HÀNG THỰC TẾ CỦA KHÁCH */}
          <div className="cfd-column">
            {/* Header gọn gàng: Tên shop & Trạng thái */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Store size={22} color="var(--primary)" />
                <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>{settings.storeName}</span>
              </div>
              <span className={`badge ${checkoutStatus === 'AWAITING_PAYMENT' ? 'badge-primary' : 'badge-success'}`}>
                {checkoutStatus === 'AWAITING_PAYMENT' ? '💳 Chờ Khách Quét QR' : '🛒 Đang Quét Hàng'}
              </span>
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
                      background: 'var(--bg-card)',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      {item.product.imageUrl && (
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '8px',
                            objectFit: 'cover',
                            border: '1px solid var(--border-color)',
                            flexShrink: 0,
                          }}
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      )}
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '0.98rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.product.name}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {new Intl.NumberFormat('vi-VN').format(item.product.retailPrice)}đ / {item.product.unit}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div
                        style={{
                          background: 'rgba(255, 255, 255, 0.08)',
                          padding: '3px 10px',
                          borderRadius: '6px',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.92rem',
                          fontWeight: 700,
                          color: 'var(--text-primary)',
                        }}
                      >
                        x{item.quantity}
                      </div>

                      <div
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '1.05rem',
                          fontWeight: 800,
                          color: 'var(--primary)',
                          minWidth: '85px',
                          textAlign: 'right',
                        }}
                      >
                        {new Intl.NumberFormat('vi-VN').format(item.subtotal)}đ
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Khung TỔNG TIỀN cố định */}
            <div
              style={{
                borderTop: '2px solid var(--border-color)',
                paddingTop: '10px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Tổng số lượng: <b>{cart.reduce((s, i) => s + i.quantity, 0)} món</b>
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                  TỔNG TIỀN:
                </div>
              </div>
              <div
                style={{
                  fontSize: '2.1rem',
                  fontWeight: 900,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--primary)',
                }}
              >
                {new Intl.NumberFormat('vi-VN').format(finalAmount)} VNĐ
              </div>
            </div>

            {/* 2 Tem / Nút Barcode Lệnh tiện ích dán quầy (Hỗ trợ Touch Screen & Chuột Click) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
              {/* Nút / Mã Barcode THANH TOÁN */}
              <button
                type="button"
                className="cfd-barcode-sticker"
                onClick={handleTriggerPaymentBarcode}
                style={{
                  width: '100%',
                  border: checkoutStatus === 'AWAITING_PAYMENT' ? '2.5px solid var(--primary)' : '1.5px solid var(--border-color)',
                  background: checkoutStatus === 'AWAITING_PAYMENT' ? 'rgba(118, 254, 40, 0.15)' : 'var(--bg-card)',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
                title={checkoutStatus === 'SCANNING' ? 'Quét mã vạch hoặc Chạm để Chốt đơn sinh mã VietQR' : 'Mã VietQR đã sinh - Hệ thống tự động bắt webhook nhận tiền'}
              >
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--primary)', fontWeight: 800 }}>
                    {checkoutStatus === 'AWAITING_PAYMENT' ? 'MÃ QR ĐÃ SINH (CHỜ WEBHOOK):' : 'CHỐT ĐƠN SINH VIETQR:'}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: '0.98rem', color: 'var(--text-primary)' }}>
                    *THANHTOAN*
                  </div>
                  <div style={{ fontFamily: 'monospace', letterSpacing: '2px', fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    |||| | ||||| |||
                  </div>
                </div>
                <div style={{ background: 'var(--accent)', padding: '8px', borderRadius: '8px' }}>
                  {checkoutStatus === 'AWAITING_PAYMENT' ? (
                    <QrCode size={20} color="var(--primary)" />
                  ) : (
                    <Check size={20} color="var(--primary)" />
                  )}
                </div>
              </button>

              {/* Nút / Mã Barcode HOÀN TÁC / GIẢM 1 */}
              <button
                type="button"
                className="cfd-barcode-sticker"
                onClick={handleTriggerUndoBarcode}
                style={{
                  width: '100%',
                  border: '1.5px solid #ef4444',
                  background: 'var(--bg-card)',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
                title="Quét mã vạch hoặc Chạm/Click để Hoàn tác 1 số lượng món vừa quét (ví dụ lỡ scan 2 lần)"
              >
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#f87171', fontWeight: 800 }}>
                    HOÀN TÁC / GIẢM 1 MÓN:
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: '0.98rem', color: 'var(--text-primary)' }}>
                    *XOA*
                  </div>
                  <div style={{ fontFamily: 'monospace', letterSpacing: '2px', fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    ||| |||| | |||
                  </div>
                </div>
                <div style={{ background: 'rgba(239, 68, 68, 0.15)', padding: '8px', borderRadius: '8px' }}>
                  <RotateCcw size={20} color="#f87171" />
                </div>
              </button>
            </div>
          </div>

          {/* CỘT PHẢI: MÃ VIETQR ĐỘNG HOẶC HƯỚNG DẪN QUÉT ĐỒ */}
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
              // 1. Khi giỏ hàng đang trống
              <div style={{ padding: '24px', color: 'var(--text-muted)' }}>
                <QrCode size={64} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
                <h3 style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 700 }}>
                  TỰ PHỤC VỤ & THANH TOÁN TIỆN LỢI
                </h3>
                <p style={{ fontSize: '0.88rem', maxWidth: '320px', lineHeight: 1.5 }}>
                  Quý khách cầm súng quét bóp cò vào mã vạch trên từng sản phẩm để cho vào giỏ hàng.
                </p>
              </div>
            ) : checkoutStatus === 'SCANNING' ? (
              // 2. Khi đang quét đồ: CHƯA SINH QR để tránh quét nhầm số tiền cũ!
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  background: 'rgba(56, 189, 248, 0.15)',
                  border: '2px dashed #38bdf8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '14px',
                  animation: 'pulse 2s infinite',
                }}>
                  <ScanLine size={36} color="#38bdf8" />
                </div>

                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
                  ĐANG QUÉT MÓN HÀNG ({cart.reduce((s, i) => s + i.quantity, 0)} món)
                </h3>

                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', maxWidth: '320px', lineHeight: 1.4, marginBottom: '16px' }}>
                  Quý khách tiếp tục quét các sản phẩm cần mua. Khi đã quét xong hết đồ, hãy quét mã <b>THANHTOAN</b> (hoặc bấm nút dưới) để sinh mã VietQR nạp sẵn đúng số tiền!
                </p>

                <button
                  onClick={handleTriggerPaymentBarcode}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 24px',
                    borderRadius: '12px',
                    background: 'var(--primary)',
                    color: 'var(--primary-foreground, #000)',
                    fontSize: '1rem',
                    fontWeight: 800,
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 20px rgba(118, 254, 40, 0.4)',
                    transition: 'all 0.2s',
                  }}
                >
                  <CreditCard size={20} />
                  <span>XONG ĐỒ -&gt; SINH MÃ VIETQR ĐỘNG</span>
                </button>
              </div>
            ) : (
              // 3. ĐÃ QUÉT XONG ĐỒ (AWAITING_PAYMENT): SINH RA MÃ VIETQR ĐỘNG VỚI SỐ TIỀN CHÍNH XÁC
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                <div style={{
                  fontSize: '1.2rem',
                  fontWeight: 900,
                  marginBottom: '4px',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <Sparkles size={18} /> MÃ VIETQR ĐỘNG ĐÃ SINH
                </div>

                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  Số tiền đã nạp sẵn tự động. Quý khách chỉ cần bấm Xác Nhận trên App Ngân Hàng!
                </div>

                {/* Khung ảnh QR động */}
                <div
                  style={{
                    background: '#fff',
                    padding: '8px',
                    borderRadius: '12px',
                    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.7), 0 0 25px rgba(118, 254, 40, 0.3)',
                    margin: '4px 0',
                    maxWidth: 'min(240px, 42vh)',
                    width: '100%',
                    border: '3px solid var(--primary)',
                  }}
                >
                  <img
                    src={dynamicQrUrl}
                    alt="VietQR Tự Động Sinh"
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
                    padding: '6px 12px',
                    fontSize: '0.82rem',
                    textAlign: 'left',
                    marginTop: '6px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Ngân hàng:</span>
                    <b style={{ color: 'var(--text-primary)' }}>{settings.bankConfig.bankId}</b>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Số tài khoản:</span>
                    <b style={{ color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>
                      {settings.bankConfig.accountNo}
                    </b>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Chủ TK:</span>
                    <b style={{ color: 'var(--text-primary)' }}>{settings.bankConfig.accountName}</b>
                  </div>
                </div>

                {/* Live Webhook Status Indicator */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    marginTop: '8px',
                    padding: '5px 12px',
                    borderRadius: '16px',
                    background: 'rgba(56, 189, 248, 0.12)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    fontSize: '0.78rem',
                    color: '#38bdf8',
                    fontWeight: 600,
                  }}
                >
                  <Loader2 size={13} className="spin" />
                  <span>Webhook Ngân hàng tự động nhận tiền 24/7 (Không cần bấm xác nhận)</span>
                </div>

                {/* Nút bấm nếu khách muốn quét thêm món */}
                <button
                  onClick={() => {
                    setCheckoutStatus('SCANNING');
                    dualScreenSync.setCheckoutStatus('SCANNING', finalAmount);
                  }}
                  style={{
                    marginTop: '8px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    fontSize: '0.78rem',
                    textDecoration: 'underline',
                    cursor: 'pointer'
                  }}
                >
                  ↩️ Quét thêm món khác vào giỏ
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
