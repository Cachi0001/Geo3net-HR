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
        // Fallback data for development
        setDashboardData({
          totalEmployees: 156,
          totalDepartments: 8,
          activeRecruitment: 12,
          monthlyPayroll: "₦2,450,000",
          employeeGrowth: 8,
          departmentGrowth: 2,
          recruitmentFilled: 5,
          payrollGrowth: 12,
          todayAttendance: {
            present: 142,
            absent: 14,
            late: 8,
            earlyCheckouts: 3
          },
          activeLocations: 4,
          systemHealth: {
            uptime: "99.8%",
            activeSessions: 89,
            lastBackup: "2 hours ago"
          }
        });
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
      } else {
        // Fallback attendance data
        setAttendanceMetrics([
          { employeeName: "John Doe", checkInTime: "08:45 AM", location: "Lagos HQ", status: "on_time", hoursWorked: "8h 30m" },
          { employeeName: "Jane Smith", checkInTime: "09:15 AM", location: "Abuja Branch", status: "late", hoursWorked: "7h 45m" },
          { employeeName: "Mike Johnson", checkInTime: "08:30 AM", location: "Remote", status: "on_time", hoursWorked: "8h 15m" },
          { employeeName: "Sarah Wilson", checkInTime: "-", location: "-", status: "absent", hoursWorked: "0h 0m" },
        ]);
      }

      // Load location statistics
      if (locationsResponse.success && locationsResponse.data) {
        setLocationStats(locationsResponse.data.locations || []);
      } else {
        // Fallback location data
        setLocationStats([
          { id: 1, name: "Lagos HQ", address: "Victoria Island, Lagos", activeEmployees: 89, totalCapacity: 120, utilizationRate: 74 },
          { id: 2, name: "Abuja Branch", address: "Wuse 2, Abuja", activeEmployees: 34, totalCapacity: 50, utilizationRate: 68 },
          { id: 3, name: "Port Harcourt", address: "GRA, Port Harcourt", activeEmployees: 19, totalCapacity: 30, utilizationRate: 63 },
          { id: 4, name: "Remote Workers", address: "Various Locations", activeEmployees: 14, totalCapacity: 25, utilizationRate: 56 },
        ]);
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
    { title: 'Location Management', description: 'Configure office locations & geofencing', icon: MapPin, action: () => navigate('/dashboard/settings?tab=locations'), color: 'bg-blue-500' },
    { title: 'Attendance Policies', description: 'Set work hours & attendance rules', icon: Clock, action: () => navigate('/dashboard/settings?tab=attendance'), color: 'bg-green-500' },
    { title: 'System Configuration', description: 'Configure system-wide settings', icon: Settings, action: () => navigate('/dashboard/settings?tab=system'), color: 'bg-purple-500' },
    { title: 'User Management', description: 'Manage user roles and permissions', icon: Shield, action: () => navigate('/dashboard/roles'), color: 'bg-red-500' },
    { title: 'Real-time Monitoring', description: 'Live attendance & system status', icon: Activity, action: () => navigate('/dashboard/analytics?view=realtime'), color: 'bg-orange-500' },
    { title: 'Employee Management', description: 'Manage all employee records', icon: Users, action: () => navigate('/dashboard/employees'), color: 'bg-cyan-500' },
    { title: 'Notifications Center', description: 'Configure alerts & notifications', icon: Bell, action: () => navigate('/dashboard/settings?tab=notifications'), color: 'bg-yellow-500' },
    { title: 'System Reports', description: 'Generate comprehensive reports', icon: BarChart3, action: () => navigate('/dashboard/analytics'), color: 'bg-indigo-500' },
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
          <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
          Super Admin Dashboard
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base">Complete system overview and administrative controls</p>
      </div>

      {/* System Metrics - Mobile First: 2x4 grid, Desktop: 4x2 */}
      <div className="mobile-responsive-grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
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
              className="animate-fade-in"
            />
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card className="bg-gradient-card shadow-xl border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>Administrative shortcuts and system controls</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 gap-3">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Button
                  key={index}
                  variant="outline"
                  className="h-auto p-3 flex flex-col items-center gap-2 hover:bg-primary/5 transition-all duration-200"
                  onClick={action.action}
                >
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${action.color || 'bg-primary'} text-white`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-xs leading-tight">{action.title}</div>
                    <div className="text-xs text-muted-foreground mt-1 hidden sm:block">{action.description}</div>
                  </div>
                </Button>
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
        <Card className="bg-gradient-card shadow-xl border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Real-time Attendance
            </CardTitle>
            <CardDescription>Live employee presence and status monitoring</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border bg-background/50">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{metric.employeeName}</div>
                    <div className="text-xs text-muted-foreground">
                      {metric.location} • {metric.checkInTime}
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <Badge className={`text-xs ${getStatusColor(metric.status)}`}>
                      {metric.status.replace('_', ' ')}
                    </Badge>
                    <div className="text-xs text-muted-foreground">
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
              <BarChart3 className="h-4 w-4 mr-2" />
              View Full Attendance Report
            </Button>
          </CardContent>
        </Card>

        {/* Location Management Overview */}
        <Card className="bg-gradient-card shadow-xl border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Location Overview
            </CardTitle>
            <CardDescription>Office locations and capacity utilization</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {locationStats.map((location) => (
              <div key={location.name} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-sm">{location.name}</span>
                    <p className="text-xs text-muted-foreground">{location.address}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary" className="text-xs">
                      {location.activeEmployees}/{location.totalCapacity}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
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
              <MapPin className="h-4 w-4 mr-2" />
              Manage Locations
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Overview */}
        <Card className="bg-gradient-card shadow-xl border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Department Analytics
            </CardTitle>
            <CardDescription>Employee distribution and growth metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {departmentStats.slice(0, 4).map((dept) => (
              <div key={dept.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{dept.name}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {dept.employees} emp
                    </Badge>
                    <Badge variant={dept.growth > 10 ? 'default' : 'secondary'} className="text-xs">
                      +{dept.growth}%
                    </Badge>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
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
              <Building2 className="h-4 w-4 mr-2" />
              Manage Departments
            </Button>
          </CardContent>
        </Card>

        {/* Enhanced System Alerts & Notifications */}
        <Card className="bg-gradient-card shadow-xl border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              System Alerts & Monitoring
            </CardTitle>
            <CardDescription>Critical notifications and system health alerts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {systemAlerts.map((alert) => (
              <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg border bg-background/50">
                <div className={`h-2 w-2 rounded-full mt-2 ${alert.priority === 'high' ? 'bg-destructive animate-pulse' : alert.priority === 'medium' ? 'bg-warning' : 'bg-primary'}`} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{alert.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{alert.time}</p>
                </div>
                <Badge 
                  variant={alert.priority === 'high' ? 'destructive' : alert.priority === 'medium' ? 'secondary' : 'outline'}
                  className="text-xs"
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
                <Bell className="h-4 w-4 mr-2" />
                Alerts
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/dashboard/security')}
              >
                <Shield className="h-4 w-4 mr-2" />
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