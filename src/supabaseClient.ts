import { createClient } from '@supabase/supabase-js';
import { 
  Broker, Project, Property, Customer, Sale, Commission, Payment, AuditLog, AppNotification, User
} from './types';

const supabaseUrl = 
  (import.meta as any).env?.VITE_SUPABASE_URL || 
  (import.meta as any).env?.SUPABASE_URL || 
  (typeof process !== 'undefined' ? process.env?.SUPABASE_URL : '') || 
  '';

const supabaseAnonKey = 
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 
  (import.meta as any).env?.SUPABASE_ANON_KEY || 
  (typeof process !== 'undefined' ? process.env?.SUPABASE_ANON_KEY : '') || 
  '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Storage Keys
const KEYS = {
  BROKERS: 'broker_mgmt_brokers_v1',
  PROJECTS: 'broker_mgmt_projects_v1',
  PROPERTIES: 'broker_mgmt_properties_v1',
  CUSTOMERS: 'broker_mgmt_customers_v1',
  SALES: 'broker_mgmt_sales_v1',
  COMMISSIONS: 'broker_mgmt_commissions_v1',
  PAYMENTS: 'broker_mgmt_payments_v1',
  AUDIT_LOGS: 'broker_mgmt_audit_logs_v1',
  NOTIFICATIONS: 'broker_mgmt_notifications_v1',
  USERS: 'broker_mgmt_users_v1'
};

// Initial Prepopulated Mock Data (to make the app immediately look amazing and active)
const MOCK_BROKERS: Broker[] = [
  {
    id: 'BRK-0001',
    name: 'Rajesh Sharma',
    mobile: '9876543210',
    email: 'rajesh.sharma@gmail.com',
    address: 'Flat 402, Sea Green Apartments, Worli, Mumbai',
    pan_number: 'ABCPD1234F',
    gst_number: '27ABCPD1234F1Z5',
    bank_account_name: 'Rajesh Sharma',
    bank_account_number: '50100412345678',
    bank_ifsc: 'HDFC0000060',
    commission_type: 'Percentage',
    commission_amount: 0,
    commission_percentage: 2.5,
    gst_percentage: 18,
    tds_percentage: 5,
    status: 'Active',
    created_at: '2026-07-01T10:00:00.000Z'
  },
  {
    id: 'BRK-0002',
    name: 'Apex Realtors',
    mobile: '9123456789',
    email: 'contact@apexrealtors.com',
    address: 'Office 12, Cyber Heights, Gachibowli, Hyderabad',
    pan_number: 'AEEPA9876K',
    gst_number: '36AEEPA9876K2ZC',
    bank_account_name: 'Apex Realtors Private Limited',
    bank_account_number: '002305001234',
    bank_ifsc: 'ICIC0000023',
    commission_type: 'Percentage',
    commission_amount: 0,
    commission_percentage: 3.0,
    gst_percentage: 18,
    tds_percentage: 5,
    status: 'Active',
    created_at: '2026-07-02T11:00:00.000Z'
  },
  {
    id: 'BRK-0003',
    name: 'Priyanka Sen',
    mobile: '9988776655',
    email: 'priyanka.sen@outlook.com',
    address: 'Block C, Fortune Residency, Whitefield, Bangalore',
    pan_number: 'BZZPS5544H',
    gst_number: '',
    bank_account_name: 'Priyanka Sen',
    bank_account_number: '10024567891',
    bank_ifsc: 'SBIN0003041',
    commission_type: 'Fixed',
    commission_amount: 150000,
    commission_percentage: 0,
    gst_percentage: 0,
    tds_percentage: 10,
    status: 'Active',
    created_at: '2026-07-03T12:00:00.000Z'
  },
  {
    id: 'BRK-0004',
    name: 'Mohan Lal',
    mobile: '9444556677',
    email: 'mohan.lal@realty.in',
    address: 'G-15, Rajendra Place, New Delhi',
    pan_number: 'CHHML4321R',
    gst_number: '07CHHML4321R1Z8',
    bank_account_name: 'Mohan Lal Associates',
    bank_account_number: '921020045612345',
    bank_ifsc: 'UTIB0000210',
    commission_type: 'Fixed+Percentage',
    commission_amount: 50000,
    commission_percentage: 1.5,
    gst_percentage: 18,
    tds_percentage: 5,
    status: 'Inactive',
    created_at: '2026-07-04T13:00:00.000Z'
  }
];

