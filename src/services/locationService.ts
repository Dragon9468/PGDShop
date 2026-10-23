// ==============================================================================
// PGDShop - Quy Chuẩn Mã Vị Trí Kệ Trưng Bày & Vị Trí Kho Hàng
// ==============================================================================

import { RetailDisplayType, WarehouseRackType } from '../types';

export interface DisplayTypeInfo {
  code: RetailDisplayType;
  name: string;
  icon: string;
  shortDesc: string;
  example: string;
}

export const DISPLAY_TYPES: Record<RetailDisplayType, DisplayTypeInfo> = {
  KE: {
    code: 'KE',
    name: 'Kệ hàng',
    icon: '🗄️',
    shortDesc: 'Kệ trưng bày tiêu chuẩn nhiều tầng',
    example: 'KE01-T1A (Kệ 01 Tầng 1 Ô A) hoặc KE01-T1 (Full tầng)',
  },
  TL: {
    code: 'TL',
    name: 'Tủ lạnh',
    icon: '🧊',
    shortDesc: 'Tủ đông / Tủ kem lạnh',
    example: 'TL01-T1 (Tủ lạnh 01 Tầng 1)',
  },
  TM: {
    code: 'TM',
    name: 'Tủ mát',
    icon: '🥛',
    shortDesc: 'Tủ mát ướp lạnh nước ngọt, sữa tươi, yaourt',
    example: 'TM01-T1A (Tủ mát 01 Tầng 1 Ô A)',
  },
  MO: {
    code: 'MO',
    name: 'Móc treo (Pegboard)',
    icon: '🪝',
    shortDesc: 'Bảng pegboard móc treo đồ snack, bao bì, phụ kiện',
    example: 'MO01-T1A (Móc treo 01 Hàng 1 Móc A)',
  },
  RO: {
    code: 'RO',
    name: 'Rổ trưng bày',
    icon: '🧺',
    shortDesc: 'Rổ đựng trái cây, củ quả tươi',
    example: 'RO01-A (Rổ 01 Ngăn A)',
  },
  NC: {
    code: 'NC',
    name: 'Máy bán nước tự động',
    icon: '🥤',
    shortDesc: 'Máy bán nước tự động (Vending Machine)',
    example: 'NC01-T1A (Máy bán nước 01 Khay 1 Ô A)',
  },
};

export const WAREHOUSE_RACK_TYPES: Record<WarehouseRackType, { name: string; icon: string; desc: string }> = {
  KS: { name: 'Kệ sắt', icon: '🏗️', desc: 'Kệ sắt kho chịu lực cao (thùng, bao sỉ)' },
  KL: { name: 'Kho lạnh', icon: '❄️', desc: 'Kho mát / Tủ đông lưu kho nguyên liệu tươi' },
  PL: { name: 'Pallet sàn', icon: '📦', desc: 'Pallet xếp hàng tải trọng lớn' },
};

/**
 * Sinh mã vị trí Kệ theo đúng quy chuẩn:
 * - Kệ 01, Tầng 1, Ô A -> KE01-T1A
 * - Kệ 01, Tầng 1, chiếm full tầng (không chia ô) -> KE01-T1
 * - Tủ mát 01, Tầng 1, Ô A -> TM01-T1A
 * - Rổ 01, Ô A -> RO01-A
 */
export function generateShelfCode(
  type: RetailDisplayType = 'KE',
  number: string = '01',
  tier?: number | string,
  slot?: string
): string {
  const cleanType = type.trim().toUpperCase();
  const cleanNum = (number || '01').toString().padStart(2, '0');
  const cleanSlot = (slot || '').trim().toUpperCase();

  if (cleanType === 'RO') {
    // Rổ trái cây thường chỉ có số rổ và ô
    return cleanSlot ? `RO${cleanNum}-${cleanSlot}` : `RO${cleanNum}`;
  }

  const tierNum = tier ? Number(tier) : 1;
  const tierPart = `-T${tierNum}`;
  const slotPart = cleanSlot ? cleanSlot : '';

  return `${cleanType}${cleanNum}${tierPart}${slotPart}`;
}

/**
 * Diễn giải mã vị trí Kệ ra tiếng Việt rõ ràng, dễ hiểu:
 * KE01-T1A -> "Kệ 01 • Tầng 1 • Ô A"
 * KE01-T1  -> "Kệ 01 • Tầng 1 (Full tầng)"
 * TM01-T1A -> "Tủ mát 01 • Tầng 1 • Ô A"
 * TL01-T1  -> "Tủ lạnh 01 • Tầng 1"
 * MO01-T1A -> "Móc treo 01 • Tầng 1 • Ô A"
 * RO01-A   -> "Rổ 01 • Ô A"
 * NC01-T1A -> "Máy bán nước 01 • Tầng 1 • Ô A"
 */
export function explainShelfCode(code?: string): string {
  if (!code) return '';
  const trimmed = code.trim().toUpperCase();

  // Pattern: RO01-A hoặc RO01
  const roMatch = trimmed.match(/^RO(\d+)(?:-([A-Z]))?$/);
  if (roMatch) {
    const [, num, slot] = roMatch;
    return `Rổ ${num}${slot ? ` • Ô ${slot}` : ''}`;
  }

  // Pattern: KE01-T1A, TM01-T1, TL01-T2B, MO01-T1, NC01-T1A...
  const match = trimmed.match(/^(KE|TL|TM|MO|NC)(\d+)(?:-T(\d+))?([A-Z])?$/);
  if (!match) return code;

  const [, typeRaw, num, tier, slot] = match;
  const type = typeRaw as RetailDisplayType;
  const typeName = DISPLAY_TYPES[type]?.name || type;

  let result = `${typeName} ${num}`;
  if (tier) {
    result += ` • Tầng ${tier}`;
  }
  if (slot) {
    result += ` • Ô ${slot}`;
  } else if (tier) {
    result += ' (Full tầng)';
  }
  return result;
}

/**
 * Sinh mã vị trí Kho theo đúng quy chuẩn:
 * - Kho 01, Kệ sắt 01 -> KHO01-KS01
 * - Kho 01, Kho lạnh 01 -> KHO01-KL01
 * - Kho 02, Kệ sắt 03 -> KHO02-KS03
 */
export function generateWarehouseCode(
  warehouseNumber: string = '01',
  rackType: WarehouseRackType = 'KS',
  rackNumber: string = '01'
): string {
  const whNum = (warehouseNumber || '01').toString().padStart(2, '0');
  const rType = (rackType || 'KS').trim().toUpperCase();
  const rNum = (rackNumber || '01').toString().padStart(2, '0');

  return `KHO${whNum}-${rType}${rNum}`;
}

/**
 * Diễn giải mã vị trí Kho ra tiếng Việt:
 * KHO01-KS01 -> "Kho 01 • Kệ sắt 01"
 * KHO01-KL01 -> "Kho 01 • Kho lạnh 01"
 */
export function explainWarehouseCode(code?: string): string {
  if (!code) return '';
  const trimmed = code.trim().toUpperCase();

  const match = trimmed.match(/^KHO(\d+)-(KS|KL|PL)(\d+)$/);
  if (!match) return code;

  const [, whNum, rackType, rackNum] = match;
  const rackName = WAREHOUSE_RACK_TYPES[rackType as WarehouseRackType]?.name || rackType;
  return `Kho ${whNum} • ${rackName} ${rackNum}`;
}

export const locationService = {
  DISPLAY_TYPES,
  WAREHOUSE_RACK_TYPES,
  generateShelfCode,
  explainShelfCode,
  generateWarehouseCode,
  explainWarehouseCode,
};
