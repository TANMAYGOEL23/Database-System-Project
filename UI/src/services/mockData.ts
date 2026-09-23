import { User } from '../types/auth';
import { Department, Employee, AttendanceRecord, Payroll, AttendanceDevice } from '../types/hr';
import { Product, Warehouse, Shelf, InventoryItem, Supplier, PurchaseOrder, StockTransaction } from '../types/inventory';
import { Machine, ProductionOrder, ProductionLog } from '../types/production';
import { Robot, RobotTask } from '../types/warehouse';
import { Sensor, SensorData, Alert } from '../types/iot';
import { Customer, Invoice } from '../types/sales';
import { Account, JournalEntry, Expense } from '../types/accounting';

export const INITIAL_USERS: User[] = [
  {
    userId: 'USR001',
    employeeId: 'EMP001',
    username: 'admin',
    role: 'ADMIN',
    status: 'ACTIVE',
    fullName: 'Alexander Vance',
    email: 'alexander.vance@megafactory.internal',
    departmentName: 'Executive Operations',
    position: 'Chief Plant Operating Officer',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  },
  {
    userId: 'USR002',
    employeeId: 'EMP004',
    username: 'operator',
    role: 'EMPLOYEE',
    status: 'ACTIVE',
    fullName: 'Marcus Brody',
    email: 'marcus.brody@megafactory.internal',
    departmentName: 'Machining & Assembly',
    position: 'Lead CNC Mill Machinist',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  },
];

export const INITIAL_DEPARTMENTS: Department[] = [
  { departmentId: 'DEP001', departmentName: 'Executive Operations', managerId: 'EMP001', managerName: 'Alexander Vance', employeeCount: 4, location: 'Building A, Floor 3' },
  { departmentId: 'DEP002', departmentName: 'Machining & Assembly', managerId: 'EMP002', managerName: 'Elena Rostova', employeeCount: 38, location: 'Plant 1, South Wing' },
  { departmentId: 'DEP003', departmentName: 'Warehouse & Logistics', managerId: 'EMP003', managerName: 'Devon Miles', employeeCount: 24, location: 'Logistics Hub Bay 4' },
  { departmentId: 'DEP004', departmentName: 'Quality & Testing', managerId: 'EMP005', managerName: 'Rachel Green', employeeCount: 12, location: 'Building B, Lab 2' },
  { departmentId: 'DEP005', departmentName: 'Robotics & Automation', managerId: 'EMP006', managerName: 'Vikram Patel', employeeCount: 16, location: 'Automation Cell A-4' },
];

export const INITIAL_EMPLOYEES: Employee[] = [
  { employeeId: 'EMP001', firstName: 'Alexander', lastName: 'Vance', fullName: 'Alexander Vance', gender: 'MALE', phone: '+1 (555) 019-2834', email: 'alexander.vance@megafactory.internal', address: '742 Evergreen Terrace, Industrial Park', departmentId: 'DEP001', departmentName: 'Executive Operations', salary: 145000, joiningDate: '2021-03-15', status: 'ACTIVE', position: 'Chief Operating Officer' },
  { employeeId: 'EMP002', firstName: 'Elena', lastName: 'Rostova', fullName: 'Elena Rostova', gender: 'FEMALE', phone: '+1 (555) 019-8832', email: 'elena.rostova@megafactory.internal', address: '128 Industrial Parkway, Sector 4', departmentId: 'DEP002', departmentName: 'Machining & Assembly', salary: 112000, joiningDate: '2021-06-01', status: 'ACTIVE', position: 'Plant Fabrication Manager' },
  { employeeId: 'EMP003', firstName: 'Devon', lastName: 'Miles', fullName: 'Devon Miles', gender: 'MALE', phone: '+1 (555) 019-4411', email: 'devon.miles@megafactory.internal', address: '88 Logistics Blvd, Dock 2', departmentId: 'DEP003', departmentName: 'Warehouse & Logistics', salary: 95000, joiningDate: '2022-01-10', status: 'ACTIVE', position: 'Supply Chain Director' },
  { employeeId: 'EMP004', firstName: 'Marcus', lastName: 'Brody', fullName: 'Marcus Brody', gender: 'MALE', phone: '+1 (555) 019-9943', email: 'marcus.brody@megafactory.internal', address: '450 Foundry Lane, Apt 3B', departmentId: 'DEP002', departmentName: 'Machining & Assembly', salary: 72000, joiningDate: '2022-08-15', status: 'ACTIVE', position: 'Lead CNC Mill Machinist' },
  { employeeId: 'EMP005', firstName: 'Rachel', lastName: 'Green', fullName: 'Rachel Green', gender: 'FEMALE', phone: '+1 (555) 019-6621', email: 'rachel.green@megafactory.internal', address: '912 Precision Road', departmentId: 'DEP004', departmentName: 'Quality & Testing', salary: 88000, joiningDate: '2023-02-01', status: 'ACTIVE', position: 'QA Lead Metrologist' },
  { employeeId: 'EMP006', firstName: 'Vikram', lastName: 'Patel', fullName: 'Vikram Patel', gender: 'MALE', phone: '+1 (555) 019-3356', email: 'vikram.patel@megafactory.internal', address: '22 Robotics Way', departmentId: 'DEP005', departmentName: 'Robotics & Automation', salary: 118000, joiningDate: '2022-11-20', status: 'ACTIVE', position: 'Robotics Systems Architect' },
];

