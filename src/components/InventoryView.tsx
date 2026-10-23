import React, { useState, useEffect } from 'react';
import {
  WarehouseItem,
  WarehouseLocation,
  InventoryTransaction,
  Product,
  WarehouseBulkUnit,
  WarehouseRackType,
} from '../types';
import { storageService } from '../services/storageService';
import {
  explainWarehouseCode,
  generateWarehouseCode,
  explainShelfCode,
  WAREHOUSE_RACK_TYPES,
} from '../services/locationService';
import {
  Warehouse,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Link2,
  AlertCircle,
  Package,
  MapPin,
  Search,
  X,
  Edit,
  Trash2,
  Lock,
  Unlock,
  Send,
  FileText,
  Clock,
  CheckCircle,
  Truck,
  Image as ImageIcon,
  Coffee,
} from 'lucide-react';

const BULK_PRESET_IMAGES = [
  { label: 'Bao Cà phê Robusta 30kg', url: 'https://images.unsplash.com/photo-1587734195503-904fca47e0e9?w=400&auto=format&fit=crop&q=80' },
  { label: 'Bao Cà phê Arabica 20kg', url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&auto=format&fit=crop&q=80' },
  { label: 'Thùng Sữa đặc 48 hộp', url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&auto=format&fit=crop&q=80' },
  { label: 'Thùng Ly giấy 1000 cái', url: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=400&auto=format&fit=crop&q=80' },
  { label: 'Thùng Giấy in K80 50 cuộn', url: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=400&auto=format&fit=crop&q=80' },
  { label: 'Can 5L Siro Đào', url: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&auto=format&fit=crop&q=80' },
  { label: 'Thùng Nước ngọt 24 lon', url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&auto=format&fit=crop&q=80' },
];

export const InventoryView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'items' | 'locations'>('items');
  const [warehouseItems, setWarehouseItems] = useState<WarehouseItem[]>([]);
  const [warehouseLocations, setWarehouseLocations] = useState<WarehouseLocation[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // Tìm kiếm & Lọc
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Khóa an toàn: Mặc định khóa để ẩn nút sửa/xóa hàng trong kho
  const [isLocked, setIsLocked] = useState(true);

  // Modal / Menu riêng xem LỊCH SỬ NHẬP XUẤT KHO theo yêu cầu người dùng
  const [isHistoryMenuOpen, setIsHistoryMenuOpen] = useState(false);
  const [historyFilterType, setHistoryFilterType] = useState<'ALL' | 'IN' | 'OUT' | 'OUT_SHELF' | 'OUT_PREP'>('ALL');

  // Modal Tạo Phiếu Nhập Kho Mới
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importForm, setImportForm] = useState({
    supplier: 'Tổng Kho Cà Phê Ban Mê',
    name: '',
    category: 'NguyenLieu_FB' as WarehouseItem['category'],
    bulkUnit: 'Bao' as WarehouseBulkUnit,
    packageSpec: 'Bao 30kg hạt rang mộc',
    quantity: 5,
    unitPrice: 4800000,
    locationCode: 'KHO01-KS02',
    unitsPerBulk: 60,
    notes: 'Nhập hàng sỉ kho định kỳ',
    imageUrl: '',
  });

  // Modal Xuất Kho (Lên Kệ Bán Lẻ HOẶC Cho Quầy Chế Biến)
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferringItem, setTransferringItem] = useState<WarehouseItem | null>(null);
  const [transferType, setTransferType] = useState<'SHELF' | 'PREPARATION'>('SHELF');
  const [transferBulkQty, setTransferBulkQty] = useState(1);
  const [targetShelfCode, setTargetShelfCode] = useState('KE01-T1A');
  const [prepDepartment, setPrepDepartment] = useState('Quầy Pha Chế (Bar / Cà phê / Trà)');
  const [prepTargetRecipe, setPrepTargetRecipe] = useState('');
  const [prepNotes, setPrepNotes] = useState('');

  // Modal Thêm Vị Trí Kho Mới (Chuẩn: KHO01-KS01)
  const [isAddLocationModalOpen, setIsAddLocationModalOpen] = useState(false);
  const [whNum, setWhNum] = useState('01');
  const [whRackType, setWhRackType] = useState<WarehouseRackType>('KS');
  const [whRackNum, setWhRackNum] = useState('01');
  const [whZone, setWhZone] = useState('Khu A (Hàng Khô / Đóng Gói Sỉ)');
  const [whCapacity, setWhCapacity] = useState(50);
  const [whNotes, setWhNotes] = useState('');

  const previewWhCode = generateWarehouseCode(whNum, whRackType, whRackNum);
  const previewWhDesc = explainWarehouseCode(previewWhCode);

  // Modal Thêm / Sửa Mặt Hàng Kho
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WarehouseItem | null>(null);
  const [itemForm, setItemForm] = useState<Partial<WarehouseItem>>({
    sku: '',
    name: '',
    category: 'NguyenLieu_FB',
    bulkUnit: 'Thùng',
    packageSpec: 'Thùng 24 lon',
    importPrice: 195000,
    stockQuantity: 10,
    minStock: 2,
    locationCode: 'KHO01-KS01',
    supplier: '',
    unitsPerBulk: 24,
    imageUrl: '',
  });

  const reloadData = () => {
    setWarehouseItems(storageService.getWarehouseItems());
    setWarehouseLocations(storageService.getWarehouseLocations());
    setTransactions(storageService.getInventoryTransactions());
    setProducts(storageService.getProducts());
  };

  useEffect(() => {
    reloadData();
  }, []);

  const totalInCost = transactions
    .filter((t) => t.type === 'IN')
    .reduce((sum, t) => sum + t.totalCost, 0);

  // Lọc mặt hàng trong kho
  const filteredItems = warehouseItems.filter((item) => {
    const matchCat = selectedCategory === 'ALL' || item.category === selectedCategory;
    const matchQuery =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.locationCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.packageSpec.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchQuery;
  });

  // Mở modal xuất kho (lên kệ hoặc cho chế biến)
  const handleOpenTransfer = (item: WarehouseItem, defaultType: 'SHELF' | 'PREPARATION' = 'SHELF') => {
    setTransferringItem(item);
    setTransferBulkQty(1);
    setTransferType(defaultType);
    const matched = products.find((p) => p.id === item.linkedShelfProductId);
    setTargetShelfCode(matched?.shelfCode || 'KE01-T1A');
    setPrepDepartment(item.category === 'BaoBi' ? 'Quầy Đóng Gói & Pha Chế' : 'Quầy Pha Chế (Bar / Cà phê / Trà)');
    setPrepTargetRecipe('');
    setPrepNotes('');
    setIsTransferModalOpen(true);
  };

  // Xác nhận xuất kho (lên kệ hoặc cho chế biến)
  const handleConfirmTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferringItem || transferBulkQty <= 0) return;

    if (transferBulkQty > transferringItem.stockQuantity) {
      alert(`Trong kho chỉ còn ${transferringItem.stockQuantity} ${transferringItem.bulkUnit}, không đủ để xuất ${transferBulkQty}!`);
      return;
    }

    if (transferType === 'SHELF') {
      const success = storageService.transferWarehouseToShelf(
        transferringItem.id,
        transferBulkQty,
        targetShelfCode
      );

      if (success) {
        alert(`Đã xuất thành công ${transferBulkQty} ${transferringItem.bulkUnit} (${transferBulkQty * (transferringItem.unitsPerBulk || 1)} đơn vị lẻ) ra Kệ ${targetShelfCode}!`);
        setIsTransferModalOpen(false);
        reloadData();
      }
    } else {
      const success = storageService.transferWarehouseToPreparation(
        transferringItem.id,
        transferBulkQty,
        prepDepartment,
        prepNotes || (prepTargetRecipe ? `Xuất cho món: ${prepTargetRecipe}` : undefined)
      );

      if (success) {
        alert(`Đã xuất thành công ${transferBulkQty} ${transferringItem.bulkUnit} (${transferBulkQty * (transferringItem.unitsPerBulk || 1)} đơn vị) cho ${prepDepartment}!`);
        setIsTransferModalOpen(false);
        reloadData();
      }
    }
  };

  // Tạo phiếu nhập kho mới từ nhà cung cấp
  const handleCreateImportSlip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!importForm.name || !importForm.supplier) return;

    const slipCode = `NK-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${Math.floor(10 + Math.random() * 90)}`;
    const lineTotal = importForm.quantity * importForm.unitPrice;

    // 1. Ghi log phiếu nhập kho
    const newTx: InventoryTransaction = {
      id: 'inv-' + Date.now(),
      slipCode,
      type: 'IN',
      supplier: importForm.supplier,
      totalCost: lineTotal,
      notes: importForm.notes || `Nhập ${importForm.quantity} ${importForm.bulkUnit} ${importForm.name}`,
      items: [
        {
          productName: `${importForm.name} (${importForm.packageSpec})`,
          unit: importForm.bulkUnit,
          quantity: importForm.quantity,
          costPrice: importForm.unitPrice,
          total: lineTotal,
        },
      ],
      createdAt: new Date().toISOString().slice(0, 10),
    };
    storageService.addInventoryTransaction(newTx);

    // 2. Tăng tồn kho mặt hàng kho (hoặc thêm mặt hàng kho mới nếu chưa có)
    const existing = warehouseItems.find((w) => w.name.toLowerCase() === importForm.name.toLowerCase());
    if (existing) {
      existing.stockQuantity += importForm.quantity;
      existing.importPrice = importForm.unitPrice;
      storageService.updateWarehouseItem(existing);
    } else {
      const newItem: WarehouseItem = {
        id: 'wh-item-' + Date.now(),
        sku: 'WH-' + Math.floor(1000 + Math.random() * 9000),
        name: importForm.name,
        category: importForm.category,
        bulkUnit: importForm.bulkUnit,
        packageSpec: importForm.packageSpec,
        importPrice: importForm.unitPrice,
        stockQuantity: importForm.quantity,
        minStock: 2,
        locationCode: importForm.locationCode,
        supplier: importForm.supplier,
        unitsPerBulk: importForm.unitsPerBulk || 1,
        imageUrl: importForm.imageUrl,
      };
      storageService.addWarehouseItem(newItem);
    }

    setIsImportModalOpen(false);
    reloadData();
    alert(`Đã tạo phiếu nhập kho ${slipCode} thành công! Chi phí đã tự động liên kết sang OpEx.`);
  };

  // Mở modal thêm mặt hàng kho
  const handleOpenAddItem = () => {
    setEditingItem(null);
    setItemForm({
      sku: 'WH-' + Math.floor(1000 + Math.random() * 9000),
      name: '',
      category: 'HangKho_DongGoi',
      bulkUnit: 'Thùng',
      packageSpec: 'Thùng 24 lon 320ml',
      importPrice: 195000,
      stockQuantity: 10,
      minStock: 2,
      locationCode: 'KHO01-KS01',
      supplier: 'Đại Lý Phân Phối Sỉ',
      unitsPerBulk: 24,
      imageUrl: '',
    });
    setIsItemModalOpen(true);
  };

  // Mở modal sửa mặt hàng kho
  const handleOpenEditItem = (item: WarehouseItem) => {
    setEditingItem(item);
    setItemForm({ ...item });
    setIsItemModalOpen(true);
  };

  // Lưu mặt hàng kho
  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemForm.name || !itemForm.sku) return;

    if (editingItem) {
      const updated: WarehouseItem = {
        ...editingItem,
        ...(itemForm as WarehouseItem),
      };
      storageService.updateWarehouseItem(updated);
    } else {
      const newItem: WarehouseItem = {
        id: 'wh-item-' + Date.now(),
        sku: itemForm.sku!,
        name: itemForm.name!,
        category: itemForm.category || 'HangKho_DongGoi',
        bulkUnit: itemForm.bulkUnit || 'Thùng',
        packageSpec: itemForm.packageSpec || 'Thùng sỉ',
        importPrice: Number(itemForm.importPrice) || 0,
        stockQuantity: Number(itemForm.stockQuantity) || 0,
        minStock: Number(itemForm.minStock) || 2,
        locationCode: itemForm.locationCode || 'KHO01-KS01',
        supplier: itemForm.supplier || '',
        unitsPerBulk: Number(itemForm.unitsPerBulk) || 1,
        imageUrl: itemForm.imageUrl || '',
      };
      storageService.addWarehouseItem(newItem);
    }

    setIsItemModalOpen(false);
    reloadData();
  };

  // Xóa mặt hàng kho
  const handleDeleteItem = (id: string, name: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa mặt hàng kho "${name}"?`)) {
      storageService.deleteWarehouseItem(id);
      reloadData();
    }
  };

  // Thêm vị trí kho mới theo đúng quy chuẩn: KHO01-KS01
  const handleAddWarehouseLocation = (e: React.FormEvent) => {
    e.preventDefault();
    const finalCode = previewWhCode;
    if (!finalCode) return;

    const newLoc: WarehouseLocation = {
      id: 'wh-loc-' + Date.now(),
      code: finalCode,
      warehouseNumber: whNum,
      rackType: whRackType,
      rackNumber: whRackNum,
      zone: whZone,
      tier: 1,
      capacity: Number(whCapacity) || 50,
      currentCount: 0,
      status: 'ACTIVE',
      notes: whNotes || previewWhDesc,
    };

    const updated = [...warehouseLocations, newLoc];
    setWarehouseLocations(updated);
    storageService.saveWarehouseLocations(updated);
    setIsAddLocationModalOpen(false);
    setWhNotes('');
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Warehouse size={28} color="#6366f1" />
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              4. QUẢN LÝ KHO HÀNG (QUY CÁCH SỈ: THÙNG / KG / LÍT / CAN)
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Quản lý hàng lưu kho theo vị trí ô kệ kho, giá nhập sỉ và quy cách sỉ lớn (Thùng, Bao, Kg, Lít). Xuất kho lên kệ bán lẻ.
          </p>
        </div>

        {/* CỤM NÚT THAO TÁC & NÚT MỞ MENU LỊCH SỬ NHẬP KHO RIÊNG */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* NÚT MỞ MENU LỊCH SỬ THEO YÊU CẦU NGƯỜI DÙNG */}
          <button
            onClick={() => setIsHistoryMenuOpen(true)}
            className="btn"
            style={{
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)',
              border: '1.5px solid #6366f1',
              color: '#a5b4fc',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 14px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.88rem',
            }}
          >
            <FileText size={17} />
            <span>📜 Lịch Sử Nhập / Xuất Kho ({transactions.length})</span>
          </button>

          {/* Nút Lock / Unlock */}
          <button
            onClick={() => setIsLocked(!isLocked)}
            className="btn"
            style={{
              background: isLocked ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.18)',
              border: isLocked ? '1.5px solid #10b981' : '1.5px solid #ef4444',
              color: isLocked ? '#10b981' : '#f87171',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 14px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.88rem',
            }}
            title={isLocked ? 'Đang Khóa: Ẩn các nút sửa và xóa hàng kho để chống bấm nhầm' : 'Đang Mở Khóa: Cho phép chỉnh sửa'}
          >
            {isLocked ? <Lock size={16} /> : <Unlock size={16} />}
            <span>{isLocked ? '🔒 Đang Khóa Thao Tác' : '🔓 Đã Mở Khóa'}</span>
          </button>

          {/* Nút Tạo Phiếu Nhập Kho */}
          <button
            className="btn btn-primary"
            onClick={() => setIsImportModalOpen(true)}
            style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)' }}
          >
            <Plus size={18} />
            <span>Tạo Phiếu Nhập Kho Mới</span>
          </button>

          {!isLocked && (
            activeTab === 'locations' ? (
              <button
                className="btn btn-secondary"
                onClick={() => setIsAddLocationModalOpen(true)}
                style={{ borderColor: '#818cf8', color: '#a5b4fc' }}
              >
                <Plus size={16} />
                <span>Thêm Vị Trí Kho Mới</span>
              </button>
            ) : (
              <button className="btn btn-secondary" onClick={handleOpenAddItem}>
                <Plus size={16} />
                <span>Thêm Mặt Hàng Kho</span>
              </button>
            )
          )}
        </div>
      </div>

      {/* THANH THÔNG TIN QUY CHUẨN MÃ VỊ TRÍ KHO HÀNG */}
      <div
        style={{
          background: 'rgba(99, 102, 241, 0.08)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          borderRadius: '10px',
          padding: '12px 16px',
          marginBottom: '18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          fontSize: '0.86rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#a5b4fc', fontWeight: 800 }}>
          <MapPin size={18} />
          <span>QUY CHUẨN MÃ VỊ TRÍ KHO HÀNG (ĐÃ CẬP NHẬT)</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', color: 'var(--text-primary)', lineHeight: 1.5 }}>
          <span><b>🏗️ Định dạng chuẩn:</b> <code style={{ color: '#a5b4fc', fontWeight: 800 }}>KHO01-KS01</code> 👉 <i>Dịch ra: Kho 01 (hỗ trợ nhiều kho/cửa hàng sau này) • Kệ sắt 01</i></span>
          <span>• <b>KS:</b> Kệ sắt chịu lực (chứa thùng sỉ, bao lớn)</span>
          <span>• <b>KL:</b> Kho lạnh / Tủ mát lưu kho</span>
          <span>• <b>PL:</b> Pallet sàn</span>
        </div>
      </div>

      {/* CỤM TAB CHUYỂN ĐỔI: HÀNG TRONG KHO <-> SƠ ĐỒ VỊ TRÍ KHO */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '18px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
        <button
          onClick={() => setActiveTab('items')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '10px',
            border: activeTab === 'items' ? '1.5px solid #6366f1' : '1px solid var(--border-color)',
            background: activeTab === 'items' ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-card)',
            color: activeTab === 'items' ? '#a5b4fc' : 'var(--text-primary)',
            fontWeight: 800,
            cursor: 'pointer',
            fontSize: '0.92rem',
          }}
        >
          <Package size={18} />
          <span>Hàng Lưu Kho ({warehouseItems.length} Mặt Hàng)</span>
        </button>

        <button
          onClick={() => setActiveTab('locations')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '10px',
            border: activeTab === 'locations' ? '1.5px solid #6366f1' : '1px solid var(--border-color)',
            background: activeTab === 'locations' ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-card)',
            color: activeTab === 'locations' ? '#a5b4fc' : 'var(--text-primary)',
            fontWeight: 800,
            cursor: 'pointer',
            fontSize: '0.92rem',
          }}
        >
          <MapPin size={18} />
          <span>Sơ Đồ Vị Trí Kho & Sức Chứa ({warehouseLocations.length} Vị Trí)</span>
        </button>
      </div>

      {/* TAB 1: DANH MỤC HÀNG TRONG KHO (QUY CÁCH THÙNG / KG / LÍT / CAN) */}
      {activeTab === 'items' && (
        <div>
          {/* Thanh tìm kiếm & bộ lọc danh mục sỉ */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px 12px', flex: 1, minWidth: '240px' }}>
              <Search size={18} color="var(--text-secondary)" />
              <input
                type="text"
                placeholder="Tìm hàng kho: SKU, tên mặt hàng, quy cách thùng/kg/lít, vị trí KHO-..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ background: 'transparent', border: 'none', width: '100%', outline: 'none' }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <X size={16} />
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto' }}>
              {[
                { id: 'ALL', label: `Tất Cả Kho (${warehouseItems.length})` },
                { id: 'NguyenLieu_FB', label: '☕ Nguyên Liệu F&B (Bao/Can)' },
                { id: 'HangKho_DongGoi', label: '📦 Hàng Khô & Nước (Thùng/Két)' },
                { id: 'BaoBi', label: '📦 Bao Bì Sỉ (Thùng)' },
                { id: 'VanPhongPham', label: '🧾 Vật Tư Sỉ (Thùng)' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  className={`cat-pill ${selectedCategory === cat.id ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat.id)}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* LƯỚI MẶT HÀNG TRONG KHO (NGANG 4 - 5 Ô TƯƠNG TỰ NHƯ KỆ NHƯNG QUY CÁCH SỈ) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '14px',
            }}
          >
            {filteredItems.map((item) => {
              const isLowStock = item.stockQuantity <= item.minStock;

              return (
                <div
                  key={item.id}
                  className="glass-panel"
                  style={{
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    borderRadius: '12px',
                    border: isLowStock ? '1.5px solid rgba(239, 68, 68, 0.5)' : '1px solid var(--border-color)',
                  }}
                >
                  {/* Ảnh quy cách sỉ */}
                  <div
                    style={{
                      width: '100%',
                      height: '130px',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      position: 'relative',
                      background: 'rgba(99, 102, 241, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '10px',
                    }}
                  >
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                        <Package size={36} strokeWidth={1.5} color="#818cf8" />
                        <div style={{ fontSize: '0.72rem', marginTop: '4px' }}>Chưa có ảnh kho</div>
                      </div>
                    )}

                    {/* Vị trí ô kho badge */}
                    <span
                      style={{
                        position: 'absolute',
                        top: '8px',
                        left: '8px',
                        background: 'rgba(99, 102, 241, 0.85)',
                        backdropFilter: 'blur(8px)',
                        color: '#fff',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontFamily: 'var(--font-mono)',
                        cursor: 'help',
                      }}
                      title={explainWarehouseCode(item.locationCode)}
                    >
                      📍 {item.locationCode}
                    </span>

                    {/* ĐVT quy cách lớn badge */}
                    <span
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        background: 'rgba(0, 0, 0, 0.75)',
                        color: '#fcd34d',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        padding: '3px 8px',
                        borderRadius: '6px',
                      }}
                    >
                      {item.bulkUnit}
                    </span>
                  </div>

                  <div>
                    {/* Tên mặt hàng & SKU */}
                    <div style={{ fontSize: '0.96rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px', lineHeight: 1.3 }}>
                      {item.name}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.74rem', color: '#a5b4fc', marginBottom: '6px' }}>
                      <MapPin size={12} />
                      <span style={{ fontWeight: 600 }}>{explainWarehouseCode(item.locationCode)}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#818cf8', marginBottom: '8px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{item.sku}</span>
                      <span>• {item.packageSpec}</span>
                    </div>

                    {/* Giá nhập sỉ (thùng / kg / lít) */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px', background: 'rgba(255, 255, 255, 0.03)', padding: '6px 10px', borderRadius: '6px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Giá nhập sỉ:</span>
                      <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                        {new Intl.NumberFormat('vi-VN').format(item.importPrice)}đ
                        <span style={{ fontSize: '0.72rem', fontWeight: 500, color: 'var(--text-secondary)' }}>/{item.bulkUnit}</span>
                      </span>
                    </div>

                    {/* Tồn kho theo Thùng / Kg / Lít */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', marginBottom: '10px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Tồn Trong Kho:</span>
                      <span style={{ fontWeight: 800, fontSize: '1.05rem', fontFamily: 'var(--font-mono)', color: isLowStock ? '#f87171' : '#10b981' }}>
                        {item.stockQuantity} {item.bulkUnit}
                        {isLowStock && <span style={{ fontSize: '0.7rem', color: '#f87171', marginLeft: '4px' }}>(Sắp Hết)</span>}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                      NCC: <b>{item.supplier}</b>
                    </div>
                  </div>

                  {/* CỤM NÚT THAO TÁC CHO MẶT HÀNG KHO */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                    {/* Nút Xuất Kệ & Nút Xuất Chế Biến */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                      <button
                        onClick={() => handleOpenTransfer(item, 'SHELF')}
                        className="btn btn-primary"
                        style={{
                          padding: '7px 6px',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                        }}
                        title="Xuất từ Kho ra Kệ hàng bán lẻ (VD: Xuất 1 thùng 24 lon ra kệ)"
                      >
                        <Send size={13} />
                        <span>Xuất Kệ</span>
                      </button>

                      <button
                        onClick={() => handleOpenTransfer(item, 'PREPARATION')}
                        className="btn btn-primary"
                        style={{
                          padding: '7px 6px',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                          border: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                        }}
                        title="Xuất nguyên liệu từ Kho cho Quầy Chế Biến / Pha Chế (F&B)"
                      >
                        <Coffee size={13} />
                        <span>Xuất Chế Biến</span>
                      </button>
                    </div>

                    {/* Nút Sửa / Xóa: Ẩn khi Khóa, hiện khi Mở Khóa */}
                    {!isLocked && (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => handleOpenEditItem(item)}
                          className="btn btn-secondary"
                          style={{ flex: 1, padding: '5px 8px', fontSize: '0.78rem' }}
                        >
                          <Edit size={13} />
                          <span>Sửa Kho</span>
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id, item.name)}
                          style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: '#f87171',
                            padding: '5px 8px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                          }}
                          title="Xóa mặt hàng kho"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: SƠ ĐỒ VỊ TRÍ KHO & SỨC CHỨA */}
      {activeTab === 'locations' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {warehouseLocations.map((loc) => {
            const fillPercentage = Math.min(100, Math.round((loc.currentCount / (loc.capacity || 1)) * 100));

            return (
              <div key={loc.id} className="glass-panel" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.6rem' }}>
                      {loc.code.includes('-KL') ? '❄️' : loc.code.includes('-PL') ? '📦' : '🏗️'}
                    </span>
                    <div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#a5b4fc' }}>
                        {loc.code}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#38bdf8', fontWeight: 600 }}>
                        {explainWarehouseCode(loc.code)}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{loc.zone}</div>
                    </div>
                  </div>
                  <span className="badge badge-success">Đang Hoạt Động</span>
                </div>

                <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', margin: '12px 0 6px 0' }}>
                  Sức chứa kho: <b>{loc.currentCount} / {loc.capacity}</b> quy cách sỉ ({fillPercentage}%)
                </div>

                {/* Progress bar */}
                <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px', overflow: 'hidden', marginBottom: '12px' }}>
                  <div
                    style={{
                      width: `${fillPercentage}%`,
                      height: '100%',
                      background: fillPercentage > 85 ? '#f59e0b' : '#6366f1',
                      borderRadius: '4px',
                    }}
                  />
                </div>

                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', borderTop: '1px solid var(--border-color)', paddingTop: '8px' }}>
                  {loc.notes}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ==============================================================================
          DRAWER / MODAL: MENU LỊCH SỬ NHẬP / XUẤT KHO THEO YÊU CẦU NGƯỜI DÙNG
          ============================================================================== */}
      {isHistoryMenuOpen && (
        <div className="modal-overlay" onClick={() => setIsHistoryMenuOpen(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '950px', width: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
          >
            {/* Header Menu Lịch Sử */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FileText size={24} color="#818cf8" />
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  LỊCH SỬ PHIẾU NHẬP / XUẤT KHO & ĐỐI SOÁT OPEX
                </h2>
              </div>
              <button
                onClick={() => setIsHistoryMenuOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={22} />
              </button>
            </div>

            {/* Banner tổng hợp tự động link OpEx */}
            <div
              style={{
                background: 'linear-gradient(90deg, rgba(99, 102, 241, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%)',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                borderRadius: '10px',
                padding: '12px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Link2 size={20} color="#818cf8" />
                <span style={{ fontSize: '0.88rem', color: '#e0e7ff' }}>
                  Tổng tiền mua từ các phiếu Nhập Kho được tự động đồng bộ sang <b>Mục 7 (OpEx)</b> làm chi phí nhập hàng.
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>TỔNG TIỀN NHẬP KHO THÁNG NÀY:</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#818cf8', fontFamily: 'var(--font-mono)' }}>
                  {new Intl.NumberFormat('vi-VN').format(totalInCost)} VNĐ
                </div>
              </div>
            </div>

            {/* Bộ lọc loại phiếu */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
              <button
                className={`cat-pill ${historyFilterType === 'ALL' ? 'active' : ''}`}
                onClick={() => setHistoryFilterType('ALL')}
              >
                Tất Cả Phiếu ({transactions.length})
              </button>
              <button
                className={`cat-pill ${historyFilterType === 'IN' ? 'active' : ''}`}
                onClick={() => setHistoryFilterType('IN')}
              >
                📥 Nhập Kho ({transactions.filter((t) => t.type === 'IN').length})
              </button>
              <button
                className={`cat-pill ${historyFilterType === 'OUT_SHELF' ? 'active' : ''}`}
                onClick={() => setHistoryFilterType('OUT_SHELF')}
              >
                📤 Xuất Lên Kệ ({transactions.filter((t) => t.type === 'OUT' && !t.slipCode.startsWith('XCB') && !t.supplier.includes('Chế Biến')).length})
              </button>
              <button
                className={`cat-pill ${historyFilterType === 'OUT_PREP' ? 'active' : ''}`}
                onClick={() => setHistoryFilterType('OUT_PREP')}
              >
                ☕ Xuất Chế Biến ({transactions.filter((t) => t.type === 'OUT' && (t.slipCode.startsWith('XCB') || t.supplier.includes('Chế Biến'))).length})
              </button>
            </div>

            {/* Bảng danh sách phiếu */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Mã Phiếu</th>
                    <th>Ngày Tạo</th>
                    <th>Loại</th>
                    <th>Nhà Cung Cấp / Nơi Xuất</th>
                    <th>Chi Tiết Mặt Hàng (Thùng/Kg/Lít)</th>
                    <th>Tổng Tiền</th>
                    <th>Ghi Chú</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions
                    .filter((t) => {
                      if (historyFilterType === 'ALL') return true;
                      if (historyFilterType === 'IN') return t.type === 'IN';
                      if (historyFilterType === 'OUT_SHELF') return t.type === 'OUT' && !t.slipCode.startsWith('XCB') && !t.supplier.includes('Chế Biến');
                      if (historyFilterType === 'OUT_PREP') return t.type === 'OUT' && (t.slipCode.startsWith('XCB') || t.supplier.includes('Chế Biến'));
                      return true;
                    })
                    .map((tx) => {
                      const isPrepOut = tx.type === 'OUT' && (tx.slipCode.startsWith('XCB') || tx.supplier.includes('Chế Biến'));
                      return (
                        <tr key={tx.id}>
                          <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {tx.slipCode}
                          </td>
                          <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{tx.createdAt}</td>
                          <td>
                            {tx.type === 'IN' ? (
                              <span className="badge badge-success">📥 Nhập Kho</span>
                            ) : isPrepOut ? (
                              <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.35)', fontWeight: 700 }}>
                                ☕ Xuất Chế Biến
                              </span>
                            ) : (
                              <span className="badge badge-primary">📤 Xuất Lên Kệ</span>
                            )}
                          </td>
                          <td style={{ fontWeight: 600, fontSize: '0.88rem' }}>{tx.supplier}</td>
                        <td>
                          {tx.items?.map((it, idx) => (
                            <div key={idx} style={{ fontSize: '0.84rem' }}>
                              • <b>{it.productName}</b>: {it.quantity} {it.unit} x {new Intl.NumberFormat('vi-VN').format(it.costPrice)}đ
                            </div>
                          ))}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: tx.type === 'IN' ? '#38bdf8' : '#10b981' }}>
                          {new Intl.NumberFormat('vi-VN').format(tx.totalCost)}đ
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{tx.notes}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
              <button className="btn btn-secondary" onClick={() => setIsHistoryMenuOpen(false)}>
                Đóng Menu Lịch Sử
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==============================================================================
          MODAL: XUẤT KHO (LÊN KỆ HOẶC CHO CHẾ BIẾN)
          ============================================================================== */}
      {isTransferModalOpen && transferringItem && (
        <div className="modal-overlay" onClick={() => setIsTransferModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {transferType === 'SHELF' ? (
                  <Send size={22} color="#10b981" />
                ) : (
                  <Coffee size={22} color="#f59e0b" />
                )}
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                  Xuất Kho {transferType === 'SHELF' ? 'Lên Kệ Bán Lẻ' : 'Cho Quầy Chế Biến (F&B)'}
                </h3>
              </div>
              <button onClick={() => setIsTransferModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {/* TAB CHUYỂN ĐỔI MỤC ĐÍCH XUẤT */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
              <button
                type="button"
                onClick={() => setTransferType('SHELF')}
                style={{
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: transferType === 'SHELF' ? '2px solid #10b981' : '1px solid var(--border-color)',
                  background: transferType === 'SHELF' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                  color: transferType === 'SHELF' ? '#10b981' : 'var(--text-secondary)',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <Send size={15} />
                <span>1. Xuất Lên Kệ Bán Lẻ</span>
              </button>

              <button
                type="button"
                onClick={() => setTransferType('PREPARATION')}
                style={{
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: transferType === 'PREPARATION' ? '2px solid #f59e0b' : '1px solid var(--border-color)',
                  background: transferType === 'PREPARATION' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                  color: transferType === 'PREPARATION' ? '#f59e0b' : 'var(--text-secondary)',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <Coffee size={15} />
                <span>2. Xuất Cho Quầy Chế Biến</span>
              </button>
            </div>

            <form onSubmit={handleConfirmTransfer} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* THÔNG TIN MẶT HÀNG KHO */}
              <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '12px 14px', borderRadius: '8px' }}>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem' }}>{transferringItem.name}</div>
                <div style={{ fontSize: '0.85rem', color: '#818cf8', marginTop: '2px' }}>
                  Quy cách sỉ: <b>{transferringItem.packageSpec}</b> ({transferringItem.unitsPerBulk || 1} đơn vị / {transferringItem.bulkUnit})
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Vị trí kho hiện tại: <b style={{ color: '#38bdf8' }}>{transferringItem.locationCode}</b> ({explainWarehouseCode(transferringItem.locationCode)})
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Tồn kho khả dụng: <b style={{ color: '#10b981' }}>{transferringItem.stockQuantity} {transferringItem.bulkUnit}</b>
                </div>
              </div>

              {/* SỐ LƯỢNG XUẤT */}
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Số lượng quy cách sỉ muốn xuất ({transferringItem.bulkUnit}):
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                  <input
                    type="number"
                    min="1"
                    max={transferringItem.stockQuantity}
                    required
                    value={transferBulkQty}
                    onChange={(e) => setTransferBulkQty(Number(e.target.value))}
                    style={{ width: '120px', padding: '10px', fontSize: '1.1rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}
                  />
                  <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {transferringItem.bulkUnit}
                  </span>
                  <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                    (= <b>{transferBulkQty * (transferringItem.unitsPerBulk || 1)}</b> đơn vị {transferType === 'SHELF' ? 'lẻ lên kệ' : 'nguyên liệu pha chế'})
                  </span>
                </div>
              </div>

              {/* NƠI NHẬN HÀNG: KỆ HOẶC CHẾ BIẾN */}
              {transferType === 'SHELF' ? (
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Vị trí kệ nhận hàng trưng bày:</label>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                    <input
                      type="text"
                      required
                      value={targetShelfCode}
                      onChange={(e) => setTargetShelfCode(e.target.value.toUpperCase())}
                      placeholder="VD: KE01-T1A"
                      style={{ flex: 1, padding: '10px', fontFamily: 'var(--font-mono)' }}
                    />
                    <select
                      value={targetShelfCode}
                      onChange={(e) => setTargetShelfCode(e.target.value)}
                      style={{ padding: '10px', maxWidth: '240px' }}
                    >
                      <option value="">-- Chọn nhanh kệ --</option>
                      {storageService.getShelves().map((s) => (
                        <option key={s.id} value={s.code}>
                          {s.code} ({explainShelfCode(s.code)})
                        </option>
                      ))}
                    </select>
                  </div>
                  {targetShelfCode && (
                    <div style={{ fontSize: '0.78rem', color: '#38bdf8', marginTop: '4px' }}>
                      👉 {explainShelfCode(targetShelfCode)}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Bộ phận nhận nguyên liệu:</label>
                    <select
                      value={prepDepartment}
                      onChange={(e) => setPrepDepartment(e.target.value)}
                      style={{ width: '100%', padding: '10px', marginTop: '6px' }}
                    >
                      <option value="Quầy Pha Chế (Bar / Cà phê / Trà)">Quầy Pha Chế (Bar / Cà phê / Trà)</option>
                      <option value="Bếp Chế Biến (Đồ ăn / Bánh mì)">Bếp Chế Biến (Đồ ăn / Bánh mì)</option>
                      <option value="Quầy Đóng Gói & Pha Chế">Quầy Đóng Gói &amp; Pha Chế</option>
                      <option value="Tủ Bảo Quản Pha Chế Tại Quầy">Tủ Bảo Quản Pha Chế Tại Quầy</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Món chế biến sử dụng (Tùy chọn):</label>
                    <select
                      value={prepTargetRecipe}
                      onChange={(e) => setPrepTargetRecipe(e.target.value)}
                      style={{ width: '100%', padding: '10px', marginTop: '6px' }}
                    >
                      <option value="">-- Dùng chung cho Quầy Chế Biến --</option>
                      {storageService.getRecipes().map((r) => (
                        <option key={r.id} value={r.productName}>
                          {r.productName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Ghi chú phiếu xuất chế biến (Tùy chọn):</label>
                    <input
                      type="text"
                      placeholder="VD: Xuất 1 bao phục vụ ca sáng..."
                      value={prepNotes}
                      onChange={(e) => setPrepNotes(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', marginTop: '6px' }}
                    />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsTransferModalOpen(false)}>
                  Hủy
                </button>
                {transferType === 'SHELF' ? (
                  <button type="submit" className="btn btn-primary" style={{ background: '#10b981' }}>
                    Xác Nhận Xuất Lên Kệ
                  </button>
                ) : (
                  <button type="submit" className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)', border: 'none' }}>
                    Xác Nhận Xuất Cho Chế Biến
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==============================================================================
          MODAL: TẠO PHIẾU NHẬP KHO MỚI
          ============================================================================== */}
      {isImportModalOpen && (
        <div className="modal-overlay" onClick={() => setIsImportModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={22} color="#6366f1" />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Tạo Phiếu Nhập Kho Mới (Sỉ)</h3>
              </div>
              <button onClick={() => setIsImportModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateImportSlip} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Nhà Cung Cấp:</label>
                <input
                  type="text"
                  required
                  value={importForm.supplier}
                  onChange={(e) => setImportForm({ ...importForm, supplier: e.target.value })}
                  style={{ width: '100%', padding: '8px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Tên Mặt Hàng Sỉ:</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Cà phê Robusta Mộc S18 (Bao Sỉ)"
                  value={importForm.name}
                  onChange={(e) => setImportForm({ ...importForm, name: e.target.value })}
                  style={{ width: '100%', padding: '8px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Quy cách ĐVT:</label>
                  <select
                    value={importForm.bulkUnit}
                    onChange={(e) => setImportForm({ ...importForm, bulkUnit: e.target.value as WarehouseBulkUnit })}
                    style={{ width: '100%', padding: '8px' }}
                  >
                    <option value="Thùng">Thùng</option>
                    <option value="Bao">Bao</option>
                    <option value="Kg">Kg</option>
                    <option value="Lít">Lít</option>
                    <option value="Can">Can</option>
                    <option value="Két">Két</option>
                    <option value="Cuộn">Cuộn</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Số Lượng:</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={importForm.quantity}
                    onChange={(e) => setImportForm({ ...importForm, quantity: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Đơn Giá Sỉ / 1 ĐVT:</label>
                  <input
                    type="number"
                    min="1000"
                    step="1000"
                    required
                    value={importForm.unitPrice}
                    onChange={(e) => setImportForm({ ...importForm, unitPrice: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Chi Tiết Quy Cách:</label>
                  <input
                    type="text"
                    placeholder="VD: Bao 30kg hoặc Thùng 24 lon"
                    value={importForm.packageSpec}
                    onChange={(e) => setImportForm({ ...importForm, packageSpec: e.target.value })}
                    style={{ width: '100%', padding: '8px' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Vị Trí Cất Kho:</label>
                  <select
                    value={importForm.locationCode}
                    onChange={(e) => setImportForm({ ...importForm, locationCode: e.target.value })}
                    style={{ width: '100%', padding: '8px' }}
                  >
                    {warehouseLocations.map((loc) => (
                      <option key={loc.id} value={loc.code}>
                        {loc.code} ({explainWarehouseCode(loc.code)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Tổng giá trị phiếu nhập kho: </span>
                <b style={{ color: '#38bdf8', fontSize: '1.2rem', fontFamily: 'var(--font-mono)' }}>
                  {new Intl.NumberFormat('vi-VN').format(importForm.quantity * importForm.unitPrice)} VNĐ
                </b>
                <div style={{ fontSize: '0.75rem', color: '#a5b4fc', marginTop: '2px' }}>
                  (Tự động đồng bộ số tiền này vào mục Chi phí Nhập hàng OpEx)
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsImportModalOpen(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  Lưu Phiếu Nhập & Cộng Tồn Kho
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==============================================================================
          MODAL: THÊM / SỬA MẶT HÀNG KHO
          ============================================================================== */}
      {isItemModalOpen && (
        <div className="modal-overlay" onClick={() => setIsItemModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Package size={22} color="#6366f1" />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                  {editingItem ? 'Chỉnh Sửa Mặt Hàng Kho' : 'Thêm Mặt Hàng Mới Vào Kho'}
                </h3>
              </div>
              <button onClick={() => setIsItemModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveItem} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Tên Mặt Hàng Kho:</label>
                  <input
                    type="text"
                    required
                    value={itemForm.name || ''}
                    onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                    style={{ width: '100%', padding: '8px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Mã SKU:</label>
                  <input
                    type="text"
                    required
                    value={itemForm.sku || ''}
                    onChange={(e) => setItemForm({ ...itemForm, sku: e.target.value })}
                    style={{ width: '100%', padding: '8px', fontFamily: 'var(--font-mono)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>ĐVT Sỉ:</label>
                  <select
                    value={itemForm.bulkUnit || 'Thùng'}
                    onChange={(e) => setItemForm({ ...itemForm, bulkUnit: e.target.value as WarehouseBulkUnit })}
                    style={{ width: '100%', padding: '8px' }}
                  >
                    <option value="Thùng">Thùng</option>
                    <option value="Bao">Bao</option>
                    <option value="Kg">Kg</option>
                    <option value="Lít">Lít</option>
                    <option value="Can">Can</option>
                    <option value="Két">Két</option>
                    <option value="Cuộn">Cuộn</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Quy Cách Chi Tiết:</label>
                  <input
                    type="text"
                    placeholder="VD: Thùng 24 lon 320ml"
                    value={itemForm.packageSpec || ''}
                    onChange={(e) => setItemForm({ ...itemForm, packageSpec: e.target.value })}
                    style={{ width: '100%', padding: '8px' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Quy đổi đơn vị lẻ:</label>
                  <input
                    type="number"
                    min="1"
                    value={itemForm.unitsPerBulk || 1}
                    onChange={(e) => setItemForm({ ...itemForm, unitsPerBulk: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Giá Nhập Sỉ (VNĐ):</label>
                  <input
                    type="number"
                    min="1000"
                    step="1000"
                    value={itemForm.importPrice || 0}
                    onChange={(e) => setItemForm({ ...itemForm, importPrice: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Tồn Kho Ban Đầu:</label>
                  <input
                    type="number"
                    min="0"
                    value={itemForm.stockQuantity || 0}
                    onChange={(e) => setItemForm({ ...itemForm, stockQuantity: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Vị Trí Ô Kho:</label>
                  <select
                    value={itemForm.locationCode || 'KHO01-KS01'}
                    onChange={(e) => setItemForm({ ...itemForm, locationCode: e.target.value })}
                    style={{ width: '100%', padding: '8px' }}
                  >
                    {warehouseLocations.map((loc) => (
                      <option key={loc.id} value={loc.code}>
                        {loc.code} ({explainWarehouseCode(loc.code)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>URL Ảnh Đại Diện Kho (Tùy chọn):</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={itemForm.imageUrl || ''}
                  onChange={(e) => setItemForm({ ...itemForm, imageUrl: e.target.value })}
                  style={{ width: '100%', padding: '8px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsItemModalOpen(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  Lưu Mặt Hàng Kho
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==============================================================================
          MODAL: THÊM VỊ TRÍ KHO MỚI THEO QUY CHUẨN KHO01-KS01
          ============================================================================== */}
      {isAddLocationModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddLocationModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={22} color="#818cf8" />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Thêm Vị Trí Kho Hàng Mới</h3>
              </div>
              <button
                onClick={() => setIsAddLocationModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddWarehouseLocation} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Cấu hình mã theo quy định: Kho 01, Kệ sắt 01 -> KHO01-KS01 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Số Kho (01, 02...):</label>
                  <input
                    type="text"
                    required
                    value={whNum}
                    onChange={(e) => setWhNum(e.target.value)}
                    placeholder="VD: 01"
                    style={{ width: '100%', padding: '8px', fontFamily: 'var(--font-mono)' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Loại Kệ / Lưu Trữ:</label>
                  <select
                    value={whRackType}
                    onChange={(e) => setWhRackType(e.target.value as WarehouseRackType)}
                    style={{ width: '100%', padding: '8px' }}
                  >
                    <option value="KS">🏗️ [KS] Kệ sắt chịu lực</option>
                    <option value="KL">❄️ [KL] Kho lạnh / Tủ mát</option>
                    <option value="PL">📦 [PL] Pallet sàn</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Số Kệ (01, 02...):</label>
                  <input
                    type="text"
                    required
                    value={whRackNum}
                    onChange={(e) => setWhRackNum(e.target.value)}
                    placeholder="VD: 01"
                    style={{ width: '100%', padding: '8px', fontFamily: 'var(--font-mono)' }}
                  />
                </div>
              </div>

              {/* BẢNG PREVIEW MÃ VỊ TRÍ KHO VÀ DIỄN GIẢI */}
              <div
                style={{
                  background: 'rgba(99, 102, 241, 0.12)',
                  border: '1px solid rgba(99, 102, 241, 0.35)',
                  padding: '12px 14px',
                  borderRadius: '8px',
                }}
              >
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  MÃ VỊ TRÍ KHO TỰ ĐỘNG SINH THEO QUY CHUẨN:
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <span style={{ fontSize: '1.5rem' }}>{whRackType === 'KL' ? '❄️' : whRackType === 'PL' ? '📦' : '🏗️'}</span>
                  <span style={{ fontSize: '1.35rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#a5b4fc', letterSpacing: '1px' }}>
                    {previewWhCode}
                  </span>
                </div>
                <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)', marginTop: '6px' }}>
                  👉 <b>Dịch ra:</b> {previewWhDesc}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Khu Vực Phân Loại (Zone):</label>
                  <input
                    type="text"
                    required
                    value={whZone}
                    onChange={(e) => setWhZone(e.target.value)}
                    placeholder="VD: Khu A (Hàng Khô / Đóng Gói Sỉ)"
                    style={{ width: '100%', padding: '8px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Sức Chứa (quy cách sỉ):</label>
                  <input
                    type="number"
                    min="1"
                    value={whCapacity}
                    onChange={(e) => setWhCapacity(Number(e.target.value))}
                    style={{ width: '100%', padding: '8px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Ghi Chú Vị Trí Kho:</label>
                <input
                  type="text"
                  placeholder="VD: Chứa thùng lon, chai nước ngọt, thùng sữa"
                  value={whNotes}
                  onChange={(e) => setWhNotes(e.target.value)}
                  style={{ width: '100%', padding: '8px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddLocationModalOpen(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" style={{ padding: '10px 22px' }}>
                  Lưu Vị Trí {previewWhCode}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
