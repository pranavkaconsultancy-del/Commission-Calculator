import React, { useState } from 'react';
import { 
  Users, Plus, Search, Eye, Edit2, Trash2, X, Briefcase, Mail, Phone, MapPin, 
  CreditCard, FileDown, TrendingUp, CheckCircle, AlertCircle, RefreshCw, Coins
} from 'lucide-react';
import { Broker, Sale, Commission, Payment } from '../types';
import { formatCurrency, formatNumber } from '../utils';
import { generateBrokerStatementPDF } from '../exportUtils';

interface BrokersViewProps {
  brokers: Broker[];
  sales: Sale[];
  commissions: Commission[];
  payments: Payment[];
  onSaveBroker: (broker: Broker) => Promise<void>;
  onDeleteBroker: (id: string) => Promise<void>;
  userRole: string;
  userEmail: string;
  darkMode: boolean;
  companyName: string;
}

export function BrokersView({ 
  brokers, sales, commissions, payments, onSaveBroker, onDeleteBroker, 
  userRole, userEmail, darkMode, companyName 
}: BrokersViewProps) {
  // Navigation states
  const [activeSubView, setActiveSubView] = useState<'list' | 'profile' | 'ledger'>('list');
  const [selectedBroker, setSelectedBroker] = useState<Broker | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Active' | 'Inactive'>('ALL');

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [editingBroker, setEditingBroker] = useState<Broker | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formMobile, setFormMobile] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formPan, setFormPan] = useState('');
  const [formGst, setFormGst] = useState('');
  const [formBankName, setFormBankName] = useState('');
  const [formBankAcc, setFormBankAcc] = useState('');
  const [formBankIfsc, setFormBankIfsc] = useState('');
  const [formCommType, setFormCommType] = useState<'Fixed' | 'Percentage' | 'Fixed+Percentage'>('Percentage');
  const [formCommAmount, setFormCommAmount] = useState<number>(0);
  const [formCommPercent, setFormCommPercent] = useState<number>(2.0);
  const [formGstPercent, setFormGstPercent] = useState<number>(18);
  const [formTdsPercent, setFormTdsPercent] = useState<number>(5);
  const [formStatus, setFormStatus] = useState<'Active' | 'Inactive'>('Active');

  // Table pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // 1. FILTERED BROKERS
  // If user role is Broker, they can ONLY view their own broker details
  const myBrokerEmail = userRole === 'Broker' ? userEmail : '';
  const accessibleBrokers = brokers.filter(b => {
    if (myBrokerEmail) {
      return b.email.toLowerCase() === myBrokerEmail.toLowerCase();
    }
    return true;
  });

  const filteredBrokers = accessibleBrokers.filter(b => {
    const matchesSearch = b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          b.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          b.mobile.includes(searchQuery) ||
                          b.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const paginatedBrokers = filteredBrokers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredBrokers.length / itemsPerPage) || 1;

  // 2. OPEN ADD/EDIT FORM
  const openNewModal = () => {
    setEditingBroker(null);
    setFormName('');
    setFormMobile('');
    setFormEmail('');
    setFormAddress('');
    setFormPan('');
    setFormGst('');
    setFormBankName('');
    setFormBankAcc('');
    setFormBankIfsc('');
    setFormCommType('Percentage');
    setFormCommAmount(0);
    setFormCommPercent(2.0);
    setFormGstPercent(18);
    setFormTdsPercent(5);
    setFormStatus('Active');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (b: Broker) => {
    setEditingBroker(b);
    setFormName(b.name);
    setFormMobile(b.mobile);
    setFormEmail(b.email);
    setFormAddress(b.address);
    setFormPan(b.pan_number);
    setFormGst(b.gst_number);
    setFormBankName(b.bank_account_name);
    setFormBankAcc(b.bank_account_number);
    setFormBankIfsc(b.bank_ifsc);
    setFormCommType(b.commission_type);
    setFormCommAmount(b.commission_amount);
    setFormCommPercent(b.commission_percentage);
    setFormGstPercent(b.gst_percentage);
    setFormTdsPercent(b.tds_percentage);
    setFormStatus(b.status);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Broker Name is required');
      return;
    }
    if (!formMobile.trim()) {
      setFormError('Mobile Number is required');
      return;
    }
    if (!formEmail.trim()) {
      setFormError('Email Address is required');
      return;
    }

    setSaveLoading(true);
    setFormError(null);

    // Generate BRK ID
    let finalId = '';
    if (editingBroker) {
      finalId = editingBroker.id;
    } else {
      // Find highest BRK-XXXX number
      const ids = brokers.map(b => parseInt(b.id.replace('BRK-', ''))).filter(n => !isNaN(n));
      const highest = ids.length > 0 ? Math.max(...ids) : 0;
      finalId = `BRK-${String(highest + 1).padStart(4, '0')}`;
    }

    const savedBroker: Broker = {
      id: finalId,
      name: formName.trim(),
      mobile: formMobile.trim(),
      email: formEmail.trim(),
      address: formAddress.trim(),
      pan_number: formPan.trim().toUpperCase(),
      gst_number: formGst.trim().toUpperCase(),
      bank_account_name: formBankName.trim() || formName.trim(),
      bank_account_number: formBankAcc.trim(),
      bank_ifsc: formBankIfsc.trim().toUpperCase(),
      commission_type: formCommType,
      commission_amount: formCommAmount,
      commission_percentage: formCommPercent,
      gst_percentage: formGstPercent,
      tds_percentage: formTdsPercent,
      status: formStatus,
      created_at: editingBroker?.created_at || new Date().toISOString()
    };

    try {
      await onSaveBroker(savedBroker);
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save Broker');
    } finally {
      setSaveLoading(false);
    }
  };

  // --- STATS COMPILER FOR SPECIFIC BROKER PROFILE ---
  const getBrokerProfileStats = (brokerId: string) => {
    const brokerSales = sales.filter(s => s.broker_id === brokerId);
    const brokerCommissions = commissions.filter(c => c.broker_id === brokerId);

    const totalSalesValue = brokerSales.reduce((sum, s) => sum + s.sale_amount, 0);
    const totalFlatsSold = brokerSales.length;
    const grossEarned = brokerSales.reduce((sum, s) => sum + s.gross_commission, 0);
    const gstDeductions = brokerSales.reduce((sum, s) => sum + s.gst_amount, 0);
    const tdsDeductions = brokerSales.reduce((sum, s) => sum + s.tds_amount, 0);
    
    const paidCommission = brokerCommissions.reduce((sum, c) => sum + c.paid_amount, 0);
    const pendingCommission = brokerCommissions.reduce((sum, c) => sum + c.pending_amount, 0);

    const lastSale = brokerSales.length > 0 
      ? brokerSales.reduce((max, s) => s.booking_date > max ? s.booking_date : max, '') 
      : 'N/A';

    return {
      totalSalesValue,
      totalFlatsSold,
      grossEarned,
      gstDeductions,
      tdsDeductions,
      paidCommission,
      pendingCommission,
      lastSale
    };
  };

  // --- RUNNING STATEMENT LEDGER MATRIX ---
  const getRunningLedger = (brokerId: string) => {
    const brokerSales = sales.filter(s => s.broker_id === brokerId);
    
    // Create ledger events: sales (credits) & payments (debits)
    interface LedgerRow {
      date: string;
      refId: string;
      type: 'Sale Payout' | 'Payment Received';
      details: string;
      amount: number;
    }

    const rows: LedgerRow[] = [];

    brokerSales.forEach(s => {
      rows.push({
        date: s.booking_date,
        refId: s.id,
        type: 'Sale Payout',
        details: `${s.project_name || 'Project'} Flat ${s.flat_number || 'N/A'} (Customer: ${s.customer_name || 'N/A'})`,
        amount: s.net_commission // Gross commission minus deductions is credited
      });
    });

    const brokerCommissions = commissions.filter(c => c.broker_id === brokerId);
    const commIds = brokerCommissions.map(c => c.id);
    const brokerPayments = payments.filter(p => commIds.includes(p.commission_id));

    brokerPayments.forEach(p => {
      rows.push({
        date: p.payment_date,
        refId: p.reference_number || p.id,
        type: 'Payment Received',
        details: `Payout via ${p.payment_mode} - Ref: ${p.reference_number || 'N/A'}`,
        amount: -p.amount // Debited
      });
    });

    // Sort by date ascending
    rows.sort((a, b) => a.date.localeCompare(b.date));

    // Calculate running balance
    let balance = 0;
    const ledgerWithBalance = rows.map(r => {
      // credit increases balance (outstanding amount broker should receive)
      // debit decreases balance
      balance += r.amount;
      return {
        ...r,
        runningBalance: balance
      };
    });

    return ledgerWithBalance;
  };

  // Trigger professional PDF statement
  const downloadPDFStatement = (broker: Broker) => {
    const brokerSales = sales.filter(s => s.broker_id === broker.id);
    generateBrokerStatementPDF(companyName, broker, brokerSales);
  };

  return (
    <div className="space-y-6">
      {/* 1. LIST VIEW */}
      {activeSubView === 'list' && (
        <div className={`p-6 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Broker Directory
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-500">Manage real estate brokers, channel partners, and payout commission percentages.</p>
            </div>
            {userRole !== 'Broker' && (
              <button
                onClick={openNewModal}
                className="flex items-center gap-1 px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow transition-colors"
                id="add-broker-btn"
              >
                <Plus className="w-4 h-4" /> Add Broker
              </button>
            )}
          </div>

          {/* Search and Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search brokers by ID, name, email or phone..."
                className={`w-full pl-9 pr-4 py-2 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                  darkMode ? 'bg-slate-900 border-slate-700 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500'
                }`}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e: any) => setStatusFilter(e.target.value)}
              className={`px-3 py-2 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <option value="ALL">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* Brokers Table */}
          <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className={`${darkMode ? 'bg-slate-900 text-slate-400' : 'bg-slate-50 text-slate-500'} font-bold`}>
                  <th className="p-3">Broker ID</th>
                  <th className="p-3">Broker Details</th>
                  <th className="p-3">Setup</th>
                  <th className="p-3">Taxes</th>
                  <th className="p-3">Performance</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {paginatedBrokers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">No Brokers found</td>
                  </tr>
                ) : (
                  paginatedBrokers.map(b => {
                    const stats = getBrokerProfileStats(b.id);
                    return (
                      <tr key={b.id} className={`hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors`}>
                        <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400">{b.id}</td>
                        <td className="p-3">
                          <div className="font-bold">{b.name}</div>
                          <div className="text-[10px] text-slate-400">{b.mobile}  •  {b.email}</div>
                          <div className="text-[10px] text-slate-400 max-w-xs truncate">{b.address}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-semibold">{b.commission_type}</div>
                          {b.commission_type !== 'Fixed' && <div className="text-[10px] text-slate-500">Comm Rate: {b.commission_percentage}%</div>}
                          {b.commission_type !== 'Percentage' && <div className="text-[10px] text-slate-500">Fixed: {formatCurrency(b.commission_amount)}</div>}
                        </td>
                        <td className="p-3">
                          <div>GST: {b.gst_percentage}%</div>
                          <div>TDS: {b.tds_percentage}%</div>
                        </td>
                        <td className="p-3">
                          <div className="font-semibold">{stats.totalFlatsSold} flats sold</div>
                          <div className="text-[10px] text-emerald-600 font-bold">{formatNumber(stats.totalSalesValue)} value</div>
                        </td>
                        <td className="p-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            b.status === 'Active' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                          }`}>
                            {b.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => { setSelectedBroker(b); setActiveSubView('profile'); }}
                              className="p-1 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded transition-colors"
                              title="View Performance Profile"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => { setSelectedBroker(b); setActiveSubView('ledger'); }}
                              className="p-1 text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 rounded transition-colors"
                              title="View Account Ledger"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                            {userRole !== 'Broker' && (
                              <button
                                onClick={() => openEditModal(b)}
                                className="p-1 text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 rounded transition-colors"
                                title="Edit Details"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            )}
                            {userRole === 'Super Admin' && (
                              <button
                                onClick={() => { if (confirm('Are you sure you want to delete this broker?')) onDeleteBroker(b.id); }}
                                className="p-1 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded transition-colors"
                                title="Delete Broker"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-4 text-xs text-slate-500">
              <p>Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredBrokers.length)} of {filteredBrokers.length} entries</p>
              <div className="flex gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. PROFILE VIEW (PERFORMANCE SUMMARY) */}
      {activeSubView === 'profile' && selectedBroker && (() => {
        const stats = getBrokerProfileStats(selectedBroker.id);
        const brokerSales = sales.filter(s => s.broker_id === selectedBroker.id);
        return (
          <div className="space-y-6">
            <div className={`p-6 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <button 
                    onClick={() => { setActiveSubView('list'); setSelectedBroker(null); }}
                    className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline mb-1 flex items-center gap-1"
                  >
                    ← Back to List
                  </button>
                  <h2 className="text-xl font-black mt-0.5 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-blue-600" />
                    {selectedBroker.name} Performance Profile
                  </h2>
                  <p className="text-xs text-slate-400">Deep performance metrics, flat bookings, tax breakdown, and running ledger indicators.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => downloadPDFStatement(selectedBroker)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors shadow"
                  >
                    <FileDown className="w-3.5 h-3.5" /> Generate PDF Statement
                  </button>
                  <button
                    onClick={() => setActiveSubView('ledger')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> View Ledger Account
                  </button>
                </div>
              </div>

              {/* Personal Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-xs">
                <div className="space-y-2">
                  <h4 className="font-extrabold uppercase tracking-wider text-slate-400">Contact Details</h4>
                  <p className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" /> {selectedBroker.mobile}</p>
                  <p className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-400" /> {selectedBroker.email}</p>
                  <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {selectedBroker.address || 'No address logged'}</p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-extrabold uppercase tracking-wider text-slate-400">Government Identity</h4>
                  <p><strong>PAN Number:</strong> {selectedBroker.pan_number || 'N/A'}</p>
                  <p><strong>GST Number:</strong> {selectedBroker.gst_number || 'N/A'}</p>
                  <p><strong>Active Status:</strong> <span className={`font-bold ${selectedBroker.status === 'Active' ? 'text-emerald-500' : 'text-rose-500'}`}>{selectedBroker.status}</span></p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-extrabold uppercase tracking-wider text-slate-400">Bank & Commission</h4>
                  <p className="flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5 text-slate-400" /> {selectedBroker.bank_account_number || 'N/A'} ({selectedBroker.bank_ifsc || 'IFSC N/A'})</p>
                  <p><strong>Acc Holder Name:</strong> {selectedBroker.bank_account_name || selectedBroker.name}</p>
                  <p><strong>Payout Rate:</strong> {selectedBroker.commission_type} {selectedBroker.commission_type !== 'Fixed' ? `(${selectedBroker.commission_percentage}%)` : ''}</p>
                </div>
              </div>

              {/* Performance Metrics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                  <TrendingUp className="w-6 h-6 mx-auto text-blue-600 mb-1" />
                  <p className="text-[10px] uppercase font-bold text-slate-400">Flats Booked</p>
                  <h3 className="text-xl font-black">{stats.totalFlatsSold} Flats</h3>
                  <p className="text-[9px] text-slate-400 mt-0.5">Last booking: {stats.lastSale}</p>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                  <CheckCircle className="w-6 h-6 mx-auto text-emerald-600 mb-1" />
                  <p className="text-[10px] uppercase font-bold text-slate-400">Sales Value</p>
                  <h3 className="text-xl font-black text-emerald-600">{formatCurrency(stats.totalSalesValue)}</h3>
                  <p className="text-[9px] text-slate-400 mt-0.5">Gross earned: {formatCurrency(stats.grossEarned)}</p>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                  <AlertCircle className="w-6 h-6 mx-auto text-rose-600 mb-1" />
                  <p className="text-[10px] uppercase font-bold text-slate-400">GST/TDS Deducted</p>
                  <h3 className="text-xl font-black text-rose-600">{formatCurrency(stats.gstDeductions + stats.tdsDeductions)}</h3>
                  <p className="text-[9px] text-slate-400 mt-0.5">GST: {formatCurrency(stats.gstDeductions)} | TDS: {formatCurrency(stats.tdsDeductions)}</p>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                  <Coins className="w-6 h-6 mx-auto text-purple-600 mb-1" />
                  <p className="text-[10px] uppercase font-bold text-slate-400">Cleared vs Pending</p>
                  <h3 className="text-xl font-black text-purple-600">{formatCurrency(stats.paidCommission)}</h3>
                  <p className="text-[9px] text-amber-500 font-bold mt-0.5">Pending Balance: {formatCurrency(stats.pendingCommission)}</p>
                </div>
              </div>

              {/* Detailed Sales log under profile */}
              <h3 className="text-sm font-bold uppercase mt-8 mb-4 text-slate-400">Historical Sales Listings</h3>
              <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={`${darkMode ? 'bg-slate-900 text-slate-400' : 'bg-slate-50 text-slate-500'} font-bold`}>
                      <th className="p-3">Booking Date</th>
                      <th className="p-3">Property Location</th>
                      <th className="p-3">Customer details</th>
                      <th className="p-3 text-right">Sale Amount</th>
                      <th className="p-3 text-right">Gross Comm.</th>
                      <th className="p-3 text-right">GST</th>
                      <th className="p-3 text-right">TDS</th>
                      <th className="p-3 text-right">Net Comm.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {brokerSales.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-4 text-center text-slate-400">No Sales Booked yet</td>
                      </tr>
                    ) : (
                      brokerSales.map(s => (
                        <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                          <td className="p-3">{s.booking_date}</td>
                          <td className="p-3 font-semibold">{s.project_name} - Flat {s.flat_number}</td>
                          <td className="p-3">
                            <div>{s.customer_name}</div>
                            <div className="text-[10px] text-slate-400">{s.customer_mobile}</div>
                          </td>
                          <td className="p-3 text-right">{formatCurrency(s.sale_amount)}</td>
                          <td className="p-3 text-right">{formatCurrency(s.gross_commission)}</td>
                          <td className="p-3 text-right">{formatCurrency(s.gst_amount)}</td>
                          <td className="p-3 text-right">{formatCurrency(s.tds_amount)}</td>
                          <td className="p-3 text-right font-bold text-emerald-600">{formatCurrency(s.net_commission)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 3. RUNNING STATEMENT LEDGER */}
      {activeSubView === 'ledger' && selectedBroker && (() => {
        const ledgerRows = getRunningLedger(selectedBroker.id);
        const latestBalance = ledgerRows.length > 0 ? ledgerRows[ledgerRows.length - 1].runningBalance : 0;
        return (
          <div className="space-y-6">
            <div className={`p-6 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <button 
                    onClick={() => { setActiveSubView('profile'); }}
                    className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline mb-1 flex items-center gap-1"
                  >
                    ← Back to Performance Profile
                  </button>
                  <h2 className="text-xl font-black mt-0.5 flex items-center gap-2">
                    <RefreshCw className="w-5 h-5 text-emerald-600" />
                    Running Account Ledger (Statement)
                  </h2>
                  <p className="text-xs text-slate-400">Statement of transactions detailing credits (earnings) and debits (disbursed payments) in chronological order.</p>
                </div>
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  <p className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Broker Balance Outstanding</p>
                  <h3 className="text-lg font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(latestBalance)}</h3>
                </div>
              </div>

              {/* Ledger Table */}
              <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={`${darkMode ? 'bg-slate-900 text-slate-400' : 'bg-slate-50 text-slate-500'} font-bold`}>
                      <th className="p-3">Posting Date</th>
                      <th className="p-3">Transaction Reference</th>
                      <th className="p-3">Description</th>
                      <th className="p-3 text-right">Debit (Disbursal)</th>
                      <th className="p-3 text-right">Credit (Earnings)</th>
                      <th className="p-3 text-right">Outstanding Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {ledgerRows.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400">No account ledger entries found for this broker.</td>
                      </tr>
                    ) : (
                      ledgerRows.map((row, idx) => {
                        const isDebit = row.amount < 0;
                        return (
                          <tr key={`${row.refId}-${idx}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                            <td className="p-3">{row.date}</td>
                            <td className="p-3 font-mono text-slate-500 font-semibold">{row.refId}</td>
                            <td className="p-3">
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold mr-2 ${
                                isDebit ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                              }`}>
                                {row.type}
                              </span>
                              {row.details}
                            </td>
                            <td className="p-3 text-right text-amber-600 font-bold">
                              {isDebit ? formatCurrency(Math.abs(row.amount)) : ''}
                            </td>
                            <td className="p-3 text-right text-blue-600 font-bold">
                              {!isDebit ? formatCurrency(row.amount) : ''}
                            </td>
                            <td className="p-3 text-right font-black text-slate-800 dark:text-slate-100">
                              {formatCurrency(row.runningBalance)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* --- BROKER ADD/EDIT MODAL FORM --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border text-xs flex flex-col max-h-[90vh] ${
            darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/30">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider">{editingBroker ? 'Edit Broker Details' : 'Register New Broker'}</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Define contact, KYC pan/gst, banking records, and standard payout structures.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 rounded-lg flex items-center gap-2 border border-rose-200 dark:border-rose-800">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="font-semibold">{formError}</span>
                </div>
              )}

              {/* Section 1: Personal Details */}
              <div className="space-y-3">
                <h4 className="font-extrabold uppercase tracking-widest text-blue-600 dark:text-blue-400 border-b pb-1">1. Personal & Contact Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-400">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g. Rajesh Sharma"
                      className={`w-full p-2 rounded-lg border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                        darkMode ? 'bg-slate-900 border-slate-700 focus:border-blue-500 text-white' : 'bg-slate-50 border-slate-200 focus:border-blue-500 text-slate-800'
                      }`}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-400">Mobile Number *</label>
                    <input
                      type="text"
                      required
                      value={formMobile}
                      onChange={(e) => setFormMobile(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className={`w-full p-2 rounded-lg border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                        darkMode ? 'bg-slate-900 border-slate-700 focus:border-blue-500 text-white' : 'bg-slate-50 border-slate-200 focus:border-blue-500 text-slate-800'
                      }`}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-400">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="e.g. rajesh@gmail.com"
                      className={`w-full p-2 rounded-lg border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                        darkMode ? 'bg-slate-900 border-slate-700 focus:border-blue-500 text-white' : 'bg-slate-50 border-slate-200 focus:border-blue-500 text-slate-800'
                      }`}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-400">Office / Residential Address</label>
                  <input
                    type="text"
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    placeholder="e.g. Flat 104, Blue Sea Heights, Worli"
                    className={`w-full p-2 rounded-lg border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                      darkMode ? 'bg-slate-900 border-slate-700 focus:border-blue-500 text-white' : 'bg-slate-50 border-slate-200 focus:border-blue-500 text-slate-800'
                    }`}
                  />
                </div>
              </div>

              {/* Section 2: KYC Information */}
              <div className="space-y-3">
                <h4 className="font-extrabold uppercase tracking-widest text-blue-600 dark:text-blue-400 border-b pb-1">2. Tax & KYC Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-400">PAN Number (Permanent Account Number)</label>
                    <input
                      type="text"
                      maxLength={10}
                      value={formPan}
                      onChange={(e) => setFormPan(e.target.value)}
                      placeholder="e.g. ABCPD1234F"
                      className={`w-full p-2 rounded-lg border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                        darkMode ? 'bg-slate-900 border-slate-700 focus:border-blue-500 text-white' : 'bg-slate-50 border-slate-200 focus:border-blue-500 text-slate-800'
                      }`}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-400">GST Registration Number</label>
                    <input
                      type="text"
                      maxLength={15}
                      value={formGst}
                      onChange={(e) => setFormGst(e.target.value)}
                      placeholder="e.g. 27ABCPD1234F1Z5"
                      className={`w-full p-2 rounded-lg border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                        darkMode ? 'bg-slate-900 border-slate-700 focus:border-blue-500 text-white' : 'bg-slate-50 border-slate-200 focus:border-blue-500 text-slate-800'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Bank Account */}
              <div className="space-y-3">
                <h4 className="font-extrabold uppercase tracking-widest text-blue-600 dark:text-blue-400 border-b pb-1">3. Bank Disbursal Account</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-400">Bank Account Name</label>
                    <input
                      type="text"
                      value={formBankName}
                      onChange={(e) => setFormBankName(e.target.value)}
                      placeholder="As printed in passbook"
                      className={`w-full p-2 rounded-lg border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                        darkMode ? 'bg-slate-900 border-slate-700 focus:border-blue-500 text-white' : 'bg-slate-50 border-slate-200 focus:border-blue-500 text-slate-800'
                      }`}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-400">Bank Account Number</label>
                    <input
                      type="text"
                      value={formBankAcc}
                      onChange={(e) => setFormBankAcc(e.target.value)}
                      placeholder="e.g. 50100412345"
                      className={`w-full p-2 rounded-lg border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                        darkMode ? 'bg-slate-900 border-slate-700 focus:border-blue-500 text-white' : 'bg-slate-50 border-slate-200 focus:border-blue-500 text-slate-800'
                      }`}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-400">IFSC Code (11 alphanumeric)</label>
                    <input
                      type="text"
                      maxLength={11}
                      value={formBankIfsc}
                      onChange={(e) => setFormBankIfsc(e.target.value)}
                      placeholder="e.g. HDFC0000060"
                      className={`w-full p-2 rounded-lg border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                        darkMode ? 'bg-slate-900 border-slate-700 focus:border-blue-500 text-white' : 'bg-slate-50 border-slate-200 focus:border-blue-500 text-slate-800'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Commission Policy & Status */}
              <div className="space-y-3">
                <h4 className="font-extrabold uppercase tracking-widest text-blue-600 dark:text-blue-400 border-b pb-1">4. Payout Structure & Status</h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-400">Commission Scheme *</label>
                    <select
                      value={formCommType}
                      onChange={(e: any) => setFormCommType(e.target.value)}
                      className={`w-full p-2 rounded-lg border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                        darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      <option value="Percentage">Percentage Only</option>
                      <option value="Fixed">Fixed Amount Only</option>
                      <option value="Fixed+Percentage">Fixed + Percentage Both</option>
                    </select>
                  </div>

                  {formCommType !== 'Percentage' && (
                    <div className="space-y-1">
                      <label className="font-bold text-slate-400">Commission Amount (₹) *</label>
                      <input
                        type="number"
                        min={0}
                        required
                        value={formCommAmount}
                        onChange={(e) => setFormCommAmount(Number(e.target.value))}
                        className={`w-full p-2 rounded-lg border focus:outline-none ${
                          darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}
                      />
                    </div>
                  )}

                  {formCommType !== 'Fixed' && (
                    <div className="space-y-1">
                      <label className="font-bold text-slate-400">Commission Rate (%) *</label>
                      <input
                        type="number"
                        step={0.01}
                        min={0}
                        max={100}
                        required
                        value={formCommPercent}
                        onChange={(e) => setFormCommPercent(Number(e.target.value))}
                        className={`w-full p-2 rounded-lg border focus:outline-none ${
                          darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}
                      />
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="font-bold text-slate-400">Standard GST (%)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={formGstPercent}
                      onChange={(e) => setFormGstPercent(Number(e.target.value))}
                      className={`w-full p-2 rounded-lg border focus:outline-none ${
                        darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-400">Standard TDS (%)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={formTdsPercent}
                      onChange={(e) => setFormTdsPercent(Number(e.target.value))}
                      className={`w-full p-2 rounded-lg border focus:outline-none ${
                        darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-400">Status *</label>
                    <select
                      value={formStatus}
                      onChange={(e: any) => setFormStatus(e.target.value)}
                      className={`w-full p-2 rounded-lg border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                        darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>
            </form>

            {/* Footer buttons */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3 bg-slate-50/50 dark:bg-slate-900/30">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleSave}
                disabled={saveLoading}
                className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors font-bold flex items-center gap-1 shadow"
              >
                {saveLoading ? 'Saving...' : 'Save Broker'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