export const INITIAL_ATTENDANCE_DEVICES: AttendanceDevice[] = [
  { deviceId: 'DEV001', deviceName: 'Gate 1 Turnstile Biometric Scanner', location: 'Main Entrance Security Gate', deviceType: 'BIOMETRIC', status: 'ONLINE', lastPing: 'Just now' },
  { deviceId: 'DEV002', deviceName: 'Plant 1 RFID Gantry Sensor', location: 'Machining Floor West Gate', deviceType: 'RFID_GATE', status: 'ONLINE', lastPing: 'Just now' },
  { deviceId: 'DEV003', deviceName: 'Logistics Bay 4 Scanner', location: 'Warehouse North Gate', deviceType: 'RFID_GATE', status: 'ONLINE', lastPing: '1 min ago' },
];

export const INITIAL_ATTENDANCE: AttendanceRecord[] = [
  { attendanceId: 'ATT1001', employeeId: 'EMP001', employeeName: 'Alexander Vance', departmentName: 'Executive Operations', date: '2026-09-22', checkIn: '07:45 AM', checkOut: '05:15 PM', deviceId: 'DEV001', deviceName: 'Gate 1 Turnstile Biometric Scanner', status: 'PRESENT', workHours: 9.5 },
  { attendanceId: 'ATT1002', employeeId: 'EMP002', employeeName: 'Elena Rostova', departmentName: 'Machining & Assembly', date: '2026-09-22', checkIn: '07:58 AM', checkOut: '04:45 PM', deviceId: 'DEV002', deviceName: 'Plant 1 RFID Gantry Sensor', status: 'PRESENT', workHours: 8.8 },
  { attendanceId: 'ATT1003', employeeId: 'EMP003', employeeName: 'Devon Miles', departmentName: 'Warehouse & Logistics', date: '2026-09-22', checkIn: '08:12 AM', checkOut: '05:00 PM', deviceId: 'DEV003', deviceName: 'Logistics Bay 4 Scanner', status: 'LATE', workHours: 8.8 },
  { attendanceId: 'ATT1004', employeeId: 'EMP004', employeeName: 'Marcus Brody', departmentName: 'Machining & Assembly', date: '2026-09-22', checkIn: '06:50 AM', deviceId: 'DEV002', deviceName: 'Plant 1 RFID Gantry Sensor', status: 'PRESENT', workHours: 7.2 },
  { attendanceId: 'ATT1005', employeeId: 'EMP005', employeeName: 'Rachel Green', departmentName: 'Quality & Testing', date: '2026-09-22', checkIn: '08:00 AM', checkOut: '04:30 PM', deviceId: 'DEV001', deviceName: 'Gate 1 Turnstile Biometric Scanner', status: 'PRESENT', workHours: 8.5 },
];

export const INITIAL_PAYROLL: Payroll[] = [
  { payrollId: 'PAY202608-01', employeeId: 'EMP001', employeeName: 'Alexander Vance', departmentName: 'Executive Operations', month: 'August', year: 2026, basicSalary: 12083.33, bonus: 2500, deduction: 1850, netSalary: 12733.33, status: 'PAID', paymentDate: '2026-08-31', notes: 'Executive performance incentive' },
  { payrollId: 'PAY202608-02', employeeId: 'EMP002', employeeName: 'Elena Rostova', departmentName: 'Machining & Assembly', month: 'August', year: 2026, basicSalary: 9333.33, bonus: 1200, deduction: 1100, netSalary: 9433.33, status: 'PAID', paymentDate: '2026-08-31', notes: 'Monthly plant target bonus' },
  { payrollId: 'PAY202608-03', employeeId: 'EMP004', employeeName: 'Marcus Brody', departmentName: 'Machining & Assembly', month: 'August', year: 2026, basicSalary: 6000.00, bonus: 750, deduction: 620, netSalary: 6130.00, status: 'PAID', paymentDate: '2026-08-31', notes: 'Overtime shift compensation (32 hrs)' },
];

