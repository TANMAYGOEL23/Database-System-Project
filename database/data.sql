-- DEPARTMENTS

INSERT INTO department
    (department_id, department_name, manager_id)
VALUES
    (1, 'Human Resources', NULL),
    (2, 'Production', NULL),
    (3, 'Warehouse', NULL),
    (4, 'Finance', NULL),
    (5, 'Sales', NULL),
    (6, 'IT', NULL);


-- EMPLOYEES

INSERT INTO employee
    (
        employee_id,
        department_id,
        first_name,
        last_name,
        gender,
        phone,
        email,
        address,
        salary,
        joining_date,
        status
    )
VALUES
    (1, 1, 'Ashish', 'Choudhary', 'Male',
     '9876500001', 'ashishchoudhary29006@gmail.com',
     'Bangalore', 75000.00, '2023-01-10', 'ACTIVE'),

    (2, 2, 'Rahul', 'Verma', 'Male',
     '9876500002', 'rahul.verma@factory.com',
     'Bangalore', 65000.00, '2023-03-15', 'ACTIVE'),

    (3, 3, 'Prisha', 'Ajit', 'Female',
     '9876500003', 'prishaajit@gmail.com',
     'Bangalore', 48000.00, '2024-01-08', 'ACTIVE'),

    (4, 4, 'Neha', 'Patel', 'Female',
     '9876500004', 'neha.patel@factory.com',
     'Bangalore', 70000.00, '2022-07-20', 'ACTIVE'),

    (5, 5, 'Rohan', 'Mehta', 'Male',
     '9876500005', 'rohan.mehta@factory.com',
     'Bangalore', 55000.00, '2024-04-01', 'ACTIVE'),

    (6, 2, 'Vikram', 'Singh', 'Male',
     '9876500006', 'vikram.singh@factory.com',
     'Bangalore', 52000.00, '2024-06-12', 'ACTIVE'),

    (7, 3, 'Anjali', 'Rao', 'Female',
     '9876500007', 'anjali.rao@factory.com',
     'Bangalore', 46000.00, '2024-08-19', 'ACTIVE'),

    (8, 4, 'Karan', 'Shah', 'Male',
     '9876500008', 'karan.shah@factory.com',
     'Bangalore', 43000.00, '2025-01-13', 'ACTIVE'),

    (9, 5, 'Sneha', 'Iyer', 'Female',
     '9876500009', 'sneha.iyer@factory.com',
     'Bangalore', 47000.00, '2025-02-10', 'ACTIVE'),

    (10, 6, 'Arjun', 'Nair', 'Male',
     '9876500010', 'arjun.nair@factory.com',
     'Bangalore', 60000.00, '2023-09-05', 'ACTIVE'),

    (11, 2, 'Manish', 'Gupta', 'Male',
     '9876500011', 'manish.gupta@factory.com',
     'Bangalore', 49000.00, '2025-03-17', 'ACTIVE'),

    (12, 3, 'Pooja', 'Desai', 'Female',
     '9876500012', 'pooja.desai@factory.com',
     'Bangalore', 45000.00, '2025-05-06', 'ON_LEAVE');


-- DEPARTMENT MANAGERS

UPDATE department SET manager_id = 1 WHERE department_id = 1;
UPDATE department SET manager_id = 2 WHERE department_id = 2;
UPDATE department SET manager_id = 3 WHERE department_id = 3;
UPDATE department SET manager_id = 4 WHERE department_id = 4;
UPDATE department SET manager_id = 5 WHERE department_id = 5;
UPDATE department SET manager_id = 10 WHERE department_id = 6;


-- USERS

INSERT INTO users
    (
        user_id,
        employee_id,
        email,
        oauth_provider,
        oauth_subject,
        role,
        status
    )
VALUES
    (
        1,
        1,
        'ashishchoudhary29006@gmail.com',
        'google',
        NULL,
        'ADMIN',
        'ACTIVE'
    ),
    (
        2,
        3,
        'prishaajit@gmail.com',
        'google',
        NULL,
        'EMPLOYEE',
        'ACTIVE'
    );


