import React, { useState, useEffect } from 'react';
import { ShelfLocation } from '../types';
import { storageService } from '../services/storageService';
import { Layers, Plus, MapPin, CheckCircle, AlertTriangle, Edit } from 'lucide-react';

export const ShelfManagementView: React.FC = () => {
  const [shelves, setShelves] = useState<ShelfLocation[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newShelf, setNewShelf] = useState<Partial<ShelfLocation>>({
    code: 'KE-C1-T1',
    aisle: 'C',
    tier: 1,
    capacity: 50,
    currentCount: 0,
    status: 'ACTIVE',
    notes: 'Kệ trưng bày hàng gia dụng mới',
    assignedProducts: [],
  });

  useEffect(() => {
    setShelves(storageService.getShelves());
  }, []);

  const handleAddShelf = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShelf.code) return;

    const shelfToAdd: ShelfLocation = {
      id: 'shelf-' + Date.now(),
      code: newShelf.code.toUpperCase(),
      aisle: newShelf.aisle || 'A',
      tier: Number(newShelf.tier) || 1,
      capacity: Number(newShelf.capacity) || 50,
      currentCount: Number(newShelf.currentCount) || 0,
      status: (newShelf.status as 'ACTIVE' | 'FULL' | 'MAINTENANCE') || 'ACTIVE',
      notes: newShelf.notes || '',
      assignedProducts: newShelf.assignedProducts || [],
    };

    const updated = [...shelves, shelfToAdd];
    setShelves(updated);
    storageService.saveShelves(updated);
    setIsAddModalOpen(false);
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Layers size={28} color="#38bdf8" />
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>1. QUẢN LÝ KỆ HÀNG & VỊ TRÍ TRƯNG BÀY</h1>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '4px' }}>
            Quản lý sơ đồ kệ (Dãy, Tầng), sức chứa và hàng hóa được phân bổ để nhân viên và khách dễ tìm kiếm.
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
          <Plus size={18} />
          <span>Thêm Kệ Hàng Mới</span>
        </button>
      </div>

      {/* Grid danh sách kệ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
        {shelves.map((shelf) => {
          const fillPercentage = Math.min(100, Math.round((shelf.currentCount / (shelf.capacity || 1)) * 100));
          const isNearlyFull = fillPercentage >= 85;

          return (
            <div key={shelf.id} className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={20} color="#38bdf8" />
                  <span style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                    {shelf.code}
                  </span>
                </div>
                <span className={`badge ${shelf.status === 'ACTIVE' ? (isNearlyFull ? 'badge-warning' : 'badge-success') : 'badge-danger'}`}>
                  {shelf.status === 'ACTIVE' ? (isNearlyFull ? 'Gần Đầy' : 'Đang Dùng') : 'Bảo Trì'}
                </span>
              </div>

              <div style={{ fontSize: '0.9rem', color: '#cbd5e1', marginBottom: '8px' }}>
                <div><b>Vị trí:</b> Dãy {shelf.aisle} - Tầng {shelf.tier}</div>
                <div><b>Sức chứa:</b> {shelf.currentCount} / {shelf.capacity} món ({fillPercentage}%)</div>
              </div>

              {/* Thanh tiến trình sức chứa */}
              <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px', overflow: 'hidden', margin: '10px 0' }}>
                <div
                  style={{
                    width: `${fillPercentage}%`,
                    height: '100%',
                    background: isNearlyFull ? '#f59e0b' : '#10b981',
                    borderRadius: '4px',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>

              <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '10px', borderTop: '1px solid var(--border-color)', paddingTop: '8px' }}>
                <b>Mặt hàng gán:</b> {shelf.assignedProducts.join(', ') || 'Chưa gán sản phẩm cụ thể'}
              </div>

              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '6px', fontStyle: 'italic' }}>
                {shelf.notes}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Thêm Kệ Mới */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ marginBottom: '16px', fontSize: '1.3rem' }}>Thêm Vị Trí Kệ Mới</h2>
            <form onSubmit={handleAddShelf} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Mã Kệ (VD: KE-A2-T3):</label>
                <input
                  type="text"
                  required
                  value={newShelf.code || ''}
                  onChange={(e) => setNewShelf({ ...newShelf, code: e.target.value })}
                  style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '6px' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Dãy Kệ (A, B, C):</label>
                  <input
                    type="text"
                    value={newShelf.aisle || ''}
                    onChange={(e) => setNewShelf({ ...newShelf, aisle: e.target.value })}
                    style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '6px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Tầng (1, 2, 3...):</label>
                  <input
                    type="number"
                    value={newShelf.tier || 1}
                    onChange={(e) => setNewShelf({ ...newShelf, tier: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '6px' }}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Sức chứa tối đa (món):</label>
                  <input
                    type="number"
                    value={newShelf.capacity || 50}
                    onChange={(e) => setNewShelf({ ...newShelf, capacity: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '6px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Số lượng hiện có:</label>
                  <input
                    type="number"
                    value={newShelf.currentCount || 0}
                    onChange={(e) => setNewShelf({ ...newShelf, currentCount: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '6px' }}
                  />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Ghi chú đặc điểm vị trí:</label>
                <textarea
                  rows={2}
                  value={newShelf.notes || ''}
                  onChange={(e) => setNewShelf({ ...newShelf, notes: e.target.value })}
                  style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '6px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  Lưu Kệ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