export const INITIAL_PRODUCTS: Product[] = [
  { productId: 'PRD-HYD-01', productName: 'High-Pressure Hydraulic Actuator 250BAR', category: 'Hydraulics', costPrice: 420.00, sellingPrice: 780.00, barcode: '8901234567890', unit: 'PCS', description: 'Dual-action industrial cylinder for heavy presses and cranes', totalStock: 48 },
  { productId: 'PRD-CNC-SP', productName: 'Tungsten Carbide CNC End Mill Drill 12mm', category: 'Tooling', costPrice: 45.00, sellingPrice: 95.00, barcode: '8901234567891', unit: 'PCS', description: '4-Flute TiAlN coated titanium cutter for high-feed machining', totalStock: 185 },
  { productId: 'PRD-MOT-5K', productName: 'Brushless High-Torque Servo Motor 5.5kW', category: 'Electrical', costPrice: 680.00, sellingPrice: 1250.00, barcode: '8901234567892', unit: 'PCS', description: 'IP67 rated EtherCAT networked robotic drive motor', totalStock: 22 },
  { productId: 'PRD-SMR-CH', productName: 'Carbon Fiber Robot Chassis Rail 1.8M', category: 'Structural', costPrice: 280.00, sellingPrice: 520.00, barcode: '8901234567893', unit: 'PCS', description: 'Ultra-lightweight structural extrusion for AGV robot fleet', totalStock: 14 },
  { productId: 'PRD-SENS-T', productName: 'Infrared Multi-Point Thermal Matrix Sensor', category: 'Electronics', costPrice: 120.00, sellingPrice: 260.00, barcode: '8901234567894', unit: 'PCS', description: 'Industrial IoT contactless temperature telemetry probe', totalStock: 9 },
  { productId: 'PRD-LUB-50', productName: 'Synthetic Gearbox Lubricant ISO-VG-320 (50L)', category: 'Consumables', costPrice: 190.00, sellingPrice: 340.00, barcode: '8901234567895', unit: 'BOX', description: 'High-viscosity extreme pressure synthetic gear oil', totalStock: 35 },
];

export const INITIAL_WAREHOUSES: Warehouse[] = [
  { warehouseId: 'WH01', warehouseName: 'Central Raw Materials Hub', location: 'Building C - North Sector', capacity: 1200, currentOccupancy: 840, numberOfShelves: 36, inventoryValue: 485000, status: 'ACTIVE' },
  { warehouseId: 'WH02', warehouseName: 'Finished Components Depot', location: 'Building D - South Loading Bay', capacity: 900, currentOccupancy: 610, numberOfShelves: 24, inventoryValue: 620000, status: 'ACTIVE' },
  { warehouseId: 'WH03', warehouseName: 'High-Value Electronics Vault', location: 'Building B - Clean Room Wing', capacity: 350, currentOccupancy: 190, numberOfShelves: 12, inventoryValue: 310000, status: 'ACTIVE' },
];

export const INITIAL_SHELVES: Shelf[] = [
  { shelfId: 'SH-WH01-A1', warehouseId: 'WH01', warehouseName: 'Central Raw Materials Hub', row: 'A', column: '1', rfidTag: 'RFID-A1-8842', capacity: 50, occupied: 42 },
  { shelfId: 'SH-WH01-A2', warehouseId: 'WH01', warehouseName: 'Central Raw Materials Hub', row: 'A', column: '2', rfidTag: 'RFID-A2-9912', capacity: 50, occupied: 48 },
  { shelfId: 'SH-WH02-B1', warehouseId: 'WH02', warehouseName: 'Finished Components Depot', row: 'B', column: '1', rfidTag: 'RFID-B1-7731', capacity: 40, occupied: 22 },
  { shelfId: 'SH-WH03-C1', warehouseId: 'WH03', warehouseName: 'High-Value Electronics Vault', row: 'C', column: '1', rfidTag: 'RFID-C1-5521', capacity: 25, occupied: 9 },
];

export const INITIAL_INVENTORY: InventoryItem[] = [
  { inventoryId: 'INV001', productId: 'PRD-HYD-01', productName: 'High-Pressure Hydraulic Actuator 250BAR', category: 'Hydraulics', unit: 'PCS', warehouseId: 'WH01', warehouseName: 'Central Raw Materials Hub', shelfId: 'SH-WH01-A1', quantity: 48, minStock: 20, maxStock: 100, stockStatus: 'IN_STOCK', lastUpdated: '2026-09-22 09:30' },
  { inventoryId: 'INV002', productId: 'PRD-CNC-SP', productName: 'Tungsten Carbide CNC End Mill Drill 12mm', category: 'Tooling', unit: 'PCS', warehouseId: 'WH01', warehouseName: 'Central Raw Materials Hub', shelfId: 'SH-WH01-A2', quantity: 185, minStock: 50, maxStock: 300, stockStatus: 'IN_STOCK', lastUpdated: '2026-09-22 08:15' },
  { inventoryId: 'INV003', productId: 'PRD-MOT-5K', productName: 'Brushless High-Torque Servo Motor 5.5kW', category: 'Electrical', unit: 'PCS', warehouseId: 'WH02', warehouseName: 'Finished Components Depot', shelfId: 'SH-WH02-B1', quantity: 22, minStock: 15, maxStock: 50, stockStatus: 'IN_STOCK', lastUpdated: '2026-09-21 17:00' },
  { inventoryId: 'INV004', productId: 'PRD-SMR-CH', productName: 'Carbon Fiber Robot Chassis Rail 1.8M', category: 'Structural', unit: 'PCS', warehouseId: 'WH02', warehouseName: 'Finished Components Depot', shelfId: 'SH-WH02-B1', quantity: 14, minStock: 20, maxStock: 80, stockStatus: 'LOW_STOCK', lastUpdated: '2026-09-20 14:20' },
  { inventoryId: 'INV005', productId: 'PRD-SENS-T', productName: 'Infrared Multi-Point Thermal Matrix Sensor', category: 'Electronics', unit: 'PCS', warehouseId: 'WH03', warehouseName: 'High-Value Electronics Vault', shelfId: 'SH-WH03-C1', quantity: 9, minStock: 15, maxStock: 40, stockStatus: 'LOW_STOCK', lastUpdated: '2026-09-22 07:45' },
  { inventoryId: 'INV006', productId: 'PRD-LUB-50', productName: 'Synthetic Gearbox Lubricant ISO-VG-320 (50L)', category: 'Consumables', unit: 'BOX', warehouseId: 'WH01', warehouseName: 'Central Raw Materials Hub', shelfId: 'SH-WH01-A1', quantity: 35, minStock: 10, maxStock: 60, stockStatus: 'IN_STOCK', lastUpdated: '2026-09-19 11:00' },
];

