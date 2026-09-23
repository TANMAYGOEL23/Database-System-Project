import { delay } from './api';
import { supabase, isSupabaseConfigured } from './supabase';
import { mockStorage } from './mockStorage';

export interface GeneratedReport {
  id: string;
  title: string;
  category: string;
  generatedAt: string;
  summaryMetrics: { label: string; value: string | number }[];
  columns: { key: string; label: string }[];
  data: any[];
}

export const reportService = {
  async generateReport(reportType: string, _params?: any): Promise<GeneratedReport> {
    const now = new Date().toLocaleString();

    if (isSupabaseConfigured()) {
      try {
        switch (reportType) {
          case 'inventory': {
            const { data: inv } = await supabase.from('inventory').select('*');
            const items = inv || [];
            const { data: prods } = await supabase.from('products').select('*');
            const totalValuation = items.reduce((sum, i) => {
              const prd = (prods || []).find((p) => p.product_id === i.product_id);
              return sum + (i.quantity || 0) * (prd?.cost_price || 0);
            }, 0);

            return {
              id: 'REP-INV-01',
              title: 'Plant Inventory Valuation & Stock Status Report',
              category: 'Inventory',
              generatedAt: now,
              summaryMetrics: [
                { label: 'SKU Item Count', value: items.length },
                { label: 'Total Stock Quantity', value: items.reduce((s, i) => s + (i.quantity || 0), 0) },
                { label: 'Total Asset Valuation', value: `$${totalValuation.toLocaleString()}` },
                { label: 'Low Stock Alerts', value: items.filter((i) => i.stock_status === 'LOW_STOCK').length },
              ],
              columns: [
                { key: 'product_id', label: 'SKU ID' },
                { key: 'product_name', label: 'Product Title' },
                { key: 'warehouse_name', label: 'Warehouse Location' },
                { key: 'quantity', label: 'In Stock' },
                { key: 'stock_status', label: 'Status' },
              ],
              data: items,
            };
          }

          case 'low_stock': {
            const { data: low } = await supabase.from('inventory').select('*').or('stock_status.eq.LOW_STOCK,stock_status.eq.OUT_OF_STOCK');
            const items = low || [];
            return {
              id: 'REP-LOW-01',
              title: 'Low Stock & Reorder Trigger Report',
              category: 'Supply Chain',
              generatedAt: now,
              summaryMetrics: [
                { label: 'Critical Items Requiring PO', value: items.length },
                { label: 'Affected Warehouses', value: new Set(items.map((l) => l.warehouse_id)).size },
              ],
              columns: [
                { key: 'product_id', label: 'Product Code' },
                { key: 'product_name', label: 'Product Name' },
                { key: 'warehouse_name', label: 'Warehouse' },
                { key: 'quantity', label: 'Current Level' },
                { key: 'min_stock', label: 'Safety Threshold' },
                { key: 'stock_status', label: 'Urgency' },
              ],
              data: items,
            };
          }

          case 'purchases': {
            const { data: pos } = await supabase.from('purchase_orders').select('*');
            const items = pos || [];
            const totalSpend = items.reduce((s, p) => s + parseFloat(p.total_amount || 0), 0);
            return {
              id: 'REP-PO-01',
              title: 'Vendor Procurement & Purchase Orders Summary',
              category: 'Procurement',
              generatedAt: now,
              summaryMetrics: [
                { label: 'Total Purchase Orders', value: items.length },
                { label: 'Cumulative PO Value', value: `$${totalSpend.toLocaleString()}` },
                { label: 'Pending Deliveries', value: items.filter((p) => p.status === 'APPROVED' || p.status === 'PENDING').length },
              ],
              columns: [
                { key: 'po_id', label: 'PO Reference' },
                { key: 'supplier_name', label: 'Supplier Vendor' },
                { key: 'order_date', label: 'Date Issued' },
                { key: 'total_amount', label: 'Gross Value' },
                { key: 'status', label: 'Fulfillment Status' },
              ],
              data: items,
            };
          }

          case 'sales': {
            const { data: invs } = await supabase.from('invoices').select('*');
            const items = invs || [];
            const totalRev = items.reduce((s, i) => s + parseFloat(i.total_amount || 0), 0);
            return {
              id: 'REP-SAL-01',
              title: 'Commercial Invoicing & Sales Revenue Audit',
              category: 'Sales',
              generatedAt: now,
              summaryMetrics: [
                { label: 'Invoices Billed', value: items.length },
                { label: 'Gross Invoiced Sales', value: `$${totalRev.toLocaleString()}` },
                { label: 'Paid Revenue Collected', value: `$${items.filter((i) => i.status === 'PAID').reduce((s, i) => s + parseFloat(i.total_amount || 0), 0).toLocaleString()}` },
              ],
              columns: [
                { key: 'invoice_id', label: 'Invoice No.' },
                { key: 'customer_name', label: 'Customer Client' },
                { key: 'invoice_date', label: 'Billing Date' },
                { key: 'total_amount', label: 'Amount ($)' },
                { key: 'status', label: 'Payment State' },
              ],
              data: items,
            };
          }

          case 'production': {
            const { data: ords } = await supabase.from('production_orders').select('*');
            const items = ords || [];
            const totalUnits = items.reduce((s, o) => s + parseInt(o.produced_quantity || 0, 10), 0);
            return {
              id: 'REP-PRD-01',
              title: 'Plant Manufacturing Output & Work Order Performance',
              category: 'Manufacturing',
              generatedAt: now,
              summaryMetrics: [
                { label: 'Work Orders Scheduled', value: items.length },
                { label: 'Cumulative Units Produced', value: totalUnits },
                { label: 'Completed Batches', value: items.filter((o) => o.status === 'COMPLETED').length },
              ],
              columns: [
                { key: 'production_order_id', label: 'Work Order' },
                { key: 'product_name', label: 'Product Manufactured' },
                { key: 'machine_name', label: 'Machinery Cell' },
                { key: 'produced_quantity', label: 'Units Complete' },
                { key: 'status', label: 'Work Order State' },
              ],
              data: items,
            };
          }

          case 'attendance': {
            const { data: att } = await supabase.from('attendance').select('*');
            const items = att || [];
            return {
              id: 'REP-ATT-01',
              title: 'Plant Workforce Attendance & Gate Turnstile Audit',
              category: 'Human Resources',
              generatedAt: now,
              summaryMetrics: [
                { label: 'Total Recorded Shifts', value: items.length },
                { label: 'On-Time Present', value: items.filter((a) => a.status === 'PRESENT').length },
                { label: 'Late Gate Check-ins', value: items.filter((a) => a.status === 'LATE').length },
              ],
              columns: [
                { key: 'attendance_id', label: 'Record ID' },
                { key: 'employee_name', label: 'Staff Member' },
                { key: 'department_name', label: 'Department' },
                { key: 'check_in', label: 'Check-In' },
                { key: 'status', label: 'Punch Status' },
              ],
              data: items,
            };
          }

          case 'payroll': {
            const { data: pay } = await supabase.from('payroll').select('*');
            const items = pay || [];
            const totalDisbursed = items.reduce((s, p) => s + parseFloat(p.net_salary || 0), 0);
            return {
              id: 'REP-PAY-01',
              title: 'Factory Workforce Payroll & Compensation Ledger',
              category: 'Human Resources',
              generatedAt: now,
              summaryMetrics: [
                { label: 'Pay Slips Processed', value: items.length },
                { label: 'Total Net Salary Paid', value: `$${totalDisbursed.toLocaleString()}` },
              ],
              columns: [
                { key: 'payroll_id', label: 'Slip ID' },
                { key: 'employee_name', label: 'Employee' },
                { key: 'month', label: 'Month' },
                { key: 'basic_salary', label: 'Basic' },
                { key: 'net_salary', label: 'Net Take-Home' },
                { key: 'status', label: 'Disbursement' },
              ],
              data: items,
            };
          }

          case 'financials': {
            const { data: invs } = await supabase.from('invoices').select('*');
            const { data: exps } = await supabase.from('expenses').select('*');
            const { data: pays } = await supabase.from('payroll').select('*');

            const rev = (invs || []).reduce((s, i) => s + parseFloat(i.total_amount || 0), 0);
            const exp = (exps || []).reduce((s, e) => s + parseFloat(e.amount || 0), 0) + (pays || []).reduce((s, p) => s + parseFloat(p.net_salary || 0), 0);
            const net = rev - exp;
            return {
              id: 'REP-FIN-01',
              title: 'Profit & Loss (P&L) and Operational Financials',
              category: 'Finance',
              generatedAt: now,
              summaryMetrics: [
                { label: 'Total Invoiced Revenue', value: `$${rev.toLocaleString()}` },
                { label: 'Total OPEX & Payroll', value: `$${exp.toLocaleString()}` },
                { label: 'Net Operating Margin', value: `$${net.toLocaleString()}` },
              ],
              columns: [
                { key: 'expense_id', label: 'Txn Ref' },
                { key: 'account_name', label: 'Account Category' },
                { key: 'description', label: 'Memo' },
                { key: 'amount', label: 'Amount ($)' },
                { key: 'date', label: 'Posting Date' },
              ],
              data: exps || [],
            };
          }

          case 'iot_alerts': {
            const { data: alts } = await supabase.from('alerts').select('*');
            const items = alts || [];
            return {
              id: 'REP-IOT-01',
              title: 'Factory Environmental & Machine Safety Incidents',
              category: 'IoT & Telemetry',
              generatedAt: now,
              summaryMetrics: [
                { label: 'Total Incidents Logged', value: items.length },
                { label: 'Active Critical Alarms', value: items.filter((a) => a.status === 'ACTIVE').length },
                { label: 'Resolved Incidents', value: items.filter((a) => a.status === 'RESOLVED').length },
              ],
              columns: [
                { key: 'alert_id', label: 'Alert Code' },
                { key: 'alert_type', label: 'Incident Type' },
                { key: 'location', label: 'Plant Zone' },
                { key: 'severity', label: 'Severity' },
                { key: 'status', label: 'Status' },
              ],
              data: items,
            };
          }

          case 'robots':
          default: {
            const { data: robs } = await supabase.from('robot_tasks').select('*');
            const items = robs || [];
            return {
              id: 'REP-ROB-01',
              title: 'Autonomous Mobile Robot (AMR) Mission Efficiency',
              category: 'Robotics',
              generatedAt: now,
              summaryMetrics: [
                { label: 'Dispatched Missions', value: items.length },
                { label: 'Active AMR In-Transit', value: items.filter((r) => r.status === 'IN_PROGRESS' || r.status === 'ASSIGNED').length },
                { label: 'Completed Deliveries', value: items.filter((r) => r.status === 'COMPLETED').length },
              ],
              columns: [
                { key: 'task_id', label: 'Mission ID' },
                { key: 'robot_name', label: 'Assigned Robot' },
                { key: 'product_name', label: 'Material Payload' },
                { key: 'target_location', label: 'Drop-off Target' },
                { key: 'status', label: 'Mission State' },
              ],
              data: items,
            };
          }
        }
      } catch (e) {
        console.warn('Supabase report query failed, using mock data', e);
      }
    }

    // Mock Fallback
    await delay(300);
    const inv = mockStorage.inventory;
    return {
      id: 'REP-INV-01',
      title: 'Plant Inventory Valuation & Stock Status Report',
      category: 'Inventory',
      generatedAt: now,
      summaryMetrics: [
        { label: 'SKU Item Count', value: inv.length },
        { label: 'Total Stock Quantity', value: inv.reduce((s, i) => s + i.quantity, 0) },
        { label: 'Total Asset Valuation', value: `$485,000` },
      ],
      columns: [
        { key: 'productId', label: 'SKU ID' },
        { key: 'productName', label: 'Product Title' },
        { key: 'warehouseName', label: 'Warehouse Location' },
        { key: 'quantity', label: 'In Stock' },
        { key: 'stockStatus', label: 'Status' },
      ],
      data: inv,
    };
  },
};
