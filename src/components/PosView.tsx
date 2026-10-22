import React, { useState, useEffect, useRef } from 'react';
import {
  Product,
  CartItem,
  PosOrder,
  ProductCategory,
  AppSettings,
} from '../types';
import {
  Barcode,
  Trash2,
  Plus,
  Minus,
  DollarSign,
  X,
  Loader2,
} from 'lucide-react';
import { soundService } from '../services/soundService';
import { dualScreenSync, CheckoutStatus } from '../services/dualScreenSync';
import { printService } from '../services/printService';
import { storageService } from '../services/storageService';
import { vietqrService } from '../services/vietqrService';
import { paymentWebhookService, WebhookBankTransaction } from '../services/paymentWebhookService';
import confetti from 'canvas-confetti';

interface PosViewProps {
  settings: AppSettings;
}

export const PosView: React.FC<PosViewProps> = ({ settings }) => {
  const [products, setProducts] = useState<Product[]>(() => storageService.getProducts());
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>('TatCa');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [checkoutStatus, setCheckoutStatus] = useState<CheckoutStatus>('SCANNING');
  const [activeOrderCode, setActiveOrderCode] = useState<string>('');
  const [lastScannedProductId, setLastScannedProductId] = useState<string | null>(null);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Khởi tạo và lắng nghe đồng bộ từ màn hình khách
  useEffect(() => {
    // Lắng nghe khi khách tự quét sản phẩm trên màn hình phụ (CFD)
    const unsubscribe = dualScreenSync.subscribe((msg) => {
      if (msg.type === 'CUSTOMER_SCANNED_BARCODE' && msg.payload?.barcode) {
        handleScanBarcode(msg.payload.barcode);
      } else if (msg.type === 'CLEAR_CART') {
        clearCart();
      } else if (msg.type === 'SET_CHECKOUT_STATUS' && msg.payload?.checkoutStatus) {
        setCheckoutStatus(msg.payload.checkoutStatus);
      } else if (msg.type === 'PAYMENT_COMPLETED') {
        setCheckoutStatus('COMPLETED');
      }
    });

    return () => {
      unsubscribe();
      paymentWebhookService.stopMonitoring();
    };
  }, []);

  // Tính tổng tiền
  const totalAmount = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const finalAmount = Math.max(0, totalAmount - discountAmount);

  // Tự động đồng bộ giỏ hàng sang màn hình phụ (CFD) ngay khi có thay đổi
  useEffect(() => {
    dualScreenSync.syncCartToCustomerDisplay(
      cart,
      totalAmount,
      discountAmount,
      finalAmount,
      activeOrderCode,
      checkoutStatus
    );
  }, [cart, totalAmount, discountAmount, finalAmount, activeOrderCode, checkoutStatus]);

  // Xử lý quét barcode từ súng quét USB
  const handleScanBarcode = (barcode: string) => {
    const cleanCode = barcode.trim().toUpperCase();
    if (!cleanCode) return;

    // 1. Kiểm tra nếu quét mã tiện ích "THANHTOAN" -> Chốt đơn sinh mã VietQR động trên màn hình khách
    if (cleanCode === 'THANHTOAN' || cleanCode === 'CHECKOUT') {
      if (cart.length === 0 || finalAmount <= 0) {
        soundService.speakVietnamese('Giỏ hàng trống. Vui lòng quét món hàng trước.');
        setSearchQuery('');
        return;
      }

      // Nếu đang quét đồ -> Chốt đơn và sinh VietQR động đúng số tiền
      if (checkoutStatus === 'SCANNING') {
        const orderCode = vietqrService.generateOrderCode();
        setActiveOrderCode(orderCode);
        setCheckoutStatus('AWAITING_PAYMENT');
        dualScreenSync.syncCartToCustomerDisplay(
          cart,
          totalAmount,
          discountAmount,
          finalAmount,
          orderCode,
          'AWAITING_PAYMENT'
        );

        // Bật Webhook Listener tự động bắt tiền về từ tài khoản ngân hàng
        paymentWebhookService.startMonitoring(orderCode, finalAmount, (tx) => {
          handleWebhookPaymentSuccess(tx, orderCode);
        });

        soundService.playSuccessChime();
        soundService.speakVietnamese(
          `Tổng tiền là ${finalAmount.toLocaleString('vi-VN')} đồng. Mời quý khách quét mã VietQR để thanh toán.`
        );
      } else {
        // Đã sinh QR rồi: Tuyệt đối KHÔNG xác nhận tiền thủ công! Báo hệ thống đang chờ webhook tự động
        soundService.playBarcodeBeep();
        soundService.speakVietnamese(
          'Mã VietQR đã sẵn sàng. Hệ thống đang tự động bắt webhook nhận tiền ngân hàng.'
        );
      }

      setSearchQuery('');
      return;
    }

    // 2. Kiểm tra nếu quét mã tiện ích "XOA" -> HOÀN TÁC 1 SỐ LƯỢNG MÓN VỪA QUÉT
    if (cleanCode === 'XOA' || cleanCode === 'CLEAR' || cleanCode === 'HUY' || cleanCode === 'UNDO') {
      handleUndoLastItem();
      setSearchQuery('');
      return;
    }

    // 3. Quét mã sản phẩm thông thường
    const matchedProduct = products.find(
      (p) => p.barcode.toUpperCase() === cleanCode
    );

    if (matchedProduct) {
      soundService.playBarcodeBeep();
      addToCart(matchedProduct);
      setSearchQuery('');
    } else {
      alert(`⚠️ Không tìm thấy sản phẩm có mã barcode: ${cleanCode}`);
    }
  };

  // Hoàn tác 1 số lượng món vừa quét
  const handleUndoLastItem = () => {
    if (cart.length === 0) {
      soundService.speakVietnamese('Giỏ hàng trống, không có món để hoàn tác.');
      return;
    }

    let targetIndex = -1;
    if (lastScannedProductId) {
      targetIndex = cart.findIndex((i) => i.product.id === lastScannedProductId);
    }
    if (targetIndex === -1) {
      targetIndex = cart.length - 1;
    }

    const targetItem = cart[targetIndex];
    if (!targetItem) return;

    soundService.playBarcodeBeep();
    setCart((prevCart) => {
      const updated = [...prevCart];
      if (targetItem.quantity > 1) {
        const newQty = targetItem.quantity - 1;
        updated[targetIndex] = {
          ...targetItem,
          quantity: newQty,
          subtotal: newQty * targetItem.product.retailPrice,
        };
        soundService.speakVietnamese(
          `Đã hoàn tác 1 ${targetItem.product.name}. Còn lại ${newQty} món.`
        );
      } else {
        updated.splice(targetIndex, 1);
        soundService.speakVietnamese(`Đã xóa món ${targetItem.product.name} khỏi giỏ.`);
      }
      return updated;
    });

    // Nếu đang ở màn hình chờ thanh toán, hủy giám sát và chuyển về scanning để cập nhật lại
    if (checkoutStatus === 'AWAITING_PAYMENT') {
      paymentWebhookService.stopMonitoring();
      setCheckoutStatus('SCANNING');
      setActiveOrderCode('');
    }
  };

  const addToCart = (product: Product) => {
    soundService.playBarcodeBeep();
    setLastScannedProductId(product.id);
    if (checkoutStatus === 'AWAITING_PAYMENT') {
      paymentWebhookService.stopMonitoring();
      setCheckoutStatus('SCANNING');
      setActiveOrderCode('');
    }

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((item) => item.product.id === product.id);
      if (existingIndex >= 0) {
        const updated = [...prevCart];
        const newQty = updated[existingIndex].quantity + 1;
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
          subtotal: newQty * product.retailPrice,
        };
        return updated;
      } else {
        return [
          ...prevCart,
          {
            product,
            quantity: 1,
            subtotal: product.retailPrice,
          },
        ];
      }
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prevCart) => {
      return prevCart
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            return {
              ...item,
              quantity: newQty,
              subtotal: newQty * item.product.retailPrice,
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    paymentWebhookService.stopMonitoring();
    setCart([]);
    setDiscountAmount(0);
    setCheckoutStatus('SCANNING');
    setActiveOrderCode('');
    setLastScannedProductId(null);
    dualScreenSync.clearCart();
    barcodeInputRef.current?.focus();
  };

  // -------------------------------------------------------------
  // THANH TOÁN TIỀN MẶT TẠI QUẦY
  // -------------------------------------------------------------
  const handleCashPayment = () => {
    if (cart.length === 0) return;
    paymentWebhookService.stopMonitoring();

    const order: PosOrder = {
      id: 'order-' + Date.now(),
      orderCode: activeOrderCode || 'POS' + Date.now().toString().slice(-6),
      cashierName: 'Thu Ngân Quầy',
      items: [...cart],
      totalAmount,
      discountAmount,
      finalAmount,
      paymentMethod: 'CASH',
      paymentStatus: 'PAID',
      transferContent: '',
      createdAt: new Date().toISOString(),
      paidAt: new Date().toISOString(),
    };

    storageService.savePosOrder(order);
    soundService.announceCashSuccess(finalAmount);
    confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    dualScreenSync.notifyPaymentSuccess('CASH', finalAmount, order.orderCode);
    setCheckoutStatus('COMPLETED');

    // In hóa đơn nhiệt
    printService.printThermalReceipt(order, settings);

    // Tự động clear giỏ hàng đón khách tiếp theo sau 2s
    setTimeout(() => {
      clearCart();
    }, 2000);
  };

  // -------------------------------------------------------------
  // TỰ ĐỘNG NHẬN TIỀN QUA WEBHOOK NGÂN HÀNG (VIETQR ĐỘNG)
  // -------------------------------------------------------------
  const handleWebhookPaymentSuccess = (tx: WebhookBankTransaction, orderCode: string) => {
    if (cart.length === 0) return;

    const order: PosOrder = {
      id: 'order-' + Date.now(),
      orderCode: orderCode || 'POS' + Date.now().toString().slice(-6),
      cashierName: 'VietQR Webhook Tự Động',
      items: [...cart],
      totalAmount,
      discountAmount,
      finalAmount,
      paymentMethod: 'VIETQR',
      paymentStatus: 'PAID',
      transferContent: tx.content || orderCode,
      createdAt: new Date().toISOString(),
      paidAt: tx.transactionDate || new Date().toISOString(),
    };

    storageService.savePosOrder(order);
    soundService.announceTransferSuccess(finalAmount);
    confetti({ particleCount: 110, spread: 80, origin: { y: 0.5 } });
    dualScreenSync.notifyPaymentSuccess('VIETQR', finalAmount, order.orderCode);
    setCheckoutStatus('COMPLETED');

    // In hóa đơn nhiệt tự động
    printService.printThermalReceipt(order, settings);

    // Tự động clear giỏ hàng đón khách tiếp theo sau khoảng delay cài đặt
    setTimeout(() => {
      clearCart();
    }, (settings.autoClearDelaySeconds || 3) * 1000);
  };

  // Lọc sản phẩm
  const filteredProducts = products.filter((p) => {
    const matchesCategory =
      selectedCategory === 'TatCa' || p.category === selectedCategory;
    const matchesQuery =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode.includes(searchQuery);
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="pos-layout">
      {/* CỘT TRÁI: DANH MỤC & LƯỚI SẢN PHẨM */}
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Ô quét Barcode & Tìm kiếm */}
        <div className="barcode-search-box">
          <Barcode size={22} color="var(--primary)" />
          <input
            ref={barcodeInputRef}
            type="text"
            placeholder="Quét mã vạch (Barcode súng quét) hoặc gõ tên... [Enter]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleScanBarcode(searchQuery);
              }
            }}
            autoFocus
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>
          )}
          <span className="barcode-badge">Súng Sẵn Sàng</span>
        </div>

        {/* Danh mục */}
        <div className="category-filter">
          <button
            className={`cat-pill ${selectedCategory === 'TatCa' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('TatCa')}
          >
            Tất Cả ({products.length})
          </button>
          <button
            className={`cat-pill ${selectedCategory === 'CheBien_FB' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('CheBien_FB')}
          >
            ☕ Chế Biến ({products.filter((p) => p.category === 'CheBien_FB').length})
          </button>
          <button
            className={`cat-pill ${selectedCategory === 'TapHoa' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('TapHoa')}
          >
            🛒 Tạp Hóa ({products.filter((p) => p.category === 'TapHoa').length})
          </button>
          <button
            className={`cat-pill ${selectedCategory === 'BaoBi' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('BaoBi')}
          >
            📦 Bao Bì ({products.filter((p) => p.category === 'BaoBi').length})
          </button>
          <button
            className={`cat-pill ${selectedCategory === 'VanPhongPham' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('VanPhongPham')}
          >
            📋 Văn Phòng Phẩm ({products.filter((p) => p.category === 'VanPhongPham').length})
          </button>
        </div>

        {/* Lưới sản phẩm */}
        <div className="products-grid">
          {filteredProducts.map((p) => (
            <div
              key={p.id}
              className="product-card"
              onClick={() => addToCart(p)}
              title={`Click để thêm ${p.name}`}
            >
              {p.imageUrl && (
                <div style={{ position: 'relative', width: '100%', height: '90px', overflow: 'hidden' }}>
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                      transition: 'transform 0.25s ease',
                    }}
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  {p.shelfCode && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        background: 'rgba(0, 0, 0, 0.75)',
                        backdropFilter: 'blur(4px)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        color: '#38bdf8',
                        border: '1px solid rgba(56, 189, 248, 0.4)',
                      }}
                    >
                      📍 {p.shelfCode}
                    </div>
                  )}
                  {p.isPrepared && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '4px',
                        left: '4px',
                        background: 'rgba(245, 158, 11, 0.85)',
                        padding: '1px 5px',
                        borderRadius: '3px',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        color: '#000',
                      }}
                    >
                      ☕ Pha Chế
                    </div>
                  )}
                </div>
              )}

              <div style={{ padding: '8px 10px 10px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                <div className="product-name">{p.name}</div>
                <div style={{ marginTop: '4px' }}>
                  <div className="product-price">
                    {new Intl.NumberFormat('vi-VN').format(p.retailPrice)}đ
                  </div>
                  <div className="product-stock" style={{ marginTop: '2px' }}>
                    {p.isPrepared ? 'Sẵn sàng' : `Tồn: ${p.stockQuantity} ${p.unit}`}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CỘT PHẢI: GIỎ HÀNG THU NGÂN */}
      <div className="cart-panel">
        <div className="cart-header">
          <div className="cart-title">Giỏ Hàng Quầy</div>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#f87171',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer',
              }}
            >
              <Trash2 size={14} /> Xóa
            </button>
          )}
        </div>

        {/* Danh sách món trong giỏ */}
        <div className="cart-items-list">
          {cart.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: 'var(--text-muted)',
                gap: '8px',
              }}
            >
              <Barcode size={38} strokeWidth={1.5} />
              <p style={{ fontSize: '0.88rem' }}>Giỏ hàng đang trống</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.product.id} className="cart-item">
                {item.product.imageUrl && (
                  <img
                    src={item.product.imageUrl}
                    alt={item.product.name}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '6px',
                      objectFit: 'cover',
                      marginRight: '8px',
                      border: '1px solid var(--border-color)',
                      flexShrink: 0,
                    }}
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="cart-item-name" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.product.name}
                  </div>
                  <div className="cart-item-price">
                    {new Intl.NumberFormat('vi-VN').format(item.product.retailPrice)}đ / {item.product.unit}
                  </div>
                </div>

                <div className="cart-item-qty">
                  <button className="qty-btn" onClick={() => updateQuantity(item.product.id, -1)}>
                    <Minus size={12} />
                  </button>
                  <span className="qty-val">{item.quantity}</span>
                  <button className="qty-btn" onClick={() => updateQuantity(item.product.id, 1)}>
                    <Plus size={12} />
                  </button>
                </div>

                <div className="cart-item-total">
                  {new Intl.NumberFormat('vi-VN').format(item.subtotal)}đ
                </div>

                <button
                  onClick={() => removeFromCart(item.product.id)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    marginLeft: '6px',
                    cursor: 'pointer',
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Tổng tiền & Nút Tiền Mặt duy nhất */}
        <div className="cart-summary">
          <div className="summary-row">
            <span>Tiền hàng ({cart.reduce((s, i) => s + i.quantity, 0)} món):</span>
            <span style={{ fontFamily: 'var(--font-mono)' }}>
              {new Intl.NumberFormat('vi-VN').format(totalAmount)}đ
            </span>
          </div>

          <div className="summary-row" style={{ alignItems: 'center' }}>
            <span>Giảm giá:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <input
                type="number"
                value={discountAmount || ''}
                placeholder="0"
                onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)}
                style={{
                  width: '80px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  borderRadius: '4px',
                  padding: '2px 5px',
                  textAlign: 'right',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.85rem',
                }}
              />
              <span>đ</span>
            </div>
          </div>

          <div className="summary-row total">
            <span>TỔNG TIỀN:</span>
            <span className="total-price">
              {new Intl.NumberFormat('vi-VN').format(finalAmount)}đ
            </span>
          </div>

          {/* NÚT THANH TOÁN THU NGÂN */}
          <div className="checkout-actions" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {checkoutStatus === 'AWAITING_PAYMENT' && (
              <div
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: 'rgba(56, 189, 248, 0.12)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.82rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#38bdf8' }}>
                  <Loader2 size={15} className="spin" />
                  <span>Đang chờ chuyển VietQR (Webhook tự động)...</span>
                </div>
                <button
                  onClick={() => {
                    paymentWebhookService.stopMonitoring();
                    setCheckoutStatus('SCANNING');
                    setActiveOrderCode('');
                    dualScreenSync.setCheckoutStatus('SCANNING', finalAmount);
                  }}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-muted)',
                    borderRadius: '4px',
                    padding: '2px 8px',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                  }}
                  title="Hủy chờ thanh toán để quét thêm món"
                >
                  Quay lại
                </button>
              </div>
            )}

            <button
              className="btn btn-cash"
              onClick={handleCashPayment}
              disabled={cart.length === 0}
              title="Khách trả tiền mặt: In bill và xóa giỏ"
            >
              <DollarSign size={20} />
              <span>TIỀN MẶT</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
