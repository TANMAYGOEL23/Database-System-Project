import {
  INITIAL_USERS,
  INITIAL_DEPARTMENTS,
  INITIAL_EMPLOYEES,
  INITIAL_ATTENDANCE_DEVICES,
  INITIAL_ATTENDANCE,
  INITIAL_PAYROLL,
  INITIAL_PRODUCTS,
  INITIAL_WAREHOUSES,
  INITIAL_SHELVES,
  INITIAL_INVENTORY,
  INITIAL_SUPPLIERS,
  INITIAL_PURCHASE_ORDERS,
  INITIAL_STOCK_TRANSACTIONS,
  INITIAL_MACHINES,
  INITIAL_PRODUCTION_ORDERS,
  INITIAL_PRODUCTION_LOGS,
  INITIAL_ROBOTS,
  INITIAL_ROBOTS as _R,
  INITIAL_ROBOT_TASKS,
  INITIAL_SENSORS,
  INITIAL_SENSOR_DATA,
  INITIAL_ALERTS,
  INITIAL_CUSTOMERS,
  INITIAL_INVOICES,
  INITIAL_ACCOUNTS,
  INITIAL_JOURNAL_ENTRIES,
  INITIAL_EXPENSES,
} from './mockData';

class MockStorage {
  private prefix = 'smart_erp_';

  private getItem<T>(key: string, defaultVal: T): T {
    try {
      const item = localStorage.getItem(this.prefix + key);
      return item ? JSON.parse(item) : defaultVal;
    } catch {
      return defaultVal;
    }
  }

  private setItem<T>(key: string, val: T): void {
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(val));
    } catch (e) {
      console.error('Mock storage write failed', e);
    }
  }

  get users() { return this.getItem('users', INITIAL_USERS); }
  set users(val) { this.setItem('users', val); }

  get departments() { return this.getItem('departments', INITIAL_DEPARTMENTS); }
  set departments(val) { this.setItem('departments', val); }

  get employees() { return this.getItem('employees', INITIAL_EMPLOYEES); }
  set employees(val) { this.setItem('employees', val); }

  get attendanceDevices() { return this.getItem('attendance_devices', INITIAL_ATTENDANCE_DEVICES); }
  set attendanceDevices(val) { this.setItem('attendance_devices', val); }

  get attendance() { return this.getItem('attendance', INITIAL_ATTENDANCE); }
  set attendance(val) { this.setItem('attendance', val); }

  get payroll() { return this.getItem('payroll', INITIAL_PAYROLL); }
  set payroll(val) { this.setItem('payroll', val); }

  get products() { return this.getItem('products', INITIAL_PRODUCTS); }
  set products(val) { this.setItem('products', val); }

  get warehouses() { return this.getItem('warehouses', INITIAL_WAREHOUSES); }
  set warehouses(val) { this.setItem('warehouses', val); }

  get shelves() { return this.getItem('shelves', INITIAL_SHELVES); }
  set shelves(val) { this.setItem('shelves', val); }

  get inventory() { return this.getItem('inventory', INITIAL_INVENTORY); }
  set inventory(val) { this.setItem('inventory', val); }

  get suppliers() { return this.getItem('suppliers', INITIAL_SUPPLIERS); }
  set suppliers(val) { this.setItem('suppliers', val); }

  get purchaseOrders() { return this.getItem('purchase_orders', INITIAL_PURCHASE_ORDERS); }
  set purchaseOrders(val) { this.setItem('purchase_orders', val); }

  get stockTransactions() { return this.getItem('stock_transactions', INITIAL_STOCK_TRANSACTIONS); }
  set stockTransactions(val) { this.setItem('stock_transactions', val); }

  get machines() { return this.getItem('machines', INITIAL_MACHINES); }
  set machines(val) { this.setItem('machines', val); }

  get productionOrders() { return this.getItem('production_orders', INITIAL_PRODUCTION_ORDERS); }
  set productionOrders(val) { this.setItem('production_orders', val); }

  get productionLogs() { return this.getItem('production_logs', INITIAL_PRODUCTION_LOGS); }
  set productionLogs(val) { this.setItem('production_logs', val); }

  get robots() { return this.getItem('robots', INITIAL_ROBOTS); }
  set robots(val) { this.setItem('robots', val); }

  get robotTasks() { return this.getItem('robot_tasks', INITIAL_ROBOT_TASKS); }
  set robotTasks(val) { this.setItem('robot_tasks', val); }

  get sensors() { return this.getItem('sensors', INITIAL_SENSORS); }
  set sensors(val) { this.setItem('sensors', val); }

  get sensorData() { return this.getItem('sensor_data', INITIAL_SENSOR_DATA); }
  set sensorData(val) { this.setItem('sensor_data', val); }

  get alerts() { return this.getItem('alerts', INITIAL_ALERTS); }
  set alerts(val) { this.setItem('alerts', val); }

  get customers() { return this.getItem('customers', INITIAL_CUSTOMERS); }
  set customers(val) { this.setItem('customers', val); }

  get invoices() { return this.getItem('invoices', INITIAL_INVOICES); }
  set invoices(val) { this.setItem('invoices', val); }

  get accounts() { return this.getItem('accounts', INITIAL_ACCOUNTS); }
  set accounts(val) { this.setItem('accounts', val); }

  get journalEntries() { return this.getItem('journal_entries', INITIAL_JOURNAL_ENTRIES); }
  set journalEntries(val) { this.setItem('journal_entries', val); }

  get expenses() { return this.getItem('expenses', INITIAL_EXPENSES); }
  set expenses(val) { this.setItem('expenses', val); }

  resetToDefaults() {
    localStorage.clear();
  }
}

export const mockStorage = new MockStorage();
