// ==============================================================================
// PGDShop - Dual Screen Sync Engine (Cashier Screen <-> Customer-Facing Display)
// ==============================================================================

import { CartItem } from '../types';

export type CheckoutStatus = 'SCANNING' | 'AWAITING_PAYMENT' | 'COMPLETED';

export interface DualScreenMessage {
  type: 
    | 'SYNC_CART' 
    | 'SET_CHECKOUT_STATUS'
    | 'SET_CUSTOMER_THEME'
    | 'PAYMENT_COMPLETED' 
    | 'CLEAR_CART' 
    | 'CUSTOMER_SCANNED_BARCODE'
    | 'PING'
    | 'PONG';
  payload?: {
    items?: CartItem[];
    totalAmount?: number;
    discountAmount?: number;
    finalAmount?: number;
    orderCode?: string;
    barcode?: string;
    paymentMethod?: 'CASH' | 'VIETQR';
    paidAmount?: number;
    checkoutStatus?: CheckoutStatus;
    customerTheme?: string;
  };
}

class DualScreenSyncService {
  private channel: BroadcastChannel | null = null;
  private listeners: ((message: DualScreenMessage) => void)[] = [];

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel('pgd_pos_dual_screen_sync');
        this.channel.onmessage = (event) => {
          this.handleIncomingMessage(event.data);
        };
      } catch (e) {
        console.warn('BroadcastChannel not supported or error:', e);
      }
    }

    // Lắng nghe qua localStorage storage event để dự phòng nếu browser cũ
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (event) => {
        if (event.key === 'pgd_dual_screen_event' && event.newValue) {
          try {
            const data: DualScreenMessage = JSON.parse(event.newValue);
            this.handleIncomingMessage(data);
          } catch (err) {
            console.error('Storage sync error:', err);
          }
        }
      });
    }
  }

  private handleIncomingMessage(msg: DualScreenMessage) {
    this.listeners.forEach((listener) => {
      try {
        listener(msg);
      } catch (err) {
        console.error('Listener callback error:', err);
      }
    });
  }

  public subscribe(listener: (message: DualScreenMessage) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public broadcast(message: DualScreenMessage) {
    if (this.channel) {
      this.channel.postMessage(message);
    }
    // Fallback qua localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('pgd_dual_screen_event', JSON.stringify({ ...message, _t: Date.now() }));
      } catch (e) {
        // ignore
      }
    }
  }

  /**
   * Đồng bộ giỏ hàng và trạng thái thanh toán từ màn hình thu ngân sang màn hình khách
   */
  public syncCartToCustomerDisplay(
    items: CartItem[],
    totalAmount: number,
    discountAmount: number,
    finalAmount: number,
    orderCode: string,
    checkoutStatus: CheckoutStatus = 'SCANNING'
  ) {
    this.broadcast({
      type: 'SYNC_CART',
      payload: {
        items,
        totalAmount,
        discountAmount,
        finalAmount,
        orderCode,
        checkoutStatus,
      },
    });
  }

  /**
   * Cập nhật trạng thái sinh mã QR thanh toán
   */
  public setCheckoutStatus(checkoutStatus: CheckoutStatus, finalAmount: number) {
    this.broadcast({
      type: 'SET_CHECKOUT_STATUS',
      payload: {
        checkoutStatus,
        finalAmount,
      },
    });
  }

  /**
   * Khách tự quét mã tại màn hình của khách -> gửi mã về màn hình thu ngân
   */
  public customerScannedBarcode(barcode: string) {
    this.broadcast({
      type: 'CUSTOMER_SCANNED_BARCODE',
      payload: {
        barcode,
      },
    });
  }

  /**
   * Báo thanh toán thành công (Tự động hoặc Tiền mặt)
   */
  public notifyPaymentSuccess(paymentMethod: 'CASH' | 'VIETQR', paidAmount: number, orderCode: string) {
    this.broadcast({
      type: 'PAYMENT_COMPLETED',
      payload: {
        paymentMethod,
        paidAmount,
        orderCode,
        checkoutStatus: 'COMPLETED',
      },
    });
  }

  /**
   * Xóa giỏ hàng để đón khách tiếp theo
   */
  public clearCart() {
    this.broadcast({
      type: 'CLEAR_CART',
      payload: {
        checkoutStatus: 'SCANNING',
      },
    });
  }

  /**
   * Đồng bộ Theme riêng biệt cho Màn hình khách (CFD)
   */
  public syncCustomerTheme(customerTheme: string) {
    this.broadcast({
      type: 'SET_CUSTOMER_THEME',
      payload: {
        customerTheme,
      },
    });
  }

  /**
   * Mở cửa sổ Màn hình hướng ra khách (Customer Facing Display) trên màn hình phụ
   */
  /**
   * Mở cửa sổ Màn hình hướng ra khách (Customer Facing Display) trên màn hình phụ (hỗ trợ nhiều trạm Station 1, 2, 3...)
   */
  public openCustomerDisplayWindow(stationId: number | string = 1) {
    if (typeof window === 'undefined') return;
    const url = `${window.location.origin}/#/customer-display?station=${stationId}`;
    // Mở popup với tên window riêng biệt theo trạm để Windows không bị ghi đè
    const windowName = `PGDShopCustomerDisplay_Station_${stationId}`;
    const features = 'menubar=no,location=no,resizable=yes,scrollbars=yes,status=no,width=1280,height=800';
    const newWindow = window.open(url, windowName, features);
    if (newWindow) {
      newWindow.focus();
    }
  }
}

export const dualScreenSync = new DualScreenSyncService();
