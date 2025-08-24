import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/services/api';
import { 
  CheckSquare, 
  Clock, 
  AlertCircle, 
  Search, 
  Plus, 
  Calendar,
  Target,
  Flag,
  Loader2,
  UserPlus
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

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
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'todo' | 'review';
  dueDate: string;
  createdAt: string;
  progress?: number;
  estimatedHours?: number;
  actualHours?: number;
  tags?: string[];
}

const TaskAssignmentPage: React.FC = () => {
  const { user, isLoadingUser } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<any[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newAssignee, setNewAssignee] = useState('');
  const { toast } = useToast();

  // Show loading state while checking authentication
  if (isLoadingUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
          <p className="text-muted-foreground">Please log in to access the task assignment system.</p>
        </div>
      </div>
    );
  }

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assignedTo: '',
    priority: 'medium',
    dueDate: '',
    estimatedHours: '',
    tags: ''
  });

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.getTasks();
      if (response.success && response.data && response.data.tasks) {
        setTasks(response.data.tasks);
      } else {
        console.warn('No task data received from API');
        setTasks([]);
        toast({
          title: 'Info',
          description: 'No tasks found. Create your first task.',
          variant: 'default'
        });
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
      toast({
        title: 'Error',
        description: 'Failed to load tasks. Please check your connection.',
        variant: 'destructive'
      });
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const loadEmployees = useCallback(async () => {
    try {
      const response = await apiClient.getEmployees();
      if (response.success && response.data) {
        setEmployees(response.data.employees || []);
      }
    } catch (error) {
      console.error('Failed to load employees:', error);
    }
  }, []);

  useEffect(() => {
    loadTasks();
    loadEmployees();
  }, [loadTasks, loadEmployees]);

  const filteredTasks = (tasks || []).filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo': return 'bg-gray-100 text-gray-800';
      case 'in_progress': return 'bg-blue-500 text-white';
      case 'review': return 'bg-orange-500 text-white';
      case 'completed': return 'bg-green-500 text-white';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  async function handleCreateTask() {
    if (!newTask.title || !newTask.description || !newTask.assignedTo || !newTask.dueDate) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiClient.createTask(newTask);
      if (response.success) {
        toast({ title: 'Success', description: 'Task created successfully!' });
        setIsCreateModalOpen(false);
        setNewTask({ title: '', description: '', assignedTo: '', priority: 'medium', dueDate: '', estimatedHours: '', tags: '' });
        loadTasks();
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create task.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleReassignTask(task: Task) {
    setSelectedTask(task);
    setNewAssignee(task.assignedTo || '');
    setIsAssignModalOpen(true);
  }

  async function handleAssignTask() {
    if (!selectedTask || !newAssignee) {
      toast({
        title: 'Error',
        description: 'Please select an employee to assign the task to.',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiClient.assignTask(selectedTask.id, newAssignee);
      if (response.success) {
        toast({ 
          title: 'Success', 
          description: 'Task assigned successfully!' 
        });
        setIsAssignModalOpen(false);
        setSelectedTask(null);
        setNewAssignee('');
        loadTasks();
      } else {
        toast({ 
          title: 'Error', 
          description: response.message || 'Failed to assign task.', 
          variant: 'destructive' 
        });
      }
    } catch (error) {
      console.error('Failed to assign task:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to assign task. Please try again.', 
        variant: 'destructive' 
      });
    } finally {
      setIsSubmitting(false);
    }
  }

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Task Assignment</h1>
          <p className="text-muted-foreground">Manage and track project tasks and assignments</p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="btn-primary">
              <Plus className="h-4 w-4 mr-2" />
              Create Task
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
              <DialogDescription>Create a new task and assign it to a team member.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Title</Label>
                <Input
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                  placeholder="Enter task title"
                />
              </div>
              <div className="grid gap-2">
                <Label>Description</Label>
                <Textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                  placeholder="Enter task description"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Assign To</Label>
                  <Select value={newTask.assignedTo} onValueChange={(value) => setNewTask({...newTask, assignedTo: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Priority</Label>
                  <Select value={newTask.priority} onValueChange={(value) => setNewTask({...newTask, priority: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateTask} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Create Task
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Task Assignment Modal */}
        <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Reassign Task</DialogTitle>
              <DialogDescription>
                Assign "{selectedTask?.title}" to a different team member.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Current Assignee</Label>
                <div className="p-2 bg-muted rounded-md text-sm">
                  {selectedTask?.assignee?.name || 'Unassigned'}
                </div>
              </div>
              <div className="grid gap-2">
                <Label>New Assignee</Label>
                <Select value={newAssignee} onValueChange={setNewAssignee}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAssignModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAssignTask} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Assign Task
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border rounded-md bg-background"
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
                className="px-3 py-2 border rounded-md bg-background"
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTasks.map((task) => (
          <Card key={task.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={`${getStatusColor(task.status)} text-xs`}>
                      {task.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <CardTitle className="text-base">{task.title}</CardTitle>
                  <CardDescription className="text-sm">{task.description}</CardDescription>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleReassignTask(task)}
                >
                  <UserPlus className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                  {task.assignee?.avatar || 'N/A'}
                </div>
                <div>
                  <p className="font-medium text-sm">{task.assignee?.name || 'Unassigned'}</p>
                  <p className="text-xs text-muted-foreground">{task.assignee?.department || 'No Department'}</p>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Progress</span>
                  <span className="text-sm text-muted-foreground">{task.progress || 0}%</span>
                </div>
                <Progress value={task.progress || 0} className="h-2" />
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  <span>Created: {formatDate(task.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Flag className="h-3 w-3" />
                  <span>Due: {formatDate(task.dueDate)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTasks.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <CheckSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No tasks found</h3>
            <p className="text-muted-foreground">Try adjusting your search criteria or filters.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TaskAssignmentPage;