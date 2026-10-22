import React, { useState, useEffect } from 'react';
import { OpExExpense } from '../types';
import { storageService } from '../services/storageService';
import { Zap, Plus, Droplet, Wrench, FileText, ShoppingBag, Home, Users, RefreshCw, Link2 } from 'lucide-react';

export const OpExView: React.FC = () => {
  const [expenses, setExpenses] = useState<OpExExpense[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form thêm chi phí mới
  const [category, setCategory] = useState<OpExExpense['category']>('ĐIỆN');
  const [amount, setAmount] = useState(1500000);
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');

  useEffect(() => {
    // Luôn tính lại tổng chi phí từ kho hàng trước khi load
    storageService.recalculateInventoryCostToOpEx();
    setExpenses(storageService.getOpEx());
  }, []);

  const totalOpEx = expenses.reduce((sum, e) => sum + e.amount, 0);
  const inventoryCostItem = expenses.find((e) => e.category === 'NHẬP HÀNG KHO');

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return;

    const newExpense: OpExExpense = {
      id: 'opex-' + Date.now(),
      category,
      amount,
      expenseDate,
      isAutoFromInventory: false,
      notes: notes || 'Chi phí vận hành định kỳ',
    };

    const updated = [newExpense, ...expenses];
    setExpenses(updated);
    storageService.saveOpEx(updated);
    setIsModalOpen(false);

    // Reset
    setNotes('');
  };

  const getCategoryIcon = (cat: OpExExpense['category']) => {
    switch (cat) {
      case 'ĐIỆN': return <Zap size={16} color="#fbbf24" />;
      case 'NƯỚC': return <Droplet size={16} color="#38bdf8" />;
      case 'BẢO TRÌ': return <Wrench size={16} color="#f87171" />;
      case 'VẬT TƯ': return <FileText size={16} color="#a855f7" />;
      case 'NHẬP HÀNG KHO': return <ShoppingBag size={16} color="#10b981" />;
      case 'MẶT BẰNG': return <Home size={16} color="#60a5fa" />;
      case 'LƯƠNG': return <Users size={16} color="#f43f5e" />;
      default: return <Zap size={16} color="var(--text-secondary)" />;
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Zap size={28} color="#ef4444" />
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>7. OPEX (CHI PHÍ VẬN HÀNH ĐỊNH KỲ)</h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Kiểm soát chi phí điện, nước, bảo trì, vật tư (giấy in, mực, ly) và tự động kéo tổng chi phí nhập hàng từ Kho Hàng.
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} />
          <span>Ghi Nhận Khoản Chi Mới</span>
        </button>
      </div>

      {/* 2 Thẻ tổng quan chi phí OpEx */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '16px', marginBottom: '24px' }}>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>TỔNG CHI PHÍ VẬN HÀNH (OPEX) THÁNG NÀY</div>
          <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#f87171', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
            {new Intl.NumberFormat('vi-VN').format(totalOpEx)} VNĐ
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginTop: '6px' }}>
            Bao gồm chi phí vận hành cố định + chi phí mua hàng hóa nhập kho
          </div>
        </div>

        {/* Khối làm nổi bật: Chi phí nhập hàng tự động lấy từ Tab 4 Kho hàng */}
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: '16px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link2 size={20} color="#10b981" />
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#34d399' }}>
              TIỀN NHẬP HÀNG KHO (TỰ ĐỘNG TỪ TAB 4):
            </span>
          </div>

          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981', fontFamily: 'var(--font-mono)', margin: '8px 0' }}>
            {new Intl.NumberFormat('vi-VN').format(inventoryCostItem ? inventoryCostItem.amount : 0)} VNĐ
          </div>

          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Tự động tổng hợp từ tất cả phiếu nhập hàng trong Quản Lý Kho Hàng mà không cần nhập lại bằng tay.
          </div>
        </div>
      </div>

      {/* Bảng chi tiết OpEx */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Hạng Mục Chi Phí</th>
              <th>Ngày Chi</th>
              <th>Số Tiền (VNĐ)</th>
              <th>Tỉ Lệ / Tổng OpEx</th>
              <th>Cơ Chế Tính</th>
              <th>Ghi Chú</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((expense) => {
              const percentage = totalOpEx > 0 ? Math.round((expense.amount / totalOpEx) * 100) : 0;
              return (
                <tr key={expense.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                      {getCategoryIcon(expense.category)}
                      <span>{expense.category}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{expense.expenseDate}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#f87171' }}>
                    {new Intl.NumberFormat('vi-VN').format(expense.amount)}đ
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '60px', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${percentage}%`, height: '100%', background: '#f87171' }} />
                      </div>
                      <span>{percentage}%</span>
                    </div>
                  </td>
                  <td>
                    {expense.isAutoFromInventory ? (
                      <span className="badge badge-success">
                        <Link2 size={12} style={{ marginRight: '3px' }} /> Tự động từ Kho
                      </span>
                    ) : (
                      <span className="badge badge-info">Nhập thủ công</span>
                    )}
                  </td>
                  <td style={{ color: 'var(--text-primary)', fontSize: '0.85rem' }}>{expense.notes}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal Thêm Khoản Chi Mới */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ fontSize: '1.3rem', marginBottom: '16px' }}>Ghi Nhận Khoản Chi Phí Vận Hành (OpEx)</h2>
            <form onSubmit={handleAddExpense} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Hạng Mục Chi:</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as OpExExpense['category'])}
                  style={{ width: '100%', padding: '8px', background: '#0f172a', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px' }}
                >
                  <option value="ĐIỆN">TIỀN ĐIỆN</option>
                  <option value="NƯỚC">TIỀN NƯỚC</option>
                  <option value="BẢO TRÌ">BẢO TRÌ THIẾT BỊ / MÁY MÓC</option>
                  <option value="VẬT TƯ">VẬT TƯ (MỰC, GIẤY IN BILL, TÚI LY)</option>
                  <option value="MẶT BẰNG">TIỀN THUÊ MẶT BẰNG</option>
                  <option value="LƯƠNG">LƯƠNG NHÂN VIÊN</option>
                  <option value="KHÁC">CHI PHÍ KHÁC</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Số Tiền (VNĐ):</label>
                  <input
                    type="number"
                    required
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Ngày Chi:</label>
                  <input
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Ghi chú chứng từ:</label>
                <input
                  type="text"
                  placeholder="VD: Hóa đơn điện tử EVN tháng 10"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  Lưu Khoản Chi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
