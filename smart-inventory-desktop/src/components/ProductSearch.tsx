import React, { useState, useMemo } from 'react';
import type { Product } from '@shared/models/Schemas';
import type { CartEntry } from './SalesScreen';

interface ProductSearchProps {
  products: Realm.Results<Product & Realm.Object<Product>> | Product[];
  cart: CartEntry[];
  onSelect: (product: Product) => void;
  searchRef: React.RefObject<HTMLInputElement | null>;
}

const ProductSearch: React.FC<ProductSearchProps> = ({
  products,
  cart,
  onSelect,
  searchRef,
}) => {
  const [query, setQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const productList = useMemo(() => Array.from(products), [products]);

  const filtered = useMemo(() => {
    if (!query.trim()) return productList;
    const q = query.toLowerCase();
    return productList.filter((p) => p.designation.toLowerCase().includes(q) || p.ref.toLowerCase().includes(q));
  }, [productList, query]);

  const getCartQty = (productId: string) => {
    const entry = cart.find((e) => e.product._id.toHexString() === productId);
    return entry?.quantity ?? 0;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const product = filtered[highlightedIndex];
      if (product && product.currentStock > 0) {
        onSelect(product);
        setQuery('');
        setHighlightedIndex(0);
      }
    }
  };

  const handleSelect = (product: Product) => {
    if (product.currentStock === 0) return;
    onSelect(product);
    setQuery('');
    setHighlightedIndex(0);
    searchRef.current?.focus();
  };

  const formatCurrency = (n: number) => `${n.toFixed(2)} DA`;

  return (
    <>
      <div className="pos-search-bar">
        <input
          ref={searchRef}
          type="text"
          className="pos-search-input"
          placeholder="Search products... (type and press Enter)"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setHighlightedIndex(0);
          }}
          onKeyDown={handleKeyDown}
        />
      </div>
      <ul className="search-results" role="listbox">
        {filtered.length === 0 ? (
          <li className="search-empty">
            {query ? 'No products found' : 'Type to search for products'}
          </li>
        ) : (
          filtered.map((product, index) => {
            const cartQty = getCartQty(product._id.toHexString());
            const outOfStock = product.currentStock === 0;

            return (
              <li
                key={product._id.toHexString()}
                className={`result-row${index === highlightedIndex ? ' highlighted' : ''}${outOfStock ? ' out-of-stock' : ''}`}
                role="option"
                aria-selected={index === highlightedIndex}
                onClick={() => handleSelect(product)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                <span className="result-name">{product.designation}</span>
                {cartQty > 0 && (
                  <span className="result-in-cart">×{cartQty}</span>
                )}
                <span className="result-price">
                  {formatCurrency(product.sellPrice)}
                </span>
                <span className="result-stock">
                  {outOfStock ? 'Out of stock' : `${product.currentStock} avail`}
                </span>
              </li>
            );
          })
        )}
      </ul>
    </>
  );
};

export default ProductSearch;