const MOCK_PROJECTS: Project[] = [
  { id: 'PRJ-001', name: 'Skyline Heights', area: 'Worli', city: 'Mumbai', created_at: '2026-07-01T09:00:00.000Z' },
  { id: 'PRJ-002', name: 'Cyber Plaza', area: 'Gachibowli', city: 'Hyderabad', created_at: '2026-07-01T09:05:00.000Z' },
  { id: 'PRJ-003', name: 'Orchard Residences', area: 'Whitefield', city: 'Bangalore', created_at: '2026-07-01T09:10:00.000Z' },
  { id: 'PRJ-004', name: 'Emerald Gardens', area: 'New Town', city: 'Kolkata', created_at: '2026-07-01T09:15:00.000Z' }
];

const MOCK_PROPERTIES: Property[] = [
  { id: 'PROP-001', project_id: 'PRJ-001', project_name: 'Skyline Heights', tower: 'Tower A', wing: 'Wing 1', floor: '14th', flat_number: '1402', area_sqft: 1200, property_type: '3BHK', property_value: 8500000, status: 'Sold', created_at: '2026-07-02T10:00:00.000Z' },
  { id: 'PROP-002', project_id: 'PRJ-002', project_name: 'Cyber Plaza', tower: 'Tower B', wing: 'Wing A', floor: '5th', flat_number: '501', area_sqft: 1800, property_type: 'Commercial', property_value: 15000000, status: 'Sold', created_at: '2026-07-02T10:05:00.000Z' },
  { id: 'PROP-003', project_id: 'PRJ-003', project_name: 'Orchard Residences', tower: 'Tower C', wing: 'Wing 2', floor: '8th', flat_number: '804', area_sqft: 1100, property_type: '2BHK', property_value: 6500000, status: 'Sold', created_at: '2026-07-02T10:10:00.000Z' },
  { id: 'PROP-004', project_id: 'PRJ-001', project_name: 'Skyline Heights', tower: 'Tower A', wing: 'Wing 2', floor: '18th', flat_number: '1801', area_sqft: 1400, property_type: '3BHK', property_value: 9500000, status: 'Booked', created_at: '2026-07-02T10:15:00.000Z' },
  { id: 'PROP-005', project_id: 'PRJ-004', project_name: 'Emerald Gardens', tower: 'Tower 1', wing: 'Wing B', floor: '3rd', flat_number: '303', area_sqft: 950, property_type: '2BHK', property_value: 5500000, status: 'Available', created_at: '2026-07-02T10:20:00.000Z' },
  { id: 'PROP-006', project_id: 'PRJ-003', project_name: 'Orchard Residences', tower: 'Tower C', wing: 'Wing 1', floor: '12th', flat_number: '1205', area_sqft: 1600, property_type: '3BHK', property_value: 8000000, status: 'Available', created_at: '2026-07-02T10:25:00.000Z' },
  { id: 'PROP-007', project_id: 'PRJ-002', project_name: 'Cyber Plaza', tower: 'Tower A', wing: 'Wing B', floor: '10th', flat_number: '1002', area_sqft: 2400, property_type: 'Penthouse', property_value: 22000000, status: 'Available', created_at: '2026-07-02T10:30:00.000Z' }
];

