import React, { useState, useEffect, useRef } from 'react';
import {
  Product,
  CartItem,
  PosOrder,
  ProductCategory,
  AppSettings,
} from '../types';
import {
  Search,
  Barcode,
  Trash2,
  Plus,
  Minus,
  QrCode,
  DollarSign,
  Printer,
  Sparkles,
  CheckCircle,
  X,
  CreditCard,
} from 'lucide-react';
import { soundService } from '../services/soundService';
import { dualScreenSync } from '../services/dualScreenSync';
import { vietqrService } from '../services/vietqrService';
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
  const [currentOrderCode, setCurrentOrderCode] = useState(vietqrService.generateOrderCode());

  // Modal QR & Thanh toán
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isPaidSuccess, setIsPaidSuccess] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Khởi tạo sản phẩm & lắng nghe sự kiện đồng bộ 2 màn hình
  useEffect(() => {
    setProducts(storageService.getProducts());

    // Lắng nghe khi khách tự quét sản phẩm trên màn hình phụ (CFD)
    const unsubscribe = dualScreenSync.subscribe((msg) => {
      if (msg.type === 'CUSTOMER_SCANNED_BARCODE' && msg.payload?.barcode) {
        handleScanBarcode(msg.payload.barcode);
      }
    });

    return () => unsubscribe();
  }, []);

  // Tính toán tổng tiền
  const totalAmount = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const finalAmount = Math.max(0, totalAmount - discountAmount);

  // Tự động đồng bộ giỏ hàng sang màn hình khách hàng (CFD)
  useEffect(() => {
    dualScreenSync.syncCartToCustomerDisplay(
      cart,
      totalAmount,
      discountAmount,
      finalAmount,
      currentOrderCode
    );
  }, [cart, totalAmount, discountAmount, finalAmount, currentOrderCode]);

  // Bắt sự kiện quét barcode từ máy quét súng USB
  const handleScanBarcode = (barcode: string) => {
    const cleanCode = barcode.trim();
    if (!cleanCode) return;

    const matchedProduct = products.find(
      (p) => p.barcode.toLowerCase() === cleanCode.toLowerCase()
    );

    if (matchedProduct) {
      soundService.playBarcodeBeep();
      addToCart(matchedProduct);
      setSearchQuery('');
    } else {
      alert(`⚠️ Không tìm thấy sản phẩm có mã barcode: ${cleanCode}`);
    }
  };

  // Thêm sản phẩm vào giỏ hàng
  const addToCart = (product: Product) => {
    soundService.playBarcodeBeep();
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

  const clearCartForNextCustomer = () => {
    setCart([]);
    setDiscountAmount(0);
    setCurrentOrderCode(vietqrService.generateOrderCode());
    setIsPaidSuccess(false);
    setIsQrModalOpen(false);
    setCountdown(null);
    dualScreenSync.clearCart();
    barcodeInputRef.current?.focus();
  };

  // -------------------------------------------------------------
  // XỬ LÝ THANH TOÁN TIỀN MẶT
  // -------------------------------------------------------------
  const handleCashPayment = () => {
    if (cart.length === 0) {
      alert('Giỏ hàng đang trống!');
      return;
    }

    const order: PosOrder = {
      id: 'order-' + Date.now(),
      orderCode: currentOrderCode,
      cashierName: 'Thu Ngân Quầy',
      items: [...cart],
      totalAmount,
      discountAmount,
      finalAmount,
      paymentMethod: 'CASH',
      paymentStatus: 'PAID',
      transferContent: currentOrderCode,
      createdAt: new Date().toISOString(),
      paidAt: new Date().toISOString(),
    };

    // 1. Lưu đơn hàng
    storageService.savePosOrder(order);

    // 2. Phát âm thanh giọng nói qua loa Bluetooth
    soundService.announceCashSuccess(finalAmount);

    // 3. Pháo hoa & đồng bộ báo hoàn thành sang màn hình phụ
    confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    dualScreenSync.notifyPaymentSuccess('CASH', finalAmount, currentOrderCode);

    // 4. In bill nhiệt tại quầy
    printService.printThermalReceipt(order, settings);

    // 5. Tự động reset giỏ hàng đón khách tiếp theo sau 2 giây
    setTimeout(() => {
      clearCartForNextCustomer();
    }, 2000);
  };

  // -------------------------------------------------------------
  // XỬ LÝ THANH TOÁN CHUYỂN KHOẢN VIETQR
  // -------------------------------------------------------------
  const handleOpenVietQR = () => {
    if (cart.length === 0) {
      alert('Giỏ hàng đang trống!');
      return;
    }
    setIsQrModalOpen(true);
  };

  // Giả lập hoặc nhận thông báo ngân hàng chuyển tiền thành công
  const handleConfirmTransferSuccess = () => {
    setIsPaidSuccess(true);

    const order: PosOrder = {
      id: 'order-' + Date.now(),
      orderCode: currentOrderCode,
      cashierName: 'Thu Ngân Quầy',
      items: [...cart],
      totalAmount,
      discountAmount,
      finalAmount,
      paymentMethod: 'VIETQR',
      paymentStatus: 'PAID',
      transferContent: currentOrderCode,
      createdAt: new Date().toISOString(),
      paidAt: new Date().toISOString(),
    };

    // Lưu vào database
    storageService.savePosOrder(order);

    // Phát âm thanh loa Bluetooth
    soundService.announceTransferSuccess(finalAmount);

    // Bắn pháo hoa ăn mừng
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });

    // Thông báo tức thì sang màn hình khách
    dualScreenSync.notifyPaymentSuccess('VIETQR', finalAmount, currentOrderCode);

    // Đếm ngược 3 giây rồi tự động clear giỏ hàng
    let secondsLeft = settings.autoClearDelaySeconds || 3;
    setCountdown(secondsLeft);
    const timer = setInterval(() => {
      secondsLeft -= 1;
      setCountdown(secondsLeft);
      if (secondsLeft <= 0) {
        clearInterval(timer);
        clearCartForNextCustomer();
      }
    }, 1000);
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

  const dynamicQrUrl = vietqrService.generateDynamicQRUrl(
    settings.bankConfig,
    finalAmount,
    currentOrderCode
  );

  return (
    <div className="pos-layout">
      {/* CỘT TRÁI: DANH MỤC & LƯỚI SẢN PHẨM */}
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Thanh quét Barcode & Tìm kiếm */}
        <div className="barcode-search-box">
          <Barcode size={22} color="#38bdf8" />
          <input
            ref={barcodeInputRef}
            type="text"
            placeholder="Quét mã vạch (Barcode súng quét) hoặc gõ tên sản phẩm... [Nhấn Enter]"
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
              style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
            >
              <X size={18} />
            </button>
          )}
          <span className="barcode-badge">Súng Barcode Sẵn Sàng</span>
        </div>

        {/* Bộ lọc danh mục */}
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
            ☕ Chế Biến F&B ({products.filter((p) => p.category === 'CheBien_FB').length})
          </button>
          <button
            className={`cat-pill ${selectedCategory === 'TapHoa' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('TapHoa')}
          >
            🛒 Tạp Hóa / Bán Lẻ ({products.filter((p) => p.category === 'TapHoa').length})
          </button>
          <button
            className={`cat-pill ${selectedCategory === 'BaoBi' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('BaoBi')}
          >
            📦 Bao Bì Ly Túi ({products.filter((p) => p.category === 'BaoBi').length})
          </button>
          <button
            className={`cat-pill ${selectedCategory === 'VanPhongPham' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('VanPhongPham')}
          >
            🧾 Vật Tư & Giấy In ({products.filter((p) => p.category === 'VanPhongPham').length})
          </button>
        </div>

        {/* Lưới sản phẩm */}
        <div className="products-grid">
          {filteredProducts.map((p) => (
            <div
              key={p.id}
              className="product-card"
              onClick={() => addToCart(p)}
              title={`Bấm để thêm vào giỏ hàng | Mã: ${p.barcode}`}
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
                    <span style={{ color: '#10b981' }}>Sẵn sàng pha chế</span>
                  ) : (
                    <span>Tồn kho: {p.stockQuantity} {p.unit}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CỘT PHẢI: GIỎ HÀNG THU NGÂN (CART) */}
      <div className="cart-panel">
        <div className="cart-header">
          <div className="cart-title">
            <span>Giỏ Hàng Quầy</span>
            <span
              style={{
                fontSize: '0.8rem',
                color: '#38bdf8',
                fontFamily: 'var(--font-mono)',
                background: 'rgba(56, 189, 248, 0.1)',
                padding: '2px 6px',
                borderRadius: '4px',
              }}
            >
              {currentOrderCode}
            </span>
          </div>
          {cart.length > 0 && (
            <button
              onClick={() => setCart([])}
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
              <Trash2 size={14} /> Xóa hết
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
                color: '#64748b',
                gap: '8px',
              }}
            >
              <Barcode size={42} strokeWidth={1.5} />
              <p style={{ fontSize: '0.9rem' }}>Chưa có món nào trong giỏ</p>
              <p style={{ fontSize: '0.8rem', textAlign: 'center' }}>
                Quét mã barcode hoặc nhấn chọn sản phẩm ở bảng bên trái
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.product.id} className="cart-item">
                <div className="cart-item-info">
                  <div className="cart-item-name">{item.product.name}</div>
                  <div className="cart-item-price">
                    {new Intl.NumberFormat('vi-VN').format(item.product.retailPrice)}đ / {item.product.unit}
                  </div>
                </div>

                <div className="cart-item-qty">
                  <button className="qty-btn" onClick={() => updateQuantity(item.product.id, -1)}>
                    <Minus size={13} />
                  </button>
                  <span className="qty-val">{item.quantity}</span>
                  <button className="qty-btn" onClick={() => updateQuantity(item.product.id, 1)}>
                    <Plus size={13} />
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
                    color: '#64748b',
                    marginLeft: '8px',
                    cursor: 'pointer',
                  }}
                  title="Xóa món"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Tổng thanh toán & Chiết khấu */}
        <div className="cart-summary">
          <div className="summary-row">
            <span>Tiền hàng ({cart.reduce((s, i) => s + i.quantity, 0)} món):</span>
            <span style={{ fontFamily: 'var(--font-mono)' }}>
              {new Intl.NumberFormat('vi-VN').format(totalAmount)}đ
            </span>
          </div>

          <div className="summary-row" style={{ alignItems: 'center' }}>
            <span>Giảm giá / Voucher:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <input
                type="number"
                value={discountAmount || ''}
                placeholder="0"
                onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)}
                style={{
                  width: '90px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid var(--border-color)',
                  color: '#fff',
                  borderRadius: '4px',
                  padding: '2px 6px',
                  textAlign: 'right',
                  fontFamily: 'var(--font-mono)',
                }}
              />
              <span>đ</span>
            </div>
          </div>

          <div className="summary-row total">
            <span>KHÁCH PHẢI TRẢ:</span>
            <span className="total-price">
              {new Intl.NumberFormat('vi-VN').format(finalAmount)}đ
            </span>
          </div>

          {/* Nút hành động thanh toán */}
          <div className="checkout-actions">
            {/* Nút thanh toán Tiền Mặt theo yêu cầu đặc biệt */}
            <button
              className="btn btn-cash"
              onClick={handleCashPayment}
              disabled={cart.length === 0}
              title="Khách trả tiền mặt: In bill và xóa giỏ đón khách tiếp theo"
            >
              <DollarSign size={20} />
              <span>TIỀN MẶT</span>
            </button>

            {/* Nút thanh toán VietQR Động */}
            <button
              className="btn btn-primary"
              style={{ fontSize: '1.05rem', padding: '14px 20px' }}
              onClick={handleOpenVietQR}
              disabled={cart.length === 0}
              title="Mở mã QR động cho khách quét thanh toán chuyển khoản"
            >
              <QrCode size={20} />
              <span>VIETQR ĐỘNG</span>
            </button>
          </div>

          {/* In thử hóa đơn nhiệt */}
          <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
            <button
              className="btn btn-secondary"
              style={{ flex: 1, fontSize: '0.8rem', padding: '6px' }}
              disabled={cart.length === 0}
              onClick={() => {
                const sampleOrder: PosOrder = {
                  id: 'preview',
                  orderCode: currentOrderCode,
                  cashierName: 'Thu Ngân 1',
                  items: cart,
                  totalAmount,
                  discountAmount,
                  finalAmount,
                  paymentMethod: 'CASH',
                  paymentStatus: 'PAID',
                  transferContent: currentOrderCode,
                  createdAt: new Date().toISOString(),
                };
                printService.printThermalReceipt(sampleOrder, settings);
              }}
            >
              <Printer size={14} /> In phiếu tạm tính (K80)
            </button>
          </div>
        </div>
      </div>

      {/* MODAL VIETQR ĐỘNG & ĐỐI SOÁT TỰ ĐỘNG */}
      {isQrModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
                <QrCode size={20} color="#38bdf8" />
                <span>Thanh Toán Chuyển Khoản VietQR Động</span>
              </div>
              <button
                onClick={() => setIsQrModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {isPaidSuccess ? (
              <div style={{ padding: '24px 0' }}>
                <CheckCircle size={68} color="#10b981" style={{ margin: '0 auto 16px' }} />
                <h2 style={{ color: '#10b981', marginBottom: '8px' }}>ĐÃ NHẬN TIỀN THÀNH CÔNG!</h2>
                <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
                  Hệ thống đã nhận {new Intl.NumberFormat('vi-VN').format(finalAmount)}đ từ tài khoản ngân hàng.
                </p>
                <div style={{ marginTop: '16px', color: '#38bdf8', fontSize: '0.88rem' }}>
                  Loa Bluetooth đã phát thông báo giọng nói.
                </div>
                {countdown !== null && (
                  <div style={{ marginTop: '12px', fontSize: '0.85rem', color: '#64748b' }}>
                    Tự động xóa giỏ hàng sau: <b>{countdown}s</b>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <p style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '8px' }}>
                  Màn hình phụ hướng ra khách hàng cũng đang hiển thị mã QR này đồng bộ!
                </p>

                {/* Khung hiển thị ảnh VietQR */}
                <div className="vietqr-image-box" style={{ margin: '8px auto' }}>
                  <img src={dynamicQrUrl} alt="VietQR Động Napas 247" />
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '10px', borderRadius: '8px', margin: '12px 0', fontSize: '0.88rem' }}>
                  <div>Số tiền: <b style={{ color: '#10b981', fontSize: '1.1rem' }}>{new Intl.NumberFormat('vi-VN').format(finalAmount)}đ</b></div>
                  <div>Nội dung CK: <b style={{ color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>{currentOrderCode}</b></div>
                  <div>Ngân hàng: <b>{settings.bankConfig.bankId} - {settings.bankConfig.accountNo}</b> ({settings.bankConfig.accountName})</div>
                </div>

                {/* Nút giả lập nhận tiền webhook ngân hàng */}
                <button
                  className="btn btn-success"
                  style={{ width: '100%', marginTop: '8px' }}
                  onClick={handleConfirmTransferSuccess}
                >
                  <Sparkles size={18} />
                  <span>Xác nhận Tiền Đã Vào Tài Khoản (Loa đọc & Xóa Giỏ)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
