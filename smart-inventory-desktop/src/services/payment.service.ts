import Realm from 'realm';
import { Invoice, Payment } from '@shared/models/Schemas';
import { getPaymentStatus } from './invoice.service';

export const PaymentService = {

  /**
   * Records a partial or full payment against an invoice.
   * Atomically:
   *   1. Creates Payment record
   *   2. Updates invoice.amountPaid
   * Throws if overpayment attempted.
   */
  recordPayment(
    realm: Realm,
    invoiceId: string,
    amount: number,
    mode: string,
    date: Date,
    reference: string = '',
    notes: string = ''
  ): Payment {
    const invoice = realm.objectForPrimaryKey<Invoice>('Invoice', new Realm.BSON.ObjectId(invoiceId));
    if (!invoice) throw new Error(`Invoice ${invoiceId} not found`);
    if (invoice.status !== 'confirmed') throw new Error('Can only record payment on confirmed invoices');

    const remaining = invoice.totalTTC - invoice.amountPaid;
    if (amount > remaining + 0.01) {
      throw new Error(`Montant (${amount} DA) dépasse le solde restant (${remaining.toFixed(2)} DA)`);
    }
    if (amount <= 0) throw new Error('Le montant doit être positif');

    let payment!: Payment;
    realm.write(() => {
      payment = realm.create<Payment>('Payment', {
        _id: new Realm.BSON.ObjectId(),
        invoice,
        amount,
        date,
        mode,
        reference,
        notes,
        createdAt: new Date(),
      });
      invoice.amountPaid = Math.min(invoice.amountPaid + amount, invoice.totalTTC);
    });

    return payment;
  },

  /**
   * Voids a payment (e.g. bounced cheque).
   * Decrements invoice.amountPaid atomically.
   */
  voidPayment(realm: Realm, paymentId: string, reason: string): void {
    const payment = realm.objectForPrimaryKey<Payment>('Payment', new Realm.BSON.ObjectId(paymentId));
    if (!payment) throw new Error(`Payment ${paymentId} not found`);

    realm.write(() => {
      const invoice = payment.invoice;
      invoice.amountPaid = Math.max(0, invoice.amountPaid - payment.amount);
      payment.notes = `[ANNULÉ: ${reason}] ${payment.notes}`;
      // Soft-delete: mark as voided via notes prefix rather than deleting for audit
    });
  },

  /**
   * Returns remaining amount owed on an invoice. Pure function.
   */
  getRemainingBalance(invoice: Invoice): number {
    return Math.max(0, invoice.totalTTC - invoice.amountPaid);
  },

  /**
   * Returns total outstanding receivables for a client.
   * = SUM(invoice.totalTTC - invoice.amountPaid) for confirmed sale invoices
   */
  getClientOutstandingBalance(realm: Realm, clientId: string): number {
    const invoices = realm.objects<Invoice>('Invoice').filtered(
      'client._id == $0 AND type == "sale" AND status == "confirmed"',
      new Realm.BSON.ObjectId(clientId)
    );
    return invoices.reduce((sum, inv) => sum + Math.max(0, inv.totalTTC - inv.amountPaid), 0);
  },

  /**
   * Returns total outstanding payables to a supplier.
   */
  getSupplierOutstandingBalance(realm: Realm, supplierId: string): number {
    const invoices = realm.objects<Invoice>('Invoice').filtered(
      'supplier._id == $0 AND type == "purchase" AND status == "confirmed"',
      new Realm.BSON.ObjectId(supplierId)
    );
    return invoices.reduce((sum, inv) => sum + Math.max(0, inv.totalTTC - inv.amountPaid), 0);
  },

  /**
   * Gets all payments for an invoice, most recent first.
   */
  getInvoicePayments(realm: Realm, invoiceId: string): Realm.Results<Payment & Realm.Object<Payment>> {
    return realm.objects<Payment>('Payment')
      .filtered('invoice._id == $0', new Realm.BSON.ObjectId(invoiceId))
      .sorted('date', true);
  },

  getPaymentStatus,
};
