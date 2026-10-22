import React, { useState, useEffect } from 'react';
import { CapExAsset } from '../types';
import { storageService } from '../services/storageService';
import { Truck, Plus, Wrench, ShieldCheck, DollarSign, Calendar } from 'lucide-react';

export const CapExView: React.FC = () => {
  const [assets, setAssets] = useState<CapExAsset[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form thêm tài sản mới
  const [name, setName] = useState('');
  const [category, setCategory] = useState<CapExAsset['category']>('MÁY MÓC');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0, 10));
  const [originalValue, setOriginalValue] = useState(15000000);
  const [depreciationMonths, setDepreciationMonths] = useState(24);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    setAssets(storageService.getCapEx());
  }, []);

  const totalCapEx = assets.reduce((sum, a) => sum + a.originalValue, 0);
  const totalMonthlyDepreciation = assets.reduce((sum, a) => sum + a.monthlyDepreciation, 0);

  const handleAddAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || originalValue <= 0) return;

    const monthlyDepreciation = Math.round(originalValue / (depreciationMonths || 1));
    const newAsset: CapExAsset = {
      id: 'capex-' + Date.now(),
      name,
      category,
      purchaseDate,
      originalValue,
      depreciationMonths,
      monthlyDepreciation,
      status: 'ACTIVE',
      notes: notes || 'Tài sản phục vụ kinh doanh',
    };

    const updated = [newAsset, ...assets];
    setAssets(updated);
    storageService.saveCapEx(updated);
    setIsModalOpen(false);

    // Reset form
    setName('');
    setNotes('');
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Truck size={28} color="#8b5cf6" />
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>6. CAPEX (CHI PHÍ ĐẦU TƯ TÀI SẢN CỐ ĐỊNH)</h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Theo dõi danh mục máy móc, hệ thống kệ, phương tiện, tủ đông mát, thiết bị bán hàng và khấu hao định kỳ hàng tháng.
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} />
          <span>Thêm Tài Sản CapEx Mới</span>
        </button>
      </div>

      {/* Thẻ tổng quan CapEx */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>TỔNG VỐN ĐẦU TƯ TÀI SẢN (CAPEX)</div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#8b5cf6', fontFamily: 'var(--font-mono)', marginTop: '6px' }}>
            {new Intl.NumberFormat('vi-VN').format(totalCapEx)} VNĐ
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginTop: '4px' }}>
            Gồm {assets.length} trang thiết bị, máy móc và công cụ hoạt động
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>TỔNG CHI PHÍ KHẤU HAO / THÁNG</div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#f59e0b', fontFamily: 'var(--font-mono)', marginTop: '6px' }}>
            {new Intl.NumberFormat('vi-VN').format(totalMonthlyDepreciation)} VNĐ / tháng
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginTop: '4px' }}>
            Khấu hao này được tự động chuyển sang Bảng OpEx hàng tháng
          </div>
        </div>
      </div>

      {/* Bảng danh mục tài sản CapEx */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Tên Thiết Bị / Tài Sản</th>
              <th>Phân Loại</th>
              <th>Ngày Đầu Tư</th>
              <th>Nguyên Giá (VNĐ)</th>
              <th>Thời Gian Khấu Hao</th>
              <th>Khấu Hao Hàng Tháng</th>
              <th>Tình Trạng</th>
              <th>Ghi Chú</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((asset) => (
              <tr key={asset.id}>
                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{asset.name}</td>
                <td>
                  <span className="badge badge-info">{asset.category}</span>
                </td>
                <td style={{ color: 'var(--text-secondary)' }}>{asset.purchaseDate}</td>
                <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#8b5cf6' }}>
                  {new Intl.NumberFormat('vi-VN').format(asset.originalValue)}đ
                </td>
                <td style={{ fontFamily: 'var(--font-mono)' }}>{asset.depreciationMonths} tháng</td>
                <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#f59e0b' }}>
                  {new Intl.NumberFormat('vi-VN').format(asset.monthlyDepreciation)}đ / th
                </td>
                <td>
                  <span className="badge badge-success">
                    <ShieldCheck size={13} style={{ marginRight: '3px' }} /> Hoạt động tốt
                  </span>
                </td>
                <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{asset.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Thêm Tài Sản CapEx Mới */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ fontSize: '1.3rem', marginBottom: '16px' }}>Đăng Ký Tài Sản CapEx Mới</h2>
            <form onSubmit={handleAddAsset} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Tên Thiết Bị / Máy Móc:</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Máy làm đá tự động Hoshizaki 100kg"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Phân Loại:</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as CapExAsset['category'])}
                    style={{ width: '100%', padding: '8px', background: '#0f172a', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px' }}
                  >
                    <option value="MÁY MÓC">MÁY MÓC</option>
                    <option value="KỆ TỦ">KỆ TỦ</option>
                    <option value="XE CỘ">XE CỘ</option>
                    <option value="TỦ ĐÔNG/MÁT">TỦ ĐÔNG/MÁT</option>
                    <option value="THIẾT BỊ IT">THIẾT BỊ IT QUẦY</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Ngày Mua:</label>
                  <input
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Nguyên Giá Đầu Tư (VNĐ):</label>
                  <input
                    type="number"
                    value={originalValue}
                    onChange={(e) => setOriginalValue(Number(e.target.value))}
                    style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Thời Gian Khấu Hao (Tháng):</label>
                  <input
                    type="number"
                    value={depreciationMonths}
                    onChange={(e) => setDepreciationMonths(Number(e.target.value))}
                    style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px' }}
                  />
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.04)', padding: '10px', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Khấu hao mỗi tháng: </span>
                <b style={{ color: '#f59e0b', fontSize: '1.1rem', fontFamily: 'var(--font-mono)' }}>
                  {new Intl.NumberFormat('vi-VN').format(Math.round(originalValue / (depreciationMonths || 1)))} VNĐ / tháng
                </b>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Ghi chú thông số / bảo hành:</label>
                <input
                  type="text"
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
                  Lưu Tài Sản CapEx
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
