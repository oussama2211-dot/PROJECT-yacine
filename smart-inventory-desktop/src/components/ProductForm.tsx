import React, { useState, useEffect, useRef } from 'react';
import type { Product } from '@shared/models/Schemas';

interface ProductFormProps {
  product: Product | null;
  onSave: (data: ProductFormData) => void;
  onCancel: () => void;
}

export interface ProductFormData {
  ref: string;
  designation: string;
  buyPrice: number;
  sellPrice: number;
  minStock: number;
}

const ProductForm: React.FC<ProductFormProps> = ({ product, onSave, onCancel }) => {
  const [ref, setRef] = useState(product?.ref ?? '');
  const [designation, setDesignation] = useState(product?.designation ?? '');
  const [buyPrice, setBuyPrice] = useState(product?.buyPrice?.toString() ?? '0');
  const [sellPrice, setSellPrice] = useState(product?.sellPrice?.toString() ?? '0');
  const [minStock, setMinStock] = useState(
    product?.minStock?.toString() ?? '5'
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!ref.trim()) e.ref = 'المررمز مطلوب';
    if (!designation.trim()) e.designation = 'اسم المنتج مطلوب';
    if (Number(buyPrice) < 0) e.buyPrice = 'يجب أن يكون أكبر من أو يساوي 0';
    if (Number(sellPrice) < 0) e.sellPrice = 'يجب أن يكون أكبر من أو يساوي 0';
    if (Number(sellPrice) < Number(buyPrice)) {
      e.sellPrice = 'يجب أن يكون سعر البيع أكبر من أو يساوي سعر الشراء';
    }
    if (Number(minStock) < 0) e.minStock = 'يجب أن يكون أكبر من أو يساوي 0';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSave({
      ref: ref.trim(),
      designation: designation.trim(),
      buyPrice: Number(buyPrice),
      sellPrice: Number(sellPrice),
      minStock: Math.floor(Number(minStock)),
    });
  };

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onCancel]);

  return (
    <div className="side-panel-backdrop" onClick={onCancel}>
      <div className="side-panel" onClick={(e) => e.stopPropagation()}>
        <div className="side-panel-header">
          <div className="side-panel-title">
            <h2>{product ? 'تعديل بيانات المنتج' : 'إضافة منتج جديد'}</h2>
            <p>{product ? 'تحديث معلومات الصنف الحالي' : 'إدخال بيانات الصنف الجديد في النظام'}</p>
          </div>
          <button className="btn-icon-only" onClick={onCancel}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div className="side-panel-body">
            <div className="form-field">
              <label><span className="required">*</span> اسم المنتج (التسمية)</label>
              <input
                ref={nameRef}
                type="text"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="مثال: كوكا كولا 33 سل"
              />
              {errors.designation && <div className="form-error">{errors.designation}</div>}
            </div>

            <div className="form-row-2">
              <div className="form-field">
                <label><span className="required">*</span> رمز SKU / الباركود</label>
                <input
                  type="text"
                  value={ref}
                  onChange={(e) => setRef(e.target.value)}
                  placeholder="مثال: REF-001"
                />
                {errors.ref && <div className="form-error">{errors.ref}</div>}
              </div>
              <div className="form-field">
                <label>الباركود الأساسي</label>
                <input type="text" placeholder="اختياري" defaultValue={ref} />
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-field">
                <label><span className="required">*</span> التصنيف</label>
                <select defaultValue="general">
                  <option value="general">عام / افتراضي</option>
                </select>
              </div>
              <div className="form-field">
                <label>الوحدة</label>
                <select defaultValue="pcs">
                  <option value="pcs">قطعة (Pcs)</option>
                  <option value="kg">كيلوغرام</option>
                  <option value="pack">علبة</option>
                </select>
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-field">
                <label>نوع المنتج</label>
                <select defaultValue="regular">
                  <option value="regular">قياسي (Regular)</option>
                </select>
              </div>
              <div className="form-field">
                <label><span className="required">*</span> سعر البيع (دج)</label>
                <input
                  type="number"
                  value={sellPrice}
                  onChange={(e) => setSellPrice(e.target.value)}
                  min="0"
                  step="0.01"
                />
                {errors.sellPrice && <div className="form-error">{errors.sellPrice}</div>}
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-field">
                <label>سعر التكلفة (دج)</label>
                <input
                  type="number"
                  value={buyPrice}
                  onChange={(e) => setBuyPrice(e.target.value)}
                  min="0"
                  step="0.01"
                />
                {errors.buyPrice && <div className="form-error">{errors.buyPrice}</div>}
              </div>
              <div className="form-field">
                <label>تنبيه الحد الأدنى للمخزون</label>
                <input
                  type="number"
                  value={minStock}
                  onChange={(e) => setMinStock(e.target.value)}
                  min="0"
                  step="1"
                />
                {errors.minStock && <div className="form-error">{errors.minStock}</div>}
              </div>
            </div>

            <div className="form-field">
              <label>وصف مختصر</label>
              <textarea rows={2} placeholder="ملاحظات حول المنتج..." style={{ resize: 'none' }}></textarea>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
              <label className="checkbox-group">
                <input type="checkbox" defaultChecked /> منتج نشط
              </label>
              <label className="checkbox-group">
                <input type="checkbox" defaultChecked /> إظهار في نقطة البيع (POS)
              </label>
              <label className="checkbox-group">
                <input type="checkbox" defaultChecked /> تتبع المخزون
              </label>
            </div>
          </div>

          <div className="side-panel-footer">
            <button type="button" className="btn btn-outline" onClick={onCancel}>
              إلغاء
            </button>
            <button type="submit" className="btn btn-primary">
              {product ? 'حفظ التغييرات' : 'حفظ المنتج'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;
