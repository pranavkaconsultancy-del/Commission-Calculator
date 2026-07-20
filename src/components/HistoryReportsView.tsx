import React, { useState } from 'react';
import { 
  DollarSign, Search, Calendar, Filter, FileSpreadsheet, FileDown, Printer, Plus, 
  X, Check, AlertCircle, TrendingUp, Info, ChevronDown
} from 'lucide-react';
import { Sale, Commission, Payment, Broker, Project } from '../types';
import { formatCurrency, formatNumber } from '../utils';
import { exportToExcel, exportToPDF } from '../exportUtils';

interface HistoryReportsViewProps {
  sales: Sale[];
  commissions: Commission[];
  payments: Payment[];
  brokers: Broker[];
  projects: Project[];
  onAddPayment: (payment: Payment, updatedCommission: Commission) => Promise<void>;
  userRole: string;
  userEmail: string;
  darkMode: boolean;
}

export function HistoryReportsView({ 
  sales, commissions, payments, brokers, projects, onAddPayment, userRole, userEmail, darkMode 
}: HistoryReportsViewProps) {
  // Navigation
  const [activeTab, setActiveTab] = useState<'history' | 'reports'>('history');

  // Filters Bar State
  const [brokerFilter, setBrokerFilter] = useState('ALL');
  const [projectFilter, setProjectFilter] = useState('ALL');
  const [cityFilter, setCityFilter] = useState('ALL');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [targetCommission, setTargetCommission] = useState<Commission | null>(null);
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<'Bank Transfer' | 'UPI' | 'Cheque' | 'Cash'>('Bank Transfer');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // 1. EXTRACT UNIQUE CITIES FOR FILTER
  const uniqueCities = Array.from(new Set(projects.map(p => p.city)));

  // 2. MASTER FILTERING LOGIC
  // If user role is Broker, restrict viewing strictly to their own commissions
  const myBrokerId = userRole === 'Broker' 
    ? brokers.find(b => b.email.toLowerCase() === userEmail.toLowerCase())?.id || 'NO_MATCH'
    : '';

  const filteredSales = sales.filter(s => {
    // Role filter
    if (myBrokerId && s.broker_id !== myBrokerId) return false;

    // Broker dropdown filter
    if (brokerFilter !== 'ALL' && s.broker_id !== brokerFilter) return false;

    // Project dropdown filter
    if (projectFilter !== 'ALL' && s.project_name !== projectFilter) return false;

    // City dropdown filter (resolve project city)
    if (cityFilter !== 'ALL') {
      const proj = projects.find(p => p.name === s.project_name);
      if (!proj || proj.city !== cityFilter) return false;
    }

    // Date range filters
    if (startDate && s.booking_date < startDate) return false;
    if (endDate && s.booking_date > endDate) return false;

    // Search query: flat number, customer name, customer mobile, sale id
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesFlat = s.flat_number.toLowerCase().includes(query);
      const matchesCust = s.customer_name.toLowerCase().includes(query);
      const matchesCustMob = s.customer_mobile.includes(query);
      const matchesProj = s.project_name.toLowerCase().includes(query);
      if (!matchesFlat && !matchesCust && !matchesCustMob && !matchesProj) return false;
    }

    // Commission Payout Status filter
    if (paymentStatusFilter !== 'ALL') {
      const comm = commissions.find(c => c.sale_id === s.id);
      if (!comm || comm.status !== paymentStatusFilter) return false;
    }

    return true;
  });

  // Paginated Slice
  const paginatedSales = filteredSales.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredSales.length / itemsPerPage) || 1;

  // 3. TRIGGER RECORD PARTIAL PAYMENT MODAL
  const openPaymentModal = (sale: Sale) => {
    const comm = commissions.find(c => c.sale_id === sale.id);
    if (!comm) return;
    setTargetCommission(comm);
    setPaymentAmount(comm.pending_amount); // Default to full pending amount
    setPaymentRef('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentMode('Bank Transfer');
    setPaymentError(null);
    setIsPaymentModalOpen(true);
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetCommission) return;

    if (paymentAmount <= 0) {
      setPaymentError('Payment amount must be greater than ₹0');
      return;
    }
    if (paymentAmount > targetCommission.pending_amount) {
      setPaymentError(`Payment amount (₹${paymentAmount}) cannot exceed the pending balance (₹${targetCommission.pending_amount})`);
      return;
    }

    setPaymentLoading(true);
    setPaymentError(null);

    try {
      // Calculate new totals
      const updatedPaid = targetCommission.paid_amount + paymentAmount;
      const updatedPending = targetCommission.pending_amount - paymentAmount;
      
      let finalStatus: 'Pending' | 'Partially Paid' | 'Paid' = 'Partially Paid';
      if (updatedPending <= 0) {
        finalStatus = 'Paid';
      } else if (updatedPaid > 0) {
        finalStatus = 'Partially Paid';
      }

      const updatedCommission: Commission = {
        ...targetCommission,
        paid_amount: updatedPaid,
        pending_amount: updatedPending,
        status: finalStatus
      };

      const paymentRecord: Payment = {
        id: `PMT-${Math.floor(10000 + Math.random() * 90000)}`,
        commission_id: targetCommission.id,
        amount: paymentAmount,
        payment_date: paymentDate,
        payment_mode: paymentMode,
        reference_number: paymentRef.trim() || `TXN-${Math.floor(1000000 + Math.random() * 9000000)}`,
        created_at: new Date().toISOString()
      };

      await onAddPayment(paymentRecord, updatedCommission);
      setIsPaymentModalOpen(false);
    } catch (err: any) {
      setPaymentError(err.message || 'Failed to record payment');
    } finally {
      setPaymentLoading(false);
    }
  };

  // 5. CALCULATE TOTAL REVENUE & PAYOUTS OF THE FILTERED SET
  const summarySales = filteredSales.reduce((sum, s) => sum + s.sale_amount, 0);
  const summaryGross = filteredSales.reduce((sum, s) => sum + s.gross_commission, 0);
  const summaryNet = filteredSales.reduce((sum, s) => sum + s.net_commission, 0);
  const summaryPaid = filteredSales.reduce((sum, s) => {
    const comm = commissions.find(c => c.sale_id === s.id);
    return sum + (comm?.paid_amount || 0);
  }, 0);
  const summaryPending = filteredSales.reduce((sum, s) => {
    const comm = commissions.find(c => c.sale_id === s.id);
    return sum + (comm?.pending_amount || 0);
  }, 0);

  // 4. FINANCIAL EXPORTS
  const runExcelExport = () => {
    const headers = ['Booking Date', 'Broker ID', 'Broker Name', 'Project', 'Flat Number', 'Customer', 'Sale Amount (₹)', 'Gross Commission (₹)', 'GST (₹)', 'TDS (₹)', 'Net Commission (₹)', 'Paid (₹)', 'Pending (₹)', 'Status'];
    const rows = filteredSales.map(s => {
      const comm = commissions.find(c => c.sale_id === s.id);
      return [
        s.booking_date,
        s.broker_id,
        s.broker_name,
        s.project_name,
        s.flat_number,
        s.customer_name,
        s.sale_amount,
        s.gross_commission,
        s.gst_amount,
        s.tds_amount,
        s.net_commission,
        comm?.paid_amount || 0,
        comm?.pending_amount || 0,
        comm?.status || 'Pending'
      ];
    });

    const totals = {
      sales: summarySales,
      baseCommission: summaryGross,
      gstAmount: filteredSales.reduce((sum, s) => sum + s.gst_amount, 0),
      tdsAmount: filteredSales.reduce((sum, s) => sum + s.tds_amount, 0),
      finalAmount: summaryNet,
      paid: summaryPaid,
      pending: summaryPending
    };

    exportToExcel('Financial_Ledger_Report', headers, rows, totals);
  };

  const runPDFExport = () => {
    const headers = ['Booking Date', 'Broker Name', 'Property Location', 'Customer', 'Sale Amt', 'Net Comm', 'Paid', 'Pending', 'Status'];
    const rows = filteredSales.map(s => {
      const comm = commissions.find(c => c.sale_id === s.id);
      return [
        s.booking_date,
        s.broker_name,
        `${s.project_name} Flat ${s.flat_number}`,
        s.customer_name,
        formatNumber(s.sale_amount),
        formatNumber(s.net_commission),
        formatNumber(comm?.paid_amount || 0),
        formatNumber(comm?.pending_amount || 0),
        comm?.status || 'Pending'
      ];
    });

    const totals = {
      sales: summarySales,
      baseCommission: summaryGross,
      gstAmount: filteredSales.reduce((sum, s) => sum + s.gst_amount, 0),
      tdsAmount: filteredSales.reduce((sum, s) => sum + s.tds_amount, 0),
      finalAmount: summaryNet,
      paid: summaryPaid,
      pending: summaryPending
    };

    exportToPDF('Broker Commission Ledger', headers, rows, totals);
  };

  const runPrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters Drawer Panel */}
      <div className={`p-5 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
            <Filter className="w-4 h-4" /> Advanced Multi-Filter Panel
          </h3>
          <button 
            onClick={() => {
              setBrokerFilter('ALL');
              setProjectFilter('ALL');
              setCityFilter('ALL');
              setPaymentStatusFilter('ALL');
              setStartDate('');
              setEndDate('');
              setSearchQuery('');
            }}
            className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold underline"
          >
            Reset Filters
          </button>
        </div>

        {/* Filter Selection Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div className="space-y-1">
            <label className="font-bold text-slate-400">Search Keywords</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Flat, Cust Name, Project..."
              className={`w-full p-2 rounded-lg border focus:outline-none ${
                darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            />
          </div>

          {userRole !== 'Broker' && (
            <div className="space-y-1">
              <label className="font-bold text-slate-400">Filter Broker</label>
              <select
                value={brokerFilter}
                onChange={(e) => setBrokerFilter(e.target.value)}
                className={`w-full p-2 rounded-lg border focus:outline-none ${
                  darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <option value="ALL">All Brokers</option>
                {brokers.map(b => (
                  <option key={b.id} value={b.id}>{b.name} ({b.id})</option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1">
            <label className="font-bold text-slate-400">Filter Project Location</label>
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className={`w-full p-2 rounded-lg border focus:outline-none ${
                darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <option value="ALL">All Projects</option>
              {projects.map(p => (
                <option key={p.id} value={p.name}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-400">Filter City Zone</label>
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className={`w-full p-2 rounded-lg border focus:outline-none ${
                darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <option value="ALL">All Cities</option>
              {uniqueCities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-400">Payout Clearance Status</label>
            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              className={`w-full p-2 rounded-lg border focus:outline-none ${
                darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <option value="ALL">All Status</option>
              <option value="Pending">Pending Clearance</option>
              <option value="Partial">Partially Cleared</option>
              <option value="Paid">Fully Paid Payout</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-400">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={`w-full p-1.5 rounded-lg border focus:outline-none ${
                darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-400">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={`w-full p-1.5 rounded-lg border focus:outline-none ${
                darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            />
          </div>
        </div>
      </div>

      {/* TABS (HISTORY TABLE vs REPORTS CARDS) */}
      <div className={`p-6 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('history')}
              className={`text-sm font-black tracking-tight pb-1 border-b-2 transition-all ${
                activeTab === 'history' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-400'
              }`}
            >
              Transaction Audit History
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`text-sm font-black tracking-tight pb-1 border-b-2 transition-all ${
                activeTab === 'reports' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-400'
              }`}
            >
              Financial Analytics Reports
            </button>
          </div>

          {/* Export Panel triggers */}
          <div className="flex gap-2">
            <button
              onClick={runExcelExport}
              className="px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1 shadow-sm transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> Export Excel
            </button>
            <button
              onClick={runPDFExport}
              className="px-3 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg flex items-center gap-1 shadow-sm transition-colors"
            >
              <FileDown className="w-3.5 h-3.5" /> Export PDF
            </button>
            <button
              onClick={runPrint}
              className="px-3 py-1.5 text-xs font-bold border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg flex items-center gap-1 shadow-sm transition-colors"
            >
              <Printer className="w-3.5 h-3.5" /> Print Table
            </button>
          </div>
        </div>

        {/* TAB 1: HISTORY TABLE */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
              <table className="w-full text-left border-collapse" id="printable-table-target">
                <thead>
                  <tr className={`${darkMode ? 'bg-slate-900 text-slate-400' : 'bg-slate-50 text-slate-500'} font-bold`}>
                    <th className="p-3">Booking Date</th>
                    <th className="p-3">Broker Details</th>
                    <th className="p-3">Property Flat Location</th>
                    <th className="p-3 text-right">Sale Amount</th>
                    <th className="p-3 text-right">Gross Comm.</th>
                    <th className="p-3 text-right">Taxes (GST+TDS)</th>
                    <th className="p-3 text-right">Net Commission</th>
                    <th className="p-3 text-center">Payout Status</th>
                    <th className="p-3 text-right">Paid / Pending</th>
                    {userRole !== 'Broker' && <th className="p-3 text-right">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {paginatedSales.length === 0 ? (
                    <tr>
                      <td colSpan={userRole === 'Broker' ? 9 : 10} className="p-8 text-center text-slate-400">No matching sales records found</td>
                    </tr>
                  ) : (
                    paginatedSales.map(s => {
                      const comm = commissions.find(c => c.sale_id === s.id);
                      return (
                        <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors">
                          <td className="p-3 font-semibold">{s.booking_date}</td>
                          <td className="p-3">
                            <div className="font-bold">{s.broker_name}</div>
                            <div className="text-[10px] text-slate-400">ID: {s.broker_id}</div>
                          </td>
                          <td className="p-3">
                            <div className="font-semibold text-slate-700 dark:text-slate-300">{s.project_name}</div>
                            <div className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">Flat: {s.flat_number}</div>
                            <div className="text-[9px] text-slate-400">Cust: {s.customer_name}</div>
                          </td>
                          <td className="p-3 text-right font-mono">{formatCurrency(s.sale_amount)}</td>
                          <td className="p-3 text-right font-mono text-slate-500">{formatCurrency(s.gross_commission)}</td>
                          <td className="p-3 text-right font-mono text-rose-500">
                            <div>GST: -{formatCurrency(s.gst_amount)}</div>
                            <div className="text-[10px]">TDS: -{formatCurrency(s.tds_amount)}</div>
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-blue-600 dark:text-blue-400">{formatCurrency(s.net_commission)}</td>
                          <td className="p-3 text-center">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              comm?.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' :
                              comm?.status === 'Partially Paid' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' :
                              'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                            }`}>
                              {comm?.status || 'Pending'}
                            </span>
                          </td>
                          <td className="p-3 text-right font-mono">
                            <div className="text-emerald-600 dark:text-emerald-400 font-semibold">Paid: {formatCurrency(comm?.paid_amount || 0)}</div>
                            <div className="text-amber-600 dark:text-amber-400 font-bold text-[10px]">Pend: {formatCurrency(comm?.pending_amount || 0)}</div>
                          </td>
                          {userRole !== 'Broker' && (
                            <td className="p-3 text-right">
                              {comm && comm.pending_amount > 0 ? (
                                <button
                                  onClick={() => openPaymentModal(s)}
                                  className="px-2 py-1 text-[10px] font-extrabold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                                >
                                  Disburse Payout
                                </button>
                              ) : (
                                <span className="text-[10px] text-emerald-500 font-bold flex items-center justify-end gap-1">
                                  <Check className="w-3 h-3" /> Fully Cleared
                                </span>
                              )}
                            </td>
                          )}
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
                <p>Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredSales.length)} of {filteredSales.length} entries</p>
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

        {/* TAB 2: FINANCIAL ANALYTICS REPORTS */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border text-center">
                <p className="text-[10px] uppercase font-bold text-slate-400">Total Bookings Revenue</p>
                <h3 className="text-xl font-black text-blue-600 mt-1">{formatCurrency(summarySales)}</h3>
                <p className="text-[9px] text-slate-400 mt-1">From {filteredSales.length} flat bookings</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border text-center">
                <p className="text-[10px] uppercase font-bold text-slate-400">Gross Commissions Logged</p>
                <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 mt-1">{formatCurrency(summaryGross)}</h3>
                <p className="text-[9px] text-slate-400 mt-1">Before GST/TDS adjustments</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border text-center">
                <p className="text-[10px] uppercase font-bold text-slate-400">Net Payable Outflows</p>
                <h3 className="text-xl font-black text-purple-600 mt-1">{formatCurrency(summaryNet)}</h3>
                <p className="text-[9px] text-slate-400 mt-1">After direct tax withholdings</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border text-center">
                <p className="text-[10px] uppercase font-bold text-slate-400">Cleared Disbursals</p>
                <h3 className="text-xl font-black text-emerald-600 mt-1">{formatCurrency(summaryPaid)}</h3>
                <p className="text-[9px] text-emerald-500 font-bold mt-1">({Math.round((summaryPaid / (summaryNet || 1)) * 100)}% Disbursed)</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border text-center">
                <p className="text-[10px] uppercase font-bold text-slate-400">Pending Outstandings</p>
                <h3 className="text-xl font-black text-amber-600 mt-1">{formatCurrency(summaryPending)}</h3>
                <p className="text-[9px] text-amber-500 font-bold mt-1">({Math.round((summaryPending / (summaryNet || 1)) * 100)}% Outstanding)</p>
              </div>
            </div>

            {/* Informational advice */}
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs flex gap-3">
              <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-bold text-blue-800 dark:text-blue-400">Dynamic Reporting Note</h4>
                <p className="text-slate-500 leading-relaxed text-[10px]">
                  The reporting numbers shown above respond in real-time to your **Advanced Multi-Filter Panel** selections at the top. Adjust locations, brokers, dates, or payout statuses to query specific monthly, yearly, project-wise, or pending ledger reports. Use the **Export Excel / Export PDF** buttons to instantly output exact tabular sheets for tax audits.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* --- ADD PARTIAL PAYMENT DISBURE MODAL --- */}
      {isPaymentModalOpen && targetCommission && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <form onSubmit={handleSavePayment} className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border text-xs flex flex-col ${
            darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/30">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider">Disburse Broker Payout</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Disburse full or partial payments toward outstanding commission dues.</p>
              </div>
              <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {paymentError && (
                <div className="p-3 bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 rounded-lg flex items-center gap-2 border border-rose-200 dark:border-rose-800">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="font-semibold">{paymentError}</span>
                </div>
              )}

              {/* Commission details */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-850 space-y-2">
                <div className="flex justify-between">
                  <span className="font-bold text-slate-400">Total Net Invoice Payout:</span>
                  <span className="font-mono font-bold">{formatCurrency(targetCommission.net_commission)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-slate-400">Previously Paid:</span>
                  <span className="font-mono font-bold text-emerald-600">{formatCurrency(targetCommission.paid_amount)}</span>
                </div>
                <div className="flex justify-between border-t border-dashed pt-2">
                  <span className="font-extrabold text-slate-500">Remaining Outstanding Dues:</span>
                  <span className="font-mono font-black text-amber-600">{formatCurrency(targetCommission.pending_amount)}</span>
                </div>
              </div>

              {/* Payment inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-400">Disbursal Date</label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className={`w-full p-2 rounded-lg border focus:outline-none ${
                      darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-400">Disbursed Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={targetCommission.pending_amount}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    className={`w-full p-2 rounded-lg border focus:outline-none ${
                      darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-400">Payment Mode</label>
                  <select
                    value={paymentMode}
                    onChange={(e: any) => setPaymentMode(e.target.value)}
                    className={`w-full p-2 rounded-lg border focus:outline-none ${
                      darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                    <option value="UPI">UPI Transfer</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Cash">Cash Handover</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-400">Transaction Ref / Cheque No.</label>
                  <input
                    type="text"
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                    placeholder="e.g. UPI-10492812"
                    className={`w-full p-2 rounded-lg border focus:outline-none ${
                      darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3 bg-slate-50/50 dark:bg-slate-900/30">
              <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="px-4 py-2 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg">Cancel</button>
              <button type="submit" disabled={paymentLoading} className="px-5 py-2 font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow">
                {paymentLoading ? 'Logging Clearance...' : 'Clear Outstanding Payout'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
