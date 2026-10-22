import { createRealmContext } from '@realm/react';
import { Product, Sale, SaleItem, Transaction } from './Schemas';

export const RealmContext = createRealmContext({
  schema: [Product, Sale, SaleItem, Transaction],
});

export default RealmContext;
