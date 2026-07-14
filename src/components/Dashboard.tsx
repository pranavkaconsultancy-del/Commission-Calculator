import React, { useState } from 'react';
import { CommissionEntry, Project, Person } from '../types';
import { calculateCommission, formatCurrency } from '../utils';
import {
  TrendingUp,
  Award,
  Clock,
  CheckCircle,
  Building,
  Users,
  Calendar,
  AlertCircle,
  PiggyBank,
  CheckCircle2,
  Wallet,
  Receipt,
  Eye,
  X,
  FileText,
  BadgeAlert,
  Percent,
  Layers,
  Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from 'recharts';

interface DashboardProps {
  entries: CommissionEntry[];
  projects: Project[];
  people: Person[];
}

export default function Dashboard({ entries, projects, people }: DashboardProps) {
  // Detail overlay state
  const [selectedEntry, setSelectedEntry] = useState<CommissionEntry | null>(null);

  // 1. Calculate live high-precision metrics for the filtered entries
  const metrics = entries.map((entry) => {
    const project = projects.find((p) => p.id === entry.projectId);
    const person = people.find((p) => p.id === entry.personId);
    const calc = calculateCommission(entry, entry.propertyValue);
    return {
      entry,
      project,
      person,
      calc,
    };
  });

  const totalCommissionValue = metrics.reduce((sum, m) => sum + m.calc.netCommission, 0);
  const totalPaidValue = metrics.reduce((sum, m) => sum + m.calc.totalPaid, 0);
  const totalPendingValue = metrics.reduce((sum, m) => sum + m.calc.pendingAmount, 0);

  // Determine current month & year (based on local metadata 2026)
  const today = new Date();
  const currentMonthStr = today.toISOString().substring(0, 7); // "2026-07"

  const thisMonthCommission = metrics
    .filter((m) => m.entry.bookingDate.startsWith(currentMonthStr))
    .reduce((sum, m) => sum + m.calc.netCommission, 0);

  // --- CHART 1: Monthly Commission Trend ---
  const monthlyDataMap: Record<string, { monthKey: string; name: string; commission: number }> = {};
  metrics.forEach((m) => {
    if (!m.entry.bookingDate) return;
    const date = new Date(m.entry.bookingDate);
    if (isNaN(date.getTime())) return;
    const year = date.getFullYear();
    const monthIndex = date.getMonth();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const label = `${monthNames[monthIndex]} ${year}`;
    const key = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
    
    if (!monthlyDataMap[key]) {
      monthlyDataMap[key] = { monthKey: key, name: label, commission: 0 };
    }
    monthlyDataMap[key].commission += m.calc.netCommission;
  });
  const monthlyChartData = Object.values(monthlyDataMap).sort((a, b) => a.monthKey.localeCompare(b.monthKey));

  // --- CHART 2: Project-wise Commission ---
  const projectDataMap: Record<string, { name: string; commission: number; paid: number; pending: number }> = {};
  metrics.forEach((m) => {
    const projName = m.project?.name || 'Unknown Project';
    if (!projectDataMap[projName]) {
      projectDataMap[projName] = { name: projName, commission: 0, paid: 0, pending: 0 };
    }
    projectDataMap[projName].commission += m.calc.netCommission;
    projectDataMap[projName].paid += m.calc.totalPaid;
    projectDataMap[projName].pending += m.calc.pendingAmount;
  });
  const projectChartData = Object.values(projectDataMap).sort((a, b) => b.commission - a.commission);

  // --- CHART 3: Sales Executive Performance Rank ---
  const execDataMap: Record<string, { name: string; commission: number }> = {};
  metrics.forEach((m) => {
    if (m.person?.type === 'Executive' || m.person?.type === 'Sales Executive') {
      const name = m.person.name;
      if (!execDataMap[name]) {
        execDataMap[name] = { name, commission: 0 };
      }
      execDataMap[name].commission += m.calc.netCommission;
    }
  });
  const execChartData = Object.values(execDataMap).sort((a, b) => b.commission - a.commission).slice(0, 10);

  // --- CHART 4: Paid vs Pending Pie Chart ---
  const paidVsPendingData = [
    { name: 'Paid Commission', value: parseFloat(totalPaidValue.toFixed(2)), color: '#10B981' }, // emerald-500
    { name: 'Pending Commission', value: parseFloat(totalPendingValue.toFixed(2)), color: '#F59E0B' }, // amber-500
  ];

  // --- NEW CHART 5: Commission by Category (Pie Chart) ---
  const categoryDataMap: Record<string, number> = {};
  metrics.forEach((m) => {
    const cat = m.entry.category || 'Booking Commission';
    categoryDataMap[cat] = (categoryDataMap[cat] || 0) + m.calc.netCommission;
  });
  const categoryColors = ['#2563EB', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#14B8A6'];
  const categoryChartData = Object.entries(categoryDataMap).map(([name, value], idx) => ({
    name,
    value: parseFloat(value.toFixed(2)),
    color: categoryColors[idx % categoryColors.length]
  })).sort((a, b) => b.value - a.value);

  // --- NEW CHART 6: Stakeholder-wise Commission Rank (Bar Chart) ---
  const stakeholderDataMap: Record<string, number> = {};
  metrics.forEach((m) => {
    const name = m.person?.name || 'Unknown Stakeholder';
    stakeholderDataMap[name] = (stakeholderDataMap[name] || 0) + m.calc.netCommission;
  });
  const stakeholderChartData = Object.entries(stakeholderDataMap).map(([name, commission]) => ({
    name,
    commission
  })).sort((a, b) => b.commission - a.commission).slice(0, 10);

  // Tooltip formatter for INR
  const tooltipFormatter = (value: any) => [formatCurrency(Number(value)), 'Amount'];

  // Recent 5-10 entries (sorted by bookingDate desc)
  const recentMetrics = [...metrics]
    .sort((a, b) => b.entry.bookingDate.localeCompare(a.entry.bookingDate))
    .slice(0, 8);

  const activeSelectedMetric = selectedEntry
    ? metrics.find((m) => m.entry.id === selectedEntry.id)
    : null;

  return (
    <div className="space-y-6">
      
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        
        {/* Total Projects */}
        <div className="bg-white rounded-xl shadow-2xs border border-gray-100 p-4 relative overflow-hidden flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase block">Total Projects</span>
            <div className="text-xl font-extrabold text-gray-900 mt-1.5 leading-none">
              {projects.length}
            </div>
          </div>
          <div className="mt-3 text-[10px] text-gray-400 font-semibold flex items-center justify-between border-t border-gray-50 pt-2">
            <span>Portfolio units: {projects.length}</span>
          </div>
          <div className="absolute right-3 top-3.5 p-1.5 bg-blue-50 text-blue-600 rounded-lg">
            <Building className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Total Net Commission */}
        <div className="bg-white rounded-xl shadow-2xs border border-gray-100 p-4 relative overflow-hidden flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase block">Total Commission</span>
            <div className="text-xl font-extrabold text-blue-600 mt-1.5 leading-none">
              {formatCurrency(totalCommissionValue)}
            </div>
          </div>
          <div className="mt-3 text-[10px] text-gray-400 font-semibold flex items-center justify-between border-t border-gray-50 pt-2">
            <span>From {entries.length} calculations</span>
          </div>
          <div className="absolute right-3 top-3.5 p-1.5 bg-blue-50 text-blue-600 rounded-lg">
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Paid Commission */}
        <div className="bg-white rounded-xl shadow-2xs border border-gray-100 p-4 relative overflow-hidden flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase block">Paid Commission</span>
            <div className="text-xl font-extrabold text-emerald-600 mt-1.5 leading-none">
              {formatCurrency(totalPaidValue)}
            </div>
          </div>
          <div className="mt-3 text-[10px] text-gray-400 font-semibold flex items-center justify-between border-t border-gray-50 pt-2">
            <span>Successfully disbursed</span>
          </div>
          <div className="absolute right-3 top-3.5 p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Pending Commission */}
        <div className="bg-white rounded-xl shadow-2xs border border-gray-100 p-4 relative overflow-hidden flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase block">Pending Commission</span>
            <div className="text-xl font-extrabold text-amber-600 mt-1.5 leading-none">
              {formatCurrency(totalPendingValue)}
            </div>
          </div>
          <div className="mt-3 text-[10px] text-gray-400 font-semibold flex items-center justify-between border-t border-gray-50 pt-2">
            <span>Awaiting clearance</span>
          </div>
          <div className="absolute right-3 top-3.5 p-1.5 bg-amber-50 text-amber-500 rounded-lg">
            <Clock className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* This Month Commission */}
        <div className="bg-white rounded-xl shadow-2xs border border-gray-100 p-4 relative overflow-hidden flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase block">This Month Comm</span>
            <div className="text-xl font-extrabold text-gray-900 mt-1.5 leading-none">
              {formatCurrency(thisMonthCommission)}
            </div>
          </div>
          <div className="mt-3 text-[10px] text-gray-400 font-semibold flex items-center justify-between border-t border-gray-50 pt-2">
            <span>Local 2026-07 current month</span>
          </div>
          <div className="absolute right-3 top-3.5 p-1.5 bg-purple-50 text-purple-600 rounded-lg">
            <Calendar className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Total Stakeholders */}
        <div className="bg-white rounded-xl shadow-2xs border border-gray-100 p-4 relative overflow-hidden flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase block">Total Stakeholders</span>
            <div className="text-xl font-extrabold text-indigo-600 mt-1.5 leading-none">
              {people.length}
            </div>
          </div>
          <div className="mt-3 text-[10px] text-gray-400 font-semibold flex items-center justify-between border-t border-gray-50 pt-2">
            <span>Channel partners & executives</span>
          </div>
          <div className="absolute right-3 top-3.5 p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
            <Users className="w-3.5 h-3.5" />
          </div>
        </div>

      </div>

      {/* Main Grid: Recent Calculations & Category Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Calculations Panel */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-2xs border border-gray-100 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-50 pb-2.5">
            <div>
              <h3 className="font-extrabold text-gray-900 text-xs uppercase tracking-wide text-blue-600 flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-blue-600" />
                Recent Commission Calculations
              </h3>
              <p className="text-[10px] text-gray-400 mt-0.5">
                Click any row to open the high-precision audit sheet, TDS deductions, and payments history.
              </p>
            </div>
          </div>

          {recentMetrics.length === 0 ? (
            <div className="py-12 text-center text-xs text-gray-400 font-bold">
              No commission calculations logged yet. Click the Sales Ledger tab to record a sale!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    <th className="py-2.5 px-3">Project / Unit</th>
                    <th className="py-2.5 px-3">Stakeholder</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-right">Commission (Net)</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentMetrics.map((m) => (
                    <tr
                      key={m.entry.id}
                      onClick={() => setSelectedEntry(m.entry)}
                      className="hover:bg-blue-50/40 transition-colors cursor-pointer group text-xs text-gray-700 font-medium"
                    >
                      <td className="py-3 px-3">
                        <div className="font-extrabold text-gray-900">{m.project?.name || 'Deleted Project'}</div>
                        <div className="text-[10px] text-gray-400">Unit {m.entry.unitNo}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-gray-800">{m.person?.name || 'Deleted Stakeholder'}</div>
                        <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{m.person?.type}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-[10px] bg-gray-100 border border-gray-200/50 text-gray-600 px-2 py-0.5 rounded-md font-bold">
                          {m.entry.category || 'Booking Commission'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-extrabold text-gray-900">
                        {formatCurrency(m.calc.netCommission)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 text-[9px] font-bold uppercase rounded-md tracking-wider border ${
                            m.calc.status === 'Paid'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                              : m.calc.status === 'Partially Paid'
                              ? 'bg-blue-50 text-blue-700 border-blue-100'
                              : 'bg-amber-50 text-amber-700 border-amber-100'
                          }`}
                        >
                          {m.calc.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button className="p-1.5 text-gray-400 group-hover:text-blue-600 hover:bg-white rounded-lg transition-colors shadow-3xs border border-transparent group-hover:border-blue-100">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Paid vs Pending Breakdown Pie Chart */}
        <div className="bg-white rounded-xl shadow-2xs border border-gray-100 p-5 space-y-4">
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Realized Disbursements</h3>
            <p className="text-[11px] text-gray-400">Comparing processed payouts against pending backlog</p>
          </div>
          <div className="h-48 w-full flex items-center justify-center">
            {totalCommissionValue === 0 ? (
              <div className="text-xs text-gray-400 font-medium">No payout ledger records to visualize</div>
            ) : (
              <div className="relative h-full w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paidVsPendingData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {paidVsPendingData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={tooltipFormatter} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute text-center">
                  <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block leading-none">Total</span>
                  <span className="text-sm font-extrabold text-gray-900 mt-1 block">
                    {formatCurrency(totalCommissionValue)}
                  </span>
                </div>
              </div>
            )}
          </div>
          <div className="space-y-2.5 border-t border-gray-50 pt-3">
            {paidVsPendingData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[11px] font-bold text-gray-500 uppercase">{item.name}</span>
                </div>
                <div className="text-xs font-extrabold text-gray-800">
                  {formatCurrency(item.value)}{' '}
                  <span className="text-[10px] text-gray-400 font-normal">
                    ({totalCommissionValue > 0 ? ((item.value / totalCommissionValue) * 100).toFixed(1) : 0}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Expanded Bento Grid for Multi-Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* 1. Monthly Commission Trend */}
        <div className="bg-white rounded-xl shadow-2xs border border-gray-100 p-5 space-y-4">
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Monthly Commission Trend</h3>
            <p className="text-[11px] text-gray-400">Total eligible commission volume generated over months</p>
          </div>
          <div className="h-64 w-full">
            {monthlyChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-gray-400 font-medium">
                No monthly data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyChartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <XAxis dataKey="name" stroke="#9CA3AF" fontSize={10} tickLine={false} />
                  <YAxis
                    stroke="#9CA3AF"
                    fontSize={10}
                    tickLine={false}
                    tickFormatter={(v) => `₹${v >= 100000 ? `${(v / 100000).toFixed(1)}L` : v.toLocaleString('en-IN')}`}
                  />
                  <Tooltip formatter={tooltipFormatter} />
                  <Line
                    type="monotone"
                    dataKey="commission"
                    stroke="#2563EB"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#2563EB', strokeWidth: 1 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* 2. Project-wise Commission Distribution */}
        <div className="bg-white rounded-xl shadow-2xs border border-gray-100 p-5 space-y-4">
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Project-wise Commission Distribution</h3>
            <p className="text-[11px] text-gray-400">Comparing commission volume split with Paid vs Pending details</p>
          </div>
          <div className="h-64 w-full">
            {projectChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-gray-400 font-medium">
                No project metrics available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={projectChartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <XAxis dataKey="name" stroke="#9CA3AF" fontSize={10} tickLine={false} />
                  <YAxis
                    stroke="#9CA3AF"
                    fontSize={10}
                    tickLine={false}
                    tickFormatter={(v) => `₹${v >= 100000 ? `${(v / 100000).toFixed(1)}L` : v.toLocaleString('en-IN')}`}
                  />
                  <Tooltip formatter={tooltipFormatter} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="paid" name="Paid" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pending" name="Pending" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* 3. NEW: Commission by Category (Pie Chart) */}
        <div className="bg-white rounded-xl shadow-2xs border border-gray-100 p-5 space-y-4">
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Commission by Category</h3>
            <p className="text-[11px] text-gray-400">Total net commission volumes grouped by contractual types</p>
          </div>
          <div className="h-64 w-full flex flex-col sm:flex-row items-center justify-center gap-6">
            {categoryChartData.length === 0 ? (
              <div className="text-xs text-gray-400 font-medium">No category metrics logged</div>
            ) : (
              <>
                <div className="h-44 w-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {categoryChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={tooltipFormatter} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2.5 shrink-0 max-h-56 overflow-y-auto pr-1">
                  {categoryChartData.map((item) => (
                    <div key={item.name} className="flex items-start gap-2">
                      <div className="w-2.5 h-2.5 rounded-full mt-1" style={{ backgroundColor: item.color }} />
                      <div>
                        <div className="text-[10px] font-bold text-gray-500 uppercase leading-none">{item.name}</div>
                        <div className="text-[11px] font-extrabold text-gray-800 mt-1">{formatCurrency(item.value)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* 4. NEW: Stakeholder-wise Commission (Bar Chart, ranking top earners) */}
        <div className="bg-white rounded-xl shadow-2xs border border-gray-100 p-5 space-y-4">
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Stakeholder Commission Standings</h3>
            <p className="text-[11px] text-gray-400">Top earning channel partners, brokers, and sales executives</p>
          </div>
          <div className="h-64 w-full">
            {stakeholderChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-gray-400 font-medium">
                No stakeholder earnings data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stakeholderChartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <XAxis dataKey="name" stroke="#9CA3AF" fontSize={9} tickLine={false} />
                  <YAxis
                    stroke="#9CA3AF"
                    fontSize={10}
                    tickLine={false}
                    tickFormatter={(v) => `₹${v >= 100000 ? `${(v / 100000).toFixed(1)}L` : v.toLocaleString('en-IN')}`}
                  />
                  <Tooltip formatter={tooltipFormatter} />
                  <Bar dataKey="commission" name="Total Commission Earned" fill="#8B5CF6" radius={[4, 4, 0, 0]}>
                    {stakeholderChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#6D28D9' : index === 1 ? '#7C3AED' : '#8B5CF6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* 5. Sales Executive Performance Rank */}
        <div className="bg-white rounded-xl shadow-2xs border border-gray-100 p-5 space-y-4">
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Sales Executive Performance Rank</h3>
            <p className="text-[11px] text-gray-400">Top-performing internal sales agents by total earned commission</p>
          </div>
          <div className="h-64 w-full">
            {execChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-gray-400 font-medium">
                No internal executive data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={execChartData} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F3F4F6" />
                  <XAxis
                    type="number"
                    stroke="#9CA3AF"
                    fontSize={10}
                    tickLine={false}
                    tickFormatter={(v) => `₹${v >= 100000 ? `${(v / 100000).toFixed(1)}L` : v.toLocaleString('en-IN')}`}
                  />
                  <YAxis dataKey="name" type="category" stroke="#9CA3AF" fontSize={10} tickLine={false} width={80} />
                  <Tooltip formatter={tooltipFormatter} />
                  <Bar dataKey="commission" fill="#3B82F6" radius={[0, 4, 4, 0]}>
                    {execChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#1D4ED8' : index === 1 ? '#2563EB' : '#3B82F6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

      {/* high-precision details sliding modal overlay */}
      {selectedEntry && activeSelectedMetric && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-xs flex items-center justify-center z-100 p-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-2xl max-w-2xl w-full p-6 relative animate-in fade-in zoom-in duration-150 space-y-5">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-gray-100 pb-3">
              <div>
                <span className="text-[9px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Calculation Audit Details
                </span>
                <h3 className="font-extrabold text-gray-900 text-sm mt-1">
                  Unit {selectedEntry.unitNo} - {activeSelectedMetric.project?.name || 'Project details'}
                </h3>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Commission ledger reference ID: <span className="font-mono">{selectedEntry.id}</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedEntry(null)}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Grid content */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5 text-xs text-gray-700">
              
              {/* Box 1: Customer details */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
                <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block">Customer & Deal</span>
                <div className="space-y-1">
                  <div className="flex justify-between"><span className="text-gray-400 font-semibold">Customer:</span> <span className="font-bold text-gray-800">{selectedEntry.customerName}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400 font-semibold">Booking Date:</span> <span className="font-bold text-gray-800">{selectedEntry.bookingDate}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400 font-semibold">Agreement Date:</span> <span className="font-bold text-gray-800">{selectedEntry.agreementDate || 'N/A'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400 font-semibold">Property Value:</span> <span className="font-extrabold text-gray-900">{formatCurrency(selectedEntry.propertyValue)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400 font-semibold">Booking Amount:</span> <span className="font-bold text-gray-800">{formatCurrency(selectedEntry.bookingAmount)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400 font-semibold">Collected Amount:</span> <span className="font-bold text-emerald-600">{formatCurrency(selectedEntry.receivedAmount)}</span></div>
                </div>
              </div>

              {/* Box 2: Stakeholder Profile */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
                <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block">Stakeholder Details</span>
                <div className="space-y-1">
                  <div className="flex justify-between"><span className="text-gray-400 font-semibold">Name:</span> <span className="font-bold text-gray-800">{activeSelectedMetric.person?.name || 'Deleted'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400 font-semibold">Recipient Type:</span> <span className="font-bold text-indigo-600 uppercase tracking-wide text-[10px]">{activeSelectedMetric.person?.type || 'Broker'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400 font-semibold">ID / Code:</span> <span className="font-mono font-bold text-gray-800">{activeSelectedMetric.person?.employeeId || 'N/A'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400 font-semibold">Category:</span> <span className="font-bold text-blue-600">{selectedEntry.category || 'Booking Commission'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400 font-semibold">Email:</span> <span className="font-bold text-gray-800">{activeSelectedMetric.person?.email || 'N/A'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400 font-semibold">Phone:</span> <span className="font-bold text-gray-800">{activeSelectedMetric.person?.phone || 'N/A'}</span></div>
                </div>
              </div>

              {/* Box 3: Commission Calculation Audit */}
              <div className="md:col-span-2 p-3 bg-blue-50/40 rounded-xl border border-blue-100/30 space-y-2">
                <span className="text-[10px] text-blue-600 font-extrabold uppercase tracking-wider block">High-Precision Audit Trail</span>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                  
                  <div className="bg-white p-2.5 rounded-lg border border-blue-100/40">
                    <span className="text-[9px] text-gray-400 font-bold uppercase block">Base Setup</span>
                    <span className="text-xs font-extrabold text-gray-800 block mt-1">
                      {selectedEntry.commissionType === 'percentage' ? `${selectedEntry.rateOrAmount}%` : 'Fixed Fee'}
                    </span>
                    <span className="text-[9px] text-gray-400 block mt-0.5">
                      {selectedEntry.commissionType === 'percentage' ? 'Percentage Scale' : formatCurrency(selectedEntry.rateOrAmount)}
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-blue-100/40">
                    <span className="text-[9px] text-gray-400 font-bold uppercase block">Eligible Base</span>
                    <span className="text-xs font-extrabold text-gray-800 block mt-1">
                      {formatCurrency(activeSelectedMetric.calc.eligibleCommissionCapped)}
                    </span>
                    <span className="text-[9px] text-gray-400 block mt-0.5">
                      Proportional to received
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-blue-100/40">
                    <span className="text-[9px] text-gray-400 font-bold uppercase block">Taxes (GST/TDS)</span>
                    <span className="text-xs font-extrabold text-red-600 block mt-1">
                      +{formatCurrency(activeSelectedMetric.calc.gstAmount)} / -{formatCurrency(activeSelectedMetric.calc.tdsAmount)}
                    </span>
                    <span className="text-[9px] text-gray-400 block mt-0.5">
                      {selectedEntry.hasGst ? '18% GST' : 'No GST'} & {selectedEntry.tdsRate}% TDS
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-blue-100/40">
                    <span className="text-[9px] text-gray-400 font-bold uppercase block">Bonus</span>
                    <span className="text-xs font-extrabold text-emerald-600 block mt-1">
                      +{formatCurrency(activeSelectedMetric.calc.bonusAmount)}
                    </span>
                    <span className="text-[9px] text-gray-400 block mt-0.5">
                      Incentive added
                    </span>
                  </div>

                </div>

                <div className="pt-2 border-t border-blue-100/20 flex items-center justify-between font-bold">
                  <span className="text-gray-700">Net Payable Commission:</span>
                  <span className="text-sm font-black text-blue-600">
                    {formatCurrency(activeSelectedMetric.calc.netCommission)}
                  </span>
                </div>
              </div>

              {/* Box 4: Payments Made */}
              <div className="md:col-span-2 p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
                <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block">Disbursements & Balances</span>
                <div className="flex justify-between items-center gap-4 text-center">
                  <div className="flex-1 bg-white p-2 rounded-lg border border-gray-100">
                    <span className="text-[9px] text-gray-400 block font-bold">Total Paid</span>
                    <span className="text-xs font-extrabold text-emerald-600 mt-0.5 block">{formatCurrency(activeSelectedMetric.calc.totalPaid)}</span>
                  </div>
                  <div className="flex-1 bg-white p-2 rounded-lg border border-gray-100">
                    <span className="text-[9px] text-gray-400 block font-bold">Balance Due</span>
                    <span className="text-xs font-extrabold text-amber-600 mt-0.5 block">{formatCurrency(activeSelectedMetric.calc.pendingAmount)}</span>
                  </div>
                </div>

                {/* Payments list nested */}
                <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Payments Ledger</span>
                  {!selectedEntry.payments || selectedEntry.payments.length === 0 ? (
                    <div className="text-[10px] text-gray-400 font-semibold italic text-center py-2">
                      No payment disbursements recorded for this transaction.
                    </div>
                  ) : (
                    selectedEntry.payments.map((p, idx) => (
                      <div key={p.id} className="flex justify-between items-center bg-white p-2 rounded-lg border border-gray-100/80 text-[11px] font-semibold text-gray-700">
                        <span>Disbursement #{idx + 1} ({p.mode})</span>
                        <span className="text-gray-400">{p.date}</span>
                        <span className="font-extrabold text-emerald-600">{formatCurrency(p.amount)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* Footer buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
              <button
                onClick={() => setSelectedEntry(null)}
                className="px-4.5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Close Audit Sheet
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
