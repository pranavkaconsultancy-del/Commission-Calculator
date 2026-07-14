import { CommissionEntry, CalculationResult } from './types';

/**
 * Calculates high-precision financial breakdown for a single commission entry.
 * All intermediate calculations are done with full floating-point precision,
 * and we only round to 2 decimal places at the final formatting/display step.
 */
export function calculateCommission(
  entry: CommissionEntry,
  propertyValue: number
): CalculationResult {
  // 1. Calculate full base commission on the entire property value
  const fullBaseCommission =
    entry.commissionType === 'percentage'
      ? propertyValue * (entry.rateOrAmount / 100)
      : entry.rateOrAmount;

  // 2. Apply commission cap to full base commission
  const cap = entry.commissionCap;
  const isCapped = typeof cap === 'number' && cap > 0 && fullBaseCommission > cap;
  const fullBaseCommissionCapped = isCapped && typeof cap === 'number' ? cap : fullBaseCommission;

  // 3. Proportional factor based on received amount from customer
  // Received Amount / Property Value
  let proportionFactor = 1.0;
  if (propertyValue > 0) {
    proportionFactor = Math.min(1.0, Math.max(0.0, entry.receivedAmount / propertyValue));
  } else {
    proportionFactor = 0.0;
  }

  // 4. Proportional Eligible Commission
  const eligibleCommission = fullBaseCommission * proportionFactor;
  const eligibleCommissionCapped = fullBaseCommissionCapped * proportionFactor;

  // 5. Bonus Amount
  const bonusAmount = entry.bonusIncentive || 0;

  // 6. TDS Deduction (calculated on eligible commission)
  const tdsAmount = eligibleCommissionCapped * (entry.tdsRate / 100);

  // 7. GST Amount (18% of eligible commission if enabled)
  const gstAmount = entry.hasGst ? eligibleCommissionCapped * 0.18 : 0;

  // 8. Net Commission
  // Net Commission = Eligible Commission + Bonus/Incentive + GST - TDS
  const netCommission = eligibleCommissionCapped + bonusAmount + gstAmount - tdsAmount;

  // 9. Total Paid Amount from partial payments list
  const totalPaid = entry.payments ? entry.payments.reduce((sum, p) => sum + p.amount, 0) : 0;

  // 10. Pending Amount
  const pendingAmount = netCommission - totalPaid;

  // 11. Auto-derive Payment Status
  let status: 'Pending' | 'Paid' | 'Partially Paid' = 'Pending';
  if (totalPaid > 0) {
    if (pendingAmount <= 0.01) {
      status = 'Paid';
    } else {
      status = 'Partially Paid';
    }
  }

  return {
    fullBaseCommission: Math.max(0, fullBaseCommission),
    fullBaseCommissionCapped: Math.max(0, fullBaseCommissionCapped),
    eligibleCommission: Math.max(0, eligibleCommission),
    eligibleCommissionCapped: Math.max(0, eligibleCommissionCapped),
    bonusAmount: Math.max(0, bonusAmount),
    tdsAmount: Math.max(0, tdsAmount),
    gstAmount: Math.max(0, gstAmount),
    netCommission: Math.max(0, netCommission),
    totalPaid: Math.max(0, totalPaid),
    pendingAmount: Math.max(0, pendingAmount),
    status,
  };
}

/**
 * Formats a number as INR currency with elegant grouping and exactly 2 decimals
 * so that decimal points line up vertically in summary tables.
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Formats a percentage value (e.g., 2.5 -> '2.5%').
 */
export function formatPercent(value: number): string {
  return `${Number(value).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  })}%`;
}

/**
 * Helper to validate a commission entry's inputs.
 */
export function validateEntry(entry: CommissionEntry, propertyValue: number): {
  projectId?: string;
  unitNo?: string;
  customerName?: string;
  propertyValue?: string;
  receivedAmount?: string;
  personId?: string;
  rateOrAmount?: string;
  tdsRate?: string;
  commissionCap?: string;
  bookingAmount?: string;
  bonusIncentive?: string;
} {
  const errors: {
    projectId?: string;
    unitNo?: string;
    customerName?: string;
    propertyValue?: string;
    receivedAmount?: string;
    personId?: string;
    rateOrAmount?: string;
    tdsRate?: string;
    commissionCap?: string;
    bookingAmount?: string;
    bonusIncentive?: string;
  } = {};

  if (!entry.projectId) {
    errors.projectId = 'This field is required';
  }
  if (!entry.unitNo || !entry.unitNo.trim()) {
    errors.unitNo = 'This field is required';
  }
  if (!entry.customerName || !entry.customerName.trim()) {
    errors.customerName = 'This field is required';
  }

  // Required Field: Stakeholder Name (personId)
  if (!entry.personId) {
    errors.personId = 'This field is required';
  }

  // Required Field: Base Amount (propertyValue)
  if (propertyValue === undefined || propertyValue === null || isNaN(propertyValue) || propertyValue === 0) {
    errors.propertyValue = 'This field is required';
  } else if (propertyValue < 0) {
    errors.propertyValue = 'Value must be zero or positive';
  }

  // Required Field: Commission Rate or Fixed Amount
  if (entry.rateOrAmount === undefined || entry.rateOrAmount === null || isNaN(entry.rateOrAmount) || entry.rateOrAmount === 0) {
    errors.rateOrAmount = 'This field is required';
  } else if (entry.rateOrAmount < 0) {
    errors.rateOrAmount = 'Value must be zero or positive';
  } else if (entry.commissionType === 'percentage' && (entry.rateOrAmount < 0 || entry.rateOrAmount > 100)) {
    errors.rateOrAmount = 'Must be between 0% and 100%';
  }

  // Booking Amount Validation
  if (entry.bookingAmount < 0) {
    errors.bookingAmount = 'Value must be zero or positive';
  }

  // Received Amount Validation
  if (entry.receivedAmount < 0) {
    errors.receivedAmount = 'Value must be zero or positive';
  } else if (entry.receivedAmount > propertyValue) {
    errors.receivedAmount = 'Received amount cannot exceed Property Value';
  }

  // Bonus / Incentive Validation
  if (entry.bonusIncentive < 0) {
    errors.bonusIncentive = 'Value must be zero or positive';
  }

  // TDS Rate Validation (0-100%)
  if (entry.tdsRate === undefined || entry.tdsRate === null || isNaN(entry.tdsRate)) {
    errors.tdsRate = 'This field is required';
  } else if (entry.tdsRate < 0 || entry.tdsRate > 100) {
    errors.tdsRate = 'Must be between 0% and 100%';
  }

  // Commission Cap Validation
  if (entry.commissionCap !== undefined && entry.commissionCap < 0) {
    errors.commissionCap = 'Value must be zero or positive';
  }

  return errors;
}
