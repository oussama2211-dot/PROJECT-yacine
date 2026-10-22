import type { StockInfo } from '../types';

/**
 * Format a number as currency string.
 */
export const formatCurrency = (n: number): string => `$${n.toFixed(2)}`;

/**
 * Get stock status info for a product.
 */
export const getStockStatus = (quantity: number, threshold: number): StockInfo => {
  if (quantity === 0) return { label: 'Out', className: 'stock-out', status: 'out' };
  if (quantity <= threshold) return { label: 'Low', className: 'stock-low', status: 'low' };
  return { label: 'OK', className: 'stock-ok', status: 'ok' };
};

/**
 * Calculate profit margin percentage.
 */
export const calcMarginPct = (purchasePrice: number, sellingPrice: number): string => {
  if (purchasePrice <= 0) return '—';
  const margin = sellingPrice - purchasePrice;
  return `${((margin / purchasePrice) * 100).toFixed(0)}%`;
};

/**
 * Get the start of today (midnight).
 */
export const getStartOfDay = (date: Date = new Date()): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Get the start of the current week (Monday).
 */
export const getStartOfWeek = (date: Date = new Date()): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Get the start of the current month.
 */
export const getStartOfMonth = (date: Date = new Date()): Date => {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Format a Date to a readable string.
 */
export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Format a Date to short format (no time).
 */
export const formatDateShort = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};
