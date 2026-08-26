-- ============================================================
-- EMPLOYEE AND DEPARTMENT QUERIES
-- ============================================================

-- 1. Display all employees with their departments

SELECT
    e.employee_id,
    e.first_name,
    e.last_name,
    d.department_name,
    e.email,
    e.salary,
    e.status
FROM employee e
JOIN department d
    ON e.department_id = d.department_id
ORDER BY e.employee_id;


-- 2. Display employees belonging to the Production department

SELECT
    e.employee_id,
    e.first_name,
    e.last_name,
    e.email,
    e.salary
FROM employee e
JOIN department d
    ON e.department_id = d.department_id
WHERE d.department_name = 'Production';


-- 3. Count employees in each department

SELECT
    d.department_name,
    COUNT(e.employee_id) AS employee_count
FROM department d
LEFT JOIN employee e
    ON d.department_id = e.department_id
GROUP BY
    d.department_id,
    d.department_name
ORDER BY employee_count DESC;


-- 4. Find employees earning more than the average salary

SELECT
    employee_id,
    first_name,
    last_name,
    salary
FROM employee
WHERE salary > (
    SELECT AVG(salary)
    FROM employee
)
ORDER BY salary DESC;


-- 5. Find the highest-paid employee

SELECT
    employee_id,
    first_name,
    last_name,
    salary
FROM employee
WHERE salary = (
    SELECT MAX(salary)
    FROM employee
);


-- 6. Display department managers

SELECT
    d.department_name,
    e.first_name,
    e.last_name,
    e.email
FROM department d
JOIN employee e
    ON d.manager_id = e.employee_id
ORDER BY d.department_name;


-- ============================================================
-- USER AND AUTHENTICATION QUERIES
-- ============================================================

-- 7. Display all registered users and their roles

SELECT
    u.user_id,
    u.email,
    u.oauth_provider,
    u.role,
    u.status,
    e.first_name,
    e.last_name
FROM users u
JOIN employee e
    ON u.employee_id = e.employee_id
ORDER BY u.user_id;


-- 8. Find all administrators

SELECT
    u.user_id,
    u.email,
    e.first_name,
    e.last_name,
    u.role
FROM users u
JOIN employee e
    ON u.employee_id = e.employee_id
WHERE u.role = 'ADMIN';


-- 9. Find an active user by email

SELECT
    u.user_id,
    u.email,
    u.role,
    u.status
FROM users u
WHERE u.email = 'ashishchoudhary29006@gmail.com'
  AND u.status = 'ACTIVE';


-- ============================================================
-- ATTENDANCE QUERIES
-- ============================================================

-- 10. Display today's attendance

SELECT
    e.employee_id,
    e.first_name,
    e.last_name,
    a.attendance_date,
    a.check_in,
    a.check_out,
    ad.device_name
FROM attendance a
JOIN employee e
    ON a.employee_id = e.employee_id
LEFT JOIN attendance_device ad
    ON a.device_id = ad.device_id
WHERE a.attendance_date = CURRENT_DATE
ORDER BY a.check_in;


-- 11. Find employees who have not checked in today

SELECT
    e.employee_id,
    e.first_name,
    e.last_name,
    d.department_name
FROM employee e
JOIN department d
    ON e.department_id = d.department_id
LEFT JOIN attendance a
    ON e.employee_id = a.employee_id
    AND a.attendance_date = CURRENT_DATE
WHERE a.attendance_id IS NULL
  AND e.status = 'ACTIVE';


-- 12. Count attendance records by device

SELECT
    ad.device_name,
    ad.device_type,
    COUNT(a.attendance_id) AS attendance_count
FROM attendance_device ad
LEFT JOIN attendance a
    ON ad.device_id = a.device_id
GROUP BY
    ad.device_id,
    ad.device_name,
    ad.device_type
ORDER BY attendance_count DESC;


-- ============================================================
-- PAYROLL QUERIES
-- ============================================================

-- 13. Display employee payroll

