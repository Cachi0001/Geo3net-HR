import React from 'react';
import { Users, UserPlus, Calendar, FileText, Clock, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export const HRStaffDashboard: React.FC = () => {
  const navigate = useNavigate();

  const hrMetrics = [
    {
      title: 'Active Employees',
      value: '247',
      change: { value: '+12 this month', trend: 'up' as const },
      icon: Users
    },
    {
      title: 'Pending Requests',
      value: '23',
      change: { value: '8 leave requests', trend: 'neutral' as const },
      icon: Clock
    },
    {
      title: 'New Hires',
      value: '8',
      change: { value: '+3 this week', trend: 'up' as const },
      icon: UserPlus
    },
    {
      title: 'Documents Processed',
      value: '156',
      change: { value: '42 this week', trend: 'up' as const },
      icon: FileText
    }
  ];

  const pendingRequests = [
    { id: 1, employee: 'John Smith', type: 'Annual Leave', duration: '5 days', date: 'Mar 20-24', priority: 'medium', department: 'Engineering' },
    { id: 2, employee: 'Sarah Johnson', type: 'Sick Leave', duration: '2 days', date: 'Mar 15-16', priority: 'high', department: 'Design' },
    { id: 3, employee: 'Mike Chen', type: 'Personal Leave', duration: '1 day', date: 'Mar 18', priority: 'low', department: 'Engineering' },
    { id: 4, employee: 'Emily Davis', type: 'Maternity Leave', duration: '90 days', date: 'Apr 1 - Jun 30', priority: 'high', department: 'QA' },
  ];

  const recentHires = [
    { id: 1, name: 'Alex Rodriguez', position: 'Software Engineer', department: 'Engineering', startDate: '2024-03-10', status: 'onboarding' },
    { id: 2, name: 'Lisa Wang', position: 'Product Designer', department: 'Design', startDate: '2024-03-08', status: 'completed' },
    { id: 3, name: 'David Kim', position: 'Data Analyst', department: 'Analytics', startDate: '2024-03-12', status: 'pending' },
  ];

  const upcomingTasks = [
    { id: 1, task: 'Conduct exit interview - Mark Thompson', dueDate: '2024-03-15', priority: 'high', type: 'interview' },
    { id: 2, task: 'Process payroll for March', dueDate: '2024-03-25', priority: 'high', type: 'payroll' },
    { id: 3, task: 'Update employee handbook', dueDate: '2024-03-30', priority: 'medium', type: 'documentation' },
    { id: 4, task: 'Schedule performance reviews', dueDate: '2024-04-01', priority: 'medium', type: 'review' },
  ];

  const departmentStats = [
    { name: 'Engineering', employees: 85, attendance: 94, satisfaction: 88 },
    { name: 'Design', employees: 24, attendance: 96, satisfaction: 92 },
    { name: 'Marketing', employees: 32, attendance: 91, satisfaction: 85 },
    { name: 'Sales', employees: 45, attendance: 89, satisfaction: 87 },
  ];

  const quickActions = [
    { title: 'Add Employee', description: 'Register new hire', icon: UserPlus, action: () => navigate('/dashboard/employees/add') },
    { title: 'Process Requests', description: 'Review leave requests', icon: CheckCircle, action: () => navigate('/dashboard/requests') },
    { title: 'Generate Reports', description: 'HR analytics reports', icon: TrendingUp, action: () => navigate('/dashboard/reports') },
    { title: 'Schedule Interview', description: 'Book candidate meetings', icon: Calendar, action: () => navigate('/dashboard/interviews') },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Users className="h-8 w-8 text-primary" />
          HR Staff Dashboard
        </h1>
        <p className="text-muted-foreground">Employee management and HR operations</p>
      </div>

      {/* HR Metrics - Mobile First: 2x2, Desktop: 4x1 */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
        {hrMetrics.map((metric, index) => {
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
            <CheckCircle className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>Common HR tasks and operations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Button
                  key={index}
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-primary/5 transition-all duration-200"
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
        {/* Pending Requests */}
        <Card className="bg-gradient-card shadow-xl border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Pending Requests
            </CardTitle>
            <CardDescription>Employee requests awaiting approval</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingRequests.map((request) => (
              <div key={request.id} className="space-y-2 p-3 rounded-lg border bg-background/50">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-sm">{request.employee}</span>
                    <p className="text-xs text-muted-foreground">{request.department}</p>
                  </div>
                  <Badge 
                    variant={
                      request.priority === 'high' ? 'destructive' :
                      request.priority === 'medium' ? 'default' : 'secondary'
                    }
                    className="text-xs"
                  >
                    {request.priority}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{request.type}</Badge>
                    <span className="text-xs text-muted-foreground">{request.duration}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{request.date}</p>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button size="sm" className="h-7 px-3 text-xs">Approve</Button>
                  <Button size="sm" variant="outline" className="h-7 px-3 text-xs">Review</Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Hires */}
        <Card className="bg-gradient-card shadow-xl border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Recent Hires
            </CardTitle>
            <CardDescription>New employees and onboarding status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentHires.map((hire) => (
              <div key={hire.id} className="space-y-2 p-3 rounded-lg border bg-background/50">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-sm">{hire.name}</span>
                    <p className="text-xs text-muted-foreground">{hire.position}</p>
                  </div>
                  <Badge 
                    variant={
                      hire.status === 'completed' ? 'default' :
                      hire.status === 'onboarding' ? 'secondary' : 'outline'
                    }
                    className="text-xs"
                  >
                    {hire.status}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{hire.department}</Badge>
                    <span className="text-xs text-muted-foreground">Started: {new Date(hire.startDate).toLocaleDateString()}</span>
                  </div>
                </div>
                <Button size="sm" variant="ghost" className="h-7 px-3 text-xs w-full">
                  View Profile
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Department Statistics */}
      <Card className="bg-gradient-card shadow-xl border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Department Statistics
          </CardTitle>
          <CardDescription>Employee metrics by department</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {departmentStats.map((dept, index) => (
            <div key={index} className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">{dept.name}</span>
                <Badge variant="outline" className="text-xs">
                  {dept.employees} employees
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Attendance</span>
                    <span className="font-medium">{dept.attendance}%</span>
                  </div>
                  <Progress value={dept.attendance} className="h-2" />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Satisfaction</span>
                    <span className="font-medium">{dept.satisfaction}%</span>
                  </div>
                  <Progress value={dept.satisfaction} className="h-2" />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Upcoming Tasks */}
      <Card className="bg-gradient-card shadow-xl border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Upcoming Tasks
          </CardTitle>
          <CardDescription>Important HR tasks and deadlines</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {upcomingTasks.map((task) => (
            <div key={task.id} className="flex items-center justify-between p-3 rounded-lg border bg-background/50">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{task.task}</span>
                  <Badge variant="outline" className="text-xs">
                    {task.type}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                  <Badge 
                    variant={
                      task.priority === 'high' ? 'destructive' : 'secondary'
                    }
                    className="text-xs"
                  >
                    {task.priority}
                  </Badge>
                </div>
              </div>
              <Button size="sm" variant="outline" className="h-8 px-3">
                Start
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default HRStaffDashboard;