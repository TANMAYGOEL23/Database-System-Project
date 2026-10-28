-- ==============================================================================
-- SMART INDUSTRIAL ERP & SMART FACTORY MANAGEMENT SYSTEM
-- COMPLETE SUPABASE / POSTGRESQL DATABASE SCHEMA
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. AUTH & USERS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS users (
    user_id TEXT PRIMARY KEY DEFAULT ('USR' || LPAD(FLOOR(RANDOM() * 1000)::TEXT, 3, '0')),
    employee_id TEXT,
    username TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('ADMIN', 'EMPLOYEE')),
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    department_name TEXT,
    position TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 2. HUMAN RESOURCES (HR)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS departments (
    department_id TEXT PRIMARY KEY DEFAULT ('DEP' || LPAD(FLOOR(RANDOM() * 1000)::TEXT, 3, '0')),
    department_name TEXT NOT NULL,
    manager_id TEXT,
    manager_name TEXT,
    employee_count INT DEFAULT 0,
    location TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employees (
    employee_id TEXT PRIMARY KEY DEFAULT ('EMP' || LPAD(FLOOR(RANDOM() * 1000)::TEXT, 3, '0')),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    full_name TEXT GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
    gender TEXT CHECK (gender IN ('MALE', 'FEMALE', 'OTHER')),
    phone TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    address TEXT NOT NULL,
    department_id TEXT REFERENCES departments(department_id) ON DELETE SET NULL,
    department_name TEXT,
    salary NUMERIC(12, 2) NOT NULL DEFAULT 0,
    joining_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ON_LEAVE', 'TERMINATED')),
    position TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attendance_devices (
    device_id TEXT PRIMARY KEY DEFAULT ('DEV' || LPAD(FLOOR(RANDOM() * 1000)::TEXT, 3, '0')),
    device_name TEXT NOT NULL,
    location TEXT NOT NULL,
    device_type TEXT NOT NULL CHECK (device_type IN ('RFID_GATE', 'BIOMETRIC', 'FACIAL_SCANNER', 'VIRTUAL_PUNCH')),
    status TEXT NOT NULL DEFAULT 'ONLINE' CHECK (status IN ('ONLINE', 'OFFLINE', 'MAINTENANCE')),
    last_ping TEXT DEFAULT 'Just now'
);

CREATE TABLE IF NOT EXISTS attendance (
    attendance_id TEXT PRIMARY KEY DEFAULT ('ATT' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0')),
    employee_id TEXT REFERENCES employees(employee_id) ON DELETE CASCADE,
    employee_name TEXT NOT NULL,
    department_name TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    check_in TEXT NOT NULL,
    check_out TEXT,
    device_id TEXT REFERENCES attendance_devices(device_id) ON DELETE SET NULL,
    device_name TEXT,
    status TEXT NOT NULL DEFAULT 'PRESENT' CHECK (status IN ('PRESENT', 'LATE', 'HALF_DAY', 'ABSENT')),
    work_hours NUMERIC(4, 2) DEFAULT 8.0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payroll (
    payroll_id TEXT PRIMARY KEY DEFAULT ('PAY' || TO_CHAR(CURRENT_DATE, 'YYYYMM') || '-' || LPAD(FLOOR(RANDOM() * 100)::TEXT, 2, '0')),
    employee_id TEXT REFERENCES employees(employee_id) ON DELETE CASCADE,
    employee_name TEXT NOT NULL,
    department_name TEXT,
    month TEXT NOT NULL,
    year INT NOT NULL,
    basic_salary NUMERIC(12, 2) NOT NULL DEFAULT 0,
    bonus NUMERIC(12, 2) NOT NULL DEFAULT 0,
    deduction NUMERIC(12, 2) NOT NULL DEFAULT 0,
    net_salary NUMERIC(12, 2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'PAID' CHECK (status IN ('PAID', 'PENDING', 'PROCESSING')),
    payment_date DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 3. INVENTORY & WAREHOUSE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS products (
    product_id TEXT PRIMARY KEY,
    product_name TEXT NOT NULL,
    category TEXT NOT NULL,
    cost_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    selling_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    barcode TEXT UNIQUE NOT NULL,
    unit TEXT NOT NULL DEFAULT 'PCS' CHECK (unit IN ('PCS', 'KG', 'LTR', 'MTR', 'BOX', 'TON', 'SET')),
    description TEXT,
    total_stock INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS warehouses (
    warehouse_id TEXT PRIMARY KEY,
    warehouse_name TEXT NOT NULL,
    location TEXT NOT NULL,
    capacity INT NOT NULL DEFAULT 1000,
    current_occupancy INT DEFAULT 0,
    number_of_shelves INT DEFAULT 12,
    inventory_value NUMERIC(14, 2) DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'FULL', 'MAINTENANCE'))
);

CREATE TABLE IF NOT EXISTS shelves (
    shelf_id TEXT PRIMARY KEY,
    warehouse_id TEXT REFERENCES warehouses(warehouse_id) ON DELETE CASCADE,
    warehouse_name TEXT,
    shelf_row TEXT NOT NULL,
    shelf_column TEXT NOT NULL,
    rfid_tag TEXT UNIQUE NOT NULL,
    capacity INT DEFAULT 50,
    occupied INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS inventory (
    inventory_id TEXT PRIMARY KEY DEFAULT ('INV' || LPAD(FLOOR(RANDOM() * 1000)::TEXT, 3, '0')),
    product_id TEXT REFERENCES products(product_id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    category TEXT NOT NULL,
    unit TEXT NOT NULL DEFAULT 'PCS',
    warehouse_id TEXT REFERENCES warehouses(warehouse_id) ON DELETE CASCADE,
    warehouse_name TEXT NOT NULL,
    shelf_id TEXT REFERENCES shelves(shelf_id) ON DELETE SET NULL,
    quantity INT NOT NULL DEFAULT 0,
    min_stock INT NOT NULL DEFAULT 10,
    max_stock INT NOT NULL DEFAULT 100,
    stock_status TEXT NOT NULL DEFAULT 'IN_STOCK' CHECK (stock_status IN ('IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK')),
    last_updated TEXT DEFAULT TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI')
);

CREATE TABLE IF NOT EXISTS suppliers (
    supplier_id TEXT PRIMARY KEY DEFAULT ('SUP' || LPAD(FLOOR(RANDOM() * 1000)::TEXT, 3, '0')),
    supplier_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    address TEXT NOT NULL,
    gst_number TEXT NOT NULL,
    rating NUMERIC(3, 2) DEFAULT 5.0,
    status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchase_orders (
    po_id TEXT PRIMARY KEY DEFAULT ('PO-' || TO_CHAR(CURRENT_DATE, 'YYYY-') || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0')),
    supplier_id TEXT REFERENCES suppliers(supplier_id) ON DELETE SET NULL,
    supplier_name TEXT NOT NULL,
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expected_delivery_date DATE,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'RECEIVED', 'CANCELLED')),
    subtotal NUMERIC(14, 2) NOT NULL DEFAULT 0,
    tax NUMERIC(14, 2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchase_order_items (
    po_item_id TEXT PRIMARY KEY DEFAULT ('POI-' || LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0')),
    po_id TEXT REFERENCES purchase_orders(po_id) ON DELETE CASCADE,
    product_id TEXT REFERENCES products(product_id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    subtotal NUMERIC(14, 2) NOT NULL DEFAULT 0,
    tax NUMERIC(14, 2) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS stock_transactions (
    transaction_id TEXT PRIMARY KEY DEFAULT ('TXN-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0')),
    product_id TEXT REFERENCES products(product_id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    warehouse_id TEXT REFERENCES warehouses(warehouse_id) ON DELETE SET NULL,
    warehouse_name TEXT NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('PURCHASE', 'PRODUCTION', 'SALE', 'ROBOT_MOVEMENT', 'ADJUSTMENT')),
    quantity INT NOT NULL,
    date TEXT DEFAULT TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI'),
    reference TEXT NOT NULL,
    notes TEXT
);

-- ==============================================================================
-- 4. PRODUCTION & MACHINERY
-- ==============================================================================
CREATE TABLE IF NOT EXISTS machines (
    machine_id TEXT PRIMARY KEY,
    machine_name TEXT NOT NULL,
    model TEXT NOT NULL,
    location TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'RUNNING' CHECK (status IN ('RUNNING', 'IDLE', 'MAINTENANCE', 'ERROR')),
    efficiency NUMERIC(5, 2) NOT NULL DEFAULT 95.0,
    temperature NUMERIC(5, 2) NOT NULL DEFAULT 35.0,
    power_usage NUMERIC(6, 2) NOT NULL DEFAULT 20.0,
    last_maintenance DATE DEFAULT CURRENT_DATE
);

CREATE TABLE IF NOT EXISTS production_orders (
    production_order_id TEXT PRIMARY KEY DEFAULT ('WO-MFG-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0')),
    product_id TEXT REFERENCES products(product_id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    machine_id TEXT REFERENCES machines(machine_id) ON DELETE SET NULL,
    machine_name TEXT NOT NULL,
    quantity INT NOT NULL DEFAULT 100,
    produced_quantity INT NOT NULL DEFAULT 0,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'PLANNED' CHECK (status IN ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
    priority TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
    assigned_operator_id TEXT REFERENCES employees(employee_id) ON DELETE SET NULL,
    assigned_operator_name TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS production_logs (
    log_id TEXT PRIMARY KEY DEFAULT ('LOG-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0')),
    production_order_id TEXT REFERENCES production_orders(production_order_id) ON DELETE CASCADE,
    timestamp TEXT DEFAULT TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI'),
    quantity_produced INT NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'NORMAL' CHECK (status IN ('NORMAL', 'DEFECTIVE', 'MAINTENANCE_STOP')),
    remarks TEXT NOT NULL,
    operator_name TEXT DEFAULT 'Floor Supervisor'
);

-- ==============================================================================
-- 5. ROBOTICS (AMR / AGV)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS robots (
    robot_id TEXT PRIMARY KEY,
    robot_name TEXT NOT NULL,
    model TEXT NOT NULL,
    battery INT NOT NULL DEFAULT 100 CHECK (battery >= 0 AND battery <= 100),
    status TEXT NOT NULL DEFAULT 'IDLE' CHECK (status IN ('IDLE', 'BUSY', 'CHARGING', 'MAINTENANCE', 'OFFLINE')),
    current_location TEXT NOT NULL,
    payload_capacity_kg INT DEFAULT 1000,
    total_tasks_completed INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS robot_tasks (
    task_id TEXT PRIMARY KEY DEFAULT ('TSK-ROBOT-' || LPAD(FLOOR(RANDOM() * 1000)::TEXT, 3, '0')),
    robot_id TEXT REFERENCES robots(robot_id) ON DELETE SET NULL,
    robot_name TEXT,
    shelf_id TEXT REFERENCES shelves(shelf_id) ON DELETE SET NULL,
    shelf_location TEXT,
    product_id TEXT REFERENCES products(product_id) ON DELETE SET NULL,
    product_name TEXT,
    quantity INT NOT NULL DEFAULT 1,
    target_location TEXT NOT NULL,
    start_time TEXT DEFAULT TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI'),
    end_time TEXT,
    status TEXT NOT NULL DEFAULT 'ASSIGNED' CHECK (status IN ('CREATED', 'ASSIGNED', 'IN_PROGRESS', 'PICKED', 'DELIVERED', 'COMPLETED', 'CANCELLED')),
    priority TEXT DEFAULT 'HIGH'
);

-- ==============================================================================
-- 6. IOT & SENSORS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS sensors (
    sensor_id TEXT PRIMARY KEY,
    sensor_name TEXT NOT NULL,
    sensor_type TEXT NOT NULL CHECK (sensor_type IN ('TEMPERATURE', 'HUMIDITY', 'GAS', 'VIBRATION', 'POWER', 'INVENTORY')),
    location TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ONLINE' CHECK (status IN ('ONLINE', 'WARNING', 'CRITICAL', 'OFFLINE')),
    last_reading NUMERIC(8, 2) NOT NULL DEFAULT 0,
    unit TEXT NOT NULL,
    min_threshold NUMERIC(8, 2) NOT NULL,
    max_threshold NUMERIC(8, 2) NOT NULL,
    last_updated TEXT DEFAULT TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS')
);

CREATE TABLE IF NOT EXISTS sensor_data (
    data_id TEXT PRIMARY KEY DEFAULT ('DAT-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0')),
    sensor_id TEXT REFERENCES sensors(sensor_id) ON DELETE CASCADE,
    sensor_name TEXT NOT NULL,
    value NUMERIC(8, 2) NOT NULL,
    unit TEXT NOT NULL,
    timestamp TEXT DEFAULT TO_CHAR(NOW(), 'HH24:MI:SS')
);

CREATE TABLE IF NOT EXISTS alerts (
    alert_id TEXT PRIMARY KEY DEFAULT ('ALT-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0')),
    sensor_id TEXT REFERENCES sensors(sensor_id) ON DELETE SET NULL,
    sensor_name TEXT NOT NULL,
    alert_type TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    time TEXT DEFAULT TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS'),
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ACKNOWLEDGED', 'RESOLVED')),
    message TEXT NOT NULL,
    location TEXT NOT NULL,
    acknowledged_by TEXT,
    resolved_at TEXT
);

-- ==============================================================================
-- 7. SALES & INVOICES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS customers (
    customer_id TEXT PRIMARY KEY DEFAULT ('CUST-' || LPAD(FLOOR(RANDOM() * 1000)::TEXT, 3, '0')),
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT,
    state TEXT,
    gst_number TEXT,
    total_purchases NUMERIC(14, 2) DEFAULT 0,
    status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoices (
    invoice_id TEXT PRIMARY KEY DEFAULT ('INV-' || TO_CHAR(CURRENT_DATE, 'YYYY-') || LPAD(FLOOR(RANDOM() * 1000)::TEXT, 3, '0')),
    customer_id TEXT REFERENCES customers(customer_id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'UNPAID' CHECK (status IN ('PAID', 'UNPAID', 'OVERDUE', 'CANCELLED')),
    subtotal NUMERIC(14, 2) NOT NULL DEFAULT 0,
    tax NUMERIC(14, 2) NOT NULL DEFAULT 0,
    tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 18.0,
    total_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
    paid_at DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoice_items (
    invoice_item_id TEXT PRIMARY KEY DEFAULT ('INV-ITM-' || LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0')),
    invoice_id TEXT REFERENCES invoices(invoice_id) ON DELETE CASCADE,
    product_id TEXT REFERENCES products(product_id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total NUMERIC(14, 2) NOT NULL DEFAULT 0
);

-- ==============================================================================
-- 8. ACCOUNTING & EXPENSES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS accounts (
    account_id TEXT PRIMARY KEY,
    account_number TEXT UNIQUE NOT NULL,
    account_name TEXT NOT NULL,
    account_type TEXT NOT NULL CHECK (account_type IN ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE')),
    balance NUMERIC(14, 2) NOT NULL DEFAULT 0,
    description TEXT,
    status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE'))
);

CREATE TABLE IF NOT EXISTS journal_entries (
    entry_id TEXT PRIMARY KEY DEFAULT ('JE-' || TO_CHAR(CURRENT_DATE, 'YYYY-') || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0')),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    description TEXT NOT NULL,
    reference TEXT NOT NULL,
    total_debit NUMERIC(14, 2) NOT NULL DEFAULT 0,
    total_credit NUMERIC(14, 2) NOT NULL DEFAULT 0,
    status TEXT DEFAULT 'POSTED' CHECK (status IN ('POSTED', 'DRAFT')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS journal_entry_lines (
    line_id TEXT PRIMARY KEY DEFAULT ('JEL-' || LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0')),
    entry_id TEXT REFERENCES journal_entries(entry_id) ON DELETE CASCADE,
    account_id TEXT REFERENCES accounts(account_id) ON DELETE SET NULL,
    account_name TEXT,
    debit NUMERIC(14, 2) NOT NULL DEFAULT 0,
    credit NUMERIC(14, 2) NOT NULL DEFAULT 0,
    memo TEXT
);

CREATE TABLE IF NOT EXISTS expenses (
    expense_id TEXT PRIMARY KEY DEFAULT ('EXP-' || LPAD(FLOOR(RANDOM() * 1000)::TEXT, 3, '0')),
    account_id TEXT REFERENCES accounts(account_id) ON DELETE SET NULL,
    account_name TEXT NOT NULL,
    category TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
    description TEXT NOT NULL,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('CASH', 'BANK_TRANSFER', 'CREDIT_CARD', 'CHEQUE')),
    status TEXT NOT NULL DEFAULT 'APPROVED' CHECK (status IN ('APPROVED', 'PENDING', 'REJECTED')),
    receipt_ref TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 9. SEED INITIAL BASE DATA (OPTIONAL / READY TO USE)
-- ==============================================================================
INSERT INTO users (user_id, employee_id, username, role, status, full_name, email, department_name, position) VALUES
('USR001', 'EMP001', 'tanmay', 'ADMIN', 'ACTIVE', 'Tanmay Goel', 'prishaajit@gmail.com', 'Executive Operations', 'Owner & Chief Executive Officer'),
('USR002', 'EMP002', 'rohit', 'EMPLOYEE', 'ACTIVE', 'Rohit Chaurasiya', 'rohitchaurasiya143265@gmail.com', 'Machining & Assembly', 'Lead CNC & Plant Operations Specialist'),
('USR003', 'EMP003', 'ashish', 'EMPLOYEE', 'ACTIVE', 'Ashish', 'ashishchoudhary29006@gmail.com', 'Robotics & Automation', 'Robotics & Shop Floor Operator')
ON CONFLICT (username) DO NOTHING;

INSERT INTO departments (department_id, department_name, manager_id, manager_name, employee_count, location) VALUES
('DEP001', 'Executive Operations', 'EMP001', 'Alexander Vance', 4, 'Building A, Floor 3'),
('DEP002', 'Machining & Assembly', 'EMP002', 'Elena Rostova', 38, 'Plant 1, South Wing'),
('DEP003', 'Warehouse & Logistics', 'EMP003', 'Devon Miles', 24, 'Logistics Hub Bay 4'),
('DEP004', 'Quality & Testing', 'EMP005', 'Rachel Green', 12, 'Building B, Lab 2'),
('DEP005', 'Robotics & Automation', 'EMP006', 'Vikram Patel', 16, 'Automation Cell A-4')
ON CONFLICT (department_id) DO NOTHING;

INSERT INTO employees (employee_id, first_name, last_name, gender, phone, email, address, department_id, department_name, salary, joining_date, status, position) VALUES
('EMP001', 'Alexander', 'Vance', 'MALE', '+1 (555) 019-2834', 'alexander.vance@megafactory.internal', '742 Evergreen Terrace', 'DEP001', 'Executive Operations', 145000, '2021-03-15', 'ACTIVE', 'Chief Operating Officer'),
('EMP002', 'Elena', 'Rostova', 'FEMALE', '+1 (555) 019-8832', 'elena.rostova@megafactory.internal', '128 Industrial Parkway', 'DEP002', 'Machining & Assembly', 112000, '2021-06-01', 'ACTIVE', 'Plant Fabrication Manager'),
('EMP003', 'Devon', 'Miles', 'MALE', '+1 (555) 019-4411', 'devon.miles@megafactory.internal', '88 Logistics Blvd', 'DEP003', 'Warehouse & Logistics', 95000, '2022-01-10', 'ACTIVE', 'Supply Chain Director'),
('EMP004', 'Marcus', 'Brody', 'MALE', '+1 (555) 019-9943', 'marcus.brody@megafactory.internal', '450 Foundry Lane', 'DEP002', 'Machining & Assembly', 72000, '2022-08-15', 'ACTIVE', 'Lead CNC Mill Machinist'),
('EMP005', 'Rachel', 'Green', 'FEMALE', '+1 (555) 019-6621', 'rachel.green@megafactory.internal', '912 Precision Road', 'DEP004', 'Quality & Testing', 88000, '2023-02-01', 'ACTIVE', 'QA Lead Metrologist'),
('EMP006', 'Vikram', 'Patel', 'MALE', '+1 (555) 019-3356', 'vikram.patel@megafactory.internal', '22 Robotics Way', 'DEP005', 'Robotics & Automation', 118000, '2022-11-20', 'ACTIVE', 'Robotics Systems Architect')
ON CONFLICT (employee_id) DO NOTHING;

INSERT INTO attendance_devices (device_id, device_name, location, device_type, status, last_ping) VALUES
('DEV001', 'Gate 1 Turnstile Biometric Scanner', 'Main Entrance Security Gate', 'BIOMETRIC', 'ONLINE', 'Just now'),
('DEV002', 'Plant 1 RFID Gantry Sensor', 'Machining Floor West Gate', 'RFID_GATE', 'ONLINE', 'Just now'),
('DEV003', 'Logistics Bay 4 Scanner', 'Warehouse North Gate', 'RFID_GATE', 'ONLINE', '1 min ago')
ON CONFLICT (device_id) DO NOTHING;

INSERT INTO products (product_id, product_name, category, cost_price, selling_price, barcode, unit, description, total_stock) VALUES
('PRD-HYD-01', 'High-Pressure Hydraulic Actuator 250BAR', 'Hydraulics', 420.00, 780.00, '8901234567890', 'PCS', 'Dual-action industrial cylinder for heavy presses', 48),
('PRD-CNC-SP', 'Tungsten Carbide CNC End Mill Drill 12mm', 'Tooling', 45.00, 95.00, '8901234567891', 'PCS', '4-Flute TiAlN coated titanium cutter', 185),
('PRD-MOT-5K', 'Brushless High-Torque Servo Motor 5.5kW', 'Electrical', 680.00, 1250.00, '8901234567892', 'PCS', 'IP67 rated EtherCAT networked robotic drive motor', 22),
('PRD-SMR-CH', 'Carbon Fiber Robot Chassis Rail 1.8M', 'Structural', 280.00, 520.00, '8901234567893', 'PCS', 'Ultra-lightweight structural extrusion for AGV robot fleet', 14),
('PRD-SENS-T', 'Infrared Multi-Point Thermal Matrix Sensor', 'Electronics', 120.00, 260.00, '8901234567894', 'PCS', 'Industrial IoT contactless temperature probe', 9),
('PRD-LUB-50', 'Synthetic Gearbox Lubricant ISO-VG-320 (50L)', 'Consumables', 190.00, 340.00, '8901234567895', 'BOX', 'High-viscosity extreme pressure synthetic gear oil', 35)
ON CONFLICT (product_id) DO NOTHING;

INSERT INTO warehouses (warehouse_id, warehouse_name, location, capacity, current_occupancy, number_of_shelves, inventory_value, status) VALUES
('WH01', 'Central Raw Materials Hub', 'Building C - North Sector', 1200, 840, 36, 485000, 'ACTIVE'),
('WH02', 'Finished Components Depot', 'Building D - South Loading Bay', 900, 610, 24, 620000, 'ACTIVE'),
('WH03', 'High-Value Electronics Vault', 'Building B - Clean Room Wing', 350, 190, 12, 310000, 'ACTIVE')
ON CONFLICT (warehouse_id) DO NOTHING;

INSERT INTO shelves (shelf_id, warehouse_id, warehouse_name, shelf_row, shelf_column, rfid_tag, capacity, occupied) VALUES
('SH-WH01-A1', 'WH01', 'Central Raw Materials Hub', 'A', '1', 'RFID-A1-8842', 50, 42),
('SH-WH01-A2', 'WH01', 'Central Raw Materials Hub', 'A', '2', 'RFID-A2-9912', 50, 48),
('SH-WH02-B1', 'WH02', 'Finished Components Depot', 'B', '1', 'RFID-B1-7731', 40, 22),
('SH-WH03-C1', 'WH03', 'High-Value Electronics Vault', 'C', '1', 'RFID-C1-5521', 25, 9)
ON CONFLICT (shelf_id) DO NOTHING;

INSERT INTO inventory (inventory_id, product_id, product_name, category, unit, warehouse_id, warehouse_name, shelf_id, quantity, min_stock, max_stock, stock_status) VALUES
('INV001', 'PRD-HYD-01', 'High-Pressure Hydraulic Actuator 250BAR', 'Hydraulics', 'PCS', 'WH01', 'Central Raw Materials Hub', 'SH-WH01-A1', 48, 20, 100, 'IN_STOCK'),
('INV002', 'PRD-CNC-SP', 'Tungsten Carbide CNC End Mill Drill 12mm', 'Tooling', 'PCS', 'WH01', 'Central Raw Materials Hub', 'SH-WH01-A2', 185, 50, 300, 'IN_STOCK'),
('INV003', 'PRD-MOT-5K', 'Brushless High-Torque Servo Motor 5.5kW', 'Electrical', 'PCS', 'WH02', 'Finished Components Depot', 'SH-WH02-B1', 22, 15, 50, 'IN_STOCK'),
('INV004', 'PRD-SMR-CH', 'Carbon Fiber Robot Chassis Rail 1.8M', 'Structural', 'PCS', 'WH02', 'Finished Components Depot', 'SH-WH02-B1', 14, 20, 80, 'LOW_STOCK'),
('INV005', 'PRD-SENS-T', 'Infrared Multi-Point Thermal Matrix Sensor', 'Electronics', 'PCS', 'WH03', 'High-Value Electronics Vault', 'SH-WH03-C1', 9, 15, 40, 'LOW_STOCK'),
('INV006', 'PRD-LUB-50', 'Synthetic Gearbox Lubricant ISO-VG-320 (50L)', 'Consumables', 'BOX', 'WH01', 'Central Raw Materials Hub', 'SH-WH01-A1', 35, 10, 60, 'IN_STOCK')
ON CONFLICT (inventory_id) DO NOTHING;

INSERT INTO suppliers (supplier_id, supplier_name, phone, email, address, gst_number, rating, status) VALUES
('SUP001', 'Apex Precision Metallurgy Corp', '+1 (555) 772-9901', 'orders@apex-metallurgy.com', '440 Steel Mill Road, Pittsburgh, PA', 'GST-US-PA-889102', 4.9, 'ACTIVE'),
('SUP002', 'Kyoto Semiconductor & Opto', '+1 (555) 334-1188', 'b2b-sales@kyoto-semi.com', '88 Tech Boulevard, San Jose, CA', 'GST-US-CA-442199', 4.8, 'ACTIVE'),
('SUP003', 'Vanguard Industrial Fluid Technologies', '+1 (555) 881-2299', 'dispatch@vanguardfluids.com', '12 Refinery Way, Houston, TX', 'GST-US-TX-990123', 4.7, 'ACTIVE')
ON CONFLICT (supplier_id) DO NOTHING;

INSERT INTO machines (machine_id, machine_name, model, location, status, efficiency, temperature, power_usage, last_maintenance) VALUES
('MCH-001', 'Hermle 5-Axis CNC Machining Center C42U', 'Hermle C42U Dynamic', 'Cell Alpha - Bay 1', 'RUNNING', 94.8, 41.5, 38.2, CURRENT_DATE - 30),
('MCH-002', 'Schuler 500-Ton Hydraulic Servo Press', 'Schuler MSP-500', 'Cell Beta - Bay 3', 'RUNNING', 89.2, 49.8, 112.5, CURRENT_DATE - 35),
('MCH-003', 'Trumpf TruLaser Fiber Laser Welder 8000', 'TruLaser Cell 7040', 'Cell Gamma - Clean Room', 'IDLE', 98.1, 28.4, 4.2, CURRENT_DATE - 15),
('MCH-004', 'Panasonic High-Speed SMD Pick-and-Place NPM-D3', 'Panasonic NPM-D3A', 'SMD Clean Bay 2', 'RUNNING', 96.4, 32.1, 14.8, CURRENT_DATE - 20)
ON CONFLICT (machine_id) DO NOTHING;

INSERT INTO robots (robot_id, robot_name, model, battery, status, current_location, payload_capacity_kg, total_tasks_completed) VALUES
('AGV-01', 'Titan Carrier AMR Alpha', 'MiR1350 Industrial AGV', 88, 'BUSY', 'Zone A - Shelf SH-WH01-A1', 1350, 421),
('AGV-02', 'Kuka Mobile Manipulator KMR', 'KUKA KMR iiwa 14', 64, 'BUSY', 'CNC Cell Alpha - Feed Conveyor', 800, 310),
('AGV-03', 'Swift Courier AMR Beta', 'MiR600 Autonomous AGV', 98, 'IDLE', 'Docking Bay 2 Charging Station', 600, 580),
('AGV-04', 'Heavy Lifter AGV Gamma', 'OTTO 1500 Pallet AGV', 24, 'CHARGING', 'Automated Charging Deck 1', 1500, 294)
ON CONFLICT (robot_id) DO NOTHING;

INSERT INTO sensors (sensor_id, sensor_name, sensor_type, location, status, last_reading, unit, min_threshold, max_threshold) VALUES
('SNS001', 'CNC Spindle 1 Thermal Probe', 'TEMPERATURE', 'Cell Alpha (Hermle C42U)', 'ONLINE', 41.5, '°C', 10, 65),
('SNS002', 'Hydraulic Press Vibration Sensor', 'VIBRATION', 'Cell Beta (Schuler MSP-500)', 'WARNING', 7.8, 'mm/s', 0, 6.5),
('SNS003', 'Battery Charging Dock Gas Sniffer', 'GAS', 'AMR Docking Bay 1', 'ONLINE', 12.0, 'PPM', 0, 50),
('SNS004', 'Main Power Grid 3-Phase Busbar', 'POWER', 'Plant 1 Substation A', 'ONLINE', 169.7, 'kW', 20, 300)
ON CONFLICT (sensor_id) DO NOTHING;

INSERT INTO customers (customer_id, customer_name, phone, email, address, city, state, gst_number, total_purchases, status) VALUES
('CUST-001', 'Boeing Defense & Space Systems', '+1 (555) 912-3000', 'defense.procurement@boeing.com', '100 N Riverside', 'Chicago', 'IL', 'GST-US-IL-992019', 384000, 'ACTIVE'),
('CUST-002', 'Tesla Gigafactory Tier 2 Systems', '+1 (555) 883-4900', 'giga.inbound@tesla.com', '1 Tesla Road', 'Austin', 'TX', 'GST-US-TX-881923', 540000, 'ACTIVE'),
('CUST-003', 'Northrop Grumman Mission Systems', '+1 (555) 774-2100', 'supplychain@ngc.com', '2980 Fairview Park Dr', 'Falls Church', 'VA', 'GST-US-VA-334188', 290000, 'ACTIVE')
ON CONFLICT (customer_id) DO NOTHING;

INSERT INTO accounts (account_id, account_number, account_name, account_type, balance, description, status) VALUES
('ACC-1010', '1010', 'Cash & Operating Bank Accounts', 'ASSET', 1450000.00, 'Primary commercial checking balance', 'ACTIVE'),
('ACC-1020', '1020', 'Accounts Receivable (AR)', 'ASSET', 184500.00, 'Outstanding customer invoice balances', 'ACTIVE'),
('ACC-1030', '1030', 'Inventory Raw Materials & Spares', 'ASSET', 485000.00, 'Total valuation of warehouse inventory', 'ACTIVE'),
('ACC-2010', '2010', 'Accounts Payable (AP)', 'LIABILITY', 142000.00, 'Vendor invoices and PO payments due', 'ACTIVE'),
('ACC-2020', '2020', 'Accrued Payroll & Taxes', 'LIABILITY', 88500.00, 'Employee wages and statutory withholdings', 'ACTIVE'),
('ACC-3010', '3010', 'Retained Earnings & Capital', 'EQUITY', 1889000.00, 'Cumulative factory capitalization', 'ACTIVE'),
('ACC-4010', '4010', 'Commercial Manufacturing Sales Revenue', 'REVENUE', 675000.00, 'Finished goods customer revenue', 'ACTIVE'),
('ACC-5010', '5010', 'Cost of Goods Sold (COGS)', 'EXPENSE', 280000.00, 'Direct material and fabrication tooling costs', 'ACTIVE'),
('ACC-5020', '5020', 'Factory Utilities & Heavy Power', 'EXPENSE', 45000.00, '3-Phase industrial electricity and gas', 'ACTIVE')
ON CONFLICT (account_id) DO NOTHING;

-- ==============================================================================
-- 10. ROW LEVEL SECURITY (RLS) - PERMISSIVE FOR DEVELOPMENT & ANONYMOUS ACCESS
-- ==============================================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE shelves ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE robots ENABLE ROW LEVEL SECURITY;
ALTER TABLE robot_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensors ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensor_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entry_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Idempotent RLS Policies
DO $$
BEGIN
    DROP POLICY IF EXISTS "Allow public read-write for dev on users" ON users;
    CREATE POLICY "Allow public read-write for dev on users" ON users FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow public read-write for dev on departments" ON departments;
    CREATE POLICY "Allow public read-write for dev on departments" ON departments FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow public read-write for dev on employees" ON employees;
    CREATE POLICY "Allow public read-write for dev on employees" ON employees FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow public read-write for dev on attendance_devices" ON attendance_devices;
    CREATE POLICY "Allow public read-write for dev on attendance_devices" ON attendance_devices FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow public read-write for dev on attendance" ON attendance;
    CREATE POLICY "Allow public read-write for dev on attendance" ON attendance FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow public read-write for dev on payroll" ON payroll;
    CREATE POLICY "Allow public read-write for dev on payroll" ON payroll FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow public read-write for dev on products" ON products;
    CREATE POLICY "Allow public read-write for dev on products" ON products FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow public read-write for dev on warehouses" ON warehouses;
    CREATE POLICY "Allow public read-write for dev on warehouses" ON warehouses FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow public read-write for dev on shelves" ON shelves;
    CREATE POLICY "Allow public read-write for dev on shelves" ON shelves FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow public read-write for dev on inventory" ON inventory;
    CREATE POLICY "Allow public read-write for dev on inventory" ON inventory FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow public read-write for dev on suppliers" ON suppliers;
    CREATE POLICY "Allow public read-write for dev on suppliers" ON suppliers FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow public read-write for dev on purchase_orders" ON purchase_orders;
    CREATE POLICY "Allow public read-write for dev on purchase_orders" ON purchase_orders FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow public read-write for dev on purchase_order_items" ON purchase_order_items;
    CREATE POLICY "Allow public read-write for dev on purchase_order_items" ON purchase_order_items FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow public read-write for dev on stock_transactions" ON stock_transactions;
    CREATE POLICY "Allow public read-write for dev on stock_transactions" ON stock_transactions FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow public read-write for dev on machines" ON machines;
    CREATE POLICY "Allow public read-write for dev on machines" ON machines FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow public read-write for dev on production_orders" ON production_orders;
    CREATE POLICY "Allow public read-write for dev on production_orders" ON production_orders FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow public read-write for dev on production_logs" ON production_logs;
    CREATE POLICY "Allow public read-write for dev on production_logs" ON production_logs FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow public read-write for dev on robots" ON robots;
    CREATE POLICY "Allow public read-write for dev on robots" ON robots FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow public read-write for dev on robot_tasks" ON robot_tasks;
    CREATE POLICY "Allow public read-write for dev on robot_tasks" ON robot_tasks FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow public read-write for dev on sensors" ON sensors;
    CREATE POLICY "Allow public read-write for dev on sensors" ON sensors FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow public read-write for dev on sensor_data" ON sensor_data;
    CREATE POLICY "Allow public read-write for dev on sensor_data" ON sensor_data FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow public read-write for dev on alerts" ON alerts;
    CREATE POLICY "Allow public read-write for dev on alerts" ON alerts FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow public read-write for dev on customers" ON customers;
    CREATE POLICY "Allow public read-write for dev on customers" ON customers FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow public read-write for dev on invoices" ON invoices;
    CREATE POLICY "Allow public read-write for dev on invoices" ON invoices FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow public read-write for dev on invoice_items" ON invoice_items;
    CREATE POLICY "Allow public read-write for dev on invoice_items" ON invoice_items FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow public read-write for dev on accounts" ON accounts;
    CREATE POLICY "Allow public read-write for dev on accounts" ON accounts FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow public read-write for dev on journal_entries" ON journal_entries;
    CREATE POLICY "Allow public read-write for dev on journal_entries" ON journal_entries FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow public read-write for dev on journal_entry_lines" ON journal_entry_lines;
    CREATE POLICY "Allow public read-write for dev on journal_entry_lines" ON journal_entry_lines FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow public read-write for dev on expenses" ON expenses;
    CREATE POLICY "Allow public read-write for dev on expenses" ON expenses FOR ALL USING (true) WITH CHECK (true);
END $$;

-- ADMIN-ONLY EMPLOYEE PROMOTION
-- Admin-only employee promotion. Apply once to an existing Supabase project.
BEGIN;

CREATE OR REPLACE FUNCTION public.is_erp_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
    SELECT auth.uid() IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.users AS account
        WHERE lower(account.email) = lower(auth.jwt() ->> 'email')
          AND account.role = 'ADMIN' AND account.status = 'ACTIVE'
    );
$$;
REVOKE ALL ON FUNCTION public.is_erp_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_erp_admin() TO authenticated;

-- Prevent direct role edits, including requests that bypass the application UI.
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read-write for dev on users" ON public.users;
DROP POLICY IF EXISTS "Read own account or administer users" ON public.users;
CREATE POLICY "Read own account or administer users" ON public.users
    FOR SELECT TO authenticated USING (
        lower(email) = lower(auth.jwt() ->> 'email') OR public.is_erp_admin()
    );
REVOKE ALL ON public.users FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.users TO authenticated;

CREATE TABLE IF NOT EXISTS public.user_role_audit (
    audit_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id text NOT NULL,
    employee_id text NOT NULL,
    changed_by_user_id text NOT NULL,
    changed_by_auth_id uuid NOT NULL,
    old_role text NOT NULL,
    new_role text NOT NULL,
    changed_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_role_audit ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.user_role_audit FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.user_role_audit TO authenticated;
DROP POLICY IF EXISTS "Admins read role history" ON public.user_role_audit;
CREATE POLICY "Admins read role history" ON public.user_role_audit
    FOR SELECT TO authenticated USING (public.is_erp_admin());

CREATE OR REPLACE FUNCTION public.promote_employee_to_admin(p_employee_id text)
RETURNS SETOF public.users
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
    actor_id text;
    employment_status text;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Sign in as an administrator to manage workspace access.' USING ERRCODE = '42501';
    END IF;
    SELECT account.user_id INTO actor_id FROM public.users AS account
    WHERE lower(account.email) = lower(auth.jwt() ->> 'email')
      AND account.role = 'ADMIN' AND account.status = 'ACTIVE'
    FOR SHARE;
    IF actor_id IS NULL THEN
        RAISE EXCEPTION 'Only active administrators can grant admin access.' USING ERRCODE = '42501';
    END IF;
    -- Serialize concurrent promotions of the same employee.
    SELECT employee.status INTO employment_status FROM public.employees AS employee
    WHERE employee.employee_id = p_employee_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Employee record not found.' USING ERRCODE = 'P0002';
    END IF;
    IF employment_status = 'TERMINATED' THEN
        RAISE EXCEPTION 'A terminated employee cannot receive admin access.' USING ERRCODE = '22023';
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM public.users AS account
        WHERE account.employee_id = p_employee_id AND account.status = 'ACTIVE'
    ) THEN
        RAISE EXCEPTION 'This employee needs an active linked sign-in account before receiving admin access.' USING ERRCODE = '22023';
    END IF;

    RETURN QUERY
    WITH promoted AS (
        UPDATE public.users AS account SET role = 'ADMIN'
        WHERE account.employee_id = p_employee_id AND account.status = 'ACTIVE' AND account.role = 'EMPLOYEE'
        RETURNING account.*
    ), logged AS (
        INSERT INTO public.user_role_audit
            (user_id, employee_id, changed_by_user_id, changed_by_auth_id, old_role, new_role)
        SELECT account.user_id, account.employee_id, actor_id, auth.uid(), 'EMPLOYEE', 'ADMIN'
        FROM promoted AS account
    )
    SELECT account.* FROM promoted AS account;

    IF NOT FOUND THEN
        -- Repeated requests are safe and do not create duplicate audit entries.
        RETURN QUERY SELECT account.* FROM public.users AS account
        WHERE account.employee_id = p_employee_id AND account.status = 'ACTIVE' AND account.role = 'ADMIN';
    END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.promote_employee_to_admin(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.promote_employee_to_admin(text) TO authenticated;

NOTIFY pgrst, 'reload schema';
COMMIT;