SELECT
    e.employee_id,
    e.first_name,
    e.last_name,
    p.payroll_month,
    p.basic_salary,
    p.bonus,
    p.deduction,
    p.net_salary
FROM payroll p
JOIN employee e
    ON p.employee_id = e.employee_id
ORDER BY e.employee_id;


-- 14. Calculate total payroll expense

SELECT
    SUM(net_salary) AS total_payroll
FROM payroll
WHERE payroll_month = '2026-08-01';


-- 15. Find employees with the highest net salary

SELECT
    e.first_name,
    e.last_name,
    p.net_salary
FROM payroll p
JOIN employee e
    ON p.employee_id = e.employee_id
WHERE p.net_salary = (
    SELECT MAX(net_salary)
    FROM payroll
);


-- ============================================================
-- PRODUCT AND INVENTORY QUERIES
-- ============================================================

-- 16. Display complete inventory

SELECT
    p.product_id,
    p.product_name,
    p.category,
    w.warehouse_name,
    i.quantity,
    i.minimum_stock,
    i.maximum_stock
FROM inventory i
JOIN product p
    ON i.product_id = p.product_id
JOIN warehouse w
    ON i.warehouse_id = w.warehouse_id
ORDER BY p.product_name;


-- 17. Find products below minimum stock

SELECT
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
WHERE i.quantity < i.minimum_stock
ORDER BY i.quantity;


-- 18. Find products above minimum stock

SELECT
    p.product_name,
    w.warehouse_name,
    i.quantity,
    i.minimum_stock
FROM inventory i
JOIN product p
    ON i.product_id = p.product_id
JOIN warehouse w
    ON i.warehouse_id = w.warehouse_id
WHERE i.quantity >= i.minimum_stock
ORDER BY i.quantity DESC;


-- 19. Calculate inventory value by product

SELECT
    p.product_id,
    p.product_name,
    SUM(i.quantity) AS total_quantity,
    p.cost_price,
    SUM(i.quantity * p.cost_price) AS inventory_value
FROM inventory i
JOIN product p
    ON i.product_id = p.product_id
GROUP BY
    p.product_id,
    p.product_name,
    p.cost_price
ORDER BY inventory_value DESC;


-- 20. Calculate total inventory value

SELECT
    SUM(i.quantity * p.cost_price) AS total_inventory_value
FROM inventory i
JOIN product p
    ON i.product_id = p.product_id;


-- 21. Find the most expensive products

SELECT
    product_id,
    product_name,
    cost_price,
    selling_price
FROM product
ORDER BY selling_price DESC
LIMIT 5;


-- 22. Find products with profit margin greater than 30%

SELECT
    product_id,
    product_name,
    cost_price,
    selling_price,
    selling_price - cost_price AS profit,
    ROUND(
        ((selling_price - cost_price) / cost_price) * 100,
        2
    ) AS profit_percentage
FROM product
WHERE ((selling_price - cost_price) / cost_price) * 100 > 30
ORDER BY profit_percentage DESC;


-- ============================================================
-- WAREHOUSE AND SHELF QUERIES
-- ============================================================

-- 23. Display all warehouse shelves

SELECT
    w.warehouse_name,
    s.shelf_id,
    s.row_no,
    s.column_no,
    s.rfid_tag
FROM shelf s
JOIN warehouse w
    ON s.warehouse_id = w.warehouse_id
ORDER BY
    w.warehouse_name,
    s.row_no,
    s.column_no;


-- 24. Count shelves in each warehouse

SELECT
    w.warehouse_name,
    COUNT(s.shelf_id) AS shelf_count
FROM warehouse w
LEFT JOIN shelf s
    ON w.warehouse_id = s.warehouse_id
GROUP BY
    w.warehouse_id,
    w.warehouse_name
ORDER BY shelf_count DESC;


-- 25. Display inventory by warehouse

SELECT
    w.warehouse_name,
    COUNT(DISTINCT i.product_id) AS product_types,
    SUM(i.quantity) AS total_units
FROM warehouse w
LEFT JOIN inventory i
    ON w.warehouse_id = i.warehouse_id
