export interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo?: string;
  assignedBy?: string;
  status: 'todo' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate: string;
  startDate?: string;
  completedDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  progress?: number;
  tags?: string[];
  attachments?: string[];
  dependencies?: string[];
  projectId?: string;
  departmentId?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
  
  // Enriched fields from backend
  assigneeName?: string;
  assigneeEmail?: string;
  assigneeDepartment?: string;
  assignerName?: string;
  creatorName?: string;
  
  // Legacy assignee object (for backward compatibility)
  assignee?: {
    id?: string;
    name?: string;
    avatar?: string;
    department?: string;
  };
  
  comments?: TaskComment[];
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskRequest {
  title: string;
  description: string;
  assignedTo: string;
  priority: string;
  dueDate: string;
}