-- 1. Employees with their departments
SELECT
    e.employee_id,
    e.first_name,
    e.last_name,
    d.department_name
FROM employee e
JOIN department d
    ON e.department_id = d.department_id;


-- 2. Products currently below minimum stock
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
WHERE i.quantity < i.minimum_stock;


-- 3. Total inventory value
SELECT
    SUM(i.quantity * p.cost_price) AS total_inventory_value
FROM inventory i
JOIN product p
    ON i.product_id = p.product_id;


-- 4. Production orders with machine details
SELECT
    po.production_order_id,
    p.product_name,
    m.machine_name,
    po.quantity,
    po.status
FROM production_order po
JOIN product p
    ON po.product_id = p.product_id
JOIN machine m
    ON po.machine_id = m.machine_id;


-- 5. Employee payroll details
SELECT
    e.first_name,
    e.last_name,
    p.basic_salary,
    p.bonus,
    p.deduction,
    p.net_salary
FROM payroll p
JOIN employee e
    ON p.employee_id = e.employee_id;


-- 6. Number of employees in each department
SELECT
    d.department_name,
    COUNT(e.employee_id) AS employee_count
FROM department d
LEFT JOIN employee e
    ON d.department_id = e.department_id
GROUP BY d.department_id, d.department_name;


-- 7. Active sensor alerts
SELECT
    s.sensor_type,
    s.location,
    a.alert_type,
    a.alert_time
FROM alert a
JOIN sensor s
    ON a.sensor_id = s.sensor_id
WHERE a.status = 'ACTIVE';


-- 8. Robot tasks with product information
SELECT
    r.robot_name,
    p.product_name,
    rt.quantity,
    rt.status
FROM robot_task rt
JOIN robot r
    ON rt.robot_id = r.robot_id
JOIN product p
    ON rt.product_id = p.product_id;


-- 9. Supplier purchase totals
SELECT
    s.supplier_name,
    SUM(po.total_amount) AS total_purchases
FROM supplier s
JOIN purchase_order po
    ON s.supplier_id = po.supplier_id
GROUP BY s.supplier_id, s.supplier_name
ORDER BY total_purchases DESC;


-- 10. Employees earning above average salary
SELECT
    first_name,
    last_name,
    salary
FROM employee
WHERE salary > (
    SELECT AVG(salary)
    FROM employee
);