import React from 'react';
import { Users, UserPlus, Calendar, FileText, TrendingUp, Clock, Briefcase, Award } from 'lucide-react';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export const HRAdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  const hrMetrics = [
    {
      title: 'Total Employees',
      value: '1,247',
      change: { value: '+12 this month', trend: 'up' as const },
      icon: Users
    },
    {
      title: 'New Hires',
      value: '23',
      change: { value: '+8 this week', trend: 'up' as const },
      icon: UserPlus
    },
    {
      title: 'Open Positions',
      value: '34',
      change: { value: '12 filled recently', trend: 'down' as const },
      icon: Briefcase
    },
    {
      title: 'Pending Reviews',
      value: '156',
      change: { value: '24 completed today', trend: 'down' as const },
      icon: FileText
    }
  ];

  const recentActivities = [
    { id: 1, type: 'hire', message: 'Sarah Johnson joined as Senior Developer', time: '2 hours ago', department: 'Engineering' },
    { id: 2, type: 'review', message: 'Q1 performance reviews completed for Marketing', time: '4 hours ago', department: 'Marketing' },
    { id: 3, type: 'recruitment', message: 'New job posting: Product Manager', time: '6 hours ago', department: 'Product' },
    { id: 4, type: 'leave', message: '5 leave requests pending approval', time: '1 day ago', department: 'Various' },
  ];

  const recruitmentPipeline = [
    { position: 'Senior Developer', applications: 45, interviews: 12, offers: 3, stage: 'Interview' },
    { position: 'Product Manager', applications: 67, interviews: 8, offers: 1, stage: 'Offer' },
    { position: 'UX Designer', applications: 34, interviews: 15, offers: 2, stage: 'Review' },
    { position: 'Data Analyst', applications: 28, interviews: 6, offers: 0, stage: 'Interview' },
  ];

  const departmentMetrics = [
    { name: 'Engineering', employees: 324, satisfaction: 92, turnover: 5 },
    { name: 'Sales', employees: 189, satisfaction: 88, turnover: 8 },
    { name: 'Marketing', employees: 156, satisfaction: 90, turnover: 6 },
    { name: 'Product', employees: 78, satisfaction: 94, turnover: 3 },
  ];

  const quickActions = [
    { title: 'Add Employee', description: 'Register new employee', icon: UserPlus, action: () => navigate('/dashboard/employees') },
    { title: 'Recruitment', description: 'Manage job postings', icon: Briefcase, action: () => navigate('/dashboard/recruitment') },
    { title: 'Leave Requests', description: 'Review pending requests', icon: Calendar, action: () => navigate('/dashboard/leave') },
    { title: 'Reports', description: 'Generate HR reports', icon: FileText, action: () => navigate('/dashboard/reports') },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Users className="h-8 w-8 text-primary" />
          HR Admin Dashboard
        </h1>
        <p className="text-muted-foreground">Human Resources management and employee oversight</p>
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
            <Clock className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>Common HR tasks and shortcuts</CardDescription>
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
        {/* Recruitment Pipeline */}
        <Card className="bg-gradient-card shadow-xl border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Recruitment Pipeline
            </CardTitle>
            <CardDescription>Current hiring progress and statistics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recruitmentPipeline.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{item.position}</span>
                  <Badge variant="outline" className="text-xs">
                    {item.stage}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="text-center p-2 bg-background/50 rounded">
                    <div className="font-medium">{item.applications}</div>
                    <div className="text-xs text-muted-foreground">Applications</div>
                  </div>
                  <div className="text-center p-2 bg-background/50 rounded">
                    <div className="font-medium">{item.interviews}</div>
                    <div className="text-xs text-muted-foreground">Interviews</div>
                  </div>
                  <div className="text-center p-2 bg-background/50 rounded">
                    <div className="font-medium">{item.offers}</div>
                    <div className="text-xs text-muted-foreground">Offers</div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Department Metrics */}
        <Card className="bg-gradient-card shadow-xl border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Department Metrics
            </CardTitle>
            <CardDescription>Employee satisfaction and turnover rates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {departmentMetrics.map((dept) => (
              <div key={dept.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{dept.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {dept.employees} employees
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Satisfaction</span>
                    <span className="font-medium">{dept.satisfaction}%</span>
                  </div>
                  <Progress value={dept.satisfaction} className="h-2" />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Turnover Rate</span>
                    <span className={`font-medium ${
                      dept.turnover <= 5 ? 'text-green-600' : 
                      dept.turnover <= 8 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {dept.turnover}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card className="bg-gradient-card shadow-xl border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Recent HR Activities
          </CardTitle>
          <CardDescription>Latest updates and activities across departments</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {recentActivities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg border bg-background/50">
              <div className={`h-2 w-2 rounded-full mt-2 ${
                activity.type === 'hire' ? 'bg-green-500' :
                activity.type === 'review' ? 'bg-blue-500' :
                activity.type === 'recruitment' ? 'bg-purple-500' : 'bg-orange-500'
              }`} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{activity.message}</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                  <Badge variant="outline" className="text-xs">
                    {activity.department}
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

export default HRAdminDashboard;