import React from 'react';
import { Outlet } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout';
import { useAuth } from '../../hooks/useAuth';

const AdminLayout: React.FC = () => {
  const { user } = useAuth();

  return (
    <DashboardLayout userRole="super-admin" userName={user?.fullName} userEmail={user?.email}>
      <Outlet />
    </DashboardLayout>
  );
};

export default AdminLayout;
