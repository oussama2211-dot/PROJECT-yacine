import React from 'react';
import type { Product } from '@shared/models/Schemas';

interface ProductListProps {
  products: Realm.Results<Product & Realm.Object<Product>> | Product[];
  searchQuery: string;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

const ProductList: React.FC<ProductListProps> = ({
  products,
  searchQuery,
  onEdit,
  onDelete,
}) => {
  const filtered = Array.from(products).filter((p) =>
    p.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.ref.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (filtered.length === 0) {
    return (
      <div className="table-card">
        <div className="empty-state">
          <span className="icon">📦</span>
          <p>{searchQuery ? 'لا توجد منتجات تطابق بحثك' : 'لا توجد منتجات مسجلة في النظام'}</p>
          <span style={{ fontSize: '12px', color: 'var(--text-light)' }}>
            {searchQuery ? 'جرب مصطلح بحث مختلف' : 'انقر على زر "إضافة منتج جديد" أعلاه للبدء'}
          </span>
        </div>
      </div>
    );
  }

  const formatCurrency = (n: number) => `${n.toLocaleString('fr-DZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} دج`;

  const getStockStatus = (product: Product) => {
    if (product.currentStock === 0) return { label: 'نفد المخزون', className: 'out' };
    if (product.currentStock <= product.minStock) return { label: 'مخزون منخفض', className: 'low' };
    return { label: 'نشط', className: 'active' };
  };

  return (
    <div className="table-card">
      <table className="erp-table">
        <thead>
          <tr>
            <th>اسم المنتج</th>
            <th>التصنيف / الوحدة</th>
            <th>الرمز / الباركود</th>
            <th>النوع</th>
            <th>سعر البيع</th>
            <th>المخزون</th>
            <th>الحالة</th>
            <th className="actions-cell">الإجراءات</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((product) => {
            const stock = getStockStatus(product);

            return (
              <tr key={product._id.toHexString()}>
                <td>
                  <div className="cell-product-name">
                    <div className="product-icon-box">📦</div>
                    <span className="product-name-text">{product.designation}</span>
                  </div>
                </td>
                <td>
                  <div className="cell-category">
                    <span className="category-main">{product.category?.name || 'عام'}</span>
                    <span className="category-sub">{product.unit || 'وحدة'}</span>
                  </div>
                </td>
                <td className="cell-mono">{product.ref}</td>
                <td><span style={{ fontSize: '12px', fontWeight: 600 }}>قياسي</span></td>
                <td className="cell-mono">{formatCurrency(product.sellPrice)}</td>
                <td className="cell-mono">{product.currentStock}</td>
                <td>
                  <span className={`status-badge ${stock.className}`}>
                    ● {stock.label}
                  </span>
                </td>
                <td className="actions-cell">
                  <button
                    className="btn-icon-only"
                    onClick={() => onEdit(product)}
                    title="تعديل المنتج"
                  >
                    ✏️
                  </button>
                  <button
                    className="btn-icon-only danger"
                    onClick={() => onDelete(product)}
                    title="حذف المنتج"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ProductList;
