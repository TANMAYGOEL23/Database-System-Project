# Smart Industrial ERP / Smart Factory Management System

A modern, enterprise-grade, responsive frontend for an Industrial ERP & Smart Factory Management System. Designed for a university Database Systems project based on a relational PostgreSQL database and a Spring Boot backend.

---

## 🏭 Key Features & Modules

### 1. 🔐 Role-Based Access Control (RBAC)
- **ADMIN Role**: Full control over all ERP modules (HR, Inventory, Machinery, Robotics, IoT Telemetry, Sales, Double-entry Accounting, Analytics).
- **EMPLOYEE Role**: Restricted personalized workstation with:
  - Personal greeting & shift scheduling
  - Live attendance punch clock (with real-time hours count)
  - Monthly compensation & pay slip viewing
  - Assigned CNC production jobs & progress tracking
  - Assigned AMR/AGV robot material transfer missions
  - Factory floor safety notices & incident alerts

### 2. 👥 Human Resources (HR)
- **Employees**: Complete CRUD with validation (salary bounds, valid phone, email format), department assignments, and status tracking.
- **Departments**: Management hierarchy, manager assignments, and staff headcounts.
- **Attendance**: Turnstile ledger with date, employee, and department filters. Includes **Simulate Attendance** modal for virtual RFID card tapping and biometric scanner events.
- **Payroll**: Monthly payroll generation (Basic + Bonus - Deductions = Net Take-Home), status workflows, and printable pay slip previews.

### 3. 📦 Inventory & Supply Chain
- **Master Product Catalog**: Products with category, barcode SKU, unit of measure, cost/selling price margins.
- **Stock Matrix**: Stock levels per warehouse, safety min/max buffers, status badges (IN STOCK, LOW STOCK, OUT OF STOCK), and prominent low-stock warnings.
- **Warehouses & Shelves**: Facility capacities, inventory valuation, 2D shelf coordinate grids (Row, Column), and simulated RFID tags.
- **Suppliers**: Complete vendor directory with GST / Tax IDs, addresses, contact details, and ratings.
- **Purchase Orders**: Multi-item purchase order generation with automatic 18% GST calculation. Marking a PO as `RECEIVED` automatically increments inventory stock and logs a `PURCHASE` Stock Transaction!
- **Stock Transactions**: Double-entry inventory movement audit log (`PURCHASE`, `PRODUCTION`, `SALE`, `ROBOT_MOVEMENT`, `ADJUSTMENT`).

### 4. ⚙️ Manufacturing & Machinery
- **Machinery & Cells**: CNC 5-Axis lathes, SMD lines, 500T hydraulic presses, and robotic welding cells with live OEE efficiency, temperature, and power telemetry.
- **Production Orders**: Work orders with priority tags, machine allocation, lead operator assignment, and visual cumulative progress meters (`350 / 500 units [████████░░░] 70%`).
- **Production Logs**: Shift output recording that updates work-order progress and automatically finishes orders and increments finished goods inventory when 100% is reached.

### 5. 🤖 Warehouse Robotics Automation
- **Robot Fleet**: AMR and AGV units with live battery state-of-charge (SoC) meters, location waypoints, and charging dock commands.
- **Autonomous Missions**: Material transfer jobs with full state machine lifecycle tracking:
  $$\text{CREATED} \longrightarrow \text{ASSIGNED} \longrightarrow \text{IN\_PROGRESS} \longrightarrow \text{PICKED} \longrightarrow \text{DELIVERED} \longrightarrow \text{COMPLETED}$$
- Dispatch simulator and step-by-step mission progression that automatically logs `ROBOT_MOVEMENT` stock transactions upon delivery.

### 6. 📡 IoT Sensor Monitoring & Telemetry
- **Sensor Grid**: Temperature, Humidity, Gas/Sniffers, Vibration, Optical Inventory, and Power busbars across plant zones.
- **Telemetry Waveform Stream**: Real-time line charts and historical packet tables.
- **Simulated Ingestion**: Interactive telemetry injector. Entering values exceeding safety thresholds automatically simulates database event triggers that generate active `ALERT` records!
- **Alerts & Incidents**: High/Medium/Low priority safety alert feeds with one-click Acknowledge and Resolve actions.

### 7. 💼 Sales & Commercial Invoicing
- **Customers**: Corporate client directory with credit limits, tax IDs, and lifetime purchase metrics.
- **Invoices**: Commercial tax invoice creator with dynamic product lines, 18% GST calculations, printable invoice views, and automatic deduction of stock upon dispatch.

### 8. 📊 Accounting & Financials
- **Chart of Accounts**: General Ledger hierarchy across `ASSET`, `LIABILITY`, `EQUITY`, `REVENUE`, `EXPENSE`.
- **Double-Entry Journal Entries**: General ledger postings with strict double-entry balance validation ($\sum \text{Debits} = \sum \text{Credits}$).
- **Operational Expenses**: Operating expenditure logging across utilities, spare parts, and IT licenses.

### 9. 📈 Executive Reports & Analytics Hub
- 10 Comprehensive Industrial Audit Reports:
  1. Inventory Valuation & Quantity Report
  2. Low Stock & Reorder Trigger Report
  3. Vendor Procurement & Purchase Orders Report
  4. Sales Orders & Invoicing Revenue Report
  5. Factory Floor Production Efficiency Report
  6. Plant Workforce Attendance & Shift Audit Report
  7. Monthly Factory Payroll & Compensation Report
  8. Revenue vs Operational Expenses (P&L) Report
  9. IoT Sensor Telemetry & Incident Report
  10. Autonomous Mobile Robot (AMR) Utilization Report
- Filterable tables, summary statistics, and simulated CSV/Print export capabilities.

---

## 🗄️ PostgreSQL Database Schema Alignment

All frontend entities directly correspond to the university Database Systems relational design:
- `USERS`, `DEPARTMENT`, `EMPLOYEE`, `ATTENDANCE_DEVICE`, `ATTENDANCE`, `PAYROLL`
- `PRODUCT`, `WAREHOUSE`, `SHELF`, `INVENTORY`, `STOCK_TRANSACTION`, `SUPPLIER`, `PURCHASE_ORDER`, `PURCHASE_ORDER_ITEM`
- `MACHINE`, `PRODUCTION_ORDER`, `PRODUCTION_LOG`
- `ROBOT`, `ROBOT_TASK`
- `SENSOR`, `SENSOR_DATA`, `ALERT`
- `CUSTOMER`, `INVOICE`, `INVOICE_ITEM`
- `ACCOUNT`, `JOURNAL_ENTRY`, `JOURNAL_ENTRY_LINE`, `EXPENSE`

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Production Build
```bash
npm run build
```

---

## 🔑 Demo Credentials

| Role | Username | Password | Features |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin` | `password123` | Complete ERP system access, CRUD, accounting, and reports |
| **EMPLOYEE** | `operator` | `password123` | Personal dashboard, attendance punch, pay slips, assigned jobs |

*(Quick one-click demo login buttons are also provided on the login page.)*