export const INITIAL_SUPPLIERS: Supplier[] = [
  { supplierId: 'SUP001', supplierName: 'Apex Precision Metallurgy Corp', phone: '+1 (555) 772-9901', email: 'orders@apex-metallurgy.com', address: '440 Steel Mill Road, Pittsburgh, PA', gstNumber: 'GST-US-PA-889102', rating: 4.9, status: 'ACTIVE' },
  { supplierId: 'SUP002', supplierName: 'Kyoto Semiconductor & Opto', phone: '+1 (555) 334-1188', email: 'b2b-sales@kyoto-semi.com', address: '88 Tech Boulevard, San Jose, CA', gstNumber: 'GST-US-CA-442199', rating: 4.8, status: 'ACTIVE' },
  { supplierId: 'SUP003', supplierName: 'Vanguard Industrial Fluid Technologies', phone: '+1 (555) 881-2299', email: 'dispatch@vanguardfluids.com', address: '12 Refinery Way, Houston, TX', gstNumber: 'GST-US-TX-990123', rating: 4.7, status: 'ACTIVE' },
];

export const INITIAL_PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    poId: 'PO-2026-0811',
    supplierId: 'SUP001',
    supplierName: 'Apex Precision Metallurgy Corp',
    orderDate: '2026-09-15',
    expectedDeliveryDate: '2026-09-25',
    status: 'APPROVED',
    subtotal: 22500.00,
    tax: 4050.00,
    totalAmount: 26550.00,
    items: [
      { poItemId: 'POI-01', productId: 'PRD-CNC-SP', productName: 'Tungsten Carbide CNC End Mill Drill 12mm', quantity: 300, unitPrice: 45.00, subtotal: 13500.00, tax: 2430.00 },
      { poItemId: 'POI-02', productId: 'PRD-SMR-CH', productName: 'Carbon Fiber Robot Chassis Rail 1.8M', quantity: 32, unitPrice: 280.00, subtotal: 8960.00, tax: 1612.80 },
    ],
    notes: 'Urgent delivery for Q3 robotic chassis expansion batch',
  },
  {
    poId: 'PO-2026-0798',
    supplierId: 'SUP002',
    supplierName: 'Kyoto Semiconductor & Opto',
    orderDate: '2026-09-10',
    expectedDeliveryDate: '2026-09-18',
    status: 'RECEIVED',
    subtotal: 15600.00,
    tax: 2808.00,
    totalAmount: 18408.00,
    items: [
      { poItemId: 'POI-03', productId: 'PRD-SENS-T', productName: 'Infrared Multi-Point Thermal Matrix Sensor', quantity: 50, unitPrice: 120.00, subtotal: 6000.00, tax: 1080.00 },
      { poItemId: 'POI-04', productId: 'PRD-MOT-5K', productName: 'Brushless High-Torque Servo Motor 5.5kW', quantity: 14, unitPrice: 680.00, subtotal: 9520.00, tax: 1713.60 },
    ],
    notes: 'Received and verified by QC Lab 2',
  },
];

export const INITIAL_STOCK_TRANSACTIONS: StockTransaction[] = [
  { transactionId: 'TXN-901', productId: 'PRD-HYD-01', productName: 'High-Pressure Hydraulic Actuator 250BAR', warehouseId: 'WH01', warehouseName: 'Central Raw Materials Hub', transactionType: 'PRODUCTION', quantity: 12, date: '2026-09-22 08:30', reference: 'WO-MFG-8801', notes: 'CNC Cell 1 finished production output batch' },
  { transactionId: 'TXN-902', productId: 'PRD-SENS-T', productName: 'Infrared Multi-Point Thermal Matrix Sensor', warehouseId: 'WH03', warehouseName: 'High-Value Electronics Vault', transactionType: 'PURCHASE', quantity: 50, date: '2026-09-18 14:15', reference: 'PO-2026-0798', notes: 'Goods Receipt from Kyoto Semiconductor' },
  { transactionId: 'TXN-903', productId: 'PRD-CNC-SP', productName: 'Tungsten Carbide CNC End Mill Drill 12mm', warehouseId: 'WH01', warehouseName: 'Central Raw Materials Hub', transactionType: 'ROBOT_MOVEMENT', quantity: -10, date: '2026-09-22 07:10', reference: 'TSK-ROBOT-012', notes: 'AMR Unit AGV-01 transfer to CNC Machine Bay 3' },
  { transactionId: 'TXN-904', productId: 'PRD-MOT-5K', productName: 'Brushless High-Torque Servo Motor 5.5kW', warehouseId: 'WH02', warehouseName: 'Finished Components Depot', transactionType: 'SALE', quantity: -4, date: '2026-09-21 16:40', reference: 'INV-2026-104', notes: 'Customer dispatch to Boeing Aerostructures' },
];

