import React, { useState } from 'react';
import { CommissionEntry, Project, Person, Payment } from '../types';
import { calculateCommission, formatCurrency, formatPercent, validateEntry } from '../utils';
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  Coins,
  Receipt,
  User,
  Calendar,
  DollarSign,
  Briefcase,
  Layers,
  Percent,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Info,
  CreditCard,
  Settings,
  PlusCircle,
  X
} from 'lucide-react';

interface BookingsListProps {
  entries: CommissionEntry[];
  projects: Project[];
  people: Person[];
  paymentModes: string[];
  onAddEntry: (entry: Omit<CommissionEntry, 'id'>) => void;
  onDeleteEntry: (id: string) => void;
  onAddPayment: (entryId: string, payment: Omit<Payment, 'id'>) => void;
  onDeletePayment: (entryId: string, paymentId: string) => void;
  onAddPaymentMode: (mode: string) => void;
  onDeletePaymentMode: (mode: string) => void;
}

export default function BookingsList({
  entries,
  projects,
  people,
  paymentModes,
  onAddEntry,
  onDeleteEntry,
  onAddPayment,
  onDeletePayment,
  onAddPaymentMode,
  onDeletePaymentMode,
}: BookingsListProps) {
  const [showForm, setShowForm] = useState(false);
  const [showModesSettings, setShowModesSettings] = useState(false);
  const [newModeName, setNewModeName] = useState('');

  // Form State
  const [projectId, setProjectId] = useState('');
  const [unitNo, setUnitNo] = useState('');
  const [propertyValue, setPropertyValue] = useState<number>(0);
  const [customerName, setCustomerName] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [agreementDate, setAgreementDate] = useState('');
  const [bookingAmount, setBookingAmount] = useState<number>(0);
  const [receivedAmount, setReceivedAmount] = useState<number>(0);
  
  const [personId, setPersonId] = useState('');
  const [category, setCategory] = useState('Booking Commission');
  const [commissionType, setCommissionType] = useState<'percentage' | 'fixed'>('percentage');
  const [rateOrAmount, setRateOrAmount] = useState<number>(0);
  const [bonusIncentive, setBonusIncentive] = useState<number>(0);
  const [commissionRule, setCommissionRule] = useState('');
  const [hasGst, setHasGst] = useState(false);
  const [tdsRate, setTdsRate] = useState<number>(5);
  const [commissionCap, setCommissionCap] = useState<number | undefined>(undefined);

  // Duplicate Warning states
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [forceSaveActive, setForceSaveActive] = useState(false);

  // Validation state
  const [errors, setErrors] = useState<any>({});

  // Expanded Sections state (Row breakdown & Payment panels)
  const [expandedBreakdownId, setExpandedBreakdownId] = useState<string | null>(null);
  const [expandedPaymentsId, setExpandedPaymentsId] = useState<string | null>(null);

  // New partial payment form state per entry
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payDate, setPayDate] = useState('');
  const [payMode, setPayMode] = useState(paymentModes[0] || 'Bank Transfer');

  // Sync state helpers on recipient type
  const executives = people.filter((p) => p.type === 'Executive');
  const brokers = people.filter((p) => p.type === 'Broker');

  // Trigger auto-initialization of select options and Settings pre-population
  React.useEffect(() => {
    if (projects.length > 0 && !projectId) {
      setProjectId(projects[0].id);
    }
    if (people.length > 0 && !personId) {
      setPersonId(people[0].id);
    }
  }, [projects, people]);

  // Load Settings defaults when category changes or settings is loaded
  React.useEffect(() => {
    // Check if we have active local storage settings we can parse
    try {
      const stored = localStorage.getItem('re_sys_settings_v4');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.commissionRules?.categoryDefaults?.[category] !== undefined) {
          setRateOrAmount(parsed.commissionRules.categoryDefaults[category]);
          setCommissionType('percentage');
        }
        if (parsed?.taxRules?.defaultTaxTdsRate !== undefined) {
          setTdsRate(parsed.taxRules.defaultTaxTdsRate);
        }
        if (parsed?.taxRules?.defaultTaxGstEnabled !== undefined) {
          setHasGst(parsed.taxRules.defaultTaxGstEnabled);
        }
      }
    } catch (e) {
      console.warn("Could not read default settings to pre-populate booking form", e);
    }
  }, [category]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedProj = projects.find((p) => p.id === projectId);
    const resolvedPropertyValue = propertyValue;

    const draftEntry: Omit<CommissionEntry, 'id'> = {
      projectId,
      unitNo: unitNo.trim(),
      customerName: customerName.trim(),
      bookingDate,
      agreementDate,
      propertyValue: resolvedPropertyValue,
      bookingAmount,
      receivedAmount,
      personId,
      category,
      commissionType,
      rateOrAmount,
      bonusIncentive,
      commissionRule: commissionRule.trim(),
      hasGst,
      tdsRate,
      commissionCap: commissionCap && commissionCap > 0 ? commissionCap : undefined,
      payments: [],
    };

    // 1. Core fields validation
    const validationErrors = validateEntry(draftEntry as CommissionEntry, resolvedPropertyValue);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setDuplicateWarning(null); // Clear duplicate warnings if core validation fails
      return;
    }

    // 2. Duplicate Entry Check (Project + Stakeholder + Category)
    const isDuplicate = entries.some(
      (entry) =>
        entry.projectId === projectId &&
        entry.personId === personId &&
        (entry.category || 'Booking Commission') === category
    );

    if (isDuplicate && !forceSaveActive) {
      setDuplicateWarning(
        "Warning: A similar commission calculation already exists for this Project, Stakeholder, and Category. Duplicate entries can lead to double-payout errors."
      );
      return;
    }

    onAddEntry(draftEntry);
    
    // Reset Form & warnings
    setUnitNo('');
    setPropertyValue(0);
    setCustomerName('');
    setBookingDate('');
    setAgreementDate('');
    setBookingAmount(0);
    setReceivedAmount(0);
    setRateOrAmount(0);
    setBonusIncentive(0);
    setCommissionRule('');
    setHasGst(false);
    setTdsRate(5);
    setCommissionCap(undefined);
    setErrors({});
    setDuplicateWarning(null);
    setForceSaveActive(false);
    setShowForm(false);
  };

  const handleAddPaymentClick = (entryId: string, netCommission: number) => {
    if (payAmount <= 0) {
      alert('Payment amount must be greater than zero');
      return;
    }
    if (!payDate) {
      alert('Please specify a valid payment date');
      return;
    }

    onAddPayment(entryId, {
      amount: payAmount,
      date: payDate,
      mode: payMode,
    });

    // Reset payment fields
    setPayAmount(0);
    setPayDate('');
  };

  const handleAddMode = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanMode = newModeName.trim();
    if (!cleanMode) return;
    if (paymentModes.includes(cleanMode)) {
      alert('This payment mode already exists!');
      return;
    }
    onAddPaymentMode(cleanMode);
    setNewModeName('');
  };

  return (
    <div className="space-y-6">
      {/* Header and Add button */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-white p-4.5 rounded-xl border border-gray-100 shadow-3xs">
        <div>
          <h2 className="font-extrabold text-gray-900 text-sm">Commission Bookings & Sales Ledger</h2>
          <p className="text-[11px] text-gray-400">
            Log properties sales, set custom payout rules, and track partial disbursements.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowModesSettings(!showModesSettings)}
            className="flex items-center gap-1 text-[11px] font-bold text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors cursor-pointer border border-gray-200"
          >
            <Settings className="w-3.5 h-3.5 text-gray-500" />
            Payment Modes List
          </button>
          
          {projects.length > 0 && people.length > 0 && (
            <button
              onClick={() => {
                setShowForm(!showForm);
                if (!projectId && projects.length > 0) setProjectId(projects[0].id);
                if (!personId && people.length > 0) setPersonId(people[0].id);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-lg shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              {showForm ? 'Close Entry Form' : 'Add Sale Booking'}
            </button>
          )}
        </div>
      </div>

      {/* Editable Payment Modes Customizer panel */}
      {showModesSettings && (
        <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-5 space-y-4">
          <div>
            <h4 className="font-extrabold text-gray-900 text-xs flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              Customize Payment Modes
            </h4>
            <p className="text-[10px] text-gray-400 mt-0.5">
              Add or remove payout methods (e.g., Bank Transfer, UPI). Standard modes are provided by default.
            </p>
          </div>

          <form onSubmit={handleAddMode} className="flex gap-2 max-w-md">
            <input
              type="text"
              placeholder="e.g., RTGS Transfer"
              value={newModeName}
              onChange={(e) => setNewModeName(e.target.value)}
              className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:outline-hidden bg-gray-50 text-gray-800 font-medium"
            />
            <button
              type="submit"
              className="px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-lg cursor-pointer"
            >
              Add Mode
            </button>
          </form>

          <div className="flex flex-wrap gap-1.5">
            {paymentModes.map((mode) => (
              <div
                key={mode}
                className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-md text-[10px] font-bold text-gray-600 border border-gray-100"
              >
                <span>{mode}</span>
                <button
                  type="button"
                  onClick={() => {
                    if (paymentModes.length <= 1) {
                      alert('At least one payment mode must remain.');
                      return;
                    }
                    if (confirm(`Remove "${mode}" payment mode?`)) {
                      onDeletePaymentMode(mode);
                      if (payMode === mode) {
                        const remain = paymentModes.filter((x) => x !== mode);
                        setPayMode(remain[0]);
                      }
                    }
                  }}
                  className="text-gray-400 hover:text-red-500 ml-1 cursor-pointer"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* WARNINGS: No projects or people directories setup */}
      {(projects.length === 0 || people.length === 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-start gap-3.5">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-amber-800 text-xs">Setup Required to Log Sales Bookings</h4>
            <p className="text-[11px] text-amber-700 leading-relaxed">
              Before you can record property sales and commission contracts, you must establish active records in your{' '}
              <strong className="font-bold underline">Projects Portfolio</strong> and the{' '}
              <strong className="font-bold underline">People Directory</strong>. Click on those tabs to register projects and stakeholders.
            </p>
          </div>
        </div>
      )}

      {/* TRANSACTIONS CREATION FORM */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-5 space-y-4">
          <div className="border-b border-gray-50 pb-3">
            <h3 className="font-extrabold text-gray-900 text-xs uppercase tracking-wide text-blue-600">
              New Booking & Payout Setup Form
            </h3>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Specify unit financials, recipient stakeholder, tax rates, and optional caps. All payouts recalculate live.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 1. Project & Client Info */}
            <div className="space-y-3">
              <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block border-l-2 border-blue-500 pl-1.5">
                1. Project & Customer details
              </span>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Project select */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 block">Select Project</label>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:ring-1 focus:ring-blue-500 bg-gray-50 text-gray-800 font-medium cursor-pointer"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.type})
                      </option>
                    ))}
                  </select>
                  {errors.projectId && <p className="text-[10px] text-red-500 font-bold">{errors.projectId}</p>}
                </div>

                {/* Unit Number */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 block">Unit No.</label>
                  <input
                    type="text"
                    placeholder="e.g., A-402, Villa 5"
                    value={unitNo}
                    onChange={(e) => setUnitNo(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-lg border focus:outline-hidden focus:ring-1 focus:ring-blue-500 bg-gray-50 text-gray-800 font-medium ${
                      errors.unitNo ? 'border-red-300 shadow-2xs shadow-red-100' : 'border-gray-200'
                    }`}
                  />
                  {errors.unitNo && <p className="text-[10px] text-red-500 font-bold">{errors.unitNo}</p>}
                </div>

                {/* Customer Name */}
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] font-bold text-gray-500 block">Customer / Buyer Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Vikram Aditya"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-lg border focus:outline-hidden focus:ring-1 focus:ring-blue-500 bg-gray-50 text-gray-800 font-medium ${
                      errors.customerName ? 'border-red-300 shadow-2xs shadow-red-100' : 'border-gray-200'
                    }`}
                  />
                  {errors.customerName && <p className="text-[10px] text-red-500 font-bold">{errors.customerName}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Booking Date */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 block flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" /> Booking Date
                  </label>
                  <input
                    type="date"
                    required
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden bg-gray-50 text-gray-800 font-medium cursor-pointer"
                  />
                </div>

                {/* Agreement Date */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 block flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" /> Agreement Date
                  </label>
                  <input
                    type="date"
                    required
                    value={agreementDate}
                    onChange={(e) => setAgreementDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden bg-gray-50 text-gray-800 font-medium cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* 2. Property Financial Ledger */}
            <div className="space-y-3 pt-2">
              <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block border-l-2 border-blue-500 pl-1.5">
                2. Property Financial ledger
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Property Sale Value */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 block">Property Sale Value (₹)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    placeholder="e.g., 7500000"
                    value={propertyValue || ''}
                    onChange={(e) => setPropertyValue(Number(e.target.value))}
                    className={`w-full px-3 py-2 text-xs rounded-lg border focus:ring-1 focus:ring-blue-500 bg-gray-50 text-gray-800 font-medium ${
                      errors.propertyValue ? 'border-red-300 shadow-2xs shadow-red-100' : 'border-gray-200'
                    }`}
                  />
                  {errors.propertyValue ? (
                    <p className="text-[10px] text-red-500 font-bold">{errors.propertyValue}</p>
                  ) : (
                    <p className="text-[9px] text-gray-400 font-semibold italic">* Total contract cost of property unit</p>
                  )}
                </div>

                {/* Booking Amount */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 block">Booking Amount (₹)</label>
                  <input
                    type="number"
                    min={0}
                    placeholder="e.g., 500000"
                    value={bookingAmount || ''}
                    onChange={(e) => setBookingAmount(Number(e.target.value))}
                    className={`w-full px-3 py-2 text-xs rounded-lg border focus:ring-1 focus:ring-blue-500 bg-gray-50 text-gray-800 font-medium ${
                      errors.bookingAmount ? 'border-red-300 shadow-2xs shadow-red-100' : 'border-gray-200'
                    }`}
                  />
                  {errors.bookingAmount ? (
                    <p className="text-[10px] text-red-500 font-bold">{errors.bookingAmount}</p>
                  ) : (
                    <p className="text-[9px] text-gray-400 font-semibold italic">* Paid initially to initiate purchase</p>
                  )}
                </div>

                {/* Received Amount */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 block">Amount Received So Far (₹)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    placeholder="e.g., 1500000"
                    value={receivedAmount || ''}
                    onChange={(e) => setReceivedAmount(Number(e.target.value))}
                    className={`w-full px-3 py-2 text-xs rounded-lg border focus:ring-1 focus:ring-blue-500 bg-gray-50 text-gray-800 font-medium ${
                      errors.receivedAmount ? 'border-red-300 shadow-2xs shadow-red-100' : 'border-gray-200'
                    }`}
                  />
                  {errors.receivedAmount ? (
                    <p className="text-[10px] text-red-500 font-bold">{errors.receivedAmount}</p>
                  ) : (
                    <p className="text-[9px] text-gray-400 font-semibold italic">
                      * Realized collected amount (used to scale commission eligibility)
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* 3. Commission Rule Setup */}
            <div className="space-y-3 pt-2">
              <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block border-l-2 border-blue-500 pl-1.5">
                3. Commission & Payout Setup
              </span>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {/* Recipient Stakeholder select */}
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] font-bold text-gray-500 block">Select Payee (Stakeholder)</label>
                  <select
                    value={personId}
                    onChange={(e) => setPersonId(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-lg border focus:ring-1 focus:ring-blue-500 bg-gray-50 text-gray-800 font-medium cursor-pointer ${
                      errors.personId ? 'border-red-300 shadow-2xs shadow-red-100' : 'border-gray-200'
                    }`}
                  >
                    <option value="">-- Choose Stakeholder --</option>
                    {people.map((p) => (
                      <option key={p.id} value={p.id}>
                        [{p.type === 'Executive' ? 'Sales Executive' : p.type}] {p.name}{' '}
                        {p.employeeId ? `(${p.employeeId})` : ''}
                      </option>
                    ))}
                  </select>
                  {errors.personId && <p className="text-[10px] text-red-500 font-bold">{errors.personId}</p>}
                </div>

                {/* NEW: Commission Category selection */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 block">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:ring-1 focus:ring-blue-500 bg-gray-50 text-gray-800 font-medium cursor-pointer"
                  >
                    <option value="Booking Commission">Booking Commission</option>
                    <option value="Referral Commission">Referral Commission</option>
                    <option value="Channel Partner Commission">Channel Partner Commission</option>
                    <option value="Broker Commission">Broker Commission</option>
                    <option value="Incentive Payout">Incentive Payout</option>
                  </select>
                </div>

                {/* Commission Type */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 block">Commission Setup</label>
                  <select
                    value={commissionType}
                    onChange={(e) => {
                      setCommissionType(e.target.value as any);
                      setRateOrAmount(0);
                    }}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:ring-1 focus:ring-blue-500 bg-gray-50 text-gray-800 font-medium cursor-pointer"
                  >
                    <option value="percentage">Percentage of Sale Value</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>

                {/* Rate or Amount */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 block">
                    {commissionType === 'percentage' ? 'Commission Rate (%)' : 'Fixed Payout (₹)'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder={commissionType === 'percentage' ? 'e.g., 2.5' : 'e.g., 100000'}
                    value={rateOrAmount || ''}
                    onChange={(e) => setRateOrAmount(Number(e.target.value))}
                    className={`w-full px-3 py-2 text-xs rounded-lg border focus:ring-1 focus:ring-blue-500 bg-gray-50 text-gray-800 font-medium ${
                      errors.rateOrAmount ? 'border-red-300 shadow-2xs shadow-red-100' : 'border-gray-200'
                    }`}
                  />
                  {errors.rateOrAmount && <p className="text-[10px] text-red-500 font-bold">{errors.rateOrAmount}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Bonus / Incentive */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 block">Bonus / Incentive (₹)</label>
                  <input
                    type="number"
                    min={0}
                    placeholder="e.g., 15000"
                    value={bonusIncentive || ''}
                    onChange={(e) => setBonusIncentive(Number(e.target.value))}
                    className={`w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:ring-1 focus:ring-blue-500 bg-gray-50 text-gray-800 font-medium ${
                      errors.bonusIncentive ? 'border-red-300 shadow-2xs shadow-red-100' : 'border-gray-200'
                    }`}
                  />
                  {errors.bonusIncentive ? (
                    <p className="text-[10px] text-red-500 font-bold">{errors.bonusIncentive}</p>
                  ) : (
                    <p className="text-[9px] text-gray-400 font-semibold italic">* Flat cash reward paid on top of base</p>
                  )}
                </div>

                {/* TDS Deduction Rate */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 block">TDS Deduction Rate (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    placeholder="e.g., 5"
                    value={tdsRate}
                    onChange={(e) => setTdsRate(Number(e.target.value))}
                    className={`w-full px-3 py-2 text-xs rounded-lg border focus:ring-1 focus:ring-blue-500 bg-gray-50 text-gray-800 font-medium ${
                      errors.tdsRate ? 'border-red-300 shadow-2xs shadow-red-100' : 'border-gray-200'
                    }`}
                  />
                  {errors.tdsRate ? (
                    <p className="text-[10px] text-red-500 font-bold">{errors.tdsRate}</p>
                  ) : (
                    <p className="text-[9px] text-gray-400 font-semibold italic">* Default withholding is 5% in India</p>
                  )}
                </div>

                {/* Commission Cap */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 block">Maximum Commission Cap (₹) - Optional</label>
                  <input
                    type="number"
                    min={0}
                    placeholder="e.g., 150000"
                    value={commissionCap || ''}
                    onChange={(e) => setCommissionCap(e.target.value ? Number(e.target.value) : undefined)}
                    className={`w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:ring-1 focus:ring-blue-500 bg-gray-50 text-gray-800 font-medium ${
                      errors.commissionCap ? 'border-red-300 shadow-2xs shadow-red-100' : 'border-gray-200'
                    }`}
                  />
                  {errors.commissionCap ? (
                    <p className="text-[10px] text-red-500 font-bold">{errors.commissionCap}</p>
                  ) : (
                    <p className="text-[9px] text-gray-400 font-semibold italic">* Hard ceiling limit on full base payout</p>
                  )}
                </div>
              </div>

              {/* Checkbox and Rule Input */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 block">Commission Rule Description / Conditions</label>
                  <input
                    type="text"
                    placeholder="e.g., 2% up to ₹1Cr property value, 2.5% above"
                    value={commissionRule}
                    onChange={(e) => setCommissionRule(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:ring-1 focus:ring-blue-500 bg-gray-50 text-gray-800 font-medium"
                  />
                </div>

                <div className="pt-4 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="hasGst"
                    checked={hasGst}
                    onChange={(e) => setHasGst(e.target.checked)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded-sm bg-gray-50 cursor-pointer"
                  />
                  <label htmlFor="hasGst" className="text-xs font-bold text-gray-700 cursor-pointer select-none">
                    Add 18% GST on commission
                  </label>
                </div>
              </div>
            </div>

            {/* Duplicate Warnings container */}
            {duplicateWarning && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h5 className="font-bold text-amber-800 text-[11px] uppercase tracking-wide">Duplicate Calculations Warning</h5>
                    <p className="text-[10px] text-amber-700 leading-relaxed">{duplicateWarning}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setDuplicateWarning(null);
                      setForceSaveActive(false);
                    }}
                    className="px-2.5 py-1 text-[10px] font-bold text-gray-500 hover:text-gray-700 bg-white border border-gray-250 rounded-md transition-all cursor-pointer"
                  >
                    Cancel Action
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setForceSaveActive(true);
                      // Trigger re-submit with force-save bypassed
                      setTimeout(() => {
                        const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
                        const btn = document.getElementById('submit-booking-btn');
                        if (btn) btn.click();
                      }, 50);
                    }}
                    className="px-2.5 py-1 text-[10px] font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-md shadow-xs transition-all cursor-pointer"
                  >
                    Force Save Entry
                  </button>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end gap-3 pt-3 border-t border-gray-50">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="submit-booking-btn"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-lg shadow-sm cursor-pointer transition-colors"
              >
                Register Booking Ledger
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TRANS-LEDGER DATA TABLE */}
      {entries.length === 0 ? (
        <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-12 text-center space-y-3">
          <Coins className="w-10 h-10 text-gray-300 mx-auto" />
          <h3 className="font-extrabold text-gray-900 text-sm">No transaction booking records logged</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            Click "Add Sale Booking" at top to record a property contract and customize stakeholder calculations.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-xs border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1100px]">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-100">
                  <th className="p-3.5 text-[10px] font-bold uppercase tracking-wider text-gray-500">Property Details</th>
                  <th className="p-3.5 text-[10px] font-bold uppercase tracking-wider text-gray-500">Customer & Dates</th>
                  <th className="p-3.5 text-[10px] font-bold uppercase tracking-wider text-gray-500">Recipient Stakeholder</th>
                  <th className="p-3.5 text-[10px] font-bold uppercase tracking-wider text-gray-500 text-right">Property Value</th>
                  <th className="p-3.5 text-[10px] font-bold uppercase tracking-wider text-gray-500 text-right">Commission (Eligible So Far)</th>
                  <th className="p-3.5 text-[10px] font-bold uppercase tracking-wider text-gray-500 text-right">Paid Out</th>
                  <th className="p-3.5 text-[10px] font-bold uppercase tracking-wider text-gray-500 text-center">Status</th>
                  <th className="p-3.5 text-[10px] font-bold uppercase tracking-wider text-gray-500 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {entries.map((entry) => {
                  const project = projects.find((p) => p.id === entry.projectId);
                  const person = people.find((p) => p.id === entry.personId);
                  const calc = calculateCommission(entry, entry.propertyValue);

                  const isBreakdownExpanded = expandedBreakdownId === entry.id;
                  const isPaymentsExpanded = expandedPaymentsId === entry.id;

                  // Find status badge styling
                  let statusBg = 'bg-amber-50 text-amber-600 border border-amber-100';
                  if (calc.status === 'Paid') {
                    statusBg = 'bg-emerald-50 text-emerald-600 border border-emerald-100';
                  } else if (calc.status === 'Partially Paid') {
                    statusBg = 'bg-blue-50 text-blue-600 border border-blue-100';
                  }

                  return (
                    <React.Fragment key={entry.id}>
                      {/* Main Data Row */}
                      <tr className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-3.5">
                          <div className="space-y-0.5">
                            <h4 className="font-extrabold text-gray-900 text-xs">{project?.name || 'Unknown Project'}</h4>
                            <span className="text-[10px] text-gray-400 font-bold tracking-wide">
                              Unit No: {entry.unitNo}
                            </span>
                          </div>
                        </td>

                        <td className="p-3.5">
                          <div className="space-y-0.5">
                            <h4 className="font-bold text-gray-800 text-xs">{entry.customerName}</h4>
                            <div className="flex gap-2 text-[9px] text-gray-400 font-bold">
                              <span>Booked: {entry.bookingDate}</span>
                              <span className="text-gray-300">|</span>
                              <span>Agreed: {entry.agreementDate}</span>
                            </div>
                          </div>
                        </td>

                        <td className="p-3.5">
                          <div className="space-y-0.5">
                            <h4 className="font-extrabold text-gray-900 text-xs flex items-center gap-1">
                              <User className="w-3.5 h-3.5 text-gray-400" />
                              {person?.name || 'N/A'}
                            </h4>
                            <span className="inline-block bg-gray-50 text-gray-500 border border-gray-100 px-1.5 py-0.5 rounded-sm text-[9px] font-bold">
                              {person?.type === 'Executive' ? 'Internal SE' : 'External BrokerCP'} ID:{' '}
                              {person?.employeeId || 'N/A'}
                            </span>
                          </div>
                        </td>

                        <td className="p-3.5 text-right font-bold text-xs text-gray-800">
                          <div className="space-y-0.5">
                            <span>{formatCurrency(entry.propertyValue)}</span>
                            <div className="text-[10px] text-gray-400 font-semibold">
                              Received: {formatCurrency(entry.receivedAmount)}{' '}
                              <span className="text-blue-600 font-bold">
                                ({(entry.propertyValue > 0 ? (entry.receivedAmount / entry.propertyValue) * 100 : 0).toFixed(0)}%)
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="p-3.5 text-right font-bold text-xs text-blue-600">
                          <div className="space-y-0.5">
                            <span>{formatCurrency(calc.netCommission)}</span>
                            <div className="text-[9px] text-gray-400 font-semibold">
                              Ceiling Base: {formatCurrency(calc.fullBaseCommissionCapped)}
                              {typeof entry.commissionCap === 'number' && (
                                <span className="text-orange-500 font-bold"> [Capped]</span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="p-3.5 text-right font-bold text-xs text-emerald-600">
                          <div className="space-y-0.5">
                            <span>{formatCurrency(calc.totalPaid)}</span>
                            <div className="text-[10px] text-gray-400 font-semibold">
                              Unpaid: {formatCurrency(calc.pendingAmount)}
                            </div>
                          </div>
                        </td>

                        <td className="p-3.5 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${statusBg}`}>
                            {calc.status}
                          </span>
                        </td>

                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Breakdown toggle button */}
                            <button
                              onClick={() => {
                                setExpandedBreakdownId(isBreakdownExpanded ? null : entry.id);
                                setExpandedPaymentsId(null);
                              }}
                              className={`p-1.5 rounded-lg border text-xs font-bold flex items-center gap-0.5 transition-colors cursor-pointer ${
                                isBreakdownExpanded
                                  ? 'bg-blue-50 border-blue-200 text-blue-600'
                                  : 'bg-white border-gray-200 text-gray-500 hover:text-gray-800'
                              }`}
                              title="Formula Calculation Breakdown"
                            >
                              <span>Formula</span>
                              {isBreakdownExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>

                            {/* Payments ledger toggle button */}
                            <button
                              onClick={() => {
                                setExpandedPaymentsId(isPaymentsExpanded ? null : entry.id);
                                setExpandedBreakdownId(null);
                              }}
                              className={`p-1.5 rounded-lg border text-xs font-bold flex items-center gap-0.5 transition-colors cursor-pointer ${
                                isPaymentsExpanded
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                                  : 'bg-white border-gray-200 text-gray-500 hover:text-gray-800'
                              }`}
                              title="Record Payouts & Partial payments"
                            >
                              <span>Disburse ({entry.payments ? entry.payments.length : 0})</span>
                              {isPaymentsExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>

                            {/* Delete Button */}
                            <button
                              onClick={() => {
                                if (
                                  confirm(
                                    `Are you sure you want to delete this sale booking of Unit ${entry.unitNo} for customer ${entry.customerName}? This is permanent.`
                                  )
                                ) {
                                  onDeleteEntry(entry.id);
                                }
                              }}
                              className="p-1.5 border border-gray-200 hover:border-red-200 text-gray-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                              title="Delete Transaction"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Row 1: FORMULA BREAKDOWN */}
                      {isBreakdownExpanded && (
                        <tr>
                          <td colSpan={8} className="p-0 bg-blue-50/20 border-b border-gray-100">
                            <div className="p-4.5 space-y-3.5 max-w-4xl">
                              <div className="flex items-center gap-2 border-b border-blue-50 pb-1.5">
                                <Info className="w-4 h-4 text-blue-600" />
                                <span className="font-extrabold text-blue-800 text-xs uppercase tracking-wide">
                                  Live Calculation Breakdown
                                </span>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs text-gray-700">
                                <div className="space-y-2 leading-relaxed">
                                  <div>
                                    <span className="font-bold text-gray-900 block">1. Full Base Commission (Ceiling):</span>
                                    <p className="text-[11px] text-gray-500 mt-0.5">
                                      Calculated on full Property Value (₹{entry.propertyValue.toLocaleString('en-IN')}) with rule type{' '}
                                      <strong>
                                        {entry.commissionType === 'percentage'
                                          ? `${entry.rateOrAmount}% of Sale Value`
                                          : `Fixed amount of ₹${entry.rateOrAmount.toLocaleString('en-IN')}`}
                                      </strong>
                                      .
                                    </p>
                                    <p className="text-gray-900 font-bold mt-1">
                                      Formula Value: {formatCurrency(calc.fullBaseCommission)}
                                    </p>
                                  </div>

                                  {typeof entry.commissionCap === 'number' && (
                                    <div className="p-2 bg-orange-50 border border-orange-100 rounded-lg">
                                      <span className="font-bold text-orange-800 block">Applied Commission Cap:</span>
                                      <p className="text-[10px] text-orange-700">
                                        Calculated commission exceeds the maximum limit set on this transaction.
                                        Automatically capped at: <strong>{formatCurrency(entry.commissionCap)}</strong>.
                                      </p>
                                    </div>
                                  )}

                                  <div>
                                    <span className="font-bold text-gray-900 block">2. Proportional Scaling (Collected Cash basis):</span>
                                    <p className="text-[11px] text-gray-500 mt-0.5">
                                      We pay commission proportional to the actual funds collected from the client so far.
                                    </p>
                                    <p className="text-gray-900 font-bold mt-1">
                                      Factor: ₹{entry.receivedAmount.toLocaleString('en-IN')} received / ₹
                                      {entry.propertyValue.toLocaleString('en-IN')} sale ={' '}
                                      <span className="text-blue-600 font-extrabold">
                                        {((entry.receivedAmount / entry.propertyValue) * 100).toFixed(2)}%
                                      </span>
                                    </p>
                                    <p className="text-blue-600 font-extrabold mt-1">
                                      Proportional Base Commission: {formatCurrency(calc.eligibleCommissionCapped)}
                                    </p>
                                  </div>
                                </div>

                                <div className="space-y-2 leading-relaxed bg-white p-3 rounded-xl border border-gray-100">
                                  <span className="font-bold text-gray-900 block border-b border-gray-50 pb-1">
                                    3. Final Net Payout Formula:
                                  </span>

                                  <div className="space-y-1.5 text-[11px]">
                                    <div className="flex justify-between">
                                      <span>Proportional Base:</span>
                                      <span className="font-bold">{formatCurrency(calc.eligibleCommissionCapped)}</span>
                                    </div>
                                    <div className="flex justify-between text-emerald-600 font-semibold">
                                      <span>(+) Flat Cash Bonus:</span>
                                      <span>+{formatCurrency(calc.bonusAmount)}</span>
                                    </div>
                                    <div className="flex justify-between text-blue-600 font-semibold">
                                      <span>(+) GST (18% if enabled):</span>
                                      <span>+{formatCurrency(calc.gstAmount)}</span>
                                    </div>
                                    <div className="flex justify-between text-red-500 font-semibold border-b border-gray-100 pb-1">
                                      <span>(-) TDS Withheld ({entry.tdsRate}%):</span>
                                      <span>-{formatCurrency(calc.tdsAmount)}</span>
                                    </div>
                                    <div className="flex justify-between text-xs font-extrabold text-gray-900 pt-1">
                                      <span>Net Eligible Commission:</span>
                                      <span className="text-blue-600 font-black">{formatCurrency(calc.netCommission)}</span>
                                    </div>
                                  </div>

                                  <div className="bg-gray-50 p-2 rounded-lg border border-gray-100 text-[10px] text-gray-500 mt-2 font-semibold">
                                    Rule Note: {entry.commissionRule || 'None defined'}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}

                      {/* Expandable Row 2: DISBURSEMENT & PAYMENTS HISTORY */}
                      {isPaymentsExpanded && (
                        <tr>
                          <td colSpan={8} className="p-0 bg-emerald-50/15 border-b border-gray-100">
                            <div className="p-4.5 space-y-4 max-w-4xl">
                              <div className="flex items-center gap-2 border-b border-emerald-100 pb-1.5">
                                <Receipt className="w-4 h-4 text-emerald-600" />
                                <span className="font-extrabold text-emerald-800 text-xs uppercase tracking-wide">
                                  Disbursement Ledger & Payment History
                                </span>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Left: Record payment Form */}
                                <div className="space-y-3 bg-white p-4.5 rounded-xl border border-gray-100 shadow-3xs">
                                  <h5 className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                                    <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
                                    Disburse Partial / Full Payment
                                  </h5>

                                  <div className="space-y-2">
                                    <div className="grid grid-cols-2 gap-3">
                                      <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                                          Amount (₹)
                                        </label>
                                        <input
                                          type="number"
                                          min={1}
                                          placeholder="e.g., 25000"
                                          value={payAmount || ''}
                                          onChange={(e) => setPayAmount(Number(e.target.value))}
                                          className="w-full px-2.5 py-1.5 text-xs rounded-md border border-gray-200 focus:outline-hidden bg-gray-50 text-gray-800 font-medium"
                                        />
                                      </div>

                                      <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                                          Disbursement Date
                                        </label>
                                        <input
                                          type="date"
                                          value={payDate}
                                          onChange={(e) => setPayDate(e.target.value)}
                                          className="w-full px-2.5 py-1.5 text-[11px] rounded-md border border-gray-200 focus:outline-hidden bg-gray-50 text-gray-800 font-medium cursor-pointer"
                                        />
                                      </div>
                                    </div>

                                    <div className="space-y-1">
                                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                                        Payment Mode
                                      </label>
                                      <select
                                        value={payMode}
                                        onChange={(e) => setPayMode(e.target.value)}
                                        className="w-full px-2.5 py-1.5 text-xs rounded-md border border-gray-200 focus:outline-hidden bg-gray-50 text-gray-800 font-medium cursor-pointer"
                                      >
                                        {paymentModes.map((m) => (
                                          <option key={m} value={m}>
                                            {m}
                                          </option>
                                        ))}
                                      </select>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => handleAddPaymentClick(entry.id, calc.netCommission)}
                                      className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm transition-colors cursor-pointer"
                                    >
                                      Post Payment Receipt
                                    </button>
                                  </div>
                                </div>

                                {/* Right: Payments list */}
                                <div className="space-y-2">
                                  <h5 className="font-bold text-gray-500 uppercase tracking-widest text-[9px]">
                                    Recorded Installments list
                                  </h5>

                                  {!entry.payments || entry.payments.length === 0 ? (
                                    <div className="py-8 text-center bg-gray-50/50 rounded-xl border border-dashed border-gray-100 flex flex-col items-center justify-center">
                                      <CreditCard className="w-6 h-6 text-gray-300" />
                                      <p className="text-[10px] text-gray-400 font-bold mt-1">
                                        No payouts disbursed so far on this contract
                                      </p>
                                    </div>
                                  ) : (
                                    <div className="divide-y divide-gray-50 max-h-48 overflow-y-auto bg-white p-2.5 rounded-xl border border-gray-100">
                                      {entry.payments.map((pay) => (
                                        <div key={pay.id} className="py-2 flex items-center justify-between text-xs">
                                          <div>
                                            <span className="font-black text-gray-800">{formatCurrency(pay.amount)}</span>
                                            <div className="flex gap-2 text-[9px] text-gray-400 font-bold">
                                              <span>{pay.date}</span>
                                              <span>|</span>
                                              <span className="text-blue-600 font-extrabold">{pay.mode}</span>
                                            </div>
                                          </div>

                                          <button
                                            onClick={() => {
                                              if (confirm('Delete this payout receipt? Financial metrics will restore.')) {
                                                onDeletePayment(entry.id, pay.id);
                                              }
                                            }}
                                            className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                            title="Delete Receipt"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  <div className="p-3 bg-white rounded-xl border border-gray-100 flex items-center justify-between">
                                    <div>
                                      <span className="text-[9px] font-bold text-gray-400 uppercase">Outstanding Debt</span>
                                      <div className="text-xs font-black text-amber-600">{formatCurrency(calc.pendingAmount)}</div>
                                    </div>
                                    <div className="text-right">
                                      <span className="text-[9px] font-bold text-gray-400 uppercase">Settlement Rate</span>
                                      <div className="text-xs font-black text-emerald-600">
                                        {calc.netCommission > 0
                                          ? `${((calc.totalPaid / calc.netCommission) * 100).toFixed(0)}% Disbursed`
                                          : '0%'}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
