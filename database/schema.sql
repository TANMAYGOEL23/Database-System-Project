-- ============================================================
-- SMART INDUSTRIAL ERP
-- Database Systems Project
-- PostgreSQL
-- ============================================================

-- ============================================================
-- 1. DEPARTMENT
-- ============================================================

CREATE TABLE department (
    department_id SERIAL PRIMARY KEY,
    department_name VARCHAR(100) NOT NULL UNIQUE,
    manager_id INTEGER
);


-- ============================================================
-- 2. EMPLOYEE
-- ============================================================

CREATE TABLE employee (
    employee_id SERIAL PRIMARY KEY,

    department_id INTEGER NOT NULL,

    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,

    gender VARCHAR(20),

    phone VARCHAR(20),

    email VARCHAR(100) UNIQUE,

    address TEXT,

    salary NUMERIC(12,2) NOT NULL
        CHECK (salary >= 0),

    joining_date DATE NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT fk_employee_department
        FOREIGN KEY (department_id)
        REFERENCES department(department_id),

    CONSTRAINT chk_employee_status
        CHECK (
            status IN ('ACTIVE', 'INACTIVE', 'ON_LEAVE')
        )
);


-- Department manager relationship
-- Added separately because Employee itself references Department.

ALTER TABLE department
ADD CONSTRAINT fk_department_manager
FOREIGN KEY (manager_id)
REFERENCES employee(employee_id);


-- ============================================================
-- 3. USERS
-- ============================================================
-- Single authentication table as required by the assignment.
--
-- Roles:
-- ADMIN
-- EMPLOYEE
-- ============================================================

CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,

    employee_id INTEGER UNIQUE NOT NULL,

    username VARCHAR(50) UNIQUE NOT NULL,

    password_hash VARCHAR(255) NOT NULL,

    role VARCHAR(20) NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT fk_users_employee
        FOREIGN KEY (employee_id)
        REFERENCES employee(employee_id),

    CONSTRAINT chk_user_role
        CHECK (
            role IN ('ADMIN', 'EMPLOYEE')
        ),

    CONSTRAINT chk_user_status
        CHECK (
            status IN ('ACTIVE', 'INACTIVE')
        )
);


-- ============================================================
-- 4. ATTENDANCE DEVICE
-- ============================================================

CREATE TABLE attendance_device (
    device_id SERIAL PRIMARY KEY,

    device_name VARCHAR(100) NOT NULL,

    device_type VARCHAR(50) NOT NULL,

    location VARCHAR(100),

    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT chk_device_status
        CHECK (
            status IN ('ACTIVE', 'INACTIVE')
        )
);


-- ============================================================
-- 5. ATTENDANCE
-- ============================================================

CREATE TABLE attendance (
    attendance_id SERIAL PRIMARY KEY,

    employee_id INTEGER NOT NULL,

    attendance_date DATE NOT NULL,

    check_in TIME,

    check_out TIME,

    device_id INTEGER,

    CONSTRAINT fk_attendance_employee
        FOREIGN KEY (employee_id)
        REFERENCES employee(employee_id),

    CONSTRAINT fk_attendance_device
        FOREIGN KEY (device_id)
        REFERENCES attendance_device(device_id),

    CONSTRAINT uq_employee_attendance
        UNIQUE (employee_id, attendance_date),

    CONSTRAINT chk_attendance_time
        CHECK (
            check_out IS NULL
            OR check_in IS NULL
            OR check_out >= check_in
        )
);


-- ============================================================
-- 6. PAYROLL
-- ============================================================