export const INITIAL_MACHINES: Machine[] = [
  { machineId: 'MCH-001', machineName: 'Hermle 5-Axis CNC Machining Center C42U', model: 'Hermle C42U Dynamic', location: 'Cell Alpha - Bay 1', status: 'RUNNING', efficiency: 94.8, temperature: 41.5, powerUsage: 38.2, lastMaintenance: '2026-08-20' },
  { machineId: 'MCH-002', machineName: 'Schuler 500-Ton Hydraulic Servo Press', model: 'Schuler MSP-500', location: 'Cell Beta - Bay 3', status: 'RUNNING', efficiency: 89.2, temperature: 49.8, powerUsage: 112.5, lastMaintenance: '2026-08-15' },
  { machineId: 'MCH-003', machineName: 'Trumpf TruLaser Fiber Laser Welder 8000', model: 'TruLaser Cell 7040', location: 'Cell Gamma - Clean Room', status: 'IDLE', efficiency: 98.1, temperature: 28.4, powerUsage: 4.2, lastMaintenance: '2026-09-01' },
  { machineId: 'MCH-004', machineName: 'Panasonic High-Speed SMD Pick-and-Place NPM-D3', model: 'Panasonic NPM-D3A', location: 'SMD Clean Bay 2', status: 'RUNNING', efficiency: 96.4, temperature: 32.1, powerUsage: 14.8, lastMaintenance: '2026-08-28' },
];

export const INITIAL_PRODUCTION_ORDERS: ProductionOrder[] = [
  { productionOrderId: 'WO-MFG-8801', productId: 'PRD-HYD-01', productName: 'High-Pressure Hydraulic Actuator 250BAR', machineId: 'MCH-001', machineName: 'Hermle 5-Axis CNC Machining Center C42U', quantity: 50, producedQuantity: 38, startDate: '2026-09-18', endDate: '2026-09-26', status: 'IN_PROGRESS', priority: 'HIGH', assignedOperatorId: 'EMP004', assignedOperatorName: 'Marcus Brody', notes: 'Precision aerospace hydraulic batch #88' },
  { productionOrderId: 'WO-MFG-8802', productId: 'PRD-SMR-CH', productName: 'Carbon Fiber Robot Chassis Rail 1.8M', machineId: 'MCH-002', machineName: 'Schuler 500-Ton Hydraulic Servo Press', quantity: 80, producedQuantity: 80, startDate: '2026-09-10', endDate: '2026-09-19', status: 'COMPLETED', priority: 'MEDIUM', assignedOperatorId: 'EMP002', assignedOperatorName: 'Elena Rostova', notes: 'Completed and passed ultrasonic crack inspection' },
  { productionOrderId: 'WO-MFG-8803', productId: 'PRD-CNC-SP', productName: 'Tungsten Carbide CNC End Mill Drill 12mm', machineId: 'MCH-001', machineName: 'Hermle 5-Axis CNC Machining Center C42U', quantity: 200, producedQuantity: 45, startDate: '2026-09-21', endDate: '2026-09-28', status: 'IN_PROGRESS', priority: 'URGENT', assignedOperatorId: 'EMP004', assignedOperatorName: 'Marcus Brody', notes: 'Expedited for defense contractor contract' },
];

export const INITIAL_PRODUCTION_LOGS: ProductionLog[] = [
  { logId: 'LOG-5501', productionOrderId: 'WO-MFG-8801', timestamp: '2026-09-22 08:30', quantityProduced: 12, status: 'NORMAL', remarks: 'Morning shift batch run; tolerance within 0.002mm', operatorName: 'Marcus Brody' },
  { logId: 'LOG-5502', productionOrderId: 'WO-MFG-8801', timestamp: '2026-09-21 16:45', quantityProduced: 14, status: 'NORMAL', remarks: 'Afternoon run complete without vibration alarms', operatorName: 'Marcus Brody' },
  { logId: 'LOG-5503', productionOrderId: 'WO-MFG-8803', timestamp: '2026-09-22 09:10', quantityProduced: 45, status: 'NORMAL', remarks: 'Automated tool calibration verified by metrology', operatorName: 'Marcus Brody' },
];

