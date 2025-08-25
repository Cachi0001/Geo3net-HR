import * as cron from 'node-cron'
import { taskNotificationService } from './taskNotification.service'

class TaskSchedulerService {
  private dueDateReminderJob: cron.ScheduledTask | null = null
  private overdueTaskJob: cron.ScheduledTask | null = null

  /**
   * Initialize all scheduled tasks
   */
  initialize(): void {
    this.startDueDateReminderJob()
    this.startOverdueTaskJob()
    console.log('📅 Task scheduler service initialized')
  }

  /**
   * Start the due date reminder job (runs daily at 9:00 AM)
   */
  private startDueDateReminderJob(): void {
    // Run every day at 9:00 AM
    this.dueDateReminderJob = cron.schedule('0 9 * * *', async () => {
      console.log('🔔 Running scheduled due date reminders...')
      try {
        await taskNotificationService.processDueDateReminders()
        console.log('✅ Due date reminders completed successfully')
      } catch (error) {
        console.error('❌ Error in due date reminder job:', error)
      }
    }, {
      timezone: 'Africa/Lagos'
    })

    console.log('📅 Due date reminder job scheduled (daily at 9:00 AM)')
  }

  /**
   * Start the overdue task job (runs every 2 hours during business hours)
   */
  private startOverdueTaskJob(): void {
    // Run every 2 hours from 8 AM to 6 PM on weekdays
    this.overdueTaskJob = cron.schedule('0 8-18/2 * * 1-5', async () => {
      console.log('⚠️ Running overdue task check...')
      try {
        await taskNotificationService.processOverdueTasks()
        console.log('✅ Overdue task check completed successfully')
      } catch (error) {
        console.error('❌ Error in overdue task job:', error)
      }
    }, {
      timezone: 'Africa/Lagos'
    })

    console.log('📅 Overdue task job scheduled (every 2 hours, 8 AM - 6 PM, weekdays)')
  }

  /**
   * Manually trigger due date reminders (for testing or manual execution)
   */
  async triggerDueDateReminders(): Promise<void> {
    console.log('🔔 Manually triggering due date reminders...')
    try {
      await taskNotificationService.processDueDateReminders()
      console.log('✅ Manual due date reminders completed')
    } catch (error) {
      console.error('❌ Error in manual due date reminders:', error)
      throw error
    }
  }

  /**
   * Manually trigger overdue task check (for testing or manual execution)
   */
  async triggerOverdueTaskCheck(): Promise<void> {
    console.log('⚠️ Manually triggering overdue task check...')
    try {
      await taskNotificationService.processOverdueTasks()
      console.log('✅ Manual overdue task check completed')
    } catch (error) {
      console.error('❌ Error in manual overdue task check:', error)
      throw error
    }
  }

  /**
   * Get the status of scheduled jobs
   */
  getJobStatus(): {
    dueDateReminder: {
      scheduled: boolean
      nextRun?: string
    }
    overdueTask: {
      scheduled: boolean
      nextRun?: string
    }
  } {
    return {
      dueDateReminder: {
        scheduled: !!this.dueDateReminderJob,
        nextRun: this.dueDateReminderJob ? 'Daily at 9:00 AM' : undefined
      },
      overdueTask: {
        scheduled: !!this.overdueTaskJob,
        nextRun: this.overdueTaskJob ? 'Every 2 hours (8 AM - 6 PM, weekdays)' : undefined
      }
    }
  }

  /**
   * Stop all scheduled jobs
   */
  shutdown(): void {
    if (this.dueDateReminderJob) {
      this.dueDateReminderJob.stop()
      this.dueDateReminderJob = null
    }

    if (this.overdueTaskJob) {
      this.overdueTaskJob.stop()
      this.overdueTaskJob = null
    }

    console.log('📅 Task scheduler service shutdown')
  }

  /**
   * Restart all scheduled jobs
   */
  restart(): void {
    this.shutdown()
    this.initialize()
    console.log('📅 Task scheduler service restarted')
  }
}

export const taskSchedulerService = new TaskSchedulerService()