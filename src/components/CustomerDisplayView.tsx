import React, { useState, useEffect } from 'react';
import { CartItem, AppSettings, PosOrder } from '../types';
import { dualScreenSync, CheckoutStatus } from '../services/dualScreenSync';
import { vietqrService } from '../services/vietqrService';
import { soundService } from '../services/soundService';
import { storageService } from '../services/storageService';
import { printService } from '../services/printService';
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
  Lock,
  Unlock,
  Usb,
  Printer,
  Shield,
  KeyRound,
  X,
  Maximize,
  Minimize,
  Trash2,
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

  // Lấy ID trạm từ URL (Ví dụ: /#/customer-display?station=2)
  const stationId = React.useMemo(() => {
    if (typeof window === 'undefined') return 1;
    const search = window.location.hash.split('?')[1] || window.location.search.replace('?', '');
    const params = new URLSearchParams(search);
    return Number(params.get('station')) || 1;
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash.includes('customer-display')) {
      document.documentElement.setAttribute('data-theme', customerTheme);
      document.title = `PGDShop - Màn Khách Trạm ${stationId}`;
    }
  }, [customerTheme, stationId]);

  // Trạng thái thanh toán
  const [isSuccess, setIsSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'VIETQR'>('VIETQR');
  const [paidAmount, setPaidAmount] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Chế độ Kiosk độc lập (Tự quét hàng, tự sinh QR, tự in bill)
  const [isKioskMode, setIsKioskMode] = useState<boolean>(() => {
    if (stationId > 1) return true;
    return localStorage.getItem('pgd_kiosk_mode_' + stationId) === 'true';
  });

  // Chế độ Khóa Kiosk (Toàn màn hình, chặn chuột phải, chặn phím tắt Windows/Browser, khóa cảm ứng)
  const [isKioskLocked, setIsKioskLocked] = useState<boolean>(() => {
    return localStorage.getItem('pgd_kiosk_locked_' + stationId) === 'true';
  });
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [secretClickCount, setSecretClickCount] = useState(0);
  const ADMIN_PIN = localStorage.getItem('pgd_kiosk_pin') || '1234';

  const [isSerialConnected, setIsSerialConnected] = useState(false);
  const [stationPrinterName, setStationPrinterName] = useState(() => {
    return localStorage.getItem('pgd_station_printer_' + stationId) || `Máy in Bill Trạm ${stationId}`;
  });

  // Cử chỉ chạm 3 lần liên tiếp vào logo/tên shop để mở bàn phím PIN (chỉ nhân viên biết)
  const handleSecretLogoClick = () => {
    setSecretClickCount((prev) => {
      const next = prev + 1;
      if (next >= 3) {
        setIsPinModalOpen(true);
        return 0;
      }
      return next;
    });
    setTimeout(() => setSecretClickCount(0), 1200);
  };

  // Mở khóa Kiosk bằng mã PIN
  const handleUnlockKioskSubmit = () => {
    if (pinInput === ADMIN_PIN) {
      setIsKioskLocked(false);
      localStorage.setItem('pgd_kiosk_locked_' + stationId, 'false');
      setIsPinModalOpen(false);
      setPinInput('');
      setPinError('');
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    } else {
      setPinError('Mã PIN không đúng! (Mặc định: ' + ADMIN_PIN + ')');
    }
  };

  // Chặn chuột phải và phím tắt nguy hiểm khi đang Khóa Kiosk
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      if (isKioskLocked) {
        e.preventDefault();
      }
    };

    const handlePreventKeys = (e: KeyboardEvent) => {
      if (!isKioskLocked) return;
      if (
        e.key === 'F12' ||
        e.key === 'F11' ||
        (e.ctrlKey && ['w', 'W', 'r', 'R', 't', 'T', 'n', 'N', 'u', 'U', 'p', 'P'].includes(e.key)) ||
        (e.altKey && ['ArrowLeft', 'ArrowRight', 'F4'].includes(e.key))
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handlePreventKeys, true);
    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handlePreventKeys, true);
    };
  }, [isKioskLocked]);

  // Tự động lắng nghe máy quét Barcode USB (Web Serial) đã cấp quyền trong Cài Đặt
  useEffect(() => {
    let portReader: any = null;
    let isCancelled = false;

    if (typeof navigator !== 'undefined' && 'serial' in navigator) {
      (navigator as any).serial.getPorts().then(async (ports: any[]) => {
        if (isCancelled || !ports || ports.length === 0) return;
        // Lấy cổng tương ứng với stationId nếu có nhiều cổng
        const port = ports[stationId - 1] || ports[0];
        try {
          if (!port.readable) {
            await port.open({ baudRate: 9600 });
          }
          setIsSerialConnected(true);
          const textDecoder = new TextDecoderStream();
          port.readable.pipeTo(textDecoder.writable);
          portReader = textDecoder.readable.getReader();
          let buffer = '';
          while (!isCancelled) {
            const { value, done } = await portReader.read();
            if (done) break;
            if (value) {
              buffer += value;
              if (buffer.includes('\r') || buffer.includes('\n')) {
                const lines = buffer.split(/[\r\n]+/);
                buffer = lines.pop() || '';
                for (const line of lines) {
                  if (line.trim()) {
                    handleProcessBarcode(line.trim());
                  }
                }
              }
            }
          }
        } catch (e) {
          console.warn('Auto serial port error:', e);
        }
      });
    }

    return () => {
      isCancelled = true;
      if (portReader) {
        portReader.releaseLock();
      }
    };
  }, [stationId]);

  // Lắng nghe phím bấm từ máy quét barcode khi cắm trực tiếp vào màn hình khách
  const [barcodeBuffer, setBarcodeBuffer] = useState('');

  // Xử lý quét barcode độc lập cho từng trạm
  const handleProcessBarcode = (scannedCode: string) => {
    const scanned = scannedCode.trim().toUpperCase();
    if (!scanned) return;

    if (scanned === 'THANHTOAN' || scanned === 'CHECKOUT') {
      handleTriggerPaymentBarcode();
      return;
    }

    if (scanned === 'XOA' || scanned === 'CLEAR' || scanned === 'HUY') {
      handleTriggerUndoBarcode();
      return;
    }

    // Nếu ở chế độ Kiosk tự phục vụ:
    if (isKioskMode) {
      const products = storageService.getProducts();
      const matched = products.find((p) => p.barcode.toUpperCase() === scanned);
      if (matched) {
        soundService.playBarcodeBeep();
        setLastScannedId(matched.id);
        if (checkoutStatus === 'AWAITING_PAYMENT') {
          paymentWebhookService.stopMonitoring();
          setCheckoutStatus('SCANNING');
          setOrderCode('');
        }

        setCart((prev) => {
          const existIdx = prev.findIndex((i) => i.product.id === matched.id);
          let updated: CartItem[];
          if (existIdx >= 0) {
            updated = [...prev];
            const newQty = updated[existIdx].quantity + 1;
            updated[existIdx] = {
              ...updated[existIdx],
              quantity: newQty,
              subtotal: newQty * matched.retailPrice,
            };
          } else {
            updated = [...prev, { product: matched, quantity: 1, subtotal: matched.retailPrice }];
          }
          const total = updated.reduce((s, i) => s + i.subtotal, 0);
          setTotalAmount(total);
          setFinalAmount(total - discountAmount);
          return updated;
        });
      } else {
        soundService.speakVietnamese('Không tìm thấy sản phẩm có mã này');
      }
    } else {
      // Chế độ đồng bộ quầy
      soundService.playBarcodeBeep();
      dualScreenSync.customerScannedBarcode(scanned);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Bỏ qua nếu đang gõ mã PIN trong modal
      if ((e.target as HTMLElement).tagName === 'INPUT') return;

      // Khi máy quét barcode nhấn Enter
      if (e.key === 'Enter') {
        const scanned = barcodeBuffer.trim();
        setBarcodeBuffer('');
        if (scanned) {
          handleProcessBarcode(scanned);
        }
      } else if (e.key.length === 1) {
        setBarcodeBuffer((prev) => prev + e.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [barcodeBuffer, cart, finalAmount, checkoutStatus, lastScannedId, isKioskMode]);

  useEffect(() => {
    // Đăng ký nhận đồng bộ từ màn hình thu ngân (có lọc theo trạm)
    const unsubscribe = dualScreenSync.subscribe((msg) => {
      // 1. Phân tách trạm: Bỏ qua nếu tin nhắn chỉ định stationId khác với trạm hiện tại
      if (msg.stationId !== undefined && String(msg.stationId) !== String(stationId)) {
        return;
      }

      // 2. Nếu trạm này hoạt động độc lập (Kiosk Tự Phục Vụ): Không nhận giỏ hàng từ quầy
      if (isKioskMode && msg.type === 'SYNC_CART') {
        return;
      }

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
  }, [finalAmount, stationId, isKioskMode]);

  // Lắng nghe Webhook trực tiếp khi CFD chạy độc lập trên màn hình khách
  useEffect(() => {
    if (checkoutStatus === 'AWAITING_PAYMENT' && orderCode && finalAmount > 0) {
      paymentWebhookService.startMonitoring(orderCode, finalAmount, (tx) => {
        soundService.announceTransferSuccess(tx.amount || finalAmount);
        dualScreenSync.notifyPaymentSuccess('VIETQR', tx.amount || finalAmount, orderCode, stationId);
        triggerSuccessScreen('VIETQR', tx.amount || finalAmount);
      });
    }
    return () => {
      if (checkoutStatus !== 'AWAITING_PAYMENT') {
        paymentWebhookService.stopMonitoring();
      }
    };
  }, [checkoutStatus, orderCode, finalAmount, stationId]);

  // Kích hoạt thanh toán thành công
  const triggerSuccessScreen = (method: 'CASH' | 'VIETQR', amount: number) => {
    setIsSuccess(true);
    setPaymentMethod(method);
    setPaidAmount(amount);
    setCheckoutStatus('COMPLETED');

    confetti({ particleCount: 130, spread: 80, origin: { y: 0.5 } });

    // Lưu đơn hàng PosOrder vào DB và in bill cho trạm này
    if (cart.length > 0) {
      const newOrder: PosOrder = {
        id: 'kiosk-' + Date.now(),
        orderCode: orderCode || ('KS' + stationId + '-' + Date.now().toString().slice(-6)),
        cashierName: `Kiosk Tự Phục Vụ (Trạm ${stationId})`,
        items: cart,
        totalAmount,
        discountAmount,
        finalAmount,
        paymentMethod: method,
        paymentStatus: 'PAID',
        transferContent: `PGDSHOP KS${stationId} ` + Date.now().toString().slice(-4),
        createdAt: new Date().toISOString(),
        paidAt: new Date().toISOString(),
      };
      storageService.savePosOrder(newOrder);

      // In bill qua máy in được gán cho trạm này
      printService.printThermalReceipt(newOrder, settings);
    }

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

    // Lần 1: Sinh mã VietQR động với tiền tố trạm riêng biệt (KS1-xxxx vs KS2-yyyy)
    if (checkoutStatus === 'SCANNING') {
      const code = orderCode || ('KS' + stationId + '-' + Date.now().toString().slice(-6));
      setOrderCode(code);
      setCheckoutStatus('AWAITING_PAYMENT');
      dualScreenSync.syncCartToCustomerDisplay(cart, totalAmount, discountAmount, finalAmount, code, 'AWAITING_PAYMENT', stationId);
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
            {/* Header chuyên nghiệp dành cho khách: Tên shop & Trạng thái & Mã Trạm */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', gap: '8px', flexWrap: 'wrap' }}>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}
                onClick={handleSecretLogoClick}
                title={`${settings.storeName} (Chạm 3 lần để quản lý mở khóa)`}
              >
                <Store size={22} color="var(--primary)" />
                <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>{settings.storeName}</span>
                <span style={{ background: 'var(--accent)', color: 'var(--primary)', fontSize: '0.74rem', padding: '2px 8px', borderRadius: '4px', fontWeight: 800, border: '1px solid var(--primary)' }}>
                  {stationId === 1 ? '📺 Trạm 1 (Quầy)' : `🛒 Trạm ${stationId} (Kiosk)`}
                </span>
                {isSerialConnected && (
                  <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontSize: '0.68rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, border: '1px solid #10b981' }}>
                    🔌 Scanner Cổng Riêng
                  </span>
                )}
              </div>

              {/* Huy hiệu trạng thái - Hoàn toàn không có nút cài đặt làm rối mắt khách */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className={`badge ${checkoutStatus === 'AWAITING_PAYMENT' ? 'badge-primary' : 'badge-success'}`}>
                  {checkoutStatus === 'AWAITING_PAYMENT' ? '💳 Chờ Quét VietQR' : '🛒 Đang Quét Hàng'}
                </span>
                {isKioskLocked && (
                  <span
                    onClick={() => setIsPinModalOpen(true)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      color: 'var(--text-muted)',
                      padding: '4px 6px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    title="Chế độ bảo vệ Kiosk"
                  >
                    <Lock size={12} />
                  </span>
                )}
              </div>
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

          </div>

          {/* CỘT PHẢI: MÃ VIETQR ĐỘNG & 2 MÃ BARCODE LỆNH PHÍA TRÊN */}
          <div
            className="cfd-column"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-start',
              textAlign: 'center',
              background: 'var(--bg-card)',
              padding: '16px',
              overflowY: 'auto',
            }}
          >
            {/* 2 Tem / Nút Barcode Lệnh tiện ích: THANH TOÁN / CHECKOUT & HOÀN TÁC / UNDO */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', width: '100%', marginBottom: '12px' }}>
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
                  padding: '8px 10px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
                title="Quét mã vạch hoặc Chạm để chốt đơn sinh mã VietQR"
              >
                <div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--primary)', fontWeight: 800 }}>
                    THANH TOÁN / CHECKOUT
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: '1rem', color: 'var(--text-primary)', marginTop: '1px' }}>
                    *THANHTOAN*
                  </div>
                  <div style={{ fontFamily: 'monospace', letterSpacing: '2px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    |||| | ||||| |||
                  </div>
                </div>
                <div style={{ background: 'var(--accent)', padding: '6px', borderRadius: '6px' }}>
                  {checkoutStatus === 'AWAITING_PAYMENT' ? (
                    <QrCode size={18} color="var(--primary)" />
                  ) : (
                    <CreditCard size={18} color="var(--primary)" />
                  )}
                </div>
              </button>

              {/* Nút / Mã Barcode HOÀN TÁC */}
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
                  padding: '8px 10px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
                title="Quét mã vạch hoặc Chạm để hoàn tác 1 món vừa quét"
              >
                <div>
                  <div style={{ fontSize: '0.74rem', color: '#f87171', fontWeight: 800 }}>
                    HOÀN TÁC / UNDO
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: '1rem', color: 'var(--text-primary)', marginTop: '1px' }}>
                    *XOA*
                  </div>
                  <div style={{ fontFamily: 'monospace', letterSpacing: '2px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    ||| |||| | |||
                  </div>
                </div>
                <div style={{ background: 'rgba(239, 68, 68, 0.15)', padding: '6px', borderRadius: '6px' }}>
                  <RotateCcw size={18} color="#f87171" />
                </div>
              </button>
            </div>

            {/* KHÔNG GIAN DƯỚI: MÃ VIETQR HOẶC TRẠNG THÁI QUÉT */}
            <div style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
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
          </div>
        </>
      )}

      {/* MODAL BÀN PHÍM CẢM ỨNG NHẬP MÃ PIN MỞ KHÓA KIOSK */}
      {isPinModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsPinModalOpen(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '340px', padding: '24px', textAlign: 'center' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#f87171', marginBottom: '10px' }}>
              <Lock size={26} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Mở Khóa Kiosk Trạm {stationId}</h3>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
              Nhập mã PIN quản trị viên (Mặc định: <b>1234</b>)
            </p>

            {/* Màn hình hiển thị số PIN đã nhập */}
            <div
              style={{
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1.5px solid var(--border-color)',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '1.5rem',
                fontFamily: 'var(--font-mono)',
                letterSpacing: '8px',
                marginBottom: '14px',
                minHeight: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)',
              }}
            >
              {pinInput ? '•'.repeat(pinInput.length) : <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', letterSpacing: 'normal' }}>Chạm phím số bên dưới</span>}
            </div>

            {pinError && (
              <div style={{ color: '#ef4444', fontSize: '0.78rem', marginBottom: '10px', fontWeight: 600 }}>
                {pinError}
              </div>
            )}

            {/* Bàn phím số cảm ứng 0-9 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '14px' }}>
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => {
                    if (pinInput.length < 6) {
                      setPinInput((prev) => prev + digit);
                      setPinError('');
                    }
                  }}
                  style={{
                    padding: '14px',
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                  }}
                >
                  {digit}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setPinInput('');
                  setPinError('');
                }}
                style={{
                  padding: '14px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid #ef4444',
                  color: '#f87171',
                  cursor: 'pointer',
                }}
              >
                Xóa
              </button>
              <button
                type="button"
                onClick={() => {
                  if (pinInput.length < 6) {
                    setPinInput((prev) => prev + '0');
                    setPinError('');
                  }
                }}
                style={{
                  padding: '14px',
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                }}
              >
                0
              </button>
              <button
                type="button"
                onClick={handleUnlockKioskSubmit}
                style={{
                  padding: '14px',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  borderRadius: '8px',
                  background: '#10b981',
                  border: 'none',
                  color: '#000',
                  cursor: 'pointer',
                }}
              >
                OK
              </button>
            </div>

            <button
              type="button"
              className="btn btn-secondary"
              style={{ width: '100%', padding: '8px' }}
              onClick={() => {
                setIsPinModalOpen(false);
                setPinInput('');
                setPinError('');
              }}
            >
              Hủy
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
