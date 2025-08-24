import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Calendar, CheckCircle, AlertCircle, User, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/services/api';

interface DashboardStats {
  hoursThisWeek: number;
  hoursToday: number;
  leaveBalance: number;
  usedLeaveDays: number;
  tasksCompleted: number;
  completedThisWeek: number;
  pendingTasks: number;
  dueTodayTasks: number;
}

interface Task {
  id: string;
  title: string;
  dueDate: string;
  priority: string;
  status: string;
}

interface ScheduleItem {
  id: string;
  title: string;
  time: string;
  type: string;
}

interface DashboardData {
  stats: DashboardStats;
  recentTasks: Task[];
  todaySchedule: ScheduleItem[];
  employee: {
    id: string;
    fullName: string;
    employeeId: string;
  };
}

export const EmployeeDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  console.log('👤 EmployeeDashboard rendered for user:', user?.email, 'role:', user?.role);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getEmployeeDashboard();
      
      if (response.success && response.data) {
        setDashboardData(response.data);
      } else {
        throw new Error(response.message || 'Failed to load dashboard data');
      }
    } catch (error: any) {
      console.error('Dashboard data error:', error);
      setError(error.message || 'Failed to load dashboard data');
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

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

  if (loading) {
    return (
      <div className="dashboard-container flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="dashboard-container space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">Failed to load dashboard data. Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: 'Hours This Week',
      value: dashboardData.stats.hoursThisWeek.toString(),
      change: `${dashboardData.stats.hoursToday} hours today`,
      icon: Clock,
      color: 'text-blue-600'
    },
    {
      title: 'Leave Balance',
      value: dashboardData.stats.leaveBalance.toString(),
      change: `${dashboardData.stats.usedLeaveDays} days used`,
      icon: Calendar,
      color: 'text-green-600'
    },
    {
      title: 'Tasks Completed',
      value: dashboardData.stats.tasksCompleted.toString(),
      change: `${dashboardData.stats.completedThisWeek} this week`,
      icon: CheckCircle,
      color: 'text-purple-600'
    },
    {
      title: 'Pending Tasks',
      value: dashboardData.stats.pendingTasks.toString(),
      change: `${dashboardData.stats.dueTodayTasks} due today`,
      icon: AlertCircle,
      color: 'text-orange-600'
    }
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
              {dashboardData.recentTasks.map((task) => (
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
              {dashboardData.todaySchedule.map((event) => (
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