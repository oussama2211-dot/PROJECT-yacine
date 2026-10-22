import { useState, useMemo } from 'react';
import { Realm } from '@realm/react';
import { RealmContext } from './models/RealmContext';
import { Product, Category } from '@shared/models/Schemas';
import type { ProductFormData } from './components/ProductForm';
import ProductHeader from './components/ProductHeader';
import ProductList from './components/ProductList';
import ProductForm from './components/ProductForm';
import ConfirmDialog from './components/ConfirmDialog';
import SalesScreen from './components/SalesScreen';
import './App.css';
import './styles/products.css';

const { useQuery, useRealm } = RealmContext;

type Tab = 'products' | 'sales';

function App() {
  const realm = useRealm();
  const products = useQuery<Product>('Product');

  // Tab state (default to products for Back Office view)
  const [activeTab, setActiveTab] = useState<Tab>('products');

  // Product management state
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  // Computed summary metrics
  const productCount = useMemo(() => products.length, [products]);
  const lowStockCount = useMemo(
    () => products.filter((p) => p.currentStock > 0 && p.currentStock <= p.minStock).length,
    [products]
  );
  const outStockCount = useMemo(
    () => products.filter((p) => p.currentStock === 0).length,
    [products]
  );

  // --- CRUD Handlers ---
  const handleAddProduct = (data: ProductFormData) => {
    realm.write(() => {
      let category = realm.objects<Category>('Category')[0];
      if (!category) {
        category = realm.create<Category>('Category', {
          _id: new Realm.BSON.ObjectId(),
          name: 'عام',
        });
      }

      realm.create('Product', {
        _id: new Realm.BSON.ObjectId(),
        ref: data.ref,
        designation: data.designation,
        category,
        buyPrice: data.buyPrice,
        sellPrice: data.sellPrice,
        currentStock: 0,
        minStock: data.minStock,
        createdAt: new Date(),
      });
    });
    setShowForm(false);
  };

  const handleEditProduct = (data: ProductFormData) => {
    if (!editingProduct) return;
    realm.write(() => {
      editingProduct.ref = data.ref;
      editingProduct.designation = data.designation;
      editingProduct.buyPrice = data.buyPrice;
      editingProduct.sellPrice = data.sellPrice;
      editingProduct.minStock = data.minStock;
    });
    setEditingProduct(null);
  };

  const handleDeleteProduct = () => {
    if (!deletingProduct) return;
    realm.write(() => {
      realm.delete(deletingProduct);
    });
    setDeletingProduct(null);
  };

  return (
    <div className="app-shell">
      {/* 1. Fixed Sidebar on the Right (~82px wide, dark navy blue #0F3460) */}
      <aside className="backoffice-sidebar">
        <div className="sidebar-logo">SI</div>

        <div className="sidebar-nav">
          <button
            className={`sidebar-item${activeTab === 'products' ? ' active' : ''}`}
            onClick={() => setActiveTab('products')}
            title="المنتجات"
          >
            <span className="sidebar-icon">📦</span>
            <span className="sidebar-label">المنتجات</span>
          </button>

          <button
            className="sidebar-item"
            title="التصنيفات"
            onClick={() => setActiveTab('products')}
          >
            <span className="sidebar-icon">🏷️</span>
            <span className="sidebar-label">التصنيفات</span>
          </button>

          <button
            className="sidebar-item"
            title="الوحدات"
            onClick={() => setActiveTab('products')}
          >
            <span className="sidebar-icon">📐</span>
            <span className="sidebar-label">الوحدات</span>
          </button>

          <button
            className="sidebar-item"
            title="المستودعات"
            onClick={() => setActiveTab('products')}
          >
            <span className="sidebar-icon">🏢</span>
            <span className="sidebar-label">المستودعات</span>
          </button>

          <button
            className="sidebar-item"
            title="الموردون"
            onClick={() => setActiveTab('products')}
          >
            <span className="sidebar-icon">🚚</span>
            <span className="sidebar-label">الموردون</span>
          </button>

          <button
            className="sidebar-item"
            title="المستخدمون"
            onClick={() => setActiveTab('products')}
          >
            <span className="sidebar-icon">👤</span>
            <span className="sidebar-label">المستخدمون</span>
          </button>
        </div>

        <div className="sidebar-footer">
          <button
            className={`sidebar-item${activeTab === 'sales' ? ' active' : ''}`}
            onClick={() => setActiveTab('sales')}
            title="نقطة البيع POS"
          >
            <span className="sidebar-icon">🛒</span>
            <span className="sidebar-label">نقطة البيع</span>
          </button>

          <button
            className="sidebar-item"
            title="الإعدادات"
            onClick={() => setActiveTab('products')}
          >
            <span className="sidebar-icon">⚙️</span>
            <span className="sidebar-label">الإعدادات</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="backoffice-main">
        {/* 2. Top Header */}
        <header className="backoffice-header">
          <div className="header-title-area">
            <span className="header-breadcrumb">Back Office</span>
            <h1>إدارة المنتجات</h1>
          </div>

          <div className="header-info-badges">
            <div className="info-badge">
              <span>الفرع:</span>
              <strong>الفرع الرئيسي</strong>
            </div>
            <div className="info-badge">
              <span>الجلسة:</span>
              <strong>مدير النظام</strong>
            </div>
            <div className="info-badge">
              <span className="live-dot"></span>
              <span>متصل محلياً (Standalone)</span>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="backoffice-content">
          {activeTab === 'products' && (
            <>
              <ProductHeader
                count={productCount}
                lowStockCount={lowStockCount}
                outStockCount={outStockCount}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onAddClick={() => setShowForm(true)}
              />
              <ProductList
                products={products}
                searchQuery={searchQuery}
                onEdit={(p) => setEditingProduct(p)}
                onDelete={(p) => setDeletingProduct(p)}
              />
            </>
          )}

          {activeTab === 'sales' && (
            <SalesScreen products={products} realm={realm} />
          )}
        </div>

        {/* Bottom Status Bar */}
        <footer className="backoffice-status-bar">
          <div className="status-bar-left">
            <span>🚪</span>
            <span>تسجيل الخروج</span>
          </div>
          <div className="status-bar-right">
            <span>Smart Inventory ERP v0.1.0 — نظام إدارة المخزون والمبيعات التجاري</span>
          </div>
        </footer>
      </div>

      {/* Modals & Side Panels */}
      {showForm && (
        <ProductForm
          product={null}
          onSave={handleAddProduct}
          onCancel={() => setShowForm(false)}
        />
      )}

      {editingProduct && (
        <ProductForm
          product={editingProduct}
          onSave={handleEditProduct}
          onCancel={() => setEditingProduct(null)}
        />
      )}

      {deletingProduct && (
        <ConfirmDialog
          productName={deletingProduct.designation}
          onConfirm={handleDeleteProduct}
          onCancel={() => setDeletingProduct(null)}
        />
      )}
    </div>
  );
}

export default App;
