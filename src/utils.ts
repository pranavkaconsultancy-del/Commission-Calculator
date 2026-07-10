import { Stakeholder, CalculationResult } from './types';

/**
 * Calculates high-precision financial breakdown for a single stakeholder.
 * All intermediate calculations are done with full floating-point precision,
 * and we only round to 2 decimal places at the final formatting step.
 */
export function calculateStakeholderCommission(
  stakeholder: Stakeholder,
  totalSaleValue: number
): CalculationResult {
  // 1. Calculate base commission before cap
  const commissionBeforeCap =
    stakeholder.commissionType === 'percentage'
      ? totalSaleValue * (stakeholder.rateOrAmount / 100)
      : stakeholder.rateOrAmount;

  // 2. Apply commission cap if specified
  const cap = stakeholder.commissionCap;
  const isCapped = typeof cap === 'number' && cap > 0 && commissionBeforeCap > cap;
  const commissionAfterCap = isCapped && typeof cap === 'number' ? cap : commissionBeforeCap;

  // 3. Deduction Amount
  const deductionAmount = commissionAfterCap * (stakeholder.taxDeductionRate / 100);

  // 4. Net commission after deduction
  const netAfterDeduction = commissionAfterCap - deductionAmount;

  // 5. TDS Amount (Tax Deducted at Source)
  const tdsAmount = netAfterDeduction * (stakeholder.tdsRate / 100);

  // 6. GST Amount (if 18% GST checkbox is checked)
  const gstAmount = stakeholder.hasGst ? netAfterDeduction * 0.18 : 0;

  // 7. Final Net Payable
  const netPayable = netAfterDeduction - tdsAmount + gstAmount;

  return {
    stakeholderId: stakeholder.id,
    commissionBeforeCap: Math.max(0, commissionBeforeCap),
    commissionAfterCap: Math.max(0, commissionAfterCap),
    isCapped,
    deductionAmount: Math.max(0, deductionAmount),
    netAfterDeduction: Math.max(0, netAfterDeduction),
    tdsAmount: Math.max(0, tdsAmount),
    gstAmount: Math.max(0, gstAmount),
    netPayable: Math.max(0, netPayable),
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
 * Helper to validate a stakeholder's inputs.
 * Returns an object with error messages.
 */
export function validateStakeholder(stakeholder: Stakeholder): {
  name?: string;
  rateOrAmount?: string;
  taxDeductionRate?: string;
  tdsRate?: string;
  commissionCap?: string;
  milestones?: string;
} {
  const errors: {
    name?: string;
    rateOrAmount?: string;
    taxDeductionRate?: string;
    tdsRate?: string;
    commissionCap?: string;
    milestones?: string;
  } = {};

  if (!stakeholder.name.trim()) {
    errors.name = 'Name is required';
  }

  if (stakeholder.rateOrAmount < 0) {
    errors.rateOrAmount = 'Rate or amount cannot be negative';
  } else if (stakeholder.commissionType === 'percentage' && stakeholder.rateOrAmount > 100) {
    errors.rateOrAmount = 'Percentage cannot exceed 100%';
  }

  if (stakeholder.taxDeductionRate < 0) {
    errors.taxDeductionRate = 'Deduction % cannot be negative';
  } else if (stakeholder.taxDeductionRate > 100) {
    errors.taxDeductionRate = 'Deduction % cannot exceed 100%';
  }

  if (stakeholder.tdsRate < 0) {
    errors.tdsRate = 'TDS % cannot be negative';
  } else if (stakeholder.tdsRate > 100) {
    errors.tdsRate = 'TDS % cannot exceed 100%';
  }

  if (stakeholder.commissionCap !== undefined && stakeholder.commissionCap < 0) {
    errors.commissionCap = 'Cap cannot be negative';
  }

  if (stakeholder.milestones && stakeholder.milestones.length > 0) {
    const totalPct = stakeholder.milestones.reduce((acc, m) => acc + m.percentage, 0);
    if (Math.abs(totalPct - 100) > 0.01) {
      errors.milestones = `Milestone splits must add up to exactly 100% (currently ${totalPct}%)`;
    }
  }

  return errors;
}
