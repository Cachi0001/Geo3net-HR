import React from 'react';
import { Users, Building2, Briefcase, TrendingUp, UserCheck, Clock, AlertTriangle, Shield, Settings, BarChart3 } from 'lucide-react';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import styles from './SuperAdminDashboard.module.css';

export const SuperAdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  const systemMetrics = [
    {
      title: 'Total Employees',
      value: '1,247',
      change: { value: '+12 this month', trend: 'up' as const },
      icon: Users
    },
    {
      title: 'Departments',
      value: '18',
      change: { value: '+2 new', trend: 'up' as const },
      icon: Building2
    },
    {
      title: 'Active Recruitment',
      value: '34',
      change: { value: '8 positions filled', trend: 'up' as const },
      icon: Briefcase
    },
    {
      title: 'Monthly Payroll',
      value: '₦847M',
      change: { value: '+3.2% vs last month', trend: 'up' as const },
      icon: UserCheck
    }
  ];

  const systemAlerts = [
    { id: 1, type: 'critical', message: 'System backup required', time: '2 hours ago', priority: 'high' },
    { id: 2, type: 'warning', message: 'User role permissions need review', time: '4 hours ago', priority: 'medium' },
    { id: 3, type: 'info', message: 'Monthly system report generated', time: '1 day ago', priority: 'low' },
  ];

  const departmentStats = [
    { name: 'Engineering', employees: 324, growth: 12, budget: 85 },
    { name: 'Sales', employees: 189, growth: 8, budget: 92 },
    { name: 'Marketing', employees: 156, growth: 15, budget: 78 },
    { name: 'HR', employees: 45, growth: 3, budget: 95 },
    { name: 'Finance', employees: 67, growth: 5, budget: 88 },
  ];

  const quickActions = [
    { title: 'User Management', description: 'Manage user roles and permissions', icon: Shield, action: () => navigate('/dashboard/roles') },
    { title: 'System Settings', description: 'Configure system preferences', icon: Settings, action: () => navigate('/dashboard/settings') },
    { title: 'Analytics', description: 'View detailed system analytics', icon: BarChart3, action: () => navigate('/dashboard/analytics') },
    { title: 'Employee Management', description: 'Manage all employees', icon: Users, action: () => navigate('/dashboard/employees') },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Shield className="h-8 w-8 text-primary" />
          Super Admin Dashboard
        </h1>
        <p className="text-muted-foreground">Complete system overview and administrative controls</p>
      </div>

      {/* System Metrics - Mobile First: 2x2, Desktop: 4x1 */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
        {systemMetrics.map((metric, index) => {
          const variants = ['primary', 'secondary', 'accent', 'success'] as const;
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Button
                  key={index}
                  variant="outline"
                  className={`h-auto p-4 flex flex-col items-center gap-2 hover:bg-primary/5 transition-all duration-200 ${styles.quickAction}`}
                  onClick={action.action}
                >
                  <Icon className="h-6 w-6 text-primary" />
                  <div className="text-center">
                    <div className="font-medium text-sm">{action.title}</div>
                    <div className="text-xs text-muted-foreground mt-1">{action.description}</div>
                  </div>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Overview */}
        <Card className="bg-gradient-card shadow-xl border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Department Overview
            </CardTitle>
            <CardDescription>Employee count, growth, and budget utilization</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {departmentStats.map((dept) => (
              <div key={dept.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{dept.name}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {dept.employees} employees
                    </Badge>
                    <Badge variant={dept.growth > 10 ? 'default' : 'secondary'} className="text-xs">
                      +{dept.growth}%
                    </Badge>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Budget Utilization</span>
                    <span className="font-medium">{dept.budget}%</span>
                  </div>
                  <Progress value={dept.budget} className="h-2" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* System Alerts */}
        <Card className="bg-gradient-card shadow-xl border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              System Alerts
            </CardTitle>
            <CardDescription>Important system notifications and alerts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {systemAlerts.map((alert) => (
              <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg border bg-background/50">
                <div className={`h-2 w-2 rounded-full mt-2 ${
                  alert.priority === 'high' ? 'bg-destructive' :
                  alert.priority === 'medium' ? 'bg-warning' : 'bg-primary'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{alert.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{alert.time}</p>
                </div>
                <Badge 
                  variant={alert.priority === 'high' ? 'destructive' : 'secondary'}
                  className="text-xs"
                >
                  {alert.priority}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;