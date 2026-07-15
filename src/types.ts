export type RoleType = 'Broker' | 'Channel Partner' | 'Sales Executive' | 'Consultant' | 'Agent';

export interface CommissionEntry {
  id: string;
  project_name: string;
  person_name: string;
  role: RoleType;
  sale_value: number;
  calc_type: 'percentage' | 'fixed';
  rate_or_amount: number;
  has_gst: boolean;
  gst_percentage: number;
  tds_percentage: number;
  payment_status: 'Pending' | 'Paid';
  payment_date?: string;
  created_at?: string;
}

export interface SettingsType {
  default_gst_percentage: number;
  default_tds_percentage: number;
}
