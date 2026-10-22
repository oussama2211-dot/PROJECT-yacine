import Realm from 'realm';

// ─── Settings (Singleton) ────────────────────────────────────────────────────
export class Settings extends Realm.Object<Settings> {
  _id!: string; // Always 'app-settings'
  companyName!: string;
  companyAddress!: string;
  companyPhone!: string;
  companyRC!: string;
  companyNIF!: string;
  tvaRate!: number;
  currentFiscalYear!: number;
  lastSaleInvoiceSeq!: number;
  lastPurchaseInvoiceSeq!: number;
  currency!: string;
  language!: string;
  lastBackupDate?: Date;

  static schema: Realm.ObjectSchema = {
    name: 'Settings',
    primaryKey: '_id',
    properties: {
      _id: 'string',
      companyName: { type: 'string', default: 'Mon Entreprise' },
      companyAddress: { type: 'string', default: '' },
      companyPhone: { type: 'string', default: '' },
      companyRC: { type: 'string', default: '' },
      companyNIF: { type: 'string', default: '' },
      tvaRate: { type: 'double', default: 19 },
      currentFiscalYear: { type: 'int', default: new Date().getFullYear() },
      lastSaleInvoiceSeq: { type: 'int', default: 0 },
      lastPurchaseInvoiceSeq: { type: 'int', default: 0 },
      currency: { type: 'string', default: 'DA' },
      language: { type: 'string', default: 'fr' },
      lastBackupDate: 'date?',
    },
  };
}

// ─── User ────────────────────────────────────────────────────────────────────
export class User extends Realm.Object<User> {
  _id!: Realm.BSON.ObjectId;
  username!: string;
  passwordHash!: string;
  role!: string; // 'admin' | 'manager' | 'cashier'
  fullName!: string;
  isActive!: boolean;
  createdAt!: Date;

  static schema: Realm.ObjectSchema = {
    name: 'User',
    primaryKey: '_id',
    properties: {
      _id: 'objectId',
      username: 'string',
      passwordHash: 'string',
      role: { type: 'string', default: 'cashier' },
      fullName: 'string',
      isActive: { type: 'bool', default: true },
      createdAt: 'date',
    },
  };
}

// ─── Category ────────────────────────────────────────────────────────────────
export class Category extends Realm.Object<Category> {
  _id!: Realm.BSON.ObjectId;
  name!: string;
  description!: string;

  static schema: Realm.ObjectSchema = {
    name: 'Category',
    primaryKey: '_id',
    properties: {
      _id: 'objectId',
      name: 'string',
      description: { type: 'string', default: '' },
    },
  };
}

// ─── Client ──────────────────────────────────────────────────────────────────
export class Client extends Realm.Object<Client> {
  _id!: Realm.BSON.ObjectId;
  code!: string;
  name!: string;
  address!: string;
  phone!: string;
  email!: string;
  notes!: string;
  isActive!: boolean;
  createdAt!: Date;

  static schema: Realm.ObjectSchema = {
    name: 'Client',
    primaryKey: '_id',
    properties: {
      _id: 'objectId',
      code: 'string',
      name: 'string',
      address: { type: 'string', default: '' },
      phone: { type: 'string', default: '' },
      email: { type: 'string', default: '' },
      notes: { type: 'string', default: '' },
      isActive: { type: 'bool', default: true },
      createdAt: 'date',
    },
  };
}

// ─── Supplier ────────────────────────────────────────────────────────────────
export class Supplier extends Realm.Object<Supplier> {
  _id!: Realm.BSON.ObjectId;
  code!: string;
  name!: string;
  address!: string;
  phone!: string;
  email!: string;
  isActive!: boolean;
  createdAt!: Date;

  static schema: Realm.ObjectSchema = {
    name: 'Supplier',
    primaryKey: '_id',
    properties: {
      _id: 'objectId',
      code: 'string',
      name: 'string',
      address: { type: 'string', default: '' },
      phone: { type: 'string', default: '' },
      email: { type: 'string', default: '' },
      isActive: { type: 'bool', default: true },
      createdAt: 'date',
    },
  };
}

// ─── Product ─────────────────────────────────────────────────────────────────
export class Product extends Realm.Object<Product, never> {
  _id!: Realm.BSON.ObjectId;
  ref!: string;
  designation!: string;
  category!: Category;
  unit!: string;
  buyPrice!: number;
  sellPrice!: number;
  currentStock!: number;
  minStock!: number;
  isActive!: boolean;
  createdAt!: Date;

  static schema: Realm.ObjectSchema = {
    name: 'Product',
    primaryKey: '_id',
    properties: {
      _id: 'objectId',
      ref: 'string',
      designation: 'string',
      category: 'Category',
      unit: { type: 'string', default: 'Pcs' },
      buyPrice: 'double',
      sellPrice: 'double',
      currentStock: { type: 'int', default: 0 },
      minStock: { type: 'int', default: 5 },
      isActive: { type: 'bool', default: true },
      createdAt: 'date',
    },
  };
}