CREATE TABLE payroll (
    payroll_id SERIAL PRIMARY KEY,

    employee_id INTEGER NOT NULL,

    payroll_month DATE NOT NULL,

    basic_salary NUMERIC(12,2) NOT NULL
        CHECK (basic_salary >= 0),

    bonus NUMERIC(12,2) NOT NULL DEFAULT 0
        CHECK (bonus >= 0),

    deduction NUMERIC(12,2) NOT NULL DEFAULT 0
        CHECK (deduction >= 0),

    net_salary NUMERIC(12,2) NOT NULL
        CHECK (net_salary >= 0),

    CONSTRAINT fk_payroll_employee
        FOREIGN KEY (employee_id)
        REFERENCES employee(employee_id),

    CONSTRAINT uq_employee_payroll_month
        UNIQUE (employee_id, payroll_month)
);


-- ============================================================
-- 7. PRODUCT
-- ============================================================

CREATE TABLE product (
    product_id SERIAL PRIMARY KEY,

    product_name VARCHAR(150) NOT NULL,

    category VARCHAR(100),

    cost_price NUMERIC(12,2) NOT NULL
        CHECK (cost_price >= 0),

    selling_price NUMERIC(12,2) NOT NULL
        CHECK (selling_price >= 0),

    barcode VARCHAR(100) UNIQUE,

    unit VARCHAR(30) NOT NULL
);


-- ============================================================
-- 8. WAREHOUSE
-- ============================================================

CREATE TABLE warehouse (
    warehouse_id SERIAL PRIMARY KEY,

    warehouse_name VARCHAR(100) NOT NULL UNIQUE,

    location VARCHAR(200),

    capacity INTEGER NOT NULL
        CHECK (capacity > 0)
);


-- ============================================================
-- 9. SHELF
-- ============================================================

CREATE TABLE shelf (
    shelf_id SERIAL PRIMARY KEY,

    warehouse_id INTEGER NOT NULL,

    row_no INTEGER NOT NULL
        CHECK (row_no >= 0),

    column_no INTEGER NOT NULL
        CHECK (column_no >= 0),

    rfid_tag VARCHAR(100) UNIQUE,

    CONSTRAINT fk_shelf_warehouse
        FOREIGN KEY (warehouse_id)
        REFERENCES warehouse(warehouse_id),

    CONSTRAINT uq_shelf_position
        UNIQUE (
            warehouse_id,
            row_no,
            column_no
        )
);


-- ============================================================
-- 10. INVENTORY
-- ============================================================

CREATE TABLE inventory (
    inventory_id SERIAL PRIMARY KEY,

    warehouse_id INTEGER NOT NULL,

    product_id INTEGER NOT NULL,

    quantity INTEGER NOT NULL DEFAULT 0
        CHECK (quantity >= 0),

    minimum_stock INTEGER NOT NULL DEFAULT 0
        CHECK (minimum_stock >= 0),

    maximum_stock INTEGER
        CHECK (
            maximum_stock IS NULL
            OR maximum_stock >= minimum_stock
        ),

    CONSTRAINT fk_inventory_warehouse
        FOREIGN KEY (warehouse_id)
        REFERENCES warehouse(warehouse_id),

    CONSTRAINT fk_inventory_product
        FOREIGN KEY (product_id)
        REFERENCES product(product_id),

    CONSTRAINT uq_warehouse_product
        UNIQUE (
            warehouse_id,
            product_id
        )
);


-- ============================================================
-- 11. STOCK TRANSACTION
-- ============================================================

CREATE TABLE stock_transaction (
    transaction_id SERIAL PRIMARY KEY,

    product_id INTEGER NOT NULL,

    warehouse_id INTEGER NOT NULL,

    transaction_type VARCHAR(30) NOT NULL,

    quantity INTEGER NOT NULL
        CHECK (quantity > 0),

    transaction_date TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    reference_id VARCHAR(100),

    CONSTRAINT fk_stock_product
        FOREIGN KEY (product_id)
        REFERENCES product(product_id),

    CONSTRAINT fk_stock_warehouse
        FOREIGN KEY (warehouse_id)
        REFERENCES warehouse(warehouse_id),

    CONSTRAINT chk_transaction_type
        CHECK (
            transaction_type IN (
                'PURCHASE',
                'PRODUCTION',
                'SALE',
                'ROBOT_MOVEMENT',
                'ADJUSTMENT'
            )
        )
);


