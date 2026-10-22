import Realm from 'realm';
import { Product, StockMovement } from '@shared/models/Schemas';

export type StockMovementType = 'sale_out' | 'purchase_in' | 'adjustment' | 'return_in' | 'loss';

export const StockService = {

  /**
   * INTERNAL — called by InvoiceService inside an existing realm.write().
   * Creates a StockMovement and updates product.currentStock atomically.
   * Do NOT call this directly from UI.
   */
  _moveStockInTransaction(
    realm: Realm,
    productId: string,
    type: StockMovementType,
    quantity: number,
    invoiceRef: string = '',
    notes: string = ''
  ): void {
    const product = realm.objectForPrimaryKey<Product>('Product', new Realm.BSON.ObjectId(productId));
    if (!product) throw new Error(`Product ${productId} not found`);

    const stockBefore = product.currentStock;
    const isInbound = type === 'purchase_in' || type === 'return_in';
    const delta = isInbound ? quantity : -quantity;
    const stockAfter = stockBefore + delta;

    // Prevent negative stock on outbound movements
    if (!isInbound && stockAfter < 0) {
      throw new Error(`Stock insuffisant pour "${product.designation}". Stock disponible: ${stockBefore}, demandé: ${quantity}`);
    }

    product.currentStock = stockAfter;

    realm.create<StockMovement>('StockMovement', {
      _id: new Realm.BSON.ObjectId(),
      product,
      type,
      quantity,
      stockBefore,
      stockAfter,
      invoiceRef,
      date: new Date(),
      notes,
    });
  },

  /**
   * PUBLIC — manual stock adjustment (loss, damage, inventory count correction).
   * Creates its own realm.write() — called from Stock module UI.
   */
  adjustStock(
    realm: Realm,
    productId: string,
    newQuantity: number,
    reason: string
  ): void {
    const product = realm.objectForPrimaryKey<Product>('Product', new Realm.BSON.ObjectId(productId));
    if (!product) throw new Error(`Product ${productId} not found`);

    realm.write(() => {
      const stockBefore = product.currentStock;
      const delta = newQuantity - stockBefore;
      product.currentStock = newQuantity;

      realm.create<StockMovement>('StockMovement', {
        _id: new Realm.BSON.ObjectId(),
        product,
        type: 'adjustment',
        quantity: Math.abs(delta),
        stockBefore,
        stockAfter: newQuantity,
        invoiceRef: '',
        date: new Date(),
        notes: reason,
      });
    });
  },

  /**
   * Returns all products where currentStock <= minStock.
   */
  getLowStockProducts(realm: Realm): Realm.Results<Product & Realm.Object<Product>> {
    return realm.objects<Product>('Product')
      .filtered('currentStock <= minStock AND isActive == true')
      .sorted('currentStock', false);
  },

  /**
   * Returns stock movement history for a product, most recent first.
   */
  getProductMovements(realm: Realm, productId: string): Realm.Results<StockMovement & Realm.Object<StockMovement>> {
    return realm.objects<StockMovement>('StockMovement')
      .filtered('product._id == $0', new Realm.BSON.ObjectId(productId))
      .sorted('date', true);
  },

  /**
   * Computes total inventory value = SUM(currentStock * buyPrice) for active products.
   */
  computeInventoryValue(realm: Realm): number {
    const products = realm.objects<Product>('Product').filtered('isActive == true');
    return products.reduce((sum, p) => sum + p.currentStock * p.buyPrice, 0);
  },
};
