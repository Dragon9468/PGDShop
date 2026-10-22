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
  Printer,
  Sparkles,
  X,
  CreditCard,
  QrCode,
  Check,
} from 'lucide-react';
import { soundService } from '../services/soundService';
import { dualScreenSync, CheckoutStatus } from '../services/dualScreenSync';
import { printService } from '../services/printService';
import { storageService } from '../services/storageService';
import confetti from 'canvas-confetti';

interface PosViewProps {
  settings: AppSettings;
}

export const PosView: React.FC<PosViewProps> = ({ settings }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>('TatCa');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [isBarcodeStickerModalOpen, setIsBarcodeStickerModalOpen] = useState(false);
  const [checkoutStatus, setCheckoutStatus] = useState<CheckoutStatus>('SCANNING');
  const [lastScannedProductId, setLastScannedProductId] = useState<string | null>(null);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Khởi tạo
  useEffect(() => {
    setProducts(storageService.getProducts());

    // Lắng nghe khi khách tự quét sản phẩm trên màn hình phụ (CFD)
    const unsubscribe = dualScreenSync.subscribe((msg) => {
      if (msg.type === 'CUSTOMER_SCANNED_BARCODE' && msg.payload?.barcode) {
        handleScanBarcode(msg.payload.barcode);
      } else if (msg.type === 'CLEAR_CART') {
        setCart([]);
        setDiscountAmount(0);
        setCheckoutStatus('SCANNING');
      } else if (msg.type === 'SET_CHECKOUT_STATUS' && msg.payload?.checkoutStatus) {
        setCheckoutStatus(msg.payload.checkoutStatus);
      }
    });

    return () => unsubscribe();
  }, [products]);

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
      '',
      checkoutStatus
    );
  }, [cart, totalAmount, discountAmount, finalAmount, checkoutStatus]);

  // Xử lý quét barcode từ súng quét USB
  const handleScanBarcode = (barcode: string) => {
    const cleanCode = barcode.trim().toUpperCase();
    if (!cleanCode) return;

    // 1. Kiểm tra nếu quét mã tiện ích "THANHTOAN"
    if (cleanCode === 'THANHTOAN' || cleanCode === 'CHECKOUT') {
      if (cart.length === 0 || finalAmount <= 0) {
        soundService.speakVietnamese('Giỏ hàng trống. Vui lòng quét món hàng trước.');
        setSearchQuery('');
        return;
      }

      // Nếu đang quét dở -> Chuyển sang sinh QR động
      if (checkoutStatus === 'SCANNING') {
        setCheckoutStatus('AWAITING_PAYMENT');
        dualScreenSync.setCheckoutStatus('AWAITING_PAYMENT', finalAmount);
        soundService.playSuccessChime();
        soundService.speakVietnamese(
          `Tổng tiền là ${finalAmount.toLocaleString('vi-VN')} đồng. Mời quý khách quét mã VietQR để thanh toán.`
        );
      } 
      // Nếu đã sinh QR rồi và quét THANHTOAN lần nữa -> Xác nhận đã nhận tiền
      else if (checkoutStatus === 'AWAITING_PAYMENT') {
        handleTransferSuccessAuto();
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

    // Nếu đang ở màn hình chờ thanh toán, chuyển về scanning để cập nhật lại
    if (checkoutStatus === 'AWAITING_PAYMENT') {
      setCheckoutStatus('SCANNING');
    }
  };

  const addToCart = (product: Product) => {
    soundService.playBarcodeBeep();
    setLastScannedProductId(product.id);
    if (checkoutStatus === 'AWAITING_PAYMENT') {
      setCheckoutStatus('SCANNING');
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
    setCart([]);
    setDiscountAmount(0);
    setCheckoutStatus('SCANNING');
    setLastScannedProductId(null);
    dualScreenSync.clearCart();
    barcodeInputRef.current?.focus();
  };

  // -------------------------------------------------------------
  // THANH TOÁN TIỀN MẶT
  // -------------------------------------------------------------
  const handleCashPayment = () => {
    if (cart.length === 0) return;

    const order: PosOrder = {
      id: 'order-' + Date.now(),
      orderCode: 'POS' + Date.now().toString().slice(-6),
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
    dualScreenSync.notifyPaymentSuccess('CASH', finalAmount, '');

    // In hóa đơn nhiệt
    printService.printThermalReceipt(order, settings);

    // Tự động clear giỏ hàng đón khách tiếp theo sau 2s
    setTimeout(() => {
      clearCart();
    }, 2000);
  };

  // -------------------------------------------------------------
  // XỬ LÝ KHI KHÁCH / THU NGÂN QUÉT MÃ THANH TOÁN HOẶC CHUYỂN KHOẢN XONG
  // -------------------------------------------------------------
  const handleTransferSuccessAuto = () => {
    if (cart.length === 0) return;

    const order: PosOrder = {
      id: 'order-' + Date.now(),
      orderCode: 'POS' + Date.now().toString().slice(-6),
      cashierName: 'Tự Phục Vụ / Quầy',
      items: [...cart],
      totalAmount,
      discountAmount,
      finalAmount,
      paymentMethod: 'VIETQR',
      paymentStatus: 'PAID',
      transferContent: '',
      createdAt: new Date().toISOString(),
      paidAt: new Date().toISOString(),
    };

    storageService.savePosOrder(order);
    soundService.announceTransferSuccess(finalAmount);
    confetti({ particleCount: 110, spread: 80, origin: { y: 0.5 } });
    dualScreenSync.notifyPaymentSuccess('VIETQR', finalAmount, '');

    // Tự động clear sau 3s
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
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
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
            🧾 Vật Tư ({products.filter((p) => p.category === 'VanPhongPham').length})
          </button>
        </div>

        {/* Lưới sản phẩm */}
        <div className="products-grid">
          {filteredProducts.map((p) => (
            <div
              key={p.id}
              className="product-card"
              onClick={() => addToCart(p)}
              title={`Mã: ${p.barcode}`}
            >
              {p.isPrepared ? (
                <span className="product-tag fb">☕ Pha Chế</span>
              ) : p.shelfCode ? (
                <span className="product-tag shelf">📍 {p.shelfCode}</span>
              ) : null}

              <div className="product-name">{p.name}</div>

              <div>
                <div className="product-price">
                  {new Intl.NumberFormat('vi-VN').format(p.retailPrice)}đ
                </div>
                <div className="product-stock">
                  {p.isPrepared ? (
                    <span style={{ color: 'var(--primary)' }}>Sẵn sàng</span>
                  ) : (
                    <span>Tồn: {p.stockQuantity} {p.unit}</span>
                  )}
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
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setIsBarcodeStickerModalOpen(true)}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid var(--border-color)',
                color: 'var(--primary)',
                fontSize: '0.75rem',
                padding: '4px 8px',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
              title="In mã vạch dán quầy: THANHTOAN và XOA"
            >
              <Barcode size={13} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
              2 Mã Tiện Ích
            </button>

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
                gap: '6px',
              }}
            >
              <Barcode size={38} strokeWidth={1.5} />
              <p style={{ fontSize: '0.88rem' }}>Giỏ hàng đang trống</p>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Bóp cò súng quét mã vạch sản phẩm
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.product.id} className="cart-item">
                <div style={{ flex: 1 }}>
                  <div className="cart-item-name">{item.product.name}</div>
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
                  color: '#fff',
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
            {checkoutStatus === 'SCANNING' ? (
              <button
                className="btn btn-primary"
                onClick={() => {
                  if (cart.length === 0 || finalAmount <= 0) return;
                  setCheckoutStatus('AWAITING_PAYMENT');
                  dualScreenSync.setCheckoutStatus('AWAITING_PAYMENT', finalAmount);
                  soundService.playSuccessChime();
                  soundService.speakVietnamese(
                    `Tổng tiền là ${finalAmount.toLocaleString('vi-VN')} đồng. Mời quý khách quét mã VietQR để thanh toán.`
                  );
                }}
                disabled={cart.length === 0}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
                title="Khách quét xong đồ -> Bấm để sinh mã VietQR động đúng số tiền"
              >
                <QrCode size={18} />
                <span>SINH VIETQR ĐỘNG (THANHTOAN)</span>
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  className="btn btn-primary"
                  onClick={handleTransferSuccessAuto}
                  disabled={cart.length === 0}
                  style={{
                    flex: 1,
                    padding: '12px',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '0 0 15px var(--primary)',
                  }}
                  title="Xác nhận tiền đã vào tài khoản và hoàn tất đơn"
                >
                  <Check size={18} />
                  <span>XÁC NHẬN ĐÃ NHẬN TIỀN</span>
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setCheckoutStatus('SCANNING');
                    dualScreenSync.setCheckoutStatus('SCANNING', finalAmount);
                  }}
                  style={{ padding: '0 12px', fontSize: '0.8rem' }}
                  title="Quay lại thêm/sửa món"
                >
                  Quét thêm
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

          <div style={{ marginTop: '8px', fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center' }}>
            {checkoutStatus === 'SCANNING' ? (
              <>💡 Quét đồ xong → Quét <b>THANHTOAN</b> để sinh QR. Quét <b>XOA</b> để hoàn tác 1 món.</>
            ) : (
              <span style={{ color: 'var(--primary)', fontWeight: 600 }}>
                ⚡ Đang chờ khách quét VietQR trên màn ngoài. Quét lại <b>THANHTOAN</b> khi tiền về!
              </span>
            )}
          </div>
        </div>
      </div>

      {/* MODAL IN 2 MÃ VẠCH TIỆN ÍCH DÁN QUẦY */}
      {isBarcodeStickerModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ textAlign: 'center', maxWidth: '420px' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>2 Mã Vạch Tiện Ích Dán Quầy</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Dán 2 mã vạch này tại quầy thu ngân hoặc cạnh màn hình phụ để khách/thu ngân quét bóp cò nhanh:
            </p>

            <div style={{ background: '#fff', color: '#000', padding: '16px', borderRadius: '10px', marginBottom: '12px' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#059669', marginBottom: '4px' }}>
                1. MÃ THANH TOÁN / SINH VIETQR ĐỘNG
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '6px' }}>
                Lần 1: Sinh mã VietQR đúng số tiền. Lần 2: Xác nhận hoàn tất đơn.
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '2rem', letterSpacing: '4px', fontWeight: 800 }}>
                |||| | ||||| ||| |||
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1.1rem' }}>
                THANHTOAN
              </div>
            </div>

            <div style={{ background: '#fff', color: '#000', padding: '16px', borderRadius: '10px', marginBottom: '16px' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#dc2626', marginBottom: '4px' }}>
                2. MÃ HOÀN TÁC / GIẢM 1 MÓN LỠ QUÉT
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '6px' }}>
                Quét để giảm 1 số lượng món vừa bóp cò nhầm (ví dụ mua 1 nhưng scan 2 lần).
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '2rem', letterSpacing: '4px', fontWeight: 800 }}>
                ||| |||| | ||| ||||
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1.1rem' }}>
                XOA
              </div>
            </div>

            <button
              className="btn btn-primary"
              style={{ width: '100%' }}
              onClick={() => window.print()}
            >
              <Printer size={16} />
              <span>In Ngay Tem Dán Này</span>
            </button>

            <button
              className="btn btn-secondary"
              style={{ width: '100%', marginTop: '8px' }}
              onClick={() => setIsBarcodeStickerModalOpen(false)}
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
