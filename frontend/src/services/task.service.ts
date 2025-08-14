import { apiService } from './api.service';

// A more specific type can be defined based on the actual API response
export interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  assignedBy: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'in_progress' | 'completed' | 'cancelled';
  dueDate: string | null;
  createdAt: string;
}

export type CreateTaskData = Omit<Task, 'id' | 'createdAt' | 'assignedBy'>;
export type UpdateTaskData = Partial<CreateTaskData>;

export interface TaskSearchFilters {
  search?: string;
  status?: string;
  priority?: string;
  assignee?: string; // 'me' or 'assigned-by-me'
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface TaskStatistics {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  overdue: number;
}

class TaskService {
  public async searchTasks(filters: TaskSearchFilters): Promise<{ tasks: Task[], total: number }> {
    try {
      const response = await apiService.get('/tasks/search', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Failed to search tasks:', error);
      throw error;
    }
  }

  public async getTaskById(id: string): Promise<Task> {
    try {
      const response = await apiService.get(`/tasks/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch task ${id}:`, error);
      throw error;
    }
  }

  public async createTask(data: CreateTaskData): Promise<Task> {
    try {
      const response = await apiService.post('/tasks', data);
      return response.data.task;
    } catch (error) {
      console.error('Failed to create task:', error);
      throw error;
    }
  }

  public async updateTask(id: string, data: UpdateTaskData): Promise<Task> {
    try {
      const response = await apiService.put(`/tasks/${id}`, data);
      return response.data.task;
    } catch (error) {
      console.error(`Failed to update task ${id}:`, error);
      throw error;
    }
  }

  public async deleteTask(id: string): Promise<void> {
    try {
      await apiService.delete(`/tasks/${id}`);
    } catch (error) {
      console.error(`Failed to delete task ${id}:`, error);
      throw error;
    }
  }

  public async getMyTasks(): Promise<Task[]> {
    try {
      const response = await apiService.get('/tasks/my-tasks');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch user tasks:', error);
      throw error;
    }
  }

  public async getTaskStatistics(departmentId?: string): Promise<TaskStatistics> {
    try {
      const params = departmentId ? { departmentId } : {};
      const response = await apiService.get('/tasks/statistics', { params });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch task statistics:', error);
      throw error;
    }
  }
}

export const taskService = new TaskService();
