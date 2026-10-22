export interface ThemeOption {
  id: string
  name: string
  category: 'Light' | 'Dark' | 'Gradient' | 'Classic'
  primary: string
  secondary: string
  bg: string
  desc: string
}

export const CATEGORIES: ('Light' | 'Dark' | 'Gradient' | 'Classic')[] = ['Light', 'Dark', 'Gradient', 'Classic']

export const THEMES: ThemeOption[] = [
  // ================= ☀️ LIGHT PLANET (10 THEMES) =================
  { id: 'clean-corporate', name: 'Clean Corporate', category: 'Light', primary: '#005696', secondary: '#0284c7', bg: '#f8fafc', desc: 'Giao diện Sáng Chuẩn Doanh nghiệp Xanh Dương Hiện đại' },
  { id: 'soft-pastel', name: 'Soft Pastel', category: 'Light', primary: '#ec4899', secondary: '#8b5cf6', bg: '#faf7f5', desc: 'Giao diện Nền Kem Nhẹ nhàng phối sắc Pastel' },
  { id: 'nordic-light', name: 'Nordic Light', category: 'Light', primary: '#0f766e', secondary: '#0ea5e9', bg: '#f0fdf4', desc: 'Cảm hứng Bắc Âu Xanh Băng Băng giá Thanh lịch' },
  { id: 'paper-cream', name: 'Paper Cream', category: 'Light', primary: '#d97706', secondary: '#b45309', bg: '#fffbe6', desc: 'Nền Giấy Kem Cổ Điển Ấm Áp Dịu Mắt' },
  { id: 'solarized-light', name: 'Solarized Light', category: 'Light', primary: '#b58900', secondary: '#cb4b16', bg: '#fdf6e3', desc: 'Tông Màu Solarized Hổ Phách Sang Trọng' },
  { id: 'emerald-day', name: 'Emerald Day', category: 'Light', primary: '#059669', secondary: '#10b981', bg: '#ecfdf5', desc: 'Ngọc Lục Bảo Tươi Mới Ngày Nắng' },
  { id: 'rose-gold-light', name: 'Rose Gold Light', category: 'Light', primary: '#e11d48', secondary: '#f43f5e', bg: '#fff1f2', desc: 'Sắc Vàng Hồng Tinh Tế Nữ Tính' },
  { id: 'cyber-white', name: 'Cyber White', category: 'Light', primary: '#4f46e5', secondary: '#06b6d4', bg: '#f8fafc', desc: 'Trắng Bạc Tương Lai Điểm Xuyết Cyber Blue' },
  { id: 'sunset-pearl', name: 'Sunset Pearl', category: 'Light', primary: '#f97316', secondary: '#e11d48', bg: '#fff7ed', desc: 'Ngọc Trai Hoàng Hôn Rạng Rỡ' },
  { id: 'breeze-cyan', name: 'Breeze Cyan', category: 'Light', primary: '#0891b2', secondary: '#0284c7', bg: '#ecfeff', desc: 'Gió Biển Cyan Tươi Mát Sảng Khoái' },

  // ================= 🌙 DARK PLANET (10 THEMES) =================
  { id: 'amber-dark', name: 'Amber Dark', category: 'Dark', primary: '#F58220', secondary: '#ff9933', bg: '#0d0e12', desc: 'Phong cách Tối giản Hiện đại điểm xuyết Cam Hổ Phách' },
  { id: 'matrix-green', name: 'Matrix Green', category: 'Dark', primary: '#76fe28', secondary: '#10b981', bg: '#040d06', desc: 'Nền Ma trận Đen huyền bí với Ma thuật Xanh Neon' },
  { id: 'dracula-violet', name: 'Dracula Violet', category: 'Dark', primary: '#a855f7', secondary: '#444eee', bg: '#130f1c', desc: 'Nền Tím Đêm Quyến rũ với Accent Tím Thạch anh' },
  { id: 'midnight-onyx', name: 'Midnight Onyx', category: 'Dark', primary: '#3b82f6', secondary: '#1d4ed8', bg: '#090a0f', desc: 'Đen Tuyền Đá Onyx Đêm Nửa Đêm' },
  { id: 'deep-obsidian', name: 'Deep Obsidian', category: 'Dark', primary: '#64748b', secondary: '#475569', bg: '#020408', desc: 'Đá Núi Lửa Obsidian Thâm Trầm Huyền Bí' },
  { id: 'sapphire-night', name: 'Sapphire Night', category: 'Dark', primary: '#2563eb', secondary: '#3b82f6', bg: '#030712', desc: 'Lam Ngọc Đêm Huyền Diệu Sâu Thẳm' },
  { id: 'emerald-night', name: 'Emerald Night', category: 'Dark', primary: '#10b981', secondary: '#059669', bg: '#021008', desc: 'Lục Bảo Đêm Huyền Bí Rực Sáng' },
  { id: 'slate-charcoal', name: 'Slate Charcoal', category: 'Dark', primary: '#94a3b8', secondary: '#cbd5e1', bg: '#0f172a', desc: 'Than Thạch Anh Thanh Lịch Hiện Đại' },
  { id: 'neon-noir', name: 'Neon Noir', category: 'Dark', primary: '#f43f5e', secondary: '#fb7185', bg: '#110509', desc: 'Đêm Hồng Neon Cyberpunk Noir' },
  { id: 'twilight-blue', name: 'Twilight Blue', category: 'Dark', primary: '#38bdf8', secondary: '#818cf8', bg: '#0b132b', desc: 'Chạng Vạng Xanh Thạch Anh Sâu Thẳm' },

  // ================= 🌈 GRADIENT PLANET (10 THEMES) =================
  { id: 'cyber-neon', name: 'Cyber Neon', category: 'Gradient', primary: '#76fe28', secondary: '#444eee', bg: '#090d16', desc: 'Gradient Radial Tím mờ chuyển Xanh Neon Cyberpunk' },
  { id: 'ocean-deep', name: 'Ocean Deep', category: 'Gradient', primary: '#06b6d4', secondary: '#1e40af', bg: '#030712', desc: 'Gradient Đại dương thẩm thẫm Xanh Lam - Cyan' },
  { id: 'sunset-glow', name: 'Sunset Glow', category: 'Gradient', primary: '#F58220', secondary: '#e11d48', bg: '#09090b', desc: 'Gradient Hoàng hôn Cam Hổ Phách hòa sắc Hồng Rạng rỡ' },
  { id: 'aurora-night', name: 'Aurora Night', category: 'Gradient', primary: '#84cc16', secondary: '#6366f1', bg: '#020617', desc: 'Gradient Cực quang Huyền ảo Tím thạch anh - Xanh chanh' },
  { id: 'hyper-violet', name: 'Hyper Violet', category: 'Gradient', primary: '#c084fc', secondary: '#ec4899', bg: '#0f051d', desc: 'Gradient Tím Siêu Cực Hòa Sắc Hồng Neon' },
  { id: 'dragon-flame', name: 'Dragon Flame', category: 'Gradient', primary: '#ff4500', secondary: '#ffd700', bg: '#140300', desc: 'Gradient Rồng Lửa Hỏa Thần Cam Đỏ Kim' },
  { id: 'emerald-silk', name: 'Emerald Silk', category: 'Gradient', primary: '#34d399', secondary: '#0284c7', bg: '#021410', desc: 'Gradient Lụa Lục Bảo Chuyển Lam Ngọc' },
  { id: 'golden-hour', name: 'Golden Hour', category: 'Gradient', primary: '#fbbf24', secondary: '#f59e0b', bg: '#181000', desc: 'Gradient Giờ Vàng Rực Rỡ Ánh Kim' },
  { id: 'electric-pastel', name: 'Electric Pastel', category: 'Gradient', primary: '#f472b6', secondary: '#38bdf8', bg: '#120b18', desc: 'Gradient Pastel Điện Tử Ngọt Ngào' },
  { id: 'royal-velvet', name: 'Royal Velvet', category: 'Gradient', primary: '#a855f7', secondary: '#3b82f6', bg: '#0c071e', desc: 'Gradient Nhung Hoàng Gia Tím Xanh Đẳng Cấp' },

  // ================= 🏛️ CLASSIC PLANET (10 THEMES) =================
  { id: 'classic-amber', name: 'Classic Amber', category: 'Classic', primary: '#d97706', secondary: '#b45309', bg: '#1c1917', desc: 'Tông Hổ Phách Màn Hình CRT Cổ Điển Dịu Mắt' },
  { id: 'classic-monochrome', name: 'Monochrome High-Contrast', category: 'Classic', primary: '#ffffff', secondary: '#a1a1aa', bg: '#000000', desc: 'Đen Trắng Tương Phản Sắc Nét Chuẩn Mực' },
  { id: 'classic-sepia', name: 'Vintage Sepia', category: 'Classic', primary: '#78350f', secondary: '#92400e', bg: '#fef3c7', desc: 'Nền Giấy Sách Cũ Sepia Ấm Áp Hoài Cổ' },
  { id: 'classic-macintosh', name: 'Macintosh Platinum', category: 'Classic', primary: '#2563eb', secondary: '#475569', bg: '#e2e8f0', desc: 'Giao Diện Mac OS 9 / System 7 Xám Bạc Thanh Lịch' },
  { id: 'classic-win95', name: 'Win95 Classic', category: 'Classic', primary: '#008080', secondary: '#000080', bg: '#c0c0c0', desc: 'Tông Xanh Teal & Xám Tro Huyền Thoại Windows 95' },
  { id: 'classic-terminal', name: 'CRT Green Matrix', category: 'Classic', primary: '#22c55e', secondary: '#15803d', bg: '#022c22', desc: 'Màn Hình Xanh Lá Vi Tính Thập Niên 80' },
  { id: 'classic-blueprint', name: 'Blueprint Navy', category: 'Classic', primary: '#38bdf8', secondary: '#60a5fa', bg: '#0b192c', desc: 'Nền Xanh Bản Vẽ Kỹ Thuật Kiến Trúc' },
  { id: 'classic-paperback', name: 'Paperback Newsprint', category: 'Classic', primary: '#18181b', secondary: '#52525b', bg: '#f4f4f5', desc: 'Nền Báo Giấy In Ấn Tối Giản Thanh Lịch' },
  { id: 'classic-nordic', name: 'Nordic Frost', category: 'Classic', primary: '#0284c7', secondary: '#0369a1', bg: '#e0f2fe', desc: 'Xám Xanh Băng Tuyết Bắc Âu Cổ Điển' },
  { id: 'classic-emerald', name: 'Vintage Emerald', category: 'Classic', primary: '#047857', secondary: '#065f46', bg: '#ecfdf5', desc: 'Ngọc Bích Ngân Hàng Cổ Điển Thập Niên 70' },
]

export const isLightColor = (hex: string) => {
  if (!hex || hex === 'transparent') return false
  if (hex.startsWith('rgb')) return false
  const cleanHex = hex.replace('#', '')
  if (cleanHex.length !== 6) return false
  const r = parseInt(cleanHex.substring(0, 2), 16)
  const g = parseInt(cleanHex.substring(2, 4), 16)
  const b = parseInt(cleanHex.substring(4, 6), 16)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  return brightness > 155
}
