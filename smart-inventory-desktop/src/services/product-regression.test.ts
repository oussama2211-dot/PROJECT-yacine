import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Realm from 'realm';
import { ALL_SCHEMAS, Category, Product } from '@shared/models/Schemas';
import { InvoiceService } from './invoice.service';

describe('Product Management & Business Rules Regression Test Suite', () => {
  let realm: Realm;

  beforeEach(() => {
    realm = new Realm({
      schema: ALL_SCHEMAS,
      inMemory: true,
      path: 'test-realm-product-' + Date.now() + Math.random(),
    });

    realm.write(() => {
      realm.create('Settings', {
        _id: 'app-settings',
        companyName: 'Test SARL',
        tvaRate: 19,
        currentFiscalYear: 2026,
        lastSaleInvoiceSeq: 0,
        lastPurchaseInvoiceSeq: 0,
      });
    });
  });

  afterEach(() => {
    if (realm && !realm.isClosed) {
      realm.close();
    }
  });

  // 1. Stock Status Boundary Calculations
  it('correctly categorizes stock status (Out of Stock, Low Stock, In Stock)', () => {
    const getStockStatus = (currentStock: number, minStock: number) => {
      if (currentStock === 0) return { label: 'نفد المخزون', className: 'stock-out' };
      if (currentStock <= minStock) return { label: 'مخزون منخفض', className: 'stock-low' };
      return { label: 'متوفر', className: 'stock-ok' };
    };

    expect(getStockStatus(0, 5).className).toBe('stock-out');
    expect(getStockStatus(5, 5).className).toBe('stock-low');
    expect(getStockStatus(2, 5).className).toBe('stock-low');
    expect(getStockStatus(6, 5).className).toBe('stock-ok');
  });

  // 2. Profit Margin Calculations (including zero purchase price)
  it('calculates monetary and percentage profit margin correctly, handling zero buy price', () => {
    const calcMargin = (buyPrice: number, sellPrice: number) => {
      const margin = sellPrice - buyPrice;
      const marginPct = buyPrice > 0 ? ((margin / buyPrice) * 100).toFixed(0) : '—';
      return { margin, marginPct };
    };

    const normal = calcMargin(100, 150);
    expect(normal.margin).toBe(50);
    expect(normal.marginPct).toBe('50');

    const zeroBuy = calcMargin(0, 100);
    expect(zeroBuy.margin).toBe(100);
    expect(zeroBuy.marginPct).toBe('—');
  });

  // 3. Product Deletion Protection (Referenced in Historical Invoices)
  it('identifies if a product is referenced by historical invoices and prevents deletion safety check', () => {
    let category: Category;
    let product: Product;
    let client;

    realm.write(() => {
      category = realm.create<Category>('Category', {
        _id: new Realm.BSON.ObjectId(),
        name: 'Test Cat',
      });
      product = realm.create<Product>('Product', {
        _id: new Realm.BSON.ObjectId(),
        ref: 'REF-HIST',
        designation: 'Historical Item',
        category,
        buyPrice: 100,
        sellPrice: 200,
        currentStock: 10,
        createdAt: new Date(),
      });
      client = realm.create('Client', {
        _id: new Realm.BSON.ObjectId(),
        code: 'CLI-1',
        name: 'Client 1',
        createdAt: new Date(),
      });
    });

    // Create draft and confirm invoice using InvoiceService (handles embedded item creation correctly)
    const draft = InvoiceService.createDraft(realm, {
      type: 'sale',
      clientId: client._id.toString(),
      date: new Date(),
      items: [
        {
          productId: product._id.toString(),
          productRef: product.ref,
          productDesignation: product.designation,
          quantity: 2,
          unitPriceHT: 200,
          currentStock: product.currentStock,
        },
      ],
      discountRate: 0,
      tvaRate: 19,
    });

    InvoiceService.confirm(realm, draft._id.toString(), 'Espèce');

    // Check if any invoice references this product
    const referencingInvoices = realm.objects('Invoice').filtered('items.product == $0', product);
    expect(referencingInvoices.length).toBe(1);

    // Business safety rule: if referencingInvoices.length > 0, block hard deletion
    const canDelete = referencingInvoices.length === 0;
    expect(canDelete).toBe(false);
  });
});
