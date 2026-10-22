import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Realm } from '@realm/react';
import type { Product } from '@shared/models/Schemas';
import ProductSearch from './ProductSearch';
import Cart from './Cart';
import SaleToast from './SaleToast';

export interface CartEntry {
  product: Product;
  quantity: number;
  lineTotal: number;
}

interface SalesScreenProps {
  products: Realm.Results<Product & Realm.Object<Product>> | Product[];
  realm: Realm;
}

const SalesScreen: React.FC<SalesScreenProps> = ({ products, realm }) => {
  const [cart, setCart] = useState<CartEntry[]>([]);
  const [toast, setToast] = useState<{ message: string; amount: number } | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Focus search on mount
  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  const grandTotal = useMemo(
    () => cart.reduce((sum, e) => sum + e.lineTotal, 0),
    [cart]
  );

  const focusSearch = useCallback(() => {
    setTimeout(() => searchRef.current?.focus(), 0);
  }, []);

  const addToCart = useCallback((product: Product) => {
    if (product.currentStock === 0) return;

    setCart((prev) => {
      const existing = prev.find(
        (e) => e.product._id.toHexString() === product._id.toHexString()
      );
      if (existing) {
        // Increment qty (up to available stock)
        const newQty = Math.min(existing.quantity + 1, product.currentStock);
        return prev.map((e) =>
          e.product._id.toHexString() === product._id.toHexString()
            ? { ...e, quantity: newQty, lineTotal: newQty * product.sellPrice }
            : e
        );
      }
      return [
        ...prev,
        { product, quantity: 1, lineTotal: product.sellPrice },
      ];
    });

    focusSearch();
  }, [focusSearch]);

  const updateQty = useCallback((productId: string, newQty: number) => {
    setCart((prev) =>
      prev.map((e) => {
        if (e.product._id.toHexString() !== productId) return e;
        const clamped = Math.max(1, Math.min(newQty, e.product.currentStock));
        return { ...e, quantity: clamped, lineTotal: clamped * e.product.sellPrice };
      })
    );
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((e) => e.product._id.toHexString() !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    focusSearch();
  }, [focusSearch]);

  const completeSale = useCallback(() => {
    if (cart.length === 0) return;

    // Validate stock
    const stockError = cart.find((e) => e.quantity > e.product.currentStock);
    if (stockError) return;

    const total = cart.reduce((sum, e) => sum + e.lineTotal, 0);

    try {
      realm.write(() => {
        // Use InvoiceService or direct creation matching ERP domain model if desired
        // Here we create a confirmed sale invoice atomically
        const itemsList = cart.map((e) => ({
          _id: new Realm.BSON.ObjectId(),
          product: e.product,
          productRef: e.product.ref,
          productDesignation: e.product.designation,
          quantity: e.quantity,
          unitPriceHT: e.product.sellPrice,
          totalHT: e.quantity * e.product.sellPrice,
          tvaRate: 19,
          totalTTC: e.quantity * e.product.sellPrice * 1.19,
        }));

        const subtotalHT = itemsList.reduce((s, i) => s + i.totalHT, 0);
        const tvaAmount = subtotalHT * 0.19;
        const totalTTC = subtotalHT + tvaAmount;

        const invoice = realm.create('Invoice', {
          _id: new Realm.BSON.ObjectId(),
          invoiceNumber: `POS-${Date.now().toString().slice(-6)}`,
          type: 'sale',
          status: 'confirmed',
          date: new Date(),
          items: itemsList,
          subtotalHT,
          discountRate: 0,
          discountAmount: 0,
          tvaRate: 19,
          tvaAmount,
          totalTTC,
          amountPaid: totalTTC,
          notes: 'POS Sale',
          createdAt: new Date(),
          confirmedAt: new Date(),
        });

        // Reduce stock via StockMovements
        for (const item of invoice.items) {
          const product = item.product;
          const stockBefore = product.currentStock;
          const stockAfter = stockBefore - item.quantity;
          product.currentStock = stockAfter;

          realm.create('StockMovement', {
            _id: new Realm.BSON.ObjectId(),
            product,
            type: 'sale_out',
            quantity: item.quantity,
            stockBefore,
            stockAfter,
            invoiceRef: invoice.invoiceNumber,
            date: new Date(),
            notes: 'POS Sale Outbound',
          });
        }

        // Record payment
        realm.create('Payment', {
          _id: new Realm.BSON.ObjectId(),
          invoice,
          amount: totalTTC,
          date: new Date(),
          mode: 'Espèce',
          reference: '',
          notes: 'POS Cash Payment',
          createdAt: new Date(),
        });
      });

      setToast({ message: 'Sale completed', amount: total });
      setCart([]);
      focusSearch();
    } catch (err) {
      console.error('Failed to complete sale:', err);
    }
  }, [cart, realm, focusSearch]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        completeSale();
      }
      if (e.key === 'Escape') {
        focusSearch();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [completeSale, focusSearch]);

  return (
    <div className="sales-layout">
      <div className="search-panel">
        <ProductSearch
          products={products}
          cart={cart}
          onSelect={addToCart}
          searchRef={searchRef}
        />
      </div>
      <div className="cart-panel">
        <Cart
          items={cart}
          grandTotal={grandTotal}
          onUpdateQty={updateQty}
          onRemove={removeFromCart}
          onClear={clearCart}
          onCompleteSale={completeSale}
        />
      </div>
      {toast && (
        <SaleToast
          message={toast.message}
          amount={toast.amount}
          onDismiss={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default SalesScreen;
