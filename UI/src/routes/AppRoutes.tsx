import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { MainLayout } from '../components/layout/MainLayout';

// Auth Pages
import { Login } from '../pages/auth/Login';
import { Unauthorized } from '../pages/auth/Unauthorized';
import { NotFound } from '../pages/auth/NotFound';

// Dashboards
import { DashboardRouter } from '../pages/dashboard/DashboardRouter';

// HR
import { Employees } from '../pages/hr/Employees';
import { Departments } from '../pages/hr/Departments';
import { Attendance } from '../pages/hr/Attendance';
import { PayrollPage as Payroll } from '../pages/hr/Payroll';

// Inventory & Supply Chain
import { Products } from '../pages/inventory/Products';
import { StockMatrix } from '../pages/inventory/StockMatrix';
import { Warehouses } from '../pages/inventory/Warehouses';
import { Shelves } from '../pages/inventory/Shelves';
import { Suppliers } from '../pages/inventory/Suppliers';
import { PurchaseOrders } from '../pages/inventory/PurchaseOrders';
import { StockTransactions } from '../pages/inventory/StockTransactions';

// Manufacturing / Production
import { Machines } from '../pages/production/Machines';
import { ProductionOrders } from '../pages/production/ProductionOrders';
import { ProductionLogs } from '../pages/production/ProductionLogs';

// Robotics / Warehouse
import { Robots } from '../pages/warehouse/Robots';
import { RobotTasks } from '../pages/warehouse/RobotTasks';

// IoT & Telemetry
import { Sensors } from '../pages/iot/Sensors';
import { SensorDataPage } from '../pages/iot/SensorDataPage';
import { Alerts } from '../pages/iot/Alerts';

// Sales & Commercial
import { Customers } from '../pages/sales/Customers';
import { Invoices } from '../pages/sales/Invoices';

// Accounting & GL
import { Accounts } from '../pages/accounting/Accounts';
import { JournalEntries } from '../pages/accounting/JournalEntries';
import { Expenses } from '../pages/accounting/Expenses';

// Reports
import { ReportsHub } from '../pages/reports/ReportsHub';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Authenticated Application Shell */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          {/* Universal Dashboard Router */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardRouter />} />

          {/* Admin Protected HR */}
          <Route path="/hr/employees" element={<Employees />} />
          <Route path="/hr/departments" element={<Departments />} />
          <Route path="/hr/attendance" element={<Attendance />} />
          <Route path="/hr/payroll" element={<Payroll />} />

          {/* Admin Protected Inventory */}
          <Route path="/inventory/products" element={<Products />} />
          <Route path="/inventory/stock" element={<StockMatrix />} />
          <Route path="/inventory/warehouses" element={<Warehouses />} />
          <Route path="/inventory/shelves" element={<Shelves />} />
          <Route path="/inventory/suppliers" element={<Suppliers />} />
          <Route path="/inventory/purchase-orders" element={<PurchaseOrders />} />
          <Route path="/inventory/transactions" element={<StockTransactions />} />

          {/* Manufacturing */}
          <Route path="/production/machines" element={<Machines />} />
          <Route path="/production/orders" element={<ProductionOrders />} />
          <Route path="/production/logs" element={<ProductionLogs />} />

          {/* Warehouse Robotics */}
          <Route path="/warehouse/robots" element={<Robots />} />
          <Route path="/warehouse/robot-tasks" element={<RobotTasks />} />

          {/* IoT Telemetry */}
          <Route path="/iot/sensors" element={<Sensors />} />
          <Route path="/iot/data" element={<SensorDataPage />} />
          <Route path="/iot/alerts" element={<Alerts />} />

          {/* Sales & Commercial */}
          <Route path="/sales/customers" element={<Customers />} />
          <Route path="/sales/invoices" element={<Invoices />} />

          {/* Finance & GL */}
          <Route path="/accounting/accounts" element={<Accounts />} />
          <Route path="/accounting/journal-entries" element={<JournalEntries />} />
          <Route path="/accounting/expenses" element={<Expenses />} />

          {/* BI Analytics & Reports */}
          <Route path="/reports" element={<ReportsHub />} />

          {/* Employee Specialized Shortcuts */}
          <Route path="/employee/attendance" element={<Attendance />} />
          <Route path="/employee/payroll" element={<Payroll />} />
          <Route path="/employee/production-tasks" element={<ProductionOrders />} />
          <Route path="/employee/robot-tasks" element={<RobotTasks />} />
          <Route path="/employee/alerts" element={<Alerts />} />
        </Route>
      </Route>

      {/* 404 Catch-All */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};
