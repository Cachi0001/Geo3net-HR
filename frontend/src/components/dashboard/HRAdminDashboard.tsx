import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserPlus, Calendar, FileText, TrendingUp, Clock } from 'lucide-react';

export const HRAdminDashboard: React.FC = () => {
  const { user } = useAuth();

  console.log('🏢 HRAdminDashboard rendered for user:', user?.email, 'role:', user?.role);

  const stats = [
    {
      title: 'Total Employees',
      value: '150',
      change: '+5 this month',
      icon: Users,
      color: 'text-blue-600'
    },
    {
      title: 'New Hires',
      value: '8',
      change: '+2 this week',
      icon: UserPlus,
      color: 'text-green-600'
    },
    {
      title: 'Leave Requests',
      value: '12',
      change: '3 pending',
      icon: Calendar,
      color: 'text-orange-600'
    },
    {
      title: 'Open Positions',
      value: '6',
      change: '2 urgent',
      icon: FileText,
      color: 'text-purple-600'
    }
  ];

  const recentActivities = [
    { id: 1, action: 'New employee onboarded', user: 'Sarah Johnson', time: '2 hours ago' },
    { id: 2, action: 'Leave request approved', user: 'Mike Chen', time: '4 hours ago' },
    { id: 3, action: 'Performance review completed', user: 'Emma Davis', time: '1 day ago' },
    { id: 4, action: 'Job posting published', user: 'HR Team', time: '2 days ago' }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg">
        <h1 className="text-2xl font-bold">Welcome back, {user?.fullName || 'HR Admin'}!</h1>
        <p className="text-blue-100 mt-2">Here's what's happening in your organization today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
                </div>
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">{activity.action}</p>
                    <p className="text-sm text-muted-foreground">{activity.user}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <button className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-left transition-colors">
                <UserPlus className="h-6 w-6 text-blue-600 mb-2" />
                <p className="font-medium">Add Employee</p>
                <p className="text-sm text-muted-foreground">Onboard new team member</p>
              </button>
              <button className="p-4 bg-green-50 hover:bg-green-100 rounded-lg text-left transition-colors">
                <FileText className="h-6 w-6 text-green-600 mb-2" />
                <p className="font-medium">Post Job</p>
                <p className="text-sm text-muted-foreground">Create new job listing</p>
              </button>
              <button className="p-4 bg-orange-50 hover:bg-orange-100 rounded-lg text-left transition-colors">
                <Calendar className="h-6 w-6 text-orange-600 mb-2" />
                <p className="font-medium">Review Leaves</p>
                <p className="text-sm text-muted-foreground">Approve pending requests</p>
              </button>
              <button className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-left transition-colors">
                <TrendingUp className="h-6 w-6 text-purple-600 mb-2" />
                <p className="font-medium">View Reports</p>
                <p className="text-sm text-muted-foreground">Generate HR analytics</p>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HRAdminDashboard;