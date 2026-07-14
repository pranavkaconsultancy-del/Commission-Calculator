export type CommissionType = 'percentage' | 'fixed';

export type PaymentStatusType = 'Pending' | 'Paid' | 'Partially Paid';

export type PersonType =
  | 'Executive'
  | 'Broker'
  | 'Channel Partner'
  | 'Sales Executive'
  | 'Consultant'
  | 'Agent'
  | 'Contractor';

export interface Project {
  id: string;
  name: string;
  type: string; // Residential, Commercial, Mixed, etc.
}

export interface Person {
  id: string;
  name: string;
  type: PersonType;
  employeeId: string; // Employee ID or RERA ID
  email?: string;
  phone?: string;
  contactInfo?: string; // Backwards compatibility & catchall
}

export interface Payment {
  id: string;
  amount: number;
  date: string;
  mode: string; // Bank Transfer, Cheque, UPI, Cash
}

export interface CommissionEntry {
  id: string;
  projectId: string; // Link to Project
  unitNo: string;
  customerName: string;
  bookingDate: string;
  agreementDate: string;
  propertyValue: number;
  bookingAmount: number;
  receivedAmount: number;
  
  personId: string; // Link to Person directory (Stakeholder ID)
  commissionType: CommissionType;
  rateOrAmount: number;
  bonusIncentive: number; // Optional Bonus amount
  commissionRule: string; // Short condition text
  hasGst: boolean; // Add GST on commission
  tdsRate: number; // TDS % (Tax Deducted at Source, default 5%)
  commissionCap?: number; // Optional maximum cap on commission
  category?: string; // e.g. 'Booking Commission', 'Referral Commission', 'Channel Partner Commission', 'Broker Commission'
  
  payments: Payment[]; // Multiple partial payments
}

// Financial result structure for clean, high-precision calculations
export interface CalculationResult {
  fullBaseCommission: number; // commission on full Property Value
  fullBaseCommissionCapped: number; // commission on full Property Value, capped
  eligibleCommission: number; // based on received amount proportion
  eligibleCommissionCapped: number; // after applying cap on the proportional eligible commission
  bonusAmount: number;
  tdsAmount: number;
  gstAmount: number;
  netCommission: number; // Final Net Commission = Eligible Commission Capped + Bonus + GST - TDS
  totalPaid: number;
  pendingAmount: number;
  status: PaymentStatusType;
}
