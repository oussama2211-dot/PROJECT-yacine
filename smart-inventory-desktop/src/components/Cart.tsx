import React from 'react';
import type { CartEntry } from './SalesScreen';

interface CartProps {
  items: CartEntry[];
  grandTotal: number;
  onUpdateQty: (productId: string, newQty: number) => void;
  onRemove: (productId: string) => void;
  onClear: () => void;
  onCompleteSale: () => void;
}

const Cart: React.FC<CartProps> = ({
  items,
  grandTotal,
  onUpdateQty,
  onRemove,
  onClear,
  onCompleteSale,
}) => {
  const formatCurrency = (n: number) => `$${n.toFixed(2)}`;

  const handleQtyKeyDown = (e: React.KeyboardEvent, productId: string) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      const input = e.target as HTMLInputElement;
      if (input.value === '' || input.value === '0') {
        e.preventDefault();
        onRemove(productId);
      }
    }
  };

  return (
    <>
      <div className="cart-header">
        <h2>
          Cart <span className="item-count">({items.length} items)</span>
        </h2>
        {items.length > 0 && (
          <button className="btn btn-ghost" onClick={onClear} style={{ fontSize: '12px' }}>
            Clear all
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="cart-empty">
          <div className="empty-icon">🛒</div>
          <p>Search for products to start a sale</p>
          <p style={{ fontSize: '11px' }}>
            Type in the search box and press Enter
          </p>
        </div>
      ) : (
        <div className="cart-items">
          {items.map((entry) => {
            const id = entry.product._id.toHexString();
            return (
              <div className="cart-item" key={id}>
                <div className="cart-item-info">
                  <div className="cart-item-name">{entry.product.designation}</div>
                  <div className="cart-item-price">
                    {formatCurrency(entry.product.sellPrice)} each
                  </div>
                </div>
                <div className="qty-controls">
                  <button
                    className="qty-btn"
                    onClick={() => {
                      if (entry.quantity <= 1) {
                        onRemove(id);
                      } else {
                        onUpdateQty(id, entry.quantity - 1);
                      }
                    }}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    className={`qty-input${entry.quantity > entry.product.currentStock ? ' qty-error' : ''}`}
                    value={entry.quantity}
                    min={1}
                    max={entry.product.currentStock}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val)) onUpdateQty(id, val);
                    }}
                    onKeyDown={(e) => handleQtyKeyDown(e, id)}
                    onFocus={(e) => e.target.select()}
                  />
                  <button
                    className="qty-btn"
                    onClick={() => onUpdateQty(id, entry.quantity + 1)}
                    disabled={entry.quantity >= entry.product.currentStock}
                  >
                    +
                  </button>
                </div>
                <span className="cart-item-total">
                  {formatCurrency(entry.lineTotal)}
                </span>
                <button
                  className="btn-icon danger"
                  onClick={() => onRemove(id)}
                  title="Remove"
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="cart-footer">
        <div className="cart-total-row">
          <span className="cart-total-label">Total</span>
          <span className="cart-total-amount">{formatCurrency(grandTotal)}</span>
        </div>
        <button
          className="complete-sale-btn"
          disabled={items.length === 0}
          onClick={onCompleteSale}
        >
          Complete Sale
          <span className="shortcut">[F2]</span>
        </button>
      </div>
    </>
  );
};

export default Cart;
