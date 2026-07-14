import React, { useState } from 'react';
import { Person, PersonType, CommissionEntry, Project } from '../types';
import { calculateCommission, formatCurrency } from '../utils';
import {
  Plus,
  Trash2,
  Edit3,
  Save,
  X,
  Search,
  Users,
  ShieldAlert,
  Mail,
  Phone,
  Tag,
  Briefcase,
  FileText,
  Clock,
  CheckCircle2,
  TrendingUp,
  Receipt,
  User,
  ExternalLink
} from 'lucide-react';

interface DirectoryManagerProps {
  people: Person[];
  entries: CommissionEntry[];
  projects: Project[];
  onAddPerson: (person: Omit<Person, 'id'>) => void;
  onUpdatePerson: (person: Person) => void;
  onDeletePerson: (id: string) => void;
}

export default function DirectoryManager({
  people,
  entries,
  projects,
  onAddPerson,
  onUpdatePerson,
  onDeletePerson,
}: DirectoryManagerProps) {
  // Directory filter: "ALL" or specific PersonType
  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Form states for Add Stakeholder
  const [name, setName] = useState('');
  const [stakeholderType, setStakeholderType] = useState<PersonType>('Channel Partner');
  const [idValue, setIdValue] = useState(''); // Employee ID or RERA ID
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingType, setEditingType] = useState<PersonType>('Channel Partner');
  const [editingIdValue, setEditingIdValue] = useState('');
  const [editingEmail, setEditingEmail] = useState('');
  const [editingPhone, setEditingPhone] = useState('');
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  // Selected stakeholder for profile pop-up modal
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  // Form Validation
  const validateForm = (formName: string, formType: PersonType) => {
    const newErrors: Record<string, string> = {};
    if (!formName.trim()) {
      newErrors.name = 'This field is required';
    }
    return newErrors;
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const formErrors = validateForm(name, stakeholderType);
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }
    
    onAddPerson({
      name: name.trim(),
      type: stakeholderType,
      employeeId: idValue.trim(),
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
    });

    // Reset Form
    setName('');
    setIdValue('');
    setEmail('');
    PhoneReset();
    setErrors({});
  };

  const PhoneReset = () => {
    setPhone('');
  };

  const handleSaveEdit = (id: string) => {
    const formErrors = validateForm(editingName, editingType);
    if (Object.keys(formErrors).length > 0) {
      setEditErrors(formErrors);
      return;
    }

    onUpdatePerson({
      id,
      name: editingName.trim(),
      type: editingType,
      employeeId: editingIdValue.trim(),
      email: editingEmail.trim() || undefined,
      phone: editingPhone.trim() || undefined,
    });
    setEditingId(null);
    setEditErrors({});
  };

  const startEdit = (person: Person, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid opening profile view
    setEditingId(person.id);
    setEditingName(person.name);
    setEditingType(person.type);
    setEditingIdValue(person.employeeId || '');
    setEditingEmail(person.email || '');
    setEditingPhone(person.phone || '');
    setEditErrors({});
  };

  const cancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
    setEditErrors({});
  };

  // Types list
  const stakeholderTypes: PersonType[] = [
    'Channel Partner',
    'Broker',
    'Sales Executive',
    'Consultant',
    'Agent',
    'Contractor'
  ];

  // Map stakeholder type to badge color
  const getTypeBadgeStyles = (type: string) => {
    switch (type) {
      case 'Sales Executive':
      case 'Executive':
        return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'Channel Partner':
        return 'bg-purple-50 text-purple-700 border-purple-100';
      case 'Broker':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'Agent':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'Contractor':
        return 'bg-red-50 text-red-700 border-red-100';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-100';
    }
  };

  // Filter list
  const filteredPeople = people
    .filter((p) => {
      if (activeFilter === 'ALL') return true;
      if (activeFilter === 'Executive') return p.type === 'Executive' || p.type === 'Sales Executive';
      return p.type === activeFilter;
    })
    .filter(
      (p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.employeeId && p.employeeId.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.email && p.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.phone && p.phone.toLowerCase().includes(searchQuery.toLowerCase()))
    );

  // Profile calculations helper
  const getStakeholderStats = (personId: string) => {
    const personEntries = entries.filter((e) => e.personId === personId);
    
    let totalSales = personEntries.length;
    let earnedCommission = 0;
    let paidCommission = 0;
    let pendingCommission = 0;

    const bookingHistory = personEntries.map((entry) => {
      const proj = projects.find((p) => p.id === entry.projectId);
      const calc = calculateCommission(entry, entry.propertyValue);
      
      earnedCommission += calc.netCommission;
      paidCommission += calc.totalPaid;
      pendingCommission += calc.pendingAmount;

      return {
        entry,
        project: proj,
        calc,
      };
    });

    return {
      totalSales,
      earnedCommission,
      paidCommission,
      pendingCommission,
      bookingHistory,
    };
  };

  const activeProfile = selectedProfileId ? people.find((p) => p.id === selectedProfileId) : null;
  const profileStats = activeProfile ? getStakeholderStats(activeProfile.id) : null;

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="bg-white p-4.5 rounded-xl border border-gray-100 shadow-3xs flex items-center justify-between">
        <div>
          <h2 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
            <Users className="text-blue-600 w-4 h-4" /> CRM Stakeholder Directory
          </h2>
          <p className="text-[11px] text-gray-400">
            Maintain high-fidelity contact records and audit performance stats for internal sales teams and external brokers.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Register New Stakeholder Form */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-5 h-fit space-y-4">
          <div>
            <h3 className="font-extrabold text-gray-900 text-xs uppercase tracking-wider text-blue-600">
              Register Stakeholder
            </h3>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Add contact detail presets to quickly map them into sales ledger logs.
            </p>
          </div>

          <form onSubmit={handleAdd} className="space-y-3.5">
            
            {/* Stakeholder Type selection */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 block">Stakeholder Classification</label>
              <select
                value={stakeholderType}
                onChange={(e) => setStakeholderType(e.target.value as PersonType)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:ring-1 focus:ring-blue-500 bg-gray-50 text-gray-800 font-medium cursor-pointer"
              >
                {stakeholderTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Name */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 block">Full Legal Name</label>
              <input
                type="text"
                placeholder="e.g., Rajesh Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full px-3 py-2 text-xs rounded-lg border focus:ring-1 focus:ring-blue-500 bg-gray-50 text-gray-800 font-medium ${
                  errors.name ? 'border-red-300' : 'border-gray-200'
                }`}
              />
              {errors.name && (
                <p className="text-[10px] text-red-500 font-bold">{errors.name}</p>
              )}
            </div>

            {/* Employee/Broker ID */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 block">
                Official Identifier ID (Employee Code / RERA No.)
              </label>
              <input
                type="text"
                placeholder="e.g., CP-RERA-MUM1024"
                value={idValue}
                onChange={(e) => setIdValue(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:ring-1 focus:ring-blue-500 bg-gray-50 text-gray-800 font-medium"
              />
            </div>

            {/* Email Address */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 block">Email Address (Optional)</label>
              <input
                type="email"
                placeholder="e.g., partner@realty.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:ring-1 focus:ring-blue-500 bg-gray-50 text-gray-800 font-medium"
              />
            </div>

            {/* Phone Number */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 block">Phone Number (Optional)</label>
              <input
                type="tel"
                placeholder="e.g., 9820098200"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:ring-1 focus:ring-blue-500 bg-gray-50 text-gray-800 font-medium"
              />
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-lg shadow-xs transition-colors cursor-pointer mt-2"
            >
              <Plus className="w-3.5 h-3.5" />
              Save Stakeholder Preset
            </button>
          </form>
        </div>

        {/* Right Column: Registered Directory Ledger */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-xs border border-gray-100 p-5 space-y-4">
          
          {/* Tabs Filter Row */}
          <div className="flex items-center justify-between flex-wrap gap-3 border-b border-gray-100 pb-3">
            <div className="flex gap-1 overflow-x-auto scrollbar-none py-1 max-w-full">
              <button
                onClick={() => setActiveFilter('ALL')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  activeFilter === 'ALL'
                    ? 'bg-blue-600 text-white shadow-3xs'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                All Directory ({people.length})
              </button>
              {stakeholderTypes.map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveFilter(t)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    activeFilter === t
                      ? 'bg-blue-600 text-white shadow-3xs'
                      : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  {t} ({people.filter((p) => p.type === t || (t === 'Sales Executive' && p.type === 'Executive')).length})
                </button>
              ))}
            </div>

            {/* Quick Directory Search bar */}
            <div className="relative w-full sm:w-48">
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search database..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 bg-gray-50 focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-gray-700 font-medium"
              />
            </div>
          </div>

          {/* Directory Records Grid/List */}
          {filteredPeople.length === 0 ? (
            <div className="py-16 text-center space-y-2.5">
              <Users className="w-9 h-9 text-gray-300 mx-auto" />
              <p className="text-xs text-gray-500 font-bold">No active stakeholder directory entries found</p>
              <p className="text-[11px] text-gray-400">
                {searchQuery ? 'Try clearing your search filters.' : 'Register a new stakeholder using the sidebar.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 max-h-120 overflow-y-auto pr-1">
              {filteredPeople.map((person) => {
                const isEditing = editingId === person.id;
                const stats = getStakeholderStats(person.id);

                return (
                  <div
                    key={person.id}
                    onClick={() => {
                      if (!isEditing) setSelectedProfileId(person.id);
                    }}
                    className={`py-3.5 px-3 flex items-center justify-between gap-4 transition-colors rounded-xl border border-transparent ${
                      isEditing ? '' : 'hover:bg-blue-50/40 cursor-pointer group'
                    }`}
                  >
                    {isEditing ? (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50/80 p-3.5 rounded-xl border border-gray-150"
                      >
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">
                            Classification Type
                          </label>
                          <select
                            value={editingType}
                            onChange={(e) => setEditingType(e.target.value as PersonType)}
                            className="w-full px-2.5 py-1.5 text-xs rounded-md border border-gray-200 bg-white text-gray-800 font-medium focus:outline-hidden"
                          >
                            {stakeholderTypes.map((t) => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">
                            Full Legal Name
                          </label>
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs rounded-md border border-gray-200 bg-white text-gray-800 font-medium focus:outline-hidden"
                          />
                          {editErrors.name && (
                            <span className="text-[10px] text-red-500 font-bold">{editErrors.name}</span>
                          )}
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">
                            Identifier ID
                          </label>
                          <input
                            type="text"
                            value={editingIdValue}
                            onChange={(e) => setEditingIdValue(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs rounded-md border border-gray-200 bg-white text-gray-800 font-medium focus:outline-hidden"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">
                            Email Address
                          </label>
                          <input
                            type="email"
                            value={editingEmail}
                            onChange={(e) => setEditingEmail(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs rounded-md border border-gray-200 bg-white text-gray-800 font-medium focus:outline-hidden"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">
                            Phone Number
                          </label>
                          <input
                            type="tel"
                            value={editingPhone}
                            onChange={(e) => setEditingPhone(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs rounded-md border border-gray-200 bg-white text-gray-800 font-medium focus:outline-hidden"
                          />
                        </div>

                        <div className="sm:col-span-2 flex items-center justify-end gap-2 pt-2 border-t border-gray-100 mt-1">
                          <button
                            onClick={cancelEdit}
                            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md cursor-pointer"
                          >
                            <X className="w-3 h-3" /> Cancel
                          </button>
                          <button
                            onClick={() => handleSaveEdit(person.id)}
                            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-md cursor-pointer"
                          >
                            <Save className="w-3 h-3" /> Save Presets
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-extrabold text-gray-900 text-xs">
                              {person.name}
                            </h4>
                            <span className={`px-2 py-0.5 text-[9px] font-bold border rounded-md tracking-wider ${getTypeBadgeStyles(person.type)}`}>
                              {person.type === 'Executive' ? 'Sales Executive' : person.type}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-gray-400 font-semibold">
                            {person.employeeId && (
                              <span className="font-mono bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                                ID: {person.employeeId}
                              </span>
                            )}
                            {person.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3" /> {person.email}
                              </span>
                            )}
                            {person.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" /> {person.phone}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                          
                          {/* Mini Stats helper labels */}
                          <div className="text-right hidden md:block mr-2 text-[10px]">
                            <div className="text-gray-400 font-bold uppercase tracking-wider leading-none">Net Earned</div>
                            <div className="font-extrabold text-gray-800 mt-1 leading-none">{formatCurrency(stats.earnedCommission)}</div>
                          </div>

                          <button
                            onClick={(e) => startEdit(person, e)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Details"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (
                                confirm(
                                  `Are you sure you want to delete ${person.name} from the directory? Linked payouts remain untouched, but directory selection presets are removed.`
                                )
                              ) {
                                onDeletePerson(person.id);
                              }
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Profile Detail Pop-up Modal */}
      {selectedProfileId && activeProfile && profileStats && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-xs flex items-center justify-center z-100 p-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-2xl max-w-2xl w-full p-6 relative animate-in fade-in zoom-in duration-150 space-y-5">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-gray-900 text-sm">
                    {activeProfile.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`px-2 py-0.5 text-[9px] font-bold border rounded-md uppercase tracking-wider ${getTypeBadgeStyles(activeProfile.type)}`}>
                      {activeProfile.type === 'Executive' ? 'Sales Executive' : activeProfile.type}
                    </span>
                    {activeProfile.employeeId && (
                      <span className="text-[10px] text-gray-400 font-mono">
                        Identifier: {activeProfile.employeeId}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedProfileId(null)}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Profile Statistics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              
              <div className="bg-gray-50 border border-gray-100 p-3 rounded-xl text-center">
                <span className="text-[9px] text-gray-400 font-bold uppercase block">Booked Sales</span>
                <span className="text-sm font-extrabold text-gray-900 block mt-1">{profileStats.totalSales} deals</span>
                <span className="text-[9px] text-gray-400 block mt-0.5">Mapped entries</span>
              </div>

              <div className="bg-blue-50/40 border border-blue-100/30 p-3 rounded-xl text-center">
                <span className="text-[9px] text-blue-500 font-bold uppercase block">Earned Comm</span>
                <span className="text-sm font-extrabold text-blue-600 block mt-1">
                  {formatCurrency(profileStats.earnedCommission)}
                </span>
                <span className="text-[9px] text-blue-400 block mt-0.5">Eligible commission</span>
              </div>

              <div className="bg-emerald-50/40 border border-emerald-100/30 p-3 rounded-xl text-center">
                <span className="text-[9px] text-emerald-500 font-bold uppercase block">Disbursed Paid</span>
                <span className="text-sm font-extrabold text-emerald-600 block mt-1">
                  {formatCurrency(profileStats.paidCommission)}
                </span>
                <span className="text-[9px] text-emerald-400 block mt-0.5">Cleared payout cash</span>
              </div>

              <div className="bg-amber-50/40 border border-amber-100/30 p-3 rounded-xl text-center">
                <span className="text-[9px] text-amber-500 font-bold uppercase block">Pending Due</span>
                <span className="text-sm font-extrabold text-amber-600 block mt-1">
                  {formatCurrency(profileStats.pendingCommission)}
                </span>
                <span className="text-[9px] text-amber-400 block mt-0.5">Outstanding backlog</span>
              </div>

            </div>

            {/* Contact details */}
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex flex-wrap items-center justify-around gap-4 text-xs text-gray-700 font-medium">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-blue-600" />
                <span>Email: <strong className="text-gray-900">{activeProfile.email || 'N/A'}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-blue-600" />
                <span>Phone: <strong className="text-gray-900">{activeProfile.phone || 'N/A'}</strong></span>
              </div>
            </div>

            {/* Ledger table */}
            <div className="space-y-2">
              <h4 className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-blue-600" /> Linked Sales Bookings History
              </h4>
              
              {profileStats.bookingHistory.length === 0 ? (
                <div className="p-6 text-center text-xs text-gray-400 font-semibold bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  No active sales bookings mapped to this stakeholder yet.
                </div>
              ) : (
                <div className="overflow-x-auto max-h-44 border border-gray-100 rounded-xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-gray-50 text-[10px] text-gray-400 font-bold uppercase border-b border-gray-100">
                        <th className="py-2 px-3">Project / Unit</th>
                        <th className="py-2 px-3 text-right">Property Val</th>
                        <th className="py-2 px-3 text-right">Net Comm</th>
                        <th className="py-2 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {profileStats.bookingHistory.map(({ entry, project, calc }) => (
                        <tr key={entry.id} className="hover:bg-gray-50/50">
                          <td className="py-2 px-3 font-semibold text-gray-800">
                            <div>{project?.name || 'Deleted Project'}</div>
                            <div className="text-[10px] text-gray-400">Unit {entry.unitNo}</div>
                          </td>
                          <td className="py-2 px-3 text-right text-gray-700 font-medium">
                            {formatCurrency(entry.propertyValue)}
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-gray-900">
                            {formatCurrency(calc.netCommission)}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span className={`inline-block px-1.5 py-0.5 text-[8px] font-bold rounded-sm border ${
                              calc.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                              calc.status === 'Partially Paid' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                              'bg-amber-50 text-amber-700 border-amber-100'
                            }`}>
                              {calc.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Close button */}
            <div className="flex items-center justify-end pt-3 border-t border-gray-100">
              <button
                onClick={() => setSelectedProfileId(null)}
                className="px-4.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Close Profile
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