export const INITIAL_ROBOTS: Robot[] = [
  { robotId: 'AGV-01', robotName: 'Titan Carrier AMR Alpha', model: 'MiR1350 Industrial AGV', battery: 88, status: 'BUSY', currentLocation: 'Zone A - Shelf SH-WH01-A1', payloadCapacityKg: 1350, totalTasksCompleted: 421 },
  { robotId: 'AGV-02', robotName: 'Kuka Mobile Manipulator KMR', model: 'KUKA KMR iiwa 14', battery: 64, status: 'BUSY', currentLocation: 'CNC Cell Alpha - Feed Conveyor', payloadCapacityKg: 800, totalTasksCompleted: 310 },
  { robotId: 'AGV-03', robotName: 'Swift Courier AMR Beta', model: 'MiR600 Autonomous AGV', battery: 98, status: 'IDLE', currentLocation: 'Docking Bay 2 Charging Station', payloadCapacityKg: 600, totalTasksCompleted: 580 },
  { robotId: 'AGV-04', robotName: 'Heavy Lifter AGV Gamma', model: 'OTTO 1500 Pallet AGV', battery: 24, status: 'CHARGING', currentLocation: 'Automated Charging Deck 1', payloadCapacityKg: 1500, totalTasksCompleted: 294 },
];

export const INITIAL_ROBOT_TASKS: RobotTask[] = [
  { taskId: 'TSK-ROBOT-012', robotId: 'AGV-01', robotName: 'Titan Carrier AMR Alpha', shelfId: 'SH-WH01-A1', shelfLocation: 'Central Raw Materials Hub (Row A, Col 1)', productId: 'PRD-CNC-SP', productName: 'Tungsten Carbide CNC End Mill Drill 12mm', quantity: 10, targetLocation: 'CNC Cell Alpha - Feed Station', startTime: '2026-09-22 07:05', status: 'IN_PROGRESS', priority: 'HIGH' },
  { taskId: 'TSK-ROBOT-013', robotId: 'AGV-02', robotName: 'Kuka Mobile Manipulator KMR', shelfId: 'SH-WH02-B1', shelfLocation: 'Finished Components Depot (Row B, Col 1)', productId: 'PRD-HYD-01', productName: 'High-Pressure Hydraulic Actuator 250BAR', quantity: 6, targetLocation: 'Quality Inspection Bay Lab 2', startTime: '2026-09-22 08:15', status: 'ASSIGNED', priority: 'NORMAL' },
  { taskId: 'TSK-ROBOT-011', robotId: 'AGV-03', robotName: 'Swift Courier AMR Beta', shelfId: 'SH-WH01-A2', shelfLocation: 'Central Raw Materials Hub (Row A, Col 2)', productId: 'PRD-LUB-50', productName: 'Synthetic Gearbox Lubricant ISO-VG-320 (50L)', quantity: 2, targetLocation: 'Maintenance Cell Bay 4', startTime: '2026-09-21 15:30', endTime: '2026-09-21 15:42', status: 'COMPLETED', priority: 'NORMAL' },
];

export const INITIAL_SENSORS: Sensor[] = [
  { sensorId: 'SNS001', sensorName: 'CNC Spindle 1 Thermal Probe', sensorType: 'TEMPERATURE', location: 'Cell Alpha (Hermle C42U)', status: 'ONLINE', lastReading: 41.5, unit: '°C', minThreshold: 10, maxThreshold: 65, lastUpdated: '2026-09-22 09:30:15' },
  { sensorId: 'SNS002', sensorName: 'Hydraulic Press Vibration Sensor', sensorType: 'VIBRATION', location: 'Cell Beta (Schuler MSP-500)', status: 'WARNING', lastReading: 7.8, unit: 'mm/s', minThreshold: 0, maxThreshold: 6.5, lastUpdated: '2026-09-22 09:29:48' },
  { sensorId: 'SNS003', sensorName: 'Battery Charging Dock Gas Sniffer', sensorType: 'GAS', location: 'AMR Docking Bay 1', status: 'ONLINE', lastReading: 12.0, unit: 'PPM', minThreshold: 0, maxThreshold: 50, lastUpdated: '2026-09-22 09:30:02' },
  { sensorId: 'SNS004', sensorName: 'Main Power Grid 3-Phase Busbar', sensorType: 'POWER', location: 'Plant 1 Substation A', status: 'ONLINE', lastReading: 169.7, unit: 'kW', minThreshold: 20, maxThreshold: 300, lastUpdated: '2026-09-22 09:30:10' },
];

