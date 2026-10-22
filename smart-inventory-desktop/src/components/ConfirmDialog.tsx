import React, { useEffect } from 'react';

interface ConfirmDialogProps {
  productName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  productName,
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onCancel]);

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 380 }}>
        <div className="modal-body">
          <div className="confirm-body">
            <div className="warn-icon">⚠️</div>
            <p>
              هل أنت متأكد من حذف <span className="item-name">{productName}</span>؟
            </p>
            <p style={{ fontSize: '12px', marginTop: 8 }}>
              لا يمكن التراجع عن هذا الإجراء.
            </p>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onCancel}>
            إلغاء
          </button>
          <button className="btn btn-danger" onClick={onConfirm}>
            تأكيد الحذف
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
