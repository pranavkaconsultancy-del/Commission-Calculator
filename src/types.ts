export type CommissionType = 'percentage' | 'fixed';

export type PaymentStatusType = 'Pending' | 'Paid' | 'Partially Paid';

export interface Milestone {
  id: string;
  name: string;
  percentage: number; // Split percentage (e.g. 40 for 40%)
}

export interface Stakeholder {
  id: string;
  name: string;
  role: string;
  commissionType: CommissionType;
  rateOrAmount: number; // Percentage (e.g., 2.5 for 2.5%) or fixed amount (e.g., 50000)
  taxDeductionRate: number; // General deduction % (e.g., 10 for 10% deduction)
  tdsRate: number; // TDS % (Tax Deducted at Source, e.g., 5 for 5%)
  hasGst: boolean; // Add 18% GST on commission
  paymentStatus: PaymentStatusType;
  commissionCap?: number; // Optional maximum cap on commission
  milestones?: Milestone[]; // Optional payment milestones split
}

export interface Project {
  name: string;
  totalSaleValue: number;
}

export interface CalculationResult {
  stakeholderId: string;
  commissionBeforeCap: number;
  commissionAfterCap: number; // This is the Base Commission (subject to Cap)
  isCapped: boolean;
  deductionAmount: number;
  netAfterDeduction: number;
  tdsAmount: number;
  gstAmount: number;
  netPayable: number; // Final Amount to Pay (rounded only at final display)
}

export const DEFAULT_ROLES = [
  'Channel Partner',
  'Broker',
  'Consultant',
  'Agent',
  'Contractor',
  'Internal Sales',
  'Other'
];
