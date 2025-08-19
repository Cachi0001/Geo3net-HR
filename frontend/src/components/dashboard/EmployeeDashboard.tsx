import React from 'react';
import { User, Calendar, Clock, Target, CheckCircle, AlertCircle, Award, FileText } from 'lucide-react';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export const EmployeeDashboard: React.FC = () => {
  const navigate = useNavigate();

  const personalMetrics = [
    {
      title: 'Tasks Completed',
      value: '28',
      change: { value: '+4 this week', trend: 'up' as const },
      icon: CheckCircle
    },
    {
      title: 'Hours Worked',
      value: '156h',
      change: { value: '38h this week', trend: 'up' as const },
      icon: Clock
    },
    {
      title: 'Performance Score',
      value: '94%',
      change: { value: '+2% this month', trend: 'up' as const },
      icon: Award
    },
    {
      title: 'Leave Balance',
      value: '18',
      change: { value: '5 days pending', trend: 'neutral' as const },
      icon: Calendar
    }
  ];

  const myTasks = [
    { id: 1, title: 'Complete project documentation', priority: 'high', dueDate: '2024-03-20', status: 'in-progress', progress: 75 },
    { id: 2, title: 'Review code for mobile app', priority: 'medium', dueDate: '2024-03-18', status: 'pending', progress: 0 },
    { id: 3, title: 'Attend team meeting', priority: 'low', dueDate: '2024-03-15', status: 'completed', progress: 100 },
    { id: 4, title: 'Update user interface designs', priority: 'medium', dueDate: '2024-03-22', status: 'in-progress', progress: 45 },
  ];

  const upcomingEvents = [
    { id: 1, title: 'Team Standup', time: '09:00 AM', date: 'Today', type: 'meeting' },
    { id: 2, title: 'Project Review', time: '02:00 PM', date: 'Tomorrow', type: 'review' },
    { id: 3, title: 'Training Session', time: '10:00 AM', date: 'Mar 20', type: 'training' },
    { id: 4, title: 'One-on-One', time: '03:00 PM', date: 'Mar 22', type: 'meeting' },
  ];

  const recentActivities = [
    { id: 1, action: 'Completed task: API Integration', time: '2 hours ago', type: 'task' },
    { id: 2, action: 'Submitted leave request', time: '1 day ago', type: 'request' },
    { id: 3, action: 'Updated profile information', time: '3 days ago', type: 'profile' },
    { id: 4, action: 'Attended training session', time: '1 week ago', type: 'training' },
  ];

  const quickActions = [
    { title: 'Request Leave', description: 'Submit time off request', icon: Calendar, action: () => navigate('/dashboard/leave-request') },
    { title: 'View Payslip', description: 'Download pay statements', icon: FileText, action: () => navigate('/dashboard/payroll') },
    { title: 'Update Profile', description: 'Edit personal information', icon: User, action: () => navigate('/dashboard/profile') },
    { title: 'My Goals', description: 'Track performance goals', icon: Target, action: () => navigate('/dashboard/goals') },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <User className="h-8 w-8 text-primary" />
          My Dashboard
        </h1>
        <p className="text-muted-foreground">Personal workspace and task management</p>
      </div>

      {/* Personal Metrics - Mobile First: 2x2, Desktop: 4x1 */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
        {personalMetrics.map((metric, index) => {
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
            <Target className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>Common tasks and self-service options</CardDescription>
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
        {/* My Tasks */}
        <Card className="bg-gradient-card shadow-xl border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              My Tasks
            </CardTitle>
            <CardDescription>Current assignments and progress</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {myTasks.map((task) => (
              <div key={task.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{task.title}</span>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={
                        task.priority === 'high' ? 'destructive' :
                        task.priority === 'medium' ? 'default' : 'secondary'
                      }
                      className="text-xs"
                    >
                      {task.priority}
                    </Badge>
                    <Badge 
                      variant={
                        task.status === 'completed' ? 'default' :
                        task.status === 'in-progress' ? 'secondary' : 'outline'
                      }
                      className="text-xs"
                    >
                      {task.status.replace('-', ' ')}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{task.progress}%</span>
                  </div>
                  <Progress value={task.progress} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card className="bg-gradient-card shadow-xl border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Events
            </CardTitle>
            <CardDescription>Schedule and important dates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingEvents.map((event) => (
              <div key={event.id} className="flex items-center justify-between p-3 rounded-lg border bg-background/50">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{event.title}</span>
                    <Badge variant="outline" className="text-xs">
                      {event.type}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">{event.date}</span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">{event.time}</span>
                  </div>
                </div>
                <Button size="sm" variant="ghost" className="h-8 px-3">
                  View
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card className="bg-gradient-card shadow-xl border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Recent Activities
          </CardTitle>
          <CardDescription>Your recent actions and updates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentActivities.map((activity) => (
            <div key={activity.id} className="flex items-center gap-3 p-3 rounded-lg border bg-background/50">
              <div className="flex-shrink-0">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{activity.action}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
                  <Badge variant="outline" className="text-xs">
                    {activity.type}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeDashboard;