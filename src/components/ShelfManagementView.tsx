import React, { useState, useEffect } from 'react';
import { ShelfLocation, Product, ProductCategory } from '../types';
import { storageService } from '../services/storageService';
import {
  Layers,
  Plus,
  MapPin,
  Image as ImageIcon,
  Upload,
  Edit,
  Trash2,
  Barcode,
  Search,
  Sparkles,
  X,
  Package,
} from 'lucide-react';

const PRESET_IMAGES = [
  { label: 'Cà phê hạt S18', url: 'https://images.unsplash.com/photo-1587734195503-904fca47e0e9?w=400&auto=format&fit=crop&q=80' },
  { label: 'Cà phê sữa đá', url: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=400&auto=format&fit=crop&q=80' },
  { label: 'Trà đào cam sả', url: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&auto=format&fit=crop&q=80' },
  { label: 'Bánh mì pate', url: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&auto=format&fit=crop&q=80' },
  { label: 'Sữa đặc hộp', url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&auto=format&fit=crop&q=80' },
  { label: 'Ly giấy Kraft', url: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=400&auto=format&fit=crop&q=80' },
  { label: 'Giấy in nhiệt K80', url: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=400&auto=format&fit=crop&q=80' },
  { label: 'Snack / Bánh kẹo', url: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=400&auto=format&fit=crop&q=80' },
  { label: 'Nước ngọt lon', url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&auto=format&fit=crop&q=80' },
];

export const ShelfManagementView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'shelves' | 'products'>('products');
  const [shelves, setShelves] = useState<ShelfLocation[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchProductQuery, setSearchProductQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>('TatCa');

  // Modal Kệ
  const [isAddShelfModalOpen, setIsAddShelfModalOpen] = useState(false);
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

  // Modal Sản Phẩm Kèm Ảnh
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState<Partial<Product>>({
    barcode: '',
    name: '',
    category: 'TapHoa',
    unit: 'Gói',
    costPrice: 20000,
    retailPrice: 35000,
    wholesalePrice: 28000,
    stockQuantity: 50,
    minStock: 10,
    shelfCode: 'KE-A1-T1',
    isPrepared: false,
    imageUrl: '',
  });

  useEffect(() => {
    setShelves(storageService.getShelves());
    setProducts(storageService.getProducts());
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
    setIsAddShelfModalOpen(false);
  };

  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProductForm({
      barcode: '893' + Math.floor(1000000 + Math.random() * 9000000),
      name: '',
      category: 'TapHoa',
      unit: 'Gói',
      costPrice: 20000,
      retailPrice: 35000,
      wholesalePrice: 28000,
      stockQuantity: 50,
      minStock: 10,
      shelfCode: shelves[0]?.code || 'KE-A1-T1',
      isPrepared: false,
      imageUrl: '',
    });
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (p: Product) => {
    setEditingProduct(p);
    setProductForm({ ...p });
    setIsProductModalOpen(true);
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setProductForm((prev) => ({ ...prev, imageUrl: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name || !productForm.barcode) return;

    if (editingProduct) {
      const updated: Product = {
        ...editingProduct,
        ...(productForm as Product),
      };
      storageService.updateProduct(updated);
    } else {
      const newProd: Product = {
        id: 'prod-' + Date.now(),
        barcode: productForm.barcode!,
        name: productForm.name!,
        category: productForm.category || 'TapHoa',
        unit: productForm.unit || 'Cái',
        costPrice: Number(productForm.costPrice) || 0,
        retailPrice: Number(productForm.retailPrice) || 0,
        wholesalePrice: Number(productForm.wholesalePrice) || 0,
        stockQuantity: Number(productForm.stockQuantity) || 0,
        minStock: Number(productForm.minStock) || 0,
        shelfCode: productForm.shelfCode || '',
        isPrepared: Boolean(productForm.isPrepared),
        imageUrl: productForm.imageUrl || '',
      };
      storageService.addProduct(newProd);
    }

    setProducts(storageService.getProducts());
    setIsProductModalOpen(false);
  };

  const handleDeleteProduct = (id: string, name: string) => {
    if (window.confirm(`Bạn có chắc muốn xóa sản phẩm "${name}"?`)) {
      storageService.deleteProduct(id);
      setProducts(storageService.getProducts());
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchCat = selectedCategory === 'TatCa' || p.category === selectedCategory;
    const matchQuery =
      p.name.toLowerCase().includes(searchProductQuery.toLowerCase()) ||
      p.barcode.includes(searchProductQuery) ||
      (p.shelfCode && p.shelfCode.toLowerCase().includes(searchProductQuery.toLowerCase()));
    return matchCat && matchQuery;
  });

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Layers size={28} color="#38bdf8" />
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              1. QUẢN LÝ KỆ HÀNG & DANH MỤC ẢNH SẢN PHẨM TRỰC QUAN
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Quản lý sơ đồ kệ (Dãy, Tầng), sức chứa và thêm ảnh sản phẩm trực quan để bán trên POS & hiển thị màn hình khách.
          </p>
        </div>

        {/* Nút thao tác theo tab */}
        <div style={{ display: 'flex', gap: '10px' }}>
          {activeTab === 'products' ? (
            <button className="btn btn-primary" onClick={handleOpenAddProduct}>
              <Plus size={18} />
              <span>Thêm Sản Phẩm Mới (Có Ảnh)</span>
            </button>
          ) : (
            <button className="btn btn-primary" onClick={() => setIsAddShelfModalOpen(true)}>
              <Plus size={18} />
              <span>Thêm Kệ Hàng Mới</span>
            </button>
          )}
        </div>
      </div>

      {/* Cụm Tab Chuyển Đổi Kệ Hàng <-> Danh Mục Ảnh Sản Phẩm */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '18px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
        <button
          onClick={() => setActiveTab('products')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '10px',
            border: activeTab === 'products' ? '1.5px solid var(--primary)' : '1px solid var(--border-color)',
            background: activeTab === 'products' ? 'var(--accent)' : 'var(--bg-card)',
            color: activeTab === 'products' ? 'var(--primary)' : 'var(--text-primary)',
            fontWeight: 800,
            cursor: 'pointer',
            fontSize: '0.92rem',
          }}
        >
          <ImageIcon size={18} />
          <span>Danh Mục & Ảnh Sản Phẩm ({products.length} Món)</span>
        </button>

        <button
          onClick={() => setActiveTab('shelves')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '10px',
            border: activeTab === 'shelves' ? '1.5px solid var(--primary)' : '1px solid var(--border-color)',
            background: activeTab === 'shelves' ? 'var(--accent)' : 'var(--bg-card)',
            color: activeTab === 'shelves' ? 'var(--primary)' : 'var(--text-primary)',
            fontWeight: 800,
            cursor: 'pointer',
            fontSize: '0.92rem',
          }}
        >
          <MapPin size={18} />
          <span>Sơ Đồ Kệ & Sức Chứa ({shelves.length} Vị Trí)</span>
        </button>
      </div>

      {/* NỘI DUNG TAB 1: DANH MỤC & ẢNH SẢN PHẨM TRỰC QUAN */}
      {activeTab === 'products' && (
        <div>
          {/* Thanh tìm kiếm & lọc category */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px 12px', flex: 1, minWidth: '240px' }}>
              <Search size={18} color="var(--text-secondary)" />
              <input
                type="text"
                placeholder="Tìm tên sản phẩm, mã barcode, vị trí kệ..."
                value={searchProductQuery}
                onChange={(e) => setSearchProductQuery(e.target.value)}
                style={{ background: 'transparent', border: 'none', width: '100%', outline: 'none' }}
              />
              {searchProductQuery && (
                <button onClick={() => setSearchProductQuery('')} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <X size={16} />
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto' }}>
              {(['TatCa', 'TapHoa', 'CheBien_FB', 'BaoBi', 'VanPhongPham'] as ProductCategory[]).map((cat) => (
                <button
                  key={cat}
                  className={`cat-pill ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  {cat === 'TatCa' && 'Tất Cả'}
                  {cat === 'TapHoa' && '🛒 Tạp Hóa'}
                  {cat === 'CheBien_FB' && '☕ Pha Chế'}
                  {cat === 'BaoBi' && '📦 Bao Bì'}
                  {cat === 'VanPhongPham' && '🧾 Vật Tư'}
                </button>
              ))}
            </div>
          </div>

          {/* Lưới sản phẩm kèm ảnh trực quan */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
            {filteredProducts.map((p) => (
              <div
                key={p.id}
                className="glass-panel"
                style={{
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderRadius: '12px',
                }}
              >
                {/* Ảnh sản phẩm */}
                <div
                  style={{
                    width: '100%',
                    height: '140px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    position: 'relative',
                    background: 'rgba(125, 125, 125, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '10px',
                  }}
                >
                  {p.imageUrl ? (
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      <ImageIcon size={36} strokeWidth={1.5} />
                      <div style={{ fontSize: '0.72rem', marginTop: '4px' }}>Chưa có ảnh</div>
                    </div>
                  )}

                  {p.isPrepared ? (
                    <span className="product-tag fb">☕ Pha Chế</span>
                  ) : p.shelfCode ? (
                    <span className="product-tag shelf">📍 {p.shelfCode}</span>
                  ) : null}
                </div>

                <div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px', lineHeight: 1.3 }}>
                    {p.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    <Barcode size={14} />
                    <span style={{ fontFamily: 'var(--font-mono)' }}>{p.barcode}</span>
                    <span>• {p.unit}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                    <div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Giá bán: </span>
                      <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>
                        {new Intl.NumberFormat('vi-VN').format(p.retailPrice)}đ
                      </span>
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                      Vốn: {new Intl.NumberFormat('vi-VN').format(p.costPrice)}đ
                    </div>
                  </div>

                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '6px' }}>
                    <span>Tồn: <b>{p.isPrepared ? 'Không giới hạn' : `${p.stockQuantity} ${p.unit}`}</b></span>
                    <span>Sỉ: {new Intl.NumberFormat('vi-VN').format(p.wholesalePrice)}đ</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <button
                    onClick={() => handleOpenEditProduct(p)}
                    className="btn btn-secondary"
                    style={{ flex: 1, padding: '6px 10px', fontSize: '0.8rem' }}
                  >
                    <Edit size={14} />
                    <span>Sửa Ảnh / Giá</span>
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(p.id, p.name)}
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#f87171',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                    }}
                    title="Xóa sản phẩm"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* NỘI DUNG TAB 2: SƠ ĐỒ KỆ HÀNG */}
      {activeTab === 'shelves' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {shelves.map((shelf) => {
            const fillPercentage = Math.min(100, Math.round((shelf.currentCount / (shelf.capacity || 1)) * 100));
            const isNearlyFull = fillPercentage >= 85;

            return (
              <div key={shelf.id} className="glass-panel" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MapPin size={20} color="#38bdf8" />
                    <span style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                      {shelf.code}
                    </span>
                  </div>
                  <span className={`badge ${shelf.status === 'ACTIVE' ? (isNearlyFull ? 'badge-warning' : 'badge-success') : 'badge-danger'}`}>
                    {shelf.status === 'ACTIVE' ? (isNearlyFull ? 'Gần Đầy' : 'Đang Dùng') : 'Bảo Trì'}
                  </span>
                </div>

                <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '8px' }}>
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

                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '10px', borderTop: '1px solid var(--border-color)', paddingTop: '8px' }}>
                  <b>Mặt hàng gán:</b> {shelf.assignedProducts.join(', ') || 'Chưa gán sản phẩm cụ thể'}
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '6px', fontStyle: 'italic' }}>
                  {shelf.notes}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL THÊM / SỬA SẢN PHẨM & ẢNH TRỰC QUAN */}
      {isProductModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {editingProduct ? 'Sửa Sản Phẩm & Ảnh Trưng Bày' : 'Thêm Sản Phẩm Mới (Kèm Ảnh Trực Quan)'}
              </h2>
              <button onClick={() => setIsProductModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* KHUNG PREVIEW & NHẬP ẢNH */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '14px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '8px', display: 'block' }}>
                  Ảnh Sản Phẩm (Hiển thị POS & Màn Hình Khách):
                </label>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '10px' }}>
                  {/* Khung xem trước ảnh */}
                  <div style={{ width: '80px', height: '80px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {productForm.imageUrl ? (
                      <img src={productForm.imageUrl} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
                    ) : (
                      <ImageIcon size={32} color="var(--text-muted)" />
                    )}
                  </div>

                  <div style={{ flex: 1 }}>
                    <input
                      type="text"
                      placeholder="Dán link ảnh (URL https://...) vào đây"
                      value={productForm.imageUrl || ''}
                      onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', marginBottom: '6px' }}
                    />
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#38bdf8', cursor: 'pointer' }}>
                      <Upload size={14} />
                      <span>Hoặc chọn ảnh từ máy tính (Tự động nạp)</span>
                      <input type="file" accept="image/*" onChange={handleImageFileUpload} style={{ display: 'none' }} />
                    </label>
                  </div>
                </div>

                {/* Gợi ý ảnh mẫu nhanh */}
                <div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Chọn nhanh ảnh mẫu chất lượng cao:
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {PRESET_IMAGES.slice(0, 5).map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setProductForm({ ...productForm, imageUrl: preset.url })}
                        style={{
                          fontSize: '0.72rem',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          background: 'rgba(255,255,255,0.06)',
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-primary)',
                          cursor: 'pointer',
                        }}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tên & Barcode */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Tên Sản Phẩm:</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Cà phê Robusta Mộc S18 (500g)"
                    value={productForm.name || ''}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    style={{ width: '100%', padding: '8px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Mã Barcode:</label>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <input
                      type="text"
                      required
                      value={productForm.barcode || ''}
                      onChange={(e) => setProductForm({ ...productForm, barcode: e.target.value })}
                      style={{ width: '100%', padding: '8px', fontFamily: 'var(--font-mono)' }}
                    />
                  </div>
                </div>
              </div>

              {/* Danh Mục & Vị Trí Kệ & Đơn vị tính */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Danh Mục:</label>
                  <select
                    value={productForm.category || 'TapHoa'}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value as ProductCategory })}
                    style={{ width: '100%', padding: '8px' }}
                  >
                    <option value="TapHoa">Tạp Hóa</option>
                    <option value="CheBien_FB">Chế Biến (F&B)</option>
                    <option value="BaoBi">Bao Bì</option>
                    <option value="VanPhongPham">Văn Phòng Phẩm</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Vị Trí Kệ:</label>
                  <select
                    value={productForm.shelfCode || ''}
                    onChange={(e) => setProductForm({ ...productForm, shelfCode: e.target.value })}
                    style={{ width: '100%', padding: '8px' }}
                  >
                    <option value="">(Chưa gán kệ)</option>
                    {shelves.map((s) => (
                      <option key={s.id} value={s.code}>
                        {s.code} (Dãy {s.aisle})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Đơn Vị Tính:</label>
                  <input
                    type="text"
                    value={productForm.unit || 'Gói'}
                    onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                    style={{ width: '100%', padding: '8px' }}
                  />
                </div>
              </div>

              {/* Giá Cả */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Giá Bán Lẻ (VNĐ):</label>
                  <input
                    type="number"
                    required
                    value={productForm.retailPrice || 0}
                    onChange={(e) => setProductForm({ ...productForm, retailPrice: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px', color: 'var(--primary)', fontWeight: 700 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Giá Bán Sỉ (VNĐ):</label>
                  <input
                    type="number"
                    value={productForm.wholesalePrice || 0}
                    onChange={(e) => setProductForm({ ...productForm, wholesalePrice: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Giá Vốn Cost (VNĐ):</label>
                  <input
                    type="number"
                    value={productForm.costPrice || 0}
                    onChange={(e) => setProductForm({ ...productForm, costPrice: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px' }}
                  />
                </div>
              </div>

              {/* Tồn Kho */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Số Lượng Tồn Kho:</label>
                  <input
                    type="number"
                    value={productForm.stockQuantity || 0}
                    onChange={(e) => setProductForm({ ...productForm, stockQuantity: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Tồn Tối Thiểu (Cảnh báo):</label>
                  <input
                    type="number"
                    value={productForm.minStock || 0}
                    onChange={(e) => setProductForm({ ...productForm, minStock: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsProductModalOpen(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" style={{ padding: '10px 24px' }}>
                  {editingProduct ? 'Cập Nhật Sản Phẩm' : 'Lưu Sản Phẩm & Ảnh'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL THÊM KỆ MỚI */}
      {isAddShelfModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ marginBottom: '16px', fontSize: '1.3rem', color: 'var(--text-primary)' }}>Thêm Vị Trí Kệ Mới</h2>
            <form onSubmit={handleAddShelf} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Mã Kệ (VD: KE-A2-T3):</label>
                <input
                  type="text"
                  required
                  value={newShelf.code || ''}
                  onChange={(e) => setNewShelf({ ...newShelf, code: e.target.value })}
                  style={{ width: '100%', padding: '8px' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Dãy Kệ (A, B, C):</label>
                  <input
                    type="text"
                    value={newShelf.aisle || ''}
                    onChange={(e) => setNewShelf({ ...newShelf, aisle: e.target.value })}
                    style={{ width: '100%', padding: '8px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Tầng (1, 2, 3...):</label>
                  <input
                    type="number"
                    value={newShelf.tier || 1}
                    onChange={(e) => setNewShelf({ ...newShelf, tier: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px' }}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Sức chứa tối đa (món):</label>
                  <input
                    type="number"
                    value={newShelf.capacity || 50}
                    onChange={(e) => setNewShelf({ ...newShelf, capacity: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Số lượng hiện có:</label>
                  <input
                    type="number"
                    value={newShelf.currentCount || 0}
                    onChange={(e) => setNewShelf({ ...newShelf, currentCount: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px' }}
                  />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Ghi chú đặc điểm vị trí:</label>
                <textarea
                  rows={2}
                  value={newShelf.notes || ''}
                  onChange={(e) => setNewShelf({ ...newShelf, notes: e.target.value })}
                  style={{ width: '100%', padding: '8px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddShelfModalOpen(false)}>
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
