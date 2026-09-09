import {
  initialUsers,
  initialDepartments,
  initialEmployees,
  initialAttendanceDevices,
  initialAttendanceRecords,
  initialPayrolls,
  initialProducts,
  initialWarehouses,
  initialShelves,
  initialInventory,
  initialSuppliers,
  initialPurchaseOrders,
  initialStockTransactions,
  initialMachines,
  initialProductionOrders,
  initialProductionLogs,
  initialRobots,
  initialRobotTasks,
  initialSensors,
  initialSensorData,
  initialAlerts,
  initialCustomers,
  initialInvoices,
  initialAccounts,
  initialJournalEntries,
  initialExpenses,
} from './mockData';

class MockStorage {
  private get<T>(key: string, fallback: T): T {
    try {
      const item = localStorage.getItem(`erp_${key}`);
      return item ? JSON.parse(item) : fallback;
    } catch {
      return fallback;
    }
  }

  private set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(`erp_${key}`, JSON.stringify(value));
    } catch (e) {
      console.error('Storage error:', e);
    }
  }

  // Users
  getUsers() { return this.get('users', initialUsers); }
  setUsers(val: typeof initialUsers) { this.set('users', val); }

  // Departments
  getDepartments() { return this.get('departments', initialDepartments); }
  setDepartments(val: typeof initialDepartments) { this.set('departments', val); }

  // Employees
  getEmployees() { return this.get('employees', initialEmployees); }
  setEmployees(val: typeof initialEmployees) { this.set('employees', val); }

  // Attendance Devices
  getAttendanceDevices() { return this.get('attendance_devices', initialAttendanceDevices); }
  setAttendanceDevices(val: typeof initialAttendanceDevices) { this.set('attendance_devices', val); }

  // Attendance Records
  getAttendanceRecords() { return this.get('attendance_records', initialAttendanceRecords); }
  setAttendanceRecords(val: typeof initialAttendanceRecords) { this.set('attendance_records', val); }

  // Payrolls
  getPayrolls() { return this.get('payrolls', initialPayrolls); }
  setPayrolls(val: typeof initialPayrolls) { this.set('payrolls', val); }

  // Products
  getProducts() { return this.get('products', initialProducts); }
  setProducts(val: typeof initialProducts) { this.set('products', val); }

  // Warehouses
  getWarehouses() { return this.get('warehouses', initialWarehouses); }
  setWarehouses(val: typeof initialWarehouses) { this.set('warehouses', val); }

  // Shelves
  getShelves() { return this.get('shelves', initialShelves); }
  setShelves(val: typeof initialShelves) { this.set('shelves', val); }

  // Inventory
  getInventory() { return this.get('inventory', initialInventory); }
  setInventory(val: typeof initialInventory) { this.set('inventory', val); }

  // Suppliers
  getSuppliers() { return this.get('suppliers', initialSuppliers); }
  setSuppliers(val: typeof initialSuppliers) { this.set('suppliers', val); }

  // Purchase Orders
  getPurchaseOrders() { return this.get('purchase_orders', initialPurchaseOrders); }
  setPurchaseOrders(val: typeof initialPurchaseOrders) { this.set('purchase_orders', val); }

  // Stock Transactions
  getStockTransactions() { return this.get('stock_transactions', initialStockTransactions); }
  setStockTransactions(val: typeof initialStockTransactions) { this.set('stock_transactions', val); }

  // Machines
  getMachines() { return this.get('machines', initialMachines); }
  setMachines(val: typeof initialMachines) { this.set('machines', val); }

  // Production Orders
  getProductionOrders() { return this.get('production_orders', initialProductionOrders); }
  setProductionOrders(val: typeof initialProductionOrders) { this.set('production_orders', val); }

  // Production Logs
  getProductionLogs() { return this.get('production_logs', initialProductionLogs); }
  setProductionLogs(val: typeof initialProductionLogs) { this.set('production_logs', val); }

  // Robots
  getRobots() { return this.get('robots', initialRobots); }
  setRobots(val: typeof initialRobots) { this.set('robots', val); }

  // Robot Tasks
  getRobotTasks() { return this.get('robot_tasks', initialRobotTasks); }
  setRobotTasks(val: typeof initialRobotTasks) { this.set('robot_tasks', val); }

  // Sensors
  getSensors() { return this.get('sensors', initialSensors); }
  setSensors(val: typeof initialSensors) { this.set('sensors', val); }

  // Sensor Data
  getSensorData() { return this.get('sensor_data', initialSensorData); }
  setSensorData(val: typeof initialSensorData) { this.set('sensor_data', val); }

  // Alerts
  getAlerts() { return this.get('alerts', initialAlerts); }
  setAlerts(val: typeof initialAlerts) { this.set('alerts', val); }

  // Customers
  getCustomers() { return this.get('customers', initialCustomers); }
  setCustomers(val: typeof initialCustomers) { this.set('customers', val); }

  // Invoices
  getInvoices() { return this.get('invoices', initialInvoices); }
  setInvoices(val: typeof initialInvoices) { this.set('invoices', val); }

  // Accounts
  getAccounts() { return this.get('accounts', initialAccounts); }
  setAccounts(val: typeof initialAccounts) { this.set('accounts', val); }

  // Journal Entries
  getJournalEntries() { return this.get('journal_entries', initialJournalEntries); }
  setJournalEntries(val: typeof initialJournalEntries) { this.set('journal_entries', val); }

  // Expenses
  getExpenses() { return this.get('expenses', initialExpenses); }
  setExpenses(val: typeof initialExpenses) { this.set('expenses', val); }

  // Reset entire database to initial seeds
  resetAll() {
    localStorage.clear();
  }
}

export const mockDb = new MockStorage();
