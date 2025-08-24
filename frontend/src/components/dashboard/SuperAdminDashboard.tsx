import React, { useState, useEffect } from 'react';
import { Users, Building2, Briefcase, TrendingUp, UserCheck, Clock, AlertTriangle, Shield, Settings, BarChart3, Loader2, MapPin, Activity, Database, Bell, CheckCircle2, UserPlus, FileText } from 'lucide-react';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/services/api';
import TaskProgressMonitor from '@/components/admin/TaskProgressMonitor';
// import styles from './SuperAdminDashboard.module.css';

interface DashboardData {
  totalEmployees: number;
  totalDepartments: number;
  activeRecruitment: number;
  monthlyPayroll: string;
  employeeGrowth: number;
  departmentGrowth: number;
  recruitmentFilled: number;
  payrollGrowth: number;
  // New attendance and location metrics
  todayAttendance: {
    present: number;
    absent: number;
    late: number;
    earlyCheckouts: number;
  };
  activeLocations: number;
  systemHealth: {
    uptime: string;
    activeSessions: number;
    lastBackup: string;
  };
}

interface SystemAlert {
  id: number;
  type: string;
  message: string;
  time: string;
  priority: 'high' | 'medium' | 'low';
}

interface DepartmentStat {
  id: number;
  name: string;
  employees: number;
  growth: number;
  budget: number;
}

interface AttendanceMetric {
  employeeName: string;
  checkInTime: string;
  location: string;
  status: 'on_time' | 'late' | 'absent' | 'early_checkout';
  hoursWorked: string;
}

interface LocationStat {
  id: number;
  name: string;
  address: string;
  activeEmployees: number;
  totalCapacity: number;
  utilizationRate: number;
}