export const INITIAL_SENSOR_DATA: SensorData[] = [
  { dataId: 'DAT-1001', sensorId: 'SNS001', sensorName: 'CNC Spindle 1 Thermal Probe', value: 38.2, unit: '°C', timestamp: '09:00:00' },
  { dataId: 'DAT-1002', sensorId: 'SNS001', sensorName: 'CNC Spindle 1 Thermal Probe', value: 39.1, unit: '°C', timestamp: '09:05:00' },
  { dataId: 'DAT-1003', sensorId: 'SNS001', sensorName: 'CNC Spindle 1 Thermal Probe', value: 40.4, unit: '°C', timestamp: '09:10:00' },
  { dataId: 'DAT-1004', sensorId: 'SNS001', sensorName: 'CNC Spindle 1 Thermal Probe', value: 41.5, unit: '°C', timestamp: '09:15:00' },
  { dataId: 'DAT-1005', sensorId: 'SNS001', sensorName: 'CNC Spindle 1 Thermal Probe', value: 41.5, unit: '°C', timestamp: '09:20:00' },
  { dataId: 'DAT-1006', sensorId: 'SNS001', sensorName: 'CNC Spindle 1 Thermal Probe', value: 41.2, unit: '°C', timestamp: '09:25:00' },
  { dataId: 'DAT-1007', sensorId: 'SNS001', sensorName: 'CNC Spindle 1 Thermal Probe', value: 41.5, unit: '°C', timestamp: '09:30:00' },
];

export const INITIAL_ALERTS: Alert[] = [
  { alertId: 'ALT-8891', sensorId: 'SNS002', sensorName: 'Hydraulic Press Vibration Sensor', alertType: 'VIBRATION_THRESHOLD_EXCEEDED', severity: 'HIGH', time: '2026-09-22 09:15:22', status: 'ACTIVE', message: 'Hydraulic ram vibration measured 7.8 mm/s exceeding maximum safe threshold (6.5 mm/s)', location: 'Cell Beta (Schuler MSP-500)' },
  { alertId: 'ALT-8890', sensorId: 'SNS001', sensorName: 'CNC Spindle 1 Thermal Probe', alertType: 'TEMPERATURE_ELEVATED', severity: 'MEDIUM', time: '2026-09-21 14:22:10', status: 'ACKNOWLEDGED', message: 'Spindle core temperature reached 58.2°C during high-feed titanium milling run', location: 'Cell Alpha (Hermle C42U)', acknowledgedBy: 'Elena Rostova' },
  { alertId: 'ALT-8889', sensorId: 'SNS003', sensorName: 'Battery Charging Dock Gas Sniffer', alertType: 'HYDROGEN_TRACE_DETECTED', severity: 'LOW', time: '2026-09-20 11:05:40', status: 'RESOLVED', message: 'Trace battery outgassing resolved after dock ventilation boost', location: 'AMR Docking Bay 1', acknowledgedBy: 'Alexander Vance', resolvedAt: '2026-09-20 11:30:00' },
];

export const INITIAL_CUSTOMERS: Customer[] = [
  { customerId: 'CUST-001', customerName: 'Boeing Defense & Space Systems', phone: '+1 (555) 912-3000', email: 'defense.procurement@boeing.com', address: '100 N Riverside, Chicago, IL', city: 'Chicago', state: 'IL', gstNumber: 'GST-US-IL-992019', totalPurchases: 384000, status: 'ACTIVE' },
  { customerId: 'CUST-002', customerName: 'Tesla Gigafactory Tier 2 Systems', phone: '+1 (555) 883-4900', email: 'giga.inbound@tesla.com', address: '1 Tesla Road, Austin, TX', city: 'Austin', state: 'TX', gstNumber: 'GST-US-TX-881923', totalPurchases: 540000, status: 'ACTIVE' },
  { customerId: 'CUST-003', customerName: 'Northrop Grumman Mission Systems', phone: '+1 (555) 774-2100', email: 'supplychain@ngc.com', address: '2980 Fairview Park Dr, Falls Church, VA', city: 'Falls Church', state: 'VA', gstNumber: 'GST-US-VA-334188', totalPurchases: 290000, status: 'ACTIVE' },
];

export const INITIAL_INVOICES: Invoice[] = [
  {
    invoiceId: 'INV-2026-104',
    customerId: 'CUST-001',
    customerName: 'Boeing Defense & Space Systems',
    invoiceDate: '2026-09-18',
    dueDate: '2026-10-18',
    status: 'PAID',
    subtotal: 31200.00,
    tax: 5616.00,
    taxRate: 18,
    totalAmount: 36816.00,
    items: [
      { invoiceItemId: 'INV-ITM-01', productId: 'PRD-HYD-01', productName: 'High-Pressure Hydraulic Actuator 250BAR', quantity: 40, unitPrice: 780.00, total: 31200.00 },
    ],
    paidAt: '2026-09-20',
    notes: 'Net 30 wire transfer payment received',
  },
  {
    invoiceId: 'INV-2026-105',
    customerId: 'CUST-002',
    customerName: 'Tesla Gigafactory Tier 2 Systems',
    invoiceDate: '2026-09-20',
    dueDate: '2026-10-20',
    status: 'UNPAID',
    subtotal: 26000.00,
    tax: 4680.00,
    taxRate: 18,
    totalAmount: 30680.00,
    items: [
      { invoiceItemId: 'INV-ITM-02', productId: 'PRD-SMR-CH', productName: 'Carbon Fiber Robot Chassis Rail 1.8M', quantity: 50, unitPrice: 520.00, total: 26000.00 },
    ],
    notes: 'Shipped via Express Freight Bay 2',
  },
];

