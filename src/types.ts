export type UserRole = 'Super Admin' | 'Admin' | 'Accountant' | 'Broker';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface Broker {
  id: string; // Auto-generated: BRK-0001
  name: string;
  mobile: string;
  email: string;
  address: string;
  pan_number: string;
  gst_number: string;
  bank_account_name: string;
  bank_account_number: string;
  bank_ifsc: string;
  commission_type: 'Fixed' | 'Percentage' | 'Fixed+Percentage';
  commission_amount: number;
  commission_percentage: number;
  gst_percentage: number;
  tds_percentage: number;
  status: 'Active' | 'Inactive';
  created_at?: string;
}

export interface Project {
  id: string;
  name: string;
  area: string;
  city: string;
  created_at?: string;
}

export interface Property {
  id: string;
  project_id: string;
  project_name: string; // Joined or cached
  tower: string;
  wing: string;
  floor: string;
  flat_number: string;
  area_sqft: number;
  property_type: string; // 1BHK, 2BHK, 3BHK, etc.
  property_value: number;
  status: 'Available' | 'Booked' | 'Sold';
  created_at?: string;
}

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  created_at?: string;
}

export interface Sale {
  id: string;
  broker_id: string;
  broker_name?: string; // Joined
  property_id: string;
  project_name?: string; // Joined
  flat_number?: string; // Joined
  sale_amount: number;
  booking_date: string;
  customer_id: string;
  customer_name?: string; // Joined
  customer_mobile?: string; // Joined
  gross_commission: number;
  gst_amount: number;
  tds_amount: number;
  net_commission: number;
  created_at?: string;
}

export interface Commission {
  id: string;
  sale_id: string;
  broker_id: string;
  net_commission: number;
  status: 'Pending' | 'Paid' | 'Partially Paid';
  paid_amount: number;
  pending_amount: number;
  payment_date?: string;
  created_at?: string;
}

export interface Payment {
  id: string;
  commission_id: string;
  payment_date: string;
  amount: number;
  reference_number: string;
  payment_mode: 'Bank Transfer' | 'Cheque' | 'UPI' | 'Cash';
  notes?: string;
  created_at?: string;
}

export interface AuditLog {
  id: string;
  user_email: string;
  user_role: string;
  action: string;
  details: string;
  created_at: string;
}

export interface AppNotification {
  id: string;
  type: 'Payment Due' | 'New Sale' | 'Payment Completed' | 'Broker Added' | 'Excel Import';
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}
