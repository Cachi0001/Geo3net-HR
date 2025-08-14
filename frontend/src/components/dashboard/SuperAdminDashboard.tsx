import React, { useState, useEffect } from 'react';
import { employeeService, Employee, EmployeeStatistics } from '../../services/employee.service';
import CompanyStatsWidget from './widgets/CompanyStatsWidget';
import RecentHiresWidget from './widgets/RecentHiresWidget';
import AdminActionsWidget from './widgets/AdminActionsWidget';
import SystemStatusWidget from './widgets/SystemStatusWidget';
import './SuperAdminDashboard.css';

const SuperAdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<EmployeeStatistics | null>(null);
  const [recentHires, setRecentHires] = useState<Employee[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [hiresLoading, setHiresLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const statsData = await employeeService.getEmployeeStatistics();
        setStats(statsData);
      } catch (error) {
        console.error('Failed to load employee statistics for admin dashboard', error);
      } finally {
        setStatsLoading(false);
      }
    };

    const fetchRecentHires = async () => {
      try {
        const hiresData = await employeeService.getEmployees(5);
        setRecentHires(hiresData);
      } catch (error) {
        console.error('Failed to load recent hires for admin dashboard', error);
      } finally {
        setHiresLoading(false);
      }
    };

    fetchStats();
    fetchRecentHires();
  }, []);

  return (
    <div className="super-admin-dashboard">
      {/* Main content area */}
      <div className="super-admin-dashboard__main">
        <CompanyStatsWidget stats={stats} isLoading={statsLoading} />
        <RecentHiresWidget hires={recentHires} isLoading={hiresLoading} />
      </div>

      {/* Sidebar area */}
      <div className="super-admin-dashboard__sidebar">
        <AdminActionsWidget />
        <SystemStatusWidget isLoading={false} />
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
