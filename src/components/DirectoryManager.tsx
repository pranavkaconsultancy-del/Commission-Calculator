import React, { useState } from 'react';
import { Person, PersonType } from '../types';
import { Plus, Trash2, Edit3, Save, X, Search, Users, ShieldAlert } from 'lucide-react';

interface DirectoryManagerProps {
  people: Person[];
  onAddPerson: (person: Omit<Person, 'id'>) => void;
  onUpdatePerson: (person: Person) => void;
  onDeletePerson: (id: string) => void;
}

export default function DirectoryManager({
  people,
  onAddPerson,
  onUpdatePerson,
  onDeletePerson,
}: DirectoryManagerProps) {
  const [activeTab, setActiveTab] = useState<PersonType>('Executive');
  const [name, setName] = useState('');
  const [idValue, setIdValue] = useState(''); // Employee ID or Broker RERA ID
  const [searchQuery, setSearchQuery] = useState('');
  
  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingIdValue, setEditingIdValue] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAddPerson({
      name: name.trim(),
      type: activeTab,
      employeeId: idValue.trim(),
    });
    setName('');
    setIdValue('');
  };

  const handleSaveEdit = (id: string) => {
    if (!editingName.trim()) return;
    onUpdatePerson({
      id,
      name: editingName.trim(),
      type: activeTab,
      employeeId: editingIdValue.trim(),
    });
    setEditingId(null);
  };

  const startEdit = (person: Person) => {
    setEditingId(person.id);
    setEditingName(person.name);
    setEditingIdValue(person.employeeId);
  };

  // Filter list
  const filteredPeople = people
    .filter((p) => p.type === activeTab)
    .filter(
      (p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.employeeId.toLowerCase().includes(searchQuery.toLowerCase())
    );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Add New Stakeholder Panel */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-5 h-fit space-y-4">
        <div>
          <h3 className="font-extrabold text-gray-900 text-sm">
            Add New {activeTab === 'Executive' ? 'Sales Executive' : 'Broker / CP'}
          </h3>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Register people in your directory once, and select them instantly on bookings.
          </p>
        </div>

        <form onSubmit={handleAdd} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              Full Name
            </label>
            <input
              type="text"
              required
              placeholder={activeTab === 'Executive' ? 'e.g., Rajesh Sharma' : 'e.g., Apex Realty Corp'}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 bg-gray-50 text-gray-800 font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              {activeTab === 'Executive' ? 'Employee ID' : 'Broker / CP ID (e.g., RERA Number)'}
            </label>
            <input
              type="text"
              placeholder={activeTab === 'Executive' ? 'e.g., SE-2045' : 'e.g., RERA-MUM10452'}
              value={idValue}
              onChange={(e) => setIdValue(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 bg-gray-50 text-gray-800 font-medium"
            />
            <p className="text-[10px] text-gray-400 font-semibold italic">
              * Used to uniquely identify transactions for tax/audits
            </p>
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add to Directory
          </button>
        </form>
      </div>

      {/* Directory Viewer / List */}
      <div className="lg:col-span-2 bg-white rounded-xl shadow-xs border border-gray-100 p-5 space-y-4">
        {/* Tab Selection */}
        <div className="flex items-center justify-between flex-wrap gap-3 border-b border-gray-100 pb-3">
          <div className="flex gap-2">
            <button
              onClick={() => {
                setActiveTab('Executive');
                setSearchQuery('');
                setEditingId(null);
              }}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'Executive'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              Sales Executives ({people.filter((p) => p.type === 'Executive').length})
            </button>
            <button
              onClick={() => {
                setActiveTab('Broker');
                setSearchQuery('');
                setEditingId(null);
              }}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'Broker'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              Brokers / Channel Partners ({people.filter((p) => p.type === 'Broker').length})
            </button>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-48">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search directory..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 bg-gray-50 focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-gray-700 font-medium"
            />
          </div>
        </div>

        {/* Stakeholders List */}
        {filteredPeople.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <Users className="w-8 h-8 text-gray-300 mx-auto" />
            <p className="text-xs text-gray-500 font-bold">No registered directory records found</p>
            <p className="text-[11px] text-gray-400">
              {searchQuery ? 'Try resetting your search query above.' : 'Add your first record using the left-side panel.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 max-h-110 overflow-y-auto pr-1">
            {filteredPeople.map((person) => {
              const isEditing = editingId === person.id;

              return (
                <div key={person.id} className="py-3 flex items-center justify-between gap-4">
                  {isEditing ? (
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">
                          Name
                        </label>
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs rounded-md border border-gray-200 bg-white text-gray-800 font-medium focus:outline-hidden"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">
                          {activeTab === 'Executive' ? 'Employee ID' : 'Broker ID / RERA Code'}
                        </label>
                        <input
                          type="text"
                          value={editingIdValue}
                          onChange={(e) => setEditingIdValue(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs rounded-md border border-gray-200 bg-white text-gray-800 font-medium focus:outline-hidden"
                        />
                      </div>
                      <div className="sm:col-span-2 flex items-center justify-end gap-2 pt-1 border-t border-gray-100 mt-1">
                        <button
                          onClick={() => setEditingId(null)}
                          className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md cursor-pointer"
                        >
                          <X className="w-3 h-3" /> Cancel
                        </button>
                        <button
                          onClick={() => handleSaveEdit(person.id)}
                          className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-md cursor-pointer"
                        >
                          <Save className="w-3 h-3" /> Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-0.5">
                        <h4 className="font-extrabold text-gray-900 text-xs flex items-center gap-1.5">
                          {person.name}
                        </h4>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-gray-400 font-bold tracking-wide bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                            ID: {person.employeeId || 'N/A'}
                          </span>
                          <span className="text-[10px] text-gray-400 font-semibold italic">
                            Registered {activeTab === 'Executive' ? 'Internal Executive' : 'External Channel Partner'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => startEdit(person)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit Details"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (
                              confirm(
                                `Are you sure you want to delete ${person.name} from the directory? Any linked commission payouts will remain, but directory linkage will be broken.`
                              )
                            ) {
                              onDeletePerson(person.id);
                            }
                          }}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
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
  );
}