-- ATTENDANCE DEVICES

INSERT INTO attendance_device
    (
        device_id,
        device_name,
        device_type,
        location,
        status
    )
VALUES
    (1, 'Main Gate Reader', 'RFID', 'Main Entrance', 'ACTIVE'),
    (2, 'Warehouse Gate Reader', 'RFID', 'Warehouse Entrance', 'ACTIVE'),
    (3, 'Admin Building Scanner', 'BIOMETRIC', 'Admin Building', 'ACTIVE');


-- ATTENDANCE

INSERT INTO attendance
    (
        attendance_id,
        employee_id,
        attendance_date,
        check_in,
        check_out,
        device_id
    )
VALUES
    (1, 1, CURRENT_DATE, '08:55:00', '17:30:00', 3),
    (2, 2, CURRENT_DATE, '09:02:00', '17:45:00', 1),
    (3, 3, CURRENT_DATE, '08:48:00', '17:20:00', 2),
    (4, 4, CURRENT_DATE, '09:10:00', '18:00:00', 3),
    (5, 5, CURRENT_DATE, '09:00:00', '17:15:00', 1),
    (6, 6, CURRENT_DATE, '08:50:00', '17:30:00', 1),
    (7, 7, CURRENT_DATE, '09:05:00', '17:25:00', 2),
    (8, 10, CURRENT_DATE, '08:45:00', '17:40:00', 3);


-- PAYROLL

INSERT INTO payroll
    (
        payroll_id,
        employee_id,
        payroll_month,
        basic_salary,
        bonus,
        deduction,
        net_salary
    )
VALUES
    (1, 1, '2026-08-01', 75000.00, 5000.00, 3000.00, 77000.00),
    (2, 2, '2026-08-01', 65000.00, 3000.00, 2500.00, 65500.00),
    (3, 3, '2026-08-01', 48000.00, 2000.00, 1500.00, 48500.00),
    (4, 4, '2026-08-01', 70000.00, 4000.00, 2500.00, 71500.00),
    (5, 5, '2026-08-01', 55000.00, 2500.00, 1800.00, 55700.00),
    (6, 6, '2026-08-01', 52000.00, 2000.00, 1500.00, 52500.00);


-- PRODUCTS

INSERT INTO product
    (
        product_id,
        product_name,
        category,
        cost_price,
        selling_price,
        barcode,
        unit
    )
VALUES
    (1, 'Industrial Motor 5HP', 'Motors',
     18000.00, 24000.00, '890100000001', 'UNIT'),

    (2, 'Steel Gear Assembly', 'Mechanical',
     4500.00, 6500.00, '890100000002', 'UNIT'),

    (3, 'Control Panel A1', 'Electronics',
     12000.00, 17500.00, '890100000003', 'UNIT'),

    (4, 'Hydraulic Pump', 'Hydraulics',
     8500.00, 12500.00, '890100000004', 'UNIT'),

    (5, 'Temperature Controller', 'Electronics',
     3200.00, 4800.00, '890100000005', 'UNIT'),

    (6, 'Industrial Bearing', 'Mechanical',
     850.00, 1250.00, '890100000006', 'UNIT'),

    (7, 'Copper Cable 10m', 'Electrical',
     600.00, 950.00, '890100000007', 'METER'),

    (8, 'Safety Valve', 'Hydraulics',
     1800.00, 2800.00, '890100000008', 'UNIT'),

    (9, 'Steel Housing', 'Raw Material',
     2200.00, 3400.00, '890100000009', 'UNIT'),

    (10, 'Power Supply Module', 'Electronics',
     2700.00, 4200.00, '890100000010', 'UNIT');


-- WAREHOUSES

INSERT INTO warehouse
    (
        warehouse_id,
        warehouse_name,
        location,
        capacity
    )
VALUES
    (1, 'Raw Material Warehouse', 'Building A', 5000),
    (2, 'Finished Goods Warehouse', 'Building B', 3000),
    (3, 'Electronics Warehouse', 'Building C', 2000);


-- SHELVES

INSERT INTO shelf
    (
        shelf_id,
        warehouse_id,
        row_no,
        column_no,
        rfid_tag
    )