GROUP BY
    w.warehouse_id,
    w.warehouse_name
ORDER BY total_units DESC;


-- ============================================================
-- SUPPLIER AND PURCHASE QUERIES
-- ============================================================

-- 26. Display all purchase orders with supplier information

SELECT
    po.purchase_order_id,
    s.supplier_name,
    po.order_date,
    po.status,
    po.total_amount
FROM purchase_order po
JOIN supplier s
    ON po.supplier_id = s.supplier_id
ORDER BY po.order_date DESC;


-- 27. Calculate total purchases by supplier

SELECT
    s.supplier_name,
    COUNT(po.purchase_order_id) AS order_count,
    SUM(po.total_amount) AS total_purchase_amount
FROM supplier s
LEFT JOIN purchase_order po
    ON s.supplier_id = po.supplier_id
GROUP BY
    s.supplier_id,
    s.supplier_name
ORDER BY total_purchase_amount DESC NULLS LAST;


-- 28. Display purchase order details

SELECT
    po.purchase_order_id,
    s.supplier_name,
    p.product_name,
    poi.quantity,
    poi.unit_price,
    poi.quantity * poi.unit_price AS item_total
FROM purchase_order po
JOIN supplier s
    ON po.supplier_id = s.supplier_id
JOIN purchase_order_item poi
    ON po.purchase_order_id = poi.purchase_order_id
JOIN product p
    ON poi.product_id = p.product_id
ORDER BY po.purchase_order_id;


-- 29. Find pending purchase orders

SELECT
    po.purchase_order_id,
    s.supplier_name,
    po.order_date,
    po.total_amount
FROM purchase_order po
JOIN supplier s
    ON po.supplier_id = s.supplier_id
WHERE po.status = 'PENDING';


-- ============================================================
-- PRODUCTION QUERIES
-- ============================================================

-- 30. Display production orders with product and machine

SELECT
    po.production_order_id,
    p.product_name,
    m.machine_name,
    po.quantity,
    po.start_date,
    po.end_date,
    po.status
FROM production_order po
JOIN product p
    ON po.product_id = p.product_id
JOIN machine m
    ON po.machine_id = m.machine_id
ORDER BY po.production_order_id;


-- 31. Display currently running production

SELECT
    po.production_order_id,
    p.product_name,
    m.machine_name,
    po.quantity,
    po.start_date
FROM production_order po
JOIN product p
    ON po.product_id = p.product_id
JOIN machine m
    ON po.machine_id = m.machine_id
WHERE po.status = 'IN_PROGRESS';


-- 32. Total quantity produced for each product

SELECT
    p.product_name,
    SUM(pl.quantity_produced) AS total_produced
FROM production_log pl
JOIN production_order po
    ON pl.production_order_id = po.production_order_id
JOIN product p
    ON po.product_id = p.product_id
WHERE pl.status = 'COMPLETED'
GROUP BY
    p.product_id,
    p.product_name
ORDER BY total_produced DESC;


-- 33. Machine utilization by production orders

SELECT
    m.machine_name,
    COUNT(po.production_order_id) AS production_orders
FROM machine m
LEFT JOIN production_order po
    ON m.machine_id = po.machine_id
GROUP BY
    m.machine_id,
    m.machine_name
ORDER BY production_orders DESC;


-- 34. Find machines currently under maintenance

SELECT
    machine_id,
    machine_name,
    machine_type,
    status
FROM machine
WHERE status = 'MAINTENANCE';


-- ============================================================
-- ROBOT QUERIES
-- ============================================================

-- 35. Display robot status

SELECT
    robot_id,
    robot_name,
    battery_level,
    status,
    current_location
FROM robot
ORDER BY robot_id;


-- 36. Find robots requiring attention

SELECT
    robot_id,
    robot_name,
    battery_level,
    status,
    current_location
FROM robot
WHERE status IN ('MAINTENANCE', 'OFFLINE')
   OR battery_level < 50;


-- 37. Display robot tasks

