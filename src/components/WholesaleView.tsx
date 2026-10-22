import React, { useState, useEffect } from 'react';
import { WholesaleCustomer, WholesaleInvoice, AppSettings } from '../types';
import { storageService } from '../services/storageService';
import { printService } from '../services/printService';
import { Receipt, Printer, Plus, Building, FileText, CheckCircle, Clock } from 'lucide-react';

interface WholesaleViewProps {
  settings: AppSettings;
}

export const WholesaleView: React.FC<WholesaleViewProps> = ({ settings }) => {
  const [customers, setCustomers] = useState<WholesaleCustomer[]>([]);
  const [invoices, setInvoices] = useState<WholesaleInvoice[]>([]);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  // Form tạo hóa đơn đỏ sỉ mới
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [vatRate, setVatRate] = useState(0.08);
  const [itemName, setItemName] = useState('Cà phê Robusta Mộc S18 (Bao 10kg)');
  const [quantity, setQuantity] = useState(5);
  const [unitPrice, setUnitPrice] = useState(1700000);

  useEffect(() => {
    const custList = storageService.getWholesaleCustomers();
    setCustomers(custList);
    if (custList.length > 0) setSelectedCustomerId(custList[0].id);
    setInvoices(storageService.getWholesaleInvoices());
  }, []);

  const handlePrintA4 = (invoice: WholesaleInvoice) => {
    printService.printA4WholesaleInvoice(invoice, settings);
  };

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const customer = customers.find((c) => c.id === selectedCustomerId);
    if (!customer) return;

    const lineAmount = quantity * unitPrice;
    const subtotal = lineAmount;
    const vatAmount = subtotal * vatRate;
    const totalAmount = subtotal + vatAmount;

    const newInvoice: WholesaleInvoice = {
      id: 'ws-inv-' + Date.now(),
      invoiceNumber: `HD-VAT-${Math.floor(10000 + Math.random() * 90000)}`,
      customerName: customer.companyName,
      taxId: customer.taxId,
      address: customer.address,
      items: [
        {
          name: itemName,
          unit: 'bao',
          quantity,
          unitPrice,
          amount: lineAmount,
        },
      ],
      subtotal,
      vatRate,
      vatAmount,
      totalAmount,
      paymentStatus: 'PAID',
      createdAt: new Date().toISOString().slice(0, 10),
    };

    const updated = [newInvoice, ...invoices];
    setInvoices(updated);
    storageService.saveWholesaleInvoices(updated);
    setIsInvoiceModalOpen(false);

    // Mở preview in ngay lập tức
    handlePrintA4(newInvoice);
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Receipt size={28} color="#ec4899" />
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>5. BÁN SỈ & XUẤT HÓA ĐƠN ĐỎ (VAT INVOICE A4)</h1>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '4px' }}>
            Quản lý khách hàng doanh nghiệp, mã số thuế (MST), xuất và in Hóa Đơn Giá Trị Gia Tăng khổ A4 chuẩn hóa.
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setIsInvoiceModalOpen(true)}>
          <Plus size={18} />
          <span>Lập Hóa Đơn Đỏ Mới</span>
        </button>
      </div>

      {/* Danh sách công ty / khách sỉ */}
      <h3 style={{ fontSize: '1.1rem', marginBottom: '12px', color: '#cbd5e1' }}>Khách Hàng Doanh Nghiệp & Đối Tác Sỉ</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        {customers.map((c) => (
          <div key={c.id} className="glass-panel" style={{ padding: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <Building size={22} color="#ec4899" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>{c.companyName}</h4>
                <div style={{ fontSize: '0.85rem', color: '#38bdf8', fontFamily: 'var(--font-mono)', margin: '4px 0' }}>
                  MST: <b>{c.taxId}</b>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{c.address}</div>
                <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginTop: '6px' }}>
                  Liên hệ: {c.contactPerson} ({c.phone})
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Danh sách hóa đơn đỏ VAT đã phát hành */}
      <h3 style={{ fontSize: '1.1rem', marginBottom: '12px', color: '#cbd5e1' }}>Hóa Đơn Đỏ VAT Khổ A4 Đã Xuất</h3>
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Số Hóa Đơn</th>
              <th>Ngày Xuất</th>
              <th>Đơn Vị Mua Hàng</th>
              <th>Mã Số Thuế</th>
              <th>Tiền Hàng (VNĐ)</th>
              <th>Thuế VAT</th>
              <th>Tổng Thanh Toán</th>
              <th>Trạng Thái</th>
              <th>In A4</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id}>
                <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#ec4899' }}>
                  {inv.invoiceNumber}
                </td>
                <td style={{ color: '#94a3b8' }}>{inv.createdAt}</td>
                <td style={{ fontWeight: 600 }}>{inv.customerName}</td>
                <td style={{ fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>{inv.taxId}</td>
                <td style={{ fontFamily: 'var(--font-mono)' }}>
                  {new Intl.NumberFormat('vi-VN').format(inv.subtotal)}đ
                </td>
                <td style={{ fontFamily: 'var(--font-mono)', color: '#f87171' }}>
                  {inv.vatRate * 100}% ({new Intl.NumberFormat('vi-VN').format(inv.vatAmount)}đ)
                </td>
                <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#10b981' }}>
                  {new Intl.NumberFormat('vi-VN').format(inv.totalAmount)}đ
                </td>
                <td>
                  <span className={`badge ${inv.paymentStatus === 'PAID' ? 'badge-success' : 'badge-warning'}`}>
                    {inv.paymentStatus === 'PAID' ? 'Đã Thanh Toán' : 'Chưa Thanh Toán'}
                  </span>
                </td>
                <td>
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                    onClick={() => handlePrintA4(inv)}
                    title="In hóa đơn đỏ VAT theo chuẩn giấy A4"
                  >
                    <Printer size={14} color="#ec4899" />
                    <span>In A4</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Lập Hóa Đơn Mới */}
      {isInvoiceModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ fontSize: '1.3rem', marginBottom: '16px' }}>Lập Hóa Đơn Đỏ VAT Cho Khách Sỉ</h2>
            <form onSubmit={handleCreateInvoice} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Chọn Doanh Nghiệp Mua Hàng:</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  style={{ width: '100%', padding: '8px', background: '#0f172a', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '6px' }}
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.companyName} (MST: {c.taxId})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Mặt Hàng Bán Sỉ:</label>
                <input
                  type="text"
                  required
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '6px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Số Lượng:</label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '6px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Đơn Giá Sỉ (VNĐ):</label>
                  <input
                    type="number"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(Number(e.target.value))}
                    style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '6px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Thuế Suất VAT:</label>
                  <select
                    value={vatRate}
                    onChange={(e) => setVatRate(Number(e.target.value))}
                    style={{ width: '100%', padding: '8px', background: '#0f172a', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '6px' }}
                  >
                    <option value={0.08}>8% (Nghị định giảm thuế)</option>
                    <option value={0.10}>10% (Thuế tiêu chuẩn)</option>
                    <option value={0.00}>0% (Không chịu thuế)</option>
                  </select>
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.04)', padding: '12px', borderRadius: '8px', fontSize: '0.9rem' }}>
                <div>Tiền hàng trước thuế: <b>{new Intl.NumberFormat('vi-VN').format(quantity * unitPrice)}đ</b></div>
                <div>Tiền thuế VAT ({vatRate * 100}%): <b>{new Intl.NumberFormat('vi-VN').format(quantity * unitPrice * vatRate)}đ</b></div>
                <div style={{ borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '6px', marginTop: '6px' }}>
                  Tổng cộng thanh toán: <b style={{ color: '#10b981', fontSize: '1.15rem' }}>{new Intl.NumberFormat('vi-VN').format(quantity * unitPrice * (1 + vatRate))} VNĐ</b>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsInvoiceModalOpen(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  Lập Hóa Đơn & In Khổ A4
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