const MOCK_CUSTOMERS: Customer[] = [
  { id: 'CUST-001', name: 'Amit Verma', mobile: '9876543210', email: 'amit.verma@yahoo.com', created_at: '2026-07-05T10:00:00.000Z' },
  { id: 'CUST-002', name: 'Sunita Rao', mobile: '9123456789', email: 'sunita.rao@gmail.com', created_at: '2026-07-06T11:00:00.000Z' },
  { id: 'CUST-003', name: 'Vikram Singh', mobile: '9988776655', email: 'vikram.singh@gmail.com', created_at: '2026-07-07T12:00:00.000Z' }
];

const MOCK_SALES: Sale[] = [
  {
    id: 'SALE-0001',
    broker_id: 'BRK-0001',
    broker_name: 'Rajesh Sharma',
    property_id: 'PROP-001',
    project_name: 'Skyline Heights',
    flat_number: '1402',
    sale_amount: 8500000,
    booking_date: '2026-07-10',
    customer_id: 'CUST-001',
    customer_name: 'Amit Verma',
    customer_mobile: '9876543210',
    gross_commission: 212500, // 2.5% of 85L
    gst_amount: 38250, // 18% of 2.125L
    tds_amount: 10625, // 5% of 2.125L
    net_commission: 163625, // Gross - GST - TDS (using standard deduction layout)
    created_at: '2026-07-10T14:00:00.000Z'
  },
  {
    id: 'SALE-0002',
    broker_id: 'BRK-0002',
    broker_name: 'Apex Realtors',
    property_id: 'PROP-002',
    project_name: 'Cyber Plaza',
    flat_number: '501',
    sale_amount: 15000000,
    booking_date: '2026-07-12',
    customer_id: 'CUST-002',
    customer_name: 'Sunita Rao',
    customer_mobile: '9123456789',
    gross_commission: 450000, // 3% of 1.5Cr
    gst_amount: 81000, // 18% of 4.5L
    tds_amount: 22500, // 5% of 4.5L
    net_commission: 346500, // Gross - GST - TDS
    created_at: '2026-07-12T16:00:00.000Z'
  },
  {
    id: 'SALE-0003',
    broker_id: 'BRK-0003',
    broker_name: 'Priyanka Sen',
    property_id: 'PROP-003',
    project_name: 'Orchard Residences',
    flat_number: '804',
    sale_amount: 6500000,
    booking_date: '2026-07-14',
    customer_id: 'CUST-003',
    customer_name: 'Vikram Singh',
    customer_mobile: '9988776655',
    gross_commission: 150000, // Fixed
    gst_amount: 0, // 0%
    tds_amount: 15000, // 10%
    net_commission: 135000, // Gross - GST - TDS
    created_at: '2026-07-14T10:00:00.000Z'
  }
];

const MOCK_COMMISSIONS: Commission[] = [
  {
    id: 'COMM-0001',
    sale_id: 'SALE-0001',
    broker_id: 'BRK-0001',
    net_commission: 163625,
    status: 'Paid',
    paid_amount: 163625,
    pending_amount: 0,
    payment_date: '2026-07-11',
    created_at: '2026-07-10T14:05:00.000Z'
  },
  {
    id: 'COMM-0002',
    sale_id: 'SALE-0002',
    broker_id: 'BRK-0002',
    net_commission: 346500,
    status: 'Partially Paid',
    paid_amount: 200000,
    pending_amount: 146500,
    payment_date: '2026-07-13',
    created_at: '2026-07-12T16:05:00.000Z'
  },
  {
    id: 'COMM-0003',
    sale_id: 'SALE-0003',
    broker_id: 'BRK-0003',
    net_commission: 135000,
    status: 'Pending',
    paid_amount: 0,
    pending_amount: 135000,
    created_at: '2026-07-14T10:05:00.000Z'
  }
];

