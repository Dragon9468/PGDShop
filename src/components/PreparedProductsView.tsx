import React, { useState, useEffect } from 'react';
import { PreparedRecipe, RecipeIngredient, Product, WarehouseItem } from '../types';
import { storageService } from '../services/storageService';
import {
  Coffee,
  Plus,
  Clock,
  DollarSign,
  ChefHat,
  Layers,
  Edit,
  Trash2,
  X,
  Sparkles,
  Image as ImageIcon,
  CheckCircle,
  Package,
} from 'lucide-react';

const PRESET_FB_IMAGES = [
  { label: 'Cà phê sữa đá', url: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=400&auto=format&fit=crop&q=80' },
  { label: 'Cà phê đen đá', url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&auto=format&fit=crop&q=80' },
  { label: 'Trà đào cam sả', url: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&auto=format&fit=crop&q=80' },
  { label: 'Bánh mì pate chả', url: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&auto=format&fit=crop&q=80' },
  { label: 'Trà sữa trân châu', url: 'https://images.unsplash.com/photo-1558857563-b37cf5ef9a36?w=400&auto=format&fit=crop&q=80' },
  { label: 'Cà phê muối béo', url: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400&auto=format&fit=crop&q=80' },
];

export const PreparedProductsView: React.FC = () => {
  const [recipes, setRecipes] = useState<PreparedRecipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<PreparedRecipe | null>(null);
  const [warehouseItems, setWarehouseItems] = useState<WarehouseItem[]>([]);

  // Modal Thêm / Sửa Công thức món chế biến
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<PreparedRecipe | null>(null);

  const [formName, setFormName] = useState('');
  const [formPrice, setFormPrice] = useState(25000);
  const [formTime, setFormTime] = useState(3);
  const [formInstructions, setFormInstructions] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formIngredients, setFormIngredients] = useState<RecipeIngredient[]>([
    { id: 'ing-1', ingredientName: 'Cà phê hạt Robusta Blend', unit: 'gram', quantityNeeded: 20, costPerUnit: 200, warehouseItemId: 'wh-item-01', warehouseLocationCode: 'KHO01-KS02' },
    { id: 'ing-2', ingredientName: 'Sữa đặc Phương Nam', unit: 'ml', quantityNeeded: 25, costPerUnit: 70, warehouseItemId: 'wh-item-03', warehouseLocationCode: 'KHO01-KS01' },
    { id: 'ing-3', ingredientName: 'Bộ Ly giấy + Nắp + Ống hút', unit: 'bộ', quantityNeeded: 1, costPerUnit: 1200, warehouseItemId: 'wh-item-04', warehouseLocationCode: 'KHO01-KS03' },
  ]);

  const loadData = () => {
    const list = storageService.getRecipes();
    setRecipes(list);
    setWarehouseItems(storageService.getWarehouseItems());
    if (list.length > 0) {
      if (!selectedRecipe || !list.find((r) => r.id === selectedRecipe.id)) {
        setSelectedRecipe(list[0]);
      } else {
        const updatedSelected = list.find((r) => r.id === selectedRecipe.id);
        if (updatedSelected) setSelectedRecipe(updatedSelected);
      }
    } else {
      setSelectedRecipe(null);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Tính tổng cost của các nguyên liệu trong form
  const computedStandardCost = formIngredients.reduce(
    (sum, ing) => sum + (Number(ing.quantityNeeded) || 0) * (Number(ing.costPerUnit) || 0),
    0
  );

  const handleOpenAdd = () => {
    setEditingRecipe(null);
    setFormName('');
    setFormPrice(25000);
    setFormTime(3);
    setFormInstructions('1. Chuẩn bị nguyên liệu từ kho theo định lượng. 2. Pha chế theo công thức. 3. Phục vụ khách.');
    setFormImageUrl(PRESET_FB_IMAGES[0].url);
    setFormIngredients([
      { id: 'ing-1', ingredientName: 'Cà phê hạt Robusta Blend', unit: 'gram', quantityNeeded: 20, costPerUnit: 200, warehouseItemId: 'wh-item-01', warehouseLocationCode: 'KHO01-KS02' },
      { id: 'ing-2', ingredientName: 'Sữa đặc Phương Nam', unit: 'ml', quantityNeeded: 25, costPerUnit: 70, warehouseItemId: 'wh-item-03', warehouseLocationCode: 'KHO01-KS01' },
      { id: 'ing-3', ingredientName: 'Bộ Ly giấy + Nắp + Ống hút', unit: 'bộ', quantityNeeded: 1, costPerUnit: 1200, warehouseItemId: 'wh-item-04', warehouseLocationCode: 'KHO01-KS03' },
    ]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (recipe: PreparedRecipe) => {
    setEditingRecipe(recipe);
    setFormName(recipe.productName);
    setFormPrice(recipe.retailPrice);
    setFormTime(recipe.prepTimeMinutes);
    setFormInstructions(recipe.instructions);
    const prod = storageService.getProducts().find((p) => p.id === recipe.productId);
    setFormImageUrl(prod?.imageUrl || '');
    setFormIngredients(recipe.ingredients && recipe.ingredients.length > 0 ? [...recipe.ingredients] : []);
    setIsModalOpen(true);
  };

  const handleAddIngredientRow = () => {
    setFormIngredients([
      ...formIngredients,
      {
        id: 'ing-' + Date.now(),
        ingredientName: '',
        unit: 'gram',
        quantityNeeded: 10,
        costPerUnit: 100,
        warehouseLocationCode: 'KHO01-KS01',
      },
    ]);
  };

  const handleRemoveIngredientRow = (index: number) => {
    setFormIngredients(formIngredients.filter((_, i) => i !== index));
  };

  const handleIngredientChange = (index: number, field: keyof RecipeIngredient, value: any) => {
    const updated = [...formIngredients];
    updated[index] = { ...updated[index], [field]: value };
    setFormIngredients(updated);
  };

  const handleSelectWarehouseItem = (index: number, whId: string) => {
    const wh = warehouseItems.find((w) => w.id === whId);
    const updated = [...formIngredients];
    if (wh) {
      updated[index] = {
        ...updated[index],
        warehouseItemId: wh.id,
        ingredientName: updated[index].ingredientName || wh.name,
        warehouseLocationCode: wh.locationCode,
      };
    } else {
      updated[index] = {
        ...updated[index],
        warehouseItemId: undefined,
      };
    }
    setFormIngredients(updated);
  };

  const handleSaveRecipe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingRecipe) {
      const updated: PreparedRecipe = {
        ...editingRecipe,
        productName: formName.trim(),
        retailPrice: Number(formPrice) || 0,
        prepTimeMinutes: Number(formTime) || 1,
        instructions: formInstructions,
        ingredients: formIngredients,
        standardCost: computedStandardCost,
      };
      storageService.updateRecipe(updated);

      // Cập nhật ảnh sản phẩm tương ứng nếu có
      const products = storageService.getProducts();
      const pIdx = products.findIndex((p) => p.id === updated.productId || p.name === updated.productName);
      if (pIdx >= 0) {
        products[pIdx].name = updated.productName;
        products[pIdx].retailPrice = updated.retailPrice;
        products[pIdx].costPrice = updated.standardCost;
        if (formImageUrl) products[pIdx].imageUrl = formImageUrl;
        storageService.saveProducts(products);
      }
    } else {
      const newRecipeId = 'rec-' + Date.now();
      const newProdId = 'prod-fb-' + Date.now();

      const newRecipe: PreparedRecipe = {
        id: newRecipeId,
        productId: newProdId,
        productName: formName.trim(),
        prepTimeMinutes: Number(formTime) || 3,
        instructions: formInstructions,
        ingredients: formIngredients,
        standardCost: computedStandardCost,
        retailPrice: Number(formPrice) || 0,
      };

      // Tạo luôn Product thuộc F&B chế biến để POS bán được ngay
      const newProd: Product = {
        id: newProdId,
        barcode: '20' + Math.floor(10000000 + Math.random() * 90000000),
        name: formName.trim(),
        category: 'CheBien_FB',
        unit: 'Ly/Phần',
        costPrice: computedStandardCost,
        retailPrice: Number(formPrice) || 0,
        wholesalePrice: Math.round((Number(formPrice) || 0) * 0.9),
        stockQuantity: 999,
        minStock: 0,
        isPrepared: true,
        imageUrl: formImageUrl,
      };

      storageService.addRecipe(newRecipe, false);
      storageService.addProduct(newProd);
    }

    setIsModalOpen(false);
    loadData();
  };

  const handleDeleteRecipe = (recipe: PreparedRecipe) => {
    if (window.confirm(`Bạn có chắc muốn xóa món chế biến "${recipe.productName}" khỏi Menu?`)) {
      storageService.deleteRecipe(recipe.id);
      if (recipe.productId) {
        storageService.deleteProduct(recipe.productId);
      }
      loadData();
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Coffee size={28} color="#f59e0b" />
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              2. QUẢN LÝ CHẾ BIẾN & ĐỊNH LƯỢNG (F&B / ĐỒ ĂN & CÀ PHÊ)
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Quản lý riêng menu đồ uống pha chế tại quầy, kiểm soát công thức định lượng (BOM), tính giá cost vốn nguyên liệu và tỉ lệ lợi nhuận gộp.
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={handleOpenAdd}
          style={{ background: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)', boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)' }}
        >
          <Plus size={18} />
          <span>Thêm Món Chế Biến Mới (F&B)</span>
        </button>
      </div>

      {/* GIAO DIỆN CHIA 2 CỘT: DANH SÁCH MENU MÓN <-> CHI TIẾT ĐỊNH LƯỢNG (BOM) */}
      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '20px' }}>
        {/* CỘT TRÁI: DANH SÁCH CÁC MÓN CHẾ BIẾN TẠI QUẦY */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Menu Món Chế Biến ({recipes.length} Món)
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#f59e0b', fontWeight: 600 }}>Tự động link POS</span>
          </div>

          {recipes.length === 0 ? (
            <div className="glass-panel" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Coffee size={40} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
              <div>Chưa có món chế biến nào</div>
              <button className="btn btn-primary" onClick={handleOpenAdd} style={{ marginTop: '12px' }}>
                <Plus size={16} /> Thêm Món Ngay
              </button>
            </div>
          ) : (
            recipes.map((recipe) => {
              const isSelected = selectedRecipe?.id === recipe.id;
              const grossProfit = recipe.retailPrice - recipe.standardCost;
              const margin = recipe.retailPrice > 0 ? Math.round((grossProfit / recipe.retailPrice) * 100) : 0;
              const prod = storageService.getProducts().find((p) => p.id === recipe.productId);

              return (
                <div
                  key={recipe.id}
                  className="glass-panel"
                  onClick={() => setSelectedRecipe(recipe)}
                  style={{
                    padding: '14px',
                    cursor: 'pointer',
                    borderRadius: '12px',
                    border: isSelected ? '1.5px solid #f59e0b' : '1px solid var(--border-color)',
                    background: isSelected ? 'rgba(245, 158, 11, 0.12)' : 'var(--bg-card)',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'center',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {/* Ảnh đại diện món */}
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      background: 'rgba(255, 255, 255, 0.05)',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {prod?.imageUrl ? (
                      <img src={prod.imageUrl} alt={recipe.productName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <Coffee size={24} color="#f59e0b" />
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4
                        style={{
                          fontSize: '1rem',
                          fontWeight: 700,
                          color: 'var(--text-primary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {recipe.productName}
                      </h4>
                      <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>
                        +{margin}% Lời
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.82rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Giá Cost (BOM):</span>
                      <span style={{ color: '#f87171', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                        {new Intl.NumberFormat('vi-VN').format(recipe.standardCost)}đ
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px', fontSize: '0.82rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Giá bán Menu:</span>
                      <span style={{ color: '#38bdf8', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                        {new Intl.NumberFormat('vi-VN').format(recipe.retailPrice)}đ
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* CỘT PHẢI: CHI TIẾT CÔNG THỨC & ĐỊNH LƯỢNG NGUYÊN LIỆU (BOM) */}
        {selectedRecipe ? (
          <div className="glass-panel" style={{ padding: '24px', borderRadius: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {selectedRecipe.productName}
                  </h2>
                  <span className="badge badge-primary">☕ F&B Chế Biến</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '6px' }}>
                  <Clock size={16} />
                  <span>Thời gian pha chế chuẩn: ~{selectedRecipe.prepTimeMinutes} phút</span>
                </div>
              </div>

              {/* Nút Sửa & Xóa món */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button className="btn btn-secondary" onClick={() => handleOpenEdit(selectedRecipe)} style={{ padding: '6px 12px' }}>
                  <Edit size={15} />
                  <span>Sửa Công Thức & Giá</span>
                </button>
                <button
                  onClick={() => handleDeleteRecipe(selectedRecipe)}
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#f87171',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                  title="Xóa món chế biến"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* Thống kê tài chính nhanh của món */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '12px 16px', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>GIÁ BÁN MENU</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                  {new Intl.NumberFormat('vi-VN').format(selectedRecipe.retailPrice)}đ
                </div>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '12px 16px', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>GIÁ VỐN NGUYÊN LIỆU (COST)</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f87171', fontFamily: 'var(--font-mono)' }}>
                  {new Intl.NumberFormat('vi-VN').format(selectedRecipe.standardCost)}đ
                </div>
              </div>

              <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                <div style={{ fontSize: '0.78rem', color: '#6ee7b7' }}>LỢI NHUẬN GỘP / 1 PHẦN</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#10b981', fontFamily: 'var(--font-mono)' }}>
                  +{new Intl.NumberFormat('vi-VN').format(selectedRecipe.retailPrice - selectedRecipe.standardCost)}đ
                </div>
              </div>
            </div>

            {/* BẢNG ĐỊNH LƯỢNG NGUYÊN LIỆU TIÊU HAO (BOM) */}
            <h3 style={{ fontSize: '1.05rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
              <ChefHat size={20} color="#f59e0b" />
              <span>Định Lượng Nguyên Vật Liệu Tiêu Hao (BOM - Bill of Materials)</span>
            </h3>

            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nguyên liệu</th>
                    <th>Nguồn kho</th>
                    <th>ĐVT</th>
                    <th>Định lượng / Phần</th>
                    <th>Đơn giá vốn</th>
                    <th>Thành tiền Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedRecipe.ingredients?.map((ing) => {
                    const itemCost = (Number(ing.quantityNeeded) || 0) * (Number(ing.costPerUnit) || 0);
                    return (
                      <tr key={ing.id}>
                        <td style={{ fontWeight: 600 }}>{ing.ingredientName}</td>
                        <td>
                          <span style={{ fontSize: '0.75rem', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.1)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(56, 189, 248, 0.25)', fontWeight: 600 }}>
                            📍 {ing.warehouseLocationCode || 'KHO01-KS01'}
                          </span>
                        </td>
                        <td>{ing.unit}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{ing.quantityNeeded}</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>
                          {new Intl.NumberFormat('vi-VN').format(ing.costPerUnit)}đ
                        </td>
                        <td style={{ fontWeight: 700, color: '#f87171', fontFamily: 'var(--font-mono)' }}>
                          {new Intl.NumberFormat('vi-VN').format(itemCost)}đ
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                    <td colSpan={5} style={{ fontWeight: 700, textAlign: 'right' }}>
                      TỔNG CHI PHÍ NGUYÊN LIỆU CHO 1 PHẦN (COST):
                    </td>
                    <td style={{ fontWeight: 900, fontSize: '1.15rem', color: '#f87171', fontFamily: 'var(--font-mono)' }}>
                      {new Intl.NumberFormat('vi-VN').format(selectedRecipe.standardCost)}đ
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* QUY TRÌNH PHA CHẾ / CHẾ BIẾN */}
            <div style={{ marginTop: '20px', background: 'rgba(255, 255, 255, 0.03)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <h4 style={{ fontSize: '0.95rem', color: '#fbbf24', marginBottom: '8px' }}>Quy Trình Pha Chế Tiêu Chuẩn:</h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>{selectedRecipe.instructions}</p>
            </div>
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Chọn 1 món từ danh sách bên trái để xem định lượng chi tiết
          </div>
        )}
      </div>

      {/* ==============================================================================
          MODAL: THÊM / CHỈNH SỬA MÓN CHẾ BIẾN & ĐỊNH LƯỢNG NGUYÊN LIỆU (BOM)
          ============================================================================== */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '780px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Coffee size={24} color="#f59e0b" />
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>
                  {editingRecipe ? 'Chỉnh Sửa Món Chế Biến & Định Lượng' : 'Thêm Món Chế Biến Mới (F&B)'}
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveRecipe} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Tên Món Chế Biến:</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: ☕ Cà Phê Muối Kem Béo"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    style={{ width: '100%', padding: '8px' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Giá Bán Menu (VNĐ):</label>
                  <input
                    type="number"
                    min="1000"
                    step="1000"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    style={{ width: '100%', padding: '8px', fontFamily: 'var(--font-mono)' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Thời Gian (~phút):</label>
                  <input
                    type="number"
                    min="1"
                    value={formTime}
                    onChange={(e) => setFormTime(Number(e.target.value))}
                    style={{ width: '100%', padding: '8px' }}
                  />
                </div>
              </div>

              {/* URL ảnh món & gợi ý ảnh */}
              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Ảnh Đại Diện Món:</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  style={{ width: '100%', padding: '8px', marginBottom: '6px' }}
                />
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {PRESET_FB_IMAGES.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setFormImageUrl(p.url)}
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
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* BẢNG ĐỊNH LƯỢNG NGUYÊN LIỆU (BOM) */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f59e0b' }}>
                    Định Lượng Nguyên Liệu Tiêu Hao (BOM):
                  </label>
                  <button
                    type="button"
                    onClick={handleAddIngredientRow}
                    className="btn btn-secondary"
                    style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                  >
                    <Plus size={14} /> Thêm Dòng Nguyên Liệu
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {formIngredients.map((ing, idx) => (
                    <div key={ing.id || idx} style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.4fr 0.8fr 0.9fr 1fr 36px', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="text"
                        placeholder="Tên nguyên liệu"
                        value={ing.ingredientName}
                        onChange={(e) => handleIngredientChange(idx, 'ingredientName', e.target.value)}
                        style={{ padding: '6px 8px', fontSize: '0.85rem' }}
                      />
                      <select
                        value={ing.warehouseItemId || ''}
                        onChange={(e) => handleSelectWarehouseItem(idx, e.target.value)}
                        style={{ padding: '6px 8px', fontSize: '0.82rem' }}
                        title="Chọn nguyên liệu trực tiếp từ kho hàng"
                      >
                        <option value="">-- Kho xuất --</option>
                        {warehouseItems.map((w) => (
                          <option key={w.id} value={w.id}>
                            {w.name} ({w.locationCode})
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="ĐVT"
                        value={ing.unit}
                        onChange={(e) => handleIngredientChange(idx, 'unit', e.target.value)}
                        style={{ padding: '6px 8px', fontSize: '0.85rem' }}
                      />
                      <input
                        type="number"
                        placeholder="Định lượng"
                        value={ing.quantityNeeded}
                        onChange={(e) => handleIngredientChange(idx, 'quantityNeeded', Number(e.target.value))}
                        style={{ padding: '6px 8px', fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}
                      />
                      <input
                        type="number"
                        placeholder="Đơn giá"
                        value={ing.costPerUnit}
                        onChange={(e) => handleIngredientChange(idx, 'costPerUnit', Number(e.target.value))}
                        style={{ padding: '6px 8px', fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveIngredientRow(idx)}
                        style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#f87171', borderRadius: '4px', height: '32px', cursor: 'pointer' }}
                        title="Xóa dòng"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Tổng Cost tự động tính */}
                <div style={{ marginTop: '10px', background: 'rgba(255, 255, 255, 0.04)', padding: '10px 14px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Tổng giá vốn Cost 1 phần:</span>
                  <b style={{ color: '#f87171', fontSize: '1.15rem', fontFamily: 'var(--font-mono)' }}>
                    {new Intl.NumberFormat('vi-VN').format(computedStandardCost)} VNĐ
                  </b>
                </div>
              </div>

              {/* Hướng dẫn pha chế */}
              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Quy Trình Pha Chế Tiêu Chuẩn:</label>
                <textarea
                  rows={3}
                  value={formInstructions}
                  onChange={(e) => setFormInstructions(e.target.value)}
                  style={{ width: '100%', padding: '8px', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  Lưu Món Chế Biến & Đồng Bộ POS
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
