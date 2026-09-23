import React, { useState, useEffect } from 'react';
import { FileText, Download, Printer, Filter, RefreshCw, BarChart3, TrendingUp, Layers, CheckCircle } from 'lucide-react';
import { DataTable, Column } from '../../components/tables/DataTable';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { StatCard } from '../../components/ui/StatCard';
import { useNotification } from '../../context/NotificationContext';
import { reportService, GeneratedReport } from '../../services/reportService';

const REPORT_TYPES = [
  { label: 'Plant Inventory Valuation & Stock Balance', value: 'inventory' },
  { label: 'Critical Low Stock & Supply Reorder Triggers', value: 'low_stock' },
  { label: 'Vendor Procurement & Purchase Orders Summary', value: 'purchases' },
  { label: 'Commercial Invoicing & Sales Revenue Audit', value: 'sales' },
  { label: 'Plant Manufacturing Output & Work Order Yields', value: 'production' },
  { label: 'Plant Workforce Attendance & Gate Turnstile Audit', value: 'attendance' },
  { label: 'Factory Workforce Payroll & Compensation Ledger', value: 'payroll' },
  { label: 'Profit & Loss (P&L) Operating Financials', value: 'financials' },
  { label: 'Environmental & Machine Telemetry Alarms', value: 'iot_alerts' },
  { label: 'Autonomous Mobile Robot (AMR) Mission Efficiency', value: 'robots' },
];

export const ReportsHub: React.FC = () => {
  const [selectedReportType, setSelectedReportType] = useState('inventory');
  const [report, setReport] = useState<GeneratedReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useNotification();

  const loadReport = async (type: string) => {
    try {
      setIsLoading(true);
      const data = await reportService.generateReport(type);
      setReport(data);
    } catch (e: any) {
      showToast('error', 'Report Generation Failed', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReport(selectedReportType);
  }, [selectedReportType]);

  const handleExportCSV = () => {
    if (!report || !report.data || report.data.length === 0) {
      showToast('info', 'No Data', 'No records available to export.');
      return;
    }

    const headers = report.columns.map((c) => c.label).join(',');
    const rows = report.data.map((row) =>
      report.columns
        .map((c) => {
          const val = row[c.key] !== undefined ? row[c.key] : '';
          return `"${String(val).replace(/"/g, '""')}"`;
        })
        .join(',')
    );

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${report.id}_${selectedReportType}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('success', 'CSV Exported', `Downloaded ${report.title}.csv`);
  };

  const handlePrint = () => {
    window.print();
  };

  const dynamicColumns: Column<any>[] = (report?.columns || []).map((col) => ({
    key: col.key,
    header: col.label,
    sortable: true,
    render: (row: any) => {
      const val = row[col.key];
      if (typeof val === 'number') {
        return <span className="font-mono text-xs text-slate-200">{val.toLocaleString()}</span>;
      }
      return <span className="text-xs text-slate-300">{String(val || '—')}</span>;
    },
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Executive BI Analytics & SQL Query Reports</h2>
          <p className="text-xs text-slate-400 mt-1">
            Aggregated relational reports across ERP manufacturing, supply chain, workforce, and financial ledgers.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            onClick={() => loadReport(selectedReportType)}
            leftIcon={<RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />}
          >
            Re-Query DB
          </Button>
          <Button
            variant="secondary"
            onClick={handlePrint}
            leftIcon={<Printer className="w-4 h-4" />}
          >
            Print
          </Button>
          <Button
            variant="primary"
            onClick={handleExportCSV}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* Selector Toolbar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="w-full sm:w-96">
          <Select
            label="Select SQL Report Engine"
            value={selectedReportType}
            onChange={(e) => setSelectedReportType(e.target.value)}
            options={REPORT_TYPES}
          />
        </div>
        <div className="sm:mt-5 text-xs text-slate-400">
          Generated: <span className="font-mono text-slate-200">{report?.generatedAt || 'Just now'}</span> | ID: <span className="font-mono text-blue-400">{report?.id}</span>
        </div>
      </div>

      {/* Summary KPI Cards */}
      {report?.summaryMetrics && report.summaryMetrics.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {report.summaryMetrics.map((m, idx) => (
            <StatCard
              key={idx}
              title={m.label}
              value={String(m.value)}
              icon={<BarChart3 className="w-5 h-5 text-blue-400" />}
            />
          ))}
        </div>
      )}

      {/* Data Table */}
      {report && (
        <DataTable
          data={report.data || []}
          columns={dynamicColumns}
          rowKey={(row: any) =>
            row.id ||
            row.product_id ||
            row.productId ||
            row.po_id ||
            row.poId ||
            row.invoice_id ||
            row.invoiceId ||
            row.data_id ||
            row.dataId ||
            row.alert_id ||
            row.alertId ||
            row.attendance_id ||
            row.attendanceId ||
            row.payroll_id ||
            row.payrollId ||
            row.expense_id ||
            row.expenseId ||
            row.task_id ||
            row.taskId ||
            row.production_order_id ||
            row.productionOrderId ||
            JSON.stringify(row)
          }
          searchKey={(row: any) => Object.values(row).join(' ')}
          searchPlaceholder="Search within generated query records..."
          isLoading={isLoading}
        />
      )}
    </div>
  );
};
