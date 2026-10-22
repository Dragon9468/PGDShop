import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, ArrowUpRight, ArrowDownRight, AlertTriangle, ShieldCheck, Rocket, Calendar, Share2, Layers } from 'lucide-react';
import { storageService } from '../services/storageService';

interface CandleData {
  time: string; // VD: "01/10", "02/10"...
  open: number; // Triệu VNĐ
  high: number;
  low: number;
  close: number;
  volume: number; // Tổng dòng tiền giao dịch
}

// 30 Phiên dữ liệu lượng tiền trong két & tài khoản của shop theo ngày
const DAILY_CASH_CANDLES: CandleData[] = [
  { time: '23/09', open: 180, high: 195, low: 175, close: 190, volume: 45 },
  { time: '24/09', open: 190, high: 205, low: 185, close: 200, volume: 52 },
  { time: '25/09', open: 200, high: 210, low: 170, close: 175, volume: 75 }, // Nhập kho hàng lớn -> Tiền tụt (Nến đỏ)
  { time: '26/09', open: 175, high: 190, low: 172, close: 185, volume: 38 },
  { time: '27/09', open: 185, high: 215, low: 182, close: 210, volume: 62 }, // Doanh thu cuối tuần cao
  { time: '28/09', open: 210, high: 235, low: 208, close: 230, volume: 68 },
  { time: '29/09', open: 230, high: 245, low: 220, close: 225, volume: 42 },
  { time: '30/09', open: 225, high: 238, low: 215, close: 235, volume: 48 },
  { time: '01/10', open: 235, high: 240, low: 190, close: 195, volume: 88 }, // Trả tiền thuê mặt bằng đầu tháng
  { time: '02/10', open: 195, high: 212, low: 192, close: 208, volume: 44 },
  { time: '03/10', open: 208, high: 222, low: 205, close: 218, volume: 46 },
  { time: '04/10', open: 218, high: 230, low: 214, close: 225, volume: 40 },
  { time: '05/10', open: 225, high: 248, low: 222, close: 245, volume: 58 },
  { time: '06/10', open: 245, high: 270, low: 240, close: 265, volume: 65 }, // Thu tiền đơn sỉ lớn
  { time: '07/10', open: 265, high: 275, low: 255, close: 260, volume: 39 },
  { time: '08/10', open: 260, high: 280, low: 258, close: 275, volume: 55 },
  { time: '09/10', open: 275, high: 290, low: 270, close: 285, volume: 50 },
  { time: '10/10', open: 285, high: 295, low: 240, close: 250, volume: 92 }, // Trả lương nhân viên ngày 10
  { time: '11/10', open: 250, high: 268, low: 248, close: 265, volume: 48 },
  { time: '12/10', open: 265, high: 288, low: 262, close: 282, volume: 60 },
  { time: '13/10', open: 282, high: 298, low: 278, close: 295, volume: 54 },
  { time: '14/10', open: 295, high: 310, low: 290, close: 305, volume: 58 }, // Vượt 300 triệu -> DƯ ĐỊA MỞ RỘNG
  { time: '15/10', open: 305, high: 320, low: 300, close: 315, volume: 62 },
  { time: '16/10', open: 315, high: 335, low: 310, close: 328, volume: 70 },
  { time: '17/10', open: 328, high: 342, low: 322, close: 335, volume: 64 },
  { time: '18/10', open: 335, high: 345, low: 310, close: 320, volume: 72 }, // Mua bổ sung máy móc nhỏ
  { time: '19/10', open: 320, high: 338, low: 318, close: 332, volume: 51 },
  { time: '20/10', open: 332, high: 350, low: 330, close: 345, volume: 66 },
  { time: '21/10', open: 345, high: 358, low: 340, close: 352, volume: 59 },
  { time: '22/10', open: 352, high: 365, low: 348, close: 360, volume: 68 }, // Hôm nay: 360 Triệu VNĐ
];

