import React from 'react';
import { Users, UserPlus, Calendar, FileText, Clock, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import styles from './HRStaffDashboard.module.css';

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
    <div className="dashboard-container space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="mobile-text-lg md:text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-2">
          <Users className="mobile-icon-lg md:h-7 md:w-7 lg:h-8 lg:w-8 text-primary" />
          HR Staff Dashboard
        </h1>
        <p className="mobile-text-sm md:text-base text-muted-foreground">Employee management and HR operations</p>
      </div>

      {/* HR Metrics - Mobile First: 2x2, Desktop: 4x1 */}
      <div className="mobile-responsive-grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
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
      <Card className="mobile-card bg-gradient-card shadow-xl border-0">
        <CardHeader className="pb-3 md:pb-6">
          <CardTitle className="flex items-center gap-2 mobile-text-base md:text-lg">
            <CheckCircle className="mobile-icon md:h-5 md:w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription className="mobile-text-xs md:text-sm">Common HR tasks and operations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mobile-responsive-grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Button
                  key={index}
                  variant="outline"
                  className="touch-target h-auto p-3 md:p-4 flex flex-col items-center gap-2 hover:bg-primary/5 active:bg-primary/10 transition-all duration-200"
                  onClick={action.action}
                >
                  <Icon className="mobile-icon md:h-6 md:w-6 text-primary" />
                  <div className="text-center">
                    <div className="font-medium mobile-text-xs md:text-sm">{action.title}</div>
                    <div className="mobile-text-xs md:text-xs text-muted-foreground mt-1">{action.description}</div>
                  </div>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Pending Requests */}
        <Card className="mobile-card bg-gradient-card shadow-xl border-0">
          <CardHeader className="pb-3 md:pb-6">
            <CardTitle className="flex items-center gap-2 mobile-text-base md:text-lg">
              <Clock className="mobile-icon md:h-5 md:w-5" />
              Pending Requests
            </CardTitle>
            <CardDescription className="mobile-text-xs md:text-sm">Employee requests awaiting approval</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 md:space-y-4">
            {pendingRequests.map((request) => (
              <div key={request.id} className="space-y-2 p-3 rounded-lg border bg-background/50">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium mobile-text-xs md:text-sm">{request.employee}</span>
                    <p className="mobile-text-xs text-muted-foreground">{request.department}</p>
                  </div>
                  <Badge 
                    variant={
                      request.priority === 'high' ? 'destructive' :
                      request.priority === 'medium' ? 'default' : 'secondary'
                    }
                    className="mobile-text-xs"
                  >
                    {request.priority}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="mobile-text-xs">{request.type}</Badge>
                    <span className="mobile-text-xs text-muted-foreground">{request.duration}</span>
                  </div>
                  <p className="mobile-text-xs text-muted-foreground">{request.date}</p>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button size="sm" className="touch-target h-8 px-3 mobile-text-xs">Approve</Button>
                  <Button size="sm" variant="outline" className="touch-target h-8 px-3 mobile-text-xs">Review</Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Hires */}
        <Card className="mobile-card bg-gradient-card shadow-xl border-0">
          <CardHeader className="pb-3 md:pb-6">
            <CardTitle className="flex items-center gap-2 mobile-text-base md:text-lg">
              <UserPlus className="mobile-icon md:h-5 md:w-5" />
              Recent Hires
            </CardTitle>
            <CardDescription className="mobile-text-xs md:text-sm">New employees and onboarding status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 md:space-y-4">
             {recentHires.map((hire) => (
               <div key={hire.id} className="space-y-2 p-3 rounded-lg border bg-background/50">
                 <div className="flex items-center justify-between">
                   <div>
                     <span className="font-medium mobile-text-xs md:text-sm">{hire.name}</span>
                     <p className="mobile-text-xs text-muted-foreground">{hire.position}</p>
                   </div>
                   <Badge 
                     variant={
                       hire.status === 'completed' ? 'default' :
                       hire.status === 'onboarding' ? 'secondary' : 'outline'
                     }
                     className="mobile-text-xs"
                   >
                     {hire.status}
                   </Badge>
                 </div>
                 <div className="space-y-1">
                   <div className="flex items-center gap-2">
                     <Badge variant="outline" className="mobile-text-xs">{hire.department}</Badge>
                     <span className="mobile-text-xs text-muted-foreground">Started: {new Date(hire.startDate).toLocaleDateString()}</span>
                   </div>
                 </div>
                 <Button size="sm" variant="ghost" className="touch-target h-8 px-3 mobile-text-xs w-full">
                   View Profile
                 </Button>
               </div>
             ))}
          </CardContent>
        </Card>
      </div>

      {/* Department Statistics */}
      <Card className="mobile-card bg-gradient-card shadow-xl border-0">
        <CardHeader className="pb-3 md:pb-6">
          <CardTitle className="flex items-center gap-2 mobile-text-base md:text-lg">
            <TrendingUp className="mobile-icon md:h-5 md:w-5" />
            Department Statistics
          </CardTitle>
          <CardDescription className="mobile-text-xs md:text-sm">Employee metrics by department</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 md:space-y-4">
          {departmentStats.map((dept, index) => (
            <div key={index} className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium mobile-text-sm md:text-base">{dept.name}</span>
                <Badge variant="outline" className="mobile-text-xs">
                  {dept.employees} employees
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-1">
                  <div className="flex justify-between mobile-text-xs md:text-sm">
                    <span className="text-muted-foreground">Attendance</span>
                    <span className="font-medium">{dept.attendance}%</span>
                  </div>
                  <Progress value={dept.attendance} className="h-2" />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between mobile-text-xs md:text-sm">
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
      <Card className="mobile-card bg-gradient-card shadow-xl border-0">
        <CardHeader className="pb-3 md:pb-6">
          <CardTitle className="flex items-center gap-2 mobile-text-base md:text-lg">
            <AlertTriangle className="mobile-icon md:h-5 md:w-5" />
            Upcoming Tasks
          </CardTitle>
          <CardDescription className="mobile-text-xs md:text-sm">Important HR tasks and deadlines</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {upcomingTasks.map((task) => (
            <div key={task.id} className="flex flex-col md:flex-row md:items-center justify-between p-3 rounded-lg border bg-background/50 gap-3">
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center gap-2">
                  <span className="font-medium mobile-text-xs md:text-sm">{task.task}</span>
                  <Badge variant="outline" className="mobile-text-xs w-fit">
                    {task.type}
                  </Badge>
                </div>
                <div className="flex flex-col md:flex-row md:items-center gap-2 mt-1">
                  <span className="mobile-text-xs text-muted-foreground">Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                  <Badge 
                    variant={
                      task.priority === 'high' ? 'destructive' : 'secondary'
                    }
                    className="mobile-text-xs w-fit"
                  >
                    {task.priority}
                  </Badge>
                </div>
              </div>
              <Button size="sm" variant="outline" className="touch-target h-8 px-3 mobile-text-xs w-full md:w-auto">
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