import React, { useState, useEffect } from 'react';
import { OnlineOrder, OnlinePlatform } from '../types';
import { storageService } from '../services/storageService';
import { Globe, Package, Truck, CheckCircle2, Clock, Filter, Plus } from 'lucide-react';

export const OnlineOrdersView: React.FC = () => {
  const [orders, setOrders] = useState<OnlineOrder[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('ALL');

  useEffect(() => {
    setOrders(storageService.getOnlineOrders());
  }, []);

  const totalGross = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalFees = orders.reduce((sum, o) => sum + o.platformFee, 0);
  const totalNet = orders.reduce((sum, o) => sum + o.netRevenue, 0);

  const filteredOrders = orders.filter((o) => {
    if (selectedPlatform === 'ALL') return true;
    return o.platform === selectedPlatform;
  });

  const updateOrderStatus = (orderId: string, newStatus: OnlineOrder['status']) => {
    const updated = orders.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o));
    setOrders(updated);
    storageService.saveOnlineOrders(updated);
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Globe size={28} color="#10b981" />
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>3. QUẢN LÝ ĐƠN HÀNG ONLINE ĐA SÀN</h1>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '4px' }}>
            Theo dõi đơn hàng từ Shopee, GrabFood, TikTokShop, Web trực tiếp, quản lý mã vận đơn và chiết khấu phí sàn.
          </p>
        </div>
      </div>

      {/* 3 Thẻ thống kê tài chính online */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>TỔNG TIỀN HÀNG ONLINE</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#38bdf8', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
            {new Intl.NumberFormat('vi-VN').format(totalGross)}đ
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>PHÍ HOA HỒNG SÀN CHIẾT KHẤU</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f87171', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
            -{new Intl.NumberFormat('vi-VN').format(totalFees)}đ
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>THỰC THU RÒNG VỀ TÀI KHOẢN</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
            {new Intl.NumberFormat('vi-VN').format(totalNet)}đ
          </div>
        </div>
      </div>

      {/* Bộ lọc kênh bán */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {['ALL', 'Shopee', 'GrabFood', 'TikTokShop', 'Web'].map((p) => (
          <button
            key={p}
            className={`cat-pill ${selectedPlatform === p ? 'active' : ''}`}
            onClick={() => setSelectedPlatform(p)}
          >
            {p === 'ALL' ? 'Tất Cả Kênh' : p}
          </button>
        ))}
      </div>

      {/* Bảng đơn hàng online */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Mã Đơn / Sàn</th>
              <th>Khách Hàng / SĐT</th>
              <th>Mã Vận Đơn</th>
              <th>Chi Tiết Mặt Hàng</th>
              <th>Tổng Tiền</th>
              <th>Phí Sàn</th>
              <th>Thực Thu</th>
              <th>Trạng Thái</th>
              <th>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => (
              <tr key={order.id}>
                <td>
                  <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#fff' }}>{order.orderCode}</div>
                  <span
                    className={`badge ${
                      order.platform === 'Shopee'
                        ? 'badge-warning'
                        : order.platform === 'GrabFood'
                        ? 'badge-success'
                        : order.platform === 'TikTokShop'
                        ? 'badge-danger'
                        : 'badge-info'
                    }`}
                  >
                    {order.platform}
                  </span>
                </td>
                <td>
                  <div style={{ fontWeight: 600 }}>{order.customerName}</div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{order.customerPhone}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{order.deliveryAddress}</div>
                </td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#38bdf8' }}>
                  {order.trackingCode}
                </td>
                <td style={{ fontSize: '0.88rem', color: '#cbd5e1' }}>{order.itemsSummary}</td>
                <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                  {new Intl.NumberFormat('vi-VN').format(order.totalAmount)}đ
                </td>
                <td style={{ fontFamily: 'var(--font-mono)', color: '#f87171' }}>
                  -{new Intl.NumberFormat('vi-VN').format(order.platformFee)}đ
                </td>
                <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#10b981' }}>
                  {new Intl.NumberFormat('vi-VN').format(order.netRevenue)}đ
                </td>
                <td>
                  <span
                    className={`badge ${
                      order.status === 'DELIVERED'
                        ? 'badge-success'
                        : order.status === 'SHIPPING'
                        ? 'badge-info'
                        : 'badge-warning'
                    }`}
                  >
                    {order.status === 'DELIVERED'
                      ? 'Đã Giao'
                      : order.status === 'SHIPPING'
                      ? 'Đang Giao'
                      : 'Đang Chuẩn Bị'}
                  </span>
                </td>
                <td>
                  <select
                    value={order.status}
                    onChange={(e) => updateOrderStatus(order.id, e.target.value as OnlineOrder['status'])}
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid var(--border-color)',
                      color: '#fff',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="NEW" style={{ background: '#0f172a' }}>Chờ xác nhận</option>
                    <option value="PREPARING" style={{ background: '#0f172a' }}>Đang chuẩn bị</option>
                    <option value="SHIPPING" style={{ background: '#0f172a' }}>Đang giao hàng</option>
                    <option value="DELIVERED" style={{ background: '#0f172a' }}>Đã giao thành công</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