SELECT
    rt.task_id,
    r.robot_name,
    p.product_name,
    rt.quantity,
    rt.status,
    rt.start_time,
    rt.end_time
FROM robot_task rt
JOIN robot r
    ON rt.robot_id = r.robot_id
JOIN product p
    ON rt.product_id = p.product_id
ORDER BY rt.task_id;


-- 38. Display active robot tasks

SELECT
    r.robot_name,
    p.product_name,
    rt.quantity,
    rt.status,
    rt.start_time
FROM robot_task rt
JOIN robot r
    ON rt.robot_id = r.robot_id
JOIN product p
    ON rt.product_id = p.product_id
WHERE rt.status IN ('ASSIGNED', 'IN_PROGRESS');


-- ============================================================
-- SENSOR AND ALERT QUERIES
-- ============================================================

-- 39. Display all sensors

SELECT
    sensor_id,
    sensor_type,
    location,
    status
FROM sensor
ORDER BY sensor_id;


-- 40. Display latest reading for each sensor

SELECT
    s.sensor_id,
    s.sensor_type,
    s.location,
    sd.reading_timestamp,
    sd.value
FROM sensor s
JOIN sensor_data sd
    ON s.sensor_id = sd.sensor_id
WHERE sd.reading_timestamp = (
    SELECT MAX(sd2.reading_timestamp)
    FROM sensor_data sd2
    WHERE sd2.sensor_id = sd.sensor_id
)
ORDER BY s.sensor_id;


-- 41. Display active alerts

SELECT
    a.alert_id,
    s.sensor_type,
    s.location,
    a.alert_type,
    a.alert_time,
    a.status
FROM alert a
JOIN sensor s
    ON a.sensor_id = s.sensor_id
WHERE a.status = 'ACTIVE'
ORDER BY a.alert_time DESC;


-- 42. Count alerts by type

SELECT
    alert_type,
    COUNT(*) AS alert_count
FROM alert
GROUP BY alert_type
ORDER BY alert_count DESC;


-- 43. Find sensors whose latest value is above 30

SELECT
    s.sensor_id,
    s.sensor_type,
    s.location,
    sd.value,
    sd.reading_timestamp
FROM sensor s
JOIN sensor_data sd
    ON s.sensor_id = sd.sensor_id
WHERE sd.reading_timestamp = (
    SELECT MAX(sd2.reading_timestamp)
    FROM sensor_data sd2
    WHERE sd2.sensor_id = sd.sensor_id
)
AND sd.value > 30;


-- ============================================================
-- CUSTOMER AND SALES QUERIES
-- ============================================================

-- 44. Display invoices with customer information

SELECT
    i.invoice_id,
    c.customer_name,
    i.invoice_date,
    i.tax,
    i.total_amount
FROM invoice i
JOIN customer c
    ON i.customer_id = c.customer_id
ORDER BY i.invoice_date DESC;


-- 45. Display invoice details

SELECT
    i.invoice_id,
    c.customer_name,
    p.product_name,
    ii.quantity,
    ii.unit_price,
    ii.quantity * ii.unit_price AS item_total
FROM invoice i
JOIN customer c
    ON i.customer_id = c.customer_id
JOIN invoice_item ii
    ON i.invoice_id = ii.invoice_id
JOIN product p
    ON ii.product_id = p.product_id
ORDER BY i.invoice_id;


-- 46. Calculate total sales

SELECT
    SUM(total_amount) AS total_sales
FROM invoice;


-- 47. Calculate sales by customer

SELECT
    c.customer_name,
    COUNT(i.invoice_id) AS invoice_count,
    SUM(i.total_amount) AS total_sales
FROM customer c
LEFT JOIN invoice i
    ON c.customer_id = i.customer_id
GROUP BY
    c.customer_id,
    c.customer_name
ORDER BY total_sales DESC NULLS LAST;


-- 48. Find the customer with the highest sales

SELECT
    c.customer_name,
    SUM(i.total_amount) AS total_sales
FROM customer c
JOIN invoice i
    ON c.customer_id = i.customer_id
