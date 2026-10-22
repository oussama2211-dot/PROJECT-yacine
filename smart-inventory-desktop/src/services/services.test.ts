import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Realm from 'realm';
import { ALL_SCHEMAS, Category, Product, Client } from '@shared/models/Schemas';
import { InvoiceService, computeInvoiceTotals, getPaymentStatus } from './invoice.service';
import { PaymentService } from './payment.service';

describe('Smart Inventory Domain Services Test Suite', () => {
  let realm: Realm;

  beforeEach(() => {
    realm = new Realm({
      schema: ALL_SCHEMAS,
      inMemory: true,
      path: 'test-realm-' + Date.now() + Math.random(),
    });

    // Initialize default Settings singleton
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

  // 1. Invoice Totals & Pure Computation
  it('computes invoice totals correctly (subtotal, discount, TVA, TTC)', () => {
    const items = [
      { quantity: 10, unitPriceHT: 100 }, // 1000
      { quantity: 5, unitPriceHT: 200 },  // 1000
    ];
    // subtotal = 2000, discount 10% = 200, taxable = 1800, TVA 19% = 342, totalTTC = 2142
    const totals = computeInvoiceTotals(items, 10, 19);
    expect(totals.subtotalHT).toBe(2000);
    expect(totals.discountAmount).toBe(200);
    expect(totals.tvaAmount).toBe(342);
    expect(totals.totalTTC).toBe(2142);
  });

  // 2. Draft Creation & Payment Status
  it('creates an invoice draft without stock changes and evaluates payment status', () => {
    let category: Category;
    let product: Product;
    let client: Client;

    realm.write(() => {
      category = realm.create<Category>('Category', {
        _id: new Realm.BSON.ObjectId(),
        name: 'Électronique',
      });
      product = realm.create<Product>('Product', {
        _id: new Realm.BSON.ObjectId(),
        ref: 'PROD-01',
        designation: 'Laptop',
        category,
        buyPrice: 80000,
        sellPrice: 100000,
        currentStock: 15,
        minStock: 2,
        createdAt: new Date(),
      });
      client = realm.create<Client>('Client', {
        _id: new Realm.BSON.ObjectId(),
        code: 'CLI-01',
        name: 'Client Alpha',
        createdAt: new Date(),
      });
    });

    const draft = InvoiceService.createDraft(realm, {
      type: 'sale',
      clientId: client!._id.toString(),
      date: new Date(),
      items: [
        {
          productId: product!._id.toString(),
          productRef: product!.ref,
          productDesignation: product!.designation,
          quantity: 2,
          unitPriceHT: 100000,
          currentStock: product!.currentStock,
        },
      ],
      discountRate: 0,
      tvaRate: 19,
      notes: 'Test draft',
    });

    expect(draft.invoiceNumber).toBe('DRAFT');
    expect(draft.status).toBe('draft');
    expect(draft.totalTTC).toBe(238000); // 200000 + 19% TVA
    expect(getPaymentStatus(draft)).toBe('unpaid');

    // Verify stock did NOT change in draft state
    const reloadedProduct = realm.objectForPrimaryKey<Product>('Product', product!._id);
    expect(reloadedProduct?.currentStock).toBe(15);
  });

  // 3. Invoice Confirmation, Fiscal Numbering, Stock Reduction & Immediate Cash Payment
  it('confirms draft invoice, assigns fiscal number, reduces stock, and records cash payment', () => {
    let category: Category;
    let product: Product;
    let client: Client;

    realm.write(() => {
      category = realm.create<Category>('Category', {
        _id: new Realm.BSON.ObjectId(),
        name: 'General',
      });
      product = realm.create<Product>('Product', {
        _id: new Realm.BSON.ObjectId(),
        ref: 'PRD-02',
        designation: 'Tablette',
        category,
        buyPrice: 30000,
        sellPrice: 40000,
        currentStock: 10,
        createdAt: new Date(),
      });
      client = realm.create<Client>('Client', {
        _id: new Realm.BSON.ObjectId(),
        code: 'CLI-02',
        name: 'Client Beta',
        createdAt: new Date(),
      });
    });

    const draft = InvoiceService.createDraft(realm, {
      type: 'sale',
      clientId: client!._id.toString(),
      date: new Date(),
      items: [
        {
          productId: product!._id.toString(),
          productRef: product!.ref,
          productDesignation: product!.designation,
          quantity: 3,
          unitPriceHT: 40000,
          currentStock: product!.currentStock,
        },
      ],
      discountRate: 0,
      tvaRate: 19,
    });

    const confirmed = InvoiceService.confirm(realm, draft._id.toString(), 'Espèce');

    expect(confirmed.status).toBe('confirmed');
    expect(confirmed.invoiceNumber).toBe('0001/2026');
    expect(confirmed.amountPaid).toBe(confirmed.totalTTC);

    // Verify stock reduction: 10 - 3 = 7
    const reloadedProduct = realm.objectForPrimaryKey<Product>('Product', product!._id);
    expect(reloadedProduct?.currentStock).toBe(7);

    // Verify stock movement created
    const movements = realm.objects('StockMovement');
    expect(movements.length).toBe(1);
  });

  // 4. Stock Validation & Negative Inventory Prevention
  it('prevents negative stock and throws error on insufficient stock', () => {
    let category: Category;
    let product: Product;

    realm.write(() => {
      category = realm.create<Category>('Category', {
        _id: new Realm.BSON.ObjectId(),
        name: 'General',
      });
      product = realm.create<Product>('Product', {
        _id: new Realm.BSON.ObjectId(),
        ref: 'PRD-03',
        designation: 'Imprimante',
        category,
        buyPrice: 20000,
        sellPrice: 30000,
        currentStock: 2, // Only 2 in stock
        createdAt: new Date(),
      });
    });

    const draft = InvoiceService.createDraft(realm, {
      type: 'sale',
      date: new Date(),
      items: [
        {
          productId: product!._id.toString(),
          productRef: product!.ref,
          productDesignation: product!.designation,
          quantity: 5, // Demanding 5 when stock is 2
          unitPriceHT: 30000,
          currentStock: product!.currentStock,
        },
      ],
      discountRate: 0,
      tvaRate: 19,
    });

    expect(() => {
      InvoiceService.confirm(realm, draft._id.toString(), 'Virement');
    }).toThrowError(/Stock insuffisant/);

    // Verify stock unchanged
    const reloadedProduct = realm.objectForPrimaryKey<Product>('Product', product!._id);
    expect(reloadedProduct?.currentStock).toBe(2);
  });

  // 5. Invoice Cancellation & Stock Restoration
  it('cancels confirmed invoice and restores stock via return_in movement', () => {
    let category: Category;
    let product: Product;

    realm.write(() => {
      category = realm.create<Category>('Category', {
        _id: new Realm.BSON.ObjectId(),
        name: 'General',
      });
      product = realm.create<Product>('Product', {
        _id: new Realm.BSON.ObjectId(),
        ref: 'PRD-04',
        designation: 'Ecran',
        category,
        buyPrice: 15000,
        sellPrice: 25000,
        currentStock: 10,
        createdAt: new Date(),
      });
    });

    const draft = InvoiceService.createDraft(realm, {
      type: 'sale',
      date: new Date(),
      items: [
        {
          productId: product!._id.toString(),
          productRef: product!.ref,
          productDesignation: product!.designation,
          quantity: 4,
          unitPriceHT: 25000,
          currentStock: product!.currentStock,
        },
      ],
      discountRate: 0,
      tvaRate: 19,
    });

    const confirmed = InvoiceService.confirm(realm, draft._id.toString(), 'Crédit');
    expect(confirmed.status).toBe('confirmed');

    let reloadedProduct = realm.objectForPrimaryKey<Product>('Product', product!._id);
    expect(reloadedProduct?.currentStock).toBe(6); // 10 - 4

    // Cancel invoice
    InvoiceService.cancel(realm, confirmed._id.toString(), 'Erreur de commande');

    expect(confirmed.status).toBe('cancelled');
    reloadedProduct = realm.objectForPrimaryKey<Product>('Product', product!._id);
    expect(reloadedProduct?.currentStock).toBe(10); // Restored back to 10
  });

  // 6. Payment Processing, Partial Payments & Overpayment Protection
  it('records partial payments, updates amountPaid, and prevents overpayment', () => {
    let category: Category;
    let product: Product;
    let client: Client;

    realm.write(() => {
      category = realm.create<Category>('Category', {
        _id: new Realm.BSON.ObjectId(),
        name: 'General',
      });
      product = realm.create<Product>('Product', {
        _id: new Realm.BSON.ObjectId(),
        ref: 'PRD-05',
        designation: 'Clavier',
        category,
        buyPrice: 2000,
        sellPrice: 3000,
        currentStock: 20,
        createdAt: new Date(),
      });
      client = realm.create<Client>('Client', {
        _id: new Realm.BSON.ObjectId(),
        code: 'CLI-03',
        name: 'Client Gamma',
        createdAt: new Date(),
      });
    });

    const draft = InvoiceService.createDraft(realm, {
      type: 'sale',
      clientId: client!._id.toString(),
      date: new Date(),
      items: [
        {
          productId: product!._id.toString(),
          productRef: product!.ref,
          productDesignation: product!.designation,
          quantity: 10,
          unitPriceHT: 3000, // 30000 HT -> 35700 TTC
          currentStock: product!.currentStock,
        },
      ],
      discountRate: 0,
      tvaRate: 19,
    });

    const confirmed = InvoiceService.confirm(realm, draft._id.toString(), 'Crédit');
    const totalTTC = confirmed.totalTTC;

    expect(PaymentService.getPaymentStatus(confirmed)).toBe('unpaid');
    expect(PaymentService.getRemainingBalance(confirmed)).toBe(totalTTC);

    // Record partial payment 10000 DA
    PaymentService.recordPayment(realm, confirmed._id.toString(), 10000, 'Chèque', new Date(), 'CHQ-123');
    expect(confirmed.amountPaid).toBe(10000);
    expect(PaymentService.getPaymentStatus(confirmed)).toBe('partial');
    expect(PaymentService.getRemainingBalance(confirmed)).toBe(totalTTC - 10000);

    // Attempt overpayment (exceeding remaining balance)
    const remaining = PaymentService.getRemainingBalance(confirmed);
    expect(() => {
      PaymentService.recordPayment(realm, confirmed._id.toString(), remaining + 5000, 'Espèce', new Date());
    }).toThrowError(/dépasse le solde restant/);
  });
});