VALUES
    (1, 1, 1, 1, 'RFID-A-001'),
    (2, 1, 1, 2, 'RFID-A-002'),
    (3, 1, 2, 1, 'RFID-A-003'),
    (4, 1, 2, 2, 'RFID-A-004'),
    (5, 2, 1, 1, 'RFID-B-001'),
    (6, 2, 1, 2, 'RFID-B-002'),
    (7, 2, 2, 1, 'RFID-B-003'),
    (8, 3, 1, 1, 'RFID-C-001'),
    (9, 3, 1, 2, 'RFID-C-002');


-- SENSORS

INSERT INTO sensor
    (
        sensor_id,
        sensor_type,
        location,
        status
    )
VALUES
    (1, 'TEMPERATURE', 'Production Floor', 'ACTIVE'),
    (2, 'HUMIDITY', 'Raw Material Warehouse', 'ACTIVE'),
    (3, 'GAS', 'Production Floor', 'ACTIVE'),
    (4, 'VIBRATION', 'Machine Area', 'ACTIVE'),
    (5, 'POWER', 'Electrical Room', 'ACTIVE'),
    (6, 'INVENTORY', 'Warehouse System', 'ACTIVE');


-- INVENTORY

INSERT INTO inventory
    (
        inventory_id,
        warehouse_id,
        product_id,
        quantity,
        minimum_stock,
        maximum_stock
    )
VALUES
    (1, 1, 1, 25, 10, 100),
    (2, 1, 2, 60, 20, 150),
    (3, 3, 3, 15, 10, 80),
    (4, 1, 4, 35, 10, 100),
    (5, 3, 5, 8, 10, 50),
    (6, 1, 6, 120, 50, 300),
    (7, 1, 7, 500, 100, 1000),
    (8, 1, 8, 40, 15, 100),
    (9, 1, 9, 70, 20, 150),
    (10, 3, 10, 25, 10, 100),
    (11, 2, 1, 12, 5, 50),
    (12, 2, 3, 30, 10, 100);


-- SENSOR DATA

INSERT INTO sensor_data
    (
        reading_id,
        sensor_id,
        reading_timestamp,
        value
    )
VALUES
    (1, 1, CURRENT_TIMESTAMP - INTERVAL '5 hours', 28.40),
    (2, 1, CURRENT_TIMESTAMP - INTERVAL '4 hours', 29.10),
    (3, 1, CURRENT_TIMESTAMP - INTERVAL '3 hours', 31.50),
    (4, 1, CURRENT_TIMESTAMP - INTERVAL '2 hours', 34.20),
    (5, 1, CURRENT_TIMESTAMP - INTERVAL '1 hour', 36.80),
    (6, 2, CURRENT_TIMESTAMP - INTERVAL '4 hours', 54.20),
    (7, 2, CURRENT_TIMESTAMP - INTERVAL '2 hours', 55.10),
    (8, 2, CURRENT_TIMESTAMP, 53.80),
    (9, 3, CURRENT_TIMESTAMP - INTERVAL '3 hours', 12.10),
    (10, 3, CURRENT_TIMESTAMP - INTERVAL '1 hour', 14.50),
    (11, 4, CURRENT_TIMESTAMP - INTERVAL '3 hours', 2.10),
    (12, 4, CURRENT_TIMESTAMP - INTERVAL '1 hour', 4.80),
    (13, 5, CURRENT_TIMESTAMP - INTERVAL '2 hours', 72.50),
    (14, 5, CURRENT_TIMESTAMP, 75.20);


-- ALERTS

INSERT INTO alert
    (
        alert_id,
        sensor_id,
        alert_type,
        alert_time,
        status
    )
VALUES
    (1, 1, 'HIGH_TEMPERATURE',
     CURRENT_TIMESTAMP - INTERVAL '1 hour', 'ACTIVE'),

    (2, 3, 'GAS_LEVEL_WARNING',
     CURRENT_TIMESTAMP - INTERVAL '2 hours', 'ACKNOWLEDGED'),

    (3, 4, 'HIGH_VIBRATION',
     CURRENT_TIMESTAMP - INTERVAL '3 hours', 'RESOLVED');


