import { useState, useEffect } from 'react';
import { Building2, Sparkles, RefreshCw, Trash, Calculator, Plus, HardHat, FileText, Landmark } from 'lucide-react';
import { Project, Stakeholder, DEFAULT_ROLES } from './types';
import ProjectSetup from './components/ProjectSetup';
import StakeholderEntry from './components/StakeholderEntry';
import SummaryTable from './components/SummaryTable';
import RoleManager from './components/RoleManager';

// Key names for LocalStorage
const LOCAL_STORAGE_PROJECT_KEY = 'real_estate_comm_project_v2';
const LOCAL_STORAGE_STAKEHOLDERS_KEY = 'real_estate_comm_stakeholders_v2';
const LOCAL_STORAGE_ROLES_KEY = 'real_estate_comm_roles_v2';

// Gorgeous, pre-populated default project dataset with Indian Context
const SAMPLE_PROJECT: Project = {
  name: 'Silverwood Residences - Block B',
  totalSaleValue: 75000000, // ₹7.5 Crore
};

const SAMPLE_STAKEHOLDERS: Stakeholder[] = [
  {
    id: 'sh-sample-1',
    name: 'Elite Realty Partners',
    role: 'Channel Partner',
    commissionType: 'percentage',
    rateOrAmount: 2.0, // 2% of ₹7.5Cr = ₹15,00,000
    taxDeductionRate: 5.0, // 5% Deduction
    tdsRate: 5.0, // 5% TDS
    hasGst: true, // 18% GST addition
    paymentStatus: 'Partially Paid',
    commissionCap: 1200000, // Capped at ₹12,00,000
    milestones: [
      { id: 'ms-std-1-sh-sample-1', name: 'On Booking', percentage: 30 },
      { id: 'ms-std-2-sh-sample-1', name: 'On Agreement', percentage: 40 },
      { id: 'ms-std-3-sh-sample-1', name: 'On Possession', percentage: 30 },
    ],
  },
  {
    id: 'sh-sample-2',
    name: 'Sarah Jenkins',
    role: 'Broker',
    commissionType: 'percentage',
    rateOrAmount: 1.0, // 1% of ₹7.5Cr = ₹7,50,000
    taxDeductionRate: 0.0,
    tdsRate: 5.0, // 5% TDS
    hasGst: false,
    paymentStatus: 'Pending',
  },
  {
    id: 'sh-sample-3',
    name: 'Marcus Cole Consulting',
    role: 'Consultant',
    commissionType: 'fixed',
    rateOrAmount: 250000, // Flat ₹2.5 Lakhs
    taxDeductionRate: 10.0, // 10% general deduction
    tdsRate: 10.0, // 10% professional TDS
    hasGst: true,
    paymentStatus: 'Paid',
  },
  {
    id: 'sh-sample-4',
    name: 'Lead Gen Agency',
    role: 'Agent',
    commissionType: 'fixed',
    rateOrAmount: 75000, // Flat ₹75,000
    taxDeductionRate: 0.0,
    tdsRate: 5.0, // 5% TDS
    hasGst: false,
    paymentStatus: 'Pending',
  },
];

