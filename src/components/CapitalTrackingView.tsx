import React, { useState, useEffect } from 'react';
import { CapitalMetric } from '../types';
import { storageService } from '../services/storageService';
import {
  TrendingUp,
  BarChart3,
  Calendar,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  ExternalLink,
  Share2,
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

export const CapitalTrackingView: React.FC = () => {
  const [metrics, setMetrics] = useState<CapitalMetric[]>([]);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  useEffect(() => {
    setMetrics(storageService.getCapital());
  }, []);

  const latest = metrics[metrics.length - 1] || {
    closeCapital: 0,
    openCapital: 0,
    netProfit: 0,
    growthRate: 0,
  };

  const handleSyncToGoogleSheets = async () => {
    setSyncStatus('Đang gửi dữ liệu sang Google Sheet...');
    const success = await storageService.sendToGoogleSheetsWebhook('SYNC_CAPITAL', {
      timestamp: new Date().toISOString(),
      metricsCount: metrics.length,
      latestCapital: latest.closeCapital,
    });

    if (success) {
      setSyncStatus('✅ Đã đồng bộ thành công sang Google Sheet!');
    } else {
      setSyncStatus('⚠️ Chưa cài Webhook URL hoặc đã lưu vào bộ nhớ nội bộ.');
    }

    setTimeout(() => setSyncStatus(null), 3000);
  };

  // Cấu hình dữ liệu biểu đồ cột kiểu tài chính chứng khoán (Stock Capital Fluctuations)
  const chartData = {
    labels: metrics.map((m) => `Tháng ${m.monthYear.slice(5)}`),
    datasets: [
      {
        label: 'Vốn Mở Đầu Kỳ (Open)',
        data: metrics.map((m) => m.openCapital / 1000000), // Triệu VNĐ
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: '#3b82f6',
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: 'Vốn Đóng Cuối Kỳ (Close)',
        data: metrics.map((m) => m.closeCapital / 1000000),
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: '#10b981',
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: 'Lợi Nhuận Ròng (Net Profit)',
        data: metrics.map((m) => m.netProfit / 1000000),
        backgroundColor: 'rgba(245, 158, 11, 0.85)',
        borderColor: '#f59e0b',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#cbd5e1',
          font: { family: 'Outfit, sans-serif', size: 12 },
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            return `${context.dataset.label}: ${context.raw.toFixed(1)} Triệu VNĐ`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: { color: '#94a3b8' },
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
      },
      y: {
        ticks: {
          color: '#94a3b8',
          callback: (value: any) => `${value} tr`,
        },
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
      },
    },
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <TrendingUp size={28} color="#10b981" />
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>
              8. THEO DÕI VỐN & BIẾN ĐỘNG DÒNG TIỀN (BIỂU ĐỒ CHỨNG KHOÁN)
            </h1>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '4px' }}>
            Theo dõi mức chênh lệch tiền theo từng tháng, biên độ biến động vốn (Open/High/Low/Close) và đồng bộ Google Sheet.
          </p>
        </div>

        <button className="btn btn-primary" onClick={handleSyncToGoogleSheets}>
          <Share2 size={18} />
          <span>Đẩy Dữ Liệu Lên Google Sheet</span>
        </button>
      </div>

      {syncStatus && (
        <div style={{ padding: '10px 16px', background: 'rgba(59, 130, 246, 0.2)', border: '1px solid #3b82f6', borderRadius: '8px', marginBottom: '16px', color: '#93c5fd' }}>
          {syncStatus}
        </div>
      )}

      {/* 3 Thẻ Chỉ Số Vốn Hàng Đầu */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>QUY MÔ VỐN HIỆN TẠI (THÁNG 10)</div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#10b981', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
            {new Intl.NumberFormat('vi-VN').format(latest.closeCapital)}đ
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '0.88rem', marginTop: '4px' }}>
            <ArrowUpRight size={16} />
            <span>Tăng +{(latest.growthRate * 100).toFixed(1)}% so với đầu kỳ</span>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>LỢI NHUẬN RÒNG LŨY KẾ THÁNG 10</div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#38bdf8', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
            +{new Intl.NumberFormat('vi-VN').format(latest.netProfit)}đ
          </div>
          <div style={{ fontSize: '0.85rem', color: '#cbd5e1', marginTop: '4px' }}>
            (Doanh Thu quầy & sỉ - Toàn bộ OpEx)
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>CHÊNH LỆCH VỐN RÒNG (DELTA)</div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#fbbf24', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
            +{new Intl.NumberFormat('vi-VN').format(latest.closeCapital - latest.openCapital)}đ
          </div>
          <div style={{ fontSize: '0.85rem', color: '#cbd5e1', marginTop: '4px' }}>
            Biên độ an toàn tài chính cao
          </div>
        </div>
      </div>

      {/* KHUNG BIỂU ĐỒ CỘT TÀI CHÍNH KIỂU CHỨNG KHOÁN */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={22} color="#10b981" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
              Biểu Đồ So Sánh Vốn Đầu Kỳ (Open) - Vốn Cuối Kỳ (Close) & Lợi Nhuận
            </h3>
          </div>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Đơn vị tính: Triệu VNĐ</span>
        </div>

        <div style={{ height: '320px', width: '100%' }}>
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>

      {/* Bảng dữ liệu chi tiết theo chuẩn OHLC chứng khoán */}
      <h3 style={{ fontSize: '1.1rem', marginBottom: '12px', color: '#cbd5e1' }}>
        Bảng Dữ Liệu OHLC Dòng Tiền & Tăng Trưởng (Đồng bộ với Google Sheet Tab 8)
      </h3>
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Tháng</th>
              <th>Vốn Mở (Open)</th>
              <th>Đáy Vốn (Low)</th>
              <th>Đỉnh Vốn (High)</th>
              <th>Vốn Đóng (Close)</th>
              <th>Doanh Thu</th>
              <th>Tổng OpEx</th>
              <th>Lợi Nhuận Ròng</th>
              <th>Tăng Trưởng</th>
            </tr>
          </thead>
          <tbody>
            {metrics.map((m) => (
              <tr key={m.monthYear}>
                <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>
                  {m.monthYear}
                </td>
                <td style={{ fontFamily: 'var(--font-mono)' }}>
                  {new Intl.NumberFormat('vi-VN').format(m.openCapital)}đ
                </td>
                <td style={{ fontFamily: 'var(--font-mono)', color: '#f87171' }}>
                  {new Intl.NumberFormat('vi-VN').format(m.lowCapital)}đ
                </td>
                <td style={{ fontFamily: 'var(--font-mono)', color: '#34d399' }}>
                  {new Intl.NumberFormat('vi-VN').format(m.highCapital)}đ
                </td>
                <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#fff' }}>
                  {new Intl.NumberFormat('vi-VN').format(m.closeCapital)}đ
                </td>
                <td style={{ fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>
                  {new Intl.NumberFormat('vi-VN').format(m.revenue)}đ
                </td>
                <td style={{ fontFamily: 'var(--font-mono)', color: '#f87171' }}>
                  {new Intl.NumberFormat('vi-VN').format(m.opexSpent)}đ
                </td>
                <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#10b981' }}>
                  +{new Intl.NumberFormat('vi-VN').format(m.netProfit)}đ
                </td>
                <td>
                  <span className="badge badge-success">
                    +{(m.growthRate * 100).toFixed(1)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
