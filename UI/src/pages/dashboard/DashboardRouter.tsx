import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { AdminDashboard } from './AdminDashboard';
import { EmployeeDashboard } from './EmployeeDashboard';

export const DashboardRouter: React.FC = () => {
  const { isAdmin } = useAuth();
  return isAdmin ? <AdminDashboard /> : <EmployeeDashboard />;
};
