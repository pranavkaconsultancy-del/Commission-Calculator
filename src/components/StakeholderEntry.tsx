import React from 'react';
import { UserPlus, Trash2, Percent, IndianRupee, AlertCircle, Sparkles, CheckSquare, Square, ChevronDown, ChevronUp, Plus, Calendar } from 'lucide-react';
import { Stakeholder, CommissionType, PaymentStatusType, Milestone } from '../types';
import { validateStakeholder, formatCurrency } from '../utils';

interface StakeholderEntryProps {
  stakeholders: Stakeholder[];
  roles: string[];
  onAddStakeholder: () => void;
  onRemoveStakeholder: (id: string) => void;
  onUpdateStakeholder: (id: string, updated: Partial<Stakeholder>) => void;
  totalSaleValue: number;
}

export default function StakeholderEntry({
  stakeholders,
  roles,
  onAddStakeholder,
  onRemoveStakeholder,
  onUpdateStakeholder,
  totalSaleValue,
}: StakeholderEntryProps) {
  // State to keep track of which stakeholder card has its milestones section expanded
  const [expandedMilestones, setExpandedMilestones] = React.useState<Record<string, boolean>>({});

  const toggleMilestonesSection = (id: string) => {
    setExpandedMilestones((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Add a new milestone to a stakeholder
  const handleAddMilestone = (sh: Stakeholder) => {
    const currentMilestones = sh.milestones || [];
    const newMilestone: Milestone = {
      id: `ms-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: currentMilestones.length === 0 ? 'On Booking' : currentMilestones.length === 1 ? 'On Agreement' : 'On Possession',
      percentage: currentMilestones.length === 0 ? 100 : 0,
    };
    onUpdateStakeholder(sh.id, {
      milestones: [...currentMilestones, newMilestone],
    });
  };

  // Remove a milestone
  const handleRemoveMilestone = (sh: Stakeholder, milestoneId: string) => {
    const currentMilestones = sh.milestones || [];
    onUpdateStakeholder(sh.id, {
      milestones: currentMilestones.filter((m) => m.id !== milestoneId),
    });
  };

  // Update a single milestone's field
  const handleUpdateMilestone = (
    sh: Stakeholder,
    milestoneId: string,
    updatedField: Partial<Milestone>
  ) => {
    const currentMilestones = sh.milestones || [];
    onUpdateStakeholder(sh.id, {
      milestones: currentMilestones.map((m) => {
        if (m.id === milestoneId) {
          return { ...m, ...updatedField };
        }
        return m;
      }),
    });
  };

  // Apply quick milestone presets
  const applyMilestonePreset = (sh: Stakeholder, presetType: 'standard' | 'halves' | 'equal') => {
    if (presetType === 'standard') {
      onUpdateStakeholder(sh.id, {
        milestones: [
          { id: `ms-std-1-${sh.id}`, name: 'On Booking', percentage: 30 },
          { id: `ms-std-2-${sh.id}`, name: 'On Agreement', percentage: 40 },
          { id: `ms-std-3-${sh.id}`, name: 'On Possession', percentage: 30 },
        ],
      });
    } else if (presetType === 'halves') {
      onUpdateStakeholder(sh.id, {
        milestones: [
          { id: `ms-half-1-${sh.id}`, name: 'On Booking', percentage: 50 },
          { id: `ms-half-2-${sh.id}`, name: 'On Possession', percentage: 50 },
        ],
      });
    } else if (presetType === 'equal') {
      const current = sh.milestones || [];
      if (current.length === 0) return;
      const equalShare = Math.round((100 / current.length) * 100) / 100;
      onUpdateStakeholder(sh.id, {
        milestones: current.map((m, idx) => ({
          ...m,
          percentage: idx === current.length - 1 ? parseFloat((100 - (equalShare * (current.length - 1))).toFixed(2)) : equalShare,
        })),
      });
    }
  };

  return (
    <div id="stakeholder-entry-card" className="bg-white rounded-xl shadow-xs border border-gray-100 p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-gray-950 text-lg">People & Commission Rates</h2>
            <p className="text-xs text-gray-500">Add the people involved, decide how much they get, and customize tax rates or splits</p>
          </div>
        </div>
        <button
          id="add-stakeholder-top-btn"
          type="button"
          onClick={onAddStakeholder}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2.5 rounded-lg transition-colors shadow-xs hover:shadow-md cursor-pointer self-start sm:self-center"
        >
          <UserPlus className="w-4 h-4" />
          Add Person
        </button>
      </div>

      {stakeholders.length === 0 ? (
        <div id="empty-stakeholders-state" className="flex flex-col items-center justify-center py-12 px-4 text-center bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
          <div className="p-4 bg-gray-100 text-gray-400 rounded-full mb-3">
            <Sparkles className="w-6 h-6 text-blue-500 animate-pulse" />
          </div>
          <h3 className="text-sm font-bold text-gray-800">No payout structure defined yet</h3>
          <p className="text-xs text-gray-500 max-w-sm mt-1 leading-relaxed">
            Every real estate project has channel partners, internal sales teams, or agents. Add people to configure their payouts.
          </p>
          <button
            id="empty-add-stakeholder-btn"
            type="button"
            onClick={onAddStakeholder}
            className="mt-4 flex items-center gap-2 bg-white border border-gray-200 text-blue-600 hover:bg-blue-50 font-bold text-xs px-4.5 py-2.5 rounded-lg transition-colors cursor-pointer shadow-2xs"
          >
            <UserPlus className="w-4 h-4" />
            Add First Person
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {stakeholders.map((sh, idx) => {
            const errors = validateStakeholder(sh);
            const hasErrors = Object.keys(errors).length > 0;
            const isMilestoneActive = sh.milestones && sh.milestones.length > 0;
            const milestoneSum = sh.milestones ? sh.milestones.reduce((acc, m) => acc + m.percentage, 0) : 0;
            const isMilestoneInvalid = isMilestoneActive && Math.abs(milestoneSum - 100) > 0.01;

            return (
              <div
                key={sh.id}
                id={`stakeholder-card-${sh.id}`}
                className={`p-5 rounded-xl border transition-all duration-200 bg-gray-50/50 ${
                  hasErrors ? 'border-red-200 ring-2 ring-red-500/5' : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50/80'
                }`}
              >
                {/* 1. Header of Person Card */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
                      #{idx + 1}
                    </span>
                    <h3 className="font-bold text-gray-800 text-sm">
                      {sh.name.trim() ? sh.name : <span className="text-gray-400 italic font-medium">New Person</span>}
                    </h3>
                    <span className="text-xs text-gray-400">&bull;</span>
                    <span className="text-xs text-gray-500 font-semibold">{sh.role}</span>
                  </div>

                  <div className="flex items-center gap-3 ml-auto">
                    {/* Payment Status Dropdown Badge */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Status:</span>
                      <select
                        id={`payment-status-select-${sh.id}`}
                        value={sh.paymentStatus}
                        onChange={(e) => onUpdateStakeholder(sh.id, { paymentStatus: e.target.value as PaymentStatusType })}
                        className={`text-xs font-semibold rounded-md px-2 py-1 border-0 focus:ring-2 focus:ring-blue-500/20 cursor-pointer ${
                          sh.paymentStatus === 'Paid'
                            ? 'bg-emerald-50 text-emerald-700 font-bold'
                            : sh.paymentStatus === 'Partially Paid'
                            ? 'bg-blue-50 text-blue-700 font-bold'
                            : 'bg-amber-50 text-amber-700 font-bold'
                        }`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Partially Paid">Partially Paid</option>
                        <option value="Paid">Paid</option>
                      </select>
                    </div>

                    <button
                      id={`delete-stakeholder-btn-${sh.id}`}
                      type="button"
                      onClick={() => onRemoveStakeholder(sh.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50/50 transition-colors cursor-pointer"
                      title="Remove Person"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* 2. Main Parameters Form Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Row Column 1: Payout Strategy */}
                  <div className="space-y-4">
                    {/* Name */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider">
                        Person's Name
                      </label>
                      <input
                        id={`sh-name-input-${sh.id}`}
                        type="text"
                        placeholder="e.g. Acme Agency, John Doe"
                        value={sh.name}
                        onChange={(e) => onUpdateStakeholder(sh.id, { name: e.target.value })}
                        className={`w-full px-3 py-2 text-xs rounded-lg border focus:outline-hidden focus:ring-2 bg-white text-gray-800 font-medium ${
                          errors.name
                            ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                            : 'border-gray-200 focus:ring-blue-500/20 focus:border-blue-500'
                        }`}
                      />
                      {errors.name && (
                        <span className="text-[10px] text-red-500 flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3 h-3" /> {errors.name}
                        </span>
                      )}
                    </div>

                    {/* Role select */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider">
                        Assigned Role
                      </label>
                      <select
                        id={`sh-role-select-${sh.id}`}
                        value={sh.role}
                        onChange={(e) => onUpdateStakeholder(sh.id, { role: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-gray-800 font-medium cursor-pointer"
                      >
                        {roles.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Row Column 2: Calculation Mode */}
                  <div className="space-y-4">
                    {/* How is this calculated? */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider">
                        How is this calculated?
                      </label>
                      <select
                        id={`sh-type-select-${sh.id}`}
                        value={sh.commissionType}
                        onChange={(e) => onUpdateStakeholder(sh.id, { commissionType: e.target.value as CommissionType })}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-gray-800 font-medium cursor-pointer"
                      >
                        <option value="percentage">Percentage of Sale Value</option>
                        <option value="fixed">Fixed Amount</option>
                      </select>
                    </div>

                    {/* How much do they get? */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider">
                        How much do they get?
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none text-xs font-bold">
                          {sh.commissionType === 'percentage' ? '%' : '₹'}
                        </span>
                        <input
                          id={`sh-rate-amount-input-${sh.id}`}
                          type="number"
                          placeholder={sh.commissionType === 'percentage' ? 'e.g. 2.5' : 'e.g. 50000'}
                          value={sh.rateOrAmount === 0 ? '' : sh.rateOrAmount}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            onUpdateStakeholder(sh.id, { rateOrAmount: isNaN(val) ? 0 : val });
                          }}
                          className={`w-full pl-7 pr-3 py-2 text-xs rounded-lg border focus:outline-hidden focus:ring-2 bg-white text-gray-800 font-semibold ${
                            errors.rateOrAmount
                              ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                              : 'border-gray-200 focus:ring-blue-500/20 focus:border-blue-500'
                          }`}
                        />
                      </div>
                      <span className="text-[10px] text-gray-400 block leading-tight">
                        {sh.commissionType === 'percentage'
                          ? 'Enter the % this person gets from the total sale value.'
                          : 'Enter the flat rupee amount to disburse.'}
                      </span>
                      {errors.rateOrAmount && (
                        <span className="text-[10px] text-red-500 flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3 h-3" /> {errors.rateOrAmount}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Row Column 3: Deductions & Caps */}
                  <div className="space-y-4">
                    {/* General Deduction & TDS */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider text-ellipsis overflow-hidden whitespace-nowrap" title="Any deduction? (%)">
                          Any deduction? (%)
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-gray-400 pointer-events-none text-[11px] font-bold">
                            %
                          </span>
                          <input
                            id={`sh-tax-input-${sh.id}`}
                            type="number"
                            step="0.1"
                            placeholder="0.0"
                            value={sh.taxDeductionRate === 0 ? '' : sh.taxDeductionRate}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              onUpdateStakeholder(sh.id, { taxDeductionRate: isNaN(val) ? 0 : val });
                            }}
                            className={`w-full pl-6 pr-2 py-2 text-xs rounded-lg border focus:outline-hidden focus:ring-2 bg-white text-gray-800 font-semibold ${
                              errors.taxDeductionRate
                                ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                                : 'border-gray-200 focus:ring-blue-500/20 focus:border-blue-500'
                            }`}
                          />
                        </div>
                        {errors.taxDeductionRate && (
                          <span className="text-[9px] text-red-500 flex items-center gap-0.5 mt-1">
                            <AlertCircle className="w-2.5 h-2.5" /> {errors.taxDeductionRate}
                          </span>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider text-ellipsis overflow-hidden whitespace-nowrap" title="TDS Rate (%)">
                          TDS Rate (%)
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-gray-400 pointer-events-none text-[11px] font-bold">
                            %
                          </span>
                          <input
                            id={`sh-tds-input-${sh.id}`}
                            type="number"
                            step="0.1"
                            placeholder="5.0"
                            value={sh.tdsRate === 0 ? '' : sh.tdsRate}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              onUpdateStakeholder(sh.id, { tdsRate: isNaN(val) ? 0 : val });
                            }}
                            className={`w-full pl-6 pr-2 py-2 text-xs rounded-lg border focus:outline-hidden focus:ring-2 bg-white text-gray-800 font-semibold ${
                              errors.tdsRate
                                ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                                : 'border-gray-200 focus:ring-blue-500/20 focus:border-blue-500'
                            }`}
                          />
                        </div>
                        {errors.tdsRate && (
                          <span className="text-[9px] text-red-500 flex items-center gap-0.5 mt-1">
                            <AlertCircle className="w-2.5 h-2.5" /> {errors.tdsRate}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Cap & GST checkboxes */}
                    <div className="space-y-3">
                      {/* Commission Cap */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider">
                          Commission Cap (Optional ₹)
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-gray-400 pointer-events-none text-xs font-semibold">
                            ₹
                          </span>
                          <input
                            id={`sh-cap-input-${sh.id}`}
                            type="number"
                            placeholder="e.g. 100000"
                            value={sh.commissionCap === undefined ? '' : sh.commissionCap}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              onUpdateStakeholder(sh.id, { commissionCap: isNaN(val) ? undefined : val });
                            }}
                            className="w-full pl-6 pr-2 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-gray-800 font-semibold"
                          />
                        </div>
                        <span className="text-[10px] text-gray-400 block">Maximum payable commission threshold</span>
                      </div>

                      {/* GST Checkbox */}
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          id={`sh-gst-checkbox-${sh.id}`}
                          type="button"
                          onClick={() => onUpdateStakeholder(sh.id, { hasGst: !sh.hasGst })}
                          className="text-blue-600 focus:outline-hidden cursor-pointer shrink-0"
                        >
                          {sh.hasGst ? (
                            <CheckSquare className="w-4 h-4 text-blue-600 fill-blue-50" />
                          ) : (
                            <Square className="w-4 h-4 text-gray-300 bg-white rounded-xs" />
                          )}
                        </button>
                        <span
                          className="text-xs text-gray-700 font-medium select-none cursor-pointer"
                          onClick={() => onUpdateStakeholder(sh.id, { hasGst: !sh.hasGst })}
                        >
                          Add 18% GST on commission
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Milestones Setup Section */}
                <div className="mt-4 pt-3 border-t border-gray-100/70">
                  <div className="flex items-center justify-between">
                    <button
                      id={`toggle-milestones-btn-${sh.id}`}
                      type="button"
                      onClick={() => toggleMilestonesSection(sh.id)}
                      className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
                    >
                      <Calendar className="w-4 h-4" />
                      {isMilestoneActive ? `Defined Milestones (${sh.milestones?.length})` : 'Split Payment into Milestones'}
                      {expandedMilestones[sh.id] ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {isMilestoneActive && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isMilestoneInvalid ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>
                        Total: {milestoneSum}% {isMilestoneInvalid ? '(Must be 100%)' : '(Valid)'}
                      </span>
                    )}
                  </div>

                  {expandedMilestones[sh.id] && (
                    <div className="mt-4 bg-white p-4 rounded-lg border border-gray-100 space-y-4 shadow-2xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs text-gray-500">
                          Configure parts of the final commission to be disbursed at different construction stages.
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => applyMilestonePreset(sh, 'standard')}
                            className="text-[10px] font-bold text-gray-600 hover:text-blue-600 bg-gray-100 hover:bg-blue-50 px-2 py-1 rounded-sm cursor-pointer transition-colors"
                          >
                            Standard (30-40-30)
                          </button>
                          <button
                            type="button"
                            onClick={() => applyMilestonePreset(sh, 'halves')}
                            className="text-[10px] font-bold text-gray-600 hover:text-blue-600 bg-gray-100 hover:bg-blue-50 px-2 py-1 rounded-sm cursor-pointer transition-colors"
                          >
                            50-50 Split
                          </button>
                          {isMilestoneActive && (
                            <button
                              type="button"
                              onClick={() => applyMilestonePreset(sh, 'equal')}
                              className="text-[10px] font-bold text-gray-600 hover:text-blue-600 bg-gray-100 hover:bg-blue-50 px-2 py-1 rounded-sm cursor-pointer transition-colors"
                            >
                              Equal Split
                            </button>
                          )}
                        </div>
                      </div>

                      {(!sh.milestones || sh.milestones.length === 0) ? (
                        <div className="text-center py-4 bg-gray-50 rounded-lg border border-dashed border-gray-100">
                          <p className="text-xs text-gray-400 font-medium">No payment milestones defined. Commission paid fully in one go.</p>
                          <button
                            type="button"
                            onClick={() => handleAddMilestone(sh)}
                            className="mt-2 inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-bold cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" /> Initialize Milestones
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">
                            <div className="col-span-7">Milestone Name</div>
                            <div className="col-span-4 text-right">Split Percentage (%)</div>
                            <div className="col-span-1"></div>
                          </div>

                          <div className="space-y-2">
                            {sh.milestones.map((ms) => (
                              <div key={ms.id} className="grid grid-cols-12 gap-2 items-center">
                                <div className="col-span-7">
                                  <input
                                    type="text"
                                    placeholder="e.g. On Booking"
                                    value={ms.name}
                                    onChange={(e) => handleUpdateMilestone(sh, ms.id, { name: e.target.value })}
                                    className="w-full px-2 py-1 text-xs rounded-md border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 bg-gray-50 text-gray-800 font-medium"
                                  />
                                </div>
                                <div className="col-span-4 relative">
                                  <span className="absolute inset-y-0 left-0 pl-2 flex items-center text-gray-400 pointer-events-none text-xs">
                                    %
                                  </span>
                                  <input
                                    type="number"
                                    placeholder="0"
                                    value={ms.percentage === 0 ? '' : ms.percentage}
                                    onChange={(e) => {
                                      const val = parseFloat(e.target.value);
                                      handleUpdateMilestone(sh, ms.id, { percentage: isNaN(val) ? 0 : val });
                                    }}
                                    className="w-full pl-6 pr-2 py-1 text-xs rounded-md border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 bg-gray-50 text-right font-semibold text-gray-800"
                                  />
                                </div>
                                <div className="col-span-1 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveMilestone(sh, ms.id)}
                                    className="text-gray-400 hover:text-red-500 p-1 cursor-pointer rounded"
                                    title="Delete milestone"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="flex justify-between items-center pt-2 border-t border-gray-50">
                            <button
                              type="button"
                              onClick={() => handleAddMilestone(sh)}
                              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-bold cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" /> Add Milestone
                            </button>
                            <button
                              type="button"
                              onClick={() => onUpdateStakeholder(sh.id, { milestones: undefined })}
                              className="text-xs text-gray-400 hover:text-red-500 cursor-pointer"
                            >
                              Remove All Splits
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
