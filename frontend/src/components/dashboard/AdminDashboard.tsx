import React, { useState, useEffect } from 'react';
import { employeeService, Employee, EmployeeStatistics } from '../../services/employee.service';
import { useAuth } from '../../hooks/useAuth';
import MainDashboardContainer from './MainDashboardContainer/MainDashboardContainer';
import HeaderBar from './HeaderBar/HeaderBar';
import StatisticsRow from './StatisticsRow/StatisticsRow';
import ChartCard from './widgets/ChartCard/ChartCard';
import RecentHiresWidget from './widgets/RecentHiresWidget';
import AdminActionsWidget from './widgets/AdminActionsWidget';
import EmployeeTable from '../employees/EmployeeTable';
import './AdminDashboard.css';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<EmployeeStatistics | null>(null);
  const [recentHires, setRecentHires] = useState<Employee[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [statsLoading, setStatsLoading] = useState(true);
  const [hiresLoading, setHiresLoading] = useState(true);
  const [employeesLoading, setEmployeesLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Initial stats and recent hires
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
        setRecentHires(hiresData.employees || hiresData);
      } catch (error) {
        console.error('Failed to load recent hires for admin dashboard', error);
      } finally {
        setHiresLoading(false);
      }
    };

    fetchStats();
    fetchRecentHires();
  }, []);

  // Employees list reacts to search
  useEffect(() => {
    let cancelled = false;
    const fetchEmployees = async () => {
      setEmployeesLoading(true);
      try {
        const res = await employeeService.getEmployees(10, 0, search);
        if (!cancelled) {
          setEmployees(res.employees || []);
          setTotalEmployees(res.total || res.employees?.length || 0);
        }
      } catch (error) {
        if (!cancelled) console.error('Failed to load employees for admin dashboard', error);
      } finally {
        if (!cancelled) setEmployeesLoading(false);
      }
    };
    fetchEmployees();
    return () => { cancelled = true };
  }, [search]);

  const handleExport = async () => {
    try {
      const res = await employeeService.getEmployees(1000, 0, search);
      const rows = res.employees || [];
      const header = ['Full Name','Email','Department','Position'];
      const csv = [header.join(','), ...rows.map(r => [r.fullName, r.email, r.department, r.position].map(v => `"${(v||'').replace(/"/g,'""')}"`).join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'employees.csv'; a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export failed', e);
    }
  };

  const chartData = [
    { month: 'Jan', income: 6500, expense: 3280 },
    { month: 'Feb', income: 7200, expense: 4100 },
    { month: 'Mar', income: 8100, expense: 3900 },
    { month: 'Apr', income: 9400, expense: 5200 },
    { month: 'May', income: 8800, expense: 4700 },
    { month: 'Jun', income: 10200, expense: 5600 },
  ];

  const performanceData = [
    { name: 'Hazel', rating: 32 },
    { name: 'Simon', rating: 28 },
    { name: 'Aida', rating: 26 },
    { name: 'Peg', rating: 22 },
    { name: 'Barb', rating: 24 },
  ];

  return (
    <MainDashboardContainer
      header={<HeaderBar title="Admin Dashboard" userName={user?.fullName} onSearch={setSearch} onExport={handleExport} />}
      stats={<StatisticsRow stats={stats} isLoading={statsLoading} />}
      charts={
        <div className="admin-dashboard__charts">
          <ChartCard title="Income vs Expense" type="line" data={chartData} dataKeyX="month" dataKeyY={["income","expense"]} />
          <ChartCard title="Performance Ratings" type="bar" data={performanceData} dataKeyX="name" dataKeyY={["rating"]} />
        </div>
      }
      main={
        <div>
          {/* Simple count label */}
          <div className="admin-dashboard__count">Employees: {totalEmployees}</div>
          {employeesLoading ? (
            <div className="glass" style={{ padding: 16 }}>Loading employees...</div>
          ) : (
            <EmployeeTable employees={employees} onEdit={(e)=>console.log('edit', e)} onDelete={(e)=>console.log('delete', e)} />
          )}
        </div>
      }
      sidebar={
        <div className="admin-dashboard__sidebar-stack">
          <AdminActionsWidget />
          <RecentHiresWidget hires={recentHires} isLoading={hiresLoading} />
        </div>
      }
    />
  );
};

export default AdminDashboard;
