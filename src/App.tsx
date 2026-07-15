import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Coins,
  CheckCircle,
  AlertCircle,
  Plus,
  Search,
  Settings as SettingsIcon,
  FileText,
  FileSpreadsheet,
  Download,
  Trash2,
  Edit2,
  Database,
  Info,
  Calendar,
  X,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { CommissionEntry, RoleType, SettingsType } from './types';
import { db, isSupabaseConfigured } from './supabaseClient';
import { calculateCommissionDetails, formatCurrency, formatNumber } from './utils';
import { exportToExcel, exportToPDF } from './exportUtils';

// Pre-populated sample data for initial LocalStorage state
const SAMPLE_ENTRIES: CommissionEntry[] = [
  {
    id: 'sample-1',
    project_name: 'Skyline Heights',
    person_name: 'Rajesh Sharma',
    role: 'Sales Executive',
    sale_value: 8000000, // ₹80L
    calc_type: 'percentage',
    rate_or_amount: 2.0, // 2%
    has_gst: false,
    gst_percentage: 18,
    tds_percentage: 5, // 5% TDS
    payment_status: 'Paid',
    payment_date: '2026-07-10',
    created_at: '2026-07-10T12:00:00.000Z'
  },
  {
    id: 'sample-2',
    project_name: 'Cyber Plaza',
    person_name: 'Apex Realtors',
    role: 'Broker',
    sale_value: 15000000, // ₹1.5 Cr
    calc_type: 'percentage',
    rate_or_amount: 3.0, // 3%
    has_gst: true,
    gst_percentage: 18,
    tds_percentage: 5,
    payment_status: 'Pending',
    created_at: '2026-07-12T15:00:00.000Z'
  },
  {
    id: 'sample-3',
    project_name: 'Orchard Residences',
    person_name: 'Priyanka Sen',
    role: 'Sales Executive',
    sale_value: 6500000, // ₹65L
    calc_type: 'fixed',
    rate_or_amount: 150000, // ₹1.5L Fixed
    has_gst: false,
    gst_percentage: 18,
    tds_percentage: 10, // 10% TDS
    payment_status: 'Paid',
    payment_date: '2026-07-14',
    created_at: '2026-07-14T09:00:00.000Z'
  }
];

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<'home' | 'reports' | 'settings'>('home');

  // Ledger state
  const [entries, setEntries] = useState<CommissionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [supabaseError, setSupabaseError] = useState<string | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [reFetching, setReFetching] = useState(false);

  // Settings state for default rates
  const [defaultGst, setDefaultGst] = useState<number>(() => {
    const saved = localStorage.getItem('re_sys_default_gst_percentage');
    return saved ? parseFloat(saved) : 18.0;
  });
  const [defaultTds, setDefaultTds] = useState<number>(() => {
    const saved = localStorage.getItem('re_sys_default_tds_percentage');
    return saved ? parseFloat(saved) : 5.0;
  });

  // Home search & filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Paid' | 'Pending'>('ALL');

  // Modal form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form fields
  const [formProject, setFormProject] = useState('');
  const [formPerson, setFormPerson] = useState('');
  const [formRole, setFormRole] = useState<RoleType>('Broker');
  const [formSaleValue, setFormSaleValue] = useState<number>(0);
  const [formCalcType, setFormCalcType] = useState<'percentage' | 'fixed'>('percentage');
  const [formRateOrAmount, setFormRateOrAmount] = useState<number>(0);
  const [formHasGst, setFormHasGst] = useState<boolean>(false);
  const [formGstPercentage, setFormGstPercentage] = useState<number>(18.0);
  const [formTdsPercentage, setFormTdsPercentage] = useState<number>(5.0);
  const [formPaymentStatus, setFormPaymentStatus] = useState<'Pending' | 'Paid'>('Pending');
  const [formPaymentDate, setFormPaymentDate] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Delete safety check state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Reports state
  const [reportType, setReportType] = useState<'person' | 'project' | 'month'>('person');

  // Fetch entries from db/localStorage on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (showRefetchIndicator = false) => {
    if (showRefetchIndicator) {
      setReFetching(true);
    } else {
      setLoading(true);
    }
    setDbError(null);
    setSupabaseError(null);

    try {
      const { data, error, isFallback } = await db.fetchEntries();
      if (isFallback) {
        setSupabaseError(error || 'Supabase offline. Loaded from local fallback storage.');
        if (data) {
          setEntries(data);
        }
      } else if (error) {
        if (isSupabaseConfigured) {
          setSupabaseError(error);
          // Load from LocalStorage as a local fallback when Supabase is failing
          try {
            const saved = localStorage.getItem('re_sys_commission_entries_v5');
            if (saved) {
              setEntries(JSON.parse(saved));
            }
          } catch (_) {}
        } else {
          setDbError(error);
        }
      } else if (data) {
        // If Supabase is NOT configured and local storage is empty, populate sample data
        if (!isSupabaseConfigured && data.length === 0) {
          localStorage.setItem('re_sys_commission_entries_v5', JSON.stringify(SAMPLE_ENTRIES));
          setEntries(SAMPLE_ENTRIES);
        } else {
          setEntries(data);
        }
        setSupabaseError(null);
      }
    } catch (err: any) {
      const msg = err.message || 'Unknown error fetching data';
      if (isSupabaseConfigured) {
        setSupabaseError(msg);
      } else {
        setDbError(msg);
      }
    } finally {
      setLoading(false);
      setReFetching(false);
    }
  };

  // Prefill settings rates on form changes
  useEffect(() => {
    if (!editingId && isModalOpen) {
      setFormGstPercentage(defaultGst);
      setFormTdsPercentage(defaultTds);
    }
  }, [isModalOpen, editingId, defaultGst, defaultTds]);

  // Live calculation based on form fields
  const liveBreakdown = calculateCommissionDetails(
    formSaleValue,
    formCalcType,
    formRateOrAmount,
    formHasGst,
    formGstPercentage,
    formTdsPercentage
  );

  // Unique project names for datalist/autocomplete
  const uniqueProjects = Array.from(
    new Set(entries.map(e => e.project_name).filter(Boolean))
  ).sort();

  // Handle open modal for new entry
  const openNewModal = () => {
    setEditingId(null);
    setFormProject('');
    setFormPerson('');
    setFormRole('Broker');
    setFormSaleValue(0);
    setFormCalcType('percentage');
    setFormRateOrAmount(0);
    setFormHasGst(false);
    setFormGstPercentage(defaultGst);
    setFormTdsPercentage(defaultTds);
    setFormPaymentStatus('Pending');
    setFormPaymentDate(new Date().toISOString().split('T')[0]);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Handle open modal for editing
  const openEditModal = (entry: CommissionEntry) => {
    setEditingId(entry.id);
    setFormProject(entry.project_name);
    setFormPerson(entry.person_name);
    setFormRole(entry.role);
    setFormSaleValue(entry.sale_value);
    setFormCalcType(entry.calc_type);
    setFormRateOrAmount(entry.rate_or_amount);
    setFormHasGst(entry.has_gst);
    setFormGstPercentage(entry.gst_percentage);
    setFormTdsPercentage(entry.tds_percentage);
    setFormPaymentStatus(entry.payment_status);
    setFormPaymentDate(entry.payment_date || new Date().toISOString().split('T')[0]);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Handle saving the entry
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (!formProject.trim()) {
      setFormError('Project Name is required');
      return;
    }
    if (!formPerson.trim()) {
      setFormError('Person Name is required');
      return;
    }
    if (formSaleValue <= 0) {
      setFormError('Sale value must be a positive number');
      return;
    }
    if (formRateOrAmount < 0) {
      setFormError('Commission rate or amount cannot be negative');
      return;
    }
    if (formCalcType === 'percentage' && formRateOrAmount > 100) {
      setFormError('Commission percentage cannot exceed 100%');
      return;
    }
    if (formHasGst && (formGstPercentage < 0 || formGstPercentage > 100)) {
      setFormError('GST percentage must be between 0% and 100%');
      return;
    }
    if (formTdsPercentage < 0 || formTdsPercentage > 100) {
      setFormError('TDS percentage must be between 0% and 100%');
      return;
    }

    setSaveLoading(true);

    const entryId = editingId || crypto.randomUUID();
    const newEntry: CommissionEntry = {
      id: entryId,
      project_name: formProject.trim(),
      person_name: formPerson.trim(),
      role: formRole,
      sale_value: formSaleValue,
      calc_type: formCalcType,
      rate_or_amount: formRateOrAmount,
      has_gst: formHasGst,
      gst_percentage: formHasGst ? formGstPercentage : 0,
      tds_percentage: formTdsPercentage,
      payment_status: formPaymentStatus,
      payment_date: formPaymentStatus === 'Paid' ? formPaymentDate : undefined,
    };

    const isNew = !editingId;
    try {
      const { error, isFallback } = await db.saveEntry(newEntry, isNew);
      if (error) {
        setFormError(`Could not ${isNew ? 'add' : 'update'} entry: ${error}`);
        setSaveLoading(false);
        return;
      }

      if (isFallback) {
        setSupabaseError('Supabase offline. Saved locally.');
      } else {
        setSupabaseError(null);
      }

      // Re-fetch to confirm and refresh screen (mandated by USER)
      const { data, error: fetchError, isFallback: fetchFallback } = await db.fetchEntries();
      if (fetchError && !fetchFallback) {
        // Local state manual update as fallback
        setEntries(prev => {
          const index = prev.findIndex(e => e.id === newEntry.id);
          if (index >= 0) {
            const updated = [...prev];
            updated[index] = newEntry;
            return updated;
          } else {
            return [newEntry, ...prev];
          }
        });
      } else if (data) {
        setEntries(data);
        if (fetchFallback) {
          setSupabaseError('Supabase offline. Loaded from local storage.');
        }
      }
      setIsModalOpen(false);
    } catch (err: any) {
      // Ultimate local state manual update
      setEntries(prev => {
        const index = prev.findIndex(e => e.id === newEntry.id);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = newEntry;
          return updated;
        } else {
          return [newEntry, ...prev];
        }
      });
      setIsModalOpen(false);
    } finally {
      setSaveLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    try {
      const { error, isFallback } = await db.deleteEntry(id);
      if (error) {
        setDbError(`Failed to delete: ${error}`);
        return;
      }

      if (isFallback) {
        setSupabaseError('Supabase offline. Deleted from local fallback storage.');
      }

      // Re-fetch to confirm
      const { data, error: fetchError, isFallback: fetchFallback } = await db.fetchEntries();
      if ((fetchError && !fetchFallback) || !data) {
        setEntries(prev => prev.filter(e => e.id !== id));
      } else if (data) {
        setEntries(data);
        if (fetchFallback) {
          setSupabaseError('Supabase offline. Loaded from local fallback storage.');
        }
      }
      setDeletingId(null);
    } catch (err: any) {
      setEntries(prev => prev.filter(e => e.id !== id));
      setDeletingId(null);
    }
  };

  // --- STATS COMPUTATIONS ---
  const totals = entries.reduce(
    (acc, entry) => {
      const breakdown = calculateCommissionDetails(
        entry.sale_value,
        entry.calc_type,
        entry.rate_or_amount,
        entry.has_gst,
        entry.gst_percentage,
        entry.tds_percentage
      );

      acc.totalSales += entry.sale_value;
      acc.totalCommission += breakdown.finalAmount;
      if (entry.payment_status === 'Paid') {
        acc.paid += breakdown.finalAmount;
      } else {
        acc.pending += breakdown.finalAmount;
      }
      return acc;
    },
    { totalSales: 0, totalCommission: 0, paid: 0, pending: 0 }
  );

  // --- FILTERED LIST FOR HOME TABLE ---
  const filteredEntries = entries.filter(entry => {
    const matchesSearch =
      entry.project_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.person_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.role.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' || entry.payment_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // --- REPORTS GENERATION LOGIC WITH GST/TDS BREAKDOWN ---
  const getReportData = () => {
    if (reportType === 'person') {
      // Group by Person
      const groups: Record<string, { 
        role: RoleType; 
        sales: number; 
        baseCommission: number; 
        gstAmount: number; 
        tdsAmount: number; 
        finalAmount: number; 
        paid: number; 
        pending: number 
      }> = {};

      entries.forEach(e => {
        const key = e.person_name;
        const b = calculateCommissionDetails(e.sale_value, e.calc_type, e.rate_or_amount, e.has_gst, e.gst_percentage, e.tds_percentage);
        
        if (!groups[key]) {
          groups[key] = { role: e.role, sales: 0, baseCommission: 0, gstAmount: 0, tdsAmount: 0, finalAmount: 0, paid: 0, pending: 0 };
        }
        groups[key].sales += e.sale_value;
        groups[key].baseCommission += b.baseCommission;
        groups[key].gstAmount += b.gstAmount;
        groups[key].tdsAmount += b.tdsAmount;
        groups[key].finalAmount += b.finalAmount;
        if (e.payment_status === 'Paid') {
          groups[key].paid += b.finalAmount;
        } else {
          groups[key].pending += b.finalAmount;
        }
      });

      const headers = [
        'Person Name', 
        'Role', 
        'Total Sales (₹)', 
        'Base Commission (₹)', 
        'GST Amount (₹)', 
        'TDS Amount (₹)', 
        'Final Payout (₹)', 
        'Paid Out (₹)', 
        'Pending (₹)'
      ];

      const rows = Object.entries(groups).map(([name, g]) => [
        name,
        g.role,
        g.sales,
        g.baseCommission,
        g.gstAmount,
        g.tdsAmount,
        g.finalAmount,
        g.paid,
        g.pending
      ]);

      const reportTotals = Object.values(groups).reduce(
        (acc, g) => {
          acc.sales += g.sales;
          acc.baseCommission += g.baseCommission;
          acc.gstAmount += g.gstAmount;
          acc.tdsAmount += g.tdsAmount;
          acc.finalAmount += g.finalAmount;
          acc.paid += g.paid;
          acc.pending += g.pending;
          return acc;
        },
        { sales: 0, baseCommission: 0, gstAmount: 0, tdsAmount: 0, finalAmount: 0, paid: 0, pending: 0 }
      );

      return { headers, rows, reportTotals, title: 'Commission Report by Person' };

    } else if (reportType === 'project') {
      // Group by Project
      const groups: Record<string, { 
        sales: number; 
        baseCommission: number; 
        gstAmount: number; 
        tdsAmount: number; 
        finalAmount: number; 
        paid: number; 
        pending: number 
      }> = {};

      entries.forEach(e => {
        const key = e.project_name;
        const b = calculateCommissionDetails(e.sale_value, e.calc_type, e.rate_or_amount, e.has_gst, e.gst_percentage, e.tds_percentage);
        
        if (!groups[key]) {
          groups[key] = { sales: 0, baseCommission: 0, gstAmount: 0, tdsAmount: 0, finalAmount: 0, paid: 0, pending: 0 };
        }
        groups[key].sales += e.sale_value;
        groups[key].baseCommission += b.baseCommission;
        groups[key].gstAmount += b.gstAmount;
        groups[key].tdsAmount += b.tdsAmount;
        groups[key].finalAmount += b.finalAmount;
        if (e.payment_status === 'Paid') {
          groups[key].paid += b.finalAmount;
        } else {
          groups[key].pending += b.finalAmount;
        }
      });

      const headers = [
        'Project Name', 
        'Total Sales (₹)', 
        'Base Commission (₹)', 
        'GST Amount (₹)', 
        'TDS Amount (₹)', 
        'Final Payout (₹)', 
        'Paid Out (₹)', 
        'Pending (₹)'
      ];

      const rows = Object.entries(groups).map(([name, g]) => [
        name,
        g.sales,
        g.baseCommission,
        g.gstAmount,
        g.tdsAmount,
        g.finalAmount,
        g.paid,
        g.pending
      ]);

      const reportTotals = Object.values(groups).reduce(
        (acc, g) => {
          acc.sales += g.sales;
          acc.baseCommission += g.baseCommission;
          acc.gstAmount += g.gstAmount;
          acc.tdsAmount += g.tdsAmount;
          acc.finalAmount += g.finalAmount;
          acc.paid += g.paid;
          acc.pending += g.pending;
          return acc;
        },
        { sales: 0, baseCommission: 0, gstAmount: 0, tdsAmount: 0, finalAmount: 0, paid: 0, pending: 0 }
      );

      return { headers, rows, reportTotals, title: 'Commission Report by Project' };

    } else {
      // Group by Month
      const groups: Record<string, { 
        sales: number; 
        baseCommission: number; 
        gstAmount: number; 
        tdsAmount: number; 
        finalAmount: number; 
        paid: number; 
        pending: number 
      }> = {};

      entries.forEach(e => {
        let dateObj = new Date();
        if (e.payment_status === 'Paid' && e.payment_date) {
          dateObj = new Date(e.payment_date);
        } else if (e.created_at) {
          dateObj = new Date(e.created_at);
        }
        
        let monthStr = 'Unknown';
        try {
          monthStr = dateObj.toLocaleString('default', { month: 'long', year: 'numeric' });
        } catch (_) {}

        const b = calculateCommissionDetails(e.sale_value, e.calc_type, e.rate_or_amount, e.has_gst, e.gst_percentage, e.tds_percentage);
        
        if (!groups[monthStr]) {
          groups[monthStr] = { sales: 0, baseCommission: 0, gstAmount: 0, tdsAmount: 0, finalAmount: 0, paid: 0, pending: 0 };
        }
        groups[monthStr].sales += e.sale_value;
        groups[monthStr].baseCommission += b.baseCommission;
        groups[monthStr].gstAmount += b.gstAmount;
        groups[monthStr].tdsAmount += b.tdsAmount;
        groups[monthStr].finalAmount += b.finalAmount;
        if (e.payment_status === 'Paid') {
          groups[monthStr].paid += b.finalAmount;
        } else {
          groups[monthStr].pending += b.finalAmount;
        }
      });

      const headers = [
        'Payout Month', 
        'Total Sales (₹)', 
        'Base Commission (₹)', 
        'GST Amount (₹)', 
        'TDS Amount (₹)', 
        'Final Payout (₹)', 
        'Paid Out (₹)', 
        'Pending (₹)'
      ];

      const rows = Object.entries(groups).map(([month, g]) => [
        month,
        g.sales,
        g.baseCommission,
        g.gstAmount,
        g.tdsAmount,
        g.finalAmount,
        g.paid,
        g.pending
      ]);

      const reportTotals = Object.values(groups).reduce(
        (acc, g) => {
          acc.sales += g.sales;
          acc.baseCommission += g.baseCommission;
          acc.gstAmount += g.gstAmount;
          acc.tdsAmount += g.tdsAmount;
          acc.finalAmount += g.finalAmount;
          acc.paid += g.paid;
          acc.pending += g.pending;
          return acc;
        },
        { sales: 0, baseCommission: 0, gstAmount: 0, tdsAmount: 0, finalAmount: 0, paid: 0, pending: 0 }
      );

      return { headers, rows, reportTotals, title: 'Commission Report by Month' };
    }
  };

  const reportData = getReportData();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 font-sans antialiased pb-12">
      {/* Dynamic Header */}
      <header className="sticky top-0 bg-white border-b border-slate-200 z-10 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2.5">
              <div className="bg-blue-600 text-white p-2 rounded-lg shadow-sm">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base font-bold text-slate-900 tracking-tight">Commission ledger</h1>
                <p className="text-[10px] text-slate-500 font-medium">Real Estate Commission Engine</p>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center gap-3">
              {/* Connection Status Badge */}
              {isSupabaseConfigured ? (
                supabaseError ? (
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 text-[9px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-50 rounded-md border border-amber-200" title={supabaseError}>
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    Local Fallback
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 text-[9px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 rounded-md border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Supabase Connected
                  </span>
                )
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2 py-1 text-[9px] font-extrabold uppercase tracking-wider text-slate-600 bg-slate-50 rounded-md border border-slate-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  Local Storage Mode
                </span>
              )}

              {/* Refresh Button */}
              <button
                onClick={() => loadData(true)}
                title="Force refresh database records"
                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${reFetching ? 'animate-spin text-blue-600' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex border-t border-slate-100">
          <nav className="flex gap-6 -mb-px">
            <button
              onClick={() => setActiveTab('home')}
              className={`py-3 text-xs font-bold border-b-2 px-1 transition-colors cursor-pointer ${
                activeTab === 'home'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`py-3 text-xs font-bold border-b-2 px-1 transition-colors cursor-pointer ${
                activeTab === 'reports'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              Reports
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-3 text-xs font-bold border-b-2 px-1 transition-colors cursor-pointer ${
                activeTab === 'settings'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              Settings
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Arena */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        
        {/* Database Error Banner */}
        {dbError && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl shadow-xs">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-xs font-bold text-red-800 uppercase tracking-wider">Database Error</h3>
                <p className="text-xs text-red-700 mt-0.5 leading-relaxed">{dbError}</p>
                <div className="mt-2.5 flex items-center gap-2">
                  <button
                    onClick={() => loadData()}
                    className="px-2.5 py-1 text-[10px] font-bold text-white bg-red-600 hover:bg-red-700 rounded transition-all cursor-pointer"
                  >
                    Retry Database Fetch
                  </button>
                  <button
                    onClick={() => setDbError(null)}
                    className="px-2.5 py-1 text-[10px] font-semibold text-red-800 hover:bg-red-100 rounded transition-all cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* LOADING INDICATOR */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest animate-pulse">Loading Records...</p>
          </div>
        ) : (
          <>
            {/* SCREEN 1: HOME */}
            {activeTab === 'home' && (
              <div className="space-y-6">
                
                {/* 4 KPI cards at the top */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* KPI 1: Total Sales */}
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Total Sales</p>
                      <h3 className="text-lg font-black text-slate-900 mt-0.5">{formatCurrency(totals.totalSales)}</h3>
                      <p className="text-[9px] text-slate-400 font-semibold mt-0.5">{entries.length} deals total</p>
                    </div>
                  </div>

                  {/* KPI 2: Total Commission */}
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                      <Coins className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Total Payout</p>
                      <h3 className="text-lg font-black text-slate-900 mt-0.5">{formatCurrency(totals.totalCommission)}</h3>
                      <p className="text-[9px] text-slate-400 font-semibold mt-0.5">Post-deductions value</p>
                    </div>
                  </div>

                  {/* KPI 3: Paid */}
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Paid Commission</p>
                      <h3 className="text-lg font-black text-slate-900 mt-0.5">{formatCurrency(totals.paid)}</h3>
                      <p className="text-[9px] text-emerald-600 font-semibold mt-0.5">Disbursed funds</p>
                    </div>
                  </div>

                  {/* KPI 4: Pending */}
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Pending Commission</p>
                      <h3 className="text-lg font-black text-slate-900 mt-0.5">{formatCurrency(totals.pending)}</h3>
                      <p className="text-[9px] text-amber-600 font-semibold mt-0.5">In process of payout</p>
                    </div>
                  </div>
                </div>

                {/* Control Bar: Search, filter & main Add button */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                  
                  {/* Search and filter controls */}
                  <div className="flex flex-1 flex-col sm:flex-row items-stretch gap-3">
                    {/* Search box */}
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search project, person, or role..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-600 text-slate-800 placeholder-slate-400 font-medium"
                      />
                    </div>

                    {/* Status filter dropdown */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider whitespace-nowrap hidden sm:inline">Status:</span>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="px-3 py-2 text-xs font-bold rounded-lg border border-slate-200 bg-slate-50 text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-blue-600 cursor-pointer"
                      >
                        <option value="ALL">All Entries</option>
                        <option value="Paid">Paid Only</option>
                        <option value="Pending">Pending Only</option>
                      </select>
                    </div>
                  </div>

                  {/* Main "+ Add Commission Entry" Button */}
                  <button
                    onClick={openNewModal}
                    className="flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-lg shadow-xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Add Commission Entry
                  </button>
                </div>

                {/* Simple Commission Ledger Table */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="px-5 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Project</th>
                          <th className="px-5 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Stakeholder (Role)</th>
                          <th className="px-5 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider text-right">Sale Value</th>
                          <th className="px-5 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider text-right">Final Payout</th>
                          <th className="px-5 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider text-center">Status</th>
                          <th className="px-5 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredEntries.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-5 py-16 text-center">
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">No Commission entries found</p>
                              <p className="text-[11px] text-slate-400 mt-1 font-medium">Try adjusting your filters, searching, or create a new entry.</p>
                            </td>
                          </tr>
                        ) : (
                          filteredEntries.map(entry => {
                            const breakdown = calculateCommissionDetails(
                              entry.sale_value,
                              entry.calc_type,
                              entry.rate_or_amount,
                              entry.has_gst,
                              entry.gst_percentage,
                              entry.tds_percentage
                            );

                            return (
                              <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-5 py-3.5">
                                  <div className="font-bold text-slate-900 text-xs">{entry.project_name}</div>
                                </td>
                                <td className="px-5 py-3.5">
                                  <div className="font-bold text-slate-800 text-xs">{entry.person_name}</div>
                                  <div className="text-[10px] text-slate-400 font-semibold tracking-wide uppercase mt-0.5">{entry.role}</div>
                                </td>
                                <td className="px-5 py-3.5 text-right font-semibold text-xs text-slate-600">
                                  {formatCurrency(entry.sale_value)}
                                </td>
                                <td className="px-5 py-3.5 text-right">
                                  <div className="font-extrabold text-slate-900 text-xs">{formatCurrency(breakdown.finalAmount)}</div>
                                  <div className="text-[9.5px] text-slate-400 font-semibold mt-0.5">
                                    {entry.calc_type === 'percentage' ? `${entry.rate_or_amount}%` : 'Fixed'}{' '}
                                    {entry.has_gst && <span className="text-emerald-600">+{entry.gst_percentage}% GST</span>}{' '}
                                    {entry.tds_percentage > 0 && <span className="text-red-500">-{entry.tds_percentage}% TDS</span>}
                                  </div>
                                </td>
                                <td className="px-5 py-3.5 text-center">
                                  {entry.payment_status === 'Paid' ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-150">
                                      Paid
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-50 text-amber-700 border border-amber-150">
                                      Pending
                                    </span>
                                  )}
                                  {entry.payment_status === 'Paid' && entry.payment_date && (
                                    <div className="text-[9px] text-slate-400 font-bold mt-1 tracking-wider uppercase">{entry.payment_date}</div>
                                  )}
                                </td>
                                <td className="px-5 py-3.5 text-right">
                                  {deletingId === entry.id ? (
                                    <div className="inline-flex items-center gap-1.5">
                                      <button
                                        onClick={() => handleDelete(entry.id)}
                                        className="px-2 py-0.5 text-[10px] font-extrabold text-white bg-red-600 hover:bg-red-700 rounded transition-colors cursor-pointer"
                                      >
                                        Delete
                                      </button>
                                      <button
                                        onClick={() => setDeletingId(null)}
                                        className="px-2 py-0.5 text-[10px] font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded transition-colors cursor-pointer"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="inline-flex items-center gap-2">
                                      <button
                                        onClick={() => openEditModal(entry)}
                                        title="Edit Ledger Entry"
                                        className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => setDeletingId(entry.id)}
                                        title="Delete Ledger Entry"
                                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="bg-slate-50 px-5 py-3.5 border-t border-slate-200 flex justify-between items-center">
                    <p className="text-[11px] text-slate-500 font-semibold tracking-wider uppercase">Showing {filteredEntries.length} of {entries.length} calculations</p>
                  </div>
                </div>

              </div>
            )}

            {/* SCREEN 2: REPORTS (DASHBOARD-LEVEL BREAKDOWNS) */}
            {activeTab === 'reports' && (
              <div className="space-y-6">
                
                {/* Options panel */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-extrabold text-slate-400 tracking-widest whitespace-nowrap uppercase">View Report By:</span>
                    <select
                      value={reportType}
                      onChange={(e) => setReportType(e.target.value as any)}
                      className="px-3.5 py-2 text-xs font-bold rounded-lg border border-slate-200 bg-slate-50 text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-blue-600 cursor-pointer"
                    >
                      <option value="person">Person (Stakeholder)</option>
                      <option value="project">Project Name</option>
                      <option value="month">Payout Month</option>
                    </select>
                  </div>

                  {/* PDF/Excel Downloads */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => exportToPDF(reportData.title, reportData.headers, reportData.rows, reportData.reportTotals)}
                      className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 text-xs font-extrabold rounded-lg shadow-xs transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download PDF
                    </button>
                    <button
                      onClick={() => exportToExcel(reportData.title, reportData.headers, reportData.rows, reportData.reportTotals)}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-extrabold rounded-lg shadow-xs transition-colors cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      Download Excel
                    </button>
                  </div>
                </div>

                {/* Report Table View */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider">{reportData.title}</h3>
                    <span className="text-[10px] font-bold text-slate-400">Total Entries: {entries.length}</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          {reportData.headers.map((h, i) => (
                            <th
                              key={i}
                              className={`px-5 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider ${
                                i >= (reportData.headers.length - 7) ? 'text-right' : 'text-left'
                              }`}
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {reportData.rows.length === 0 ? (
                          <tr>
                            <td colSpan={reportData.headers.length} className="px-5 py-12 text-center text-xs font-medium text-slate-400">
                              No entries found to generate report data.
                            </td>
                          </tr>
                        ) : (
                          reportData.rows.map((row, rowIdx) => (
                            <tr key={rowIdx} className="hover:bg-slate-50/50 transition-colors">
                              {row.map((cell, colIdx) => {
                                const isNumeric = colIdx >= (reportData.headers.length - 7);
                                return (
                                  <td
                                    key={colIdx}
                                    className={`px-5 py-3.5 text-xs ${
                                      isNumeric
                                        ? 'text-right font-semibold text-slate-900'
                                        : 'font-bold text-slate-800'
                                    }`}
                                  >
                                    {isNumeric && typeof cell === 'number' ? formatCurrency(cell) : cell}
                                  </td>
                                );
                              })}
                            </tr>
                          ))
                        )}
                      </tbody>
                      {reportData.rows.length > 0 && (
                        <tfoot>
                          <tr className="bg-slate-100 font-black border-t border-slate-200">
                            <td className="px-5 py-4 text-xs text-slate-900 uppercase tracking-wider">GRAND TOTAL</td>
                            {reportData.headers.length > 8 && <td className="px-5 py-4"></td>}
                            <td className="px-5 py-4 text-right text-xs text-slate-900">{formatCurrency(reportData.reportTotals.sales)}</td>
                            <td className="px-5 py-4 text-right text-xs text-slate-900">{formatCurrency(reportData.reportTotals.baseCommission)}</td>
                            <td className="px-5 py-4 text-right text-xs text-slate-900">{formatCurrency(reportData.reportTotals.gstAmount)}</td>
                            <td className="px-5 py-4 text-right text-xs text-slate-900">{formatCurrency(reportData.reportTotals.tdsAmount)}</td>
                            <td className="px-5 py-4 text-right text-xs text-slate-900">{formatCurrency(reportData.reportTotals.finalAmount)}</td>
                            <td className="px-5 py-4 text-right text-xs text-slate-900">{formatCurrency(reportData.reportTotals.paid)}</td>
                            <td className="px-5 py-4 text-right text-xs text-slate-900">{formatCurrency(reportData.reportTotals.pending)}</td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </div>

              </div>
            )}

            {/* SCREEN 3: SETTINGS */}
            {activeTab === 'settings' && (
              <div className="max-w-2xl mx-auto space-y-6">
                
                {/* Default Rates Configuration Form */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider">Calculations configuration</h3>
                  </div>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const gstInput = document.getElementById('setting-gst') as HTMLInputElement;
                      const tdsInput = document.getElementById('setting-tds') as HTMLInputElement;
                      if (gstInput && tdsInput) {
                        const gstVal = Math.max(0, parseFloat(gstInput.value) || 0);
                        const tdsVal = Math.max(0, parseFloat(tdsInput.value) || 0);
                        setDefaultGst(gstVal);
                        setDefaultTds(tdsVal);
                        localStorage.setItem('re_sys_default_gst_percentage', gstVal.toString());
                        localStorage.setItem('re_sys_default_tds_percentage', tdsVal.toString());
                        alert('Calculation default rules saved successfully!');
                      }
                    }}
                    className="p-6 space-y-5"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Default GST */}
                      <div className="space-y-1.5">
                        <label htmlFor="setting-gst" className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                          Default GST %
                        </label>
                        <div className="relative">
                          <input
                            id="setting-gst"
                            type="number"
                            step="0.1"
                            defaultValue={defaultGst}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-600 text-slate-800 font-semibold"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                        </div>
                        <p className="text-[9.5px] text-slate-400 font-semibold italic leading-normal">
                          * Pre-fills the GST % field on new entries.
                        </p>
                      </div>

                      {/* Default TDS */}
                      <div className="space-y-1.5">
                        <label htmlFor="setting-tds" className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                          Default TDS %
                        </label>
                        <div className="relative">
                          <input
                            id="setting-tds"
                            type="number"
                            step="0.1"
                            defaultValue={defaultTds}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-600 text-slate-800 font-semibold"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                        </div>
                        <p className="text-[9.5px] text-slate-400 font-semibold italic leading-normal">
                          * Pre-fills the TDS % field on new entries (usually 5% in India).
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex justify-end">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-lg transition-colors cursor-pointer"
                      >
                        Save Calculation Rules
                      </button>
                    </div>
                  </form>
                </div>

                {/* SQL Migration Assistant for Supabase */}
                {isSupabaseConfigured && (
                  <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                      <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider">Supabase database migration</h3>
                    </div>
                    <div className="p-6 space-y-4">
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Execute this SQL block in your <strong>Supabase SQL Editor</strong> to create the <code>commission_entries</code> table with proper policies and columns:
                      </p>
                      
                      <div className="relative">
                        <pre className="bg-slate-900 text-slate-100 text-[10px] p-4 rounded-lg overflow-x-auto font-mono leading-relaxed select-all">
{`-- 1. Create the table if it does not exist
CREATE TABLE IF NOT EXISTS commission_entries (
  id TEXT PRIMARY KEY,
  project_name TEXT NOT NULL,
  person_name TEXT NOT NULL,
  role TEXT NOT NULL,
  sale_value NUMERIC NOT NULL,
  calc_type TEXT NOT NULL,
  rate_or_amount NUMERIC NOT NULL,
  has_gst BOOLEAN NOT NULL DEFAULT FALSE,
  gst_percentage NUMERIC NOT NULL DEFAULT 18,
  tds_percentage NUMERIC NOT NULL DEFAULT 5,
  payment_status TEXT NOT NULL,
  payment_date TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE commission_entries ENABLE ROW LEVEL SECURITY;

-- 3. Create permissive policies for testing/prototype convenience (anon & authenticated users)
DROP POLICY IF EXISTS "Allow anon select" ON commission_entries;
DROP POLICY IF EXISTS "Allow anon insert" ON commission_entries;
DROP POLICY IF EXISTS "Allow anon update" ON commission_entries;
DROP POLICY IF EXISTS "Allow anon delete" ON commission_entries;
DROP POLICY IF EXISTS "Allow select for all" ON commission_entries;
DROP POLICY IF EXISTS "Allow insert for all" ON commission_entries;
DROP POLICY IF EXISTS "Allow update for all" ON commission_entries;
DROP POLICY IF EXISTS "Allow delete for all" ON commission_entries;

CREATE POLICY "Allow select for all" ON commission_entries FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow insert for all" ON commission_entries FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow update for all" ON commission_entries FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete for all" ON commission_entries FOR DELETE TO anon, authenticated USING (true);
`}
                        </pre>
                      </div>

                      <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg flex gap-2.5 items-start">
                        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <p className="text-[10px] text-blue-700 font-medium leading-normal">
                          This code handles complete table creation and Row Level Security permissions so the front-end can load, save, and delete entries seamlessly.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}
          </>
        )}
      </main>

      {/* SCREEN 4: ADD / EDIT COMMISSION ENTRY (MODAL POPUP) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 overflow-y-auto backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-xl border border-slate-200 overflow-hidden my-8">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider">
                  {editingId ? 'Edit Commission Entry' : 'Add Commission Entry'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Modal Error Display */}
            {formError && (
              <div className="mx-5 mt-4 p-3.5 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs flex gap-2 items-start font-medium">
                <AlertCircle className="w-4.5 h-4.5 text-red-500 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            {/* Modal Form */}
            <form onSubmit={handleSave} className="p-5 space-y-4">
              
              {/* Project Name & Stakeholder Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Project Name */}
                <div className="space-y-1">
                  <label htmlFor="form-project" className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                    Project Name
                  </label>
                  <input
                    id="form-project"
                    type="text"
                    list="existing-projects-list"
                    placeholder="Enter or choose project..."
                    value={formProject}
                    onChange={(e) => setFormProject(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-600 text-slate-800 font-semibold"
                  />
                  <datalist id="existing-projects-list">
                    {uniqueProjects.map(p => (
                      <option key={p} value={p} />
                    ))}
                  </datalist>
                </div>

                {/* Person Name */}
                <div className="space-y-1">
                  <label htmlFor="form-person" className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                    Person Name
                  </label>
                  <input
                    id="form-person"
                    type="text"
                    placeholder="e.g., Jane Smith"
                    value={formPerson}
                    onChange={(e) => setFormPerson(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-600 text-slate-800 font-semibold"
                  />
                </div>
              </div>

              {/* Stakeholder Role & Sale Value */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Role */}
                <div className="space-y-1">
                  <label htmlFor="form-role" className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                    Stakeholder Role
                  </label>
                  <select
                    id="form-role"
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as RoleType)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-600 text-slate-800 font-semibold cursor-pointer"
                  >
                    <option value="Broker">Broker</option>
                    <option value="Channel Partner">Channel Partner</option>
                    <option value="Sales Executive">Sales Executive</option>
                    <option value="Consultant">Consultant</option>
                    <option value="Agent">Agent</option>
                  </select>
                </div>

                {/* Sale Value (₹) */}
                <div className="space-y-1">
                  <label htmlFor="form-sale" className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                    Sale Value (₹)
                  </label>
                  <input
                    id="form-sale"
                    type="number"
                    placeholder="Total transaction value"
                    value={formSaleValue || ''}
                    onChange={(e) => setFormSaleValue(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-600 text-slate-800 font-bold"
                  />
                </div>
              </div>

              {/* Commission Calculation Rules */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-4">
                <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block border-l-2 border-blue-600 pl-1.5">
                  Commission calculation rules
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Calculation Mode Radio Buttons */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                      Calculation Type
                    </span>
                    <div className="flex gap-4">
                      <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 font-bold cursor-pointer">
                        <input
                          type="radio"
                          name="calcType"
                          value="percentage"
                          checked={formCalcType === 'percentage'}
                          onChange={() => setFormCalcType('percentage')}
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                        />
                        Percentage %
                      </label>
                      <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 font-bold cursor-pointer">
                        <input
                          type="radio"
                          name="calcType"
                          value="fixed"
                          checked={formCalcType === 'fixed'}
                          onChange={() => setFormCalcType('fixed')}
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                        />
                        Fixed Amount
                      </label>
                    </div>
                  </div>

                  {/* Rate / Amount field depending on choice */}
                  <div className="space-y-1">
                    <label htmlFor="form-rate" className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                      {formCalcType === 'percentage' ? 'Commission Rate (%)' : 'Commission Amount (₹)'}
                    </label>
                    <input
                      id="form-rate"
                      type="number"
                      step={formCalcType === 'percentage' ? '0.01' : '1'}
                      placeholder={formCalcType === 'percentage' ? 'e.g., 2.5' : 'e.g., 100000'}
                      value={formRateOrAmount || ''}
                      onChange={(e) => setFormRateOrAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-600 text-slate-800 font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* GST & TDS Configuration Blocks */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-4">
                <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block border-l-2 border-indigo-600 pl-1.5">
                  Taxes & Deductions
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* GST Selector & input */}
                  <div className="space-y-2 bg-white p-3 rounded-lg border border-slate-150">
                    <div className="flex items-center justify-between">
                      <label htmlFor="form-has-gst" className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                        Add GST?
                      </label>
                      <button
                        id="form-has-gst"
                        type="button"
                        role="switch"
                        aria-checked={formHasGst}
                        onClick={() => {
                          setFormHasGst(!formHasGst);
                          if (!formHasGst && formGstPercentage === 0) {
                            setFormGstPercentage(defaultGst || 18);
                          }
                        }}
                        className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                          formHasGst ? 'bg-blue-600' : 'bg-slate-200'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                            formHasGst ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {formHasGst && (
                      <div className="space-y-1 pt-1.5">
                        <label htmlFor="form-gst-percentage" className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block">
                          GST (%)
                        </label>
                        <div className="relative">
                          <input
                            id="form-gst-percentage"
                            type="number"
                            step="0.1"
                            placeholder="18"
                            value={formGstPercentage || ''}
                            onChange={(e) => setFormGstPercentage(Math.max(0, parseFloat(e.target.value) || 0))}
                            className="w-full px-2 py-1 text-xs rounded-md border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden text-slate-800 font-bold"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                        </div>
                      </div>
                    )}
                    <p className="text-[9.5px] text-slate-400 font-semibold leading-normal pt-1.5">
                      GST is added on top of the commission amount, if applicable.
                    </p>
                  </div>

                  {/* TDS input */}
                  <div className="space-y-2 bg-white p-3 rounded-lg border border-slate-150">
                    <div className="space-y-1">
                      <label htmlFor="form-tds-percentage" className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                        TDS (%)
                      </label>
                      <div className="relative">
                        <input
                          id="form-tds-percentage"
                          type="number"
                          step="0.1"
                          placeholder="5"
                          value={formTdsPercentage === 0 ? '0' : (formTdsPercentage || '')}
                          onChange={(e) => setFormTdsPercentage(Math.max(0, parseFloat(e.target.value) || 0))}
                          className="w-full px-2 py-1 text-xs rounded-md border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden text-slate-800 font-bold"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                      </div>
                    </div>
                    <p className="text-[9.5px] text-slate-400 font-semibold leading-normal pt-1">
                      TDS is deducted from the commission amount before payment — most commissions in India have 5% TDS.
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Payment status */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                    Payment Status
                  </span>
                  <div className="flex gap-4 py-1">
                    <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 font-bold cursor-pointer">
                      <input
                        type="radio"
                        name="payStatus"
                        value="Pending"
                        checked={formPaymentStatus === 'Pending'}
                        onChange={() => setFormPaymentStatus('Pending')}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                      />
                      Pending
                    </label>
                    <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 font-bold cursor-pointer">
                      <input
                        type="radio"
                        name="payStatus"
                        value="Paid"
                        checked={formPaymentStatus === 'Paid'}
                        onChange={() => setFormPaymentStatus('Paid')}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                      />
                      Paid
                    </label>
                  </div>
                </div>

                {/* Payment Date */}
                {formPaymentStatus === 'Paid' && (
                  <div className="space-y-1">
                    <label htmlFor="form-paydate" className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                      Payment Date
                    </label>
                    <input
                      id="form-paydate"
                      type="date"
                      value={formPaymentDate}
                      onChange={(e) => setFormPaymentDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-600 text-slate-800 font-bold cursor-pointer"
                    />
                  </div>
                )}
              </div>

              {/* LIVE LINE-BY-LINE CALCULATION SUMMARY */}
              <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl space-y-2">
                <span className="text-[10px] font-extrabold text-blue-700 uppercase tracking-widest block border-l-2 border-blue-600 pl-1.5">
                  Live Payout Breakdown
                </span>

                <div className="font-mono text-xs text-slate-700 space-y-1.5 pt-1">
                  <div className="flex justify-between">
                    <span>Commission Amount:</span>
                    <span className="font-bold">{formatCurrency(liveBreakdown.baseCommission)}</span>
                  </div>
                  {formHasGst && (
                    <div className="flex justify-between text-emerald-700 font-medium">
                      <span>+ GST ({formGstPercentage}%):</span>
                      <span>+{formatCurrency(liveBreakdown.gstAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-red-700 font-medium border-b border-slate-200 pb-2">
                    <span>− TDS ({formTdsPercentage}%):</span>
                    <span>−{formatCurrency(liveBreakdown.tdsAmount)}</span>
                  </div>
                  <div className="flex justify-between text-blue-700 font-black text-sm pt-1.5">
                    <span>Final Amount to Pay:</span>
                    <span>{formatCurrency(liveBreakdown.finalAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 text-xs font-extrabold rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveLoading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {saveLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  {editingId ? 'Update Entry' : 'Register Commission Entry'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pt-6 border-t border-slate-200">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
            &copy; 2026 Commission ledger. All rights reserved.
          </p>
          <div className="flex gap-4">
            <span className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">Built with Precision</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
