import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Calendar, CheckCircle, AlertCircle, User, FileText } from 'lucide-react';
import { toast } from 'sonner';

export const EmployeeDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  console.log('👤 EmployeeDashboard rendered for user:', user?.email, 'role:', user?.role);

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'check-in-out':
        navigate('/dashboard/time-tracking');
        break;
      case 'request-leave':
        navigate('/dashboard/leave-request');
        break;
      case 'view-tasks':
        navigate('/dashboard/tasks');
        break;
      case 'my-profile':
        navigate('/dashboard/profile');
        break;
      default:
        toast.error('Feature coming soon!');
    }
  };

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
    <div className="dashboard-container space-y-4 sm:space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-4 sm:p-6 rounded-lg">
        <h1 className="mobile-text-lg sm:text-2xl font-bold">Good morning, {user?.fullName || 'Employee'}!</h1>
        <p className="text-green-100 mt-2 mobile-text-sm sm:text-base">Ready to make today productive? Here's your overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="mobile-responsive-grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="mobile-card hover:shadow-lg transition-shadow">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="mobile-text-xs sm:text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="mobile-text-lg sm:text-2xl font-bold">{stat.value}</p>
                  <p className="mobile-text-xs text-muted-foreground mt-1">{stat.change}</p>
                </div>
                <stat.icon className={`mobile-icon-lg sm:h-8 sm:w-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Tasks */}
        <Card className="mobile-card">
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="flex items-center gap-2 mobile-text-base sm:text-lg">
              <CheckCircle className="mobile-icon sm:h-5 sm:w-5" />
              My Tasks
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 sm:space-y-3">
              {recentTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-2 sm:p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full flex-shrink-0 ${
                      task.status === 'completed' ? 'bg-green-500' : 
                      task.priority === 'high' ? 'bg-red-500' :
                      task.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                    }`} />
                    <div className="min-w-0 flex-1">
                      <p className={`mobile-text-xs sm:text-sm font-medium truncate ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                        {task.title}
                      </p>
                      <p className="mobile-text-xs text-muted-foreground">Due: {task.dueDate}</p>
                    </div>
                  </div>
                  <span className={`mobile-text-xs px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full flex-shrink-0 ml-2 ${
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
        <Card className="mobile-card">
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="flex items-center gap-2 mobile-text-base sm:text-lg">
              <Calendar className="mobile-icon sm:h-5 sm:w-5" />
              Today's Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3 sm:space-y-4">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="flex items-center gap-3 sm:gap-4 p-2 sm:p-3 bg-muted/50 rounded-lg">
                  <div className="w-8 h-8 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="mobile-icon sm:h-6 sm:w-6 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="mobile-text-xs sm:text-sm font-medium truncate">{event.title}</p>
                    <p className="mobile-text-xs text-muted-foreground">{event.time}</p>
                  </div>
                  <span className="mobile-text-xs px-1.5 py-0.5 sm:px-2 sm:py-1 bg-blue-100 text-blue-700 rounded-full flex-shrink-0">
                    {event.type}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="mobile-card">
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="flex items-center gap-2 mobile-text-base sm:text-lg">
            <User className="mobile-icon sm:h-5 sm:w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="mobile-responsive-grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <button 
              className="touch-target p-3 sm:p-4 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 rounded-lg text-center transition-colors"
              onClick={() => handleQuickAction('check-in-out')}
            >
              <Clock className="mobile-icon-lg sm:h-6 sm:w-6 text-blue-600 mx-auto mb-1 sm:mb-2" />
              <p className="mobile-text-xs sm:text-sm font-medium">Check In/Out</p>
            </button>
            <button 
              className="touch-target p-3 sm:p-4 bg-green-50 hover:bg-green-100 active:bg-green-200 rounded-lg text-center transition-colors"
              onClick={() => handleQuickAction('request-leave')}
            >
              <Calendar className="mobile-icon-lg sm:h-6 sm:w-6 text-green-600 mx-auto mb-1 sm:mb-2" />
              <p className="mobile-text-xs sm:text-sm font-medium">Request Leave</p>
            </button>
            <button 
              className="touch-target p-3 sm:p-4 bg-purple-50 hover:bg-purple-100 active:bg-purple-200 rounded-lg text-center transition-colors"
              onClick={() => handleQuickAction('view-tasks')}
            >
              <CheckCircle className="mobile-icon-lg sm:h-6 sm:w-6 text-purple-600 mx-auto mb-1 sm:mb-2" />
              <p className="mobile-text-xs sm:text-sm font-medium">View Tasks</p>
            </button>
            <button 
              className="touch-target p-3 sm:p-4 bg-orange-50 hover:bg-orange-100 active:bg-orange-200 rounded-lg text-center transition-colors"
              onClick={() => handleQuickAction('my-profile')}
            >
              <FileText className="mobile-icon-lg sm:h-6 sm:w-6 text-orange-600 mx-auto mb-1 sm:mb-2" />
              <p className="mobile-text-xs sm:text-sm font-medium">My Profile</p>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeDashboard;