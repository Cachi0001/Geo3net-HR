import { Request, Response } from 'express';
import { supabase } from '../config/database';
import { ResponseHandler } from '../utils/response';
import { AppError, AuthorizationError } from '../utils/errors';
import { AuthenticatedRequest } from '../middleware/permission';
import { taskNotificationService } from '../services/taskNotification.service';
import { websocketService } from '../services/websocket.service';
import { TaskService } from '../services/task.service';

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
  estimated_hours?: number;
  tags?: string[];
  department_id?: string;
  project_id?: string;
}

export class TaskController {
  private taskService: TaskService

  constructor() {
    this.taskService = new TaskService()
  }
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

      // Use TaskService to get enriched task data
      const filters = {
        status: status as string,
        priority: priority as string,
        assignedTo: assigned_to as string,
        assignedBy: assigned_by as string,
        search: search as string,
        limit: Number(limit),
        offset: (Number(page) - 1) * Number(limit),
        sortBy: 'created_at' as const,
        sortOrder: 'desc' as const
      };

      const result = await this.taskService.searchTasks(filters);

      if (!result.success) {
        throw new AppError(result.message, 500);
      }

      console.log(`✅ Found ${result.tasks?.length || 0} tasks`);
      return ResponseHandler.success(res, 'Tasks retrieved successfully', {
        tasks: result.tasks || [],
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: result.total || 0,
          totalPages: Math.ceil((result.total || 0) / Number(limit))
        }
      });
    } catch (error: any) {
      console.error('❌ Get tasks error:', error);
      return ResponseHandler.internalError(res, error.message || 'Failed to retrieve tasks');
    }
  }

  async getMyTasks(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const { status } = req.query;

      console.log('👤 Fetching tasks for user:', userId);

      // Use TaskService to get enriched task data
      const tasks = await this.taskService.getTasksByAssignee(userId!, status as string);

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
            full_name,
            email
          ),
          assigned_by_user:assigned_by (
            id,
            full_name,
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
   * Create new task with role-based validation
   */
  async createTask(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        console.log('🚫 [Task Creation] Authentication required - no user ID');
        return ResponseHandler.forbidden(res, 'Authentication required');
      }

      const requestBody = req.body;
      console.log('📥 [Task Creation] Raw request body:', JSON.stringify(requestBody, null, 2));
      console.log('📥 [Task Creation] Request headers:', JSON.stringify({
        'content-type': req.headers['content-type'],
        'user-agent': req.headers['user-agent']
      }, null, 2));

      // Handle different field name formats from frontend with detailed logging
      // Also handle empty strings properly by converting them to null/undefined
      const taskData: CreateTaskRequest = {
        title: requestBody.title,
        description: requestBody.description,
        assigned_to: requestBody.assigned_to || requestBody.assignedTo || requestBody.assignTo,
        priority: requestBody.priority,
        status: requestBody.status,
        due_date: requestBody.due_date || requestBody.dueDate,
        estimated_hours: (requestBody.estimated_hours || requestBody.estimatedHours) &&
          (requestBody.estimated_hours || requestBody.estimatedHours) !== '' ?
          Number(requestBody.estimated_hours || requestBody.estimatedHours) : undefined,
        tags: (requestBody.tags && requestBody.tags !== '') ? requestBody.tags : undefined,
        department_id: (requestBody.department_id || requestBody.departmentId) || undefined,
        project_id: (requestBody.project_id || requestBody.projectId) || undefined
      };

      console.log('🔄 [Task Creation] Mapped task data:', JSON.stringify(taskData, null, 2));
      console.log('➕ [Task Creation] Creating task:', taskData.title);
      console.log('👤 [Task Creation] Assigned to:', taskData.assigned_to);
      console.log('🔍 [Task Creation] Field mapping debug:');
      console.log('  - requestBody.assigned_to:', requestBody.assigned_to);
      console.log('  - requestBody.assignedTo:', requestBody.assignedTo);
      console.log('  - requestBody.assignTo:', requestBody.assignTo);
      console.log('  - Final assigned_to value:', taskData.assigned_to);

      // Enhanced validation with detailed error messages
      const validationErrors = [];

      if (!taskData.title || taskData.title.trim() === '') {
        validationErrors.push('Title is required and cannot be empty');
        console.log('❌ [Task Creation] Title validation failed:', {
          title: taskData.title,
          titleType: typeof taskData.title,
          titleLength: taskData.title?.length
        });
      }

      if (!taskData.assigned_to || taskData.assigned_to.trim() === '') {
        validationErrors.push('Employee assignment is required');
        console.log('❌ [Task Creation] Assigned to validation failed:', {
          assigned_to: taskData.assigned_to,
          assignedToType: typeof taskData.assigned_to,
          assignedToLength: taskData.assigned_to?.length,
          originalFields: {
            assigned_to: requestBody.assigned_to,
            assignedTo: requestBody.assignedTo,
            assignTo: requestBody.assignTo
          }
        });
      }

      if (validationErrors.length > 0) {
        console.log('❌ [Task Creation] Validation failed with errors:', validationErrors);
        return ResponseHandler.badRequest(res, validationErrors.join(', '));
      }

      // Prepare data for TaskService
      const serviceData = {
        title: taskData.title,
        description: taskData.description,
        assignedTo: taskData.assigned_to,
        priority: taskData.priority,
        dueDate: taskData.due_date,
        estimatedHours: taskData.estimated_hours,
        tags: taskData.tags,
        departmentId: taskData.department_id,
        projectId: taskData.project_id
      };

      console.log('🔄 [Task Creation] Service data prepared:', JSON.stringify(serviceData, null, 2));

      console.log('🔄 [Task Creation] Calling TaskService with data:', JSON.stringify(serviceData, null, 2));
      console.log('🔄 [Task Creation] Created by user:', userId);

      // Use TaskService for creation with role validation
      const result = await this.taskService.createTask(serviceData, userId);

      console.log('🔄 [Task Creation] TaskService result:', JSON.stringify({
        success: result.success,
        message: result.message,
        taskId: result.task?.id
      }, null, 2));

      if (!result.success) {
        console.log('❌ [Task Creation] TaskService failed:', result.message);
        return ResponseHandler.badRequest(res, result.message);
      }

      console.log('✅ [Task Creation] Task created successfully:', result.task?.id);
      return ResponseHandler.created(res, 'Task created successfully', result.task);
    } catch (error: any) {
      console.error('❌ [Task Creation] Unexpected error:', error);
      console.error('❌ [Task Creation] Error stack:', error.stack);
      console.error('❌ [Task Creation] Error type:', error.constructor.name);

      if (error instanceof AuthorizationError) {
        console.log('🚫 [Task Creation] Authorization error:', error.message);
        return ResponseHandler.forbidden(res, error.message);
      }

      // Check for database-related errors
      if (error.message && error.message.includes('column')) {
        console.log('🗃️ [Task Creation] Database schema error detected');
        return ResponseHandler.internalError(res, 'Database schema error: ' + error.message + '. Please run the schema update.');
      }

      return ResponseHandler.internalError(res, error.message || 'Failed to create task');
    }
  }

  /**
   * Update task
   */
  async updateTask(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const updateData: Partial<CreateTaskRequest & { actualHours?: number; notes?: string }> = req.body;
      const userId = req.user?.id;

      console.log('✏️ Updating task:', id);

      // First, get the current task data to compare changes
      const { data: currentTask, error: fetchError } = await supabase
        .from('tasks')
        .select(`
          *,
          assigned_to_user:assigned_to (
            id,
            full_name,
            email
          ),
          assigned_by_user:assigned_by (
            id,
            full_name,
            email
          )
        `)
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('❌ Error fetching current task:', fetchError);
        if (fetchError.code === 'PGRST116') {
          return ResponseHandler.notFound(res, 'Task not found');
        }
        throw new AppError('Failed to fetch task', 500);
      }

      const oldStatus = currentTask.status;
      const newStatus = updateData.status || oldStatus;

      // If status is being changed to completed, set completed_at
      if (updateData.status === 'completed') {
        (updateData as any).completed_at = new Date().toISOString();
      } else if (updateData.status && ['todo', 'in_progress', 'cancelled'].includes(updateData.status)) {
        (updateData as any).completed_at = null;
      }

      // Add progress tracking fields
      if (updateData.actualHours !== undefined) {
        (updateData as any).actual_hours = updateData.actualHours;
        delete updateData.actualHours;
      }

      if (updateData.notes) {
        (updateData as any).progress_notes = updateData.notes;
        delete updateData.notes;
      }

      // Update the task
      const { data: task, error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          assigned_to_user:assigned_to (
            id,
            full_name,
            email
          ),
          assigned_by_user:assigned_by (
            id,
            full_name,
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

      // Send notifications and real-time updates
      if (req.user) {
        try {
          // Send real-time progress update via WebSocket
          websocketService.broadcastTaskProgressUpdate({
            taskId: task.id,
            status: newStatus,
            actualHours: task.actual_hours,
            progressNotes: task.progress_notes,
            updatedBy: {
              id: req.user.id,
              fullName: req.user.email
            },
            timestamp: new Date().toISOString()
          });

          // Send status change notification if status changed
          if (oldStatus !== newStatus) {
            await taskNotificationService.notifyTaskStatusChange(
              {
                id: task.id,
                title: task.title,
                description: task.description,
                assignedTo: task.assigned_to,
                assignedBy: task.assigned_by,
                priority: task.priority,
                status: newStatus,
                dueDate: task.due_date,
                createdAt: task.created_at,
                updatedAt: task.updated_at
              },
              oldStatus,
              newStatus,
              {
                id: req.user.id,
                fullName: req.user.email,
                email: req.user.email
              }
            );

            // Send real-time status change notification
            websocketService.sendTaskStatusChangeNotification(
              task.id,
              oldStatus,
              newStatus,
              {
                id: req.user.id,
                fullName: req.user.email
              }
            );
            console.log('📧 Task status change notification sent');
          }
        } catch (notificationError) {
          console.error('❌ Failed to send notifications:', notificationError);
          // Don't fail the request if notification fails
        }
      }

      console.log('✅ Task updated:', task.title);
      return ResponseHandler.success(res, 'Task updated successfully', task);
    } catch (error: any) {
      console.error('❌ Update task error:', error);
      return ResponseHandler.internalError(res, error.message || 'Failed to update task');
    }
  }

  /**
   * Assign task to user with role-based validation
   */
  async assignTask(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { assignedTo } = req.body;
      const assignedBy = req.user?.id;

      console.log('🔄 [Task Assignment] Starting task assignment:', {
        taskId: id,
        assignedTo,
        assignedBy,
        requestBody: req.body
      });

      if (!assignedBy) {
        console.log('❌ [Task Assignment] Authentication required - no user ID');
        return ResponseHandler.forbidden(res, 'Authentication required');
      }

      if (!assignedTo) {
        console.log('❌ [Task Assignment] assignedTo is required');
        return ResponseHandler.badRequest(res, 'assignedTo is required');
      }

      console.log('🔄 [Task Assignment] Calling TaskService.updateTask...');

      const result = await this.taskService.updateTask(id, {
        assignedTo: assignedTo
      }, assignedBy);

      console.log('🔄 [Task Assignment] TaskService result:', {
        success: result.success,
        message: result.message,
        taskId: result.task?.id
      });

      if (!result.success) {
        console.log('❌ [Task Assignment] TaskService failed:', result.message);
        return ResponseHandler.badRequest(res, result.message);
      }

      console.log('✅ [Task Assignment] Task assigned successfully');
      return ResponseHandler.success(res, 'Task assigned successfully', result.task);
    } catch (error: any) {
      console.error('❌ [Task Assignment] Unexpected error:', error);
      console.error('❌ [Task Assignment] Error stack:', error.stack);

      if (error instanceof AuthorizationError) {
        console.log('🚫 [Task Assignment] Authorization error:', error.message);
        return ResponseHandler.forbidden(res, error.message);
      }

      if (error.message && error.message.includes('not found')) {
        console.log('🔍 [Task Assignment] Task not found error');
        return ResponseHandler.notFound(res, 'Task not found');
      }

      return ResponseHandler.internalError(res, error.message || 'Failed to assign task');
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
            full_name,
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
            full_name,
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

  /**
   * Debug endpoint to see what data is being sent
   */
  async debugTaskData(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      console.log('🐛 [Debug] Request body:', JSON.stringify(req.body, null, 2));
      console.log('🐛 [Debug] Request headers:', JSON.stringify(req.headers, null, 2));
      console.log('🐛 [Debug] User:', req.user);

      // Test the same field mapping logic as createTask
      const requestBody = req.body;
      const taskData = {
        title: requestBody.title,
        description: requestBody.description,
        assigned_to: requestBody.assigned_to || requestBody.assignedTo || requestBody.assignTo,
        priority: requestBody.priority,
        status: requestBody.status,
        due_date: requestBody.due_date || requestBody.dueDate,
        estimated_hours: requestBody.estimated_hours || requestBody.estimatedHours,
        tags: requestBody.tags,
        department_id: requestBody.department_id || requestBody.departmentId,
        project_id: requestBody.project_id || requestBody.projectId
      };

      console.log('🐛 [Debug] Mapped task data:', JSON.stringify(taskData, null, 2));

      // Test validation logic
      const validationResults = {
        titleValid: !!(taskData.title && taskData.title.trim()),
        assignedToValid: !!(taskData.assigned_to && taskData.assigned_to.trim()),
        titleValue: taskData.title,
        assignedToValue: taskData.assigned_to,
        fieldMapping: {
          assigned_to: requestBody.assigned_to,
          assignedTo: requestBody.assignedTo,
          assignTo: requestBody.assignTo,
          finalValue: taskData.assigned_to
        }
      };

      console.log('🐛 [Debug] Validation results:', JSON.stringify(validationResults, null, 2));

      return ResponseHandler.success(res, 'Debug data logged', {
        originalBody: req.body,
        mappedData: taskData,
        validationResults,
        user: req.user,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('❌ [Debug] Debug error:', error);
      return ResponseHandler.internalError(res, error.message);
    }
  }

  /**
   * Check database schema for debugging
   */
  async checkSchema(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      console.log('🔍 [Schema Check] Starting database schema check...');
      console.log('🔍 [Schema Check] User:', req.user?.id, req.user?.email);

      // Try to get table structure
      console.log('🔍 [Schema Check] Testing table access...');
      const { data: tableInfo, error: tableError } = await supabase
        .from('tasks')
        .select('*')
        .limit(1);

      if (tableError) {
        console.error('❌ [Schema Check] Table error:', tableError);
        return ResponseHandler.success(res, 'Schema check completed with table error', {
          tableAccessible: false,
          tableError: tableError.message,
          suggestion: 'Check if tasks table exists'
        });
      }

      console.log('✅ [Schema Check] Table accessible, found', tableInfo?.length || 0, 'records');

      // Get table column information
      console.log('🔍 [Schema Check] Checking table structure...');
      const { data: columnInfo, error: columnError } = await supabase
        .rpc('get_table_columns', { table_name: 'tasks' })
        .select();

      if (columnError) {
        console.log('⚠️ [Schema Check] Could not get column info:', columnError.message);
      } else {
        console.log('📋 [Schema Check] Table columns:', columnInfo);
      }

      // Try to insert a test record to see what columns are missing
      const testTask = {
        title: 'Schema Test',
        description: 'Testing schema',
        assigned_to: req.user?.id,
        assigned_by: req.user?.id,
        status: 'pending',
        priority: 'medium',
        created_by: req.user?.id
      };

      console.log('🔍 [Schema Check] Testing insert with data:', JSON.stringify(testTask, null, 2));

      const { data: insertTest, error: insertError } = await supabase
        .from('tasks')
        .insert([testTask])
        .select()
        .single();

      if (insertError) {
        console.error('❌ [Schema Check] Insert test error:', insertError);

        // Analyze the error to provide better feedback
        let missingColumns = [];
        let errorAnalysis = 'Unknown error';

        if (insertError.message.includes('column') && insertError.message.includes('does not exist')) {
          const columnMatch = insertError.message.match(/column "([^"]+)" does not exist/);
          if (columnMatch) {
            missingColumns.push(columnMatch[1]);
            errorAnalysis = `Missing column: ${columnMatch[1]}`;
          }
        } else if (insertError.message.includes('null value in column')) {
          const columnMatch = insertError.message.match(/null value in column "([^"]+)"/);
          if (columnMatch) {
            errorAnalysis = `Column ${columnMatch[1]} cannot be null - check if this field is required`;
          }
        } else if (insertError.message.includes('violates')) {
          errorAnalysis = `Database constraint violation: ${insertError.message}`;
        }

        return ResponseHandler.success(res, 'Schema check completed with insert error', {
          tableAccessible: true,
          insertError: insertError.message,
          errorCode: insertError.code,
          errorAnalysis,
          missingColumns,
          testData: testTask,
          suggestion: missingColumns.length > 0 ? 'Run the schema update SQL script to add missing columns' : 'Check database constraints and required fields'
        });
      }

      console.log('✅ [Schema Check] Insert test successful:', insertTest?.id);

      // Clean up test record
      if (insertTest) {
        await supabase.from('tasks').delete().eq('id', insertTest.id);
        console.log('🧹 [Schema Check] Test record cleaned up');
      }

      return ResponseHandler.success(res, 'Schema check passed completely', {
        tableAccessible: true,
        insertWorking: true,
        testRecordId: insertTest?.id,
        columnInfo: columnInfo || 'Column info not available',
        message: 'Database schema is working correctly'
      });

    } catch (error: any) {
      console.error('❌ [Schema Check] Unexpected error:', error);
      return ResponseHandler.internalError(res, `Schema check failed: ${error.message}`);
    }
  }

  /**
   * Get users that the current user can assign tasks to
   */
  async getAssignableUsers(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return ResponseHandler.forbidden(res, 'Authentication required');
      }

      console.log('👥 Fetching assignable users for:', userId);

      const assignableUsers = await this.taskService.getAssignableUsers(userId);

      console.log(`✅ Found ${assignableUsers.length} assignable users`);
      return ResponseHandler.success(res, 'Assignable users retrieved successfully', assignableUsers);
    } catch (error: any) {
      console.error('❌ Get assignable users error:', error);
      return ResponseHandler.internalError(res, error.message || 'Failed to retrieve assignable users');
    }
  }
}