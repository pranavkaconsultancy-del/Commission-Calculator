import React from 'react';
import { 
  TrendingUp, Coins, CheckCircle, AlertCircle, Building2, Users, ShoppingBag, DollarSign
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  AreaChart, Area, PieChart, Pie, Cell, LineChart, Line 
} from 'recharts';
import { Broker, Property, Sale, Commission } from '../types';
import { formatCurrency, formatNumber } from '../utils';

interface DashboardProps {
  brokers: Broker[];
  properties: Property[];
  sales: Sale[];
  commissions: Commission[];
  darkMode: boolean;
}

export function DashboardView({ brokers, properties, sales, commissions, darkMode }: DashboardProps) {
  // 1. Calculations
  const activeBrokers = brokers.filter(b => b.status === 'Active');
  const totalFlatsSold = properties.filter(p => p.status === 'Sold').length;
  
  const totalSalesValue = sales.reduce((sum, s) => sum + s.sale_amount, 0);
  const totalGrossComm = sales.reduce((sum, s) => sum + s.gross_commission, 0);
  const totalNetComm = commissions.reduce((sum, c) => sum + c.net_commission, 0);
  
  const paidComm = commissions.reduce((sum, c) => sum + c.paid_amount, 0);
  const pendingComm = commissions.reduce((sum, c) => sum + c.pending_amount, 0);

  // Today's Sales & Monthly Sales
  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthStr = new Date().toISOString().substring(0, 7); // YYYY-MM
  
  const todaySales = sales.filter(s => s.booking_date === todayStr).reduce((sum, s) => sum + s.sale_amount, 0);
  const monthlySales = sales.filter(s => s.booking_date.startsWith(currentMonthStr)).reduce((sum, s) => sum + s.sale_amount, 0);

  // 2. Project-wise Sales Chart Data
  const projectSalesMap: Record<string, { name: string; sales: number; count: number }> = {};
  sales.forEach(s => {
    const proj = s.project_name || 'Other';
    if (!projectSalesMap[proj]) {
      projectSalesMap[proj] = { name: proj, sales: 0, count: 0 };
    }
    projectSalesMap[proj].sales += s.sale_amount;
    projectSalesMap[proj].count += 1;
  });
  const projectSalesData = Object.values(projectSalesMap);

  // 3. Area-wise Sales Map (Grouped by Project's Location if available)
  // Skyline Heights is in Worli, Cyber Plaza in Gachibowli, Orchard Residences in Whitefield, Emerald Gardens in New Town
  const areaSalesMap: Record<string, { name: string; value: number }> = {};
  sales.forEach(s => {
    let area = 'Unknown';
    if (s.project_name === 'Skyline Heights') area = 'Worli (Mumbai)';
    else if (s.project_name === 'Cyber Plaza') area = 'Gachibowli (Hyd)';
    else if (s.project_name === 'Orchard Residences') area = 'Whitefield (Blr)';
    else if (s.project_name === 'Emerald Gardens') area = 'New Town (Kol)';
    else area = 'Other Areas';

    if (!areaSalesMap[area]) {
      areaSalesMap[area] = { name: area, value: 0 };
    }
    areaSalesMap[area].value += s.sale_amount;
  });
  const areaSalesData = Object.values(areaSalesMap);

  // Colors for Area Pie Chart
  const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  // 4. Broker Performance Leaderboard (Ranked Bar Chart)
  const brokerPerformanceMap: Record<string, { name: string; commission: number; sales: number }> = {};
  sales.forEach(s => {
    const bId = s.broker_id;
    const bName = s.broker_name || 'Independent';
    if (!brokerPerformanceMap[bId]) {
      brokerPerformanceMap[bId] = { name: bName, commission: 0, sales: 0 };
    }
    brokerPerformanceMap[bId].sales += s.sale_amount;
    brokerPerformanceMap[bId].commission += s.gross_commission;
  });
  const brokerLeaderboardData = Object.values(brokerPerformanceMap)
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 5); // Top 5

  // 5. Monthly Sales Trend Data (Last 6 Months)
  const monthlyTrendMap: Record<string, { month: string; sales: number; commission: number }> = {};
  
  // Fill last 6 months with 0
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const mStr = d.toISOString().substring(0, 7);
    const mLabel = d.toLocaleString('default', { month: 'short', year: '2-digit' });
    monthlyTrendMap[mStr] = { month: mLabel, sales: 0, commission: 0 };
  }

  sales.forEach(s => {
    const mKey = s.booking_date.substring(0, 7);
    if (monthlyTrendMap[mKey]) {
      monthlyTrendMap[mKey].sales += s.sale_amount;
      monthlyTrendMap[mKey].commission += s.net_commission;
    }
  });
  const monthlyTrendData = Object.values(monthlyTrendMap);

  return (
    <div className="space-y-6">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Brokers Card */}
        <div className={`p-5 rounded-xl border transition-shadow hover:shadow-md flex items-center gap-4 ${
          darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
        }`}>
          <div className="p-3 bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 rounded-lg">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Total Brokers</p>
            <h3 className="text-2xl font-black mt-0.5">{brokers.length}</h3>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">{activeBrokers.length} active registered</p>
          </div>
        </div>

        {/* Sales Count Card */}
        <div className={`p-5 rounded-xl border transition-shadow hover:shadow-md flex items-center gap-4 ${
          darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
        }`}>
          <div className="p-3 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 rounded-lg">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Flats Sold</p>
            <h3 className="text-2xl font-black mt-0.5">{totalFlatsSold}</h3>
            <p className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">Out of {properties.length} total units</p>
          </div>
        </div>

        {/* Sales Value Card */}
        <div className={`p-5 rounded-xl border transition-shadow hover:shadow-md flex items-center gap-4 ${
          darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
        }`}>
          <div className="p-3 bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 rounded-lg">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Sales Value</p>
            <h3 className="text-2xl font-black mt-0.5">{formatNumber(totalSalesValue)}</h3>
            <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">Average: {formatCurrency(totalSalesValue / (sales.length || 1))}</p>
          </div>
        </div>

        {/* Today's & Monthly Sales Card */}
        <div className={`p-5 rounded-xl border transition-shadow hover:shadow-md flex items-center gap-4 ${
          darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
        }`}>
          <div className="p-3 bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400 rounded-lg">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Monthly Sales</p>
            <h3 className="text-2xl font-black mt-0.5">{formatNumber(monthlySales)}</h3>
            <p className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">Today: {formatCurrency(todaySales)}</p>
          </div>
        </div>
      </div>

      {/* Commission KPIs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Net Commission */}
        <div className={`p-5 rounded-xl border text-center ${
          darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
        }`}>
          <Coins className="w-7 h-7 mx-auto text-blue-600 dark:text-blue-400 mb-2" />
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Net Payable Commission</p>
          <h2 className="text-3xl font-black text-blue-600 dark:text-blue-400 mt-1">{formatCurrency(totalNetComm)}</h2>
          <p className="text-[10px] text-slate-400 mt-1">Gross Commission: {formatCurrency(totalGrossComm)}</p>
        </div>

        {/* Paid Commission */}
        <div className={`p-5 rounded-xl border text-center ${
          darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
        }`}>
          <CheckCircle className="w-7 h-7 mx-auto text-emerald-600 dark:text-emerald-400 mb-2" />
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Paid Payouts</p>
          <h2 className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{formatCurrency(paidComm)}</h2>
          <p className="text-[10px] text-slate-400 mt-1">Cleared using Bank/UPI transfer</p>
        </div>

        {/* Pending Commission */}
        <div className={`p-5 rounded-xl border text-center ${
          darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
        }`}>
          <AlertCircle className="w-7 h-7 mx-auto text-amber-600 dark:text-amber-400 mb-2" />
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Pending Balances</p>
          <h2 className="text-3xl font-black text-amber-600 dark:text-amber-400 mt-1">{formatCurrency(pendingComm)}</h2>
          <p className="text-[10px] text-slate-400 mt-1">Awaiting bank authorizations</p>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Sales Area Chart */}
        <div className={`p-5 rounded-xl border ${
          darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
        }`}>
          <h3 className="text-sm font-bold uppercase tracking-wider mb-4 text-slate-400">Project-wise Revenue Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={projectSalesData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#E2E8F0'} />
                <XAxis dataKey="name" stroke={darkMode ? '#94A3B8' : '#64748B'} fontSize={10} />
                <YAxis stroke={darkMode ? '#94A3B8' : '#64748B'} fontSize={10} tickFormatter={(v) => `₹${v/100000}L`} />
                <Tooltip formatter={(value: any) => [formatCurrency(Number(value)), 'Sales Revenue']} />
                <Area type="monotone" dataKey="sales" stroke="#2563EB" fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Broker Leaderboard (Ranked Bar Chart) */}
        <div className={`p-5 rounded-xl border ${
          darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
        }`}>
          <h3 className="text-sm font-bold uppercase tracking-wider mb-4 text-slate-400">Broker Sales Performance Leaderboard</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={brokerLeaderboardData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#E2E8F0'} />
                <XAxis type="number" stroke={darkMode ? '#94A3B8' : '#64748B'} fontSize={10} tickFormatter={(v) => `₹${v/100000}L`} />
                <YAxis type="category" dataKey="name" stroke={darkMode ? '#94A3B8' : '#64748B'} fontSize={9} width={80} />
                <Tooltip formatter={(value: any) => [formatCurrency(Number(value)), 'Sales Booked']} />
                <Bar dataKey="sales" fill="#10B981" radius={[0, 4, 4, 0]}>
                  {brokerLeaderboardData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Trend Area Chart */}
        <div className={`p-5 rounded-xl border ${
          darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
        }`}>
          <h3 className="text-sm font-bold uppercase tracking-wider mb-4 text-slate-400">6-Month Revenue & Payout Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#E2E8F0'} />
                <XAxis dataKey="month" stroke={darkMode ? '#94A3B8' : '#64748B'} fontSize={10} />
                <YAxis stroke={darkMode ? '#94A3B8' : '#64748B'} fontSize={10} tickFormatter={(v) => `₹${v/100000}L`} />
                <Tooltip formatter={(value: any) => [formatCurrency(Number(value)), '']} />
                <Legend />
                <Line type="monotone" dataKey="sales" name="Sales Revenue" stroke="#3B82F6" strokeWidth={2.5} activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="commission" name="Commission Payout" stroke="#EC4899" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Area-wise distribution Pie Chart */}
        <div className={`p-5 rounded-xl border ${
          darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
        }`}>
          <h3 className="text-sm font-bold uppercase tracking-wider mb-4 text-slate-400">Sales Value Share by City Zone</h3>
          <div className="h-64 flex flex-col sm:flex-row items-center justify-around">
            {areaSalesData.length === 0 ? (
              <div className="text-xs text-slate-400">No Sales Recorded Yet</div>
            ) : (
              <>
                <div className="w-1/2 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={areaSalesData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {areaSalesData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => [formatCurrency(Number(value)), 'Sales Share']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col gap-2 p-4 text-left max-w-xs">
                  {areaSalesData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <div className="text-xs">
                        <span className="font-semibold">{entry.name}:</span>{' '}
                        <span className="text-slate-500">{formatNumber(entry.value)}</span>
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
