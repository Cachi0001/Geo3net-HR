import React, { useState, useEffect } from 'react';
import { Users, CheckSquare, Calendar, TrendingUp, Clock, Target, Award, FileText, BarChart3, UserCheck, AlertCircle, Star, Activity, ChevronRight } from 'lucide-react';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/api';

interface TeamMetrics {
  totalTeamMembers: number;
  activeTasks: number;
  completedThisWeek: number;
  teamPerformance: number;
  attendanceRate: number;
  productivityScore: number;
  overdueTasks: number;
  upcomingDeadlines: number;
}

interface TeamMember {
  id: string;
  name: string;
  position: string;
  performance: number;
  tasksCompleted: number;
  tasksActive: number;
  attendanceRate: number;
  lastActivity: string;
  avatar: string;
  status: 'online' | 'offline' | 'away';
}

interface TaskItem {
  id: string;
  title: string;
  assignee: string;
  status: 'pending' | 'in_progress' | 'review' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate: string;
  progress: number;
  estimatedHours: number;
}

interface ScheduleItem {
  id: string;
  employeeName: string;
  shift: string;
  date: string;
  status: 'scheduled' | 'confirmed' | 'absent' | 'late';
  hours: number;
}

export const ManagerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [teamMetrics, setTeamMetrics] = useState<TeamMetrics | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [activeTasks, setActiveTasks] = useState<TaskItem[]>([]);
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);

  // Load manager-specific data
  useEffect(() => {
    loadManagerDashboardData();
  }, []);

  const loadManagerDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load team metrics
      const metricsResponse = await apiClient.getDashboardData?.() || { success: false };
      if (metricsResponse.success) {
        setTeamMetrics(metricsResponse.data);
      } else {
        // Fallback data
        setTeamMetrics({
          totalTeamMembers: 12,
          activeTasks: 28,
          completedThisWeek: 15,
          teamPerformance: 87,
          attendanceRate: 94,
          productivityScore: 82,
          overdueTasks: 3,
          upcomingDeadlines: 8
        });
      }

      // Load team members data
      const teamResponse = await apiClient.getEmployees?.() || { success: false };
      if (teamResponse.success) {
        setTeamMembers(teamResponse.data?.employees?.slice(0, 6) || []);
      } else {
        // Fallback data
        setTeamMembers([
          { id: '1', name: 'John Doe', position: 'Senior Developer', performance: 92, tasksCompleted: 8, tasksActive: 3, attendanceRate: 96, lastActivity: '5 min ago', avatar: 'JD', status: 'online' },
          { id: '2', name: 'Jane Smith', position: 'UI/UX Designer', performance: 88, tasksCompleted: 6, tasksActive: 2, attendanceRate: 94, lastActivity: '15 min ago', avatar: 'JS', status: 'online' },
          { id: '3', name: 'Mike Johnson', position: 'Frontend Developer', performance: 85, tasksCompleted: 7, tasksActive: 4, attendanceRate: 90, lastActivity: '2 hours ago', avatar: 'MJ', status: 'away' },
          { id: '4', name: 'Sarah Wilson', position: 'QA Engineer', performance: 90, tasksCompleted: 9, tasksActive: 2, attendanceRate: 98, lastActivity: '10 min ago', avatar: 'SW', status: 'online' },
          { id: '5', name: 'Alex Chen', position: 'DevOps Engineer', performance: 91, tasksCompleted: 5, tasksActive: 3, attendanceRate: 92, lastActivity: '1 hour ago', avatar: 'AC', status: 'away' },
          { id: '6', name: 'Maria Garcia', position: 'Product Manager', performance: 89, tasksCompleted: 11, tasksActive: 5, attendanceRate: 95, lastActivity: '30 min ago', avatar: 'MG', status: 'online' },
        ]);
      }

      // Load active tasks
      const tasksResponse = await apiClient.getTasks?.() || { success: false };
      if (tasksResponse.success) {
        setActiveTasks(tasksResponse.data?.slice(0, 5) || []);
      } else {
        // Fallback data
        setActiveTasks([
          { id: '1', title: 'Review Q1 Performance Reports', assignee: 'John Doe', status: 'in_progress', priority: 'high', dueDate: '2024-03-25', progress: 65, estimatedHours: 8 },
          { id: '2', title: 'Update User Interface Components', assignee: 'Jane Smith', status: 'review', priority: 'medium', dueDate: '2024-03-23', progress: 90, estimatedHours: 12 },
          { id: '3', title: 'Implement Authentication System', assignee: 'Mike Johnson', status: 'in_progress', priority: 'urgent', dueDate: '2024-03-22', progress: 45, estimatedHours: 16 },
          { id: '4', title: 'Conduct User Testing Session', assignee: 'Sarah Wilson', status: 'pending', priority: 'high', dueDate: '2024-03-28', progress: 20, estimatedHours: 6 },
          { id: '5', title: 'Setup CI/CD Pipeline', assignee: 'Alex Chen', status: 'overdue', priority: 'high', dueDate: '2024-03-20', progress: 80, estimatedHours: 10 },
        ]);
      }

      // Load schedule data - using fallback for now
      setScheduleItems([
        { id: '1', employeeName: 'John Doe', shift: '09:00 - 17:00', date: '2024-03-22', status: 'confirmed', hours: 8 },
        { id: '2', employeeName: 'Jane Smith', shift: '10:00 - 18:00', date: '2024-03-22', status: 'confirmed', hours: 8 },
        { id: '3', employeeName: 'Mike Johnson', shift: '09:00 - 17:00', date: '2024-03-22', status: 'late', hours: 7.5 },
        { id: '4', employeeName: 'Sarah Wilson', shift: '08:00 - 16:00', date: '2024-03-22', status: 'confirmed', hours: 8 },
        { id: '5', employeeName: 'Alex Chen', shift: '11:00 - 19:00', date: '2024-03-22', status: 'absent', hours: 0 },
      ]);
    } catch (error) {
      console.error('Failed to load manager dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    { title: 'Assign Task', description: 'Create & assign new tasks', icon: CheckSquare, action: () => navigate('/dashboard/task-assignment'), color: 'bg-blue-500' },
    { title: 'Team Analytics', description: 'View performance metrics', icon: BarChart3, action: () => navigate('/dashboard/analytics?view=team'), color: 'bg-green-500' },
    { title: 'Schedule Management', description: 'Manage team schedules', icon: Calendar, action: () => navigate('/dashboard/schedule'), color: 'bg-purple-500' },
    { title: 'Performance Reviews', description: 'Conduct team reviews', icon: Star, action: () => navigate('/dashboard/performance'), color: 'bg-orange-500' },
    { title: 'Leave Approvals', description: 'Review leave requests', icon: FileText, action: () => navigate('/dashboard/leave-request'), color: 'bg-cyan-500' },
    { title: 'Team Reports', description: 'Generate team reports', icon: TrendingUp, action: () => navigate('/dashboard/reports'), color: 'bg-red-500' },
  ];

  // Enhanced manager metrics
  const managerMetrics = teamMetrics ? [
    {
      title: 'Team Members',
      value: teamMetrics.totalTeamMembers.toString(),
      change: { value: `${teamMembers.filter(m => m.status === 'online').length} online now`, trend: 'up' as const },
      icon: Users
    },
    {
      title: 'Active Tasks',
      value: teamMetrics.activeTasks.toString(),
      change: { value: `${teamMetrics.overdueTasks} overdue tasks`, trend: teamMetrics.overdueTasks > 0 ? 'down' as const : 'neutral' as const },
      icon: CheckSquare
    },
    {
      title: 'Team Performance',
      value: `${teamMetrics.teamPerformance}%`,
      change: { value: `${teamMetrics.productivityScore}% productivity`, trend: 'up' as const },
      icon: Target
    },
    {
      title: 'Attendance Rate',
      value: `${teamMetrics.attendanceRate}%`,
      change: { value: `${teamMetrics.completedThisWeek} tasks completed`, trend: 'up' as const },
      icon: UserCheck
    },
    {
      title: 'Completed Tasks',
      value: teamMetrics.completedThisWeek.toString(),
      change: { value: 'This week', trend: 'up' as const },
      icon: Award
    },
    {
      title: 'Upcoming Deadlines',
      value: teamMetrics.upcomingDeadlines.toString(),
      change: { value: 'Next 7 days', trend: 'neutral' as const },
      icon: Clock
    }
  ] : [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="dashboard-container space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="mobile-text-lg sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Users className="mobile-icon-lg sm:h-8 sm:w-8 text-primary" />
            Manager Dashboard
          </h1>
          <p className="mobile-text-sm text-muted-foreground">
            Manage your team performance, tasks, and workforce scheduling
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="mobile-text-xs sm:text-sm">
            <Users className="mobile-icon sm:h-4 sm:w-4 mr-1" />
            {teamMembers.length} Team Members
          </Badge>
        </div>
      </div>

      {/* Manager Metrics */}
      <div className="mobile-responsive-grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {managerMetrics.map((metric, index) => {
          const variants = ['primary', 'secondary', 'accent', 'success', 'warning', 'info'] as const;
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

      {/* Quick Actions Hub */}
      <Card className="mobile-card bg-gradient-card shadow-xl border-0">
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="flex items-center gap-2 mobile-text-base">
            <Target className="mobile-icon-lg" />
            Management Hub
          </CardTitle>
          <CardDescription className="mobile-text-xs">Essential team management tools and actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Button
                  key={index}
                  variant="outline"
                  className={`touch-target h-auto p-3 flex flex-col items-center gap-2 hover:bg-primary/5 active:bg-primary/10 transition-all duration-200`}
                  onClick={action.action}
                >
                  <div className={`h-6 w-6 sm:h-8 sm:w-8 rounded-lg flex items-center justify-center ${action.color || 'bg-primary'} text-white`}>
                    <Icon className="mobile-icon sm:h-4 sm:w-4" />
                  </div>
                  <div className="text-center">
                    <div className="font-medium mobile-text-xs sm:text-xs leading-tight">{action.title}</div>
                    <div className="mobile-text-xs text-muted-foreground mt-1 hidden sm:block">{action.description}</div>
                  </div>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Main Dashboard Content - Primary Management Tools */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Team Performance Overview */}
        <Card className="mobile-card bg-gradient-card shadow-xl border-0">
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="flex items-center gap-2 mobile-text-base">
              <TrendingUp className="mobile-icon-lg" />
              Team Performance
            </CardTitle>
            <CardDescription className="mobile-text-xs">Individual team member performance metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            {teamMembers.slice(0, 6).map((member) => {
              const getStatusColor = (status: string) => {
                switch (status) {
                  case 'online': return 'bg-green-500';
                  case 'away': return 'bg-yellow-500';
                  case 'offline': return 'bg-gray-500';
                  default: return 'bg-gray-500';
                }
              };
              
              return (
                <div key={member.id} className="flex items-center justify-between p-3 rounded-lg border bg-background/50">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-primary text-white flex items-center justify-center font-medium mobile-text-xs">
                        {member.avatar}
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 border-white ${getStatusColor(member.status)}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium mobile-text-xs sm:text-sm truncate">{member.name}</div>
                      <div className="mobile-text-xs text-muted-foreground">
                        {member.position} • {member.lastActivity}
                      </div>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="mobile-text-xs sm:text-sm font-bold text-primary">{member.performance}%</div>
                    <div className="mobile-text-xs text-muted-foreground">
                      {member.tasksActive} active • {member.tasksCompleted} done
                    </div>
                  </div>
                </div>
              );
            })}
            <Button 
              variant="outline" 
              className="touch-target w-full"
              onClick={() => navigate('/dashboard/analytics?view=team')}
            >
              <BarChart3 className="mobile-icon sm:h-4 sm:w-4 mr-2" />
              Detailed Team Analytics
            </Button>
          </CardContent>
        </Card>

        {/* Active Tasks Management */}
        <Card className="mobile-card bg-gradient-card shadow-xl border-0">
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="flex items-center gap-2 mobile-text-base">
              <CheckSquare className="mobile-icon-lg" />
              Active Tasks
            </CardTitle>
            <CardDescription className="mobile-text-xs">Current team tasks and their progress</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            {activeTasks.map((task) => {
              const getStatusColor = (status: string) => {
                switch (status) {
                  case 'completed': return 'bg-green-100 text-green-800 border-green-200';
                  case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
                  case 'review': return 'bg-purple-100 text-purple-800 border-purple-200';
                  case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
                  case 'overdue': return 'bg-red-100 text-red-800 border-red-200';
                  default: return 'bg-gray-100 text-gray-800 border-gray-200';
                }
              };
              
              const getPriorityColor = (priority: string) => {
                switch (priority) {
                  case 'urgent': return 'bg-red-500 animate-pulse';
                  case 'high': return 'bg-orange-500';
                  case 'medium': return 'bg-yellow-500';
                  case 'low': return 'bg-green-500';
                  default: return 'bg-gray-500';
                }
              };
              
              return (
                <div key={task.id} className="space-y-2 sm:space-y-3">
                  <div className="flex items-start sm:items-center justify-between gap-2">
                    <div className="flex items-start sm:items-center gap-2 flex-1">
                      <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full mt-1 sm:mt-0 ${getPriorityColor(task.priority)}`} />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium mobile-text-xs sm:text-sm truncate">{task.title}</div>
                        <div className="mobile-text-xs text-muted-foreground">
                          {task.assignee} • Due: {task.dueDate} • {task.estimatedHours}h
                        </div>
                      </div>
                    </div>
                    <Badge className={`mobile-text-xs flex-shrink-0 ${getStatusColor(task.status)}`}>
                      {task.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between mobile-text-xs">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{task.progress}%</span>
                    </div>
                    <Progress value={task.progress} className="h-2" />
                  </div>
                </div>
              );
            })}
            <Button 
              className="touch-target w-full"
              onClick={() => navigate('/dashboard/task-assignment')}
            >
              <CheckSquare className="mobile-icon sm:h-4 sm:w-4 mr-2" />
              Task Management
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Management Tools */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Workforce Scheduling */}
        <Card className="mobile-card bg-gradient-card shadow-xl border-0">
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="flex items-center gap-2 mobile-text-base">
              <Calendar className="mobile-icon-lg" />
              Today's Schedule
            </CardTitle>
            <CardDescription className="mobile-text-xs">Team schedule and attendance overview</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            {scheduleItems.map((schedule) => {
              const getScheduleStatusColor = (status: string) => {
                switch (status) {
                  case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
                  case 'scheduled': return 'bg-blue-100 text-blue-800 border-blue-200';
                  case 'late': return 'bg-orange-100 text-orange-800 border-orange-200';
                  case 'absent': return 'bg-red-100 text-red-800 border-red-200';
                  default: return 'bg-gray-100 text-gray-800 border-gray-200';
                }
              };
              
              return (
                <div key={schedule.id} className="flex items-center justify-between p-3 rounded-lg border bg-background/50">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium mobile-text-xs sm:text-sm truncate">{schedule.employeeName}</div>
                    <div className="mobile-text-xs text-muted-foreground">
                      {schedule.shift} • {schedule.hours}h scheduled
                    </div>
                  </div>
                  <Badge className={`mobile-text-xs flex-shrink-0 ${getScheduleStatusColor(schedule.status)}`}>
                    {schedule.status}
                  </Badge>
                </div>
              );
            })}
            <Button 
              variant="outline" 
              className="touch-target w-full"
              onClick={() => navigate('/dashboard/schedule')}
            >
              <Calendar className="mobile-icon sm:h-4 sm:w-4 mr-2" />
              Manage Schedule
            </Button>
          </CardContent>
        </Card>

        {/* Team Alerts & Notifications */}
        <Card className="mobile-card bg-gradient-card shadow-xl border-0">
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="flex items-center gap-2 mobile-text-base">
              <AlertCircle className="mobile-icon-lg" />
              Team Alerts
            </CardTitle>
            <CardDescription className="mobile-text-xs">Important notifications and action items</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            {/* Performance Alerts */}
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg border bg-background/50">
                <div className="h-2 w-2 rounded-full mt-2 bg-red-500 animate-pulse" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium mobile-text-xs sm:text-sm">Performance Review Due</div>
                  <div className="mobile-text-xs text-muted-foreground">
                    Mike Johnson's quarterly review is overdue
                  </div>
                </div>
                <Badge variant="destructive" className="mobile-text-xs flex-shrink-0">Urgent</Badge>
              </div>
              
              <div className="flex items-start gap-3 p-3 rounded-lg border bg-background/50">
                <div className="h-2 w-2 rounded-full mt-2 bg-yellow-500" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium mobile-text-xs sm:text-sm">Leave Request Pending</div>
                  <div className="mobile-text-xs text-muted-foreground">
                    Sarah Wilson requests 3 days leave next week
                  </div>
                </div>
                <Badge variant="secondary" className="mobile-text-xs flex-shrink-0">Review</Badge>
              </div>
              
              <div className="flex items-start gap-3 p-3 rounded-lg border bg-background/50">
                <div className="h-2 w-2 rounded-full mt-2 bg-blue-500" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium mobile-text-xs sm:text-sm">Team Meeting Scheduled</div>
                  <div className="mobile-text-xs text-muted-foreground">
                    Weekly standup tomorrow at 10:00 AM
                  </div>
                </div>
                <Badge variant="outline" className="mobile-text-xs flex-shrink-0">Info</Badge>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                size="sm"
                className="touch-target"
                onClick={() => navigate('/dashboard/leave-request')}
              >
                <FileText className="mobile-icon sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="mobile-text-xs">Leave Requests</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="touch-target"
                onClick={() => navigate('/dashboard/performance')}
              >
                <Star className="mobile-icon sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="mobile-text-xs">Reviews</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ManagerDashboard;