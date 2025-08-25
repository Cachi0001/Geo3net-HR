import { supabase } from '../config/database'
import { NotFoundError, ConflictError, ValidationError, AuthorizationError } from '../utils/errors'
import { RoleService } from './role.service'
import { taskNotificationService } from './taskNotification.service'

export interface Task {
  id: string
  title: string
  description?: string
  assignedTo?: string
  assignedBy: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  dueDate?: string
  startDate?: string
  completedDate?: string
  estimatedHours?: number
  actualHours?: number
  tags?: string[]
  attachments?: string[]
  comments?: TaskComment[]
  dependencies?: string[]
  projectId?: string
  departmentId?: string
  createdAt: string
  updatedAt: string
  createdBy: string
  updatedBy?: string
  // Additional fields for frontend display
  assigneeName?: string
  assigneeEmail?: string
  assigneeDepartment?: string
  assignerName?: string
  creatorName?: string
}

export interface TaskComment {
  id: string
  taskId: string
  userId: string
  comment: string
  createdAt: string
  updatedAt?: string
}

export interface CreateTaskData {
  title: string
  description?: string
  assignedTo?: string
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  dueDate?: string
  startDate?: string
  estimatedHours?: number
  tags?: string[]
  dependencies?: string[]
  projectId?: string
  departmentId?: string
}

export interface UpdateTaskData {
  title?: string
  description?: string
  assignedTo?: string
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold'
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  dueDate?: string
  startDate?: string
  completedDate?: string
  estimatedHours?: number
  actualHours?: number
  tags?: string[]
  dependencies?: string[]
  projectId?: string
  departmentId?: string
}

export interface TaskSearchFilters {
  assignedTo?: string
  assignedBy?: string
  status?: string
  priority?: string
  departmentId?: string
  projectId?: string
  dueDateFrom?: string
  dueDateTo?: string
  search?: string
  tags?: string[]
  limit?: number
  offset?: number
  sortBy?: 'created_at' | 'due_date' | 'priority' | 'status' | 'title'
  sortOrder?: 'asc' | 'desc'
}

export interface TaskResult {
  success: boolean
  message: string
  task?: Task
  tasks?: Task[]
  total?: number
  comment?: TaskComment
}

export interface TaskStatistics {
  total: number
  pending: number
  inProgress: number
  completed: number
  cancelled: number
  onHold: number
  overdue: number
  dueToday: number
  dueThisWeek: number
  byPriority: {
    low: number
    medium: number
    high: number
    urgent: number
  }
  byAssignee: Record<string, number>
  averageCompletionTime: number
}

export class TaskService {
  private roleService: RoleService

  constructor() {
    this.roleService = new RoleService()
  }

  async createTask(data: CreateTaskData, createdBy: string): Promise<TaskResult> {
    try {
      console.log('🔄 [TaskService] Creating task with data:', JSON.stringify(data, null, 2));
      console.log('🔄 [TaskService] Created by user:', createdBy);

      // Validate required fields
      this.validateTaskData(data)
      console.log('✅ [TaskService] Task data validation passed');

      // Validate dependencies if provided
      if (data.dependencies && data.dependencies.length > 0) {
        await this.validateTaskDependencies(data.dependencies)
        console.log('✅ [TaskService] Dependencies validation passed');
      }

      // Validate assignee if provided and get the actual user ID
      let actualUserId: string | undefined;
      if (data.assignedTo) {
        console.log('🔍 [TaskService] Validating assignee:', data.assignedTo);
        await this.validateAssignee(data.assignedTo)
        console.log('✅ [TaskService] Assignee validation passed');
        
        // Get the actual user ID (in case assignedTo is an employee ID)
        actualUserId = await this.getUserIdFromAssigneeId(data.assignedTo);
        console.log('🔍 [TaskService] Actual user ID for assignment:', actualUserId);
        
        // Validate role-based assignment authorization using the actual user ID
        console.log('🔍 [TaskService] Validating role-based assignment authorization');
        await this.validateTaskAssignment(createdBy, actualUserId)
        console.log('✅ [TaskService] Role-based assignment validation passed');
      }

      // Set default values with proper null handling
      const taskData = {
        title: data.title,
        description: data.description,
        assigned_to: actualUserId || null, // Use resolved user ID or null if no assignment
        assigned_by: createdBy,
        status: 'pending' as const,
        priority: data.priority || 'medium' as const,
        due_date: data.dueDate,
        start_date: data.startDate,
        estimated_hours: (data.estimatedHours && data.estimatedHours > 0) ? data.estimatedHours : null,
        tags: (data.tags && data.tags.length > 0) ? data.tags : [],
        dependencies: data.dependencies || [],
        project_id: data.projectId || null,
        department_id: data.departmentId || null,
        created_by: createdBy
      }

      console.log('🔍 [TaskService] Assignment details:', {
        originalAssignedTo: data.assignedTo,
        resolvedUserId: actualUserId,
        finalAssignedTo: taskData.assigned_to
      });

      console.log('🔄 [TaskService] Final task data for database:', JSON.stringify(taskData, null, 2));

      const { data: newTask, error } = await supabase
        .from('tasks')
        .insert(taskData)
        .select()
        .single()

      if (error) {
        console.error('❌ [TaskService] Database insert error:', error);
        console.error('❌ [TaskService] Error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      console.log('✅ [TaskService] Task created successfully in database:', newTask.id);
      
      // Enrich the task with assignee information like searchTasks does
      let enrichedTaskData = { ...newTask };
      if (newTask.assigned_to) {
        // Try users table first
        const { data: userData } = await supabase
          .from('users')
          .select('id, full_name, email')
          .eq('id', newTask.assigned_to)
          .single()

        if (userData) {
          enrichedTaskData.assignee = userData;
        } else {
          // Try employees table
          const { data: employeeData } = await supabase
            .from('employees')
            .select('id, full_name, email, user_id')
            .or(`user_id.eq.${newTask.assigned_to},id.eq.${newTask.assigned_to}`)
            .single()

          if (employeeData) {
            enrichedTaskData.assignee = {
              id: employeeData.user_id || employeeData.id,
              full_name: employeeData.full_name,
              email: employeeData.email
            };
          }
        }
      }

      const task = this.mapDatabaseToTask(enrichedTaskData)

      // Send notifications if task is assigned to someone
      if (task.assignedTo && task.assignedTo !== createdBy) {
        try {
          // Get assignee and assigner user details for notifications
          const { data: assigneeUser } = await supabase
            .from('users')
            .select('id, full_name, email')
            .eq('id', task.assignedTo)
            .single()

          const { data: assignerUser } = await supabase
            .from('users')
            .select('id, full_name, email')
            .eq('id', createdBy)
            .single()

          if (assigneeUser && assignerUser) {
            await taskNotificationService.notifyTaskAssignment(
              {
                id: task.id,
                title: task.title,
                description: task.description,
                assignedTo: task.assignedTo,
                assignedBy: task.assignedBy,
                priority: task.priority,
                status: task.status,
                dueDate: task.dueDate,
                createdAt: task.createdAt,
                updatedAt: task.updatedAt
              },
              {
                id: assignerUser.id,
                fullName: assignerUser.full_name,
                email: assignerUser.email
              },
              {
                id: assigneeUser.id,
                fullName: assigneeUser.full_name,
                email: assigneeUser.email
              }
            )
            console.log('✅ [TaskService] Task assignment notification sent')
          }
        } catch (notificationError) {
          console.error('⚠️ [TaskService] Failed to send task assignment notification:', notificationError)
          // Don't fail task creation if notification fails
        }
      }

      return {
        success: true,
        message: 'Task created successfully',
        task
      }
    } catch (error) {
      console.error('❌ [TaskService] Task creation failed:', error);
      if (error instanceof ValidationError || error instanceof ConflictError || error instanceof AuthorizationError) {
        throw error
      }
      throw new Error(`Failed to create task: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  async getTaskById(id: string): Promise<Task | null> {
    try {
      // First get the basic task data
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', id)
        .single()

      if (taskError || !taskData) return null

      // Then get assignee information (try both users and employees tables)
      let assigneeInfo = null;
      if (taskData.assigned_to) {
        // Try to get user info first
        const { data: userData } = await supabase
          .from('users')
          .select('id, full_name, email')
          .eq('id', taskData.assigned_to)
          .single()

        if (userData) {
          assigneeInfo = userData;
        } else {
          // If no user found, try to find employee with this user_id
          const { data: employeeData } = await supabase
            .from('employees')
            .select('id, full_name, email, user_id')
            .eq('user_id', taskData.assigned_to)
            .single()

          if (employeeData) {
            assigneeInfo = {
              id: employeeData.user_id,
              full_name: employeeData.full_name,
              email: employeeData.email
            };
          } else {
            // Last resort: try to find employee by ID (in case assigned_to is employee ID)
            const { data: empByIdData } = await supabase
              .from('employees')
              .select('id, full_name, email, user_id')
              .eq('id', taskData.assigned_to)
              .single()

            if (empByIdData) {
              assigneeInfo = {
                id: empByIdData.id,
                full_name: empByIdData.full_name,
                email: empByIdData.email
              };
            }
          }
        }
      }

      // Get assigner and creator info (these should exist in users table)
      const [assignerData, creatorData] = await Promise.all([
        taskData.assigned_by ? supabase
          .from('users')
          .select('id, full_name, email')
          .eq('id', taskData.assigned_by)
          .single() : Promise.resolve({ data: null }),
        taskData.created_by ? supabase
          .from('users')
          .select('id, full_name, email')
          .eq('id', taskData.created_by)
          .single() : Promise.resolve({ data: null })
      ]);

      // Get comments
      const { data: comments } = await supabase
        .from('task_comments')
        .select('*')
        .eq('task_id', id)
        .order('created_at', { ascending: true });

      // Combine all data
      const enrichedTaskData = {
        ...taskData,
        assignee: assigneeInfo,
        assigner: assignerData.data,
        creator: creatorData.data,
        comments: comments || []
      };

      return this.mapDatabaseToTask(enrichedTaskData)
    } catch (error) {
      console.error('❌ [TaskService] Error getting task by ID:', error);
      return null
    }
  }

  async updateTask(id: string, data: UpdateTaskData, updatedBy: string): Promise<TaskResult> {
    try {
      // Check if task exists
      const existingTask = await this.getTaskById(id)
      if (!existingTask) {
        throw new NotFoundError('Task not found')
      }

      // Validate assignee if being updated and resolve to user ID
      let actualUserId: string | undefined;
      if (data.assignedTo) {
        console.log('🔍 [TaskService] Validating assignee for update:', data.assignedTo);
        await this.validateAssignee(data.assignedTo)
        
        // Get the actual user ID (in case assignedTo is an employee ID)
        actualUserId = await this.getUserIdFromAssigneeId(data.assignedTo);
        console.log('🔍 [TaskService] Actual user ID for update:', actualUserId);
        
        // Validate role-based assignment authorization using the actual user ID
        await this.validateTaskAssignment(updatedBy, actualUserId)
      }

      // Validate dependencies if being updated
      if (data.dependencies && data.dependencies.length > 0) {
        await this.validateTaskDependencies(data.dependencies, id)
      }

      // Handle status changes and field mapping
      const updateData: any = {
        updated_by: updatedBy,
        updated_at: new Date().toISOString()
      }

      // Map frontend field names to database field names
      if (data.title !== undefined) updateData.title = data.title
      if (data.description !== undefined) updateData.description = data.description
      if (data.assignedTo !== undefined) updateData.assigned_to = actualUserId || data.assignedTo
      if (data.status !== undefined) updateData.status = data.status
      if (data.priority !== undefined) updateData.priority = data.priority
      if (data.dueDate !== undefined) updateData.due_date = data.dueDate
      if (data.startDate !== undefined) updateData.start_date = data.startDate
      if (data.completedDate !== undefined) updateData.completed_date = data.completedDate
      if (data.estimatedHours !== undefined) updateData.estimated_hours = data.estimatedHours
      if (data.actualHours !== undefined) updateData.actual_hours = data.actualHours
      if (data.tags !== undefined) updateData.tags = data.tags
      if (data.dependencies !== undefined) updateData.dependencies = data.dependencies
      if (data.projectId !== undefined) updateData.project_id = data.projectId
      if (data.departmentId !== undefined) updateData.department_id = data.departmentId

      console.log('🔄 [TaskService] Update data prepared:', JSON.stringify(updateData, null, 2))

      // Set completion date if status is being changed to completed
      if (data.status === 'completed' && existingTask.status !== 'completed') {
        updateData.completed_date = new Date().toISOString()
      }

      // Clear completion date if status is being changed from completed
      if (data.status && data.status !== 'completed' && existingTask.status === 'completed') {
        updateData.completed_date = null
      }

      const { data: updatedTask, error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          assignee:users!assigned_to(id, full_name, email),
          assigner:users!assigned_by(id, full_name, email),
          creator:users!created_by(id, full_name, email),
          comments:task_comments(*)
        `)
        .single()

      if (error) throw error

      const task = this.mapDatabaseToTask(updatedTask)

      // Send status change notifications if status was updated
      if (data.status && data.status !== existingTask.status) {
        try {
          const { data: updaterUser } = await supabase
            .from('users')
            .select('id, full_name, email')
            .eq('id', updatedBy)
            .single()

          if (updaterUser) {
            await taskNotificationService.notifyTaskStatusChange(
              {
                id: task.id,
                title: task.title,
                description: task.description,
                assignedTo: task.assignedTo,
                assignedBy: task.assignedBy,
                priority: task.priority,
                status: task.status,
                dueDate: task.dueDate,
                createdAt: task.createdAt,
                updatedAt: task.updatedAt
              },
              existingTask.status,
              data.status,
              {
                id: updaterUser.id,
                fullName: updaterUser.full_name,
                email: updaterUser.email
              }
            )
            console.log('✅ [TaskService] Task status change notification sent')
          }
        } catch (notificationError) {
          console.error('⚠️ [TaskService] Failed to send status change notification:', notificationError)
          // Don't fail task update if notification fails
        }
      }

      return {
        success: true,
        message: 'Task updated successfully',
        task
      }
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error
      }
      throw new Error('Failed to update task')
    }
  }

  async deleteTask(id: string, deletedBy: string): Promise<TaskResult> {
    try {
      // Check if task exists
      const existingTask = await this.getTaskById(id)
      if (!existingTask) {
        throw new NotFoundError('Task not found')
      }

      // Check if task can be deleted (not completed or has dependencies)
      if (existingTask.status === 'completed') {
        throw new ConflictError('Cannot delete completed tasks')
      }

      // Check for dependent tasks
      const dependentTasks = await this.getTasksWithDependency(id)
      if (dependentTasks.length > 0) {
        throw new ConflictError('Cannot delete task with dependent tasks')
      }

      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)

      if (error) throw error

      return {
        success: true,
        message: 'Task deleted successfully'
      }
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ConflictError) {
        throw error
      }
      throw new Error('Failed to delete task')
    }
  }

  async searchTasks(filters: TaskSearchFilters): Promise<TaskResult> {
    try {
      // Get basic task data first (without problematic joins)
      let query = supabase
        .from('tasks')
        .select('*', { count: 'exact' })

      // Apply filters
      if (filters.assignedTo) {
        query = query.eq('assigned_to', filters.assignedTo)
      }

      if (filters.assignedBy) {
        query = query.eq('assigned_by', filters.assignedBy)
      }

      if (filters.status) {
        query = query.eq('status', filters.status)
      }

      if (filters.priority) {
        query = query.eq('priority', filters.priority)
      }

      if (filters.departmentId) {
        query = query.eq('department_id', filters.departmentId)
      }

      if (filters.projectId) {
        query = query.eq('project_id', filters.projectId)
      }

      if (filters.dueDateFrom) {
        query = query.gte('due_date', filters.dueDateFrom)
      }

      if (filters.dueDateTo) {
        query = query.lte('due_date', filters.dueDateTo)
      }

      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
      }

      if (filters.tags && filters.tags.length > 0) {
        query = query.contains('tags', filters.tags)
      }

      // Apply sorting
      const sortBy = filters.sortBy || 'created_at'
      const sortOrder = filters.sortOrder || 'desc'
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })

      // Apply pagination
      if (filters.limit) {
        query = query.limit(filters.limit)
      }

      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
      }

      const { data, error, count } = await query

      if (error) throw error

      // Enrich each task with assignee information
      const enrichedTasks = await Promise.all((data || []).map(async (taskData) => {
        // Get assignee information if assigned
        let assigneeInfo = null;
        if (taskData.assigned_to) {
          // Try users table first
          const { data: userData } = await supabase
            .from('users')
            .select('id, full_name, email')
            .eq('id', taskData.assigned_to)
            .single()

          if (userData) {
            assigneeInfo = userData;
          } else {
            // Try employees table
            const { data: employeeData } = await supabase
              .from('employees')
              .select('id, full_name, email, user_id')
              .or(`user_id.eq.${taskData.assigned_to},id.eq.${taskData.assigned_to}`)
              .single()

            if (employeeData) {
              assigneeInfo = {
                id: employeeData.user_id || employeeData.id,
                full_name: employeeData.full_name,
                email: employeeData.email
              };
            }
          }
        }

        return {
          ...taskData,
          assignee: assigneeInfo
        };
      }));

      const tasks = enrichedTasks.map(task => this.mapDatabaseToTask(task))

      return {
        success: true,
        message: 'Tasks retrieved successfully',
        tasks,
        total: count || 0
      }
    } catch (error) {
      throw new Error('Failed to search tasks')
    }
  }

  async getTasksByAssignee(assigneeId: string, status?: string): Promise<Task[]> {
    try {
      let query = supabase
        .from('tasks')
        .select('*')
        .eq('assigned_to', assigneeId)

      if (status) {
        query = query.eq('status', status)
      }

      query = query.order('due_date', { ascending: true, nullsFirst: false })

      const { data, error } = await query

      if (error) throw error

      // Enrich each task with assignee information
      const enrichedTasks = await Promise.all((data || []).map(async (taskData) => {
        // Get assignee information
        let assigneeInfo = null;
        if (taskData.assigned_to) {
          // Try users table first
          const { data: userData } = await supabase
            .from('users')
            .select('id, full_name, email')
            .eq('id', taskData.assigned_to)
            .single()

          if (userData) {
            assigneeInfo = userData;
          } else {
            // Try employees table
            const { data: employeeData } = await supabase
              .from('employees')
              .select('id, full_name, email, user_id')
              .or(`user_id.eq.${taskData.assigned_to},id.eq.${taskData.assigned_to}`)
              .single()

            if (employeeData) {
              assigneeInfo = {
                id: employeeData.user_id || employeeData.id,
                full_name: employeeData.full_name,
                email: employeeData.email
              };
            }
          }
        }

        return {
          ...taskData,
          assignee: assigneeInfo
        };
      }));

      return enrichedTasks.map(task => this.mapDatabaseToTask(task))
    } catch (error) {
      return []
    }
  }

  async getTasksByCreator(creatorId: string, status?: string): Promise<Task[]> {
    try {
      let query = supabase
        .from('tasks')
        .select('*')
        .eq('created_by', creatorId)

      if (status) {
        query = query.eq('status', status)
      }

      query = query.order('created_at', { ascending: false })

      const { data, error } = await query

      if (error) throw error

      // Enrich each task with assignee information
      const enrichedTasks = await Promise.all((data || []).map(async (taskData) => {
        // Get assignee information
        let assigneeInfo = null;
        if (taskData.assigned_to) {
          // Try users table first
          const { data: userData } = await supabase
            .from('users')
            .select('id, full_name, email')
            .eq('id', taskData.assigned_to)
            .single()

          if (userData) {
            assigneeInfo = userData;
          } else {
            // Try employees table
            const { data: employeeData } = await supabase
              .from('employees')
              .select('id, full_name, email, user_id')
              .or(`user_id.eq.${taskData.assigned_to},id.eq.${taskData.assigned_to}`)
              .single()

            if (employeeData) {
              assigneeInfo = {
                id: employeeData.user_id || employeeData.id,
                full_name: employeeData.full_name,
                email: employeeData.email
              };
            }
          }
        }

        return {
          ...taskData,
          assignee: assigneeInfo
        };
      }));

      return enrichedTasks.map(task => this.mapDatabaseToTask(task))
    } catch (error) {
      return []
    }
  }

  async getOverdueTasks(): Promise<Task[]> {
    try {
      const today = new Date().toISOString().split('T')[0]

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .lt('due_date', today)
        .in('status', ['pending', 'in_progress'])
        .order('due_date', { ascending: true })

      if (error) throw error

      // Enrich each task with assignee information
      const enrichedTasks = await Promise.all((data || []).map(async (taskData) => {
        // Get assignee information
        let assigneeInfo = null;
        if (taskData.assigned_to) {
          // Try users table first
          const { data: userData } = await supabase
            .from('users')
            .select('id, full_name, email')
            .eq('id', taskData.assigned_to)
            .single()

          if (userData) {
            assigneeInfo = userData;
          } else {
            // Try employees table
            const { data: employeeData } = await supabase
              .from('employees')
              .select('id, full_name, email, user_id')
              .or(`user_id.eq.${taskData.assigned_to},id.eq.${taskData.assigned_to}`)
              .single()

            if (employeeData) {
              assigneeInfo = {
                id: employeeData.user_id || employeeData.id,
                full_name: employeeData.full_name,
                email: employeeData.email
              };
            }
          }
        }

        return {
          ...taskData,
          assignee: assigneeInfo
        };
      }));

      return enrichedTasks.map(task => this.mapDatabaseToTask(task))
    } catch (error) {
      return []
    }
  }

  async getTaskStatistics(filters?: { assignedTo?: string, departmentId?: string, projectId?: string }): Promise<TaskStatistics> {
    try {
      let query = supabase.from('tasks').select('*')

      if (filters?.assignedTo) {
        query = query.eq('assigned_to', filters.assignedTo)
      }

      if (filters?.departmentId) {
        query = query.eq('department_id', filters.departmentId)
      }

      if (filters?.projectId) {
        query = query.eq('project_id', filters.projectId)
      }

      const { data: tasks, error } = await query

      if (error) throw error

      const today = new Date()
      const oneWeekFromNow = new Date()
      oneWeekFromNow.setDate(today.getDate() + 7)

      const stats: TaskStatistics = {
        total: tasks?.length || 0,
        pending: 0,
        inProgress: 0,
        completed: 0,
        cancelled: 0,
        onHold: 0,
        overdue: 0,
        dueToday: 0,
        dueThisWeek: 0,
        byPriority: {
          low: 0,
          medium: 0,
          high: 0,
          urgent: 0
        },
        byAssignee: {},
        averageCompletionTime: 0
      }

      let totalCompletionTime = 0
      let completedTasksCount = 0

      tasks?.forEach(task => {
        // Status counts
        switch (task.status) {
          case 'pending':
            stats.pending++
            break
          case 'in_progress':
            stats.inProgress++
            break
          case 'completed':
            stats.completed++
            break
          case 'cancelled':
            stats.cancelled++
            break
          case 'on_hold':
            stats.onHold++
            break
        }

        // Priority counts
        stats.byPriority[task.priority as keyof typeof stats.byPriority]++

        // Assignee counts
        if (task.assigned_to) {
          stats.byAssignee[task.assigned_to] = (stats.byAssignee[task.assigned_to] || 0) + 1
        }

        // Due date analysis
        if (task.due_date) {
          const dueDate = new Date(task.due_date)
          const todayStr = today.toISOString().split('T')[0]
          const dueDateStr = dueDate.toISOString().split('T')[0]

          if (dueDate < today && ['pending', 'in_progress'].includes(task.status)) {
            stats.overdue++
          }

          if (dueDateStr === todayStr) {
            stats.dueToday++
          }

          if (dueDate <= oneWeekFromNow && dueDate >= today) {
            stats.dueThisWeek++
          }
        }

        // Completion time calculation
        if (task.status === 'completed' && task.created_at && task.completed_date) {
          const createdDate = new Date(task.created_at)
          const completedDate = new Date(task.completed_date)
          const completionTime = completedDate.getTime() - createdDate.getTime()
          totalCompletionTime += completionTime
          completedTasksCount++
        }
      })

      // Calculate average completion time in days
      if (completedTasksCount > 0) {
        stats.averageCompletionTime = Math.round(
          (totalCompletionTime / completedTasksCount) / (1000 * 60 * 60 * 24) * 100
        ) / 100
      }

      return stats
    } catch (error) {
      throw new Error('Failed to get task statistics')
    }
  }

  async addTaskComment(taskId: string, comment: string, userId: string): Promise<TaskResult> {
    try {
      // Verify task exists
      const task = await this.getTaskById(taskId)
      if (!task) {
        throw new NotFoundError('Task not found')
      }

      const { data: newComment, error } = await supabase
        .from('task_comments')
        .insert({
          task_id: taskId,
          user_id: userId,
          comment
        })
        .select(`
          *,
          user:users(id, full_name, email)
        `)
        .single()

      if (error) throw error

      const taskComment: TaskComment = {
        id: newComment.id,
        taskId: newComment.task_id,
        userId: newComment.user_id,
        comment: newComment.comment,
        createdAt: newComment.created_at,
        updatedAt: newComment.updated_at
      }

      return {
        success: true,
        message: 'Comment added successfully',
        comment: taskComment
      }
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error
      }
      throw new Error('Failed to add comment')
    }
  }

  private async validateTaskData(data: CreateTaskData): Promise<void> {
    const errors: string[] = []

    console.log('🔍 [TaskService] Validating task data:', {
      title: data.title,
      titleType: typeof data.title,
      titleLength: data.title?.length,
      assignedTo: data.assignedTo,
      assignedToType: typeof data.assignedTo,
      assignedToLength: data.assignedTo?.length
    });

    if (!data.title?.trim()) {
      errors.push('Task title is required and cannot be empty')
      console.log('❌ [TaskService] Title validation failed');
    }

    if (data.title && data.title.length > 200) {
      errors.push('Task title must be less than 200 characters')
      console.log('❌ [TaskService] Title too long:', data.title.length);
    }

    if (data.description && data.description.length > 2000) {
      errors.push('Task description must be less than 2000 characters')
      console.log('❌ [TaskService] Description too long:', data.description.length);
    }

    if (data.estimatedHours && (data.estimatedHours < 0 || data.estimatedHours > 1000)) {
      errors.push('Estimated hours must be between 0 and 1000')
      console.log('❌ [TaskService] Invalid estimated hours:', data.estimatedHours);
    }

    if (data.dueDate) {
      const dueDate = new Date(data.dueDate)
      if (isNaN(dueDate.getTime())) {
        errors.push('Invalid due date format')
        console.log('❌ [TaskService] Invalid due date:', data.dueDate);
      }
    }

    if (data.startDate) {
      const startDate = new Date(data.startDate)
      if (isNaN(startDate.getTime())) {
        errors.push('Invalid start date format')
        console.log('❌ [TaskService] Invalid start date:', data.startDate);
      }
    }

    if (data.startDate && data.dueDate) {
      const startDate = new Date(data.startDate)
      const dueDate = new Date(data.dueDate)
      if (startDate > dueDate) {
        errors.push('Start date cannot be after due date')
        console.log('❌ [TaskService] Start date after due date:', { startDate, dueDate });
      }
    }

    if (errors.length > 0) {
      console.log('❌ [TaskService] Task validation failed with errors:', errors);
      throw new ValidationError('Task validation failed', errors)
    }

    console.log('✅ [TaskService] Task data validation completed successfully');
  }

  private async validateAssignee(assigneeId: string): Promise<void> {
    console.log('🔍 [TaskService] Validating assignee ID:', assigneeId);
    console.log('🔍 [TaskService] Assignee ID type:', typeof assigneeId);
    console.log('🔍 [TaskService] Assignee ID length:', assigneeId?.length);
    
    // Check if assigneeId is valid
    if (!assigneeId || assigneeId.trim() === '') {
      console.log('❌ [TaskService] Empty or null assignee ID');
      throw new ValidationError('Invalid assignee: assignee ID is required')
    }

    // First, let's get some sample data to understand what's in the database
    console.log('🔍 [TaskService] Checking available employees...');
    const { data: sampleEmployees, error: sampleError } = await supabase
      .from('employees')
      .select('id, user_id, full_name, email, employment_status')
      .limit(5)

    if (sampleEmployees && sampleEmployees.length > 0) {
      console.log('📋 [TaskService] Sample employees in database:');
      sampleEmployees.forEach((emp, index) => {
        console.log(`  ${index + 1}. ID: ${emp.id}, Name: ${emp.full_name}, Status: ${emp.employment_status}`);
      });
    } else {
      console.log('❌ [TaskService] No employees found in database or error:', sampleError?.message);
    }
    
    // First try to find by employee ID (most common case from frontend)
    console.log('🔍 [TaskService] Searching for employee with ID:', assigneeId);
    const { data: employeeData, error: employeeError } = await supabase
      .from('employees')
      .select('id, user_id, full_name, email, employment_status')
      .eq('id', assigneeId)
      .single()

    console.log('🔍 [TaskService] Employee query result:', {
      found: !!employeeData,
      error: employeeError?.message,
      data: employeeData
    });

    if (employeeData && !employeeError) {
      console.log('✅ [TaskService] Found employee:', {
        employeeId: employeeData.id,
        userId: employeeData.user_id,
        fullName: employeeData.full_name,
        status: employeeData.employment_status
      });

      if (!employeeData.user_id) {
        console.log('❌ [TaskService] Employee has no associated user_id:', employeeData);
        throw new ValidationError('Invalid assignee: employee has no associated user account')
      }

      // Verify the user_id exists in users table
      console.log('🔍 [TaskService] Verifying linked user account:', employeeData.user_id);
      const { data: linkedUserData, error: linkedUserError } = await supabase
        .from('users')
        .select('id, email, status')
        .eq('id', employeeData.user_id)
        .single()

      console.log('🔍 [TaskService] Linked user query result:', {
        found: !!linkedUserData,
        error: linkedUserError?.message,
        data: linkedUserData
      });

      if (linkedUserError || !linkedUserData) {
        console.log('⚠️ [TaskService] Linked user not found, but employee exists:', {
          employeeId: employeeData.id,
          employeeName: employeeData.full_name,
          linkedUserId: employeeData.user_id,
          error: linkedUserError?.message
        });
        
        // If employee exists but linked user doesn't exist, log warning but allow assignment
        console.log('⚠️ [TaskService] Data integrity issue: employee exists but linked user account is missing - allowing assignment anyway');
        console.log('⚠️ [TaskService] This should be fixed by admin later');
        return; // Allow the assignment to proceed
      }

      if (linkedUserData.status !== 'active') {
        console.log('❌ [TaskService] User account is inactive:', linkedUserData);
        throw new ValidationError('Invalid assignee: user account is inactive')
      }

      console.log('✅ [TaskService] Employee validation passed');
      return;
    }

    // If not found as employee, try to find the user directly in the users table
    console.log('🔍 [TaskService] Employee not found, trying users table...');
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, status')
      .eq('id', assigneeId)
      .single()

    console.log('🔍 [TaskService] User query result:', {
      found: !!userData,
      error: userError?.message,
      data: userData
    });

    if (userData && !userError) {
      if (userData.status !== 'active') {
        console.log('❌ [TaskService] User account is inactive:', userData);
        throw new ValidationError('Invalid assignee: user account is inactive')
      }
      console.log('✅ [TaskService] Found user directly in users table');
      return;
    }

    // Neither employee nor user found - provide detailed debugging info
    console.log('❌ [TaskService] Assignee not found in employees or users table');
    console.log('❌ [TaskService] Search details:', {
      searchedId: assigneeId,
      searchedIdType: typeof assigneeId,
      searchedIdLength: assigneeId?.length,
      employeeError: employeeError?.message,
      userError: userError?.message
    });
    
    // Let's also check if there are any employees with similar IDs
    const { data: similarEmployees } = await supabase
      .from('employees')
      .select('id, full_name')
      .ilike('id', `%${assigneeId}%`)
      .limit(3)

    if (similarEmployees && similarEmployees.length > 0) {
      console.log('🔍 [TaskService] Found similar employee IDs:');
      similarEmployees.forEach(emp => {
        console.log(`  - ${emp.id} (${emp.full_name})`);
      });
    }
    
    throw new ValidationError('Invalid assignee: user not found')
  }



  private async validateTaskDependencies(dependencies: string[], excludeTaskId?: string): Promise<void> {
    for (const depId of dependencies) {
      if (depId === excludeTaskId) {
        throw new ValidationError('Task cannot depend on itself')
      }

      const task = await this.getTaskById(depId)
      if (!task) {
        throw new ValidationError(`Dependency task not found: ${depId}`)
      }

      // Check for circular dependencies
      if (excludeTaskId && await this.hasCircularDependency(excludeTaskId, depId)) {
        throw new ValidationError('Circular dependency detected')
      }
    }
  }

  private async hasCircularDependency(taskId: string, dependencyId: string): Promise<boolean> {
    const dependency = await this.getTaskById(dependencyId)
    if (!dependency || !dependency.dependencies) return false

    if (dependency.dependencies.includes(taskId)) {
      return true
    }

    for (const depId of dependency.dependencies) {
      if (await this.hasCircularDependency(taskId, depId)) {
        return true
      }
    }

    return false
  }

  private async getTasksWithDependency(taskId: string): Promise<Task[]> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .contains('dependencies', [taskId])

      if (error) throw error

      return data?.map(task => this.mapDatabaseToTask(task)) || []
    } catch (error) {
      return []
    }
  }

  /**
   * Validates if the assigner has authority to assign tasks to the assignee
   * based on role hierarchy and organizational structure
   */
  private async validateTaskAssignment(assignerId: string, assigneeId: string): Promise<void> {
    try {
      console.log(`🔍 [TaskService] Validating task assignment from ${assignerId} to ${assigneeId}`)

      // Get both users' roles and organizational information
      const [assignerRole, assigneeRole, assignerUser, assigneeUser] = await Promise.all([
        this.roleService.getActiveRole(assignerId),
        this.roleService.getActiveRole(assigneeId),
        this.getUserWithHierarchy(assignerId),
        this.getUserWithHierarchy(assigneeId)
      ])

      if (!assignerRole) {
        throw new AuthorizationError('Assigner has no active role')
      }

      if (!assigneeRole) {
        throw new AuthorizationError('Assignee has no active role')
      }

      // Super-admin can assign to anyone
      if (assignerRole.roleName === 'super-admin') {
        console.log(`✅ [TaskService] Super-admin can assign to anyone`)
        return
      }

      // Check if assigner has task assignment permissions
      if (!assignerRole.permissions.includes('tasks.assign') && !assignerRole.permissions.includes('*')) {
        throw new AuthorizationError('Insufficient permissions to assign tasks')
      }

      // Get role levels for hierarchy validation
      const assignerLevel = this.roleService.getRoleLevel(assignerRole.roleName)
      const assigneeLevel = this.roleService.getRoleLevel(assigneeRole.roleName)

      // Managers and above can assign to lower-level roles
      if (assignerLevel > assigneeLevel) {
        console.log(`✅ [TaskService] Role hierarchy allows assignment (${assignerRole.roleName} -> ${assigneeRole.roleName})`)
        return
      }

      // Same level roles can assign within same department if they're managers
      if (assignerLevel === assigneeLevel && assignerLevel >= 3) { // manager level and above
        if (assignerUser?.department_id && assignerUser.department_id === assigneeUser?.department_id) {
          console.log(`✅ [TaskService] Same department manager assignment allowed`)
          return
        }
      }

      // Check direct reporting relationship
      if (assigneeUser?.manager_id === assignerId) {
        console.log(`✅ [TaskService] Direct reporting relationship allows assignment`)
        return
      }

      // HR roles can assign to employees in their scope
      if (assignerRole.roleName === 'hr-admin' || assignerRole.roleName === 'hr-staff') {
        if (assigneeRole.roleName === 'employee' || assigneeLevel <= assignerLevel) {
          console.log(`✅ [TaskService] HR role can assign to employee`)
          return
        }
      }

      throw new AuthorizationError(`Cannot assign task: insufficient authority over assignee`)
    } catch (error) {
      console.error(`❌ [TaskService] Task assignment validation failed:`, error)
      if (error instanceof AuthorizationError) {
        throw error
      }
      throw new AuthorizationError('Task assignment validation failed')
    }
  }

  /**
   * Gets the user ID from an employee ID or returns the ID if it's already a user ID
   */
  private async getUserIdFromAssigneeId(assigneeId: string): Promise<string> {
    console.log('🔍 [TaskService] Getting user ID for assignee:', assigneeId);
    
    // First check if this is already a user ID
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', assigneeId)
      .single()

    if (userData && !userError) {
      console.log('✅ [TaskService] Assignee ID is already a user ID');
      return assigneeId;
    }

    // If not a user ID, try to find the employee and get their user_id
    const { data: employeeData, error: employeeError } = await supabase
      .from('employees')
      .select('user_id, full_name')
      .eq('id', assigneeId)
      .single()

    if (employeeError || !employeeData) {
      console.log('❌ [TaskService] Could not find employee:', assigneeId);
      throw new ValidationError('Could not find employee record for assignee')
    }

    if (!employeeData.user_id) {
      console.log('⚠️ [TaskService] Employee has no linked user account, using employee ID:', {
        employeeId: assigneeId,
        fullName: employeeData.full_name
      });
      // Return the employee ID when no user_id is available
      // The task will be assigned to the employee ID, and our retrieval logic will handle it
      return assigneeId;
    }

    console.log('✅ [TaskService] Found user_id for employee:', {
      employeeId: assigneeId,
      userId: employeeData.user_id,
      fullName: employeeData.full_name
    });

    return employeeData.user_id;
  }

  /**
   * Gets user information including organizational hierarchy
   */
  private async getUserWithHierarchy(userId: string): Promise<any> {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select(`
          id,
          email,
          full_name,
          role,
          department_id,
          manager_id,
          departments:department_id (
            id,
            name
          )
        `)
        .eq('id', userId)
        .single()

      if (error || !user) {
        console.error(`❌ [TaskService] User not found: ${userId}`)
        return null
      }

      return user
    } catch (error) {
      console.error(`❌ [TaskService] Error fetching user hierarchy:`, error)
      return null
    }
  }

  /**
   * Gets all users that the given user can assign tasks to
   */
  async getAssignableUsers(assignerId: string): Promise<any[]> {
    try {
      const assignerRole = await this.roleService.getActiveRole(assignerId)
      if (!assignerRole) {
        return []
      }

      // Super-admin can assign to anyone
      if (assignerRole.roleName === 'super-admin') {
        const { data: allUsers, error } = await supabase
          .from('users')
          .select(`
            id,
            email,
            full_name,
            role,
            department_id,
            departments:department_id (name)
          `)
          .eq('status', 'active')

        return allUsers || []
      }

      const assignerUser = await this.getUserWithHierarchy(assignerId)
      if (!assignerUser) {
        return []
      }

      const assignerLevel = this.roleService.getRoleLevel(assignerRole.roleName)

      let query = supabase
        .from('users')
        .select(`
          id,
          email,
          full_name,
          role,
          department_id,
          manager_id,
          departments:department_id (name)
        `)
        .eq('status', 'active')

      // Build conditions based on role and hierarchy
      const conditions = []

      // Can assign to direct reports
      conditions.push(`manager_id.eq.${assignerId}`)

      // Can assign to lower-level roles in same department
      if (assignerUser.department_id) {
        conditions.push(`and(department_id.eq.${assignerUser.department_id},role_level.lt.${assignerLevel})`)
      }

      // HR can assign to employees
      if (assignerRole.roleName === 'hr-admin' || assignerRole.roleName === 'hr-staff') {
        conditions.push(`role.in.(employee,hr-staff)`)
      }

      // Managers can assign within their scope
      if (assignerLevel >= 3) { // manager level
        conditions.push(`role_level.lte.${assignerLevel - 1}`)
      }

      if (conditions.length > 0) {
        query = query.or(conditions.join(','))
      }

      const { data: users, error } = await query

      if (error) {
        console.error(`❌ [TaskService] Error fetching assignable users:`, error)
        return []
      }

      return users || []
    } catch (error) {
      console.error(`❌ [TaskService] Error in getAssignableUsers:`, error)
      return []
    }
  }

  private mapDatabaseToTask(data: any): Task {
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      assignedTo: data.assigned_to,
      assignedBy: data.assigned_by,
      status: data.status,
      priority: data.priority,
      dueDate: data.due_date,
      startDate: data.start_date,
      completedDate: data.completed_date,
      estimatedHours: data.estimated_hours,
      actualHours: data.actual_hours,
      tags: data.tags || [],
      attachments: data.attachments || [],
      dependencies: data.dependencies || [],
      projectId: data.project_id,
      departmentId: data.department_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      createdBy: data.created_by,
      updatedBy: data.updated_by,
      // Add assignee information for frontend display
      assigneeName: data.assignee?.full_name || 'Unassigned',
      assigneeEmail: data.assignee?.email || null,
      assigneeDepartment: data.assignee?.department?.name || null,
      assignerName: data.assigner?.full_name || null,
      creatorName: data.creator?.full_name || null,
      comments: data.comments?.map((comment: any) => ({
        id: comment.id,
        taskId: comment.task_id,
        userId: comment.user_id,
        comment: comment.comment,
        createdAt: comment.created_at,
        updatedAt: comment.updated_at
      })) || []
    }
  }
}