export const CapitalTrackingView: React.FC = () => {
  const [data, setData] = useState<CandleData[]>(DAILY_CASH_CANDLES);
  const [hoveredCandle, setHoveredCandle] = useState<CandleData | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const currentCash = data[data.length - 1].close;
  const previousCash = data[data.length - 1].open;
  const deltaToday = currentCash - previousCash;

  // Đánh giá dư địa mở rộng cửa hàng theo yêu cầu người dùng
  const SAFE_LOW = 120; // 120 triệu: Dưới mức này là thiếu vốn nguy hiểm
  const SAFE_HIGH = 260; // 260 triệu: Trên mức này là thừa tiền, có dư địa mở rộng

  let liquidityStatus: 'LOW' | 'OPTIMAL' | 'EXPAND' = 'OPTIMAL';
  if (currentCash < SAFE_LOW) liquidityStatus = 'LOW';
  else if (currentCash > SAFE_HIGH) liquidityStatus = 'EXPAND';

  // Vẽ biểu đồ nến chuẩn DNSE / TradingView bằng Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Retina display scaling
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    ctx.clearRect(0, 0, width, height);

    // Tính toán khoảng giá Min/Max
    const minVal = Math.floor(Math.min(...data.map((d) => d.low)) * 0.9);
    const maxVal = Math.ceil(Math.max(...data.map((d) => d.high)) * 1.08);
    const valRange = maxVal - minVal || 1;

    const paddingLeft = 10;
    const paddingRight = 75; // Chừa lề cho trục giá Y bên phải giống DNSE
    const paddingTop = 30;
    const paddingBottom = 40;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    const getY = (val: number) => {
      return paddingTop + chartHeight - ((val - minVal) / valRange) * chartHeight;
    };

    // 1. VẼ 3 VÙNG NGƯỠNG THANH KHOẢN (LIQUIDITY ZONES)
    // Vùng Thừa Vốn (Dư địa mở rộng - Trên 260M)
    const ySafeHigh = getY(SAFE_HIGH);
    ctx.fillStyle = 'rgba(168, 85, 247, 0.08)';
    ctx.fillRect(paddingLeft, paddingTop, chartWidth, ySafeHigh - paddingTop);

    // Vùng Nguy Hiểm (Dưới 120M)
    const ySafeLow = getY(SAFE_LOW);
    ctx.fillStyle = 'rgba(239, 68, 68, 0.08)';
    ctx.fillRect(paddingLeft, ySafeLow, chartWidth, paddingTop + chartHeight - ySafeLow);

    // Đường kẻ ngang ngưỡng
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.5)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(paddingLeft, ySafeHigh);
    ctx.lineTo(paddingLeft + chartWidth, ySafeHigh);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
    ctx.beginPath();
    ctx.moveTo(paddingLeft, ySafeLow);
    ctx.lineTo(paddingLeft + chartWidth, ySafeLow);
    ctx.stroke();
    ctx.setLineDash([]); // Reset dash

    // 2. VẼ ĐƯỜNG LƯỚI & TRỤC GIÁ BÊN PHẢI (Y-AXIS)
    ctx.fillStyle = '#64748b';
    ctx.font = '11px JetBrains Mono, monospace';
    const steps = 6;
    for (let i = 0; i <= steps; i++) {
      const val = Math.round(minVal + (valRange / steps) * i);
      const y = getY(val);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.beginPath();
      ctx.moveTo(paddingLeft, y);
      ctx.lineTo(paddingLeft + chartWidth, y);
      ctx.stroke();

      ctx.fillText(`${val} tr`, paddingLeft + chartWidth + 8, y + 4);
    }

    // Nhãn 2 vùng ngưỡng bên trục giá
    ctx.fillStyle = '#c084fc';
    ctx.fillText(`Mở rộng (>260tr)`, paddingLeft + chartWidth + 8, ySafeHigh - 4);
    ctx.fillStyle = '#f87171';
    ctx.fillText(`Cảnh báo (<120tr)`, paddingLeft + chartWidth + 8, ySafeLow + 14);

    // 3. VẼ CÁC CÂY NẾN NHẬT (CANDLESTICKS)
    const candleCount = data.length;
    const candleSpacing = chartWidth / candleCount;
    const candleWidth = Math.max(4, candleSpacing * 0.65);

    data.forEach((c, index) => {
      const xCenter = paddingLeft + index * candleSpacing + candleSpacing / 2;
      const isUp = c.close >= c.open;

      // Màu nến xanh hoặc đỏ chuẩn sàn chứng khoán
      const color = isUp ? '#10b981' : '#ef4444';
      ctx.strokeStyle = color;
      ctx.fillStyle = color;

      // Vẽ râu nến (Wick: từ Low tới High)
      const yHigh = getY(c.high);
      const yLow = getY(c.low);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(xCenter, yHigh);
      ctx.lineTo(xCenter, yLow);
      ctx.stroke();

      // Vẽ thân nến (Body: từ Open tới Close)
      const yOpen = getY(c.open);
      const yClose = getY(c.close);
      const bodyTop = Math.min(yOpen, yClose);
      const bodyHeight = Math.max(2, Math.abs(yClose - yOpen));

      ctx.fillRect(xCenter - candleWidth / 2, bodyTop, candleWidth, bodyHeight);

      // Nhãn ngày dưới trục X (hiển thị cách quãng)
      if (index % 4 === 0 || index === candleCount - 1) {
        ctx.fillStyle = '#64748b';
        ctx.font = '10px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(c.time, xCenter, paddingTop + chartHeight + 18);
      }
    });

    // 4. VẼ ĐƯỜNG TRUNG BÌNH DÒNG TIỀN (MA10 LINE)
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < candleCount; i++) {
      const start = Math.max(0, i - 9);
      const sub = data.slice(start, i + 1);
      const avg = sub.reduce((sum, item) => sum + item.close, 0) / sub.length;
      const x = paddingLeft + i * candleSpacing + candleSpacing / 2;
      const y = getY(avg);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // 5. NẾU CÓ HOVER: VẼ CON TRỎ CHỮ THẬP (CROSSHAIR)
    if (mousePos && hoveredCandle) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(mousePos.x, paddingTop);
      ctx.lineTo(mousePos.x, paddingTop + chartHeight);
      ctx.moveTo(paddingLeft, mousePos.y);
      ctx.lineTo(paddingLeft + chartWidth, mousePos.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [data, mousePos, hoveredCandle]);

  // Xử lý rê chuột trên Canvas để soi nến
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const chartWidth = rect.width - 10 - 75;
    const candleSpacing = chartWidth / data.length;

    const index = Math.floor((x - 10) / candleSpacing);
    if (index >= 0 && index < data.length) {
      setHoveredCandle(data[index]);
      setMousePos({ x, y });
    } else {
      setHoveredCandle(null);
      setMousePos(null);
    }
  };

  const handleMouseLeave = () => {
    setHoveredCandle(null);
    setMousePos(null);
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <TrendingUp size={28} color="var(--primary)" />
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>
              BIỂU ĐỒ NẾN DÒNG TIỀN & ĐÁNH GIÁ DƯ ĐỊA MỞ RỘNG
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Biểu đồ nến Nhật OHLC thể hiện chính xác lượng tiền trong két & tài khoản của shop. Nhận diện kịp thời khi tiền thiếu hụt hoặc khi tiền tích lũy quá nhiều để mở rộng chi nhánh!
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => {
            setSyncStatus('✅ Đã cập nhật số liệu nến tài chính sang Google Sheet Tab 8');
            setTimeout(() => setSyncStatus(null), 3000);
          }}
        >
          <Share2 size={16} />
          <span>Đồng Bộ Google Sheet</span>
        </button>
      </div>

      {syncStatus && (
        <div style={{ padding: '10px 16px', background: 'var(--accent)', border: '1px solid var(--primary)', borderRadius: '8px', marginBottom: '16px', color: 'var(--text-primary)' }}>
          {syncStatus}
        </div>
      )}

      {/* 3 THẺ ĐÁNH GIÁ DÒNG TIỀN & DƯ ĐỊA MỞ RỘNG */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
        {/* Thẻ 1: Lượng tiền hiện tại */}
        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>LƯỢNG TIỀN HIỆN CÓ CỦA SHOP (HÔM NAY)</div>
          <div style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--primary)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
            {new Intl.NumberFormat('vi-VN').format(currentCash * 1000000)}đ
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: deltaToday >= 0 ? '#10b981' : '#f87171', marginTop: '4px' }}>
            {deltaToday >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
            <span>{deltaToday >= 0 ? `+${deltaToday}` : deltaToday} Triệu VNĐ so với mở phiên</span>
          </div>
        </div>

        {/* Thẻ 2: Khuyến nghị chiến lược mở rộng */}
        <div
          style={{
            gridColumn: 'span 2',
            background:
              liquidityStatus === 'EXPAND'
                ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.18) 0%, rgba(59, 130, 246, 0.15) 100%)'
                : liquidityStatus === 'LOW'
                ? 'rgba(239, 68, 68, 0.15)'
                : 'rgba(16, 185, 129, 0.12)',
            border: `1px solid ${
              liquidityStatus === 'EXPAND' ? '#a855f7' : liquidityStatus === 'LOW' ? '#ef4444' : '#10b981'
            }`,
            borderRadius: '12px',
            padding: '18px 22px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          {liquidityStatus === 'EXPAND' ? (
            <Rocket size={42} color="#c084fc" style={{ flexShrink: 0 }} />
          ) : liquidityStatus === 'LOW' ? (
            <AlertTriangle size={42} color="#f87171" style={{ flexShrink: 0 }} />
          ) : (
            <ShieldCheck size={42} color="#34d399" style={{ flexShrink: 0 }} />
          )}

          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
              {liquidityStatus === 'EXPAND'
                ? '🚀 CÓ DƯ ĐỊA LỚN ĐỂ MỞ RỘNG CỬA HÀNG (TIỀN TÍCH LŨY CAO)'
                : liquidityStatus === 'LOW'
                ? '⚠️ CẢNH BÁO: DÒNG TIỀN Ở MỨC THẤP DƯỚI NGƯỠNG AN TOÀN'
                : '✅ DÒNG TIỀN VẬN HÀNH TỐI ƯU & AN TOÀN'}
            </div>
            <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
              {liquidityStatus === 'EXPAND'
                ? `Lượng tiền mặt của shop hiện đạt ${currentCash} Triệu VNĐ (vượt mốc 260tr). Việc giữ quá nhiều tiền nhàn rỗi trong két không sinh lời tối đa. Bạn nên cân nhắc: 1) Mở thêm điểm bán/chi nhánh mới, 2) Nhập thêm các line hàng mới số lượng lớn để lấy chiết khấu sỉ, 3) Nâng cấp máy móc pha chế CapEx.`
                : liquidityStatus === 'LOW'
                ? `Lượng tiền mặt hiện tại (${currentCash}tr) đang dưới 120tr. Cần hạn chế mua sắm tài sản CapEx, ưu tiên thu hồi công nợ khách sỉ và đẩy mạnh bán các mặt hàng quay vòng vốn nhanh.`
                : `Lượng tiền mặt (${currentCash}tr) nằm trong vùng an toàn lý tưởng (120tr - 260tr). Đảm bảo thanh toán đầy đủ điện nước, nhập kho và lương mà không bị ứ đọng vốn chết.`}
            </div>
          </div>
        </div>
      </div>

      {/* KHUNG BIỂU ĐỒ NẾN CHỨNG KHOÁN (DNSE STYLE) */}
      <div className="glass-panel" style={{ padding: '20px', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
              PGD/CASH - LƯỢNG TIỀN MẶT THEO PHIÊN (30 NGÀY)
            </span>
            <span style={{ fontSize: '0.75rem', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '2px 8px', borderRadius: '4px' }}>
              Đường xanh: MA10 Dòng Tiền
            </span>
          </div>

          {/* Chú giải nến & vùng */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.8rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', background: '#10b981', display: 'inline-block' }} />
              <span>Tiền tăng (Dương)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', background: '#ef4444', display: 'inline-block' }} />
              <span>Tiền giảm (Âm)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '8px', background: 'rgba(168, 85, 247, 0.3)', border: '1px dashed #a855f7', display: 'inline-block' }} />
              <span>Vùng Dư Địa Mở Rộng</span>
            </div>
          </div>
        </div>

        {/* Bảng Tooltip khi rê chuột vào cây nến */}
        {hoveredCandle && (
          <div
            style={{
              position: 'absolute',
              top: '60px',
              left: '30px',
              background: 'rgba(10, 14, 23, 0.95)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '10px 14px',
              zIndex: 10,
              fontSize: '0.84rem',
              display: 'flex',
              gap: '16px',
              pointerEvents: 'none',
              boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
            }}
          >
            <div>Ngày: <b style={{ color: 'var(--text-primary)' }}>{hoveredCandle.time}</b></div>
            <div>Mở phiên: <b>{hoveredCandle.open} tr</b></div>
            <div>Đỉnh tiền (High): <b style={{ color: '#10b981' }}>{hoveredCandle.high} tr</b></div>
            <div>Đáy tiền (Low): <b style={{ color: '#f87171' }}>{hoveredCandle.low} tr</b></div>
            <div>Đóng phiên: <b style={{ color: hoveredCandle.close >= hoveredCandle.open ? '#10b981' : '#f87171' }}>{hoveredCandle.close} tr</b></div>
            <div>Biến động: <b style={{ color: hoveredCandle.close >= hoveredCandle.open ? '#10b981' : '#f87171' }}>
              {hoveredCandle.close - hoveredCandle.open >= 0 ? `+${hoveredCandle.close - hoveredCandle.open}` : hoveredCandle.close - hoveredCandle.open} tr
            </b></div>
          </div>
        )}

        {/* Canvas vẽ nến */}
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{ width: '100%', height: '360px', display: 'block', cursor: 'crosshair' }}
        />
      </div>
    </div>
  );
};