-- SUPPLIERS

INSERT INTO supplier
    (
        supplier_id,
        supplier_name,
        phone,
        email,
        address,
        gst_number
    )
VALUES
    (1, 'Bangalore Industrial Supplies',
     '9888000001', 'sales@bis.com',
     'Peenya Industrial Area, Bangalore',
     '29AABCB1001A1Z5'),

    (2, 'Precision Components Ltd',
     '9888000002', 'contact@precision.com',
     'Hosur Road, Bangalore',
     '29AABCP2002B1Z4'),

    (3, 'ElectroTech Systems',
     '9888000003', 'sales@electrotech.com',
     'Electronic City, Bangalore',
     '29AABCE3003C1Z3'),

    (4, 'HydroMax Industries',
     '9888000004', 'orders@hydromax.com',
     'Bommasandra, Bangalore',
     '29AABCH4004D1Z2'),

    (5, 'SteelWorks India',
     '9888000005', 'sales@steelworks.com',
     'Tumkur Road, Bangalore',
     '29AABCS5005E1Z1');


-- PURCHASE ORDERS

INSERT INTO purchase_order
    (
        purchase_order_id,
        supplier_id,
        order_date,
        status,
        total_amount
    )
VALUES
    (1, 1, '2026-08-01', 'RECEIVED', 180000.00),
    (2, 2, '2026-08-04', 'RECEIVED', 90000.00),
    (3, 3, '2026-08-08', 'APPROVED', 66400.00),
    (4, 4, '2026-08-12', 'PENDING', 42500.00),
    (5, 5, '2026-08-15', 'RECEIVED', 110000.00);


-- PURCHASE ORDER ITEMS

INSERT INTO purchase_order_item
    (
        purchase_order_item_id,
        purchase_order_id,
        product_id,
        quantity,
        unit_price
    )
VALUES
    (1, 1, 1, 10, 18000.00),
    (2, 2, 2, 20, 4500.00),
    (3, 3, 3, 5, 12000.00),
    (4, 3, 5, 2, 3200.00),
    (5, 4, 4, 5, 8500.00),
    (6, 5, 9, 50, 2200.00);


-- MACHINES

INSERT INTO machine
    (
        machine_id,
        machine_name,
        machine_type,
        status
    )
VALUES
    (1, 'CNC Machine 01', 'CNC', 'RUNNING'),
    (2, 'Assembly Line 01', 'ASSEMBLY', 'RUNNING'),
    (3, 'Hydraulic Press 01', 'HYDRAULIC', 'AVAILABLE'),
    (4, 'CNC Machine 02', 'CNC', 'MAINTENANCE'),
    (5, 'Electronic Assembly 01', 'ELECTRONICS', 'AVAILABLE');


-- PRODUCTION ORDERS

INSERT INTO production_order
    (
        production_order_id,
        product_id,
        machine_id,
        quantity,
        start_date,
        end_date,
        status
    )
VALUES
    (1, 2, 1, 100,
     '2026-08-18', '2026-08-25', 'COMPLETED'),

    (2, 1, 2, 50,
     '2026-08-20', NULL, 'IN_PROGRESS'),

    (3, 3, 5, 40,
     '2026-08-22', NULL, 'IN_PROGRESS'),

    (4, 4, 3, 60,
     '2026-08-26', NULL, 'PLANNED'),

    (5, 9, 1, 100,
     '2026-08-10', '2026-08-17', 'COMPLETED');


-- PRODUCTION LOGS

INSERT INTO production_log
    (
        production_log_id,
        production_order_id,
        log_timestamp,
        quantity_produced,
        status,
        remarks
    )
