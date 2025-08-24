import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  CheckSquare, 
  Clock, 
  Calendar, 
  User, 
  AlertCircle, 
  CheckCircle, 
  Plus,
  Search,
  Filter,
  MoreVertical,
  Loader2,
  Wifi,
  WifiOff
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  assignedBy: {
    id: string;
    name: string;
    role: string;
  };
  project?: string;
  estimatedHours?: number;
  actualHours?: number;
  createdAt: string;
  updatedAt: string;
}

interface TaskUpdate {
  status?: string;
  actualHours?: number;
  notes?: string;
}

interface TaskProgressUpdate {
  taskId: string;
  status: string;
  actualHours?: number;
  progressNotes?: string;
  timestamp: string;
  updatedBy: {
    id: string;
    fullName: string;
  };
}

interface TaskStatusChangeNotification {
  taskId: string;
  oldStatus: string;
  newStatus: string;
  updatedBy: {
    id: string;
    fullName: string;
  };
  timestamp: string;
}

const TasksPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateForm, setUpdateForm] = useState<TaskUpdate>({
    status: '',
    actualHours: 0,
    notes: ''
  });
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);

  // No fallback data - all data should come from the API

  // WebSocket event handlers
  const handleTaskProgressUpdate = useCallback((update: TaskProgressUpdate) => {
    console.log('📊 Task progress update received:', update);
    
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === update.taskId 
          ? {
              ...task,
              status: update.status as 'pending' | 'in_progress' | 'completed' | 'overdue',
              actualHours: update.actualHours,
              updatedAt: update.timestamp
            }
          : task
      )
    );
    
    // Show toast notification
    toast({
      title: 'Task Updated',
      description: `Task progress updated by ${update.updatedBy.fullName}`
    });
  }, []);
  
  const handleTaskStatusChange = useCallback((notification: TaskStatusChangeNotification) => {
    console.log('🔄 Task status change received:', notification);
    
    // Show toast notification
    toast({
      title: 'Status Changed',
      description: `Task status changed from ${notification.oldStatus} to ${notification.newStatus} by ${notification.updatedBy.fullName}`
    });
  }, []);
  
  const handleWebSocketConnected = useCallback(() => {
    setIsWebSocketConnected(true);
    console.log('✅ WebSocket connected for real-time task updates');
  }, []);
  
  const handleWebSocketDisconnected = useCallback(() => {
    setIsWebSocketConnected(false);
    console.log('❌ WebSocket disconnected');
  }, []);

  useEffect(() => {
    loadTasks();
  }, [statusFilter, priorityFilter, searchTerm]);

  useEffect(() => {
    // Connect to WebSocket for real-time updates
    if (apiClient.connectWebSocket) {
      apiClient.connectWebSocket();
    }
    
    // Set up event listeners
    if (apiClient.on) {
      apiClient.on('task:progress_update', handleTaskProgressUpdate);
      apiClient.on('task:status_change', handleTaskStatusChange);
      apiClient.on('websocket:connected', handleWebSocketConnected);
      apiClient.on('websocket:disconnected', handleWebSocketDisconnected);
    }
    
    // Cleanup on unmount
    return () => {
      if (apiClient.off) {
        apiClient.off('task:progress_update', handleTaskProgressUpdate);
        apiClient.off('task:status_change', handleTaskStatusChange);
        apiClient.off('websocket:connected', handleWebSocketConnected);
        apiClient.off('websocket:disconnected', handleWebSocketDisconnected);
      }
      if (apiClient.disconnectWebSocket) {
        apiClient.disconnectWebSocket();
      }
    };
  }, [handleTaskProgressUpdate, handleTaskStatusChange, handleWebSocketConnected, handleWebSocketDisconnected]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      
      // Try to load from API first
      const response = await apiClient.getMyTasks();
      
      if (response.success && response.data) {
        let apiTasks = response.data;
        
        // Apply additional filters
        if (statusFilter !== 'all') {
          apiTasks = apiTasks.filter((task: Task) => task.status === statusFilter);
        }
        
        if (priorityFilter !== 'all') {
          apiTasks = apiTasks.filter((task: Task) => task.priority === priorityFilter);
        }
        
        if (searchTerm) {
          apiTasks = apiTasks.filter((task: Task) => 
            task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            task.description.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }
        
        setTasks(apiTasks);
        console.log('✅ Tasks loaded from API:', apiTasks.length);
      } else {
        throw new Error('API response was not successful');
      }
    } catch (error) {
      console.error('Failed to load tasks from API:', error);
      toast({
        title: 'Error',
        description: 'Failed to load tasks from server. Please try again later.',
        variant: 'destructive'
      });
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTask = async () => {
    if (!selectedTask) return;

    try {
      const response = await apiClient.updateTask(`/api/tasks/${selectedTask.id}`, updateForm);
      
      if (response.data && typeof response.data === 'object' && 'success' in response.data && response.data.success) {
        toast({
          title: 'Success',
          description: 'Task updated successfully'
        });
        setShowUpdateModal(false);
        loadTasks();
      } else {
        throw new Error('Failed to update task');
      }
    } catch (error) {
      console.error('Failed to update task:', error);
      toast({
        title: 'Error',
        description: 'Failed to update task. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      in_progress: { color: 'bg-blue-100 text-blue-800', icon: CheckSquare },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      overdue: { color: 'bg-red-100 text-red-800', icon: AlertCircle }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <Badge className={`${config.color} border-0`}>
        <Icon className="h-3 w-3 mr-1" />
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityColors = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-orange-100 text-orange-800',
      high: 'bg-red-100 text-red-800'
    };
    
    return (
      <Badge className={`${priorityColors[priority as keyof typeof priorityColors]} border-0`}>
        {priority.toUpperCase()}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Tasks are already filtered in loadTasks function
  const filteredTasks = tasks;

  const openUpdateModal = (task: Task) => {
    setSelectedTask(task);
    setUpdateForm({
      status: task.status,
      actualHours: task.actualHours || 0,
      notes: ''
    });
    setShowUpdateModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading tasks...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">My Tasks</h1>
            <div className="flex items-center gap-2">
              {isWebSocketConnected ? (
                <div className="flex items-center gap-1 text-green-600">
                  <Wifi className="h-4 w-4" />
                  <span className="text-sm font-medium">Live Updates</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-gray-400">
                  <WifiOff className="h-4 w-4" />
                  <span className="text-sm">Offline</span>
                </div>
              )}
            </div>
          </div>
          <p className="text-muted-foreground mt-1">Manage your assigned tasks and track progress</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Tasks</p>
                <p className="text-2xl font-bold">{tasks.length}</p>
              </div>
              <CheckSquare className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold">{tasks.filter(t => t.status === 'in_progress').length}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{tasks.filter(t => t.status === 'completed').length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold">{tasks.filter(t => t.status === 'overdue').length}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks by title, description, or project..."
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
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="overdue">Overdue</option>
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
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tasks List */}
      <div className="grid gap-4">
        {filteredTasks.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <CheckSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">No tasks found</h3>
              <p className="text-sm text-muted-foreground">
                {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'You have no tasks assigned at the moment'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredTasks.map((task) => (
            <Card key={task.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{task.title}</h3>
                      {getStatusBadge(task.status)}
                      {getPriorityBadge(task.priority)}
                    </div>
                    
                    <p className="text-muted-foreground mb-4">{task.description}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Due:</span>
                        <span className={`font-medium ${
                          new Date(task.dueDate) < new Date() && task.status !== 'completed' 
                            ? 'text-red-600' 
                            : 'text-foreground'
                        }`}>
                          {formatDate(task.dueDate)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Assigned by:</span>
                        <span className="font-medium">{task.assignedBy.name}</span>
                      </div>
                      
                      {task.project && (
                        <div className="flex items-center gap-2">
                          <CheckSquare className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Project:</span>
                          <span className="font-medium">{task.project}</span>
                        </div>
                      )}
                    </div>
                    
                    {(task.estimatedHours || task.actualHours) && (
                      <div className="mt-4 flex items-center gap-4 text-sm">
                        {task.estimatedHours && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Estimated:</span>
                            <span className="font-medium">{task.estimatedHours}h</span>
                          </div>
                        )}
                        {task.actualHours && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Actual:</span>
                            <span className="font-medium">{task.actualHours}h</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openUpdateModal(task)}>
                        Update Task
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Update Task Modal */}
      <Dialog open={showUpdateModal} onOpenChange={setShowUpdateModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Update Task</DialogTitle>
            <DialogDescription>
              Update the status and progress of your task.
            </DialogDescription>
          </DialogHeader>
          
          {selectedTask && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={updateForm.status}
                  onChange={(e) => setUpdateForm(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground mt-1"
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              
              <div>
                <Label htmlFor="actualHours">Actual Hours Worked</Label>
                <Input
                  id="actualHours"
                  type="number"
                  min="0"
                  step="0.5"
                  value={updateForm.actualHours}
                  onChange={(e) => setUpdateForm(prev => ({ ...prev, actualHours: parseFloat(e.target.value) || 0 }))}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="notes">Progress Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={updateForm.notes}
                  onChange={(e) => setUpdateForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Add any notes about your progress..."
                  className="mt-1"
                  rows={3}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpdateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateTask}>
              Update Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TasksPage;