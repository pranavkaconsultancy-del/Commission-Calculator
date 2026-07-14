import React, { useState, useEffect } from 'react';
import {
  Landmark,
  Sparkles,
  Trash2,
  Calculator,
  Building,
  Users,
  LayoutDashboard,
  Coins,
  FileText,
  AlertCircle,
  TrendingUp,
  Settings,
  HelpCircle,
  Activity
} from 'lucide-react';
import { Project, Person, CommissionEntry, Payment } from './types';
import { calculateCommission } from './utils';

// Import our custom modules
import FilterBar, { FilterState } from './components/FilterBar';
import Dashboard from './components/Dashboard';
import BookingsList from './components/BookingsList';
import ProjectManager from './components/ProjectManager';
import DirectoryManager from './components/DirectoryManager';
import ReportsManager from './components/ReportsManager';
import SettingsManager from './components/SettingsManager';

// Key names for LocalStorage
const STORAGE_PROJECTS = 're_sys_projects_v4';
const STORAGE_PROJECT_TYPES = 're_sys_project_types_v4';
const STORAGE_PEOPLE = 're_sys_people_v4';
const STORAGE_ENTRIES = 're_sys_entries_v4';
const STORAGE_PAYMENT_MODES = 're_sys_payment_modes_v4';

// --- GORGEOUS SAMPLE DATASETS ---
const DEFAULT_PROJECTS: Project[] = [
  { id: 'p1', name: 'Skyline Heights', type: 'Residential' },
  { id: 'p2', name: 'Cyber Plaza', type: 'Commercial' },
  { id: 'p3', name: 'Orchard Residences', type: 'Residential' },
];

const DEFAULT_PROJECT_TYPES = ['Residential', 'Commercial', 'Mixed'];

const DEFAULT_PEOPLE: Person[] = [
  { id: 'pe1', name: 'Rajesh Sharma', type: 'Executive', employeeId: 'SE-1045' },
  { id: 'pe2', name: 'Priyanka Sen', type: 'Executive', employeeId: 'SE-1082' },
  { id: 'pe3', name: 'Apex Realtors CP', type: 'Broker', employeeId: 'RERA-MUM1024' },
  { id: 'pe4', name: 'Blue Star Channel Partner', type: 'Broker', employeeId: 'RERA-MUM5041' },
];

const DEFAULT_PAYMENT_MODES = ['Bank Transfer', 'Cheque', 'UPI', 'Cash'];

const DEFAULT_ENTRIES: CommissionEntry[] = [
  {
    id: 'e1',
    projectId: 'p1',
    unitNo: 'A-402',
    customerName: 'Sanjay Dutt',
    bookingDate: '2026-07-02',
    agreementDate: '2026-07-10',
    propertyValue: 8000000, // ₹80 Lakhs
    bookingAmount: 500000,
    receivedAmount: 4000000, // 50% paid
    personId: 'pe1', // Rajesh Sharma
    commissionType: 'percentage',
    rateOrAmount: 2.0, // 2%
    bonusIncentive: 10000,
    commissionRule: 'Standard 2% internal executive payout',
    hasGst: false,
    tdsRate: 5,
    commissionCap: 150000,
    payments: [
      { id: 'py1', amount: 35000, date: '2026-07-11', mode: 'Bank Transfer' }
    ],
  },
  {
    id: 'e2',
    projectId: 'p2',
    unitNo: 'Office-12B',
    customerName: 'TechCorp Solutions',
    bookingDate: '2026-06-15',
    agreementDate: '2026-06-25',
    propertyValue: 15000000, // ₹1.5 Cr
    bookingAmount: 1000000,
    receivedAmount: 15000000, // 100% paid
    personId: 'pe3', // Apex Realtors
    commissionType: 'percentage',
    rateOrAmount: 3.0, // 3%
    bonusIncentive: 25000,
    commissionRule: 'Commercial channel partner premium incentive',
    hasGst: true, // 18% GST added
    tdsRate: 5,
    commissionCap: 400000,
    payments: [
      { id: 'py2', amount: 200000, date: '2026-06-28', mode: 'Bank Transfer' },
      { id: 'py3', amount: 200000, date: '2026-07-05', mode: 'Bank Transfer' }
    ],
  },
  {
    id: 'e3',
    projectId: 'p3',
    unitNo: 'Villa 5',
    customerName: 'Aishwarya Rai',
    bookingDate: '2026-05-10',
    agreementDate: '2026-05-20',
    propertyValue: 25000000, // ₹2.5 Cr
    bookingAmount: 2000000,
    receivedAmount: 5000000, // 20% paid
    personId: 'pe2', // Priyanka Sen
    commissionType: 'percentage',
    rateOrAmount: 1.5, // 1.5%
    bonusIncentive: 0,
    commissionRule: '1.5% executive base scale',
    hasGst: false,
    tdsRate: 5,
    payments: [],
  },
];