VALUES
    (1, 1, '2026-08-20 10:00:00',
     30, 'IN_PROGRESS', 'Initial production batch'),

    (2, 1, '2026-08-22 15:00:00',
     35, 'IN_PROGRESS', 'Production continuing'),

    (3, 1, '2026-08-25 16:00:00',
     35, 'COMPLETED', 'Order completed'),

    (4, 2, '2026-08-21 11:00:00',
     20, 'IN_PROGRESS', 'First batch'),

    (5, 2, '2026-08-24 14:00:00',
     15, 'IN_PROGRESS', 'Second batch'),

    (6, 3, '2026-08-23 12:00:00',
     15, 'IN_PROGRESS', 'Assembly started'),

    (7, 5, '2026-08-15 15:00:00',
     100, 'COMPLETED', 'Production completed');


-- ROBOTS

INSERT INTO robot
    (
        robot_id,
        robot_name,
        battery_level,
        status,
        current_location
    )
VALUES
    (1, 'AGV-01', 87.50, 'BUSY', 'Warehouse A - Row 2'),
    (2, 'AGV-02', 64.00, 'IDLE', 'Warehouse B'),
    (3, 'AGV-03', 92.00, 'CHARGING', 'Charging Station'),
    (4, 'AGV-04', 41.50, 'MAINTENANCE', 'Maintenance Bay');


-- ROBOT TASKS

INSERT INTO robot_task
    (
        task_id,
        robot_id,
        shelf_id,
        product_id,
        quantity,
        start_time,
        end_time,
        status
    )
VALUES
    (
        1, 1, 1, 6, 30,
        CURRENT_TIMESTAMP - INTERVAL '3 hours',
        CURRENT_TIMESTAMP - INTERVAL '2 hours',
        'COMPLETED'
    ),

    (
        2, 1, 2, 2, 20,
        CURRENT_TIMESTAMP - INTERVAL '1 hour',
        NULL,
        'IN_PROGRESS'
    ),

    (
        3, 2, 5, 1, 10,
        NULL,
        NULL,
        'ASSIGNED'
    ),

    (
        4, 3, 8, 3, 5,
        CURRENT_TIMESTAMP - INTERVAL '5 hours',
        CURRENT_TIMESTAMP - INTERVAL '4 hours',
        'COMPLETED'
    ),

    (
        5, 2, 6, 10, 10,
        NULL,
        NULL,
        'CREATED'
    );


-- CUSTOMERS

INSERT INTO customer
    (
        customer_id,
        customer_name,
        phone,
        email,
        address
    )
VALUES
    (1, 'ABC Manufacturing Pvt Ltd',
     '9811000001', 'purchase@abcmanufacturing.com', 'Bangalore'),

    (2, 'TechBuild Industries',
     '9811000002', 'orders@techbuild.com', 'Chennai'),

    (3, 'Metro Engineering Works',
     '9811000003', 'sales@metroengineering.com', 'Hyderabad'),

    (4, 'National Automation Ltd',
     '9811000004', 'procurement@nationalauto.com', 'Pune'),

    (5, 'Future Machines Pvt Ltd',
     '9811000005', 'orders@futuremachines.com', 'Mumbai');


-- INVOICES

INSERT INTO invoice
    (
        invoice_id,
        customer_id,
        invoice_date,
        tax,
        total_amount
    )
VALUES
    (1, 1, '2026-08-05', 4320.00, 28320.00),
    (2, 2, '2026-08-08', 5850.00, 38350.00),
    (3, 3, '2026-08-12', 3150.00, 20650.00),
    (4, 4, '2026-08-18', 6480.00, 41480.00),
    (5, 5, '2026-08-22', 4320.00, 28320.00);


-- INVOICE ITEMS

INSERT INTO invoice_item
    (
        invoice_item_id,
        invoice_id,
        product_id,
        quantity,
        unit_price
    )
VALUES
    (1, 1, 1, 1, 24000.00),
    (2, 2, 2, 5, 6500.00),
    (3, 3, 5, 4, 4800.00),
    (4, 4, 3, 2, 17500.00),
    (5, 5, 4, 2, 12000.00);


-- STOCK TRANSACTIONS

INSERT INTO stock_transaction
    (
        transaction_id,
        product_id,
        warehouse_id,
        transaction_type,
        quantity,
        transaction_date,
        reference_id
    )