export default function App() {
  // --- STATE INITIALIZATION ---
  const [project, setProject] = useState<Project>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_PROJECT_KEY);
    return saved ? JSON.parse(saved) : SAMPLE_PROJECT;
  });

  const [stakeholders, setStakeholders] = useState<Stakeholder[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_STAKEHOLDERS_KEY);
    return saved ? JSON.parse(saved) : SAMPLE_STAKEHOLDERS;
  });

  const [roles, setRoles] = useState<string[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_ROLES_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_ROLES;
  });

  // --- LOCALSTORAGE PERSISTENCE SYNC ---
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PROJECT_KEY, JSON.stringify(project));
  }, [project]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_STAKEHOLDERS_KEY, JSON.stringify(stakeholders));
  }, [stakeholders]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_ROLES_KEY, JSON.stringify(roles));
  }, [roles]);

  // --- STAKEHOLDER MUTATIONS ---
  const handleAddStakeholder = () => {
    const newSh: Stakeholder = {
      id: `sh-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: '',
      role: roles[0] || 'Broker',
      commissionType: 'percentage',
      rateOrAmount: 1.0,
      taxDeductionRate: 0.0,
      tdsRate: 5.0, // 5% standard default
      hasGst: false,
      paymentStatus: 'Pending',
    };
    setStakeholders([...stakeholders, newSh]);
  };

  const handleRemoveStakeholder = (id: string) => {
    setStakeholders(stakeholders.filter((sh) => sh.id !== id));
  };

  const handleUpdateStakeholder = (id: string, updated: Partial<Stakeholder>) => {
    setStakeholders(
      stakeholders.map((sh) => {
        if (sh.id === id) {
          return { ...sh, ...updated };
        }
        return sh;
      })
    );
  };

  // --- ROLE MANAGER MUTATIONS ---
  const handleAddRole = (newRole: string) => {
    setRoles([...roles, newRole]);
  };

  const handleRemoveRole = (roleToRemove: string) => {
    // Prevent removing roles that are currently assigned to active stakeholders
    const isAssigned = stakeholders.some((sh) => sh.role === roleToRemove);
    if (isAssigned) {
      alert(`Cannot remove "${roleToRemove}" because it is currently assigned to one or more active stakeholders.`);
      return;
    }
    setRoles(roles.filter((r) => r !== roleToRemove));
  };

  const handleResetRoles = () => {
    setRoles(DEFAULT_ROLES);
  };

  // --- WORKSPACE ACTIONS ---
  const handleLoadSampleData = () => {
    if (window.confirm('Are you sure you want to restore the sample project and stakeholders? This will replace your current entries.')) {
      setProject(SAMPLE_PROJECT);
      setStakeholders(SAMPLE_STAKEHOLDERS);
      setRoles(DEFAULT_ROLES);
    }
  };

  const handleClearWorkspace = () => {
    if (window.confirm('Are you sure you want to clear your current workspace? All stakeholder records will be removed.')) {
      setProject({ name: '', totalSaleValue: 0 });
      setStakeholders([]);
    }
  };

  return (
    <div id="app-root" className="min-h-screen bg-[#F8F9FA] text-gray-800 font-sans flex flex-col antialiased">
      {/* Premium Top Navigation / Header */}
      <header id="app-header" className="bg-white border-b border-gray-100 shadow-xs sticky top-0 z-50 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 text-white rounded-xl shadow-xs">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-extrabold text-gray-900 text-sm tracking-tight sm:text-base">Commission Calculator</h1>
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Real Estate Finance Workspace</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="load-sample-btn"
              onClick={handleLoadSampleData}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50/70 hover:bg-blue-50 rounded-lg border border-blue-100/30 transition-all cursor-pointer"
              title="Load full pre-calculated sample data to test out"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Load Sample Data</span>
            </button>
            <button
              id="clear-workspace-btn"
              onClick={handleClearWorkspace}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all border border-transparent cursor-pointer"
              title="Clear all inputs and starting fresh"
            >
              <Trash className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear Workspace</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Stage */}
      <main id="app-main-content" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Intro Hero Accent */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-linear-to-r from-blue-50/50 to-indigo-50/20 border border-blue-100/40 p-4 rounded-xl">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-blue-900 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-blue-600" /> Real Estate Commission Distribution Ledger
            </h2>
            <p className="text-xs text-blue-700 leading-relaxed">
              Define property sale value, structure nested stakeholders (brokers, consultants, agencies), allocate percentage/fixed rules, apply withholding taxes, and export formatted PDF audits.
            </p>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-gray-500 shrink-0 font-medium bg-white px-3 py-1.5 rounded-lg shadow-2xs border border-gray-100">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Auto-Saving to Browser
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT SIDE: Inputs and controls (7 columns on large desktop) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Screen 1: Project Setup Card */}
            <ProjectSetup
              name={project.name}
              totalSaleValue={project.totalSaleValue}
              onNameChange={(name) => setProject({ ...project, name })}
              onValueChange={(totalSaleValue) => setProject({ ...project, totalSaleValue })}
            />

            {/* Screen 2: Stakeholder Repeatable Rows */}
            <StakeholderEntry
              stakeholders={stakeholders}
              roles={roles}
              onAddStakeholder={handleAddStakeholder}
              onRemoveStakeholder={handleRemoveStakeholder}
              onUpdateStakeholder={handleUpdateStakeholder}
              totalSaleValue={project.totalSaleValue}
            />

            {/* Collapsible Role Customizer */}
            <RoleManager
              roles={roles}
              onAddRole={handleAddRole}
              onRemoveRole={handleRemoveRole}
              onResetRoles={handleResetRoles}
            />
          </div>

          {/* RIGHT SIDE: Real-time Ledger Summary & Print triggers (5 columns on large desktop) */}
          <div className="lg:col-span-5 sticky top-24 space-y-6">
            {/* Screen 3: Financial Summary & Export PDF */}
            <SummaryTable project={project} stakeholders={stakeholders} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer id="app-footer" className="bg-white border-t border-gray-100 py-6 mt-12 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-400 font-medium">
          <div className="flex items-center gap-1.5">
            <Landmark className="w-4 h-4 text-gray-300" />
            <span>Commission Calculator &copy; {new Date().getFullYear()}</span>
          </div>
          <div className="flex gap-4">
            <span>Corporate Light Theme</span>
            <span>&bull;</span>
            <span>PDF Export Enabled</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
