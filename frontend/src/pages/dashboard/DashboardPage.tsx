import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { ModernDashboard } from '../../components/dashboard/ModernDashboard/ModernDashboard';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';
import { DashboardLayout } from '../../components/layout';

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
        <div style={{ padding: '1.5rem', textAlign: 'center' }}>
          <p style={{ color: 'hsl(var(--destructive))' }}>Error: No user data found. Please try logging in again.</p>
        </div>
      </DashboardLayout>
    );
  }



  const getUserRole = () => {
    if (user.email === 'kayode@go3net.com.ng') {
      return 'super-admin';
    }

    const rawRole = (() => {
      const r: any = (user as any)?.role;
      if (typeof r === 'string') return r;
      if (!r || typeof r !== 'object') return '';
      return r.slug || r.name || r.role || r.title || '';
    })();

    // Normalize role names
    const normalizedRole = (rawRole || '')
      .toString()
      .toLowerCase()
      .replace(/[_\s]+/g, '-')
      .trim();

    // Map common role variations
    const roleMap: { [key: string]: string } = {
      'super-admin': 'super-admin',
      'superadmin': 'super-admin',
      'hr-admin': 'hr-admin',
      'hradmin': 'hr-admin',
      'hr-staff': 'hr-staff',
      'hrstaff': 'hr-staff',
      'manager': 'manager',
      'department-manager': 'manager',
      'employee': 'employee'
    };

    return roleMap[normalizedRole] || 'employee';
  };

  const userRole = getUserRole();

  return (
    <DashboardLayout 
      userRole={userRole}
      userName={user.fullName}
      userEmail={user.email}
    >
      <ModernDashboard userRole={userRole} />
    </DashboardLayout>
  );
};

export default DashboardPage;
