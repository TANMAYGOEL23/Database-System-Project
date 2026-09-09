import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { AdminDashboard } from './AdminDashboard';
import { EmployeeDashboard } from './EmployeeDashboard';

export const DashboardRouter: React.FC = () => {
  const { user } = useAuth();

  if (user?.role === 'EMPLOYEE') {
    return <EmployeeDashboard />;
  }

  return <AdminDashboard />;
};
