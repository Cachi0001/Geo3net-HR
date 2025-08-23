import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  BarChart3, 
  Clock, 
  Target, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Users, 
  Calendar,
  Filter,
  RefreshCw,
  Download,
  Eye,
  Loader2
} from 'lucide-react';
import { apiClient } from '@/services/api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface TaskProgress {
  id: string;
  title: string;
  assignee: {
    name: string;
    avatar: string;
    department: string;
  };
  department: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'in_progress' | 'review' | 'completed' | 'cancelled';
  progress: number;
  dueDate: string;
  createdAt: string;
  estimatedHours: number;
  actualHours?: number;
  timeSpent: number;
  efficiency: number;
  blockers: string[];
  lastUpdate: string;
}

interface ProgressAnalytics {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  averageProgress: number;
  averageEfficiency: number;
  departmentProgress: { [key: string]: number };
  priorityDistribution: { [key: string]: number };
  weeklyProgress: { week: string; completed: number; created: number }[];
}

const TaskProgressMonitor: React.FC = () => {
  const [tasks, setTasks] = useState<TaskProgress[]>([]);
  const [analytics, setAnalytics] = useState<ProgressAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('30');
  const { toast } = useToast();

  const loadTaskProgress = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.getTasks();
      
      if (response.success && response.data && response.data.tasks) {
        // Transform tasks to include progress tracking data
        const tasksWithProgress = response.data.tasks.map((task: any) => ({
          ...task,
          timeSpent: task.actualHours || 0,
          efficiency: task.estimatedHours > 0 ? 
            Math.min(100, ((task.estimatedHours - (task.actualHours || 0)) / task.estimatedHours) * 100) : 100,
          blockers: task.blockers || [],
          lastUpdate: task.updatedAt || task.createdAt
        }));
        
        setTasks(tasksWithProgress);
        calculateAnalytics(tasksWithProgress);
      } else {
        setTasks([]);
        setAnalytics(null);
      }
    } catch (error) {
      console.warn('API not available:', error);
      setTasks([]);
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const calculateAnalytics = (taskList: TaskProgress[]) => {
    const totalTasks = taskList.length;
    const completedTasks = taskList.filter(t => t.status === 'completed').length;
    const inProgressTasks = taskList.filter(t => t.status === 'in_progress').length;
    const overdueTasks = taskList.filter(t => new Date(t.dueDate) < new Date() && t.status !== 'completed').length;
    
    const averageProgress = taskList.reduce((sum, task) => sum + task.progress, 0) / totalTasks;
    const averageEfficiency = taskList.reduce((sum, task) => sum + task.efficiency, 0) / totalTasks;
    
    // Department progress
    const departmentProgress: { [key: string]: number } = {};
    const departmentCounts: { [key: string]: number } = {};
    
    taskList.forEach(task => {
      if (!departmentProgress[task.department]) {
        departmentProgress[task.department] = 0;
        departmentCounts[task.department] = 0;
      }
      departmentProgress[task.department] += task.progress;
      departmentCounts[task.department]++;
    });
    
    Object.keys(departmentProgress).forEach(dept => {
      departmentProgress[dept] = departmentProgress[dept] / departmentCounts[dept];
    });
    
    // Priority distribution
    const priorityDistribution: { [key: string]: number } = {
      low: taskList.filter(t => t.priority === 'low').length,
      medium: taskList.filter(t => t.priority === 'medium').length,
      high: taskList.filter(t => t.priority === 'high').length,
      urgent: taskList.filter(t => t.priority === 'urgent').length
    };
    
    // Weekly progress (mock data)
    const weeklyProgress = [
      { week: 'Week 1', completed: 12, created: 15 },
      { week: 'Week 2', completed: 18, created: 20 },
      { week: 'Week 3', completed: 15, created: 12 },
      { week: 'Week 4', completed: 22, created: 18 }
    ];
    
    setAnalytics({
      totalTasks,
      completedTasks,
      inProgressTasks,
      overdueTasks,
      averageProgress,
      averageEfficiency,
      departmentProgress,
      priorityDistribution,
      weeklyProgress
    });
  };



  const filteredTasks = tasks.filter(task => {
    if (departmentFilter !== 'all' && task.department !== departmentFilter) return false;
    if (statusFilter !== 'all' && task.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'review': return 'bg-yellow-500';
      case 'todo': return 'bg-gray-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 90) return 'text-green-600';
    if (efficiency >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  useEffect(() => {
    loadTaskProgress();
  }, [loadTaskProgress]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading task progress data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Task Progress Monitor
          </h2>
          <p className="text-muted-foreground mt-1">Real-time task progress tracking and analytics</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadTaskProgress}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Analytics Overview */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Total Tasks</p>
                  <p className="text-2xl font-bold text-blue-900">{analytics.totalTasks}</p>
                </div>
                <Target className="h-8 w-8 text-blue-500" />
              </div>
              <div className="mt-2">
                <p className="text-xs text-blue-600">
                  {analytics.completedTasks} completed ({Math.round((analytics.completedTasks / analytics.totalTasks) * 100)}%)
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Avg Progress</p>
                  <p className="text-2xl font-bold text-green-900">{Math.round(analytics.averageProgress)}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
              <div className="mt-2">
                <Progress value={analytics.averageProgress} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-600">In Progress</p>
                  <p className="text-2xl font-bold text-yellow-900">{analytics.inProgressTasks}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
              <div className="mt-2">
                <p className="text-xs text-yellow-600">
                  {analytics.overdueTasks} overdue tasks
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Efficiency</p>
                  <p className="text-2xl font-bold text-purple-900">{Math.round(analytics.averageEfficiency)}%</p>
                </div>
                <CheckCircle className="h-8 w-8 text-purple-500" />
              </div>
              <div className="mt-2">
                <p className="text-xs text-purple-600">
                  Team performance metric
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Department</label>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="Engineering">Engineering</SelectItem>
                  <SelectItem value="Design">Design</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Sales">Sales</SelectItem>
                  <SelectItem value="HR">Human Resources</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Priority</label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Time Range</label>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Last 30 days" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task Progress List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Task Progress Details
          </CardTitle>
          <CardDescription>
            Showing {filteredTasks.length} of {tasks.length} tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredTasks.map((task) => (
              <div key={task.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-lg">{task.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getPriorityColor(task.priority)}>
                            {task.priority.toUpperCase()}
                          </Badge>
                          <Badge variant="outline">
                            {task.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {task.department}
                          </span>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                      <div>
                        <p className="text-sm font-medium mb-1">Progress</p>
                        <div className="flex items-center gap-2">
                          <Progress value={task.progress} className="flex-1 h-2" />
                          <span className="text-sm font-medium">{task.progress}%</span>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium mb-1">Time Tracking</p>
                        <div className="text-sm text-muted-foreground">
                          {task.timeSpent}h / {task.estimatedHours}h
                          <span className={`ml-2 font-medium ${getEfficiencyColor(task.efficiency)}`}>
                            ({Math.round(task.efficiency)}% efficiency)
                          </span>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium mb-1">Due Date</p>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span className={`text-sm ${
                            new Date(task.dueDate) < new Date() && task.status !== 'completed'
                              ? 'text-red-600 font-medium'
                              : 'text-muted-foreground'
                          }`}>
                            {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                          {new Date(task.dueDate) < new Date() && task.status !== 'completed' && (
                            <AlertTriangle className="h-3 w-3 text-red-500" />
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 bg-gradient-primary rounded-full flex items-center justify-center text-white text-xs font-semibold">
                          {task.assignee.avatar}
                        </div>
                        <span className="text-sm font-medium">{task.assignee.name}</span>
                      </div>
                      
                      {task.blockers.length > 0 && (
                        <div className="flex items-center gap-1">
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm text-yellow-600">
                            {task.blockers.length} blocker{task.blockers.length > 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {task.blockers.length > 0 && (
                      <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                        <p className="text-sm font-medium text-yellow-800 mb-1">Blockers:</p>
                        <ul className="text-sm text-yellow-700">
                          {task.blockers.map((blocker, index) => (
                            <li key={index}>• {blocker}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {filteredTasks.length === 0 && (
              <div className="text-center py-8">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">No tasks found</h3>
                <p className="text-sm text-muted-foreground">Try adjusting your filters to see more tasks.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TaskProgressMonitor;