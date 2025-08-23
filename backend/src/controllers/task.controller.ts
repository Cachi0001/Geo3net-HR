import { Request, Response } from 'express';
import { supabase } from '../config/database';
import { ResponseHandler } from '../utils/response';
import { AppError } from '../utils/errors';
import { AuthenticatedRequest } from '../middleware/permission';

export interface Task {
  id: string;
  title: string;
  description?: string;
  assigned_to: string;
  assigned_by: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'in_progress' | 'completed' | 'cancelled';
  due_date?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  assigned_to: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status?: 'todo' | 'in_progress' | 'completed' | 'cancelled';
  due_date?: string;
}

export class TaskController {
  /**
   * Get all tasks with filtering and pagination
   */
  async getTasks(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const { 
        status, 
        priority, 
        assigned_to, 
        assigned_by, 
        page = 1, 
        limit = 20,
        search 
      } = req.query;
      
      console.log('📋 Fetching tasks for user:', userId);
      
      let query = supabase
        .from('tasks')
        .select(`
          *,
          assigned_to_user:users!assigned_to (
            id,
            full_name,
            email
          ),
          assigned_by_user:users!assigned_by (
            id,
            full_name,
            email
          )
        `);

      // Apply filters
      if (status) {
        query = query.eq('status', status);
      }
      
      if (priority) {
        query = query.eq('priority', priority);
      }
      
      if (assigned_to) {
        query = query.eq('assigned_to', assigned_to);
      }
      
      if (assigned_by) {
        query = query.eq('assigned_by', assigned_by);
      }
      
      if (search) {
        query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
      }
      
      // Apply pagination
      const offset = (Number(page) - 1) * Number(limit);
      query = query.range(offset, offset + Number(limit) - 1);
      
      // Order by created_at desc
      query = query.order('created_at', { ascending: false });

      const { data: tasks, error, count } = await query;

      if (error) {
        console.error('❌ Error fetching tasks:', error);
        throw new AppError('Failed to fetch tasks', 500);
      }

      console.log(`✅ Found ${tasks?.length || 0} tasks`);
      return ResponseHandler.success(res, 'Tasks retrieved successfully', {
        tasks: tasks || [],
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: count || 0,
          totalPages: Math.ceil((count || 0) / Number(limit))
        }
      });
    } catch (error: any) {
      console.error('❌ Get tasks error:', error);
      return ResponseHandler.internalError(res, error.message || 'Failed to retrieve tasks');
    }
  }

  /**
   * Get tasks assigned to current user
   */
  async getMyTasks(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const { status } = req.query;
      
      console.log('👤 Fetching tasks for user:', userId);
      
      let query = supabase
        .from('tasks')
        .select(`
          *,
          assigned_by_user:assigned_by (
            id,
            fullName,
            email
          )
        `)
        .eq('assigned_to', userId);

      if (status) {
        query = query.eq('status', status);
      }
      
      query = query.order('created_at', { ascending: false });

      const { data: tasks, error } = await query;

      if (error) {
        console.error('❌ Error fetching user tasks:', error);
        throw new AppError('Failed to fetch tasks', 500);
      }

      console.log(`✅ Found ${tasks?.length || 0} tasks for user`);
      return ResponseHandler.success(res, 'User tasks retrieved successfully', tasks || []);
    } catch (error: any) {
      console.error('❌ Get user tasks error:', error);
      return ResponseHandler.internalError(res, error.message || 'Failed to retrieve user tasks');
    }
  }

  /**
   * Get task by ID
   */
  async getTaskById(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      console.log('📋 Fetching task:', id);

      const { data: task, error } = await supabase
        .from('tasks')
        .select(`
          *,
          assigned_to_user:assigned_to (
            id,
            fullName,
            email
          ),
          assigned_by_user:assigned_by (
            id,
            fullName,
            email
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('❌ Error fetching task:', error);
        if (error.code === 'PGRST116') {
          return ResponseHandler.notFound(res, 'Task not found');
        }
        throw new AppError('Failed to fetch task', 500);
      }

      console.log('✅ Task found:', task.title);
      return ResponseHandler.success(res, 'Task retrieved successfully', task);
    } catch (error: any) {
      console.error('❌ Get task error:', error);
      return ResponseHandler.internalError(res, error.message || 'Failed to retrieve task');
    }
  }

  /**
   * Create new task
   */
  async createTask(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const taskData: CreateTaskRequest = req.body;
      
      console.log('➕ Creating task:', taskData.title);

      // Validate required fields
      if (!taskData.title || !taskData.assigned_to) {
        return ResponseHandler.badRequest(res, 'Title and assigned user are required');
      }

      const newTask = {
        ...taskData,
        assigned_by: userId,
        priority: taskData.priority || 'medium',
        status: taskData.status || 'todo',
      };

      const { data: task, error } = await supabase
        .from('tasks')
        .insert([newTask])
        .select(`
          *,
          assigned_to_user:assigned_to (
            id,
            fullName,
            email
          ),
          assigned_by_user:assigned_by (
            id,
            fullName,
            email
          )
        `)
        .single();

      if (error) {
        console.error('❌ Error creating task:', error);
        throw new AppError('Failed to create task', 500);
      }

      console.log('✅ Task created:', task.id);
      return ResponseHandler.created(res, 'Task created successfully', task);
    } catch (error: any) {
      console.error('❌ Create task error:', error);
      return ResponseHandler.internalError(res, error.message || 'Failed to create task');
    }
  }

  /**
   * Update task
   */
  async updateTask(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const updateData: Partial<CreateTaskRequest> = req.body;
      
      console.log('✏️ Updating task:', id);

      // If status is being changed to completed, set completed_at
      if (updateData.status === 'completed') {
        (updateData as any).completed_at = new Date().toISOString();
      } else if (updateData.status && ['todo', 'in_progress', 'cancelled'].includes(updateData.status)) {
        (updateData as any).completed_at = null;
      }

      const { data: task, error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          assigned_to_user:assigned_to (
            id,
            fullName,
            email
          ),
          assigned_by_user:assigned_by (
            id,
            fullName,
            email
          )
        `)
        .single();

      if (error) {
        console.error('❌ Error updating task:', error);
        if (error.code === 'PGRST116') {
          return ResponseHandler.notFound(res, 'Task not found');
        }
        throw new AppError('Failed to update task', 500);
      }

      console.log('✅ Task updated:', task.title);
      return ResponseHandler.success(res, 'Task updated successfully', task);
    } catch (error: any) {
      console.error('❌ Update task error:', error);
      return ResponseHandler.internalError(res, error.message || 'Failed to update task');
    }
  }

  /**
   * Delete task
   */
  async deleteTask(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      console.log('🗑️ Deleting task:', id);

      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Error deleting task:', error);
        throw new AppError('Failed to delete task', 500);
      }

      console.log('✅ Task deleted');
      return ResponseHandler.success(res, 'Task deleted successfully');
    } catch (error: any) {
      console.error('❌ Delete task error:', error);
      return ResponseHandler.internalError(res, error.message || 'Failed to delete task');
    }
  }

  /**
   * Get task comments
   */
  async getTaskComments(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      console.log('💬 Fetching comments for task:', id);

      const { data: comments, error } = await supabase
        .from('task_comments')
        .select(`
          *,
          user:user_id (
            id,
            fullName,
            email
          )
        `)
        .eq('task_id', id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ Error fetching task comments:', error);
        throw new AppError('Failed to fetch task comments', 500);
      }

      console.log(`✅ Found ${comments?.length || 0} comments`);
      return ResponseHandler.success(res, 'Task comments retrieved successfully', comments || []);
    } catch (error: any) {
      console.error('❌ Get task comments error:', error);
      return ResponseHandler.internalError(res, error.message || 'Failed to retrieve task comments');
    }
  }

  /**
   * Add comment to task
   */
  async addTaskComment(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { comment } = req.body;
      const userId = req.user?.id;
      
      console.log('💬 Adding comment to task:', id);

      if (!comment || !comment.trim()) {
        return ResponseHandler.badRequest(res, 'Comment is required');
      }

      const { data: newComment, error } = await supabase
        .from('task_comments')
        .insert([{
          task_id: id,
          user_id: userId,
          comment: comment.trim()
        }])
        .select(`
          *,
          user:user_id (
            id,
            fullName,
            email
          )
        `)
        .single();

      if (error) {
        console.error('❌ Error adding task comment:', error);
        throw new AppError('Failed to add task comment', 500);
      }

      console.log('✅ Comment added to task');
      return ResponseHandler.created(res, 'Comment added successfully', newComment);
    } catch (error: any) {
      console.error('❌ Add task comment error:', error);
      return ResponseHandler.internalError(res, error.message || 'Failed to add task comment');
    }
  }

  /**
   * Get task statistics
   */
  async getTaskStats(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      console.log('📊 Fetching task statistics for user:', userId);

      // Get task counts by status
      const { data: statusStats, error: statusError } = await supabase
        .from('tasks')
        .select('status')
        .eq('assigned_to', userId);

      if (statusError) {
        console.error('❌ Error fetching status stats:', statusError);
        throw new AppError('Failed to fetch task statistics', 500);
      }

      // Count tasks by status
      const stats = {
        total: statusStats?.length || 0,
        todo: statusStats?.filter(t => t.status === 'todo').length || 0,
        in_progress: statusStats?.filter(t => t.status === 'in_progress').length || 0,
        completed: statusStats?.filter(t => t.status === 'completed').length || 0,
        cancelled: statusStats?.filter(t => t.status === 'cancelled').length || 0,
        overdue: 0
      };

      // Get overdue tasks
      const { data: overdueTasks, error: overdueError } = await supabase
        .from('tasks')
        .select('id')
        .eq('assigned_to', userId)
        .lt('due_date', new Date().toISOString())
        .neq('status', 'completed')
        .neq('status', 'cancelled');

      if (!overdueError) {
        stats.overdue = overdueTasks?.length || 0;
      }

      console.log('✅ Task statistics retrieved');
      return ResponseHandler.success(res, 'Task statistics retrieved successfully', stats);
    } catch (error: any) {
      console.error('❌ Get task stats error:', error);
      return ResponseHandler.internalError(res, error.message || 'Failed to retrieve task statistics');
    }
  }
}