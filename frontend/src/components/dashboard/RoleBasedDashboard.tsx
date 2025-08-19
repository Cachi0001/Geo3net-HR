import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { SuperAdminDashboard } from './SuperAdminDashboard';
import { HRAdminDashboard } from './HRAdminDashboard';
import { ManagerDashboard } from './ManagerDashboard';
import { HRStaffDashboard } from './HRStaffDashboard';
import { EmployeeDashboard } from './EmployeeDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

interface RoleBasedDashboardProps {
  className?: string;
}

export const RoleBasedDashboard: React.FC<RoleBasedDashboardProps> = ({ className }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <Card className="max-w-md mx-auto mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Authentication Required
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Please log in to access your dashboard.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Role-based dashboard rendering
  const renderDashboard = () => {
    switch (user.role) {
      case 'super-admin':
        return <SuperAdminDashboard />;
      case 'hr-admin':
        return <HRAdminDashboard />;
      case 'manager':
        return <ManagerDashboard />;
      case 'hr-staff':
        return <HRStaffDashboard />;
      case 'employee':
        return <EmployeeDashboard />;
      default:
        return (
          <Card className="max-w-md mx-auto mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Unknown Role
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Your role '{user.role}' is not recognized. Please contact your administrator.
              </p>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className={className}>
      {renderDashboard()}
    </div>
  );
};

export default RoleBasedDashboard;