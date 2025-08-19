import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/services/api';
import { 
  CheckSquare, 
  Clock, 
  Users, 
  AlertCircle, 
  Search, 
  Plus, 
  Filter,
  Calendar,
  User,
  Building2,
  Target,
  TrendingUp,
  MoreVertical,
  Flag,
  Loader2
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string;
  assignee?: {
    name: string;
    avatar: string;
    department: string;
  };
  assignedTo?: string;
  assignedToUser?: {
    fullName: string;
    email: string;
    department?: {
      name: string;
    };
  };
  department?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  dueDate: string;
  createdAt: string;
  updatedAt?: string;
  estimatedHours?: number;
  actualHours?: number;
  tags?: string[];
  createdBy?: string;
  projectId?: string;
  departmentId?: string;
}

// Fallback data for when API is unavailable
const fallbackTasks: Task[] = [
  {
    id: '1',
    title: 'Implement User Authentication System',
    description: 'Design and develop a secure user authentication system with JWT tokens and role-based access control.',
    assignee: {
      name: 'John Doe',
      avatar: 'JD',
      department: 'Engineering'
    },
    department: 'Engineering',
    priority: 'high',
    status: 'in_progress',
    dueDate: '2024-02-15',
    createdAt: '2024-01-20',
    progress: 65,
    estimatedHours: 40,
    actualHours: 26,
    tags: ['Backend', 'Security', 'Authentication']
  },
  {
    id: '2',
    title: 'Design Landing Page Mockups',
    description: 'Create high-fidelity mockups for the new company landing page with modern UI/UX principles.',
    assignee: {
      name: 'Jane Smith',
      avatar: 'JS',
      department: 'Design'
    },
    department: 'Design',
    priority: 'medium',
    status: 'review',
    dueDate: '2024-02-10',
    createdAt: '2024-01-25',
    progress: 90,
    estimatedHours: 20,
    actualHours: 18,
    tags: ['UI/UX', 'Mockups', 'Landing Page']
  },
  {
    id: '3',
    title: 'Social Media Campaign Strategy',
    description: 'Develop a comprehensive social media strategy for Q1 2024 including content calendar and KPIs.',
    assignee: {
      name: 'Mike Johnson',
      avatar: 'MJ',
      department: 'Marketing'
    },
    department: 'Marketing',
    priority: 'urgent',
    status: 'todo',
    dueDate: '2024-02-05',
    createdAt: '2024-01-28',
    progress: 0,
    estimatedHours: 30,
    tags: ['Social Media', 'Strategy', 'Content']
  },
  {
    id: '4',
    title: 'Employee Onboarding Process Review',
    description: 'Review and optimize the current employee onboarding process to improve new hire experience.',
    assignee: {
      name: 'Sarah Wilson',
      avatar: 'SW',
      department: 'Human Resources'
    },
    department: 'Human Resources',
    priority: 'medium',
    status: 'completed',
    dueDate: '2024-01-30',
    createdAt: '2024-01-15',
    progress: 100,
    estimatedHours: 15,
    actualHours: 14,
    tags: ['HR', 'Process', 'Onboarding']
  },
  {
    id: '5',
    title: 'Q4 Sales Report Analysis',
    description: 'Analyze Q4 sales data and prepare comprehensive report with insights and recommendations.',
    assignee: {
      name: 'David Brown',
      avatar: 'DB',
      department: 'Sales'
    },
    department: 'Sales',
    priority: 'high',
    status: 'in_progress',
    dueDate: '2024-02-08',
    createdAt: '2024-01-22',
    progress: 45,
    estimatedHours: 25,
    actualHours: 12,
    tags: ['Sales', 'Analysis', 'Report']
  },
  {
    id: '6',
    title: 'Database Performance Optimization',
    description: 'Optimize database queries and improve overall system performance by 30%.',
    assignee: {
      name: 'Alex Chen',
      avatar: 'AC',
      department: 'Engineering'
    },
    department: 'Engineering',
    priority: 'high',
    status: 'todo',
    dueDate: '2024-02-20',
    createdAt: '2024-01-30',
    progress: 0,
    estimatedHours: 35,
    tags: ['Database', 'Performance', 'Optimization']
  }
];

const TaskAssignmentPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadTasks();
    loadTaskStatistics();
  }, [loadTasks, loadTaskStatistics]);

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.getTasks();
      if (response.success && response.data) {
        // Transform API data to match our interface
        const transformedTasks = response.data.map((task: any) => ({
          ...task,
          assignee: task.assignedToUser ? {
            name: task.assignedToUser.fullName || 'Unassigned',
            avatar: task.assignedToUser.fullName ? task.assignedToUser.fullName.split(' ').map((n: string) => n[0]).join('') : 'UN',
            department: task.assignedToUser.department?.name || 'No Department'
          } : {
            name: 'Unassigned',
            avatar: 'UN',
            department: 'No Department'
          },
          status: task.status === 'pending' ? 'todo' : task.status,
          createdDate: task.createdAt,
          progress: task.status === 'completed' ? 100 : task.status === 'in_progress' ? 50 : 0,
          tags: task.tags || []
        }));
        setTasks(transformedTasks);
      } else {
        throw new Error('Failed to fetch tasks');
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
      toast({
        title: 'Error',
        description: 'Failed to load tasks. Using fallback data.',
        variant: 'destructive'
      });
      setTasks(fallbackTasks);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const loadTaskStatistics = useCallback(async () => {
    try {
      const response = await apiClient.getTaskStatistics();
      if (response.success && response.data) {
        setStatistics(response.data);
      }
    } catch (error) {
      console.error('Failed to load task statistics:', error);
    }
  }, []);

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.assignee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo': return 'bg-gray-100 text-gray-800';
      case 'in_progress': return 'bg-gradient-primary text-white';
      case 'review': return 'bg-gradient-accent text-white';
      case 'completed': return 'bg-gradient-secondary text-white';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-cyan-500';
      case 'medium': return 'bg-orange-500';
      case 'high': return 'bg-pink-500';
      case 'urgent': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'todo': return <Clock className="h-4 w-4" />;
      case 'in_progress': return <Target className="h-4 w-4" />;
      case 'review': return <AlertCircle className="h-4 w-4" />;
      case 'completed': return <CheckSquare className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  // Use API statistics if available, otherwise calculate from tasks
  const taskStats = {
    total: statistics?.totalTasks || tasks.length,
    todo: statistics?.todoTasks || tasks.filter(t => t.status === 'todo').length,
    inProgress: statistics?.inProgressTasks || tasks.filter(t => t.status === 'in_progress').length,
    review: statistics?.reviewTasks || tasks.filter(t => t.status === 'review').length,
    completed: statistics?.completedTasks || tasks.filter(t => t.status === 'completed').length,
    overdue: statistics?.overdueTasks || tasks.filter(t => new Date(t.dueDate) < new Date() && t.status !== 'completed').length
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isOverdue = (dueDate: string, status: string) => {
    return new Date(dueDate) < new Date() && status !== 'completed';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading tasks...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Task Assignment</h1>
          <p className="text-muted-foreground mt-1">Manage and track project tasks and assignments</p>
        </div>
        <Button className="btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Create Task
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="metric-card">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="h-10 w-10 bg-gradient-primary rounded-lg flex items-center justify-center mx-auto mb-2">
                <CheckSquare className="h-5 w-5 text-white" />
              </div>
              <p className="text-2xl font-bold text-foreground">{taskStats.total}</p>
              <p className="text-xs text-muted-foreground">Total Tasks</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="metric-card">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="h-10 w-10 bg-gray-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <p className="text-2xl font-bold text-foreground">{taskStats.todo}</p>
              <p className="text-xs text-muted-foreground">To Do</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="metric-card">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="h-10 w-10 bg-gradient-accent rounded-lg flex items-center justify-center mx-auto mb-2">
                <Target className="h-5 w-5 text-white" />
              </div>
              <p className="text-2xl font-bold text-foreground">{taskStats.inProgress}</p>
              <p className="text-xs text-muted-foreground">In Progress</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="metric-card">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="h-10 w-10 bg-orange-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                <AlertCircle className="h-5 w-5 text-white" />
              </div>
              <p className="text-2xl font-bold text-foreground">{taskStats.review}</p>
              <p className="text-xs text-muted-foreground">Review</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="metric-card">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="h-10 w-10 bg-gradient-secondary rounded-lg flex items-center justify-center mx-auto mb-2">
                <CheckSquare className="h-5 w-5 text-white" />
              </div>
              <p className="text-2xl font-bold text-foreground">{taskStats.completed}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="metric-card">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="h-10 w-10 bg-red-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                <AlertCircle className="h-5 w-5 text-white" />
              </div>
              <p className="text-2xl font-bold text-foreground">{taskStats.overdue}</p>
              <p className="text-xs text-muted-foreground">Overdue</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-gradient-card shadow-lg border-0">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks by title, description, assignee, or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
              >
                <option value="all">All Status</option>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="review">Review</option>
                <option value="completed">Completed</option>
              </select>
              <select 
                value={priorityFilter} 
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
              >
                <option value="all">All Priority</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tasks Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredTasks.map((task) => (
          <Card key={task.id} className={`bg-gradient-card shadow-xl border-0 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 ${isOverdue(task.dueDate, task.status) ? 'ring-2 ring-red-200' : ''}`}>
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={`${getStatusColor(task.status)} text-xs px-2 py-1`}>
                      {getStatusIcon(task.status)}
                      <span className="ml-1 capitalize">{task.status.replace('_', ' ')}</span>
                    </Badge>
                    <div className={`h-3 w-3 ${getPriorityColor(task.priority)} rounded-full`} title={`${task.priority} priority`}></div>
                  </div>
                  <CardTitle className="text-lg leading-tight">{task.title}</CardTitle>
                  <CardDescription className="text-sm mt-1 line-clamp-2">{task.description}</CardDescription>
                </div>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Assignee */}
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-gradient-primary rounded-full flex items-center justify-center text-white text-sm font-semibold">
                  {task.assignee.avatar}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{task.assignee.name}</p>
                  <p className="text-xs text-muted-foreground">{task.assignee.department}</p>
                </div>
              </div>

              {/* Progress */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Progress</span>
                  <span className="text-sm text-muted-foreground">{task.progress}%</span>
                </div>
                <Progress value={task.progress} className="h-2" />
              </div>

              {/* Time Tracking */}
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-2 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                  <p className="text-lg font-bold text-blue-600">{task.estimatedHours}h</p>
                  <p className="text-xs text-blue-600">Estimated</p>
                </div>
                <div className="text-center p-2 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                  <p className="text-lg font-bold text-green-600">{task.actualHours || 0}h</p>
                  <p className="text-xs text-green-600">Actual</p>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1">
                {task.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs px-2 py-1">
                    {tag}
                  </Badge>
                ))}
              </div>

              {/* Dates */}
              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>Created: {formatDate(task.createdAt || task.createdDate)}</span>
                </div>
                <div className={`flex items-center gap-2 text-xs ${
                  isOverdue(task.dueDate, task.status) ? 'text-red-600 font-medium' : 'text-muted-foreground'
                }`}>
                  <Flag className="h-3 w-3" />
                  <span>Due: {formatDate(task.dueDate)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTasks.length === 0 && (
        <Card className="bg-gradient-card shadow-lg border-0">
          <CardContent className="p-12 text-center">
            <CheckSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No tasks found</h3>
            <p className="text-muted-foreground">Try adjusting your search criteria or filters.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TaskAssignmentPage;