import React, { useState, useEffect } from 'react';
import { 
  Building2, Plus, DollarSign, Calendar, User, Phone, CheckCircle, AlertCircle, Info, Coins, FileSpreadsheet
} from 'lucide-react';
import { Broker, Project, Property, Sale, Commission } from '../types';
import { formatCurrency, formatNumber } from '../utils';
import { ExcelImportView } from './ExcelImportView';

interface SaleEntryViewProps {
  brokers: Broker[];
  projects: Project[];
  properties: Property[];
  onAddSale: (sale: Sale, commission: Commission) => Promise<void>;
  onImportSuccess: () => Promise<void>;
  userRole: string;
  darkMode: boolean;
  initialMode?: 'manual' | 'excel';
}

export function SaleEntryView({ 
  brokers, projects, properties, onAddSale, onImportSuccess, userRole, darkMode, initialMode = 'manual'
}: SaleEntryViewProps) {
  // Mode State: 'manual' or 'excel'
  const [entryMode, setEntryMode] = useState<'manual' | 'excel'>(initialMode);

  // Form State
  const [selectedBrokerId, setSelectedBrokerId] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [saleAmount, setSaleAmount] = useState<number>(0);
  const [bookingDate, setBookingDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');

  // Statuses
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);

  // 1. Filter brokers (Active brokers)
  const activeBrokers = brokers.filter(b => b.status === 'Active');

  // 2. Filter properties based on project and availability
  // (We show ONLY Available properties, but if they are editing or reviewing, we can accommodate. Since this is for NEW sales, we show only "Available" units).
  const projectProperties = properties.filter(p => 
    p.project_id === selectedProjectId && p.status === 'Available'
  );

  // 3. Auto-populate sale amount when property is selected
  useEffect(() => {
    if (selectedPropertyId) {
      const prop = properties.find(p => p.id === selectedPropertyId);
      if (prop) {
        setSaleAmount(prop.property_value);
      }
    } else {
      setSaleAmount(0);
    }
  }, [selectedPropertyId, properties]);

  // 4. LIVE CALCULATOR ENGINE
  const getCalculation = () => {
    const broker = brokers.find(b => b.id === selectedBrokerId);
    if (!broker) return null;

    let grossCommission = 0;
    const type = broker.commission_type;
    const rate = broker.commission_percentage || 0;
    const fixedAmt = broker.commission_amount || 0;

    // Gross Commission logic
    if (type === 'Percentage') {
      grossCommission = saleAmount * (rate / 100);
    } else if (type === 'Fixed') {
      grossCommission = fixedAmt;
    } else if (type === 'Fixed+Percentage') {
      grossCommission = fixedAmt + (saleAmount * (rate / 100));
    }

    // Taxes
    const gstRate = broker.gst_percentage || 0;
    const tdsRate = broker.tds_percentage || 0;

    const gstAmount = grossCommission * (gstRate / 100);
    const tdsAmount = grossCommission * (tdsRate / 100);

    // Formula Net: Net = Gross - GST - TDS (as specified by user in requirements)
    const netCommission = grossCommission - gstAmount - tdsAmount;

    return {
      brokerName: broker.name,
      commissionType: type,
      commissionRate: rate,
      fixedAmount: fixedAmt,
      grossCommission,
      gstRate,
      gstAmount,
      tdsRate,
      tdsAmount,
      netCommission
    };
  };

  const calc = getCalculation();

  // 5. HANDLE SUBMIT SALE
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userRole === 'Broker') {
      setFormError('Access Denied: Brokers cannot log property sales.');
      return;
    }
    if (!selectedBrokerId) {
      setFormError('Please select a Broker');
      return;
    }
    if (!selectedPropertyId) {
      setFormError('Please select a Flat / Property');
      return;
    }
    if (saleAmount <= 0) {
      setFormError('Sale amount must be a positive number');
      return;
    }
    if (!customerName.trim() || !customerMobile.trim()) {
      setFormError('Customer Name and Mobile are required');
      return;
    }

    setSaveLoading(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      const broker = brokers.find(b => b.id === selectedBrokerId);
      const project = projects.find(p => p.id === selectedProjectId);
      const property = properties.find(p => p.id === selectedPropertyId);
      
      if (!broker || !property) throw new Error('Selected entities not found');

      // Prepare calculation
      const c = calc!;

      const saleId = `SALE-${Math.floor(1000 + Math.random() * 9000)}`;
      const customerId = `CUST-${Math.floor(1000 + Math.random() * 9000)}`;

      const newSale: Sale = {
        id: saleId,
        broker_id: selectedBrokerId,
        broker_name: broker.name,
        property_id: selectedPropertyId,
        project_name: project ? project.name : 'Unknown Project',
        flat_number: property.flat_number,
        sale_amount: saleAmount,
        booking_date: bookingDate,
        customer_id: customerId,
        customer_name: customerName.trim(),
        customer_mobile: customerMobile.trim(),
        gross_commission: c.grossCommission,
        gst_amount: c.gstAmount,
        tds_amount: c.tdsAmount,
        net_commission: c.netCommission,
        created_at: new Date().toISOString()
      };

      const newCommission: Commission = {
        id: `COMM-${Math.floor(1000 + Math.random() * 9000)}`,
        sale_id: saleId,
        broker_id: selectedBrokerId,
        net_commission: c.netCommission,
        status: 'Pending',
        paid_amount: 0,
        pending_amount: c.netCommission,
        created_at: new Date().toISOString()
      };

      await onAddSale(newSale, newCommission);

      setFormSuccess(`Sale recorded successfully! Flat ${property.flat_number} marked as Sold.`);
      
      // Reset
      setSelectedPropertyId('');
      setSelectedProjectId('');
      setSelectedBrokerId('');
      setCustomerName('');
      setCustomerMobile('');
      setSaleAmount(0);
    } catch (err: any) {
      setFormError(err.message || 'Could not record sale');
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ENTRY MODE SWITCHER TABS */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-2 rounded-2xl bg-slate-200/80 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700">
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setEntryMode('manual')}
            className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-extrabold text-xs transition-all ${
              entryMode === 'manual'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Coins className="w-4 h-4" />
            + Manual Commission Entry
          </button>

          <button
            onClick={() => setEntryMode('excel')}
            className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-extrabold text-xs transition-all ${
              entryMode === 'excel'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Import from Excel (.xlsx / .csv)
          </button>
        </div>

        <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 px-3 hidden md:block">
          {entryMode === 'manual' ? 'Manual single-entry calculator mode' : 'Bulk spreadsheet import engine with validation'}
        </div>
      </div>

      {entryMode === 'excel' ? (
        <ExcelImportView 
          brokers={brokers}
          projects={projects}
          onImportSuccess={onImportSuccess}
          onCancel={() => setEntryMode('manual')}
          darkMode={darkMode}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Sale Form (left 3 cols) */}
      <div className={`lg:col-span-3 p-6 rounded-xl border flex flex-col gap-5 ${
        darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
      }`}>
        <div>
          <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
            <Coins className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Book Sale & Log Commission
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-500">Record a property booking, automatically calculate broker payout commissions, and flag the unit status.</p>
        </div>

        {formError && (
          <div className="p-3 bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 rounded-lg flex items-center gap-2 border border-rose-200 dark:border-rose-800 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="font-semibold">{formError}</span>
          </div>
        )}

        {formSuccess && (
          <div className="p-3 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 rounded-lg flex items-center gap-2 border border-emerald-200 dark:border-emerald-800 text-xs">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span className="font-semibold">{formSuccess}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Section 1: Entities */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-bold text-slate-400">Select Broker Scheme *</label>
              <select
                required
                value={selectedBrokerId}
                onChange={(e) => setSelectedBrokerId(e.target.value)}
                className={`w-full p-2.5 rounded-lg border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                  darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <option value="">-- Choose Active Broker --</option>
                {activeBrokers.map(b => (
                  <option key={b.id} value={b.id}>{b.name} ({b.id} • {b.commission_type})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-400">Select Project Location *</label>
              <select
                required
                value={selectedProjectId}
                onChange={(e) => { setSelectedProjectId(e.target.value); setSelectedPropertyId(''); }}
                className={`w-full p-2.5 rounded-lg border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                  darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <option value="">-- Choose Project Location --</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.area})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-bold text-slate-400">Select Available Flat *</label>
              <select
                required
                disabled={!selectedProjectId}
                value={selectedPropertyId}
                onChange={(e) => setSelectedPropertyId(e.target.value)}
                className={`w-full p-2.5 rounded-lg border focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 ${
                  darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <option value="">-- Choose Flat Number --</option>
                {projectProperties.map(p => (
                  <option key={p.id} value={p.id}>Flat {p.flat_number} ({p.tower} • {p.property_type} • Value: {formatNumber(p.property_value)})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-400">Sale Agreement Amount (₹) *</label>
              <input
                type="number"
                required
                min={100000}
                value={saleAmount}
                onChange={(e) => setSaleAmount(Number(e.target.value))}
                className={`w-full p-2.5 rounded-lg border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                  darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              />
            </div>
          </div>

          {/* Section 2: Booking Date & Customer Details */}
          <div className="space-y-3 pt-2">
            <h4 className="font-extrabold uppercase tracking-widest text-slate-400 border-b pb-1">Customer & Booking Timeline</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-400">Booking / Agreement Date</label>
                <input
                  type="date"
                  required
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className={`w-full p-2 rounded-lg border focus:outline-none ${
                    darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-400">Customer Name *</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Amit Verma"
                  className={`w-full p-2 rounded-lg border focus:outline-none ${
                    darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-400">Customer Mobile *</label>
                <input
                  type="text"
                  required
                  value={customerMobile}
                  onChange={(e) => setCustomerMobile(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className={`w-full p-2 rounded-lg border focus:outline-none ${
                    darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            {userRole === 'Broker' ? (
              <p className="text-rose-500 font-bold">Only administrators can book property sales.</p>
            ) : (
              <button
                type="submit"
                disabled={saveLoading}
                className="px-6 py-2.5 font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow transition-colors flex items-center gap-1.5"
              >
                {saveLoading ? 'Logging Sale...' : 'Book Property & Save Payout'}
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Interactive Breakdown Calculator (right 2 cols) */}
      <div className="lg:col-span-2 space-y-4">
        {calc ? (
          <div className={`p-6 rounded-xl border relative shadow-md overflow-hidden ${
            darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
          }`}>
            <span className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 dark:bg-blue-500/10 rounded-full translate-x-12 -translate-y-12 pointer-events-none" />
            
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-3 flex items-center gap-1">
              <Info className="w-4 h-4" /> Live Payout Receipt Breakdown
            </h3>

            {/* Steps Container */}
            <div className="space-y-3.5 text-xs">
              {/* Step 1: Base Value */}
              <div className="flex justify-between items-start border-b border-dashed pb-2 border-slate-200 dark:border-slate-800">
                <div>
                  <span className="font-extrabold text-slate-400 mr-2 text-[10px]">STEP 1</span>
                  <span className="font-bold">Base Sale Value</span>
                  <p className="text-[10px] text-slate-400 mt-0.5">Agreement property amount sizer</p>
                </div>
                <div className="text-right font-mono font-bold">
                  {formatCurrency(saleAmount)}
                </div>
              </div>

              {/* Step 2: Gross Commission */}
              <div className="flex justify-between items-start border-b border-dashed pb-2 border-slate-200 dark:border-slate-800">
                <div>
                  <span className="font-extrabold text-slate-400 mr-2 text-[10px]">STEP 2</span>
                  <span className="font-bold">Gross Commission</span>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {calc.commissionType === 'Percentage' && `Rate: ${calc.commissionRate}%`}
                    {calc.commissionType === 'Fixed' && `Fixed amount flat payout`}
                    {calc.commissionType === 'Fixed+Percentage' && `Fixed: ${formatCurrency(calc.fixedAmount)} + Rate: ${calc.commissionRate}%`}
                  </p>
                </div>
                <div className="text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(calc.grossCommission)}
                </div>
              </div>

              {/* Step 3: GST Addition/Deduction */}
              <div className="flex justify-between items-start border-b border-dashed pb-2 border-slate-200 dark:border-slate-800">
                <div>
                  <span className="font-extrabold text-slate-400 mr-2 text-[10px]">STEP 3</span>
                  <span className="font-bold">GST Deductible</span>
                  <p className="text-[10px] text-slate-400 mt-0.5">Charge component rate: {calc.gstRate}%</p>
                </div>
                <div className="text-right font-mono font-bold text-rose-500">
                  - {formatCurrency(calc.gstAmount)}
                </div>
              </div>

              {/* Step 4: TDS Deduction */}
              <div className="flex justify-between items-start border-b border-dashed pb-2 border-slate-200 dark:border-slate-800">
                <div>
                  <span className="font-extrabold text-slate-400 mr-2 text-[10px]">STEP 4</span>
                  <span className="font-bold">TDS Withholding</span>
                  <p className="text-[10px] text-slate-400 mt-0.5">Tax withheld at source rate: {calc.tdsRate}%</p>
                </div>
                <div className="text-right font-mono font-bold text-rose-500">
                  - {formatCurrency(calc.tdsAmount)}
                </div>
              </div>

              {/* Step 5: Net Payable */}
              <div className="pt-1.5">
                <div className="flex justify-between items-center p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                  <div>
                    <span className="font-extrabold mr-2 text-[10px]">STEP 5</span>
                    <span className="font-black">Net Payable Payout</span>
                    <p className="text-[9px] text-emerald-600 dark:text-emerald-500 font-medium">Formula: Gross − GST − TDS</p>
                  </div>
                  <div className="text-right font-mono text-base font-black">
                    {formatCurrency(calc.netCommission)}
                  </div>
                </div>
              </div>

              {/* Informative Note */}
              <p className="text-[9px] text-slate-400 leading-relaxed italic flex items-start gap-1.5 mt-2">
                <Info className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                Deductions calculated immediately based on real-time PAN registry. A commission invoice (status Pending) will be created inside the database on booking submission.
              </p>
            </div>
          </div>
        ) : (
          <div className={`p-6 rounded-xl border text-center flex flex-col items-center justify-center min-h-[300px] text-slate-400 ${
            darkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'
          }`}>
            <Coins className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-2 animate-bounce" />
            <h4 className="font-bold text-slate-500 text-xs">Waiting for selections</h4>
            <p className="text-[10px] max-w-xs mt-1">Select a broker scheme, property location, and flat size to review live receipts here instantly.</p>
          </div>
        )}
      </div>
    </div>
  )}
</div>
  );
}