const INITIAL_FILTERS: FilterState = {
  projectId: 'ALL',
  executiveId: 'ALL',
  brokerId: 'ALL',
  startDate: '',
  endDate: '',
  status: 'ALL',
};

export default function App() {
  // --- APPLICATION STATES ---
  const [activeTab, setActiveTab] = useState<'dashboard' | 'bookings' | 'projects' | 'directory' | 'reports' | 'settings'>('dashboard');

  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem(STORAGE_PROJECTS);
    return saved ? JSON.parse(saved) : DEFAULT_PROJECTS;
  });

  const [projectTypes, setProjectTypes] = useState<string[]>(() => {
    const saved = localStorage.getItem(STORAGE_PROJECT_TYPES);
    return saved ? JSON.parse(saved) : DEFAULT_PROJECT_TYPES;
  });

  const [people, setPeople] = useState<Person[]>(() => {
    const saved = localStorage.getItem(STORAGE_PEOPLE);
    return saved ? JSON.parse(saved) : DEFAULT_PEOPLE;
  });

  const [paymentModes, setPaymentModes] = useState<string[]>(() => {
    const saved = localStorage.getItem(STORAGE_PAYMENT_MODES);
    return saved ? JSON.parse(saved) : DEFAULT_PAYMENT_MODES;
  });

  const [entries, setEntries] = useState<CommissionEntry[]>(() => {
    const saved = localStorage.getItem(STORAGE_ENTRIES);
    return saved ? JSON.parse(saved) : DEFAULT_ENTRIES;
  });

  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);

  // --- SETTINGS STATE WITH ROBUST SYSTEM DEFAULTS ---
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('re_sys_settings_v4');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn("Could not read stored settings, reverting to default rules", e);
      }
    }
    return {
      commissionRules: {
        categoryDefaults: {
          'Booking Commission': 2.0,
          'Referral Commission': 1.5,
          'Channel Partner Commission': 3.0,
          'Broker Commission': 2.5,
          'Incentive Payout': 4.0
        },
        stakeholderTypeDefaults: {
          'Sales Executive': 2.0,
          'Executive': 2.0,
          'Broker': 3.0,
          'Channel Partner': 3.0,
          'Consultant': 1.5,
          'Agent': 1.0,
          'Contractor': 0.5
        }
      },
      defaultTaxGstRate: 18,
      defaultTaxTdsRate: 5,
      defaultCommissionRate: 2.0,
      roles: [
        { role: 'Admin', description: 'Complete system config, database locks, settings override, and financial ledger read/write' },
        { role: 'Manager', description: 'Can add/view sales entries, manage directories, run financial sheets, but cannot alter tax/withholding structures' }
      ]
    };
  });

  const handleSaveSettings = (newSettings: any) => {
    setSettings(newSettings);
    localStorage.setItem('re_sys_settings_v4', JSON.stringify(newSettings));
  };

  // --- AUTOMATED SYNC TO LOCAL STORAGE ---
  useEffect(() => {
    localStorage.setItem(STORAGE_PROJECTS, JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PROJECT_TYPES, JSON.stringify(projectTypes));
  }, [projectTypes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PEOPLE, JSON.stringify(people));
  }, [people]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PAYMENT_MODES, JSON.stringify(paymentModes));
  }, [paymentModes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_ENTRIES, JSON.stringify(entries));
  }, [entries]);

  // --- MUTATION HANDLERS ---
  
  // Projects handlers
  const handleAddProject = (p: Omit<Project, 'id'>) => {
    const newProj: Project = {
      ...p,
      id: `p-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    setProjects([...projects, newProj]);
  };

  const handleUpdateProject = (updated: Project) => {
    setProjects(projects.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handleDeleteProject = (id: string) => {
    setProjects(projects.filter((p) => p.id !== id));
    // clean filters if deleted
    if (filters.projectId === id) {
      setFilters({ ...filters, projectId: 'ALL' });
    }
  };

  const handleAddProjectType = (newType: string) => {
    setProjectTypes([...projectTypes, newType]);
  };

  const handleDeleteProjectType = (typeToRemove: string) => {
    setProjectTypes(projectTypes.filter((t) => t !== typeToRemove));
  };

  // People Directory handlers
  const handleAddPerson = (p: Omit<Person, 'id'>) => {
    const newPerson: Person = {
      ...p,
      id: `pe-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    setPeople([...people, newPerson]);
  };

  const handleUpdatePerson = (updated: Person) => {
    setPeople(people.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handleDeletePerson = (id: string) => {
    setPeople(people.filter((p) => p.id !== id));
    // clean filters if deleted
    if (filters.executiveId === id) {
      setFilters({ ...filters, executiveId: 'ALL' });
    }
    if (filters.brokerId === id) {
      setFilters({ ...filters, brokerId: 'ALL' });
    }
  };

  // Payment Modes handlers
  const handleAddPaymentMode = (mode: string) => {
    setPaymentModes([...paymentModes, mode]);
  };

  const handleDeletePaymentMode = (modeToRemove: string) => {
    setPaymentModes(paymentModes.filter((m) => m !== modeToRemove));
  };

  // Commission Entries / Bookings handlers
  const handleAddEntry = (e: Omit<CommissionEntry, 'id'>) => {
    const newEntry: CommissionEntry = {
      ...e,
      id: `e-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    setEntries([newEntry, ...entries]);
  };

  const handleDeleteEntry = (id: string) => {
    setEntries(entries.filter((e) => e.id !== id));
  };

  const handleAddPayment = (entryId: string, pay: Omit<Payment, 'id'>) => {
    const newPayment: Payment = {
      ...pay,
      id: `py-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };

    setEntries(
      entries.map((entry) => {
        if (entry.id === entryId) {
          const payments = entry.payments ? [...entry.payments, newPayment] : [newPayment];
          return {
            ...entry,
            payments,
          };
        }
        return entry;
      })
    );
  };

  const handleDeletePayment = (entryId: string, paymentId: string) => {
    setEntries(
      entries.map((entry) => {
        if (entry.id === entryId) {
          const payments = entry.payments ? entry.payments.filter((p) => p.id !== paymentId) : [];
          return {
            ...entry,
            payments,
          };
        }
        return entry;
      })
    );
  };

  // Reset workspace to blank
  const handleResetWorkspace = () => {
    if (
      confirm(
        'Are you sure you want to completely reset your workspace? This will clear all logged projects, directories, and sales bookings.'
      )
    ) {
      setProjects([]);
      setProjectTypes(DEFAULT_PROJECT_TYPES);
      setPeople([]);
      setPaymentModes(DEFAULT_PAYMENT_MODES);
      setEntries([]);
      setFilters(INITIAL_FILTERS);
      setActiveTab('projects');
    }
  };

  // Restore sample mock dataset
  const handleRestoreSampleData = () => {
    if (
      confirm(
        'Load the pre-configured sample dataset? This will replace your current records with beautiful, comprehensive metrics for testing.'
      )
    ) {
      setProjects(DEFAULT_PROJECTS);
      setProjectTypes(DEFAULT_PROJECT_TYPES);
      setPeople(DEFAULT_PEOPLE);
      setPaymentModes(DEFAULT_PAYMENT_MODES);
      setEntries(DEFAULT_ENTRIES);
      setFilters(INITIAL_FILTERS);
      setActiveTab('dashboard');
    }
  };

  // --- LIVE FILTER CALCULATION ---
  const filteredEntries = entries.filter((entry) => {
    // 1. Project filter
    if (filters.projectId !== 'ALL' && entry.projectId !== filters.projectId) {
      return false;
    }

    // Category filter
    if (filters.category && filters.category !== 'ALL') {
      const entryCat = entry.category || 'Booking Commission';
      if (entryCat !== filters.category) {
        return false;
      }
    }

    // Find project context to get totalSaleValue helper
    const project = projects.find((p) => p.id === entry.projectId);

    // 2. Executive filter (if recipient matches)
    if (filters.executiveId !== 'ALL' && entry.personId !== filters.executiveId) {
      return false;
    }

    // 3. Broker filter (if recipient matches)
    if (filters.brokerId !== 'ALL' && entry.personId !== filters.brokerId) {
      return false;
    }

    // 4. Date Range filters (using booking date)
    if (filters.startDate && entry.bookingDate < filters.startDate) {
      return false;
    }
    if (filters.endDate && entry.bookingDate > filters.endDate) {
      return false;
    }

    // 5. Payment Status filter
    if (filters.status !== 'ALL') {
      const calc = calculateCommission(entry, project?.totalSaleValue || entry.propertyValue);
      if (calc.status !== filters.status) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-gray-800 font-sans flex flex-col antialiased selection:bg-blue-100 selection:text-blue-900">
      
      {/* 1. Header / Navigation rail */}
      <header className="bg-white border-b border-gray-100 shadow-3xs sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600 text-white rounded-xl shadow-xs">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-extrabold text-gray-900 text-sm tracking-tight sm:text-base">
                Commission Calculator
              </h1>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider leading-none">
                Real Estate Sales Commission Management System
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleRestoreSampleData}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50/70 hover:bg-blue-100/70 rounded-lg transition-all cursor-pointer border border-blue-100/40"
              title="Preload active metrics"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Load Sample Data</span>
            </button>
            <button
              onClick={handleResetWorkspace}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
              title="Clear all workspace inputs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset Workspace</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Top Accent Ribbon */}
      <div className="bg-blue-50/30 border-b border-blue-100/20 py-2.5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 font-medium text-blue-900">
            <Activity className="w-3.5 h-3.5 text-blue-600" />
            <span>Audit Level Ledger &bull; All technical terms mapped with short plain-English explanations</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-400 font-semibold bg-white border border-gray-100 shadow-3xs px-2.5 py-1 rounded-full text-[10px]">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Auto-saving to browser state
          </div>
        </div>
      </div>

      {/* 3. Primary Workspace Sub-navigation */}
      <div className="bg-white border-b border-gray-100 shadow-3xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 py-2 overflow-x-auto scrollbar-none">
            
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Overview Dashboard
            </button>

            <button
              onClick={() => setActiveTab('bookings')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'bookings'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <Coins className="w-4 h-4" />
              Sales & Bookings Ledger
            </button>

            <button
              onClick={() => setActiveTab('projects')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'projects'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <Building className="w-4 h-4" />
              Projects Portfolio
            </button>

            <button
              onClick={() => setActiveTab('directory')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'directory'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <Users className="w-4 h-4" />
              People Directory
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'reports'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <FileText className="w-4 h-4" />
              Financial Statements
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <Settings className="w-4 h-4" />
              Settings & Rule Engine
            </button>

          </div>
        </div>
      </div>

      {/* 4. Active Workspace Stage */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-7 space-y-6">
        
        {/* Render Global FilterBar on Dashboard and Reports screens */}
        {(activeTab === 'dashboard' || activeTab === 'reports') && (
          <FilterBar
            filters={filters}
            onFilterChange={setFilters}
            projects={projects}
            people={people}
            onResetFilters={() => setFilters(INITIAL_FILTERS)}
          />
        )}

        {/* Tab Module Renderer */}
        {activeTab === 'dashboard' && (
          <Dashboard
            entries={filteredEntries}
            projects={projects}
            people={people}
          />
        )}

        {activeTab === 'bookings' && (
          <BookingsList
            entries={entries} // bookings list manages its own full unfiltered records but displays everything
            projects={projects}
            people={people}
            paymentModes={paymentModes}
            onAddEntry={handleAddEntry}
            onDeleteEntry={handleDeleteEntry}
            onAddPayment={handleAddPayment}
            onDeletePayment={handleDeletePayment}
            onAddPaymentMode={handleAddPaymentMode}
            onDeletePaymentMode={handleDeletePaymentMode}
          />
        )}

        {activeTab === 'projects' && (
          <ProjectManager
            projects={projects}
            projectTypes={projectTypes}
            onAddProject={handleAddProject}
            onUpdateProject={handleUpdateProject}
            onDeleteProject={handleDeleteProject}
            onAddProjectType={handleAddProjectType}
            onDeleteProjectType={handleDeleteProjectType}
          />
        )}

        {activeTab === 'directory' && (
          <DirectoryManager
            people={people}
            entries={entries}
            projects={projects}
            onAddPerson={handleAddPerson}
            onUpdatePerson={handleUpdatePerson}
            onDeletePerson={handleDeletePerson}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsManager
            entries={filteredEntries} // reports update live in step with our global filters
            projects={projects}
            people={people}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsManager
            settings={settings}
            onSaveSettings={handleSaveSettings}
          />
        )}

      </main>

      {/* 5. Footer */}
      <footer className="bg-white border-t border-gray-100 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-400 font-semibold">
          <div className="flex items-center gap-1.5">
            <Landmark className="w-4 h-4 text-gray-300" />
            <span>Real Estate Sales Commission Management System &copy; {new Date().getFullYear()}</span>
          </div>
          <div className="flex gap-4">
            <span>Corporate Light Theme</span>
            <span>&bull;</span>
            <span>Financial Statements Excel & PDF Audits Enabled</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
