import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { MainLayout } from '../components/layout/MainLayout';
import { Login } from '../pages/auth/Login';
import { Unauthorized } from '../pages/auth/Unauthorized';
import { NotFound } from '../pages/auth/NotFound';
import { DashboardRouter } from '../pages/dashboard/DashboardRouter';

// HR
import { Employees } from '../pages/hr/Employees';
import { Departments } from '../pages/hr/Departments';
import { Attendance } from '../pages/hr/Attendance';
import { PayrollPage } from '../pages/hr/Payroll';

// Inventory
import { Products } from '../pages/inventory/Products';
import { StockMatrix } from '../pages/inventory/StockMatrix';
import { Warehouses } from '../pages/inventory/Warehouses';
import { Shelves } from '../pages/inventory/Shelves';
import { Suppliers } from '../pages/inventory/Suppliers';
import { PurchaseOrders } from '../pages/inventory/PurchaseOrders';
import { StockTransactions } from '../pages/inventory/StockTransactions';

// Production
import { Machines } from '../pages/production/Machines';
import { ProductionOrders } from '../pages/production/ProductionOrders';
import { ProductionLogsPage } from '../pages/production/ProductionLogs';

// Warehouse / Robotics
import { Robots } from '../pages/warehouse/Robots';
import { RobotTasks } from '../pages/warehouse/RobotTasks';

// IoT
import { Sensors } from '../pages/iot/Sensors';
import { SensorDataPage } from '../pages/iot/SensorDataPage';
import { Alerts } from '../pages/iot/Alerts';

// Sales
import { Customers } from '../pages/sales/Customers';
import { Invoices } from '../pages/sales/Invoices';

// Accounting
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

      {/* Protected Routes inside Shell */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          {/* Default Redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Shared Dynamic Role Dashboard */}
          <Route path="/dashboard" element={<DashboardRouter />} />

          {/* Employee Workspace Routes */}
          <Route path="/employee/attendance" element={<Attendance />} />
          <Route path="/employee/payroll" element={<PayrollPage />} />
          <Route path="/employee/production-tasks" element={<ProductionOrders />} />
          <Route path="/employee/robot-tasks" element={<RobotTasks />} />
          <Route path="/employee/alerts" element={<Alerts />} />

          {/* Admin Role-Guarded ERP Routes */}
          <Route element={<ProtectedRoute requiredRole="ADMIN" />}>
            {/* HR */}
            <Route path="/hr/employees" element={<Employees />} />
            <Route path="/hr/departments" element={<Departments />} />
            <Route path="/hr/attendance" element={<Attendance />} />
            <Route path="/hr/payroll" element={<PayrollPage />} />

            {/* Inventory */}
            <Route path="/inventory/products" element={<Products />} />
            <Route path="/inventory/stock" element={<StockMatrix />} />
            <Route path="/inventory/warehouses" element={<Warehouses />} />
            <Route path="/inventory/shelves" element={<Shelves />} />
            <Route path="/inventory/suppliers" element={<Suppliers />} />
            <Route path="/inventory/purchase-orders" element={<PurchaseOrders />} />
            <Route path="/inventory/transactions" element={<StockTransactions />} />

            {/* Production */}
            <Route path="/production/machines" element={<Machines />} />
            <Route path="/production/orders" element={<ProductionOrders />} />
            <Route path="/production/logs" element={<ProductionLogsPage />} />

            {/* Robotics */}
            <Route path="/warehouse/robots" element={<Robots />} />
            <Route path="/warehouse/robot-tasks" element={<RobotTasks />} />

            {/* IoT */}
            <Route path="/iot/sensors" element={<Sensors />} />
            <Route path="/iot/data" element={<SensorDataPage />} />
            <Route path="/iot/alerts" element={<Alerts />} />

            {/* Sales */}
            <Route path="/sales/customers" element={<Customers />} />
            <Route path="/sales/invoices" element={<Invoices />} />

            {/* Accounting */}
            <Route path="/accounting/accounts" element={<Accounts />} />
            <Route path="/accounting/journal-entries" element={<JournalEntries />} />
            <Route path="/accounting/expenses" element={<Expenses />} />

            {/* Reports */}
            <Route path="/reports" element={<ReportsHub />} />
          </Route>
        </Route>
      </Route>

      {/* 404 Wildcard */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};
