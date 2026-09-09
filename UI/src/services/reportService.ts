import { simulateLatency } from './api';
import { mockDb } from './mockStorage';

export interface GeneratedReport {
  id: string;
  title: string;
  category: string;
  generatedAt: string;
  summaryMetrics: { label: string; value: string | number; change?: string }[];
  columns: { key: string; label: string }[];
  data: Record<string, any>[];
}

export const reportService = {
  async generateReport(reportType: string): Promise<GeneratedReport> {
    await simulateLatency(300);
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    switch (reportType) {
      case 'inventory': {
        const items = mockDb.getInventory();
        const totalQty = items.reduce((s, i) => s + i.quantity, 0);
        const lowStock = items.filter((i) => i.stockStatus === 'LOW_STOCK').length;
        const outOfStock = items.filter((i) => i.stockStatus === 'OUT_OF_STOCK').length;

        return {
          id: 'RPT-INV',
          title: 'Comprehensive Inventory Valuation & Stock Report',
          category: 'Inventory',
          generatedAt: nowStr,
          summaryMetrics: [
            { label: 'Total Catalog Products', value: items.length },
            { label: 'Total Physical Units', value: totalQty },
            { label: 'Low Stock Items', value: lowStock },
            { label: 'Out of Stock Items', value: outOfStock },
          ],
          columns: [
            { key: 'productName', label: 'Product Name' },
            { key: 'category', label: 'Category' },
            { key: 'warehouseName', label: 'Warehouse' },
            { key: 'quantity', label: 'Current Qty' },
            { key: 'minStock', label: 'Min Level' },
            { key: 'stockStatus', label: 'Status' },
          ],
          data: items,
        };
      }

      case 'low_stock': {
        const items = mockDb.getInventory().filter((i) => i.stockStatus === 'LOW_STOCK' || i.stockStatus === 'OUT_OF_STOCK');
        return {
          id: 'RPT-LOW-STOCK',
          title: 'Critical Low Stock & Reorder Trigger Report',
          category: 'Inventory',
          generatedAt: nowStr,
          summaryMetrics: [
            { label: 'Actionable Reorders Needed', value: items.length },
            { label: 'Estimated Purchase Value', value: '$46,200.00' },
          ],
          columns: [
            { key: 'productName', label: 'Product Name' },
            { key: 'warehouseName', label: 'Location' },
            { key: 'quantity', label: 'Stock On Hand' },
            { key: 'minStock', label: 'Min Buffer' },
            { key: 'stockStatus', label: 'Severity' },
          ],
          data: items,
        };
      }

      case 'purchases': {
        const pos = mockDb.getPurchaseOrders();
        const totalAmount = pos.reduce((s, p) => s + p.totalAmount, 0);
        return {
          id: 'RPT-PO',
          title: 'Vendor Procurement & Purchase Orders Report',
          category: 'Procurement',
          generatedAt: nowStr,
          summaryMetrics: [
            { label: 'Total Purchase Orders', value: pos.length },
            { label: 'Total Spend', value: `$${totalAmount.toLocaleString()}` },
          ],
          columns: [
            { key: 'poId', label: 'PO Number' },
            { key: 'supplierName', label: 'Supplier' },
            { key: 'orderDate', label: 'Date' },
            { key: 'status', label: 'Status' },
            { key: 'totalAmount', label: 'Total ($)' },
          ],
          data: pos,
        };
      }

      case 'sales': {
        const invoices = mockDb.getInvoices();
        const totalSales = invoices.reduce((s, i) => s + i.totalAmount, 0);
        return {
          id: 'RPT-SALES',
          title: 'Sales Orders & Invoicing Revenue Report',
          category: 'Sales',
          generatedAt: nowStr,
          summaryMetrics: [
            { label: 'Total Invoices', value: invoices.length },
            { label: 'Gross Invoiced', value: `$${totalSales.toLocaleString()}` },
          ],
          columns: [
            { key: 'invoiceId', label: 'Invoice ID' },
            { key: 'customerName', label: 'Customer' },
            { key: 'invoiceDate', label: 'Date' },
            { key: 'status', label: 'Status' },
            { key: 'totalAmount', label: 'Total ($)' },
          ],
          data: invoices,
        };
      }

      case 'production': {
        const orders = mockDb.getProductionOrders();
        const totalProduced = orders.reduce((s, o) => s + o.producedQuantity, 0);
        return {
          id: 'RPT-PROD',
          title: 'Factory Floor Production Efficiency & Output Report',
          category: 'Manufacturing',
          generatedAt: nowStr,
          summaryMetrics: [
            { label: 'Production Runs', value: orders.length },
            { label: 'Units Manufactured', value: totalProduced },
            { label: 'Avg Line OEE', value: '94.8%' },
          ],
          columns: [
            { key: 'productionOrderId', label: 'Order ID' },
            { key: 'productName', label: 'Product' },
            { key: 'machineName', label: 'Machine' },
            { key: 'producedQuantity', label: 'Produced' },
            { key: 'quantity', label: 'Target' },
            { key: 'status', label: 'Status' },
          ],
          data: orders,
        };
      }

      case 'attendance': {
        const records = mockDb.getAttendanceRecords();
        return {
          id: 'RPT-ATT',
          title: 'Plant Workforce Attendance & Shift Audit Report',
          category: 'Human Resources',
          generatedAt: nowStr,
          summaryMetrics: [
            { label: 'Punches Recorded', value: records.length },
            { label: 'Shift Attendance Rate', value: '96.4%' },
          ],
          columns: [
            { key: 'employeeName', label: 'Employee' },
            { key: 'departmentName', label: 'Department' },
            { key: 'date', label: 'Date' },
            { key: 'checkIn', label: 'Check In' },
            { key: 'deviceName', label: 'Terminal / Gate' },
            { key: 'status', label: 'Status' },
          ],
          data: records,
        };
      }

      case 'payroll': {
        const payrolls = mockDb.getPayrolls();
        const totalDisbursed = payrolls.reduce((s, p) => s + p.netSalary, 0);
        return {
          id: 'RPT-PAY',
          title: 'Monthly Factory Payroll & Compensation Report',
          category: 'Finance',
          generatedAt: nowStr,
          summaryMetrics: [
            { label: 'Total Employees Paid', value: payrolls.length },
            { label: 'Net Disbursed', value: `$${totalDisbursed.toLocaleString()}` },
          ],
          columns: [
            { key: 'employeeName', label: 'Employee' },
            { key: 'departmentName', label: 'Department' },
            { key: 'month', label: 'Period' },
            { key: 'basicSalary', label: 'Basic' },
            { key: 'bonus', label: 'Bonus' },
            { key: 'netSalary', label: 'Net Salary ($)' },
            { key: 'status', label: 'Status' },
          ],
          data: payrolls,
        };
      }

      case 'financials': {
        const expenses = mockDb.getExpenses();
        const totalExp = expenses.reduce((s, e) => s + e.amount, 0);
        return {
          id: 'RPT-FIN',
          title: 'Revenue vs Operational Expenses (P&L) Report',
          category: 'Finance',
          generatedAt: nowStr,
          summaryMetrics: [
            { label: 'Operating Revenue', value: '$742,000.00' },
            { label: 'Factory Direct Costs', value: `$${(385000 + totalExp).toLocaleString()}` },
            { label: 'Net Operating Margin', value: '44.8%' },
          ],
          columns: [
            { key: 'expenseId', label: 'Expense ID' },
            { key: 'category', label: 'Category' },
            { key: 'accountName', label: 'Ledger Account' },
            { key: 'date', label: 'Date' },
            { key: 'amount', label: 'Amount ($)' },
            { key: 'status', label: 'Status' },
          ],
          data: expenses,
        };
      }

      case 'iot_alerts': {
        const alerts = mockDb.getAlerts();
        return {
          id: 'RPT-IOT',
          title: 'IoT Sensor Telemetry & Safety Incident Report',
          category: 'Plant Safety & IoT',
          generatedAt: nowStr,
          summaryMetrics: [
            { label: 'Total Logged Incidents', value: alerts.length },
            { label: 'Active Unresolved', value: alerts.filter((a) => a.status === 'ACTIVE').length },
          ],
          columns: [
            { key: 'alertId', label: 'Alert ID' },
            { key: 'sensorName', label: 'Sensor' },
            { key: 'alertType', label: 'Event Type' },
            { key: 'severity', label: 'Severity' },
            { key: 'time', label: 'Timestamp' },
            { key: 'status', label: 'Status' },
          ],
          data: alerts,
        };
      }

      case 'robots':
      default: {
        const tasks = mockDb.getRobotTasks();
        return {
          id: 'RPT-ROB',
          title: 'Autonomous Mobile Robot (AMR/AGV) Utilization Report',
          category: 'Logistics',
          generatedAt: nowStr,
          summaryMetrics: [
            { label: 'Autonomous Missions', value: tasks.length },
            { label: 'Fleet Efficiency', value: '99.1%' },
          ],
          columns: [
            { key: 'taskId', label: 'Task ID' },
            { key: 'robotName', label: 'Robot Assigned' },
            { key: 'productName', label: 'Material' },
            { key: 'quantity', label: 'Qty' },
            { key: 'targetLocation', label: 'Destination' },
            { key: 'status', label: 'Status' },
          ],
          data: tasks,
        };
      }
    }
  },
};