const MOCK_PAYMENTS: Payment[] = [
  {
    id: 'PMT-0001',
    commission_id: 'COMM-0001',
    payment_date: '2026-07-11',
    amount: 163625,
    reference_number: 'TXN-554123490',
    payment_mode: 'Bank Transfer',
    notes: 'Full payout cleared for Skyline Heights sale.',
    created_at: '2026-07-11T10:00:00.000Z'
  },
  {
    id: 'PMT-0002',
    commission_id: 'COMM-0002',
    payment_date: '2026-07-13',
    amount: 200000,
    reference_number: 'UPI-9921448102',
    payment_mode: 'UPI',
    notes: 'Partial advance payment cleared.',
    created_at: '2026-07-13T11:00:00.000Z'
  }
];

const MOCK_AUDIT_LOGS: AuditLog[] = [
  { id: 'LOG-0001', user_email: 'admin@realty.com', user_role: 'Super Admin', action: 'System Initialized', details: 'Broker Commission System launched with seed databases.', created_at: '2026-07-01T09:00:00.000Z' },
  { id: 'LOG-0002', user_email: 'admin@realty.com', user_role: 'Super Admin', action: 'Broker Added', details: 'Registered Rajesh Sharma as active Percentage broker.', created_at: '2026-07-01T10:05:00.000Z' },
  { id: 'LOG-0003', user_email: 'admin@realty.com', user_role: 'Super Admin', action: 'Sale Created', details: 'Added sale of Skyline Heights 1402 (Customer: Amit Verma) for ₹85,00,000.', created_at: '2026-07-10T14:02:00.000Z' },
  { id: 'LOG-0004', user_email: 'accountant@realty.com', user_role: 'Accountant', action: 'Payment Released', details: 'Cleared ₹1,63,625 for Rajesh Sharma (COMM-0001).', created_at: '2026-07-11T10:02:00.000Z' }
];

const MOCK_NOTIFICATIONS: AppNotification[] = [
  { id: 'NOT-0001', type: 'New Sale', title: 'Sale Logged', message: 'Apex Realtors logged sale of Cyber Plaza Flat 501 for ₹1.5 Cr.', is_read: false, created_at: '2026-07-12T16:01:00.000Z' },
  { id: 'NOT-0002', type: 'Payment Due', title: 'Commission Pending', message: 'Commission of ₹1,35,000 is pending for Priyanka Sen (Orchard Residences Flat 804).', is_read: false, created_at: '2026-07-14T10:06:00.000Z' },
  { id: 'NOT-0003', type: 'Payment Completed', title: 'Payout Successful', message: 'Payout of ₹1,63,625 released to Rajesh Sharma successfully.', is_read: true, created_at: '2026-07-11T10:05:00.000Z' }
];

const MOCK_USERS: User[] = [
  { id: 'USR-0001', email: 'admin@realty.com', name: 'Pranav K. Admin', role: 'Super Admin' },
  { id: 'USR-0002', email: 'staff@realty.com', name: 'Alok Singh', role: 'Admin' },
  { id: 'USR-0003', email: 'finance@realty.com', name: 'Ritu Sen', role: 'Accountant' },
  { id: 'USR-0004', email: 'rajesh.sharma@gmail.com', name: 'Rajesh Sharma Broker', role: 'Broker' }
];

