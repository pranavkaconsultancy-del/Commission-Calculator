import React from 'react';
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
  Wallet
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

  const totalSalesCount = metrics.length;
  const totalSalesValue = metrics.reduce((sum, m) => sum + m.entry.propertyValue, 0);
  const totalCommissionValue = metrics.reduce((sum, m) => sum + m.calc.netCommission, 0);
  const totalPaidValue = metrics.reduce((sum, m) => sum + m.calc.totalPaid, 0);
  const totalPendingValue = metrics.reduce((sum, m) => sum + m.calc.pendingAmount, 0);

  // Determine current month & year (based on local metadata 2026)
  const today = new Date();
  const currentMonthStr = today.toISOString().substring(0, 7); // "2026-07"
  const currentYearStr = today.getFullYear().toString(); // "2026"

  const thisMonthCommission = metrics
    .filter((m) => m.entry.bookingDate.startsWith(currentMonthStr))
    .reduce((sum, m) => sum + m.calc.netCommission, 0);

  const thisYearCommission = metrics
    .filter((m) => m.entry.bookingDate.startsWith(currentYearStr))
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

  // --- CHART 3: Sales Executive Performance ---
  const execDataMap: Record<string, { name: string; commission: number }> = {};
  metrics.forEach((m) => {
    if (m.person?.type === 'Executive') {
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

  // Tooltip formatter for INR
  const tooltipFormatter = (value: any) => [formatCurrency(Number(value)), 'Amount'];

  return (
    <div className="space-y-6">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Total Sales Value */}
        <div className="bg-white rounded-xl shadow-2xs border border-gray-100 p-4 relative overflow-hidden flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase block">Total Sales Value</span>
            <div className="text-sm font-extrabold text-gray-900 mt-1.5 leading-tight">
              {formatCurrency(totalSalesValue)}
            </div>
          </div>
          <div className="mt-3 text-[10px] text-gray-400 font-semibold flex items-center justify-between border-t border-gray-50 pt-2">
            <span>Volume: {totalSalesCount} units booked</span>
          </div>
          <div className="absolute right-3 top-3.5 p-1.5 bg-blue-50 text-blue-600 rounded-lg">
            <Building className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Total Net Commission */}
        <div className="bg-white rounded-xl shadow-2xs border border-gray-100 p-4 relative overflow-hidden flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase block">Total Commission</span>
            <div className="text-sm font-extrabold text-blue-600 mt-1.5 leading-tight">
              {formatCurrency(totalCommissionValue)}
            </div>
          </div>
          <div className="mt-3 text-[10px] text-gray-400 font-semibold flex items-center justify-between border-t border-gray-50 pt-2">
            <span>Eligible based on cash flow</span>
          </div>
          <div className="absolute right-3 top-3.5 p-1.5 bg-blue-50 text-blue-600 rounded-lg">
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Paid Commission */}
        <div className="bg-white rounded-xl shadow-2xs border border-gray-100 p-4 relative overflow-hidden flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase block">Paid Commission</span>
            <div className="text-sm font-extrabold text-emerald-600 mt-1.5 leading-tight">
              {formatCurrency(totalPaidValue)}
            </div>
          </div>
          <div className="mt-3 text-[10px] text-gray-400 font-semibold flex items-center justify-between border-t border-gray-50 pt-2">
            <span>Successfully disbursed payouts</span>
          </div>
          <div className="absolute right-3 top-3.5 p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Pending Commission */}
        <div className="bg-white rounded-xl shadow-2xs border border-gray-100 p-4 relative overflow-hidden flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase block">Pending Commission</span>
            <div className="text-sm font-extrabold text-amber-600 mt-1.5 leading-tight">
              {formatCurrency(totalPendingValue)}
            </div>
          </div>
          <div className="mt-3 text-[10px] text-gray-400 font-semibold flex items-center justify-between border-t border-gray-50 pt-2">
            <span>Withheld or awaiting clearance</span>
          </div>
          <div className="absolute right-3 top-3.5 p-1.5 bg-amber-50 text-amber-500 rounded-lg">
            <Clock className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* This Month Commission */}
        <div className="bg-white rounded-xl shadow-2xs border border-gray-100 p-4 relative overflow-hidden flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase block">This Month Commission</span>
            <div className="text-sm font-extrabold text-gray-900 mt-1.5 leading-tight">
              {formatCurrency(thisMonthCommission)}
            </div>
          </div>
          <div className="mt-3 text-[10px] text-gray-400 font-semibold flex items-center justify-between border-t border-gray-50 pt-2">
            <span>Booked in {today.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</span>
          </div>
          <div className="absolute right-3 top-3.5 p-1.5 bg-purple-50 text-purple-600 rounded-lg">
            <Calendar className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* This Year Commission */}
        <div className="bg-white rounded-xl shadow-2xs border border-gray-100 p-4 relative overflow-hidden flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase block">This Year Commission</span>
            <div className="text-sm font-extrabold text-gray-900 mt-1.5 leading-tight">
              {formatCurrency(thisYearCommission)}
            </div>
          </div>
          <div className="mt-3 text-[10px] text-gray-400 font-semibold flex items-center justify-between border-t border-gray-50 pt-2">
            <span>Commission booked in calendar {today.getFullYear()}</span>
          </div>
          <div className="absolute right-3 top-3.5 p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
            <Award className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend Chart */}
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

        {/* Project-wise Commission Chart */}
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

        {/* Executive Performance Ranking Chart */}
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

        {/* Paid vs Pending Pie Chart */}
        <div className="bg-white rounded-xl shadow-2xs border border-gray-100 p-5 space-y-4">
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Paid vs Pending Commission</h3>
            <p className="text-[11px] text-gray-400">Comparing real-time cash payouts vs outstanding commitments</p>
          </div>
          <div className="h-64 w-full flex flex-col sm:flex-row items-center justify-center gap-6">
            {totalCommissionValue === 0 ? (
              <div className="text-xs text-gray-400 font-medium">
                No payouts defined to split
              </div>
            ) : (
              <>
                <div className="h-44 w-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paidVsPendingData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {paidVsPendingData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={tooltipFormatter} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3.5 shrink-0">
                  {paidVsPendingData.map((item) => (
                    <div key={item.name} className="flex items-start gap-2.5">
                      <div className="w-3 h-3 rounded-full mt-1" style={{ backgroundColor: item.color }} />
                      <div>
                        <div className="text-[11px] font-bold text-gray-500 uppercase leading-none">{item.name}</div>
                        <div className="text-sm font-extrabold text-gray-800 mt-1">{formatCurrency(item.value)}</div>
                        <div className="text-[10px] text-gray-400 font-semibold mt-0.5">
                          {((item.value / totalCommissionValue) * 100).toFixed(1)}% of Net
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