VALUES
    (1, 1, 1, 'PURCHASE',
     10, '2026-08-01 10:00:00', 'PO-1'),

    (2, 2, 1, 'PURCHASE',
     20, '2026-08-04 11:30:00', 'PO-2'),

    (3, 3, 3, 'PURCHASE',
     5, '2026-08-08 09:45:00', 'PO-3'),

    (4, 1, 2, 'PRODUCTION',
     50, '2026-08-20 17:00:00', 'PROD-2'),

    (5, 2, 1, 'PRODUCTION',
     100, '2026-08-25 16:00:00', 'PROD-1'),

    (6, 1, 2, 'SALE',
     1, '2026-08-05 12:00:00', 'INV-1'),

    (7, 2, 2, 'SALE',
     5, '2026-08-08 13:00:00', 'INV-2'),

    (8, 6, 1, 'ROBOT_MOVEMENT',
     30, '2026-08-25 14:00:00', 'TASK-1'),

    (9, 5, 3, 'ADJUSTMENT',
     5, '2026-08-26 09:00:00', 'ADJ-1');


-- ACCOUNTS

INSERT INTO account
    (
        account_id,
        account_name,
        account_type
    )
VALUES
    (1, 'Cash', 'ASSET'),
    (2, 'Bank Account', 'ASSET'),
    (3, 'Inventory', 'ASSET'),
    (4, 'Accounts Receivable', 'ASSET'),
    (5, 'Accounts Payable', 'LIABILITY'),
    (6, 'Owner Equity', 'EQUITY'),
    (7, 'Sales Revenue', 'REVENUE'),
    (8, 'Purchase Expense', 'EXPENSE'),
    (9, 'Salary Expense', 'EXPENSE'),
    (10, 'Utilities Expense', 'EXPENSE');


-- JOURNAL ENTRIES

INSERT INTO journal_entry
    (
        journal_entry_id,
        entry_date,
        description
    )
VALUES
    (1, '2026-08-05', 'Sale of Industrial Motor'),
    (2, '2026-08-08', 'Purchase of Steel Gear Assemblies'),
    (3, '2026-08-10', 'Monthly salary payment'),
    (4, '2026-08-15', 'Factory electricity expense'),
    (5, '2026-08-18', 'Sale of Control Panels');


-- JOURNAL ENTRY LINES

INSERT INTO journal_entry_line
    (
        line_id,
        journal_entry_id,
        account_id,
        debit,
        credit
    )
VALUES
    (1, 1, 1, 24000.00, 0),
    (2, 1, 7, 0, 24000.00),

    (3, 2, 3, 90000.00, 0),
    (4, 2, 5, 0, 90000.00),

    (5, 3, 9, 300000.00, 0),
    (6, 3, 2, 0, 300000.00),

    (7, 4, 10, 45000.00, 0),
    (8, 4, 2, 0, 45000.00),

    (9, 5, 1, 35000.00, 0),
    (10, 5, 7, 0, 35000.00);


-- EXPENSES

INSERT INTO expense
    (
        expense_id,
        account_id,
        expense_date,
        amount,
        description
    )
VALUES
    (1, 9, '2026-08-10',
     300000.00, 'Monthly employee salary expense'),

    (2, 10, '2026-08-15',
     45000.00, 'Factory electricity'),

    (3, 10, '2026-08-20',
     18000.00, 'Machine maintenance'),

    (4, 10, '2026-08-22',
     12000.00, 'Warehouse maintenance');


-- RESET SEQUENCES

SELECT setval(pg_get_serial_sequence('department', 'department_id'),
    COALESCE((SELECT MAX(department_id) FROM department), 1));

SELECT setval(pg_get_serial_sequence('employee', 'employee_id'),
    COALESCE((SELECT MAX(employee_id) FROM employee), 1));

SELECT setval(pg_get_serial_sequence('users', 'user_id'),
    COALESCE((SELECT MAX(user_id) FROM users), 1));

SELECT setval(pg_get_serial_sequence('attendance_device', 'device_id'),
    COALESCE((SELECT MAX(device_id) FROM attendance_device), 1));

