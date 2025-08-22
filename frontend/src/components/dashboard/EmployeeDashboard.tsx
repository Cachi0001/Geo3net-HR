import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Calendar, CheckCircle, AlertCircle, User, FileText } from 'lucide-react';

export const EmployeeDashboard: React.FC = () => {
  const { user } = useAuth();

  console.log('👤 EmployeeDashboard rendered for user:', user?.email, 'role:', user?.role);

  const stats = [
    {
      title: 'Hours This Week',
      value: '32.5',
      change: '7.5 hours today',
      icon: Clock,
      color: 'text-blue-600'
    },
    {
      title: 'Leave Balance',
      value: '18',
      change: '5 days used',
      icon: Calendar,
      color: 'text-green-600'
    },
    {
      title: 'Tasks Completed',
      value: '12',
      change: '3 this week',
      icon: CheckCircle,
      color: 'text-purple-600'
    },
    {
      title: 'Pending Tasks',
      value: '4',
      change: '2 due today',
      icon: AlertCircle,
      color: 'text-orange-600'
    }
  ];

  const recentTasks = [
    { id: 1, title: 'Complete project documentation', status: 'pending', priority: 'high', dueDate: 'Today' },
    { id: 2, title: 'Review team presentation', status: 'completed', priority: 'medium', dueDate: 'Yesterday' },
    { id: 3, title: 'Update client requirements', status: 'pending', priority: 'low', dueDate: 'Tomorrow' },
    { id: 4, title: 'Attend team meeting', status: 'completed', priority: 'medium', dueDate: '2 days ago' }
  ];

  const upcomingEvents = [
    { id: 1, title: 'Team Standup', time: '9:00 AM', type: 'meeting' },
    { id: 2, title: 'Project Review', time: '2:00 PM', type: 'review' },
    { id: 3, title: 'Training Session', time: '4:00 PM', type: 'training' }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6 rounded-lg">
        <h1 className="text-2xl font-bold">Good morning, {user?.fullName || 'Employee'}!</h1>
        <p className="text-green-100 mt-2">Ready to make today productive? Here's your overview.</p>
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
        {/* Recent Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              My Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      task.status === 'completed' ? 'bg-green-500' : 
                      task.priority === 'high' ? 'bg-red-500' :
                      task.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                    }`} />
                    <div>
                      <p className={`font-medium ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                        {task.title}
                      </p>
                      <p className="text-sm text-muted-foreground">Due: {task.dueDate}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    task.priority === 'high' ? 'bg-red-100 text-red-700' :
                    task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {task.priority}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Today's Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Clock className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{event.title}</p>
                    <p className="text-sm text-muted-foreground">{event.time}</p>
                  </div>
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                    {event.type}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-center transition-colors">
              <Clock className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <p className="font-medium">Check In/Out</p>
            </button>
            <button className="p-4 bg-green-50 hover:bg-green-100 rounded-lg text-center transition-colors">
              <Calendar className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <p className="font-medium">Request Leave</p>
            </button>
            <button className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-center transition-colors">
              <CheckCircle className="h-6 w-6 text-purple-600 mx-auto mb-2" />
              <p className="font-medium">View Tasks</p>
            </button>
            <button className="p-4 bg-orange-50 hover:bg-orange-100 rounded-lg text-center transition-colors">
              <FileText className="h-6 w-6 text-orange-600 mx-auto mb-2" />
              <p className="font-medium">My Profile</p>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeDashboard;