// ==============================================================================
// PGDShop - Thermal Bill & A4 VAT Red Invoice Printing Engine
// ==============================================================================

import { PosOrder, WholesaleInvoice, AppSettings } from '../types';

class PrintService {
  /**
   * In hóa đơn nhiệt K80 / K58 tại quầy thu ngân
   */
  public printThermalReceipt(order: PosOrder, settings: AppSettings) {
    const formattedDate = new Date(order.createdAt).toLocaleString('vi-VN');
    const itemsHtml = order.items
      .map(
        (item) => `
        <tr>
          <td style="text-align: left; padding: 3px 0;">
            <div style="font-weight: 600;">${item.product.name}</div>
            <div style="font-size: 11px; color: #555;">${item.quantity} ${item.product.unit} x ${new Intl.NumberFormat('vi-VN').format(item.product.retailPrice)}đ</div>
          </td>
          <td style="text-align: right; vertical-align: top; font-weight: 600; padding: 3px 0;">
            ${new Intl.NumberFormat('vi-VN').format(item.subtotal)}đ
          </td>
        </tr>
      `
      )
      .join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Hóa Đơn ${order.orderCode}</title>
        <style>
          @page { margin: 0; size: 80mm auto; }
          body {
            font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 8px 12px;
            width: 76mm;
            color: #000;
            font-size: 13px;
            line-height: 1.3;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .bold { font-weight: bold; }
          .divider { border-top: 1px dashed #000; margin: 8px 0; }
          .double-divider { border-top: 2px solid #000; margin: 8px 0; }
          table { width: 100%; border-collapse: collapse; }
          .total-row { font-size: 15px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="text-center">
          <h2 style="margin: 0; font-size: 18px; text-transform: uppercase;">${settings.storeName || 'PGDSHOP POS'}</h2>
          <div style="font-size: 11px; margin-top: 3px;">${settings.storeAddress || '123 Đường Bán Lẻ, TP.HCM'}</div>
          <div style="font-size: 11px;">Hotline: ${settings.storePhone || '0901 234 567'}</div>
        </div>

        <div class="divider"></div>

        <div style="font-size: 12px;">
          <div><b>Mã đơn:</b> ${order.orderCode}</div>
          <div><b>Ngày:</b> ${formattedDate}</div>
          <div><b>Thu ngân:</b> ${order.cashierName}</div>
          <div><b>HTTT:</b> ${order.paymentMethod === 'VIETQR' ? 'Chuyển khoản VietQR' : 'Tiền mặt'}</div>
        </div>

        <div class="divider"></div>

        <table>
          <thead>
            <tr style="border-bottom: 1px solid #000; font-size: 11px;">
              <th style="text-align: left; padding-bottom: 4px;">Mặt hàng</th>
              <th style="text-align: right; padding-bottom: 4px;">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="divider"></div>

        <table>
          <tr>
            <td>Cộng tiền hàng:</td>
            <td class="text-right">${new Intl.NumberFormat('vi-VN').format(order.totalAmount)}đ</td>
          </tr>
          ${
            order.discountAmount > 0
              ? `<tr>
                  <td>Giảm giá:</td>
                  <td class="text-right">-${new Intl.NumberFormat('vi-VN').format(order.discountAmount)}đ</td>
                </tr>`
              : ''
          }
          <tr class="total-row">
            <td style="padding-top: 4px;">TỔNG THANH TOÁN:</td>
            <td class="text-right" style="padding-top: 4px;">${new Intl.NumberFormat('vi-VN').format(order.finalAmount)}đ</td>
          </tr>
        </table>

        <div class="double-divider"></div>

        <div class="text-center" style="font-size: 11px; margin-top: 8px;">
          <div>Cảm ơn Quý Khách & Hẹn Gặp Lại!</div>
          <div style="font-style: italic; margin-top: 3px;">(Quý khách vui lòng kiểm tra hàng trước khi rời quầy)</div>
        </div>
      </body>
      </html>
    `;

    this.triggerBrowserPrint(htmlContent);
  }

  /**
   * In hóa đơn đỏ VAT khổ A4 cho khách bán sỉ
   */
  public printA4WholesaleInvoice(invoice: WholesaleInvoice, settings: AppSettings) {
    const formattedDate = new Date(invoice.createdAt).toLocaleDateString('vi-VN');
    const itemsHtml = invoice.items
      .map(
        (item, index) => `
        <tr>
          <td style="border: 1px solid #333; padding: 6px; text-align: center;">${index + 1}</td>
          <td style="border: 1px solid #333; padding: 6px;">${item.name}</td>
          <td style="border: 1px solid #333; padding: 6px; text-align: center;">${item.unit}</td>
          <td style="border: 1px solid #333; padding: 6px; text-align: right;">${item.quantity}</td>
          <td style="border: 1px solid #333; padding: 6px; text-align: right;">${new Intl.NumberFormat('vi-VN').format(item.unitPrice)}</td>
          <td style="border: 1px solid #333; padding: 6px; text-align: right;">${new Intl.NumberFormat('vi-VN').format(item.amount)}</td>
        </tr>
      `
      )
      .join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Hóa Đơn Đỏ VAT - ${invoice.invoiceNumber}</title>
        <style>
          @page { size: A4; margin: 15mm; }
          body {
            font-family: 'Times New Roman', serif;
            color: #000;
            line-height: 1.4;
            padding: 10px;
          }
          .title { font-size: 22px; font-weight: bold; text-align: center; color: #b91c1c; text-transform: uppercase; }
          .subtitle { font-size: 14px; text-align: center; font-style: italic; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th { border: 1px solid #333; padding: 8px; background: #f3f4f6; }
          .signature-box { margin-top: 40px; display: flex; justify-content: space-between; text-align: center; }
        </style>
      </head>
      <body>
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <div style="font-size: 16px; font-weight: bold; text-transform: uppercase;">${settings.storeName}</div>
            <div>MST: <b>${settings.storeTaxId || '0318992211'}</b></div>
            <div>Địa chỉ: ${settings.storeAddress}</div>
            <div>Điện thoại: ${settings.storePhone}</div>
          </div>
          <div style="text-align: right;">
            <div>Mẫu số: <b>01GTKT0/001</b></div>
            <div>Ký hiệu: <b>PG/26E</b></div>
            <div>Số HĐ: <b style="color: #b91c1c; font-size: 16px;">${invoice.invoiceNumber}</b></div>
          </div>
        </div>

        <div style="margin-top: 25px;">
          <div class="title">HÓA ĐƠN GIÁ TRỊ GIA TĂNG (VAT)</div>
          <div class="subtitle">Ngày ${formattedDate}</div>
        </div>

        <div style="margin-top: 20px; font-size: 14px;">
          <div>Đơn vị mua hàng: <b>${invoice.customerName}</b></div>
          <div>Mã số thuế: <b>${invoice.taxId}</b></div>
          <div>Địa chỉ: ${invoice.address}</div>
          <div>Hình thức thanh toán: <b>Chuyển khoản / Tiền mặt</b></div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 5%;">STT</th>
              <th style="width: 45%;">Tên hàng hóa, dịch vụ</th>
              <th style="width: 10%;">ĐVT</th>
              <th style="width: 10%;">Số lượng</th>
              <th style="width: 15%;">Đơn giá (VNĐ)</th>
              <th style="width: 15%;">Thành tiền (VNĐ)</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="5" style="border: 1px solid #333; padding: 6px; text-align: right; font-weight: bold;">Cộng tiền hàng:</td>
              <td style="border: 1px solid #333; padding: 6px; text-align: right; font-weight: bold;">${new Intl.NumberFormat('vi-VN').format(invoice.subtotal)}</td>
            </tr>
            <tr>
              <td colspan="5" style="border: 1px solid #333; padding: 6px; text-align: right;">Thuế suất GTGT: <b>${invoice.vatRate * 100}%</b> | Tiền thuế GTGT:</td>
              <td style="border: 1px solid #333; padding: 6px; text-align: right;">${new Intl.NumberFormat('vi-VN').format(invoice.vatAmount)}</td>
            </tr>
            <tr style="background: #fdf2f2;">
              <td colspan="5" style="border: 1px solid #333; padding: 8px; text-align: right; font-weight: bold; font-size: 16px; color: #b91c1c;">TỔNG CỘNG THANH TOÁN:</td>
              <td style="border: 1px solid #333; padding: 8px; text-align: right; font-weight: bold; font-size: 16px; color: #b91c1c;">${new Intl.NumberFormat('vi-VN').format(invoice.totalAmount)} VNĐ</td>
            </tr>
          </tfoot>
        </table>

        <div style="display: table; width: 100%; margin-top: 40px;">
          <div style="display: table-cell; width: 50%; text-align: center;">
            <b>NGƯỜI MUA HÀNG</b><br>
            <i>(Ký, ghi rõ họ tên)</i>
          </div>
          <div style="display: table-cell; width: 50%; text-align: center;">
            <b>NGƯỜI BÁN HÀNG</b><br>
            <i>(Ký điện tử & đóng dấu)</i>
          </div>
        </div>
      </body>
      </html>
    `;

    this.triggerBrowserPrint(htmlContent);
  }

  /**
   * In 2 tem mã vạch tiện ích dán quầy (THANHTOAN & XOA) ra máy in barcode hoặc máy in bill
   */
  public printBarcodeStickers(storeName: string = 'PGDSHOP POS') {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>In Tem Barcode Tiện Ích - ${storeName}</title>
        <style>
          @page { margin: 4mm; size: auto; }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 10px;
            color: #000;
            background: #fff;
          }
          .label-grid {
            display: flex;
            flex-direction: column;
            gap: 20px;
            max-width: 320px;
            margin: 0 auto;
          }
          .sticker-card {
            border: 2px dashed #000;
            padding: 14px 10px;
            border-radius: 8px;
            text-align: center;
            page-break-inside: avoid;
            background: #fff;
          }
          .sticker-header {
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 2px;
          }
          .sticker-sub {
            font-size: 9px;
            color: #444;
            margin-bottom: 8px;
          }
          .barcode-bars {
            display: flex;
            justify-content: center;
            align-items: flex-end;
            height: 52px;
            gap: 2px;
            margin: 6px auto;
          }
          .bar {
            background-color: #000;
            height: 100%;
          }
          .b-thin { width: 2px; }
          .b-med { width: 3px; }
          .b-thick { width: 5px; }
          .b-wide { width: 7px; }
          .sp-1 { width: 2px; }
          .sp-2 { width: 3px; }
          .sp-3 { width: 4px; }
          .barcode-text {
            font-family: 'Courier New', Courier, monospace;
            font-size: 18px;
            font-weight: 900;
            letter-spacing: 4px;
            margin-top: 4px;
          }
          .footer-note {
            font-size: 8px;
            color: #666;
            margin-top: 4px;
          }
          @media print {
            .sticker-card { border: 1.5px solid #000; }
          }
        </style>
      </head>
      <body>
        <div class="label-grid">
          <!-- TEM 1: THANHTOAN -->
          <div class="sticker-card">
            <div class="sticker-header" style="color: #059669;">1. MÃ LỆNH THANH TOÁN (THANHTOAN)</div>
            <div class="sticker-sub">Chốt đơn sinh mã VietQR động • Nhận tiền tự động qua Webhook</div>
            
            <div class="barcode-bars">
              <div class="bar b-thick"></div><div class="sp-1"></div>
              <div class="bar b-thin"></div><div class="sp-2"></div>
              <div class="bar b-wide"></div><div class="sp-1"></div>
              <div class="bar b-thin"></div><div class="sp-3"></div>
              <div class="bar b-med"></div><div class="sp-1"></div>
              <div class="bar b-thick"></div><div class="sp-2"></div>
              <div class="bar b-thin"></div><div class="sp-1"></div>
              <div class="bar b-wide"></div><div class="sp-2"></div>
              <div class="bar b-med"></div><div class="sp-1"></div>
              <div class="bar b-thick"></div><div class="sp-2"></div>
              <div class="bar b-thin"></div><div class="sp-1"></div>
              <div class="bar b-wide"></div><div class="sp-2"></div>
              <div class="bar b-thin"></div><div class="sp-1"></div>
              <div class="bar b-thick"></div>
            </div>

            <div class="barcode-text">*THANHTOAN*</div>
            <div class="footer-note">${storeName} • Dán tại quầy thu ngân hoặc cạnh màn hình phụ</div>
          </div>

          <!-- TEM 2: XOA -->
          <div class="sticker-card">
            <div class="sticker-header" style="color: #dc2626;">2. MÃ LỆNH HOÀN TÁC (XOA)</div>
            <div class="sticker-sub">Trừ 1 số lượng món vừa bóp cò nhầm (ví dụ mua 1 nhưng scan 2 lần)</div>
            
            <div class="barcode-bars">
              <div class="bar b-wide"></div><div class="sp-2"></div>
              <div class="bar b-thin"></div><div class="sp-1"></div>
              <div class="bar b-med"></div><div class="sp-3"></div>
              <div class="bar b-thick"></div><div class="sp-1"></div>
              <div class="bar b-wide"></div><div class="sp-2"></div>
              <div class="bar b-thin"></div><div class="sp-1"></div>
              <div class="bar b-thick"></div><div class="sp-2"></div>
              <div class="bar b-med"></div><div class="sp-1"></div>
              <div class="bar b-wide"></div><div class="sp-2"></div>
              <div class="bar b-thin"></div><div class="sp-1"></div>
              <div class="bar b-thick"></div>
            </div>

            <div class="barcode-text">*XOA*</div>
            <div class="footer-note">${storeName} • Dán cạnh súng quét barcode để bấm cò nhanh</div>
          </div>
        </div>
      </body>
      </html>
    `;

    this.triggerBrowserPrint(htmlContent);
  }

  private triggerBrowserPrint(html: string) {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();

      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }, 300);
    }
  }
}

export const printService = new PrintService();
