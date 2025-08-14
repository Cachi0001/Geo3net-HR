import { apiService } from './api.service';

// A more specific type can be defined based on the actual API response
export interface Task {
  id: string;
  title: string;
  status: 'pending' | 'in-progress' | 'completed';
  dueDate: string;
}

class TaskService {
  public async getMyTasks(): Promise<Task[]> {
    try {
      const response = await apiService.get('/tasks/my-tasks');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch user tasks:', error);
      // Depending on global error handling, you might re-throw or return a default
      throw error;
    }
  }
}

export const taskService = new TaskService();