GROUP BY
    c.customer_id,
    c.customer_name
ORDER BY total_sales DESC
LIMIT 1;


-- ============================================================
-- ACCOUNTING QUERIES
-- ============================================================

-- 49. Display all accounts

SELECT
    account_id,
    account_name,
    account_type
FROM account
ORDER BY account_type, account_name;


-- 50. Display journal entries

SELECT
    je.journal_entry_id,
    je.entry_date,
    je.description,
    a.account_name,
    jel.debit,
    jel.credit
FROM journal_entry je
JOIN journal_entry_line jel
    ON je.journal_entry_id = jel.journal_entry_id
JOIN account a
    ON jel.account_id = a.account_id
ORDER BY
    je.entry_date,
    je.journal_entry_id;


-- 51. Calculate total debit and credit

SELECT
    SUM(debit) AS total_debit,
    SUM(credit) AS total_credit
FROM journal_entry_line;


-- 52. Calculate revenue by account

SELECT
    a.account_name,
    SUM(jel.credit) - SUM(jel.debit) AS revenue
FROM account a
JOIN journal_entry_line jel
    ON a.account_id = jel.account_id
WHERE a.account_type = 'REVENUE'
GROUP BY
    a.account_id,
    a.account_name;


-- 53. Calculate expenses by account

SELECT
    a.account_name,
    SUM(jel.debit) - SUM(jel.credit) AS expense
FROM account a
JOIN journal_entry_line jel
    ON a.account_id = jel.account_id
WHERE a.account_type = 'EXPENSE'
GROUP BY
    a.account_id,
    a.account_name
ORDER BY expense DESC;


-- 54. Calculate net profit

SELECT
    (
        COALESCE(
            (
                SELECT SUM(jel.credit) - SUM(jel.debit)
                FROM journal_entry_line jel
                JOIN account a
                    ON jel.account_id = a.account_id
                WHERE a.account_type = 'REVENUE'
            ),
            0
        )
        -
        COALESCE(
            (
                SELECT SUM(jel.debit) - SUM(jel.credit)
                FROM journal_entry_line jel
                JOIN account a
                    ON jel.account_id = a.account_id
                WHERE a.account_type = 'EXPENSE'
            ),
            0
        )
    ) AS net_profit;


-- ============================================================
-- EXPENSE QUERIES
-- ============================================================

-- 55. Display all expenses

SELECT
    e.expense_id,
    a.account_name,
    e.expense_date,
    e.amount,
    e.description
FROM expense e
JOIN account a
    ON e.account_id = a.account_id
ORDER BY e.expense_date DESC;


-- 56. Total expenses

SELECT
    SUM(amount) AS total_expenses
FROM expense;


-- 57. Expenses by account

SELECT
    a.account_name,
    SUM(e.amount) AS total_expense
FROM expense e
JOIN account a
    ON e.account_id = a.account_id
GROUP BY
    a.account_id,
    a.account_name
ORDER BY total_expense DESC;


-- ============================================================
-- STOCK TRANSACTION QUERIES
-- ============================================================

-- 58. Display stock transaction history

SELECT
    st.transaction_id,
    p.product_name,
    w.warehouse_name,
    st.transaction_type,
    st.quantity,
    st.transaction_date,
    st.reference_id
FROM stock_transaction st
JOIN product p
    ON st.product_id = p.product_id
JOIN warehouse w
    ON st.warehouse_id = w.warehouse_id
ORDER BY st.transaction_date DESC;


-- 59. Total stock movement by transaction type

SELECT
    transaction_type,
    SUM(quantity) AS total_quantity
FROM stock_transaction
GROUP BY transaction_type
ORDER BY total_quantity DESC;


-- 60. Stock movement for a specific product

SELECT
    p.product_name,
    st.transaction_type,
    st.quantity,
    st.transaction_date,
    st.reference_id
FROM stock_transaction st
JOIN product p
    ON st.product_id = p.product_id
WHERE p.product_id = 1
ORDER BY st.transaction_date DESC;


