import React, { useState } from 'react';
import {
  Settings,
  Scale,
  Percent,
  Calculator,
  Shield,
  HelpCircle,
  Save,
  Check,
  AlertCircle
} from 'lucide-react';

interface SettingsState {
  commissionRules: {
    categoryDefaults: Record<string, number>;
    stakeholderTypeDefaults: Record<string, number>;
  };
  defaultTaxGstRate: number;
  defaultTaxTdsRate: number;
  defaultCommissionRate: number;
  roles: { role: string; description: string }[];
}

interface SettingsManagerProps {
  settings: SettingsState;
  onSaveSettings: (settings: SettingsState) => void;
}

export default function SettingsManager({ settings, onSaveSettings }: SettingsManagerProps) {
  const [localSettings, setLocalSettings] = useState<SettingsState>({ ...settings });
  const [isSaved, setIsSaved] = useState(false);

  const categories = [
    'Booking Commission',
    'Referral Commission',
    'Channel Partner Commission',
    'Broker Commission',
    'Incentive Payout'
  ];

  const stakeholderTypes = [
    'Sales Executive',
    'Executive',
    'Broker',
    'Channel Partner',
    'Consultant',
    'Agent',
    'Contractor'
  ];

  const handleCategoryChange = (cat: string, val: number) => {
    setLocalSettings({
      ...localSettings,
      commissionRules: {
        ...localSettings.commissionRules,
        categoryDefaults: {
          ...localSettings.commissionRules.categoryDefaults,
          [cat]: val
        }
      }
    });
  };

  const handleTypeChange = (type: string, val: number) => {
    setLocalSettings({
      ...localSettings,
      commissionRules: {
        ...localSettings.commissionRules,
        stakeholderTypeDefaults: {
          ...localSettings.commissionRules.stakeholderTypeDefaults,
          [type]: val
        }
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(localSettings);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white p-4.5 rounded-xl border border-gray-100 shadow-3xs flex items-center justify-between">
        <div>
          <h2 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
            <Settings className="text-blue-600 w-4 h-4" /> System Settings & Rule Engine
          </h2>
          <p className="text-[11px] text-gray-400">
            Define default payout scales, withholding tax parameters, and manage security policy placeholders.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Commission rules */}
        <div className="lg:col-span-2 space-y-6">
          {/* Commission Rules */}
          <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-5 space-y-4">
            <div className="border-b border-gray-50 pb-2.5">
              <h3 className="font-extrabold text-gray-900 text-xs flex items-center gap-1.5 uppercase tracking-wider text-blue-600">
                <Scale className="w-3.5 h-3.5" /> Default Commission Rules
              </h3>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Set default percentage rates to pre-populate new transaction setups based on Category or Stakeholder Type.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Rules by Category */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  By Commission Category
                </span>
                <div className="space-y-2.5">
                  {categories.map((cat) => {
                    const value = localSettings.commissionRules.categoryDefaults[cat] ?? 2.0;
                    return (
                      <div key={cat} className="flex items-center justify-between gap-4">
                        <span className="text-xs font-medium text-gray-700">{cat}</span>
                        <div className="relative rounded-md shadow-3xs max-w-[100px]">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            value={value}
                            onChange={(e) => handleCategoryChange(cat, Number(e.target.value))}
                            className="w-full pl-3 pr-8 py-1 text-xs border border-gray-200 rounded-md focus:outline-hidden text-right text-gray-800 font-bold bg-gray-50"
                          />
                          <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
                            <span className="text-[10px] text-gray-400 font-bold">%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Rules by Stakeholder Type */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  By Stakeholder Type
                </span>
                <div className="space-y-2.5">
                  {stakeholderTypes.map((type) => {
                    const value = localSettings.commissionRules.stakeholderTypeDefaults[type] ?? 2.0;
                    return (
                      <div key={type} className="flex items-center justify-between gap-4">
                        <span className="text-xs font-medium text-gray-700">{type}</span>
                        <div className="relative rounded-md shadow-3xs max-w-[100px]">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            value={value}
                            onChange={(e) => handleTypeChange(type, Number(e.target.value))}
                            className="w-full pl-3 pr-8 py-1 text-xs border border-gray-200 rounded-md focus:outline-hidden text-right text-gray-800 font-bold bg-gray-50"
                          />
                          <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
                            <span className="text-[10px] text-gray-400 font-bold">%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Fallback & Taxes */}
          <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-5 space-y-4">
            <div className="border-b border-gray-50 pb-2.5">
              <h3 className="font-extrabold text-gray-900 text-xs flex items-center gap-1.5 uppercase tracking-wider text-blue-600">
                <Percent className="w-3.5 h-3.5" /> Tax Rules & Global Fallbacks
              </h3>
              <p className="text-[11px] text-gray-400 mt-0.5">
                These percentages will be applied as system defaults for any new transaction log entry.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 block">Default GST (%)</label>
                <div className="relative rounded-md shadow-3xs">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={localSettings.defaultTaxGstRate}
                    onChange={(e) => setLocalSettings({ ...localSettings, defaultTaxGstRate: Number(e.target.value) })}
                    className="w-full pl-3 pr-8 py-2 text-xs border border-gray-200 rounded-lg focus:outline-hidden bg-gray-50 text-gray-800 font-bold"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-xs text-gray-400 font-semibold">%</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 block">Default TDS (%)</label>
                <div className="relative rounded-md shadow-3xs">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={localSettings.defaultTaxTdsRate}
                    onChange={(e) => setLocalSettings({ ...localSettings, defaultTaxTdsRate: Number(e.target.value) })}
                    className="w-full pl-3 pr-8 py-2 text-xs border border-gray-200 rounded-lg focus:outline-hidden bg-gray-50 text-gray-800 font-bold"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-xs text-gray-400 font-semibold">%</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 block">Fallback Commission (%)</label>
                <div className="relative rounded-md shadow-3xs">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={localSettings.defaultCommissionRate}
                    onChange={(e) => setLocalSettings({ ...localSettings, defaultCommissionRate: Number(e.target.value) })}
                    className="w-full pl-3 pr-8 py-2 text-xs border border-gray-200 rounded-lg focus:outline-hidden bg-gray-50 text-gray-800 font-bold"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-xs text-gray-400 font-semibold">%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Permissions & save */}
        <div className="space-y-6">
          {/* Permissions / Role Configuration */}
          <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-5 space-y-4">
            <div className="border-b border-gray-50 pb-2.5">
              <h3 className="font-extrabold text-gray-900 text-xs flex items-center gap-1.5 uppercase tracking-wider text-blue-600">
                <Shield className="w-3.5 h-3.5" /> User Permissions
              </h3>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Configure roles. Authentication, session state, and granular login policy enforcement are managed via identity gateway.
              </p>
            </div>

            <div className="space-y-3">
              {localSettings.roles.map((roleObj, i) => (
                <div key={i} className="p-3 bg-gray-50 rounded-lg border border-gray-100 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-900">{roleObj.role}</span>
                    <span className="text-[9px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                      ACTIVE TEMPLATE
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 leading-relaxed font-semibold">
                    {roleObj.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="p-3 bg-blue-50/50 border border-blue-100/40 rounded-lg flex items-start gap-2 text-[10px] text-blue-800">
              <AlertCircle className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed font-semibold">
                Note: Local session role defaults to <strong>Admin</strong>. Full login/role validation is simulated and ready to bind with Firebase OAuth / Auth gateways.
              </p>
            </div>
          </div>

          {/* Action Panel */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-lg shadow-sm transition-all cursor-pointer"
            >
              {isSaved ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
              {isSaved ? 'Settings Saved Successfully!' : 'Save Configurations'}
            </button>
            
            {isSaved && (
              <p className="text-[10px] text-emerald-600 font-extrabold text-center animate-pulse">
                ✓ System pre-fills updated and saved!
              </p>
            )}
          </div>
        </div>

      </form>
    </div>
  );
}
