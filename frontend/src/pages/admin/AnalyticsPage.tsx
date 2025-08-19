import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Clock, 
  Target, 
  Award,
  Calendar,
  PieChart,
  Activity
} from 'lucide-react';

const AnalyticsPage: React.FC = () => {
  // Mock analytics data - replace with real API calls
  const metrics = [
    {
      title: 'Total Revenue',
      value: '₦2.4M',
      change: { value: '+12.5%', trend: 'up' as const },
      icon: TrendingUp
    },
    {
      title: 'Active Projects',
      value: '24',
      change: { value: '+3', trend: 'up' as const },
      icon: Target
    },
    {
      title: 'Team Productivity',
      value: '87%',
      change: { value: '+5.2%', trend: 'up' as const },
      icon: Activity
    },
    {
      title: 'Client Satisfaction',
      value: '4.8/5',
      change: { value: '+0.3', trend: 'up' as const },
      icon: Award
    }
  ];

  const departmentPerformance = [
    { name: 'Engineering', completed: 45, total: 52, efficiency: 87 },
    { name: 'Design', completed: 28, total: 30, efficiency: 93 },
    { name: 'Marketing', completed: 22, total: 25, efficiency: 88 },
    { name: 'Sales', completed: 35, total: 40, efficiency: 85 },
    { name: 'HR', completed: 18, total: 20, efficiency: 90 }
  ];

  const monthlyData = [
    { month: 'Jan', revenue: 180000, projects: 8, employees: 45 },
    { month: 'Feb', revenue: 220000, projects: 12, employees: 48 },
    { month: 'Mar', revenue: 280000, projects: 15, employees: 52 },
    { month: 'Apr', revenue: 320000, projects: 18, employees: 55 },
    { month: 'May', revenue: 380000, projects: 22, employees: 58 },
    { month: 'Jun', revenue: 420000, projects: 24, employees: 62 }
  ];

  const topPerformers = [
    { name: 'John Doe', department: 'Engineering', score: 98, projects: 8 },
    { name: 'Jane Smith', department: 'Design', score: 96, projects: 6 },
    { name: 'Mike Johnson', department: 'Marketing', score: 94, projects: 7 },
    { name: 'Sarah Wilson', department: 'HR', score: 92, projects: 5 },
    { name: 'David Brown', department: 'Sales', score: 90, projects: 9 }
  ];

  const getDepartmentColor = (index: number) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500', 
      'bg-orange-500',
      'bg-purple-500',
      'bg-cyan-500'
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground mt-1">Comprehensive insights into your business performance</p>
        </div>
        <div className="flex gap-2">
          <Badge className="bg-gradient-primary text-white px-3 py-1">
            <Calendar className="h-3 w-3 mr-1" />
            This Month
          </Badge>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => {
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

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card className="bg-gradient-card shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="h-8 w-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-white" />
              </div>
              Revenue Trend
            </CardTitle>
            <CardDescription>Monthly revenue growth over the past 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {monthlyData.map((data, index) => (
                <div key={data.month} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-3 w-3 rounded-full ${getDepartmentColor(index)}`} />
                    <span className="font-medium">{data.month}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">₦{(data.revenue / 1000).toFixed(0)}K</p>
                    <p className="text-xs text-muted-foreground">{data.projects} projects</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Growth Rate</span>
                <span className="text-lg font-bold text-green-600">+23.5%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Department Performance */}
        <Card className="bg-gradient-card shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="h-8 w-8 bg-gradient-secondary rounded-lg flex items-center justify-center">
                <PieChart className="h-4 w-4 text-white" />
              </div>
              Department Efficiency
            </CardTitle>
            <CardDescription>Task completion rates by department</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {departmentPerformance.map((dept, index) => (
              <div key={dept.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`h-3 w-3 rounded-full ${getDepartmentColor(index)}`} />
                    <span className="font-medium">{dept.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold">{dept.efficiency}%</span>
                    <p className="text-xs text-muted-foreground">{dept.completed}/{dept.total} tasks</p>
                  </div>
                </div>
                <Progress value={dept.efficiency} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Performers */}
        <Card className="bg-gradient-card shadow-xl border-0 hover:shadow-2xl transition-all duration-300 lg:col-span-2">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="h-8 w-8 bg-gradient-accent rounded-lg flex items-center justify-center">
                <Award className="h-4 w-4 text-white" />
              </div>
              Top Performers
            </CardTitle>
            <CardDescription>Highest performing team members this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topPerformers.map((performer, index) => (
                <div key={performer.name} className="flex items-center justify-between p-3 bg-gradient-to-r from-white to-gray-50 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center">
                      <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>
                    </div>
                    <div className="h-10 w-10 bg-gradient-primary rounded-full flex items-center justify-center text-white font-semibold">
                      {performer.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-semibold">{performer.name}</p>
                      <p className="text-sm text-muted-foreground">{performer.department}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white">
                        {performer.score}%
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{performer.projects} projects</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="bg-gradient-card shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="h-8 w-8 bg-gradient-to-r from-purple-400 to-purple-600 rounded-lg flex items-center justify-center">
                <Clock className="h-4 w-4 text-white" />
              </div>
              Quick Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">156</p>
              <p className="text-sm text-blue-600">Hours Logged Today</p>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
              <p className="text-2xl font-bold text-green-600">98.5%</p>
              <p className="text-sm text-green-600">System Uptime</p>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg">
              <p className="text-2xl font-bold text-orange-600">12</p>
              <p className="text-sm text-orange-600">Pending Reviews</p>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">₦1.2M</p>
              <p className="text-sm text-purple-600">This Week's Revenue</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsPage;