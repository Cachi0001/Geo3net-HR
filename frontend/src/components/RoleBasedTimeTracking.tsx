import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import TimeTrackingPage from '@/pages/admin/TimeTrackingPage';
import EmployeeTimeTrackingPage from '@/pages/employee/TimeTrackingPage';

const RoleBasedTimeTracking: React.FC = () => {
  const { user } = useAuth();
  
  // Check if user has admin or manager roles
  const isAdminOrManager = user?.role && ['super-admin', 'hr-admin', 'manager'].includes(user.role);
  
  // Render appropriate time tracking page based on role
  if (isAdminOrManager) {
    return <TimeTrackingPage />;
  }
  
  return <EmployeeTimeTrackingPage />;
};

export default RoleBasedTimeTracking;