import React, { useState, useEffect } from 'react';
import { InventoryTransaction, Product } from '../types';
import { storageService } from '../services/storageService';
import { Warehouse, Plus, ArrowDownLeft, ArrowUpRight, Link2, AlertCircle } from 'lucide-react';

export const InventoryView: React.FC = () => {
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form tạo phiếu nhập mới
  const [supplier, setSupplier] = useState('');
  const [itemName, setItemName] = useState('');
  const [unit, setUnit] = useState('kg');
  const [quantity, setQuantity] = useState(10);
  const [costPrice, setCostPrice] = useState(150000);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    setTransactions(storageService.getInventoryTransactions());
    setProducts(storageService.getProducts());
  }, []);

  const totalInCost = transactions
    .filter((t) => t.type === 'IN')
    .reduce((sum, t) => sum + t.totalCost, 0);

  const handleCreateSlip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName || !supplier) return;

    const slipCode = `NK-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${Math.floor(10 + Math.random() * 90)}`;
    const lineTotal = quantity * costPrice;

    const newTx: InventoryTransaction = {
      id: 'inv-' + Date.now(),
      slipCode,
      type: 'IN',
      supplier,
      totalCost: lineTotal,
      notes: notes || 'Nhập hàng định kỳ',
      items: [
        {
          productName: itemName,
          unit,
          quantity,
          costPrice,
          total: lineTotal,
        },
      ],
      createdAt: new Date().toISOString().slice(0, 10),
    };

    storageService.addInventoryTransaction(newTx);
    setTransactions(storageService.getInventoryTransactions());
    setIsModalOpen(false);

    // Reset form
    setItemName('');
    setSupplier('');
    setNotes('');
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Warehouse size={28} color="#6366f1" />
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>4. QUẢN LÝ KHO HÀNG & NHẬP XUẤT NGUYÊN VẬT LIỆU</h1>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '4px' }}>
            Quản lý phiếu nhập kho từ nhà cung cấp, xuất kho kiểm kê, tự động đối soát tổng chi phí sang OpEx.
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} />
          <span>Tạo Phiếu Nhập Kho Mới</span>
        </button>
      </div>

      {/* Banner thông báo tự động liên kết OpEx theo yêu cầu đặc biệt của người dùng */}
      <div
        style={{
          background: 'linear-gradient(90deg, rgba(99, 102, 241, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.4)',
          borderRadius: '12px',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link2 size={24} color="#818cf8" />
          <div>
            <div style={{ fontWeight: 700, color: '#e0e7ff', fontSize: '1rem' }}>
              TỰ ĐỘNG LIÊN KẾT DỮ LIỆU SANG MỤC 7 (OPEX):
            </div>
            <div style={{ fontSize: '0.88rem', color: '#94a3b8' }}>
              Tổng tiền mua hàng từ các phiếu Nhập Kho được tổng hợp tự động để làm Chi Phí Nhập Hàng trong Bảng Chi Phí Vận Hành (OpEx).
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>TỔNG TIỀN NHẬP KHO THÁNG NÀY:</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#818cf8', fontFamily: 'var(--font-mono)' }}>
            {new Intl.NumberFormat('vi-VN').format(totalInCost)} VNĐ
          </div>
        </div>
      </div>

      {/* Bảng phiếu nhập xuất kho */}
      <h3 style={{ fontSize: '1.1rem', marginBottom: '12px', color: '#cbd5e1' }}>Lịch Sử Phiếu Nhập / Xuất Kho</h3>
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Mã Phiếu</th>
              <th>Ngày Tạo</th>
              <th>Loại Phiếu</th>
              <th>Nhà Cung Cấp / Đối Tác</th>
              <th>Chi Tiết Mặt Hàng</th>
              <th>Tổng Tiền Phiếu</th>
              <th>Ghi Chú</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id}>
                <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#fff' }}>
                  {tx.slipCode}
                </td>
                <td style={{ color: '#94a3b8' }}>{tx.createdAt}</td>
                <td>
                  <span className={`badge ${tx.type === 'IN' ? 'badge-success' : 'badge-danger'}`}>
                    {tx.type === 'IN' ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <ArrowDownLeft size={13} /> Nhập Kho
                      </span>
                    ) : (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <ArrowUpRight size={13} /> Xuất Kho
                      </span>
                    )}
                  </span>
                </td>
                <td style={{ fontWeight: 600 }}>{tx.supplier}</td>
                <td>
                  {tx.items?.map((it, idx) => (
                    <div key={idx} style={{ fontSize: '0.88rem' }}>
                      • <b>{it.productName}</b>: {it.quantity} {it.unit} x {new Intl.NumberFormat('vi-VN').format(it.costPrice)}đ
                    </div>
                  ))}
                </td>
                <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#38bdf8' }}>
                  {new Intl.NumberFormat('vi-VN').format(tx.totalCost)}đ
                </td>
                <td style={{ color: '#64748b', fontSize: '0.85rem' }}>{tx.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal tạo phiếu nhập mới */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ fontSize: '1.3rem', marginBottom: '16px' }}>Tạo Phiếu Nhập Kho Mới</h2>
            <form onSubmit={handleCreateSlip} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Nhà Cung Cấp:</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Tổng Kho Cà Phê Ban Mê"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '6px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Tên Mặt Hàng Nhập:</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Hạt Cà Phê Arabica Cầu Đất (Bao 30kg)"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '6px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>ĐVT:</label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '6px' }}
                  />
                </div>
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
                  <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Đơn Giá (VNĐ):</label>
                  <input
                    type="number"
                    value={costPrice}
                    onChange={(e) => setCostPrice(Number(e.target.value))}
                    style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '6px' }}
                  />
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.04)', padding: '10px', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Thành tiền phiếu nhập: </span>
                <b style={{ color: '#10b981', fontSize: '1.1rem', fontFamily: 'var(--font-mono)' }}>
                  {new Intl.NumberFormat('vi-VN').format(quantity * costPrice)} VNĐ
                </b>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Ghi chú phiếu:</label>
                <input
                  type="text"
                  placeholder="Ghi chú thêm..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '6px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  Lưu & Tự Động Cập Nhật OpEx
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
