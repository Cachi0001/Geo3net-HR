import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Building2, Briefcase, TrendingUp, UserCheck, Clock, AlertTriangle, Loader2 } from 'lucide-react';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { dashboardApi, type DashboardMetrics, type DepartmentStats, type RecentActivity } from '@/services/dashboardApi';
import { useToast } from '@/hooks/use-toast';
import styles from './Dashboard.module.css';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [departmentStats, setDepartmentStats] = useState<DepartmentStats[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await dashboardApi.getDashboardData();
      setMetrics(data.metrics);
      setDepartmentStats(data.departmentStats);
      setRecentActivities(data.recentActivities);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data. Please try again.',
        variant: 'destructive'
      });
      // Set fallback data
      setMetrics({
        totalEmployees: 1247,
        presentToday: 1156,
        lateArrivals: 23,
        onLeave: 68,
        absentToday: 91
      });
      setDepartmentStats([
        { department: 'Engineering', employees: 324, present: 298, absent: 26, performance: 92 },
        { department: 'Sales', employees: 189, present: 175, absent: 14, performance: 88 },
        { department: 'Marketing', employees: 156, present: 142, absent: 14, performance: 91 },
        { department: 'HR', employees: 45, present: 43, absent: 2, performance: 95 },
        { department: 'Finance', employees: 67, present: 61, absent: 6, performance: 89 }
      ]);
      setRecentActivities([
        { id: '1', type: 'check-in', description: 'John Doe checked in', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), user: 'John Doe' },
        { id: '2', type: 'leave-request', description: 'Sarah Wilson submitted leave request', timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), user: 'Sarah Wilson' },
        { id: '3', type: 'task-completed', description: 'Mike Johnson completed project milestone', timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), user: 'Mike Johnson' },
        { id: '4', type: 'system-alert', description: 'Attendance review required for 5 employees', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() }
      ]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const getMetricCards = () => {
    if (!metrics) return [];
    
    return [
      {
        title: 'Total Employees',
        value: metrics.totalEmployees.toLocaleString(),
        change: { value: '+12 this month', trend: 'up' as const },
        icon: Users
      },
      {
        title: 'Present Today',
        value: metrics.presentToday.toLocaleString(),
        change: { value: `${((metrics.presentToday / metrics.totalEmployees) * 100).toFixed(1)}% attendance`, trend: 'up' as const },
        icon: UserCheck
      },
      {
        title: 'Late Arrivals',
        value: metrics.lateArrivals.toString(),
        change: { value: '-5 vs yesterday', trend: 'down' as const },
        icon: Clock
      },
      {
        title: 'On Leave',
        value: metrics.onLeave.toString(),
        change: { value: '+3 this week', trend: 'up' as const },
        icon: Briefcase
      }
    ];
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'add-employee':
        navigate('/admin/employees/new');
        break;
      case 'post-job':
        navigate('/admin/recruitment/new');
        break;
      case 'process-payroll':
        navigate('/admin/payroll');
        break;
      case 'manage-departments':
        navigate('/admin/departments');
        break;
      default:
        toast({
          title: 'Feature Coming Soon',
          description: `${action} feature will be available soon.`,
        });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className={`${styles.dashboard} space-y-6`}>
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-foreground">Dashboard Overview</h1>
        <p className="text-muted-foreground">Welcome back! Here's what's happening at Go3net today.</p>
      </div>

      {/* Metrics Grid - Mobile First: 2x2, Tablet: 2x2, Desktop: 4x1 */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
        {getMetricCards().map((metric, index) => {
          const variants = ['primary', 'secondary', 'accent', 'success', 'warning', 'info'] as const;
          return (
            <MetricCard
              key={index}
              title={metric.title}
              value={metric.value}
              change={metric.change}
              icon={metric.icon}
              variant={variants[index % variants.length]}
              className="animate-fade-in"
            />
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Performance */}
        <Card className="bg-gradient-card shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="h-8 w-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
              Department Performance
            </CardTitle>
            <CardDescription className="text-muted-foreground">Employee count and growth by department</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {departmentStats.map((dept) => (
              <div key={dept.department} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-foreground">{dept.department}</span>
                    <span className="text-sm text-muted-foreground">{dept.employees} employees</span>
                  </div>
                  <Progress value={dept.performance} className="h-2" />
                </div>
                <Badge variant="outline" className="ml-4 text-success border-success">
                  {dept.performance}%
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-gradient-card shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="h-8 w-8 bg-gradient-secondary rounded-lg flex items-center justify-center">
                <Clock className="h-4 w-4 text-white" />
              </div>
              Recent Activity
            </CardTitle>
            <CardDescription className="text-muted-foreground">Latest updates and system events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => {
                const timeAgo = new Date(activity.timestamp).toLocaleString();
                const activityStatus = activity.type === 'system-alert' ? 'warning' : 
                                     activity.type === 'check-in' ? 'success' : 'info';
                
                return (
                  <div key={activity.id} className="flex items-start gap-3 pb-4 border-b border-border/50 last:border-b-0">
                    <div className={`h-3 w-3 rounded-full mt-1.5 shadow-sm ${
                      activityStatus === 'success' ? 'bg-gradient-to-r from-green-400 to-green-600' :
                      activityStatus === 'warning' ? 'bg-gradient-to-r from-orange-400 to-orange-600' : 
                      'bg-gradient-to-r from-blue-400 to-blue-600'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm text-foreground">{activity.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">{timeAgo}</p>
                      {activity.user && (
                        <p className="text-xs text-muted-foreground">by {activity.user}</p>
                      )}
                    </div>
                    {activityStatus === 'warning' && (
                      <AlertTriangle className="h-4 w-4 text-warning" />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Frequently used administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div 
              className={`${styles.quickAction} p-4 rounded-lg border border-border hover:shadow-md transition-shadow cursor-pointer`}
              onClick={() => handleQuickAction('add-employee')}
            >
              <UserCheck className="h-8 w-8 text-primary mb-2" />
              <p className="font-medium">Add Employee</p>
              <p className="text-sm text-muted-foreground">Create new employee record</p>
            </div>
            <div 
              className={`${styles.quickAction} p-4 rounded-lg border border-border hover:shadow-md transition-shadow cursor-pointer`}
              onClick={() => handleQuickAction('post-job')}
            >
              <Briefcase className="h-8 w-8 text-primary mb-2" />
              <p className="font-medium">Post Job</p>
              <p className="text-sm text-muted-foreground">Create new job posting</p>
            </div>
            <div 
              className={`${styles.quickAction} p-4 rounded-lg border border-border hover:shadow-md transition-shadow cursor-pointer`}
              onClick={() => handleQuickAction('process-payroll')}
            >
              <UserCheck className="h-8 w-8 text-primary mb-2" />
              <p className="font-medium">Process Payroll</p>
              <p className="text-sm text-muted-foreground">Run monthly payroll</p>
            </div>
            <div 
              className={`${styles.quickAction} p-4 rounded-lg border border-border hover:shadow-md transition-shadow cursor-pointer`}
              onClick={() => handleQuickAction('manage-departments')}
            >
              <Building2 className="h-8 w-8 text-primary mb-2" />
              <p className="font-medium">Manage Departments</p>
              <p className="text-sm text-muted-foreground">Edit department structure</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;