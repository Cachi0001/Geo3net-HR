import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { SuperAdminDashboard } from './SuperAdminDashboard';
import { HRAdminDashboard } from './HRAdminDashboard';
import { ManagerDashboard } from './ManagerDashboard';
import { EmployeeDashboard } from './EmployeeDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface RoleBasedDashboardProps {
  className?: string;
}

export const RoleBasedDashboard: React.FC<RoleBasedDashboardProps> = ({ className }) => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading dashboard...</span>
      </div>
    );
  }

  // If no user, show authentication required
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
          <Button onClick={() => navigate('/login')} className="mt-4">
            Go to Login
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Render appropriate dashboard based on user role
  const renderDashboard = () => {
    console.log('🎯 RoleBasedDashboard - Rendering dashboard for role:', user.role);
    
    switch (user.role) {
      case 'super-admin':
        console.log('📊 Rendering SuperAdminDashboard');
        return <SuperAdminDashboard />;
      case 'hr-admin':
        console.log('👥 Rendering HRAdminDashboard');
        return <HRAdminDashboard />;
      case 'manager':
        console.log('👔 Rendering ManagerDashboard');
        return <ManagerDashboard />;
      case 'hr-staff':
        console.log('📋 Rendering HRAdminDashboard for hr-staff');
        // For hr-staff, use HRAdminDashboard with limited permissions
        return <HRAdminDashboard />;
      case 'employee':
        console.log('👤 Rendering EmployeeDashboard');
        return <EmployeeDashboard />;
      default:
        console.log('⚠️ Unknown role, rendering EmployeeDashboard as default:', user.role);
        return <EmployeeDashboard />;
    }
  };

  return (
    <div className={className}>
      {renderDashboard()}
    </div>
  );
};

export default RoleBasedDashboard;