// Helper to load or initialize from localStorage
function getLocal<T>(key: string, initial: T[]): T[] {
  try {
    const data = localStorage.getItem(key);
    if (!data) {
      localStorage.setItem(key, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(data);
  } catch (_) {
    return initial;
  }
}

function setLocal<T>(key: string, data: T[]) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (_) {}
}

export const db = {
  // --- BROKERS ---
  async fetchBrokers(): Promise<{ data: Broker[]; error: string | null; isFallback?: boolean }> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('brokers').select('*').order('id', { ascending: true });
        if (error) throw error;
        setLocal(KEYS.BROKERS, data);
        return { data: data || [], error: null };
      } catch (err: any) {
        return { data: getLocal(KEYS.BROKERS, MOCK_BROKERS), error: err.message, isFallback: true };
      }
    }
    return { data: getLocal(KEYS.BROKERS, MOCK_BROKERS), error: null };
  },

  async saveBroker(broker: Broker): Promise<{ error: string | null; isFallback?: boolean }> {
    // Save to local storage first
    const local = getLocal(KEYS.BROKERS, MOCK_BROKERS);
    const idx = local.findIndex(b => b.id === broker.id);
    if (idx >= 0) local[idx] = broker;
    else local.push(broker);
    setLocal(KEYS.BROKERS, local);

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('brokers').upsert([broker]);
        if (error) throw error;
        return { error: null };
      } catch (err: any) {
        return { error: err.message, isFallback: true };
      }
    }
    return { error: null };
  },

  async deleteBroker(id: string): Promise<{ error: string | null; isFallback?: boolean }> {
    const local = getLocal(KEYS.BROKERS, MOCK_BROKERS).filter(b => b.id !== id);
    setLocal(KEYS.BROKERS, local);

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('brokers').delete().eq('id', id);
        if (error) throw error;
        return { error: null };
      } catch (err: any) {
        return { error: err.message, isFallback: true };
      }
    }
    return { error: null };
  },

  // --- PROJECTS ---
  async fetchProjects(): Promise<{ data: Project[]; error: string | null; isFallback?: boolean }> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('projects').select('*').order('name', { ascending: true });
        if (error) throw error;
        setLocal(KEYS.PROJECTS, data);
        return { data: data || [], error: null };
      } catch (err: any) {
        return { data: getLocal(KEYS.PROJECTS, MOCK_PROJECTS), error: err.message, isFallback: true };
      }
    }
    return { data: getLocal(KEYS.PROJECTS, MOCK_PROJECTS), error: null };
  },

  async saveProject(project: Project): Promise<{ error: string | null; isFallback?: boolean }> {
    const local = getLocal(KEYS.PROJECTS, MOCK_PROJECTS);
    const idx = local.findIndex(p => p.id === project.id);
    if (idx >= 0) local[idx] = project;
    else local.push(project);
    setLocal(KEYS.PROJECTS, local);

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('projects').upsert([project]);
        if (error) throw error;
        return { error: null };
      } catch (err: any) {
        return { error: err.message, isFallback: true };
      }
    }
    return { error: null };
  },

  // --- PROPERTIES (FLATS) ---
  async fetchProperties(): Promise<{ data: Property[]; error: string | null; isFallback?: boolean }> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('properties').select('*').order('id', { ascending: true });
        if (error) throw error;
        setLocal(KEYS.PROPERTIES, data);
        return { data: data || [], error: null };
      } catch (err: any) {
        return { data: getLocal(KEYS.PROPERTIES, MOCK_PROPERTIES), error: err.message, isFallback: true };
      }
    }
    return { data: getLocal(KEYS.PROPERTIES, MOCK_PROPERTIES), error: null };
  },

  async saveProperty(property: Property): Promise<{ error: string | null; isFallback?: boolean }> {
    const local = getLocal(KEYS.PROPERTIES, MOCK_PROPERTIES);
    const idx = local.findIndex(p => p.id === property.id);
    if (idx >= 0) local[idx] = property;
    else local.push(property);
    setLocal(KEYS.PROPERTIES, local);

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('properties').upsert([property]);
        if (error) throw error;
        return { error: null };
      } catch (err: any) {
        return { error: err.message, isFallback: true };
      }
    }
    return { error: null };
  },

  // --- CUSTOMERS ---
  async fetchCustomers(): Promise<{ data: Customer[]; error: string | null; isFallback?: boolean }> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('customers').select('*').order('name', { ascending: true });
        if (error) throw error;
        setLocal(KEYS.CUSTOMERS, data);
        return { data: data || [], error: null };
      } catch (err: any) {
        return { data: getLocal(KEYS.CUSTOMERS, MOCK_CUSTOMERS), error: err.message, isFallback: true };
      }
    }
    return { data: getLocal(KEYS.CUSTOMERS, MOCK_CUSTOMERS), error: null };
  },

  async saveCustomer(customer: Customer): Promise<{ error: string | null; isFallback?: boolean }> {
    const local = getLocal(KEYS.CUSTOMERS, MOCK_CUSTOMERS);
    const idx = local.findIndex(c => c.id === customer.id);
    if (idx >= 0) local[idx] = customer;
    else local.push(customer);
    setLocal(KEYS.CUSTOMERS, local);

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('customers').upsert([customer]);
        if (error) throw error;
        return { error: null };
      } catch (err: any) {
        return { error: err.message, isFallback: true };
      }
    }
    return { error: null };
  },

  // --- SALES ---
  async fetchSales(): Promise<{ data: Sale[]; error: string | null; isFallback?: boolean }> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('sales').select('*').order('booking_date', { ascending: false });
        if (error) throw error;
        setLocal(KEYS.SALES, data);
        return { data: data || [], error: null };
      } catch (err: any) {
        return { data: getLocal(KEYS.SALES, MOCK_SALES), error: err.message, isFallback: true };
      }
    }
    return { data: getLocal(KEYS.SALES, MOCK_SALES), error: null };
  },

  async saveSale(sale: Sale): Promise<{ error: string | null; isFallback?: boolean }> {
    const local = getLocal(KEYS.SALES, MOCK_SALES);
    const idx = local.findIndex(s => s.id === sale.id);
    if (idx >= 0) local[idx] = sale;
    else local.push(sale);
    setLocal(KEYS.SALES, local);

    // Also update property availability to Sold
    const props = getLocal(KEYS.PROPERTIES, MOCK_PROPERTIES);
    const pIdx = props.findIndex(p => p.id === sale.property_id);
    if (pIdx >= 0) {
      props[pIdx].status = 'Sold';
      setLocal(KEYS.PROPERTIES, props);
      if (isSupabaseConfigured && supabase) {
        await supabase.from('properties').update({ status: 'Sold' }).eq('id', sale.property_id);
      }
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('sales').upsert([sale]);
        if (error) throw error;
        return { error: null };
      } catch (err: any) {
        return { error: err.message, isFallback: true };
      }
    }
    return { error: null };
  },

  async deleteSale(id: string): Promise<{ error: string | null; isFallback?: boolean }> {
    const localSales = getLocal(KEYS.SALES, MOCK_SALES);
    const sale = localSales.find(s => s.id === id);
    if (sale) {
      // Revert property status to Available
      const props = getLocal(KEYS.PROPERTIES, MOCK_PROPERTIES);
      const pIdx = props.findIndex(p => p.id === sale.property_id);
      if (pIdx >= 0) {
        props[pIdx].status = 'Available';
        setLocal(KEYS.PROPERTIES, props);
        if (isSupabaseConfigured && supabase) {
          await supabase.from('properties').update({ status: 'Available' }).eq('id', sale.property_id);
        }
      }
    }

    const filtered = localSales.filter(s => s.id !== id);
    setLocal(KEYS.SALES, filtered);

    // Filter out commissions/payments related
    const localComms = getLocal(KEYS.COMMISSIONS, MOCK_COMMISSIONS).filter(c => c.sale_id !== id);
    setLocal(KEYS.COMMISSIONS, localComms);

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('sales').delete().eq('id', id);
        if (error) throw error;
        return { error: null };
      } catch (err: any) {
        return { error: err.message, isFallback: true };
      }
    }
    return { error: null };
  },

  // --- COMMISSIONS ---
  async fetchCommissions(): Promise<{ data: Commission[]; error: string | null; isFallback?: boolean }> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('commissions').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        setLocal(KEYS.COMMISSIONS, data);
        return { data: data || [], error: null };
      } catch (err: any) {
        return { data: getLocal(KEYS.COMMISSIONS, MOCK_COMMISSIONS), error: err.message, isFallback: true };
      }
    }
    return { data: getLocal(KEYS.COMMISSIONS, MOCK_COMMISSIONS), error: null };
  },

  async saveCommission(commission: Commission): Promise<{ error: string | null; isFallback?: boolean }> {
    const local = getLocal(KEYS.COMMISSIONS, MOCK_COMMISSIONS);
    const idx = local.findIndex(c => c.id === commission.id);
    if (idx >= 0) local[idx] = commission;
    else local.push(commission);
    setLocal(KEYS.COMMISSIONS, local);

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('commissions').upsert([commission]);
        if (error) throw error;
        return { error: null };
      } catch (err: any) {
        return { error: err.message, isFallback: true };
      }
    }
    return { error: null };
  },

  // --- PAYMENTS ---
  async fetchPayments(): Promise<{ data: Payment[]; error: string | null; isFallback?: boolean }> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('payments').select('*').order('payment_date', { ascending: false });
        if (error) throw error;
        setLocal(KEYS.PAYMENTS, data);
        return { data: data || [], error: null };
      } catch (err: any) {
        return { data: getLocal(KEYS.PAYMENTS, MOCK_PAYMENTS), error: err.message, isFallback: true };
      }
    }
    return { data: getLocal(KEYS.PAYMENTS, MOCK_PAYMENTS), error: null };
  },

  async savePayment(payment: Payment): Promise<{ error: string | null; isFallback?: boolean }> {
    const local = getLocal(KEYS.PAYMENTS, MOCK_PAYMENTS);
    const idx = local.findIndex(p => p.id === payment.id);
    if (idx >= 0) local[idx] = payment;
    else local.push(payment);
    setLocal(KEYS.PAYMENTS, local);

    // Update commission calculations based on payments
    const comms = getLocal(KEYS.COMMISSIONS, MOCK_COMMISSIONS);
    const commIdx = comms.findIndex(c => c.id === payment.commission_id);
    if (commIdx >= 0) {
      const comm = comms[commIdx];
      // Total payments for this commission
      const allPayments = local.filter(p => p.commission_id === payment.commission_id);
      const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);
      const netPayable = comm.net_commission;
      const remaining = netPayable - totalPaid;

      comm.paid_amount = totalPaid;
      comm.pending_amount = Math.max(0, remaining);
      if (remaining <= 0) {
        comm.status = 'Paid';
        comm.payment_date = payment.payment_date;
      } else if (totalPaid > 0) {
        comm.status = 'Partially Paid';
      } else {
        comm.status = 'Pending';
      }

      comms[commIdx] = comm;
      setLocal(KEYS.COMMISSIONS, comms);

      if (isSupabaseConfigured && supabase) {
        await supabase.from('commissions').upsert([comm]);
      }
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('payments').upsert([payment]);
        if (error) throw error;
        return { error: null };
      } catch (err: any) {
        return { error: err.message, isFallback: true };
      }
    }
    return { error: null };
  },

  async deletePayment(id: string): Promise<{ error: string | null; isFallback?: boolean }> {
    const originalPayments = getLocal(KEYS.PAYMENTS, MOCK_PAYMENTS);
    const targetPayment = originalPayments.find(p => p.id === id);
    const filtered = originalPayments.filter(p => p.id !== id);
    setLocal(KEYS.PAYMENTS, filtered);

    if (targetPayment) {
      // Re-calculate commission
      const comms = getLocal(KEYS.COMMISSIONS, MOCK_COMMISSIONS);
      const commIdx = comms.findIndex(c => c.id === targetPayment.commission_id);
      if (commIdx >= 0) {
        const comm = comms[commIdx];
        const allPayments = filtered.filter(p => p.commission_id === targetPayment.commission_id);
        const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);
        const netPayable = comm.net_commission;
        const remaining = netPayable - totalPaid;

        comm.paid_amount = totalPaid;
        comm.pending_amount = Math.max(0, remaining);
        if (remaining <= 0) {
          comm.status = 'Paid';
        } else if (totalPaid > 0) {
          comm.status = 'Partially Paid';
        } else {
          comm.status = 'Pending';
          comm.payment_date = undefined;
        }

        comms[commIdx] = comm;
        setLocal(KEYS.COMMISSIONS, comms);
        if (isSupabaseConfigured && supabase) {
          await supabase.from('commissions').upsert([comm]);
        }
      }
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('payments').delete().eq('id', id);
        if (error) throw error;
        return { error: null };
      } catch (err: any) {
        return { error: err.message, isFallback: true };
      }
    }
    return { error: null };
  },

  // --- AUDIT LOGS ---
  async fetchAuditLogs(): Promise<{ data: AuditLog[]; error: string | null; isFallback?: boolean }> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        setLocal(KEYS.AUDIT_LOGS, data);
        return { data: data || [], error: null };
      } catch (err: any) {
        return { data: getLocal(KEYS.AUDIT_LOGS, MOCK_AUDIT_LOGS), error: err.message, isFallback: true };
      }
    }
    return { data: getLocal(KEYS.AUDIT_LOGS, MOCK_AUDIT_LOGS), error: null };
  },

  async logAction(email: string, role: string, action: string, details: string): Promise<void> {
    const newLog: AuditLog = {
      id: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
      user_email: email,
      user_role: role,
      action,
      details,
      created_at: new Date().toISOString()
    };

    const logs = getLocal(KEYS.AUDIT_LOGS, MOCK_AUDIT_LOGS);
    logs.unshift(newLog);
    setLocal(KEYS.AUDIT_LOGS, logs.slice(0, 500)); // limit to 500 logs locally

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('audit_logs').insert([newLog]);
      } catch (_) {}
    }
  },

  // --- NOTIFICATIONS ---
  async fetchNotifications(): Promise<{ data: AppNotification[]; error: string | null; isFallback?: boolean }> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('notifications').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        setLocal(KEYS.NOTIFICATIONS, data);
        return { data: data || [], error: null };
      } catch (err: any) {
        return { data: getLocal(KEYS.NOTIFICATIONS, MOCK_NOTIFICATIONS), error: err.message, isFallback: true };
      }
    }
    return { data: getLocal(KEYS.NOTIFICATIONS, MOCK_NOTIFICATIONS), error: null };
  },

  async saveNotification(notif: Omit<AppNotification, 'id' | 'is_read' | 'created_at'>): Promise<void> {
    const newNotif: AppNotification = {
      ...notif,
      id: `NOT-${Math.floor(1000 + Math.random() * 9000)}`,
      is_read: false,
      created_at: new Date().toISOString()
    };

    const local = getLocal(KEYS.NOTIFICATIONS, MOCK_NOTIFICATIONS);
    local.unshift(newNotif);
    setLocal(KEYS.NOTIFICATIONS, local);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('notifications').insert([newNotif]);
      } catch (_) {}
    }
  },

  async markAllNotificationsRead(): Promise<void> {
    const local = getLocal(KEYS.NOTIFICATIONS, MOCK_NOTIFICATIONS);
    local.forEach(n => n.is_read = true);
    setLocal(KEYS.NOTIFICATIONS, local);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('notifications').update({ is_read: true }).eq('is_read', false);
      } catch (_) {}
    }
  },

  // --- USERS ---
  async fetchUsers(): Promise<{ data: User[]; error: string | null; isFallback?: boolean }> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('users').select('*').order('name', { ascending: true });
        if (error) throw error;
        setLocal(KEYS.USERS, data);
        return { data: data || [], error: null };
      } catch (err: any) {
        return { data: getLocal(KEYS.USERS, MOCK_USERS), error: err.message, isFallback: true };
      }
    }
    return { data: getLocal(KEYS.USERS, MOCK_USERS), error: null };
  }
};
