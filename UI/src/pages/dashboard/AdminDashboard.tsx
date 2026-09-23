import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  Factory,
  Cpu,
  Boxes,
  Users,
  AlertTriangle,
  Bot,
  Activity,
  Layers,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { StatCard } from '../../components/ui/StatCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { LoadingSpinner } from '../../components/feedback/LoadingSpinner';
import { mockStorage } from '../../services/mockStorage';
import { formatCurrency } from '../../utils/formatters';

const REVENUE_EXPENSE_DATA = [
  { month: 'Apr', revenue: 420000, expenses: 290000 },
  { month: 'May', revenue: 490000, expenses: 310000 },
  { month: 'Jun', revenue: 540000, expenses: 330000 },
  { month: 'Jul', revenue: 610000, expenses: 380000 },
  { month: 'Aug', revenue: 675000, expenses: 383000 },
  { month: 'Sep', revenue: 740000, expenses: 410000 },
];

const PRODUCTION_CAPACITY_DATA = [
  { machine: 'CNC C42U', output: 94, target: 100 },
  { machine: 'Press 500T', output: 89, target: 95 },
  { machine: 'Laser Welder', output: 98, target: 100 },
  { machine: 'SMD NPM-D3', output: 96, target: 100 },
];

const CATEGORY_DISTRIBUTION = [
  { name: 'Hydraulics', value: 48500, color: '#3b82f6' },
  { name: 'Tooling', value: 32000, color: '#06b6d4' },
  { name: 'Electrical', value: 65000, color: '#10b981' },
  { name: 'Structural', value: 28000, color: '#8b5cf6' },
  { name: 'Electronics', value: 19500, color: '#f59e0b' },
];

export const AdminDashboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <LoadingSpinner message="Aggregating plant KPI telemetry and metrics..." size="lg" />;
  }

  const inventory = mockStorage.inventory;
  const lowStockCount = inventory.filter((i) => i.stockStatus === 'LOW_STOCK' || i.stockStatus === 'OUT_OF_STOCK').length;
  const totalEmployees = mockStorage.employees.length;
  const activeAlerts = mockStorage.alerts.filter((a) => a.status === 'ACTIVE').length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Industrial Plant Operations Command</h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time telemetry, double-entry financial ledger metrics, and automated robot logistics.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono font-bold text-emerald-400">
            ● Plant Online (OEE: 94.6%)
          </span>
        </div>
      </div>

      {/* KPI Cards Grid (10 KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Monthly Revenue"
          value={formatCurrency(740000)}
          icon={<DollarSign className="w-5 h-5 text-emerald-400" />}
          trend={{ value: 9.6, isPositive: true, label: 'vs last mo' }}
          badge="General Ledger"
          badgeColor="emerald"
        />

        <StatCard
          title="Operating OPEX"
          value={formatCurrency(410000)}
          icon={<TrendingUp className="w-5 h-5 text-rose-400" />}
          trend={{ value: 4.2, isPositive: false, label: 'vs budget' }}
          badge="Accounts Payable"
          badgeColor="rose"
        />

        <StatCard
          title="Plant Work Orders"
          value="18 Active"
          icon={<Factory className="w-5 h-5 text-blue-400" />}
          subtitle="3 scheduled today"
          badge="Shop Floor"
          badgeColor="blue"
        />

        <StatCard
          title="Critical Alerts"
          value={activeAlerts > 0 ? `${activeAlerts} Active` : '0 Nominal'}
          icon={<AlertTriangle className={`w-5 h-5 ${activeAlerts > 0 ? 'text-amber-400' : 'text-emerald-400'}`} />}
          badge={activeAlerts > 0 ? 'Action Required' : 'Optimal'}
          badgeColor={activeAlerts > 0 ? 'amber' : 'emerald'}
        />

        <StatCard
          title="AMR Robot Fleet"
          value="4 / 4 Units"
          icon={<Bot className="w-5 h-5 text-indigo-400" />}
          subtitle="2 missions in progress"
          badge="Autonomous"
          badgeColor="blue"
        />
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue vs Expenses Area Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                Financial Velocity: Revenue vs Operating Expenses
              </h3>
              <p className="text-xs text-slate-400">P&L General Ledger posting trend</p>
            </div>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={REVENUE_EXPENSE_DATA} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} tickFormatter={(val) => `$${val / 1000}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(val: any) => [formatCurrency(val), '']}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="revenue" name="Invoiced Revenue" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#revGrad)" />
                <Area type="monotone" dataKey="expenses" name="Plant Expenses" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#expGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Inventory Category Breakdown Donut */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Inventory Asset Valuation by Category
            </h3>
            <p className="text-xs text-slate-400">Warehouse holdings distribution</p>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={CATEGORY_DISTRIBUTION}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {CATEGORY_DISTRIBUTION.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(val: any) => [formatCurrency(val), 'Valuation']}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Production Machinery & Low Stock Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Machinery OEE Target Bar Chart */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Machinery Cell OEE vs Target Efficiency (%)
            </h3>
            <p className="text-xs text-slate-400">Real-time equipment uptime</p>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={PRODUCTION_CAPACITY_DATA} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="machine" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(val: any) => [`${val}%`, '']}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="output" name="Current OEE (%)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="target" name="Target OEE (%)" fill="#334155" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Low Stock Urgent Reorder Feed */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                Low Stock & Safety Buffer Watchlist
              </h3>
              <p className="text-xs text-slate-400">Requires purchase order procurement</p>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-400">
              {lowStockCount} Items
            </span>
          </div>

          <div className="space-y-2.5 max-h-64 overflow-y-auto">
            {inventory.slice(0, 4).map((item) => (
              <div
                key={item.inventoryId}
                className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between"
              >
                <div>
                  <h4 className="text-xs font-semibold text-slate-200">{item.productName}</h4>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    {item.warehouseName} • Min: {item.minStock} {item.unit}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-sm font-bold text-amber-400">
                    {item.quantity} {item.unit}
                  </span>
                  <div className="mt-1">
                    <StatusBadge status={item.stockStatus} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
