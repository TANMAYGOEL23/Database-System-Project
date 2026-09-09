import React, { useState, useEffect } from 'react';
import {
  Users,
  Boxes,
  AlertTriangle,
  Factory,
  CalendarCheck2,
  DollarSign,
  TrendingUp,
  CreditCard,
  Bot,
  Activity,
  Radio,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import { StatCard } from '../../components/ui/StatCard';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { LoadingSpinner } from '../../components/feedback/LoadingSpinner';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import { employeeService } from '../../services/employeeService';
import { inventoryService } from '../../services/inventoryService';
import { productionService } from '../../services/productionService';
import { attendanceService } from '../../services/attendanceService';
import { robotService } from '../../services/robotService';
import { sensorService } from '../../services/sensorService';
import { alertService } from '../../services/alertService';
import { departmentService } from '../../services/departmentService';
import { SimulateAttendanceModal } from '../../components/simulation/SimulateAttendanceModal';
import { SimulateSensorModal } from '../../components/simulation/SimulateSensorModal';
import { SimulateRobotTaskModal } from '../../components/simulation/SimulateRobotTaskModal';
import { useNavigate } from 'react-router-dom';

const CATEGORY_COLORS = ['#2563eb', '#0891b2', '#059669', '#d97706', '#8b5cf6', '#e11d48'];

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  // Stats
  const [employeeCount, setEmployeeCount] = useState(0);
  const [inventoryValue, setInventoryValue] = useState(1550000);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [activeOrdersCount, setActiveOrdersCount] = useState(0);
  const [todayAttendanceCount, setTodayAttendanceCount] = useState(0);
  const [activeRobotsCount, setActiveRobotsCount] = useState(0);
  const [activeAlertsCount, setActiveAlertsCount] = useState(0);

  // Chart data
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [deptHeadcount, setDeptHeadcount] = useState<any[]>([]);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [robotStatusData, setRobotStatusData] = useState<any[]>([]);
  const [recentSensors, setRecentSensors] = useState<any[]>([]);

  // Modals
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [isSensorModalOpen, setIsSensorModalOpen] = useState(false);
  const [isRobotModalOpen, setIsRobotModalOpen] = useState(false);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const [emps, inv, prods, depts, orders, atts, robs, alerts, sens] = await Promise.all([
        employeeService.getAll(),
        inventoryService.getAll(),
        productionService.getOrders(),
        departmentService.getAll(),
        productionService.getOrders(),
        attendanceService.getAllRecords(),
        robotService.getRobots(),
        alertService.getAll(),
        sensorService.getSensors(),
      ]);

      setEmployeeCount(emps.length);
      const lowItems = inv.filter((i) => i.stockStatus === 'LOW_STOCK' || i.stockStatus === 'OUT_OF_STOCK');
      setLowStockCount(lowItems.length);
      setLowStockItems(lowItems.slice(0, 5));

      const activeOrd = orders.filter((o) => o.status === 'IN_PROGRESS' || o.status === 'PLANNED');
      setActiveOrdersCount(activeOrd.length);

      const today = new Date().toISOString().split('T')[0];
      const todayAtt = atts.filter((a) => a.date === today && a.status === 'PRESENT');
      setTodayAttendanceCount(todayAtt.length);

      const activeRobs = robs.filter((r) => r.status === 'BUSY' || r.status === 'IDLE');
      setActiveRobotsCount(activeRobs.length);

      const actAlerts = alerts.filter((a) => a.status === 'ACTIVE');
      setActiveAlertsCount(actAlerts.length);

      // Category aggregation
      const catMap: Record<string, number> = {};
      inv.forEach((item) => {
        catMap[item.category] = (catMap[item.category] || 0) + item.quantity;
      });
      setCategoryData(
        Object.entries(catMap).map(([name, quantity]) => ({ name, quantity }))
      );

      // Department headcount
      setDeptHeadcount(
        depts.map((d) => ({ name: d.departmentName.split(' ')[0], employees: d.employeeCount }))
      );

      // Robot status breakdown
      const robStatusMap: Record<string, number> = {};
      robs.forEach((r) => {
        robStatusMap[r.status] = (robStatusMap[r.status] || 0) + 1;
      });
      setRobotStatusData(
        Object.entries(robStatusMap).map(([name, value]) => ({ name, value }))
      );

      setRecentSensors(sens);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Financial Trend Data
  const financialData = [
    { month: 'Mar', revenue: 580000, expenses: 390000, profit: 190000 },
    { month: 'Apr', revenue: 620000, expenses: 410000, profit: 210000 },
    { month: 'May', revenue: 690000, expenses: 430000, profit: 260000 },
    { month: 'Jun', revenue: 640000, expenses: 405000, profit: 235000 },
    { month: 'Jul', revenue: 710000, expenses: 440000, profit: 270000 },
    { month: 'Aug', revenue: 742000, expenses: 427700, profit: 314300 },
  ];

  // Production Output Trend Data
  const productionTrendData = [
    { day: 'Mon', output: 240, planned: 250 },
    { day: 'Tue', output: 280, planned: 260 },
    { day: 'Wed', output: 310, planned: 300 },
    { day: 'Thu', output: 295, planned: 300 },
    { day: 'Fri', output: 340, planned: 320 },
    { day: 'Sat', output: 190, planned: 180 },
    { day: 'Sun', output: 80, planned: 70 },
  ];

  if (isLoading) {
    return (
      <div className="py-20 flex justify-center">
        <LoadingSpinner message="Aggregating industrial ERP metrics across all modules..." size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Top Banner with Fast Simulator Actions */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/40 p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-400 font-mono text-xs font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Industrial Operations Control Center</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Factory System Telemetry & Executive Dashboard
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Real-time monitoring across PostgreSQL relational modules: HR, Inventory, CNC Manufacturing, AGV Robotics, IoT Sensors, and Financial Ledgers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="emerald"
            size="sm"
            onClick={() => setIsAttendanceModalOpen(true)}
            leftIcon={<Radio className="w-4 h-4" />}
          >
            Simulate Gate
          </Button>
          <Button
            variant="industrial"
            size="sm"
            onClick={() => setIsSensorModalOpen(true)}
            leftIcon={<Activity className="w-4 h-4" />}
          >
            Simulate IoT
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsRobotModalOpen(true)}
            leftIcon={<Bot className="w-4 h-4" />}
          >
            Dispatch AGV
          </Button>
        </div>
      </div>

      {/* 10 KPI Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Workforce"
          value={employeeCount}
          subtitle="Across 6 Departments"
          icon={<Users className="w-5 h-5" />}
          variant="blue"
          trend={{ value: '+2 this month', direction: 'up' }}
        />
        <StatCard
          title="Inventory Valuation"
          value={formatCurrency(inventoryValue)}
          subtitle="Valued at Cost Price"
          icon={<Boxes className="w-5 h-5" />}
          variant="indigo"
          trend={{ value: '+4.2%', direction: 'up' }}
        />
        <StatCard
          title="Low Stock Alerts"
          value={lowStockCount}
          subtitle="Below Safety Threshold"
          icon={<AlertTriangle className="w-5 h-5" />}
          variant={lowStockCount > 0 ? 'amber' : 'slate'}
          trend={{ value: `${lowStockCount} critical`, direction: lowStockCount > 0 ? 'down' : 'neutral' }}
        />
        <StatCard
          title="Active Production"
          value={activeOrdersCount}
          subtitle="CNC & Assembly Runs"
          icon={<Factory className="w-5 h-5" />}
          variant="cyan"
          trend={{ value: '96.4% OEE', direction: 'up' }}
        />
        <StatCard
          title="Today's Attendance"
          value={`${todayAttendanceCount} Present`}
          subtitle="8 RFID Punches Logged"
          icon={<CalendarCheck2 className="w-5 h-5" />}
          variant="emerald"
          trend={{ value: '100% On-Shift', direction: 'up' }}
        />
        <StatCard
          title="Operating Revenue"
          value="$742,000"
          subtitle="Aug Invoiced Sales"
          icon={<DollarSign className="w-5 h-5" />}
          variant="emerald"
          trend={{ value: '+8.5% YoY', direction: 'up' }}
        />
        <StatCard
          title="Factory Expenses"
          value="$427,700"
          subtitle="COGS + Power & Labor"
          icon={<CreditCard className="w-5 h-5" />}
          variant="rose"
          trend={{ value: 'Within budget', direction: 'neutral' }}
        />
        <StatCard
          title="Net Operating Profit"
          value="$314,300"
          subtitle="42.3% Net Margin"
          icon={<TrendingUp className="w-5 h-5" />}
          variant="emerald"
          trend={{ value: '+12.4%', direction: 'up' }}
        />
        <StatCard
          title="Fleet AGV / AMR"
          value={`${activeRobotsCount} Active`}
          subtitle="5 Autonomous Units"
          icon={<Bot className="w-5 h-5" />}
          variant="indigo"
          trend={{ value: '100% Operational', direction: 'up' }}
        />
        <StatCard
          title="Active IoT Alerts"
          value={activeAlertsCount}
          subtitle="Telemetry Warnings"
          icon={<Activity className="w-5 h-5" />}
          variant={activeAlertsCount > 0 ? 'rose' : 'slate'}
          trend={{ value: `${activeAlertsCount} Pending`, direction: activeAlertsCount > 0 ? 'down' : 'neutral' }}
        />
      </div>

      {/* Row 1 Charts: Financials & Production Output */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Financial Performance Chart */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                Financial Performance (Revenue vs Expenses vs Profit)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Six-Month Ledger Trend ($ USD)</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/accounting/accounts')}>
              Ledger <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={financialData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} tickFormatter={(val) => `$${val / 1000}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(val: any) => [`$${Number(val).toLocaleString()}`, '']}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="revenue" name="Revenue" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="profit" name="Net Profit" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Manufacturing Output Progress */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                Weekly Production Output vs Planned Capacity
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Units produced across CNC & Automated Lines</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/production/orders')}>
              Orders <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={productionTrendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="outputColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0891b2" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#0891b2" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Area type="monotone" dataKey="output" name="Actual Units Produced" stroke="#0891b2" fillOpacity={1} fill="url(#outputColor)" />
                <Line type="monotone" dataKey="planned" name="Planned Target" stroke="#f59e0b" strokeDasharray="4 4" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2 Charts: Inventory Category Split & Low-Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inventory Stock by Category */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider mb-1">
            Inventory Units by Category
          </h3>
          <p className="text-xs text-slate-400 mb-4">Live distribution across 3 plant warehouses</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="quantity"
                  nameKey="name"
                >
                  {categoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(val: any) => [`${val} Units`, 'Quantity']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-1.5 mt-2">
            {categoryData.slice(0, 4).map((cat, idx) => (
              <div key={cat.name} className="flex items-center gap-1.5 text-[11px] text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }} />
                <span className="truncate">{cat.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock Warning Table */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-xl lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                  Critical Low Stock Warning List
                </h3>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/inventory/stock')}>
                View Matrix <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Items currently at or below minimum threshold reserve requirement.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 text-slate-400 uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Product Name</th>
                    <th className="py-2.5 px-3">Warehouse</th>
                    <th className="py-2.5 px-3">Available</th>
                    <th className="py-2.5 px-3">Min Reserve</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {lowStockItems.map((item) => (
                    <tr key={item.inventoryId} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-medium text-slate-200">{item.productName}</td>
                      <td className="py-2.5 px-3 text-slate-400">{item.warehouseName}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-amber-400">{item.quantity} {item.unit}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-400">{item.minStock} {item.unit}</td>
                      <td className="py-2.5 px-3">
                        <StatusBadge status={item.stockStatus} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-800 flex justify-between items-center text-xs">
            <span className="text-slate-400 font-mono">Suggested Action: Issue PO via Suppliers module</span>
            <Button variant="primary" size="sm" onClick={() => navigate('/inventory/purchase-orders')}>
              Create Purchase Order
            </Button>
          </div>
        </div>
      </div>

      {/* Row 3: Department Headcounts & Live IoT Sensors Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Headcount Bar Chart */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                Headcount by Department
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Active staff distributed across plant teams</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/hr/departments')}>
              Departments <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptHeadcount} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="employees" name="Employees" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live IoT Sensors & Robot Status Grid */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                IoT Sensor Telemetry & Fleet Status
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Software simulated environmental monitoring</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/iot/sensors')}>
              Sensors <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>

          <div className="space-y-3">
            {recentSensors.slice(0, 4).map((sensor) => (
              <div
                key={sensor.sensorId}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-blue-600/10 text-cyan-400 border border-cyan-500/20">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-200">{sensor.sensorName}</h4>
                    <p className="text-[10px] text-slate-400">📍 {sensor.location}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono text-sm font-bold text-slate-100">
                    {sensor.lastReading} {sensor.unit}
                  </span>
                  <div>
                    <StatusBadge status={sensor.status} className="text-[9px] py-0 px-1.5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Simulation Modals */}
      <SimulateAttendanceModal
        isOpen={isAttendanceModalOpen}
        onClose={() => setIsAttendanceModalOpen(false)}
        onSuccess={loadDashboardData}
      />
      <SimulateSensorModal
        isOpen={isSensorModalOpen}
        onClose={() => setIsSensorModalOpen(false)}
        onSuccess={loadDashboardData}
      />
      <SimulateRobotTaskModal
        isOpen={isRobotModalOpen}
        onClose={() => setIsRobotModalOpen(false)}
        onSuccess={loadDashboardData}
      />
    </div>
  );
};
