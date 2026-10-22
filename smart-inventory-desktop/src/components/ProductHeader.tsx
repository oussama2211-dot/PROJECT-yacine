import React from 'react';

interface ProductHeaderProps {
  count: number;
  lowStockCount: number;
  outStockCount: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAddClick: () => void;
}

const ProductHeader: React.FC<ProductHeaderProps> = ({
  count,
  lowStockCount,
  outStockCount,
  searchQuery,
  onSearchChange,
  onAddClick,
}) => {
  return (
    <>
      {/* 3 Stat Cards in a row */}
      <div className="metrics-row">
        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-title">المنتجات النشطة</span>
            <span className="stat-value">{count}</span>
          </div>
          <div className="stat-icon-wrap success">
            <span>✓</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-title">مخزون منخفض</span>
            <span className="stat-value">{lowStockCount}</span>
          </div>
          <div className="stat-icon-wrap warning">
            <span>⚠️</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-title">نفد المخزون</span>
            <span className="stat-value">{outStockCount}</span>
          </div>
          <div className="stat-icon-wrap danger">
            <span>❌</span>
          </div>
        </div>
      </div>

      {/* Toolbar above Table */}
      <div className="table-toolbar">
        <div className="toolbar-right">
          <button className="btn btn-primary" onClick={onAddClick}>
            <span>+</span> إضافة منتج جديد
          </button>
          <button className="btn btn-outline" onClick={() => window.location.reload()}>
            <span>⟳</span> تحديث
          </button>
        </div>

        <div className="search-filter-row">
          <div className="search-input-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="ابحث بالاسم، المرمز أو الباركود..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          <select className="filter-select" defaultValue="all">
            <option value="all">جميع التصنيفات</option>
          </select>
          <select className="filter-select" defaultValue="all">
            <option value="all">جميع حالات المخزون</option>
          </select>
        </div>
      </div>
    </>
  );
};

export default ProductHeader;
