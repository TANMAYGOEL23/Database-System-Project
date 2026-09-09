import React, { useState, useEffect } from 'react';
import {
  PieChart,
  FileSpreadsheet,
  Download,
  Printer,
  Calendar,
  Filter,
  Layers,
  Boxes,
  Truck,
  ShoppingCart,
  Factory,
  CalendarCheck2,
  Receipt,
  DollarSign,
  Activity,
  Bot,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/feedback/LoadingSpinner';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useNotification } from '../../context/NotificationContext';
import { reportService, GeneratedReport } from '../../services/reportService';
import { formatCurrency, formatDate } from '../../utils/formatters';

const REPORT_TABS = [
  { id: 'inventory', label: 'Inventory Valuation', icon: <Boxes className="w-4 h-4" /> },
  { id: 'low_stock', label: 'Low Stock & Reorder', icon: <Layers className="w-4 h-4" /> },
  { id: 'purchases', label: 'Procurement Orders', icon: <Truck className="w-4 h-4" /> },
  { id: 'sales', label: 'Sales & Invoicing', icon: <ShoppingCart className="w-4 h-4" /> },
  { id: 'production', label: 'Production Efficiency', icon: <Factory className="w-4 h-4" /> },
  { id: 'attendance', label: 'Workforce Attendance', icon: <CalendarCheck2 className="w-4 h-4" /> },
  { id: 'payroll', label: 'Payroll Disbursements', icon: <Receipt className="w-4 h-4" /> },
  { id: 'financials', label: 'Revenue vs OPEX (P&L)', icon: <DollarSign className="w-4 h-4" /> },
  { id: 'iot_alerts', label: 'IoT Incident Telemetry', icon: <Activity className="w-4 h-4" /> },
  { id: 'robots', label: 'AMR Fleet Missions', icon: <Bot className="w-4 h-4" /> },
];

export const ReportsHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('inventory');
  const [report, setReport] = useState<GeneratedReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { showToast } = useNotification();

  const loadReport = async (tabId: string) => {
    try {
      setIsLoading(true);
      const data = await reportService.generateReport(tabId);
      setReport(data);
    } catch (e: any) {
      showToast('error', 'Error Generating Report', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReport(activeTab);
  }, [activeTab]);

  const handleExportCSV = () => {
    if (!report) return;
    showToast(
      'success',
      'CSV Export Generated',
      `${report.title} exported as CSV spreadsheet (simulated download).`
    );
  };

  const handlePrint = () => {
    showToast('info', 'Print Spooler Ready', `Sending ${report?.title} to plant network printer.`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Executive Industrial Reports & Analytics Hub</h2>
          <p className="text-xs text-slate-400 mt-1">
            Standard 10-report audit suite querying across all PostgreSQL ERP relational schemas.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            onClick={handlePrint}
            leftIcon={<Printer className="w-4 h-4" />}
          >
            Print Report
          </Button>
          <Button
            variant="primary"
            onClick={handleExportCSV}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Export to CSV
          </Button>
        </div>
      </div>

      {/* 10 Report Type Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800 scrollbar-none">
        {REPORT_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Report Container */}
      {isLoading ? (
        <div className="py-20 flex justify-center">
          <LoadingSpinner message="Aggregating relational dataset and computing metrics..." size="lg" />
        </div>
      ) : report ? (
        <div className="space-y-6">
          {/* Report Summary Card */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-blue-400">
                  {report.category} Domain Report
                </span>
                <h3 className="text-xl font-bold text-white tracking-tight mt-0.5">{report.title}</h3>
              </div>
              <div className="text-left sm:text-right font-mono text-xs text-slate-400">
                <p>Generated: {report.generatedAt}</p>
                <p className="text-emerald-400 font-semibold">PostgreSQL Relational View Ready</p>
              </div>
            </div>

            {/* Metric KPI Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              {report.summaryMetrics.map((m, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1"
                >
                  <span className="text-xs text-slate-400">{m.label}</span>
                  <p className="font-mono text-lg font-bold text-slate-100">{m.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Report Data Table */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 shadow-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Detailed Report Records ({report.data.length} Rows)
              </h4>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-semibold uppercase border-b border-slate-800">
                  <tr>
                    {report.columns.map((col) => (
                      <th key={col.key} className="p-3.5">
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-normal">
                  {report.data.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-800/40 transition-colors">
                      {report.columns.map((col) => {
                        const val = row[col.key];

                        return (
                          <td key={col.key} className="p-3.5 whitespace-nowrap text-slate-200">
                            {col.key === 'status' || col.key === 'stockStatus' ? (
                              <StatusBadge status={String(val || '')} />
                            ) : typeof val === 'number' && (col.key.toLowerCase().includes('amount') || col.key.toLowerCase().includes('salary') || col.key.toLowerCase().includes('price')) ? (
                              <span className="font-mono text-emerald-400 font-semibold">
                                {formatCurrency(val)}
                              </span>
                            ) : (
                              String(val ?? '—')
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