// ─── InvoiceItem (Embedded) ───────────────────────────────────────────────────
export class InvoiceItem extends Realm.Object<InvoiceItem> {
  _id!: Realm.BSON.ObjectId;
  product!: Product;
  productRef!: string;       // Snapshot at invoice time
  productDesignation!: string; // Snapshot at invoice time
  quantity!: number;
  unitPriceHT!: number;      // Snapshot at invoice time
  totalHT!: number;
  tvaRate!: number;          // Snapshot at invoice time
  totalTTC!: number;

  static schema: Realm.ObjectSchema = {
    name: 'InvoiceItem',
    embedded: true,
    properties: {
      _id: 'objectId',
      product: 'Product',
      productRef: 'string',
      productDesignation: 'string',
      quantity: 'int',
      unitPriceHT: 'double',
      totalHT: 'double',
      tvaRate: 'double',
      totalTTC: 'double',
    },
  };
}

// ─── Invoice ─────────────────────────────────────────────────────────────────
export class Invoice extends Realm.Object<Invoice> {
  _id!: Realm.BSON.ObjectId;
  invoiceNumber!: string;
  type!: string;             // 'sale' | 'purchase'
  status!: string;           // 'draft' | 'confirmed' | 'cancelled'
  date!: Date;
  dueDate?: Date;
  client?: Client;
  supplier?: Supplier;
  items!: Realm.List<InvoiceItem>;
  subtotalHT!: number;
  discountRate!: number;
  discountAmount!: number;
  tvaRate!: number;
  tvaAmount!: number;
  totalTTC!: number;
  amountPaid!: number;       // Denormalized sum of payments — updated atomically
  notes!: string;
  createdAt!: Date;
  confirmedAt?: Date;

  static schema: Realm.ObjectSchema = {
    name: 'Invoice',
    primaryKey: '_id',
    properties: {
      _id: 'objectId',
      invoiceNumber: { type: 'string', indexed: true },
      type: 'string',
      status: { type: 'string', default: 'draft' },
      date: 'date',
      dueDate: 'date?',
      client: 'Client?',
      supplier: 'Supplier?',
      items: 'InvoiceItem[]',
      subtotalHT: { type: 'double', default: 0 },
      discountRate: { type: 'double', default: 0 },
      discountAmount: { type: 'double', default: 0 },
      tvaRate: { type: 'double', default: 19 },
      tvaAmount: { type: 'double', default: 0 },
      totalTTC: { type: 'double', default: 0 },
      amountPaid: { type: 'double', default: 0 },
      notes: { type: 'string', default: '' },
      createdAt: 'date',
      confirmedAt: 'date?',
    },
  };
}

// ─── Payment ─────────────────────────────────────────────────────────────────
export class Payment extends Realm.Object<Payment> {
  _id!: Realm.BSON.ObjectId;
  invoice!: Invoice;
  amount!: number;
  date!: Date;
  mode!: string; // 'Espèce' | 'Chèque' | 'Virement' | 'Crédit'
  reference!: string;
  notes!: string;
  createdAt!: Date;

  static schema: Realm.ObjectSchema = {
    name: 'Payment',
    primaryKey: '_id',
    properties: {
      _id: 'objectId',
      invoice: 'Invoice',
      amount: 'double',
      date: 'date',
      mode: 'string',
      reference: { type: 'string', default: '' },
      notes: { type: 'string', default: '' },
      createdAt: 'date',
    },
  };
}

// ─── StockMovement ────────────────────────────────────────────────────────────
export class StockMovement extends Realm.Object<StockMovement> {
  _id!: Realm.BSON.ObjectId;
  product!: Product;
  type!: string; // 'sale_out' | 'purchase_in' | 'adjustment' | 'return_in' | 'loss'
  quantity!: number;
  stockBefore!: number;
  stockAfter!: number;
  invoiceRef!: string;
  date!: Date;
  notes!: string;

  static schema: Realm.ObjectSchema = {
    name: 'StockMovement',
    primaryKey: '_id',
    properties: {
      _id: 'objectId',
      product: 'Product',
      type: 'string',
      quantity: 'int',
      stockBefore: 'int',
      stockAfter: 'int',
      invoiceRef: { type: 'string', default: '' },
      date: 'date',
      notes: { type: 'string', default: '' },
    },
  };
}

// ─── Schema Registry ─────────────────────────────────────────────────────────
export const ALL_SCHEMAS: Realm.Configuration['schema'] = [
  Settings,
  User,
  Category,
  Client,
  Supplier,
  Product,
  InvoiceItem,
  Invoice,
  Payment,
  StockMovement,
];
