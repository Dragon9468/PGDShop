import React, { useState, useEffect } from 'react';
import { PreparedRecipe } from '../types';
import { storageService } from '../services/storageService';
import { Coffee, Plus, Clock, DollarSign, ChefHat, Layers } from 'lucide-react';

export const PreparedProductsView: React.FC = () => {
  const [recipes, setRecipes] = useState<PreparedRecipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<PreparedRecipe | null>(null);

  useEffect(() => {
    const list = storageService.getRecipes();
    setRecipes(list);
    if (list.length > 0) {
      setSelectedRecipe(list[0]);
    }
  }, []);

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Coffee size={28} color="#f59e0b" />
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>2. QUẢN LÝ CHẾ BIẾN & ĐỊNH LƯỢNG (F&B / ĐỒ ĂN & CÀ PHÊ)</h1>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '4px' }}>
            Kiểm soát chi tiết công thức định lượng (BOM), tính giá cost vốn nguyên liệu và tỉ lệ lợi nhuận từng ly/món.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '20px' }}>
        {/* Danh sách các món chế biến */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ fontSize: '1.05rem', color: '#cbd5e1' }}>Món Chế Biến Tại Quán</h3>
          {recipes.map((recipe) => {
            const isSelected = selectedRecipe?.id === recipe.id;
            const grossProfit = recipe.retailPrice - recipe.standardCost;
            const margin = Math.round((grossProfit / recipe.retailPrice) * 100);

            return (
              <div
                key={recipe.id}
                className="glass-panel"
                onClick={() => setSelectedRecipe(recipe)}
                style={{
                  padding: '16px',
                  cursor: 'pointer',
                  border: isSelected ? '1px solid #f59e0b' : '1px solid var(--border-color)',
                  background: isSelected ? 'rgba(245, 158, 11, 0.1)' : 'var(--bg-card)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff' }}>{recipe.productName}</h4>
                  <span className="badge badge-success">+{margin}% Lời</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '0.88rem' }}>
                  <span style={{ color: '#94a3b8' }}>Giá vốn (Cost):</span>
                  <span style={{ color: '#f87171', fontFamily: 'var(--font-mono)' }}>
                    {new Intl.NumberFormat('vi-VN').format(recipe.standardCost)}đ
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '0.88rem' }}>
                  <span style={{ color: '#94a3b8' }}>Giá bán Menu:</span>
                  <span style={{ color: '#38bdf8', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                    {new Intl.NumberFormat('vi-VN').format(recipe.retailPrice)}đ
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Chi tiết công thức & Định lượng (BOM) */}
        {selectedRecipe ? (
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>{selectedRecipe.productName}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '0.9rem', marginTop: '4px' }}>
                  <Clock size={16} />
                  <span>Thời gian pha chế: ~{selectedRecipe.prepTimeMinutes} phút</span>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>LỢI NHUẬN GỘP / 1 PHẦN</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981', fontFamily: 'var(--font-mono)' }}>
                  +{new Intl.NumberFormat('vi-VN').format(selectedRecipe.retailPrice - selectedRecipe.standardCost)}đ
                </div>
              </div>
            </div>

            {/* Bảng định lượng nguyên liệu (BOM) */}
            <h3 style={{ fontSize: '1.1rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ChefHat size={20} color="#f59e0b" />
              <span>Định Lượng Nguyên Liệu Tiêu Hao (BOM - Bill of Materials)</span>
            </h3>

            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nguyên liệu</th>
                    <th>ĐVT</th>
                    <th>Định lượng / Ly</th>
                    <th>Đơn giá vốn</th>
                    <th>Thành tiền Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedRecipe.ingredients.map((ing) => {
                    const itemCost = ing.quantityNeeded * ing.costPerUnit;
                    return (
                      <tr key={ing.id}>
                        <td style={{ fontWeight: 600 }}>{ing.ingredientName}</td>
                        <td>{ing.unit}</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{ing.quantityNeeded}</td>
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
                    <td colSpan={4} style={{ fontWeight: 700, textAlign: 'right' }}>TỔNG GIÁ VỐN NGUYÊN LIỆU (COST):</td>
                    <td style={{ fontWeight: 800, fontSize: '1.1rem', color: '#f87171', fontFamily: 'var(--font-mono)' }}>
                      {new Intl.NumberFormat('vi-VN').format(selectedRecipe.standardCost)}đ
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Hướng dẫn pha chế */}
            <div style={{ marginTop: '24px', background: 'rgba(255, 255, 255, 0.03)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <h4 style={{ fontSize: '1rem', color: '#fbbf24', marginBottom: '8px' }}>Quy Trình Chế Biến Tiêu Chuẩn:</h4>
              <p style={{ fontSize: '0.92rem', color: '#cbd5e1', lineHeight: 1.6 }}>{selectedRecipe.instructions}</p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