-- ============================================================
-- AGGREGATION AND BUSINESS ANALYSIS
-- ============================================================

-- 61. Revenue, expenses and profit

SELECT
    (
        SELECT COALESCE(SUM(total_amount), 0)
        FROM invoice
    ) AS revenue,

    (
        SELECT COALESCE(SUM(amount), 0)
        FROM expense
    ) AS expenses,

    (
        (
            SELECT COALESCE(SUM(total_amount), 0)
            FROM invoice
        )
        -
        (
            SELECT COALESCE(SUM(amount), 0)
            FROM expense
        )
    ) AS profit;


-- 62. Products that have never appeared in an invoice

SELECT
    p.product_id,
    p.product_name
FROM product p
LEFT JOIN invoice_item ii
    ON p.product_id = ii.product_id
WHERE ii.product_id IS NULL;


-- 63. Products that have been purchased

SELECT DISTINCT
    p.product_id,
    p.product_name
FROM product p
JOIN purchase_order_item poi
    ON p.product_id = poi.product_id
ORDER BY p.product_id;


-- 64. Products that have both purchases and sales

SELECT
    p.product_id,
    p.product_name
FROM product p
WHERE EXISTS (
    SELECT 1
    FROM purchase_order_item poi
    WHERE poi.product_id = p.product_id
)
AND EXISTS (
    SELECT 1
    FROM invoice_item ii
    WHERE ii.product_id = p.product_id
);


-- 65. Departments with more than one employee

SELECT
    d.department_name,
    COUNT(e.employee_id) AS employee_count
FROM department d
JOIN employee e
    ON d.department_id = e.department_id
GROUP BY
    d.department_id,
    d.department_name
HAVING COUNT(e.employee_id) > 1
ORDER BY employee_count DESC;


-- 66. Suppliers whose total purchases exceed 100000

SELECT
    s.supplier_name,
    SUM(po.total_amount) AS total_purchases
FROM supplier s
JOIN purchase_order po
    ON s.supplier_id = po.supplier_id
GROUP BY
    s.supplier_id,
    s.supplier_name
HAVING SUM(po.total_amount) > 100000
ORDER BY total_purchases DESC;


-- 67. Warehouses containing more than 20 total units

SELECT
    w.warehouse_name,
    SUM(i.quantity) AS total_units
FROM warehouse w
JOIN inventory i
    ON w.warehouse_id = i.warehouse_id
GROUP BY
    w.warehouse_id,
    w.warehouse_name
HAVING SUM(i.quantity) > 20
ORDER BY total_units DESC;


-- 68. Employees whose department has above-average salary

SELECT
    e.employee_id,
    e.first_name,
    e.last_name,
    d.department_name,
    e.salary
FROM employee e
JOIN department d
    ON e.department_id = d.department_id
WHERE e.salary > (
    SELECT AVG(e2.salary)
    FROM employee e2
    WHERE e2.department_id = e.department_id
)
ORDER BY d.department_name, e.salary DESC;


-- 69. Highest-selling product by quantity

SELECT
    p.product_name,
    SUM(ii.quantity) AS quantity_sold
FROM product p
JOIN invoice_item ii
    ON p.product_id = ii.product_id
GROUP BY
    p.product_id,
    p.product_name
ORDER BY quantity_sold DESC
LIMIT 1;


-- 70. Production completion percentage

SELECT
    po.production_order_id,
    p.product_name,
    po.quantity AS ordered_quantity,
    COALESCE(SUM(pl.quantity_produced), 0) AS produced_quantity,
    ROUND(
        (
            COALESCE(SUM(pl.quantity_produced), 0)::NUMERIC
            / po.quantity
        ) * 100,
        2
    ) AS completion_percentage
FROM production_order po
JOIN product p
    ON po.product_id = p.product_id
LEFT JOIN production_log pl
    ON po.production_order_id = pl.production_order_id
GROUP BY
    po.production_order_id,
    p.product_name,
    po.quantity
ORDER BY completion_percentage DESC;