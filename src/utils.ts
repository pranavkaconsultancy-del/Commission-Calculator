import { CommissionEntry } from './types';

export interface CommissionBreakdown {
  baseCommission: number;
  gstAmount: number;
  tdsAmount: number;
  finalAmount: number;
}

/**
 * Live-calculates the commission breakdown.
 */
export function calculateCommissionDetails(
  saleValue: number,
  calcType: 'percentage' | 'fixed',
  rateOrAmount: number,
  hasGst: boolean,
  gstPercentage: number,
  tdsPercentage: number
): CommissionBreakdown {
  const baseCommission = calcType === 'percentage'
    ? (saleValue || 0) * ((rateOrAmount || 0) / 100)
    : (rateOrAmount || 0);
  
  const gstAmount = hasGst ? baseCommission * ((gstPercentage || 0) / 100) : 0;
  const tdsAmount = baseCommission * ((tdsPercentage || 0) / 100);
  const finalAmount = baseCommission + gstAmount - tdsAmount;

  return {
    baseCommission: Math.max(0, baseCommission),
    gstAmount: Math.max(0, gstAmount),
    tdsAmount: Math.max(0, tdsAmount),
    finalAmount: Math.max(0, finalAmount)
  };
}

/**
 * Formats values into Indian Rupees (INR) format.
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(value || 0);
}

/**
 * Formats numbers with commas (e.g., for sale values).
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0
  }).format(value || 0);
}
