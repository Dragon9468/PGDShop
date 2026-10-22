// ==============================================================================
// PGDShop - VietQR Dynamic Payment & Bank Transfer Reconciliation
// ==============================================================================

import { BankConfig } from '../types';

export const POPULAR_BANKS = [
  { id: 'MB', name: 'MBBank (Ngân hàng Quân Đội)', shortName: 'MB' },
  { id: 'VCB', name: 'Vietcombank (Ngoại Thương)', shortName: 'VCB' },
  { id: 'TCB', name: 'Techcombank (Kỹ Thương)', shortName: 'TCB' },
  { id: 'ACB', name: 'ACB (Á Châu)', shortName: 'ACB' },
  { id: 'ICB', name: 'VietinBank (Công Thương)', shortName: 'CTG' },
  { id: 'BIDV', name: 'BIDV (Đầu Tư & Phát Triển)', shortName: 'BIDV' },
  { id: 'TPB', name: 'TPBank (Tiên Phong)', shortName: 'TPB' },
  { id: 'VPB', name: 'VPBank (Việt Nam Thịnh Vượng)', shortName: 'VPB' },
];

export const DEFAULT_BANK_CONFIG: BankConfig = {
  bankId: 'MB',
  accountNo: '0988888888',
  accountName: 'NGUYEN VAN PHONG PGDSHOP',
  template: 'compact2',
};

class VietQRService {
  /**
   * Tạo link ảnh mã VietQR động theo chuẩn Napas 24/7
   */
  public generateDynamicQRUrl(
    config: BankConfig,
    amount: number,
    memo: string
  ): string {
    const bankId = config.bankId || 'MB';
    const accountNo = config.accountNo || '0988888888';
    const template = config.template || 'compact2';
    const safeAmount = Math.max(0, Math.round(amount));
    const safeMemo = encodeURIComponent(memo || 'PGDSHOP');
    const safeAccountName = encodeURIComponent(config.accountName || '');

    return `https://img.vietqr.io/image/${bankId}-${accountNo}-${template}.png?amount=${safeAmount}&addInfo=${safeMemo}&accountName=${safeAccountName}`;
  }

  /**
   * Tạo mã hóa đơn / nội dung chuyển khoản động duy nhất
   */
  public generateOrderCode(): string {
    const now = new Date();
    const dateStr = now.toISOString().slice(2, 10).replace(/-/g, '');
    const randNum = Math.floor(100 + Math.random() * 900);
    return `PGD${dateStr}-${randNum}`;
  }
}

export const vietqrService = new VietQRService();
