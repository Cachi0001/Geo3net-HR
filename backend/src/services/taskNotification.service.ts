import { notificationService } from './notification.service'
import { websocketService } from './websocket.service'
import { supabase } from '../config/database'

interface Task {
  id: string
  title: string
  description?: string
  assignedTo?: string
  assignedBy: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold'
  dueDate?: string
  createdAt: string
  updatedAt: string
}

interface TaskComment {
  id: string
  taskId: string
  userId: string
  content: string
  createdAt: string
}

interface User {
  id: string
  fullName: string
  email: string
}

class TaskNotificationService {
  // Get user notification preferences
  async getUserPreferences(userId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('user_notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching user preferences:', error)
        return null
      }

      // Return default preferences if none exist
      if (!data) {
        return {
          taskAssignments: true,
          taskStatusChanges: true,
          taskComments: true,
          dueDateReminders: true,
          bulkAssignments: true,
          priorityChanges: true,
          emailNotifications: true,
          pushNotifications: true,
          reminderFrequency: 'immediate',
          quietHours: {
            enabled: false,
            start: '22:00',
            end: '08:00'
          }
        }
      }

      return {
        taskAssignments: data.task_assignments,
        taskStatusChanges: data.task_status_changes,
        taskComments: data.task_comments,
        dueDateReminders: data.due_date_reminders,
        bulkAssignments: data.bulk_assignments,
        priorityChanges: data.priority_changes,
        emailNotifications: data.email_notifications,
        pushNotifications: data.push_notifications,
        reminderFrequency: data.reminder_frequency,
        quietHours: data.quiet_hours || {
          enabled: false,
          start: '22:00',
          end: '08:00'
        }
      }
    } catch (error) {
      console.error('Error in getUserPreferences:', error)
      return null
    }
  }

  // Update user notification preferences
  async updateUserPreferences(userId: string, preferences: any): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_notification_preferences')
        .upsert({
          user_id: userId,
          task_assignments: preferences.taskAssignments,
          task_status_changes: preferences.taskStatusChanges,
          task_comments: preferences.taskComments,
          due_date_reminders: preferences.dueDateReminders,
          bulk_assignments: preferences.bulkAssignments,
          priority_changes: preferences.priorityChanges,
          email_notifications: preferences.emailNotifications,
          push_notifications: preferences.pushNotifications,
          reminder_frequency: preferences.reminderFrequency,
          quiet_hours: preferences.quietHours,
          updated_at: new Date().toISOString()
        })

      if (error) {
        console.error('Error updating user preferences:', error)
        return false
      }

      console.log(`Updated notification preferences for user ${userId}`)
      return true
    } catch (error) {
      console.error('Error in updateUserPreferences:', error)
      return false
    }
  }

  // Check if user should receive notification based on preferences
  async shouldSendNotification(userId: string, notificationType: string): Promise<boolean> {
    try {
      const preferences = await this.getUserPreferences(userId)
      if (!preferences) return true // Default to sending if preferences can't be loaded

      // Check if notification type is enabled
      const typeMapping: Record<string, string> = {
        'task_assignment': 'taskAssignments',
        'task_status_change': 'taskStatusChanges',
        'task_comment': 'taskComments',
        'task_due_reminder': 'dueDateReminders',
        'bulk_task_assignment': 'bulkAssignments',
        'task_priority_change': 'priorityChanges'
      }

      const preferenceKey = typeMapping[notificationType]
      if (preferenceKey && !preferences[preferenceKey]) {
        return false
      }

      // Check quiet hours
      if (preferences.quietHours?.enabled) {
        const now = new Date()
        const currentTime = now.toTimeString().slice(0, 5) // HH:MM format
        const startTime = preferences.quietHours.start
        const endTime = preferences.quietHours.end

        // Handle quiet hours that span midnight
        if (startTime > endTime) {
          if (currentTime >= startTime || currentTime <= endTime) {
            return false
          }
        } else {
          if (currentTime >= startTime && currentTime <= endTime) {
            return false
          }
        }
      }

      return true
    } catch (error) {
      console.error('Error checking notification preferences:', error)
      return true // Default to sending if check fails
    }
  }

  // Task Assignment Notifications
  async notifyTaskAssignment(task: Task, assignedByUser: User, assignedToUser: User): Promise<void> {
    try {
      if (!task.assignedTo) {
        console.log('No assignee for task, skipping notification')
        return
      }

      // Check if user wants to receive this type of notification
      const shouldSend = await this.shouldSendNotification(task.assignedTo, 'task_assignment')
      if (!shouldSend) {
        console.log(`Skipping task assignment notification for user ${assignedToUser.fullName} due to preferences`)
        return
      }

      // Send push notification
      await notificationService.sendNotification(
        task.assignedTo,
        'task_assignment',
        {
          taskTitle: task.title,
          assignedBy: assignedByUser.fullName,
          dueDate: task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date',
          priority: task.priority.toUpperCase()
        },
        {
          data: {
            taskId: task.id,
            type: 'task_assignment',
            url: `/tasks?taskId=${task.id}`
          },
          actions: [
            {
              action: 'view',
              title: 'View Task',
              icon: '/icons/view-icon.png'
            },
            {
              action: 'dismiss',
              title: 'Dismiss'
            }
          ],
          requireInteraction: task.priority === 'urgent'
        }
      )

      // Send real-time WebSocket notification
      websocketService.sendTaskNotificationToUser(task.assignedTo!, {
        type: 'task_assignment',
        taskId: task.id,
        title: task.title,
        assignedBy: {
          id: assignedByUser.id,
          fullName: assignedByUser.fullName
        },
        assignedTo: {
          id: assignedToUser.id,
          fullName: assignedToUser.fullName
        },
        priority: task.priority,
        dueDate: task.dueDate,
        message: `New task assigned: ${task.title}`,
        timestamp: new Date().toISOString()
      })

      // Notify managers and stakeholders via WebSocket
      await this.notifyTaskStakeholders(task, 'assigned', assignedByUser)

      console.log(`Task assignment notification sent to ${assignedToUser.fullName} for task: ${task.title}`)
    } catch (error) {
      console.error('Failed to send task assignment notification:', error)
    }
  }

  // Task Status Change Notifications
  async notifyTaskStatusChange(
    task: Task, 
    oldStatus: string, 
    newStatus: string, 
    updatedByUser: User
  ): Promise<void> {
    try {
      // Send real-time WebSocket notification for status change
      websocketService.sendTaskStatusChangeNotification(
        task.id, 
        oldStatus, 
        newStatus, 
        {
          id: updatedByUser.id,
          fullName: updatedByUser.fullName
        }
      )

      // Notify the assignee if someone else updated the status
      if (task.assignedTo && updatedByUser.id !== task.assignedTo) {
        const shouldSend = await this.shouldSendNotification(task.assignedTo, 'task_status_change')
        if (shouldSend) {
          await notificationService.sendNotification(
            task.assignedTo,
            'task_status_change',
            {
              taskTitle: task.title,
              newStatus: this.formatStatus(newStatus),
              updatedBy: updatedByUser.fullName
            },
            {
              data: {
                taskId: task.id,
                type: 'task_status_change',
                oldStatus,
                newStatus,
                url: `/tasks?taskId=${task.id}`
              },
              actions: [
                {
                  action: 'view',
                  title: 'View Task'
                }
              ]
            }
          )

          // Send real-time notification to assignee
          websocketService.sendTaskNotificationToUser(task.assignedTo!, {
            type: 'task_status_change',
            taskId: task.id,
            title: task.title,
            oldStatus,
            newStatus,
            updatedBy: {
              id: updatedByUser.id,
              fullName: updatedByUser.fullName
            },
            message: `Task status updated to ${this.formatStatus(newStatus)}`,
            timestamp: new Date().toISOString()
          })
        }
      }

      // Notify the assigner if task is completed or cancelled
      if ((newStatus === 'completed' || newStatus === 'cancelled') && updatedByUser.id !== task.assignedBy) {
        const shouldSend = await this.shouldSendNotification(task.assignedBy, 'task_status_change')
        if (shouldSend) {
          await notificationService.sendNotification(
            task.assignedBy,
            'task_status_change',
            {
              taskTitle: task.title,
              newStatus: this.formatStatus(newStatus),
              updatedBy: updatedByUser.fullName
            },
            {
              data: {
                taskId: task.id,
                type: 'task_status_change',
                oldStatus,
                newStatus,
                url: `/tasks?taskId=${task.id}`
              }
            }
          )

          // Send real-time notification to assigner
          websocketService.sendTaskNotificationToUser(task.assignedBy, {
            type: 'task_completion',
            taskId: task.id,
            title: task.title,
            status: newStatus,
            completedBy: {
              id: updatedByUser.id,
              fullName: updatedByUser.fullName
            },
            message: `Task ${newStatus}: ${task.title}`,
            timestamp: new Date().toISOString()
          })
        }
      }

      // Notify stakeholders about task progress
      await this.notifyTaskStakeholders(task, newStatus, updatedByUser)

      console.log(`Task status change notification sent for task: ${task.title} (${oldStatus} → ${newStatus})`)
    } catch (error) {
      console.error('Failed to send task status change notification:', error)
    }
  }

  // Task Comment Notifications
  async notifyTaskComment(
    task: Task,
    comment: TaskComment,
    commenterUser: User
  ): Promise<void> {
    try {
      const recipientIds: string[] = []

      // Notify assignee if they didn't make the comment
      if (task.assignedTo && commenterUser.id !== task.assignedTo) {
        const shouldSend = await this.shouldSendNotification(task.assignedTo, 'task_comment')
        if (shouldSend) {
          recipientIds.push(task.assignedTo)
        }
      }

      // Notify assigner if they didn't make the comment and aren't the assignee
      if (commenterUser.id !== task.assignedBy && task.assignedBy !== task.assignedTo) {
        const shouldSend = await this.shouldSendNotification(task.assignedBy, 'task_comment')
        if (shouldSend) {
          recipientIds.push(task.assignedBy)
        }
      }

      if (recipientIds.length > 0) {
        await notificationService.sendNotification(
          recipientIds,
          'task_comment',
          {
            taskTitle: task.title,
            commenterName: commenterUser.fullName,
            comment: comment.content.length > 100 
              ? comment.content.substring(0, 100) + '...' 
              : comment.content
          },
          {
            data: {
              taskId: task.id,
              commentId: comment.id,
              type: 'task_comment',
              url: `/tasks?taskId=${task.id}#comment-${comment.id}`
            },
            actions: [
              {
                action: 'view',
                title: 'View Comment'
              },
              {
                action: 'reply',
                title: 'Reply'
              }
            ]
          }
        )
      }

      console.log(`Task comment notification sent for task: ${task.title}`)
    } catch (error) {
      console.error('Failed to send task comment notification:', error)
    }
  }

  // Task Due Date Reminders
  async notifyTaskDueReminder(task: Task): Promise<void> {
    try {
      if (!task.dueDate || task.status === 'completed' || task.status === 'cancelled') {
        return
      }

      if (!task.assignedTo) {
        console.log('No assignee for task, skipping due date reminder')
        return
      }

      const shouldSend = await this.shouldSendNotification(task.assignedTo, 'task_due_reminder')
      if (!shouldSend) {
        console.log(`Skipping due date reminder for user ${task.assignedTo} due to preferences`)
        return
      }

      const dueDate = new Date(task.dueDate)
      const now = new Date()
      const timeDiff = dueDate.getTime() - now.getTime()
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24))

      let reminderType = 'due_soon'
      let reminderMessage = ''

      if (daysDiff < 0) {
        reminderType = 'overdue'
        reminderMessage = `Task "${task.title}" is ${Math.abs(daysDiff)} day(s) overdue!`
      } else if (daysDiff === 0) {
        reminderMessage = `Task "${task.title}" is due today!`
      } else if (daysDiff === 1) {
        reminderMessage = `Task "${task.title}" is due tomorrow!`
      } else if (daysDiff <= 3) {
        reminderMessage = `Task "${task.title}" is due in ${daysDiff} days!`
      } else {
        return // Don't send reminders for tasks due more than 3 days away
      }

      await notificationService.sendNotification(
        task.assignedTo,
        'system_announcement',
        {
          title: reminderType === 'overdue' ? 'Overdue Task' : 'Task Due Reminder',
          message: reminderMessage,
          priority: reminderType === 'overdue' ? 'high' : 'medium'
        },
        {
          data: {
            taskId: task.id,
            type: 'task_due_reminder',
            reminderType,
            url: `/tasks?taskId=${task.id}`
          },
          requireInteraction: reminderType === 'overdue',
          actions: [
            {
              action: 'view',
              title: 'View Task'
            },
            {
              action: 'snooze',
              title: 'Remind Later'
            }
          ]
        }
      )

      console.log(`Task due reminder sent for task: ${task.title} (${reminderType})`)
    } catch (error) {
      console.error('Failed to send task due reminder:', error)
    }
  }

  // Helper method to format status for display
  private formatStatus(status: string): string {
    switch (status) {
      case 'todo': return 'To Do'
      case 'in_progress': return 'In Progress'
      case 'completed': return 'Completed'
      case 'cancelled': return 'Cancelled'
      default: return status
    }
  }

  // Notify task stakeholders (managers, department heads, etc.)
  async notifyTaskStakeholders(task: Task, action: string, actionBy: User): Promise<void> {
    try {
      // Get managers and department heads who should be notified
      const { data: stakeholders, error } = await supabase
        .from('users')
        .select('id, full_name, role')
        .in('role', ['manager', 'hr_admin', 'super_admin'])
        .eq('is_active', true)

      if (error || !stakeholders) {
        console.log('No stakeholders found for task notifications')
        return
      }

      // Send WebSocket notifications to all stakeholders
      for (const stakeholder of stakeholders) {
        websocketService.sendTaskNotificationToUser(stakeholder.id, {
          type: 'task_update',
          taskId: task.id,
          title: task.title,
          action: action,
          actionBy: {
            id: actionBy.id,
            fullName: actionBy.fullName
          },
          assignedTo: task.assignedTo,
          priority: task.priority,
          message: `Task ${action}: ${task.title}`,
          timestamp: new Date().toISOString()
        })
      }

      console.log(`Notified ${stakeholders.length} stakeholders about task ${action}`)
    } catch (error) {
      console.error('Error notifying task stakeholders:', error)
    }
  }

  // Process overdue tasks and send escalation alerts
  async processOverdueTasks(): Promise<void> {
    try {
      console.log('Processing overdue tasks...')
      
      const now = new Date()
      
      const { data: overdueTasks, error } = await supabase
        .from('tasks')
        .select(`
          *,
          assignedToUser:users!tasks_assigned_to_fkey(id, full_name, email, manager_id),
          assignedByUser:users!tasks_assigned_by_fkey(id, full_name, email)
        `)
        .in('status', ['todo', 'in_progress'])
        .not('due_date', 'is', null)
        .lt('due_date', now.toISOString())
      
      if (error) {
        console.error('Error fetching overdue tasks:', error)
        return
      }
      
      if (overdueTasks && overdueTasks.length > 0) {
        console.log(`Found ${overdueTasks.length} overdue tasks`)
        
        for (const task of overdueTasks) {
          await this.sendOverdueTaskAlert(task)
          
          // Add small delay to avoid overwhelming the notification service
          await new Promise(resolve => setTimeout(resolve, 200))
        }
      }
      
      console.log('Overdue tasks processing complete')
    } catch (error) {
      console.error('Error processing overdue tasks:', error)
    }
  }

  // Send overdue task alert with escalation
  private async sendOverdueTaskAlert(task: any): Promise<void> {
    try {
      const dueDate = new Date(task.due_date)
      const now = new Date()
      const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 3600 * 24))
      
      // Send alert to assigned employee
      await notificationService.sendNotification(
        task.assigned_to,
        'system_announcement',
        {
          title: 'Overdue Task Alert',
          message: `Task "${task.title}" is ${daysOverdue} day(s) overdue!`,
          priority: 'high'
        },
        {
          data: {
            taskId: task.id,
            type: 'overdue_task',
            daysOverdue: daysOverdue,
            url: `/tasks?taskId=${task.id}`
          },
          requireInteraction: true,
          actions: [
            {
              action: 'view',
              title: 'View Task'
            },
            {
              action: 'update_status',
              title: 'Update Status'
            }
          ]
        }
      )

      // Send WebSocket notification to employee
      websocketService.sendTaskNotificationToUser(task.assigned_to, {
        type: 'overdue_task',
        taskId: task.id,
        title: task.title,
        daysOverdue: daysOverdue,
        priority: 'urgent',
        message: `OVERDUE: ${task.title} (${daysOverdue} days)`,
        timestamp: new Date().toISOString()
      })

      // Escalate to manager if task is more than 1 day overdue
      if (daysOverdue > 1 && task.assignedToUser?.manager_id) {
        await notificationService.sendNotification(
          task.assignedToUser.manager_id,
          'system_announcement',
          {
            title: 'Employee Overdue Task',
            message: `${task.assignedToUser.full_name}'s task "${task.title}" is ${daysOverdue} days overdue`,
            priority: 'high'
          },
          {
            data: {
              taskId: task.id,
              employeeId: task.assigned_to,
              type: 'overdue_escalation',
              daysOverdue: daysOverdue,
              url: `/tasks?taskId=${task.id}`
            }
          }
        )

        // Send WebSocket notification to manager
        websocketService.sendTaskNotificationToUser(task.assignedToUser.manager_id, {
          type: 'overdue_escalation',
          taskId: task.id,
          title: task.title,
          employee: {
            id: task.assigned_to,
            fullName: task.assignedToUser.full_name
          },
          daysOverdue: daysOverdue,
          message: `Employee overdue task: ${task.title}`,
          timestamp: new Date().toISOString()
        })
      }

      // Escalate to HR/Admin if task is more than 3 days overdue
      if (daysOverdue > 3) {
        const { data: admins } = await supabase
          .from('users')
          .select('id')
          .in('role', ['hr_admin', 'super_admin'])
          .eq('is_active', true)

        if (admins && admins.length > 0) {
          const adminIds = admins.map(admin => admin.id)
          
          await notificationService.sendNotification(
            adminIds,
            'system_announcement',
            {
              title: 'Critical Overdue Task',
              message: `Task "${task.title}" assigned to ${task.assignedToUser?.full_name} is ${daysOverdue} days overdue`,
              priority: 'urgent'
            },
            {
              data: {
                taskId: task.id,
                employeeId: task.assigned_to,
                type: 'critical_overdue',
                daysOverdue: daysOverdue,
                url: `/tasks?taskId=${task.id}`
              }
            }
          )

          // Send WebSocket notifications to all admins
          for (const adminId of adminIds) {
            websocketService.sendTaskNotificationToUser(adminId, {
              type: 'critical_overdue',
              taskId: task.id,
              title: task.title,
              employee: {
                id: task.assigned_to,
                fullName: task.assignedToUser?.full_name
              },
              daysOverdue: daysOverdue,
              message: `CRITICAL: Task overdue ${daysOverdue} days`,
              timestamp: new Date().toISOString()
            })
          }
        }
      }

      console.log(`Sent overdue alert for task: ${task.title} (${daysOverdue} days overdue)`)
    } catch (error) {
      console.error('Error sending overdue task alert:', error)
    }
  }

  // Batch process due date reminders (for scheduled jobs)
  async processDueDateReminders(): Promise<void> {
    try {
      console.log('Processing due date reminders...')
      
      const threeDaysFromNow = new Date()
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)
      
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('*')
        .in('status', ['todo', 'in_progress'])
        .not('due_date', 'is', null)
        .lte('due_date', threeDaysFromNow.toISOString())
      
      if (error) {
        console.error('Error fetching tasks for due date reminders:', error)
        return
      }
      
      if (tasks && tasks.length > 0) {
        console.log(`Found ${tasks.length} tasks with upcoming due dates`)
        
        for (const task of tasks) {
          await this.notifyTaskDueReminder({
            id: task.id,
            title: task.title,
            description: task.description,
            assignedTo: task.assigned_to,
            assignedBy: task.assigned_by,
            priority: task.priority,
            status: task.status,
            dueDate: task.due_date,
            createdAt: task.created_at,
            updatedAt: task.updated_at
          })
          
          // Add small delay to avoid overwhelming the notification service
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }
      
      console.log('Due date reminders processing complete')
    } catch (error) {
      console.error('Error processing due date reminders:', error)
    }
  }
}

export const taskNotificationService = new TaskNotificationService()