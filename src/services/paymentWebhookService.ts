// ==============================================================================
// PGDShop - Automated Payment Webhook Listener & Bank Transaction Reconciler
// ==============================================================================

import { storageService } from './storageService';

export interface WebhookBankTransaction {
  id?: string | number;
  gateway?: string;          // 'MBBank' | 'Vietcombank' | 'Techcombank' | 'ACB' | 'SePay' | 'Casso' | 'PayOS'
  accountNumber?: string;
  amount: number;
  content: string;           // Nội dung chuyển khoản (chứa mã đơn hàng dynamic, ví dụ "PGD261022-123")
  orderCode?: string;        // Mã đơn hàng nếu cổng đã bóc tách
  referenceCode?: string;    // Mã FT / Ref ngân hàng
  transactionDate?: string;
}

type PaymentMatchedCallback = (tx: WebhookBankTransaction) => void;

class PaymentWebhookService {
  private activePendingOrder: {
    orderCode: string;
    amount: number;
    callback: PaymentMatchedCallback;
  } | null = null;

  private broadcastChannel: BroadcastChannel | null = null;
  private supabaseSubscription: any = null;
  private isListening: boolean = false;

  constructor() {
    this.initBroadcastChannel();
    this.initWindowListener();
  }

  private initBroadcastChannel() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel('pgd_payment_webhook_channel');
        this.broadcastChannel.onmessage = (event) => {
          if (event.data && event.data.type === 'INCOMING_BANK_WEBHOOK') {
            this.handleIncomingTransaction(event.data.payload);
          }
        };
      } catch (err) {
        console.warn('BroadcastChannel payment webhook error:', err);
      }
    }
  }

  private initWindowListener() {
    if (typeof window !== 'undefined') {
      // Cho phép bắt webhook qua window CustomEvent hoặc postMessage từ API / iframe / script
      window.addEventListener('pgd_payment_webhook', ((e: CustomEvent<WebhookBankTransaction>) => {
        if (e.detail) {
          this.handleIncomingTransaction(e.detail);
        }
      }) as EventListener);

      window.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'PGD_BANK_WEBHOOK_EVENT') {
          this.handleIncomingTransaction(event.data.payload);
        }
      });
    }
  }

  /**
   * Bắt đầu giám sát Webhook tự động cho đơn hàng hiện tại
   */
  public startMonitoring(
    orderCode: string,
    amount: number,
    onMatched: PaymentMatchedCallback
  ) {
    this.activePendingOrder = {
      orderCode: orderCode.trim().toUpperCase(),
      amount: Math.round(amount),
      callback: onMatched,
    };
    this.isListening = true;

    console.log(`[WebhookService] ⚡ Đang chờ Webhook ngân hàng cho đơn: ${orderCode} - Số tiền: ${amount}đ`);

    // Kích hoạt lắng nghe Supabase Realtime nếu đã kết nối
    this.subscribeSupabaseRealtime();
  }

  /**
   * Dừng giám sát (khi đơn hàng đã hoàn tất hoặc bị hủy)
   */
  public stopMonitoring() {
    this.activePendingOrder = null;
    this.isListening = false;
    if (this.supabaseSubscription) {
      try {
        this.supabaseSubscription.unsubscribe();
      } catch (e) {
        // ignore
      }
      this.supabaseSubscription = null;
    }
  }

  /**
   * Xử lý giao dịch ngân hàng chuyển khoản vừa nhận được từ Webhook
   */
  public handleIncomingTransaction(tx: WebhookBankTransaction): boolean {
    if (!this.activePendingOrder || !this.isListening) {
      return false;
    }

    const { orderCode, amount, callback } = this.activePendingOrder;
    const content = (tx.content || '').toUpperCase();
    const txOrderCode = (tx.orderCode || '').toUpperCase();

    // Làm sạch ký tự đặc biệt để so khớp chính xác: "PGD-261022-123" -> "PGD261022123"
    const cleanPendingCode = orderCode.replace(/[^A-Z0-9]/g, '');
    const cleanContent = content.replace(/[^A-Z0-9]/g, '');

    const isCodeMatched = 
      cleanContent.includes(cleanPendingCode) || 
      txOrderCode === orderCode ||
      cleanContent.includes(cleanPendingCode.slice(-6)); // Khớp ít nhất 6 số đuôi mã đơn

    const isAmountMatched = tx.amount >= amount;

    if (isCodeMatched && isAmountMatched) {
      console.log(`[WebhookService] 🎯 KHỚP WEBHOOK THÀNH CÔNG! Đơn: ${orderCode}, Số tiền: ${tx.amount}đ`);
      
      // Gọi callback tự động chốt đơn
      callback(tx);

      // Dừng giám sát đơn này
      this.stopMonitoring();
      return true;
    } else {
      console.log(`[WebhookService] Giao dịch không khớp đơn hiện tại:`, {
        orderCode,
        txContent: tx.content,
        isCodeMatched,
        isAmountMatched,
        expectedAmount: amount,
        receivedAmount: tx.amount,
      });
      return false;
    }
  }

  /**
   * Lắng nghe Supabase Realtime trên bảng bank_transactions
   */
  private subscribeSupabaseRealtime() {
    const supabase = storageService.getSupabaseClient();
    if (!supabase) return;

    try {
      this.supabaseSubscription = supabase
        .channel('realtime_bank_transactions')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'bank_transactions' },
          (payload: any) => {
            const row = payload.new;
            if (row) {
              this.handleIncomingTransaction({
                id: row.id,
                gateway: row.bank_code,
                amount: Number(row.amount),
                content: row.memo || '',
                orderCode: row.order_code_matched,
                referenceCode: row.transaction_id,
                transactionDate: row.created_at,
              });
            }
          }
        )
        .subscribe();
    } catch (err) {
      console.warn('Lỗi đăng ký Supabase realtime cho bank_transactions:', err);
    }
  }

  /**
   * Gửi dữ liệu Webhook từ bên ngoài (API, Test Tool, Giả lập nhận tiền từ ngân hàng)
   */
  public dispatchWebhook(tx: WebhookBankTransaction) {
    // 1. Phát qua BroadcastChannel cho tất cả các tab (màn cashier, màn CFD)
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        type: 'INCOMING_BANK_WEBHOOK',
        payload: tx,
      });
    }

    // 2. Xử lý trực tiếp trên tab hiện tại
    return this.handleIncomingTransaction(tx);
  }

  /**
   * Giả lập bắn Webhook Ngân Hàng báo có tiền (Dành cho việc kiểm thử tính năng tự động chốt đơn)
   */
  public simulateBankWebhook(orderCode?: string, amount?: number, bankName: string = 'MBBank') {
    const targetCode = orderCode || this.activePendingOrder?.orderCode || 'PGD-DEMO';
    const targetAmount = amount || this.activePendingOrder?.amount || 50000;

    const mockTransaction: WebhookBankTransaction = {
      id: 'tx-' + Date.now(),
      gateway: bankName,
      accountNumber: '0988888888',
      amount: targetAmount,
      content: `${targetCode} THANH TOAN TIEN HANG PGDSHOP`,
      orderCode: targetCode,
      referenceCode: 'FT' + Math.floor(10000000 + Math.random() * 90000000),
      transactionDate: new Date().toISOString(),
    };

    console.log(`[WebhookService] 🚀 Đang phát tín hiệu Webhook giả lập từ ${bankName}:`, mockTransaction);
    this.dispatchWebhook(mockTransaction);
  }

  public getActivePendingOrder() {
    return this.activePendingOrder;
  }
}

export const paymentWebhookService = new PaymentWebhookService();
