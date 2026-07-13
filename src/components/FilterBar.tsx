import React from 'react';
import { Project, Person, PaymentStatusType } from '../types';
import { Filter, RotateCcw, Calendar, Building, Users, CreditCard } from 'lucide-react';

export interface FilterState {
  projectId: string;
  executiveId: string;
  brokerId: string;
  startDate: string;
  endDate: string;
  status: string; // 'ALL' or PaymentStatusType
}

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  projects: Project[];
  people: Person[];
  onResetFilters: () => void;
}

export default function FilterBar({
  filters,
  onFilterChange,
  projects,
  people,
  onResetFilters,
}: FilterBarProps) {
  const executives = people.filter((p) => p.type === 'Executive');
  const brokers = people.filter((p) => p.type === 'Broker');

  const handleChange = (field: keyof FilterState, value: string) => {
    onFilterChange({
      ...filters,
      [field]: value,
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-4.5 space-y-3">
      <div className="flex items-center justify-between border-b border-gray-50 pb-2.5">
        <div className="flex items-center gap-2 text-gray-800 font-bold text-sm">
          <Filter className="w-4 h-4 text-blue-600" />
          <span>Filter Commission Records</span>
          <span className="text-xs text-gray-400 font-normal">
            (All statistics, charts, and reports on screen update live)
          </span>
        </div>
        <button
          onClick={onResetFilters}
          className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
          Reset Filters
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Project Filter */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
            <Building className="w-3 h-3" /> Project
          </label>
          <select
            value={filters.projectId}
            onChange={(e) => handleChange('projectId', e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 bg-gray-50 text-gray-800 font-medium cursor-pointer"
          >
            <option value="ALL">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Sales Executive Filter */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
            <Users className="w-3 h-3" /> Sales Executive
          </label>
          <select
            value={filters.executiveId}
            onChange={(e) => handleChange('executiveId', e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 bg-gray-50 text-gray-800 font-medium cursor-pointer"
          >
            <option value="ALL">All Executives</option>
            {executives.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} {e.employeeId ? `(${e.employeeId})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Broker / CP Filter */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
            <Users className="w-3 h-3" /> Broker / Channel Partner
          </label>
          <select
            value={filters.brokerId}
            onChange={(e) => handleChange('brokerId', e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 bg-gray-50 text-gray-800 font-medium cursor-pointer"
          >
            <option value="ALL">All Brokers / CPs</option>
            {brokers.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} {b.employeeId ? `(${b.employeeId})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Date Range Filters */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
            <Calendar className="w-3 h-3" /> Booking Date Range
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleChange('startDate', e.target.value)}
              className="w-full px-2 py-1.5 text-[11px] rounded-lg border border-gray-200 focus:outline-hidden bg-gray-50 text-gray-800 font-medium cursor-pointer"
              title="Start Date"
            />
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleChange('endDate', e.target.value)}
              className="w-full px-2 py-1.5 text-[11px] rounded-lg border border-gray-200 focus:outline-hidden bg-gray-50 text-gray-800 font-medium cursor-pointer"
              title="End Date"
            />
          </div>
        </div>

        {/* Payout Status Filter */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
            <CreditCard className="w-3 h-3" /> Payout Status
          </label>
          <select
            value={filters.status}
            onChange={(e) => handleChange('status', e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 bg-gray-50 text-gray-800 font-medium cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Partially Paid">Partially Paid</option>
            <option value="Paid">Paid</option>
          </select>
        </div>
      </div>
    </div>
  );
}