export const SuperAdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([]);
  const [departmentStats, setDepartmentStats] = useState<DepartmentStat[]>([]);
  const [attendanceMetrics, setAttendanceMetrics] = useState<AttendanceMetric[]>([]);
  const [locationStats, setLocationStats] = useState<LocationStat[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load dashboard analytics
      const [dashboardResponse, departmentsResponse, attendanceResponse, locationsResponse] = await Promise.all([
        apiClient.getSuperAdminDashboard(),
        apiClient.getDepartments(),
        (async () => {
          try {
            return await apiClient.getDashboardData?.() || { success: false };
          } catch {
            return { success: false };
          }
        })(),
        apiClient.getLocations?.() || Promise.resolve({ success: false })
      ]);

      if (dashboardResponse.success && dashboardResponse.data) {
        setDashboardData(dashboardResponse.data);
      } else {
        throw new Error('Failed to load dashboard data');
      }

      if (departmentsResponse.success && departmentsResponse.data) {
        const deptStats = departmentsResponse.data.map((dept: any) => ({
          id: dept.id,
          name: dept.name,
          employees: dept.employee_count || 0,
          growth: dept.growth_rate || 0,
          budget: dept.budget_utilization || 0
        }));
        setDepartmentStats(deptStats);
      }

      // Load today's attendance data
      if (attendanceResponse.success && (attendanceResponse as any).data) {
        setAttendanceMetrics((attendanceResponse as any).data?.attendanceRecords || []);
      }

      // Load location statistics
      if (locationsResponse.success && locationsResponse.data) {
        setLocationStats(locationsResponse.data.locations || []);
      }

      // Enhanced system alerts
      setSystemAlerts([
        { id: 1, type: 'critical', message: 'Attendance policy update required', time: '2 hours ago', priority: 'high' },
        { id: 2, type: 'warning', message: '8 employees with location discrepancies', time: '4 hours ago', priority: 'medium' },
        { id: 3, type: 'info', message: 'Weekly attendance report generated', time: '1 day ago', priority: 'low' },
        { id: 4, type: 'warning', message: 'Location geofencing needs review', time: '6 hours ago', priority: 'medium' },
      ]);
    } catch (err: any) {
      console.error('Error loading dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const systemMetrics = dashboardData ? [
    {
      title: 'Total Employees',
      value: dashboardData.totalEmployees.toLocaleString(),
      change: { value: `+${dashboardData.employeeGrowth} this month`, trend: 'up' as const },
      icon: Users
    },
    {
      title: 'Today Present',
      value: dashboardData.todayAttendance.present.toString(),
      change: { value: `${dashboardData.todayAttendance.late} late arrivals`, trend: 'neutral' as const },
      icon: CheckCircle2
    },
    {
      title: 'Active Locations',
      value: dashboardData.activeLocations.toString(),
      change: { value: `${locationStats.reduce((acc, loc) => acc + loc.activeEmployees, 0)} employees active`, trend: 'up' as const },
      icon: MapPin
    },
    {
      title: 'System Health',
      value: dashboardData.systemHealth.uptime,
      change: { value: `${dashboardData.systemHealth.activeSessions} active sessions`, trend: 'up' as const },
      icon: Activity
    },
    {
      title: 'Departments',
      value: dashboardData.totalDepartments.toString(),
      change: { value: `+${dashboardData.departmentGrowth} new`, trend: 'up' as const },
      icon: Building2
    },
    {
      title: 'Active Recruitment',
      value: dashboardData.activeRecruitment.toString(),
      change: { value: `${dashboardData.recruitmentFilled} positions filled`, trend: 'up' as const },
      icon: Briefcase
    },
    {
      title: 'Monthly Payroll',
      value: dashboardData.monthlyPayroll,
      change: { value: `+${dashboardData.payrollGrowth}% vs last month`, trend: 'up' as const },
      icon: UserCheck
    },
    {
      title: 'Absent Today',
      value: dashboardData.todayAttendance.absent.toString(),
      change: { value: `${dashboardData.todayAttendance.earlyCheckouts} early checkouts`, trend: 'down' as const },
      icon: AlertTriangle
    }
  ] : [];

  const quickActions = [
    { title: 'Employee Management', description: 'Manage all employee records', icon: Users, action: () => navigate('/dashboard/employees'), color: 'bg-blue-500' },
    { title: 'System Reports', description: 'View comprehensive analytics', icon: BarChart3, action: () => navigate('/dashboard/reports'), color: 'bg-orange-500' },
    { title: 'Location Management', description: 'Configure office locations', icon: MapPin, action: () => navigate('/dashboard/settings/locations'), color: 'bg-green-500' },
    { title: 'Attendance Policies', description: 'Set work hours & rules', icon: Clock, action: () => navigate('/dashboard/settings/attendance'), color: 'bg-purple-500' },
    { title: 'Add New Employee', description: 'Onboard new team members', icon: UserPlus, action: () => navigate('/dashboard/employees/add'), color: 'bg-cyan-500' },
    { title: 'Role Management', description: 'Manage user roles and permissions', icon: Shield, action: () => navigate('/dashboard/roles'), color: 'bg-red-500' },
    { title: 'Time Tracking', description: 'Monitor attendance & hours', icon: Activity, action: () => navigate('/dashboard/time-tracking'), color: 'bg-indigo-500' },
    { title: 'System Settings', description: 'Configure system-wide settings', icon: Settings, action: () => navigate('/dashboard/settings'), color: 'bg-yellow-500' },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Super Admin Dashboard
          </h1>
          <p className="text-muted-foreground">Complete system overview and administrative controls</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading dashboard data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Super Admin Dashboard
          </h1>
          <p className="text-muted-foreground">Complete system overview and administrative controls</p>
        </div>
        <Card className="bg-destructive/10 border-destructive/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">Error loading dashboard data</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">{error}</p>
            <Button 
              onClick={loadDashboardData} 
              variant="outline" 
              size="sm" 
              className="mt-4"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="mobile-text-xl font-bold text-foreground flex items-center gap-2">
          <Shield className="mobile-icon-lg text-primary" />
          Super Admin Dashboard
        </h1>
        <p className="text-muted-foreground mobile-text-sm">Complete system overview and administrative controls</p>
      </div>

      {/* System Metrics - Mobile First: 2x4 grid, Desktop: 4x2 */}
      <div className="mobile-responsive-grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4">
        {systemMetrics.map((metric, index) => {
          const variants = ['primary', 'secondary', 'accent', 'success', 'warning', 'info', 'destructive', 'outline'] as const;
          return (
            <MetricCard
              key={index}
              title={metric.title}
              value={metric.value}
              change={metric.change}
              icon={metric.icon}
              variant={(['primary', 'secondary', 'accent', 'success', 'warning', 'info'] as const)[index % 6]}
              className="animate-fade-in mobile-card"
            />
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card className="mobile-card bg-gradient-card shadow-xl border-0">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 mobile-text-lg">
            <Settings className="mobile-icon" />
            Quick Actions
          </CardTitle>
          <CardDescription className="mobile-text-sm">Administrative shortcuts and system controls</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mobile-responsive-grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <div
                  key={index}
                  className="quick-action-card cursor-pointer"
                  onClick={action.action}
                >
                  <div className={`h-6 w-6 sm:h-8 sm:w-8 rounded-lg flex items-center justify-center ${action.color || 'bg-primary'} text-white mb-2`}>
                    <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
                  </div>
                  <div className="text-center">
                    <div className="font-medium mobile-text-xs leading-tight">{action.title}</div>
                    <div className="mobile-text-xs text-muted-foreground mt-1 hide-on-mobile">{action.description}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Task Progress Monitor */}
      <TaskProgressMonitor />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Real-time Attendance Monitoring */}
        <Card className="mobile-card bg-gradient-card shadow-xl border-0">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 mobile-text-lg">
              <Activity className="mobile-icon" />
              Real-time Attendance
            </CardTitle>
            <CardDescription className="mobile-text-sm">Live employee presence and status monitoring</CardDescription>
          </CardHeader>
          <CardContent className="mobile-space-y-4">
            {attendanceMetrics.map((metric, index) => {
              const getStatusColor = (status: string) => {
                switch (status) {
                  case 'on_time': return 'bg-green-100 text-green-800 border-green-200';
                  case 'late': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
                  case 'absent': return 'bg-red-100 text-red-800 border-red-200';
                  case 'early_checkout': return 'bg-orange-100 text-orange-800 border-orange-200';
                  default: return 'bg-gray-100 text-gray-800 border-gray-200';
                }
              };
              
              return (
                <div key={index} className="mobile-card flex items-center justify-between p-2 sm:p-3 rounded-lg border bg-background/50">
                  <div className="flex-1">
                    <div className="font-medium mobile-text-sm">{metric.employeeName}</div>
                    <div className="mobile-text-xs text-muted-foreground">
                      {metric.location} • {metric.checkInTime}
                    </div>
                  </div>
                  <div className="text-right mobile-space-y-1">
                    <Badge className={`mobile-text-xs ${getStatusColor(metric.status)}`}>
                      {metric.status.replace('_', ' ')}
                    </Badge>
                    <div className="mobile-text-xs text-muted-foreground">
                      {metric.hoursWorked}
                    </div>
                  </div>
                </div>
              );
            })}
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full mt-4"
              onClick={() => navigate('/dashboard/analytics?view=attendance')}
            >
              <BarChart3 className="mobile-icon mr-2" />
              View Full Attendance Report
            </Button>
          </CardContent>
        </Card>

        {/* Location Management Overview */}
        <Card className="mobile-card bg-gradient-card shadow-xl border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 mobile-text-lg">
              <MapPin className="mobile-icon" />
              Location Overview
            </CardTitle>
            <CardDescription className="mobile-text-sm">Office locations and capacity utilization</CardDescription>
          </CardHeader>
          <CardContent className="mobile-space-y-4">
            {locationStats.map((location) => (
              <div key={location.name} className="mobile-space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium mobile-text-sm">{location.name}</span>
                    <p className="mobile-text-xs text-muted-foreground">{location.address}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary" className="mobile-text-xs">
                      {location.activeEmployees}/{location.totalCapacity}
                    </Badge>
                  </div>
                </div>
                <div className="mobile-space-y-1">
                  <div className="flex justify-between mobile-text-xs">
                    <span className="text-muted-foreground">Utilization Rate</span>
                    <span className="font-medium">{location.utilizationRate}%</span>
                  </div>
                  <Progress value={location.utilizationRate} className="h-2" />
                </div>
              </div>
            ))}
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full mt-4"
              onClick={() => navigate('/dashboard/settings?tab=locations')}
            >
              <MapPin className="mobile-icon mr-2" />
              Manage Locations
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Overview */}
        <Card className="mobile-card bg-gradient-card shadow-xl border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 mobile-text-lg">
              <TrendingUp className="mobile-icon" />
              Department Analytics
            </CardTitle>
            <CardDescription className="mobile-text-sm">Employee distribution and growth metrics</CardDescription>
          </CardHeader>
          <CardContent className="mobile-space-y-4">
            {departmentStats.slice(0, 4).map((dept) => (
              <div key={dept.name} className="mobile-space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium mobile-text-sm">{dept.name}</span>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Badge variant="secondary" className="mobile-text-xs">
                      {dept.employees} emp
                    </Badge>
                    <Badge variant={dept.growth > 10 ? 'default' : 'secondary'} className="mobile-text-xs">
                      +{dept.growth}%
                    </Badge>
                  </div>
                </div>
                <div className="mobile-space-y-1">
                  <div className="flex justify-between mobile-text-xs">
                    <span className="text-muted-foreground">Budget Usage</span>
                    <span className="font-medium">{dept.budget}%</span>
                  </div>
                  <Progress value={dept.budget} className="h-2" />
                </div>
              </div>
            ))}
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full mt-4"
              onClick={() => navigate('/dashboard/departments')}
            >
              <Building2 className="mobile-icon mr-2" />
              Manage Departments
            </Button>
          </CardContent>
        </Card>

        {/* Enhanced System Alerts & Notifications */}
        <Card className="mobile-card bg-gradient-card shadow-xl border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 mobile-text-lg">
              <AlertTriangle className="mobile-icon" />
              System Alerts & Monitoring
            </CardTitle>
            <CardDescription className="mobile-text-sm">Critical notifications and system health alerts</CardDescription>
          </CardHeader>
          <CardContent className="mobile-space-y-4">
            {systemAlerts.map((alert) => (
              <div key={alert.id} className="mobile-card flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border bg-background/50">
                <div className={`h-2 w-2 rounded-full mt-2 ${alert.priority === 'high' ? 'bg-destructive animate-pulse' : alert.priority === 'medium' ? 'bg-warning' : 'bg-primary'}`} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium mobile-text-sm">{alert.message}</p>
                  <p className="mobile-text-xs text-muted-foreground mt-1">{alert.time}</p>
                </div>
                <Badge 
                  variant={alert.priority === 'high' ? 'destructive' : alert.priority === 'medium' ? 'secondary' : 'outline'}
                  className="mobile-text-xs"
                >
                  {alert.priority}
                </Badge>
              </div>
            ))}
            <div className="grid grid-cols-2 gap-2 mt-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/dashboard/settings?tab=notifications')}
              >
                <Bell className="mobile-icon mr-2" />
                Alerts
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/dashboard/security')}
              >
                <Shield className="mobile-icon mr-2" />
                Security
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;