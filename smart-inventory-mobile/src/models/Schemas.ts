import { Realm } from '@realm/react';

export class Product extends Realm.Object<Product> {
  _id!: Realm.BSON.ObjectId;
  name!: string;
  quantity!: number;
  purchasePrice!: number;
  sellingPrice!: number;
  lowStockThreshold!: number;

  static schema: Realm.ObjectSchema = {
    name: 'Product',
    primaryKey: '_id',
    properties: {
      _id: 'objectId',
      name: 'string',
      quantity: 'int',
      purchasePrice: 'double',
      sellingPrice: 'double',
      lowStockThreshold: { type: 'int', default: 5 },
    },
  };
}

export class SaleItem extends Realm.Object<SaleItem> {
  productId!: Realm.BSON.ObjectId;
  name!: string;
  quantity!: number;
  price!: number;

  static schema: Realm.ObjectSchema = {
    name: 'SaleItem',
    embedded: true,
    properties: {
      productId: 'objectId',
      name: 'string',
      quantity: 'int',
      price: 'double',
    },
  };
}

export class Sale extends Realm.Object<Sale> {
  _id!: Realm.BSON.ObjectId;
  date!: Date;
  totalAmount!: number;
  items!: Realm.List<SaleItem>;

  static schema: Realm.ObjectSchema = {
    name: 'Sale',
    primaryKey: '_id',
    properties: {
      _id: 'objectId',
      date: 'date',
      totalAmount: 'double',
      items: 'SaleItem[]',
    },
  };
}

export class Transaction extends Realm.Object<Transaction> {
  _id!: Realm.BSON.ObjectId;
  date!: Date;
  type!: string; // 'SALE', 'RESTOCK'
  productId!: Realm.BSON.ObjectId;
  productName!: string;
  quantity!: number;
  amount!: number;

  static schema: Realm.ObjectSchema = {
    name: 'Transaction',
    primaryKey: '_id',
    properties: {
      _id: 'objectId',
      date: 'date',
      type: 'string',
      productId: 'objectId',
      productName: 'string',
      quantity: 'int',
      amount: 'double',
    },
  };
}
