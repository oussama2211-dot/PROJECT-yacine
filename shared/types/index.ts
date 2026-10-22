import type { Product } from '../models/Schemas';

// --- Transaction Types ---
export type TransactionType = 'SALE' | 'RESTOCK';

// --- Product Form ---
export interface ProductFormData {
  name: string;
  quantity: number;
  purchasePrice: number;
  sellingPrice: number;
  lowStockThreshold: number;
}

// --- Cart ---
export interface CartEntry {
  product: Product;
  quantity: number;
  lineTotal: number;
}

// --- Backup ---
export interface BackupData {
  version: number;
  exportedAt: string;
  products: Record<string, unknown>[];
  sales: Record<string, unknown>[];
  transactions: Record<string, unknown>[];
}

// --- Stock Status ---
export type StockStatus = 'ok' | 'low' | 'out';

export interface StockInfo {
  label: string;
  className: string;
  status: StockStatus;
}

// --- Date Range ---
export type DateRangePreset = 'today' | 'week' | 'month' | 'custom';

export interface DateRange {
  start: Date;
  end: Date;
  preset: DateRangePreset;
}