export const INITIAL_ACCOUNTS: Account[] = [
  { accountId: 'ACC-1010', accountNumber: '1010', accountName: 'Cash & Operating Bank Accounts', accountType: 'ASSET', balance: 1450000.00, description: 'Primary commercial checking balance at JPMorgan Chase' },
  { accountId: 'ACC-1020', accountNumber: '1020', accountName: 'Accounts Receivable (AR)', accountType: 'ASSET', balance: 184500.00, description: 'Outstanding customer invoice balances' },
  { accountId: 'ACC-1030', accountNumber: '1030', accountName: 'Inventory Raw Materials & Spares', accountType: 'ASSET', balance: 485000.00, description: 'Total valuation of warehouse inventory' },
  { accountId: 'ACC-2010', accountNumber: '2010', accountName: 'Accounts Payable (AP)', accountType: 'LIABILITY', balance: 142000.00, description: 'Vendor invoices and PO payments due' },
  { accountId: 'ACC-2020', accountNumber: '2020', accountName: 'Accrued Payroll & Taxes', accountType: 'LIABILITY', balance: 88500.00, description: 'Employee wages and statutory withholdings' },
  { accountId: 'ACC-3010', accountNumber: '3010', accountName: 'Retained Earnings & Capital', accountType: 'EQUITY', balance: 1889000.00, description: 'Cumulative factory capitalization' },
  { accountId: 'ACC-4010', accountNumber: '4010', accountName: 'Commercial Manufacturing Sales Revenue', accountType: 'REVENUE', balance: 675000.00, description: 'Finished goods customer revenue' },
  { accountId: 'ACC-5010', accountNumber: '5010', accountName: 'Cost of Goods Sold (COGS)', accountType: 'EXPENSE', balance: 280000.00, description: 'Direct material and fabrication tooling costs' },
  { accountId: 'ACC-5020', accountNumber: '5020', accountName: 'Factory Utilities & Heavy Power', accountType: 'EXPENSE', balance: 45000.00, description: '3-Phase industrial electricity, coolant, and gas' },
];

export const INITIAL_JOURNAL_ENTRIES: JournalEntry[] = [
  {
    entryId: 'JE-2026-0901',
    date: '2026-09-20',
    description: 'Received customer settlement wire for Invoice INV-2026-104',
    reference: 'BANK-TRF-9921',
    totalDebit: 36816.00,
    totalCredit: 36816.00,
    lines: [
      { lineId: 'JEL-01', accountId: 'ACC-1010', accountName: 'Cash & Operating Bank Accounts', debit: 36816.00, credit: 0, memo: 'Wire deposit received' },
      { lineId: 'JEL-02', accountId: 'ACC-1020', accountName: 'Accounts Receivable (AR)', debit: 0, credit: 36816.00, memo: 'Clear AR balance' },
    ],
    status: 'POSTED',
  },
  {
    entryId: 'JE-2026-0902',
    date: '2026-09-18',
    description: 'Post August 2026 plant workforce payroll distribution',
    reference: 'PAYROLL-AUG26',
    totalDebit: 58000.00,
    totalCredit: 58000.00,
    lines: [
      { lineId: 'JEL-03', accountId: 'ACC-5010', accountName: 'Cost of Goods Sold (COGS)', debit: 58000.00, credit: 0, memo: 'Direct labor payroll expense' },
      { lineId: 'JEL-04', accountId: 'ACC-1010', accountName: 'Cash & Operating Bank Accounts', debit: 0, credit: 58000.00, memo: 'Direct deposit payroll batch ACH' },
    ],
    status: 'POSTED',
  },
];

export const INITIAL_EXPENSES: Expense[] = [
  { expenseId: 'EXP-401', accountId: 'ACC-5020', accountName: 'Factory Utilities & Heavy Power', category: 'Utilities', date: '2026-09-15', amount: 18450.00, description: 'Monthly 3-Phase Industrial Electricity Bill (Detroit Edison)', paymentMethod: 'BANK_TRANSFER', status: 'APPROVED', receiptRef: 'DTE-9941-INV' },
  { expenseId: 'EXP-402', accountId: 'ACC-5010', accountName: 'Cost of Goods Sold (COGS)', category: 'Equipment Maintenance', date: '2026-09-18', amount: 4800.00, description: 'Hermle 5-Axis Spindle Bearing Re-greasing & Calibration', paymentMethod: 'BANK_TRANSFER', status: 'APPROVED', receiptRef: 'SRV-HRM-4410' },
  { expenseId: 'EXP-403', accountId: 'ACC-5010', accountName: 'Cost of Goods Sold (COGS)', category: 'Automation Spares', date: '2026-09-20', amount: 2400.00, description: 'Replacement LiDAR scanner optics for AGV-04', paymentMethod: 'CREDIT_CARD', status: 'APPROVED', receiptRef: 'SICK-LIDAR-092' },
];
