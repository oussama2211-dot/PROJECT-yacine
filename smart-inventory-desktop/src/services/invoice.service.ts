import Realm from 'realm';
import { Invoice, Client, Supplier, Settings } from '@shared/models/Schemas';
import { StockService } from './stock.service';

export interface InvoiceItemInput {
  productId: string;
  productRef: string;
  productDesignation: string;
  quantity: number;
  unitPriceHT: number;
  currentStock: number;
}

export interface CreateInvoiceDTO {
  type: 'sale' | 'purchase';
  clientId?: string;
  supplierId?: string;
  date: Date;
  items: InvoiceItemInput[];
  discountRate: number;
  tvaRate: number;
  notes?: string;
}

export interface InvoiceTotals {
  subtotalHT: number;
  discountAmount: number;
  tvaAmount: number;
  totalTTC: number;
}

export type PaymentStatus = 'unpaid' | 'partial' | 'paid';

// ─── Pure computation (no Realm) ─────────────────────────────────────────────
export function computeInvoiceTotals(
  items: { quantity: number; unitPriceHT: number }[],
  discountRate: number,
  tvaRate: number
): InvoiceTotals {
  const subtotalHT = items.reduce((sum, i) => sum + i.quantity * i.unitPriceHT, 0);
  const discountAmount = subtotalHT * (discountRate / 100);
  const taxableHT = subtotalHT - discountAmount;
  const tvaAmount = taxableHT * (tvaRate / 100);
  const totalTTC = taxableHT + tvaAmount;
  return { subtotalHT, discountAmount, tvaAmount, totalTTC };
}

export function getPaymentStatus(invoice: Invoice): PaymentStatus {
  if (invoice.amountPaid <= 0) return 'unpaid';
  if (invoice.amountPaid >= invoice.totalTTC) return 'paid';
  return 'partial';
}

// ─── InvoiceService ───────────────────────────────────────────────────────────
export const InvoiceService = {

  /**
   * Generates the next sequential invoice number within the fiscal year.
   * Reads + increments the Settings counter atomically.
   * MUST be called inside an existing realm.write() transaction.
   */
  _generateInvoiceNumber(realm: Realm, type: 'sale' | 'purchase'): string {
    const settings = realm.objectForPrimaryKey<Settings>('Settings', 'app-settings');
    if (!settings) throw new Error('Settings not initialized');

    const year = settings.currentFiscalYear;

    if (type === 'sale') {
      settings.lastSaleInvoiceSeq += 1;
      return `${String(settings.lastSaleInvoiceSeq).padStart(4, '0')}/${year}`;
    } else {
      settings.lastPurchaseInvoiceSeq += 1;
      return `ACH-${String(settings.lastPurchaseInvoiceSeq).padStart(4, '0')}/${year}`;
    }
  },

  /**
   * Creates an invoice in 'draft' state.
   * No stock changes occur at this stage.
   */
  createDraft(realm: Realm, data: CreateInvoiceDTO): Invoice {
    const totals = computeInvoiceTotals(data.items, data.discountRate, data.tvaRate);

    let draft!: Invoice;
    realm.write(() => {
      const client = data.clientId
        ? realm.objectForPrimaryKey<Client>('Client', new Realm.BSON.ObjectId(data.clientId))
        : undefined;
      const supplier = data.supplierId
        ? realm.objectForPrimaryKey<Supplier>('Supplier', new Realm.BSON.ObjectId(data.supplierId))
        : undefined;

      draft = realm.create<Invoice>('Invoice', {
        _id: new Realm.BSON.ObjectId(),
        invoiceNumber: 'DRAFT',
        type: data.type,
        status: 'draft',
        date: data.date,
        client: client ?? undefined,
        supplier: supplier ?? undefined,
        items: data.items.map(item => ({
          _id: new Realm.BSON.ObjectId(),
          product: realm.objectForPrimaryKey('Product', new Realm.BSON.ObjectId(item.productId))!,
          productRef: item.productRef,
          productDesignation: item.productDesignation,
          quantity: item.quantity,
          unitPriceHT: item.unitPriceHT,
          totalHT: item.quantity * item.unitPriceHT,
          tvaRate: data.tvaRate,
          totalTTC: item.quantity * item.unitPriceHT * (1 + data.tvaRate / 100),
        })),
        subtotalHT: totals.subtotalHT,
        discountRate: data.discountRate,
        discountAmount: totals.discountAmount,
        tvaRate: data.tvaRate,
        tvaAmount: totals.tvaAmount,
        totalTTC: totals.totalTTC,
        amountPaid: 0,
        notes: data.notes ?? '',
        createdAt: new Date(),
      });
    });

    return draft;
  },

  /**
   * Confirms a draft invoice.
   * Atomically:
   *   1. Assigns a permanent invoice number (increments Settings counter)
   *   2. Sets status = 'confirmed' + confirmedAt timestamp
   *   3. Creates StockMovements for each item and updates currentStock
   *   4. If paymentMode = 'Espèce', records full payment immediately
   */
  confirm(
    realm: Realm,
    invoiceId: string,
    paymentMode: string
  ): Invoice {
    const invoice = realm.objectForPrimaryKey<Invoice>('Invoice', new Realm.BSON.ObjectId(invoiceId));
    if (!invoice) throw new Error(`Invoice ${invoiceId} not found`);
    if (invoice.status !== 'draft') throw new Error(`Invoice ${invoiceId} is not a draft`);

    realm.write(() => {
      // 1. Generate permanent number
      invoice.invoiceNumber = InvoiceService._generateInvoiceNumber(realm, invoice.type as 'sale' | 'purchase');

      // 2. Confirm lifecycle
      invoice.status = 'confirmed';
      invoice.confirmedAt = new Date();

      // 3. Move stock for each line item
      for (const item of invoice.items) {
        const movementType = invoice.type === 'sale' ? 'sale_out' : 'purchase_in';
        StockService._moveStockInTransaction(realm, item.product._id.toString(), movementType, item.quantity, invoice.invoiceNumber);
      }

      // 4. If cash payment, record immediately
      if (paymentMode === 'Espèce') {
        realm.create('Payment', {
          _id: new Realm.BSON.ObjectId(),
          invoice,
          amount: invoice.totalTTC,
          date: new Date(),
          mode: 'Espèce',
          reference: '',
          notes: 'Paiement immédiat (espèce)',
          createdAt: new Date(),
        });
        invoice.amountPaid = invoice.totalTTC;
      }
    });

    return invoice;
  },

  /**
   * Cancels a confirmed invoice.
   * Atomically reverses all stock movements.
   */
  cancel(realm: Realm, invoiceId: string, reason: string): void {
    const invoice = realm.objectForPrimaryKey<Invoice>('Invoice', new Realm.BSON.ObjectId(invoiceId));
    if (!invoice) throw new Error(`Invoice ${invoiceId} not found`);
    if (invoice.status !== 'confirmed') throw new Error(`Cannot cancel invoice in status: ${invoice.status}`);

    realm.write(() => {
      // Reverse stock movements
      for (const item of invoice.items) {
        const reverseType = invoice.type === 'sale' ? 'return_in' : 'sale_out';
        StockService._moveStockInTransaction(realm, item.product._id.toString(), reverseType, item.quantity, `CANCEL:${invoice.invoiceNumber}`);
      }
      invoice.status = 'cancelled';
      invoice.notes = `[ANNULÉ: ${reason}] ${invoice.notes}`;
    });
  },
};