-- ============================================================
-- 12. SUPPLIER
-- ============================================================

CREATE TABLE supplier (
    supplier_id SERIAL PRIMARY KEY,

    supplier_name VARCHAR(150) NOT NULL,

    phone VARCHAR(20),

    email VARCHAR(100),

    address TEXT,

    gst_number VARCHAR(30) UNIQUE
);


-- ============================================================
-- 13. PURCHASE ORDER
-- ============================================================

CREATE TABLE purchase_order (
    purchase_order_id SERIAL PRIMARY KEY,

    supplier_id INTEGER NOT NULL,

    order_date DATE NOT NULL DEFAULT CURRENT_DATE,

    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',

    total_amount NUMERIC(14,2) NOT NULL DEFAULT 0
        CHECK (total_amount >= 0),

    CONSTRAINT fk_purchase_supplier
        FOREIGN KEY (supplier_id)
        REFERENCES supplier(supplier_id),

    CONSTRAINT chk_purchase_status
        CHECK (
            status IN (
                'PENDING',
                'APPROVED',
                'RECEIVED',
                'CANCELLED'
            )
        )
);


-- ============================================================
-- 14. PURCHASE ORDER ITEM
-- ============================================================

CREATE TABLE purchase_order_item (
    purchase_order_item_id SERIAL PRIMARY KEY,

    purchase_order_id INTEGER NOT NULL,

    product_id INTEGER NOT NULL,

    quantity INTEGER NOT NULL
        CHECK (quantity > 0),

    unit_price NUMERIC(12,2) NOT NULL
        CHECK (unit_price >= 0),

    CONSTRAINT fk_poi_purchase_order
        FOREIGN KEY (purchase_order_id)
        REFERENCES purchase_order(purchase_order_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_poi_product
        FOREIGN KEY (product_id)
        REFERENCES product(product_id)
);


-- ============================================================
-- 15. MACHINE
-- ============================================================

CREATE TABLE machine (
    machine_id SERIAL PRIMARY KEY,

    machine_name VARCHAR(100) NOT NULL UNIQUE,

    machine_type VARCHAR(100),

    status VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE',

    CONSTRAINT chk_machine_status
        CHECK (
            status IN (
                'AVAILABLE',
                'RUNNING',
                'MAINTENANCE',
                'OFFLINE'
            )
        )
);


-- ============================================================
-- 16. PRODUCTION ORDER
-- ============================================================

CREATE TABLE production_order (
    production_order_id SERIAL PRIMARY KEY,

    product_id INTEGER NOT NULL,

    machine_id INTEGER NOT NULL,

    quantity INTEGER NOT NULL
        CHECK (quantity > 0),

    start_date DATE,

    end_date DATE,

    status VARCHAR(30) NOT NULL DEFAULT 'PLANNED',

    CONSTRAINT fk_production_product
        FOREIGN KEY (product_id)
        REFERENCES product(product_id),

    CONSTRAINT fk_production_machine
        FOREIGN KEY (machine_id)
        REFERENCES machine(machine_id),

    CONSTRAINT chk_production_status
        CHECK (
            status IN (
                'PLANNED',
                'IN_PROGRESS',
                'COMPLETED',
                'CANCELLED'
            )
        ),

    CONSTRAINT chk_production_dates
        CHECK (
            end_date IS NULL
            OR start_date IS NULL
            OR end_date >= start_date
        )
);


-- ============================================================
-- 17. PRODUCTION LOG
-- ============================================================

CREATE TABLE production_log (
    production_log_id SERIAL PRIMARY KEY,

    production_order_id INTEGER NOT NULL,

    log_timestamp TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    quantity_produced INTEGER NOT NULL
        CHECK (quantity_produced >= 0),

    status VARCHAR(30),

    remarks TEXT,

    CONSTRAINT fk_production_log_order
        FOREIGN KEY (production_order_id)
        REFERENCES production_order(production_order_id)
        ON DELETE CASCADE
);


-- ============================================================
-- 18. ROBOT
-- ============================================================

CREATE TABLE robot (
    robot_id SERIAL PRIMARY KEY,

    robot_name VARCHAR(100) NOT NULL UNIQUE,

    battery_level NUMERIC(5,2) NOT NULL DEFAULT 100
        CHECK (
            battery_level >= 0
            AND battery_level <= 100
        ),

    status VARCHAR(30) NOT NULL DEFAULT 'IDLE',

    current_location VARCHAR(100),

    CONSTRAINT chk_robot_status
        CHECK (
            status IN (
                'IDLE',
                'BUSY',
                'CHARGING',
                'MAINTENANCE',
                'OFFLINE'
            )
        )
);


-- ============================================================
-- 19. ROBOT TASK
-- ============================================================

CREATE TABLE robot_task (
    task_id SERIAL PRIMARY KEY,

    robot_id INTEGER NOT NULL,

    shelf_id INTEGER NOT NULL,

    product_id INTEGER NOT NULL,

    quantity INTEGER NOT NULL
        CHECK (quantity > 0),

    start_time TIMESTAMP,

    end_time TIMESTAMP,

    status VARCHAR(30) NOT NULL DEFAULT 'CREATED',

    CONSTRAINT fk_robot_task_robot
        FOREIGN KEY (robot_id)
        REFERENCES robot(robot_id),

    CONSTRAINT fk_robot_task_shelf
        FOREIGN KEY (shelf_id)
        REFERENCES shelf(shelf_id),

    CONSTRAINT fk_robot_task_product
        FOREIGN KEY (product_id)
        REFERENCES product(product_id),

    CONSTRAINT chk_robot_task_status
        CHECK (
            status IN (
                'CREATED',
                'ASSIGNED',
                'IN_PROGRESS',
                'PICKED',
                'DELIVERED',
                'COMPLETED',
                'CANCELLED'
            )
        ),

    CONSTRAINT chk_robot_task_dates
        CHECK (
            end_time IS NULL
            OR start_time IS NULL
            OR end_time >= start_time
        )
);


-- ============================================================
-- 20. SENSOR
-- ============================================================

CREATE TABLE sensor (
    sensor_id SERIAL PRIMARY KEY,

    sensor_type VARCHAR(50) NOT NULL,

    location VARCHAR(100) NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT chk_sensor_status
        CHECK (
            status IN ('ACTIVE', 'INACTIVE')
        )
);


-- ============================================================
-- 21. SENSOR DATA
-- ============================================================

CREATE TABLE sensor_data (
    reading_id BIGSERIAL PRIMARY KEY,

    sensor_id INTEGER NOT NULL,

    reading_timestamp TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    value NUMERIC(12,4) NOT NULL,

    CONSTRAINT fk_sensor_data_sensor
        FOREIGN KEY (sensor_id)
        REFERENCES sensor(sensor_id)
        ON DELETE CASCADE
);


-- ============================================================
-- 22. ALERT
-- ============================================================

CREATE TABLE alert (
    alert_id SERIAL PRIMARY KEY,

    sensor_id INTEGER NOT NULL,

    alert_type VARCHAR(100) NOT NULL,

    alert_time TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT fk_alert_sensor
        FOREIGN KEY (sensor_id)
        REFERENCES sensor(sensor_id),

    CONSTRAINT chk_alert_status
        CHECK (
            status IN (
                'ACTIVE',
                'ACKNOWLEDGED',
                'RESOLVED'
            )
        )
);


-- ============================================================
-- 23. CUSTOMER
-- ============================================================

CREATE TABLE customer (
    customer_id SERIAL PRIMARY KEY,

    customer_name VARCHAR(150) NOT NULL,

    phone VARCHAR(20),

    email VARCHAR(100),

    address TEXT
);


-- ============================================================
-- 24. INVOICE
-- ============================================================

CREATE TABLE invoice (
    invoice_id SERIAL PRIMARY KEY,

    customer_id INTEGER NOT NULL,

    invoice_date DATE NOT NULL
        DEFAULT CURRENT_DATE,

    tax NUMERIC(12,2) NOT NULL DEFAULT 0
        CHECK (tax >= 0),

    total_amount NUMERIC(14,2) NOT NULL DEFAULT 0
        CHECK (total_amount >= 0),

    CONSTRAINT fk_invoice_customer
        FOREIGN KEY (customer_id)
        REFERENCES customer(customer_id)
);


-- ============================================================
-- 25. INVOICE ITEM
-- ============================================================

CREATE TABLE invoice_item (
    invoice_item_id SERIAL PRIMARY KEY,

    invoice_id INTEGER NOT NULL,

    product_id INTEGER NOT NULL,

    quantity INTEGER NOT NULL
        CHECK (quantity > 0),

    unit_price NUMERIC(12,2) NOT NULL
        CHECK (unit_price >= 0),

    CONSTRAINT fk_invoice_item_invoice
        FOREIGN KEY (invoice_id)
        REFERENCES invoice(invoice_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_invoice_item_product
        FOREIGN KEY (product_id)
        REFERENCES product(product_id)
);


-- ============================================================
-- 26. ACCOUNT
-- ============================================================

CREATE TABLE account (
    account_id SERIAL PRIMARY KEY,

    account_name VARCHAR(150) NOT NULL UNIQUE,

    account_type VARCHAR(50) NOT NULL,

    CONSTRAINT chk_account_type
        CHECK (
            account_type IN (
                'ASSET',
                'LIABILITY',
                'EQUITY',
                'REVENUE',
                'EXPENSE'
            )
        )
);


-- ============================================================
-- 27. JOURNAL ENTRY
-- ============================================================

CREATE TABLE journal_entry (
    journal_entry_id SERIAL PRIMARY KEY,

    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,

    description TEXT NOT NULL
);


-- ============================================================
-- 28. JOURNAL ENTRY LINE
-- ============================================================

CREATE TABLE journal_entry_line (
    line_id SERIAL PRIMARY KEY,

    journal_entry_id INTEGER NOT NULL,

    account_id INTEGER NOT NULL,

    debit NUMERIC(14,2) NOT NULL DEFAULT 0
        CHECK (debit >= 0),

    credit NUMERIC(14,2) NOT NULL DEFAULT 0
        CHECK (credit >= 0),

    CONSTRAINT fk_journal_line_entry
        FOREIGN KEY (journal_entry_id)
        REFERENCES journal_entry(journal_entry_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_journal_line_account
        FOREIGN KEY (account_id)
        REFERENCES account(account_id),

    CONSTRAINT chk_debit_or_credit
        CHECK (
            (debit > 0 AND credit = 0)
            OR
            (credit > 0 AND debit = 0)
        )
);


-- ============================================================
-- 29. EXPENSE
-- ============================================================

CREATE TABLE expense (
    expense_id SERIAL PRIMARY KEY,

    account_id INTEGER NOT NULL,

    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,

    amount NUMERIC(14,2) NOT NULL
        CHECK (amount > 0),

    description TEXT,

    CONSTRAINT fk_expense_account
        FOREIGN KEY (account_id)
        REFERENCES account(account_id)
);


-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_employee_department
ON employee(department_id);

CREATE INDEX idx_attendance_employee
ON attendance(employee_id);

CREATE INDEX idx_attendance_date
ON attendance(attendance_date);

CREATE INDEX idx_payroll_employee
ON payroll(employee_id);

CREATE INDEX idx_inventory_product
ON inventory(product_id);

CREATE INDEX idx_inventory_warehouse
ON inventory(warehouse_id);

CREATE INDEX idx_stock_transaction_product
ON stock_transaction(product_id);

CREATE INDEX idx_stock_transaction_date
ON stock_transaction(transaction_date);

CREATE INDEX idx_purchase_order_supplier
ON purchase_order(supplier_id);

CREATE INDEX idx_purchase_order_item_product
ON purchase_order_item(product_id);

CREATE INDEX idx_production_order_product
ON production_order(product_id);

CREATE INDEX idx_production_order_machine
ON production_order(machine_id);

CREATE INDEX idx_robot_task_robot
ON robot_task(robot_id);

CREATE INDEX idx_robot_task_product
ON robot_task(product_id);

CREATE INDEX idx_sensor_data_sensor
ON sensor_data(sensor_id);

CREATE INDEX idx_sensor_data_timestamp
ON sensor_data(reading_timestamp);

CREATE INDEX idx_invoice_customer
ON invoice(customer_id);

CREATE INDEX idx_invoice_item_product
ON invoice_item(product_id);

CREATE INDEX idx_journal_line_account
ON journal_entry_line(account_id);

CREATE INDEX idx_users_role
ON users(role);


-- ============================================================
-- VIEWS
-- ============================================================

-- View 1: Low stock products

CREATE VIEW low_stock_products AS
SELECT
    i.inventory_id,
    p.product_id,
    p.product_name,
    w.warehouse_name,
    i.quantity,
    i.minimum_stock
FROM inventory i
JOIN product p
    ON i.product_id = p.product_id
JOIN warehouse w
    ON i.warehouse_id = w.warehouse_id
WHERE i.quantity <= i.minimum_stock;


-- View 2: Employee attendance summary

CREATE VIEW employee_attendance_summary AS
SELECT
    e.employee_id,
    e.first_name,
    e.last_name,
    e.department_id,
    COUNT(a.attendance_id) AS attendance_days
FROM employee e
LEFT JOIN attendance a
    ON e.employee_id = a.employee_id
GROUP BY
    e.employee_id,
    e.first_name,
    e.last_name,
    e.department_id;


-- View 3: Invoice summary

CREATE VIEW invoice_summary AS
SELECT
    i.invoice_id,
    c.customer_name,
    i.invoice_date,
    i.tax,
    i.total_amount
FROM invoice i
JOIN customer c
    ON i.customer_id = c.customer_id;


-- ============================================================
-- TRIGGER
-- ============================================================

-- Trigger function:
-- Whenever inventory becomes equal to or lower than
-- minimum stock, create an alert.

CREATE OR REPLACE FUNCTION create_low_stock_alert()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN

    IF NEW.quantity <= NEW.minimum_stock THEN

        INSERT INTO alert (
            sensor_id,
            alert_type,
            alert_time,
            status
        )
        SELECT
            s.sensor_id,
            'LOW_STOCK',
            CURRENT_TIMESTAMP,
            'ACTIVE'
        FROM sensor s
        WHERE s.sensor_type = 'INVENTORY'
        LIMIT 1;

    END IF;

    RETURN NEW;

END;
$$;


CREATE TRIGGER trg_low_stock_alert
AFTER INSERT OR UPDATE OF quantity
ON inventory
FOR EACH ROW
EXECUTE FUNCTION create_low_stock_alert();


-- ============================================================
-- STORED PROCEDURE
-- ============================================================

-- Receives a purchase order and updates its status.
--
-- The actual inventory updates will be performed inside
-- a transaction from the Spring Boot service.
--
-- This procedure demonstrates PostgreSQL stored procedures.

CREATE OR REPLACE PROCEDURE receive_purchase_order(
    p_purchase_order_id INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN

    UPDATE purchase_order
    SET status = 'RECEIVED'
    WHERE purchase_order_id = p_purchase_order_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION
            'Purchase order % does not exist',
            p_purchase_order_id;
    END IF;

END;
$$;