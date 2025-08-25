import { describe, it, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals'
import { supabase } from '../../src/config/database'
import { taskNotificationService } from '../../src/services/taskNotification.service'
import { websocketService } from '../../src/services/websocket.service'
import { TaskService } from '../../src/services/task.service'

// Mock WebSocket service for testing
jest.mock('../../src/services/websocket.service', () => ({
  websocketService: {
    sendTaskNotificationToUser: jest.fn(),
    sendTaskStatusChangeNotification: jest.fn(),
    broadcastTaskProgressUpdate: jest.fn()
  }
}))

describe('Task Notification Integration Tests', () => {
  let testUsers: any[] = []
  let testTask: any = null
  let taskService: TaskService

  beforeAll(async () => {
    taskService = new TaskService()
    
    // Create test users
    const { data: users, error } = await supabase
      .from('users')
      .insert([
        {
          id: 'test-manager-001',
          full_name: 'Test Manager',
          email: 'manager@test.com',
          role: 'manager',
          is_active: true
        },
        {
          id: 'test-employee-001',
          full_name: 'Test Employee',
          email: 'employee@test.com',
          role: 'employee',
          is_active: true
        }
      ])
      .select()

    if (error) {
      console.error('Failed to create test users:', error)
    } else {
      testUsers = users || []
    }
  })

  afterAll(async () => {
    // Clean up test data
    if (testTask) {
      await supabase.from('tasks').delete().eq('id', testTask.id)
    }
    
    if (testUsers.length > 0) {
      const userIds = testUsers.map(u => u.id)
      await supabase.from('users').delete().in('id', userIds)
    }
  })

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks()
  })

  describe('Task Assignment Notifications', () => {
    it('should send notifications when a task is assigned', async () => {
      const manager = testUsers.find(u => u.role === 'manager')
      const employee = testUsers.find(u => u.role === 'employee')

      if (!manager || !employee) {
        throw new Error('Test users not found')
      }

      // Create a task
      const result = await taskService.createTask({
        title: 'Test Task for Notifications',
        description: 'This is a test task',
        assignedTo: employee.id,
        priority: 'medium',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
      }, manager.id)

      expect(result.success).toBe(true)
      expect(result.task).toBeDefined()
      testTask = result.task

      // Verify WebSocket notification was sent
      expect(websocketService.sendTaskNotificationToUser).toHaveBeenCalledWith(
        employee.id,
        expect.objectContaining({
          type: 'task_assignment',
          taskId: testTask.id,
          title: 'Test Task for Notifications',
          assignedBy: expect.objectContaining({
            id: manager.id,
            fullName: manager.full_name
          }),
          assignedTo: expect.objectContaining({
            id: employee.id,
            fullName: employee.full_name
          })
        })
      )
    })

    it('should not send notifications when assigning task to self', async () => {
      const manager = testUsers.find(u => u.role === 'manager')

      if (!manager) {
        throw new Error('Manager user not found')
      }

      // Create a task assigned to self
      const result = await taskService.createTask({
        title: 'Self Assigned Task',
        description: 'Task assigned to self',
        assignedTo: manager.id,
        priority: 'low'
      }, manager.id)

      expect(result.success).toBe(true)

      // Should not send notification when assigning to self
      expect(websocketService.sendTaskNotificationToUser).not.toHaveBeenCalled()

      // Clean up
      if (result.task) {
        await supabase.from('tasks').delete().eq('id', result.task.id)
      }
    })
  })

  describe('Task Status Change Notifications', () => {
    it('should send notifications when task status changes', async () => {
      const manager = testUsers.find(u => u.role === 'manager')
      const employee = testUsers.find(u => u.role === 'employee')

      if (!manager || !employee || !testTask) {
        throw new Error('Required test data not found')
      }

      // Clear previous mocks
      jest.clearAllMocks()

      // Update task status
      const result = await taskService.updateTask(testTask.id, {
        status: 'in_progress'
      }, employee.id)

      expect(result.success).toBe(true)

      // Verify WebSocket status change notification was sent
      expect(websocketService.sendTaskStatusChangeNotification).toHaveBeenCalledWith(
        testTask.id,
        'pending', // old status
        'in_progress', // new status
        expect.objectContaining({
          id: employee.id,
          fullName: employee.full_name
        })
      )
    })

    it('should send completion notification to assigner', async () => {
      const manager = testUsers.find(u => u.role === 'manager')
      const employee = testUsers.find(u => u.role === 'employee')

      if (!manager || !employee || !testTask) {
        throw new Error('Required test data not found')
      }

      // Clear previous mocks
      jest.clearAllMocks()

      // Complete the task
      const result = await taskService.updateTask(testTask.id, {
        status: 'completed'
      }, employee.id)

      expect(result.success).toBe(true)

      // Verify completion notification was sent to assigner
      expect(websocketService.sendTaskNotificationToUser).toHaveBeenCalledWith(
        manager.id,
        expect.objectContaining({
          type: 'task_completion',
          taskId: testTask.id,
          status: 'completed',
          completedBy: expect.objectContaining({
            id: employee.id,
            fullName: employee.full_name
          })
        })
      )
    })
  })

  describe('Overdue Task Processing', () => {
    it('should process overdue tasks and send alerts', async () => {
      const employee = testUsers.find(u => u.role === 'employee')
      const manager = testUsers.find(u => u.role === 'manager')

      if (!employee || !manager) {
        throw new Error('Test users not found')
      }

      // Create an overdue task (due yesterday)
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)

      const { data: overdueTask, error } = await supabase
        .from('tasks')
        .insert({
          title: 'Overdue Test Task',
          description: 'This task is overdue',
          assigned_to: employee.id,
          assigned_by: manager.id,
          status: 'todo',
          priority: 'medium',
          due_date: yesterday.toISOString(),
          created_by: manager.id
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(overdueTask).toBeDefined()

      // Process overdue tasks
      await taskNotificationService.processOverdueTasks()

      // Verify overdue notification was sent
      expect(websocketService.sendTaskNotificationToUser).toHaveBeenCalledWith(
        employee.id,
        expect.objectContaining({
          type: 'overdue_task',
          taskId: overdueTask.id,
          title: 'Overdue Test Task',
          daysOverdue: expect.any(Number)
        })
      )

      // Clean up
      await supabase.from('tasks').delete().eq('id', overdueTask.id)
    })
  })

  describe('Due Date Reminders', () => {
    it('should process due date reminders for upcoming tasks', async () => {
      const employee = testUsers.find(u => u.role === 'employee')
      const manager = testUsers.find(u => u.role === 'manager')

      if (!employee || !manager) {
        throw new Error('Test users not found')
      }

      // Create a task due tomorrow
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      const { data: upcomingTask, error } = await supabase
        .from('tasks')
        .insert({
          title: 'Upcoming Due Task',
          description: 'This task is due soon',
          assigned_to: employee.id,
          assigned_by: manager.id,
          status: 'todo',
          priority: 'medium',
          due_date: tomorrow.toISOString(),
          created_by: manager.id
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(upcomingTask).toBeDefined()

      // Process due date reminders
      await taskNotificationService.processDueDateReminders()

      // Note: Due date reminders use the notification service, not WebSocket directly
      // This test verifies the method runs without errors
      // In a real scenario, you would mock the notification service and verify calls

      // Clean up
      await supabase.from('tasks').delete().eq('id', upcomingTask.id)
    })
  })

  describe('Notification Preferences', () => {
    it('should respect user notification preferences', async () => {
      const employee = testUsers.find(u => u.role === 'employee')

      if (!employee) {
        throw new Error('Employee user not found')
      }

      // Set user preferences to disable task assignments
      await supabase
        .from('user_notification_preferences')
        .upsert({
          user_id: employee.id,
          task_assignments: false,
          email_notifications: false,
          push_notifications: false
        })

      // Check if notification should be sent
      const shouldSend = await taskNotificationService.shouldSendNotification(
        employee.id,
        'task_assignment'
      )

      expect(shouldSend).toBe(false)

      // Clean up preferences
      await supabase
        .from('user_notification_preferences')
        .delete()
        .eq('user_id', employee.id)
    })
  })
})