SELECT setval(pg_get_serial_sequence('attendance', 'attendance_id'),
    COALESCE((SELECT MAX(attendance_id) FROM attendance), 1));

SELECT setval(pg_get_serial_sequence('payroll', 'payroll_id'),
    COALESCE((SELECT MAX(payroll_id) FROM payroll), 1));

SELECT setval(pg_get_serial_sequence('product', 'product_id'),
    COALESCE((SELECT MAX(product_id) FROM product), 1));

SELECT setval(pg_get_serial_sequence('warehouse', 'warehouse_id'),
    COALESCE((SELECT MAX(warehouse_id) FROM warehouse), 1));

SELECT setval(pg_get_serial_sequence('shelf', 'shelf_id'),
    COALESCE((SELECT MAX(shelf_id) FROM shelf), 1));

SELECT setval(pg_get_serial_sequence('inventory', 'inventory_id'),
    COALESCE((SELECT MAX(inventory_id) FROM inventory), 1));

SELECT setval(pg_get_serial_sequence('stock_transaction', 'transaction_id'),
    COALESCE((SELECT MAX(transaction_id) FROM stock_transaction), 1));

SELECT setval(pg_get_serial_sequence('supplier', 'supplier_id'),
    COALESCE((SELECT MAX(supplier_id) FROM supplier), 1));

SELECT setval(pg_get_serial_sequence('purchase_order', 'purchase_order_id'),
    COALESCE((SELECT MAX(purchase_order_id) FROM purchase_order), 1));

SELECT setval(pg_get_serial_sequence('purchase_order_item', 'purchase_order_item_id'),
    COALESCE((SELECT MAX(purchase_order_item_id) FROM purchase_order_item), 1));

SELECT setval(pg_get_serial_sequence('machine', 'machine_id'),
    COALESCE((SELECT MAX(machine_id) FROM machine), 1));

SELECT setval(pg_get_serial_sequence('production_order', 'production_order_id'),
    COALESCE((SELECT MAX(production_order_id) FROM production_order), 1));

SELECT setval(pg_get_serial_sequence('production_log', 'production_log_id'),
    COALESCE((SELECT MAX(production_log_id) FROM production_log), 1));

SELECT setval(pg_get_serial_sequence('robot', 'robot_id'),
    COALESCE((SELECT MAX(robot_id) FROM robot), 1));

SELECT setval(pg_get_serial_sequence('robot_task', 'task_id'),
    COALESCE((SELECT MAX(task_id) FROM robot_task), 1));

SELECT setval(pg_get_serial_sequence('sensor', 'sensor_id'),
    COALESCE((SELECT MAX(sensor_id) FROM sensor), 1));

SELECT setval(pg_get_serial_sequence('sensor_data', 'reading_id'),
    COALESCE((SELECT MAX(reading_id) FROM sensor_data), 1));

SELECT setval(pg_get_serial_sequence('alert', 'alert_id'),
    COALESCE((SELECT MAX(alert_id) FROM alert), 1));

SELECT setval(pg_get_serial_sequence('customer', 'customer_id'),
    COALESCE((SELECT MAX(customer_id) FROM customer), 1));

SELECT setval(pg_get_serial_sequence('invoice', 'invoice_id'),
    COALESCE((SELECT MAX(invoice_id) FROM invoice), 1));

SELECT setval(pg_get_serial_sequence('invoice_item', 'invoice_item_id'),
    COALESCE((SELECT MAX(invoice_item_id) FROM invoice_item), 1));

SELECT setval(pg_get_serial_sequence('account', 'account_id'),
    COALESCE((SELECT MAX(account_id) FROM account), 1));

SELECT setval(pg_get_serial_sequence('journal_entry', 'journal_entry_id'),
    COALESCE((SELECT MAX(journal_entry_id) FROM journal_entry), 1));

SELECT setval(pg_get_serial_sequence('journal_entry_line', 'line_id'),
    COALESCE((SELECT MAX(line_id) FROM journal_entry_line), 1));

SELECT setval(pg_get_serial_sequence('expense', 'expense_id'),
    COALESCE((SELECT MAX(expense_id) FROM expense), 1));