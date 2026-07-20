import React, { useState } from 'react';
import { 
  Building2, Plus, Search, HelpCircle, Eye, Trash2, X, AlertCircle, ShoppingBag, 
  MapPin, User, ChevronDown, Check
} from 'lucide-react';
import { Property, Project, Customer, Sale } from '../types';
import { formatCurrency, formatNumber } from '../utils';

interface PropertiesViewProps {
  properties: Property[];
  projects: Project[];
  sales: Sale[];
  onSaveProperty: (property: Property) => Promise<void>;
  onSaveProject: (project: Project) => Promise<void>;
  userRole: string;
  darkMode: boolean;
}

export function PropertiesView({ 
  properties, projects, sales, onSaveProperty, onSaveProject, userRole, darkMode 
}: PropertiesViewProps) {
  // Sub-Navigation
  const [activeTab, setActiveTab] = useState<'flats' | 'customers'>('flats');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [projectFilter, setProjectFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal / Form state
  const [isPropertyModalOpen, setIsPropertyModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);

  // Property Form Fields
  const [formProjId, setFormProjId] = useState('');
  const [formTower, setFormTower] = useState('');
  const [formWing, setFormWing] = useState('');
  const [formFloor, setFormFloor] = useState('');
  const [formFlatNumber, setFormFlatNumber] = useState('');
  const [formArea, setFormArea] = useState<number>(1000);
  const [formPropType, setFormPropType] = useState('2BHK'); // 1BHK, 2BHK, 3BHK, Commercial, Penthouse
  const [formValue, setFormValue] = useState<number>(5000000);
  const [formStatus, setFormStatus] = useState<'Available' | 'Booked' | 'Sold'>('Available');

  // Project Form Fields
  const [newProjName, setNewProjName] = useState('');
  const [newProjArea, setNewProjArea] = useState('');
  const [newProjCity, setNewProjCity] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // 1. EXTRACT CUSTOMERS FROM SALES & EXPLICIT CUSTOMERS
  const uniqueCustomers: Customer[] = React.useMemo(() => {
    const customerMap: Record<string, Customer> = {};
    sales.forEach(s => {
      if (s.customer_id) {
        customerMap[s.customer_id] = {
          id: s.customer_id,
          name: s.customer_name || 'Awaiting Details',
          mobile: s.customer_mobile || 'N/A',
          created_at: s.created_at
        };
      }
    });
    return Object.values(customerMap);
  }, [sales]);

  // 2. FILTERS ON PROPERTIES
  const filteredProperties = properties.filter(p => {
    const matchesSearch = p.flat_number.includes(searchQuery) || 
                          p.tower.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.project_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProject = projectFilter === 'ALL' || p.project_id === projectFilter;
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchesSearch && matchesProject && matchesStatus;
  });

  const paginatedProperties = filteredProperties.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredProperties.length / itemsPerPage) || 1;

  // 3. FILTERED CUSTOMERS
  const filteredCustomers = uniqueCustomers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.mobile.includes(searchQuery)
  );

  // 4. SUBMIT PROPERTY
  const handleSaveProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formProjId) {
      setFormError('Select a Project first');
      return;
    }
    if (!formFlatNumber.trim()) {
      setFormError('Flat Number is required');
      return;
    }
    if (formValue <= 0) {
      setFormError('Property value must be greater than zero');
      return;
    }

    setSaveLoading(true);
    setFormError(null);

    const project = projects.find(p => p.id === formProjId);
    const newProperty: Property = {
      id: `PROP-${Math.floor(1000 + Math.random() * 9000)}`,
      project_id: formProjId,
      project_name: project ? project.name : 'Unknown Project',
      tower: formTower.trim() || 'Tower A',
      wing: formWing.trim() || 'Wing 1',
      floor: formFloor.trim() || 'Ground',
      flat_number: formFlatNumber.trim(),
      area_sqft: formArea,
      property_type: formPropType,
      property_value: formValue,
      status: formStatus,
      created_at: new Date().toISOString()
    };

    try {
      await onSaveProperty(newProperty);
      setIsPropertyModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save Flat');
    } finally {
      setSaveLoading(false);
    }
  };

  // 5. SUBMIT PROJECT
  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim()) {
      setFormError('Project Name is required');
      return;
    }
    if (!newProjArea.trim() || !newProjCity.trim()) {
      setFormError('Location (Area and City) is required');
      return;
    }

    setSaveLoading(true);
    setFormError(null);

    const newProject: Project = {
      id: `PRJ-${String(projects.length + 1).padStart(3, '0')}`,
      name: newProjName.trim(),
      area: newProjArea.trim(),
      city: newProjCity.trim(),
      created_at: new Date().toISOString()
    };

    try {
      await onSaveProject(newProject);
      setIsProjectModalOpen(false);
      // pre-fill property modal with this new project
      setFormProjId(newProject.id);
    } catch (err: any) {
      setFormError(err.message || 'Failed to create Project');
    } finally {
      setSaveLoading(false);
    }
  };

  const getCustomerSales = (custId: string) => {
    return sales.filter(s => s.customer_id === custId);
  };

  return (
    <div className="space-y-6">
      {/* Tab Selector */}
      <div className="flex border-b border-slate-200 dark:border-slate-700">
        <button
          onClick={() => { setActiveTab('flats'); setSelectedCustomer(null); setSearchQuery(''); }}
          className={`px-5 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
            activeTab === 'flats' 
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Building2 className="w-4 h-4" /> Flats & Inventory Sizer
        </button>
        <button
          onClick={() => { setActiveTab('customers'); setSelectedCustomer(null); setSearchQuery(''); }}
          className={`px-5 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
            activeTab === 'customers' 
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <User className="w-4 h-4" /> Customer Registry & Purchases
        </button>
      </div>

      {/* SEARCH AND FILTERS (COMMONLY WRAPPED) */}
      {activeTab === 'flats' && (
        <div className={`p-6 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Estate Inventory & Availability
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-500">Track and manage flats, commercial units, booking statuses, and floor plans.</p>
            </div>
            {userRole !== 'Broker' && (
              <div className="flex gap-2">
                <button
                  onClick={() => { setFormError(null); setIsProjectModalOpen(true); }}
                  className="px-3 py-2 text-xs font-bold border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-lg transition-colors"
                >
                  + Create Project
                </button>
                <button
                  onClick={() => { setFormError(null); setIsPropertyModalOpen(true); }}
                  className="px-3 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow transition-colors"
                >
                  + Add Flat / Property
                </button>
              </div>
            )}
          </div>

          {/* Table Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4">
            <div className="relative sm:col-span-2">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by flat number, tower, or project..."
                className={`w-full pl-9 pr-4 py-2 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                  darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              />
            </div>
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className={`px-3 py-2 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <option value="ALL">All Projects</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`px-3 py-2 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <option value="ALL">All Availability</option>
              <option value="Available">Available Only</option>
              <option value="Booked">Booked Units</option>
              <option value="Sold">Sold Units</option>
            </select>
          </div>

          {/* Properties Table */}
          <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className={`${darkMode ? 'bg-slate-900 text-slate-400' : 'bg-slate-50 text-slate-500'} font-bold`}>
                  <th className="p-3">Project / Building</th>
                  <th className="p-3">Flat Specifications</th>
                  <th className="p-3">Flat Area (Sqft)</th>
                  <th className="p-3">Base Property Value</th>
                  <th className="p-3">Availability Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {paginatedProperties.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">No Property Flats registered</td>
                  </tr>
                ) : (
                  paginatedProperties.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors">
                      <td className="p-3">
                        <div className="font-bold">{p.project_name}</div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {projects.find(proj => proj.id === p.project_id)?.area || 'Worli'}, {projects.find(proj => proj.id === p.project_id)?.city || 'Mumbai'}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {p.tower} • {p.wing} • {p.floor} Floor • <span className="text-blue-600 dark:text-blue-400 font-bold">Flat {p.flat_number}</span>
                        </div>
                        <div className="text-[10px] text-slate-400">Unit Type: {p.property_type}</div>
                      </td>
                      <td className="p-3 font-mono font-medium">{formatNumber(p.area_sqft)} sq.ft.</td>
                      <td className="p-3 font-mono font-bold text-slate-800 dark:text-slate-100">{formatCurrency(p.property_value)}</td>
                      <td className="p-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          p.status === 'Available' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                          p.status === 'Booked' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                          'bg-blue-50 text-blue-800 border border-blue-200'
                        }`}>
                          <span className={`w-1 h-1 rounded-full ${
                            p.status === 'Available' ? 'bg-emerald-500' : p.status === 'Booked' ? 'bg-amber-500 animate-pulse' : 'bg-blue-500'
                          }`} />
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-4 text-xs text-slate-500">
              <p>Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredProperties.length)} of {filteredProperties.length} units</p>
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

      {/* CUSTOMERS VIEW TAB */}
      {activeTab === 'customers' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Customers Directory List (left side) */}
          <div className={`md:col-span-1 p-5 rounded-xl border flex flex-col gap-4 ${
            darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider">Customer Directory</h3>
              <p className="text-[10px] text-slate-400">Total customers connected to verified purchases.</p>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search customers..."
                className={`w-full pl-9 pr-3 py-2 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                  darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              />
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto max-h-[350px]">
              {filteredCustomers.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">No active customers found</div>
              ) : (
                filteredCustomers.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCustomer(c)}
                    className={`w-full text-left p-3 rounded-lg border transition-all text-xs ${
                      selectedCustomer?.id === c.id 
                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20' 
                        : 'border-slate-100 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900/40'
                    }`}
                  >
                    <div className="font-bold">{c.name}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Mobile: {c.mobile}</div>
                    <div className="text-[9px] text-blue-600 mt-1 font-semibold">{getCustomerSales(c.id).length} Active Purchases</div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Customer History Log (right side) */}
          <div className={`md:col-span-2 p-5 rounded-xl border ${
            darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            {selectedCustomer ? (() => {
              const customerSales = getCustomerSales(selectedCustomer.id);
              const totalSpent = customerSales.reduce((sum, s) => sum + s.sale_amount, 0);
              return (
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b pb-3 border-slate-100 dark:border-slate-700">
                    <div>
                      <h3 className="text-sm font-black uppercase text-blue-600 dark:text-blue-400">Customer Purchase Record</h3>
                      <h4 className="text-lg font-black mt-0.5">{selectedCustomer.name}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">Contact: {selectedCustomer.mobile}</p>
                    </div>
                    <div className="text-right p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl border border-blue-100 dark:border-blue-900">
                      <p className="text-[10px] uppercase font-bold text-slate-400">Aggregate Property Investment</p>
                      <h3 className="text-base font-black text-blue-600 dark:text-blue-400 mt-0.5">{formatCurrency(totalSpent)}</h3>
                    </div>
                  </div>

                  <h4 className="font-extrabold uppercase text-slate-400 text-xs">Acquired Real Estate Units</h4>
                  <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className={`${darkMode ? 'bg-slate-900 text-slate-400' : 'bg-slate-50 text-slate-500'} font-bold`}>
                          <th className="p-3">Booking Date</th>
                          <th className="p-3">Project / Building</th>
                          <th className="p-3">Flat Number</th>
                          <th className="p-3">Acquisition Value</th>
                          <th className="p-3">Authorized Broker</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {customerSales.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-4 text-center text-slate-400">No purchases found for this customer record</td>
                          </tr>
                        ) : (
                          customerSales.map(s => (
                            <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                              <td className="p-3">{s.booking_date}</td>
                              <td className="p-3 font-semibold">{s.project_name}</td>
                              <td className="p-3 font-bold text-blue-600">{s.flat_number}</td>
                              <td className="p-3 font-mono font-bold text-slate-800 dark:text-slate-100">{formatCurrency(s.sale_amount)}</td>
                              <td className="p-3 text-slate-500">{s.broker_name || 'Direct / Independent'}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })() : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
                <ShoppingBag className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
                <h4 className="font-bold text-slate-400">No Customer Selected</h4>
                <p className="text-xs max-w-xs mt-1">Select a customer from the directory to review their purchase logs and connected transaction brokers.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- ADD PROPERTY MODAL FORM --- */}
      {isPropertyModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSaveProperty} className={`w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border text-xs flex flex-col max-h-[90vh] ${
            darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/30">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider">Add Property Flat Unit</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Incorporate new commercial or residential apartments to the system inventory.</p>
              </div>
              <button type="button" onClick={() => setIsPropertyModalOpen(false)} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              {formError && (
                <div className="p-3 bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 rounded-lg flex items-center gap-2 border border-rose-200 dark:border-rose-800">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="font-semibold">{formError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="font-bold text-slate-400">Select Project *</label>
                <select
                  required
                  value={formProjId}
                  onChange={(e) => setFormProjId(e.target.value)}
                  className={`w-full p-2 rounded-lg border focus:outline-none ${
                    darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <option value="">-- Choose Project --</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-400">Tower/Building Name</label>
                  <input
                    type="text"
                    value={formTower}
                    onChange={(e) => setFormTower(e.target.value)}
                    placeholder="e.g. Tower A"
                    className={`w-full p-2 rounded-lg border focus:outline-none ${
                      darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-400">Wing</label>
                  <input
                    type="text"
                    value={formWing}
                    onChange={(e) => setFormWing(e.target.value)}
                    placeholder="e.g. Wing 2"
                    className={`w-full p-2 rounded-lg border focus:outline-none ${
                      darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-400">Floor</label>
                  <input
                    type="text"
                    value={formFloor}
                    onChange={(e) => setFormFloor(e.target.value)}
                    placeholder="e.g. 14th"
                    className={`w-full p-2 rounded-lg border focus:outline-none ${
                      darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-400">Flat/Room Number *</label>
                  <input
                    type="text"
                    required
                    value={formFlatNumber}
                    onChange={(e) => setFormFlatNumber(e.target.value)}
                    placeholder="e.g. 1402"
                    className={`w-full p-2 rounded-lg border focus:outline-none ${
                      darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-400">Area (Sqft)</label>
                  <input
                    type="number"
                    min={100}
                    value={formArea}
                    onChange={(e) => setFormArea(Number(e.target.value))}
                    className={`w-full p-2 rounded-lg border focus:outline-none ${
                      darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-400">Property Type</label>
                  <input
                    type="text"
                    value={formPropType}
                    onChange={(e) => setFormPropType(e.target.value)}
                    placeholder="e.g. 3BHK, Commercial, Penthouse"
                    className={`w-full p-2 rounded-lg border focus:outline-none ${
                      darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-400">Base Property Value (₹) *</label>
                  <input
                    type="number"
                    min={100000}
                    required
                    value={formValue}
                    onChange={(e) => setFormValue(Number(e.target.value))}
                    className={`w-full p-2 rounded-lg border focus:outline-none ${
                      darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-400">Initial Status</label>
                  <select
                    value={formStatus}
                    onChange={(e: any) => setFormStatus(e.target.value)}
                    className={`w-full p-2 rounded-lg border focus:outline-none ${
                      darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    <option value="Available">Available</option>
                    <option value="Booked">Booked</option>
                    <option value="Sold">Sold</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3 bg-slate-50/50 dark:bg-slate-900/30">
              <button type="button" onClick={() => setIsPropertyModalOpen(false)} className="px-4 py-2 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg">Cancel</button>
              <button type="submit" disabled={saveLoading} className="px-5 py-2 font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow">
                {saveLoading ? 'Saving...' : 'Add Property'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- ADD PROJECT MODAL FORM --- */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSaveProject} className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border text-xs flex flex-col max-h-[90vh] ${
            darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/30">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider">Create New Real Estate Project</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Define project branding, location coordinates, and cities.</p>
              </div>
              <button type="button" onClick={() => setIsProjectModalOpen(false)} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 rounded-lg flex items-center gap-2 border border-rose-200 dark:border-rose-800">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="font-semibold">{formError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="font-bold text-slate-400">Project Name *</label>
                <input
                  type="text"
                  required
                  value={newProjName}
                  onChange={(e) => setNewProjName(e.target.value)}
                  placeholder="e.g. Skyline Heights"
                  className={`w-full p-2 rounded-lg border focus:outline-none ${
                    darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-400">Area / Location Name *</label>
                  <input
                    type="text"
                    required
                    value={newProjArea}
                    onChange={(e) => setNewProjArea(e.target.value)}
                    placeholder="e.g. Worli"
                    className={`w-full p-2 rounded-lg border focus:outline-none ${
                      darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-400">City Name *</label>
                  <input
                    type="text"
                    required
                    value={newProjCity}
                    onChange={(e) => setNewProjCity(e.target.value)}
                    placeholder="e.g. Mumbai"
                    className={`w-full p-2 rounded-lg border focus:outline-none ${
                      darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3 bg-slate-50/50 dark:bg-slate-900/30">
              <button type="button" onClick={() => setIsProjectModalOpen(false)} className="px-4 py-2 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg">Cancel</button>
              <button type="submit" disabled={saveLoading} className="px-5 py-2 font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow">
                {saveLoading ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
