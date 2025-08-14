import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import EmployeeDashboard from '../../components/dashboard/EmployeeDashboard';
import ManagerDashboard from '../../components/dashboard/ManagerDashboard';
import AdminDashboard from '../../components/dashboard/AdminDashboard';
import SuperAdminDashboard from '../../components/dashboard/SuperAdminDashboard';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';
import DashboardLayout from '../../components/dashboard/DashboardLayout/DashboardLayout';

const DashboardPage: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <DashboardLayout>
        <LoadingSpinner />
      </DashboardLayout>
    );
  }

  if (!user) {
    // This case should ideally be handled by a protected route,
    // which would redirect to a login page.
    return (
      <DashboardLayout>
        <div className="p-6 text-center">
          <p className="text-red-500">Error: No user data found. Please try logging in again.</p>
        </div>
      </DashboardLayout>
    );
  }

  const renderDashboardByRole = () => {
    // Based on the roles defined in AUTHENTICATION_GUIDE.md
    switch (user.role) {
      case 'Employee':
        return <EmployeeDashboard />;
      case 'Department Manager':
        return <ManagerDashboard />;
      case 'HR Admin':
      case 'HR Staff': // Assuming HR Staff sees the same dashboard as HR Admin
        return <AdminDashboard />;
      case 'Super Admin':
        return <SuperAdminDashboard />;
      default:
        // A generic view for any other roles that might exist
        return <div className="p-6 bg-white rounded-lg shadow">Welcome, {user.fullName}! Your dashboard is currently being configured.</div>;
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Dashboard</h1>
        <p className="text-gray-600 mb-8">Welcome back, {user.fullName}!</p>
        {renderDashboardByRole()}
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;
