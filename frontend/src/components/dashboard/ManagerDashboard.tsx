import React from 'react';
import { Users, Target, Calendar, TrendingUp, Clock, CheckCircle, AlertCircle, Award } from 'lucide-react';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import styles from './ManagerDashboard.module.css';

export const ManagerDashboard: React.FC = () => {
  const navigate = useNavigate();

  const teamMetrics = [
    {
      title: 'Team Members',
      value: '24',
      change: { value: '+2 this month', trend: 'up' as const },
      icon: Users
    },
    {
      title: 'Active Tasks',
      value: '47',
      change: { value: '12 completed today', trend: 'down' as const },
      icon: Target
    },
    {
      title: 'Team Performance',
      value: '92%',
      change: { value: '+5% this quarter', trend: 'up' as const },
      icon: TrendingUp
    },
    {
      title: 'Pending Approvals',
      value: '8',
      change: { value: '3 leave requests', trend: 'neutral' as const },
      icon: Clock
    }
  ];

  const teamMembers = [
    { id: 1, name: 'John Smith', role: 'Senior Developer', performance: 95, tasksCompleted: 12, status: 'active' },
    { id: 2, name: 'Sarah Johnson', role: 'UI/UX Designer', performance: 88, tasksCompleted: 8, status: 'active' },
    { id: 3, name: 'Mike Chen', role: 'Frontend Developer', performance: 92, tasksCompleted: 10, status: 'active' },
    { id: 4, name: 'Emily Davis', role: 'QA Engineer', performance: 90, tasksCompleted: 15, status: 'on-leave' },
  ];

  const pendingApprovals = [
    { id: 1, type: 'leave', employee: 'John Smith', request: 'Annual Leave - 3 days', date: 'Mar 15-17', priority: 'medium' },
    { id: 2, type: 'overtime', employee: 'Sarah Johnson', request: 'Overtime Approval - 8 hours', date: 'Mar 12', priority: 'low' },
    { id: 3, type: 'leave', employee: 'Mike Chen', request: 'Sick Leave - 1 day', date: 'Mar 14', priority: 'high' },
  ];

  const projectProgress = [
    { name: 'Mobile App Redesign', progress: 75, deadline: '2024-04-15', status: 'on-track' },
    { name: 'API Integration', progress: 60, deadline: '2024-03-30', status: 'at-risk' },
    { name: 'User Dashboard', progress: 90, deadline: '2024-03-25', status: 'ahead' },
    { name: 'Testing Framework', progress: 45, deadline: '2024-04-10', status: 'on-track' },
  ];

  const quickActions = [
    { title: 'Approve Requests', description: 'Review pending approvals', icon: CheckCircle, action: () => navigate('/dashboard/approvals') },
    { title: 'Assign Tasks', description: 'Create and assign new tasks', icon: Target, action: () => navigate('/dashboard/tasks') },
    { title: 'Team Calendar', description: 'View team schedule', icon: Calendar, action: () => navigate('/dashboard/calendar') },
    { title: 'Performance Review', description: 'Conduct team reviews', icon: Award, action: () => navigate('/dashboard/reviews') },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Target className="h-8 w-8 text-primary" />
          Manager Dashboard
        </h1>
        <p className="text-muted-foreground">Team management and departmental oversight</p>
      </div>

      {/* Team Metrics - Mobile First: 2x2, Desktop: 4x1 */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
        {teamMetrics.map((metric, index) => {
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
          <CardDescription>Common management tasks and shortcuts</CardDescription>
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
        {/* Team Performance */}
        <Card className="bg-gradient-card shadow-xl border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Performance
            </CardTitle>
            <CardDescription>Individual team member performance and tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {teamMembers.map((member) => (
              <div key={member.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">{member.name}</span>
                    <p className="text-sm text-muted-foreground">{member.role}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={member.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                      {member.status === 'active' ? 'Active' : 'On Leave'}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {member.tasksCompleted} tasks
                    </Badge>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Performance</span>
                    <span className="font-medium">{member.performance}%</span>
                  </div>
                  <Progress value={member.performance} className="h-2" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Project Progress */}
        <Card className="bg-gradient-card shadow-xl border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Project Progress
            </CardTitle>
            <CardDescription>Current project status and deadlines</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {projectProgress.map((project, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{project.name}</span>
                  <Badge 
                    variant={
                      project.status === 'ahead' ? 'default' :
                      project.status === 'at-risk' ? 'destructive' : 'secondary'
                    }
                    className="text-xs"
                  >
                    {project.status.replace('-', ' ')}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Deadline: {new Date(project.deadline).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Pending Approvals */}
      <Card className="bg-gradient-card shadow-xl border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Pending Approvals
          </CardTitle>
          <CardDescription>Requests awaiting your approval</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {pendingApprovals.map((approval) => (
            <div key={approval.id} className="flex items-center justify-between p-3 rounded-lg border bg-background/50">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{approval.employee}</span>
                  <Badge variant="outline" className="text-xs">
                    {approval.type}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{approval.request}</p>
                <p className="text-xs text-muted-foreground">{approval.date}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge 
                  variant={
                    approval.priority === 'high' ? 'destructive' :
                    approval.priority === 'medium' ? 'default' : 'secondary'
                  }
                  className="text-xs"
                >
                  {approval.priority}
                </Badge>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" className="h-8 px-3">
                    Approve
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 px-3">
                    Decline
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default ManagerDashboard;