import { apiService } from './api.service'
import { DashboardStats } from '../types/design-system'

export interface DashboardStatistics {
  employees?: {
    total: number
    active: number
    inactive: number
    onLeave: number
    terminated: number
    byDepartment: Record<string, number>
    byPosition: Record<string, number>
    recentHires: number
  }
  tasks?: {
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
  timeTracking?: {
    totalHoursToday?: number
    activeUsers?: number
    averageHours?: number
  }
  system?: {
    needsInitialization: boolean
    totalUsers: number
    roleDistribution: Record<string, number>
    systemReady: boolean
  }
}

class DashboardService {
  async getEmployeeStatistics(): Promise<any> {
    try {
      const response = await apiService.get('/employees/statistics')
      // Backend wraps statistics under data.statistics
      return response.data?.statistics
    } catch (error) {
      console.error('Error fetching employee statistics:', error)
      throw error
    }
  }

  async getTaskStatistics(): Promise<any> {
    try {
      const response = await apiService.get('/tasks/statistics')
      return response.data
    } catch (error) {
      console.error('Error fetching task statistics:', error)
      throw error
    }
  }

  async getTimeTrackingStatistics(): Promise<any> {
    try {
      const response = await apiService.get('/time-tracking/team/statistics')
      return response.data
    } catch (error) {
      console.error('Error fetching time tracking statistics:', error)
      throw error
    }
  }

  async getSystemStatistics(): Promise<any> {
    try {
      const response = await apiService.get('/system/status')
      return response.data
    } catch (error) {
      console.error('Error fetching system statistics:', error)
      throw error
    }
  }

  async getDashboardStats(userRole: string): Promise<DashboardStats[]> {
    try {
      const [employeeStats, taskStats, timeStats, systemStats] = await Promise.allSettled([
        this.getEmployeeStatistics(),
        this.getTaskStatistics(),
        this.getTimeTrackingStatistics(),
        this.getSystemStatistics()
      ])

      return this.formatStatsForRole(userRole, {
        employees: employeeStats.status === 'fulfilled' ? employeeStats.value : null,
        tasks: taskStats.status === 'fulfilled' ? taskStats.value : null,
        timeTracking: timeStats.status === 'fulfilled' ? timeStats.value : null,
        system: systemStats.status === 'fulfilled' ? systemStats.value : null
      })
    } catch (error) {
      console.error('Error fetching dashboard statistics:', error)
      throw error
    }
  }

  private formatStatsForRole(role: string, data: any): DashboardStats[] {
    const { employees, tasks, timeTracking, system } = data

    switch (role) {
      case 'super-admin':
        return [
          {
            title: 'Total Users',
            value: system?.totalUsers || 0,
            icon: require('lucide-react').Users,
            change: employees?.recentHires && employees?.total
              ? {
                  value: Math.round((employees.recentHires / employees.total) * 100),
                  period: 'last 30 days',
                  type: 'positive' as const
                }
              : undefined,
            color: 'blue' as const
          },
          {
            title: 'System Health',
            value: system?.systemReady ? 'Ready' : 'Setup required',
            icon: require('lucide-react').TrendingUp,
            change: {
              value: 0.1,
              period: 'uptime',
              type: 'positive' as const
            },
            color: 'green' as const
          },
          {
            title: 'Active Roles',
            value: Object.keys(system?.roleDistribution || {}).length || 0,
            icon: require('lucide-react').Shield,
            change: {
              value: 5,
              period: 'last week',
              type: 'positive' as const
            },
            color: 'cyan' as const
          },
          {
            title: 'Init Alerts',
            value: system?.needsInitialization ? 1 : 0,
            icon: require('lucide-react').AlertTriangle,
            change: {
              value: 2,
              period: 'yesterday',
              type: 'negative' as const
            },
            color: 'orange' as const
          }
        ]

      case 'hr-admin':
        return [
          {
            title: 'Total Employees',
            value: employees?.total || 0,
            icon: require('lucide-react').Users,
            change: employees?.recentHires && employees?.total
              ? {
                  value: Math.round((employees.recentHires / employees.total) * 100),
                  period: 'last 30 days',
                  type: 'positive' as const
                }
              : undefined,
            color: 'blue' as const
          },
          {
            title: 'Active Employees',
            value: employees?.active || 0,
            icon: require('lucide-react').UserCheck,
            change: {
              value: 15,
              period: 'this week',
              type: 'positive' as const
            },
            color: 'green' as const
          },
          {
            title: 'Departments',
            value: employees?.byDepartment ? Object.keys(employees.byDepartment).length : 0,
            icon: require('lucide-react').Building,
            change: {
              value: 3,
              period: 'this month',
              type: 'positive' as const
            },
            color: 'purple' as const
          },
          {
            title: 'Total Tasks',
            value: tasks?.total || 0,
            icon: require('lucide-react').ClipboardList,
            change: tasks?.completed ? {
              value: Math.round((tasks.completed / tasks.total) * 100),
              period: 'completion rate',
              type: 'positive' as const
            } : undefined,
            color: 'orange' as const
          }
        ]

      case 'manager':
        return [
          {
            title: 'Team Tasks',
            value: tasks?.total || 0,
            icon: require('lucide-react').ClipboardList,
            change: tasks?.completed ? {
              value: Math.round((tasks.completed / tasks.total) * 100),
              period: 'completion rate',
              type: 'positive' as const
            } : undefined,
            color: 'blue' as const
          },
          {
            title: 'Completed Tasks',
            value: tasks?.completed || 0,
            icon: require('lucide-react').CheckCircle,
            change: {
              value: 12,
              period: 'this week',
              type: 'positive' as const
            },
            color: 'green' as const
          },
          {
            title: 'Team Performance',
            value: '94%',
            icon: require('lucide-react').TrendingUp,
            change: {
              value: 5,
              period: 'last month',
              type: 'positive' as const
            },
            color: 'cyan' as const
          },
          {
            title: 'Overdue Tasks',
            value: tasks?.overdue || 0,
            icon: require('lucide-react').AlertCircle,
            change: {
              value: 2,
              period: 'this week',
              type: 'negative' as const
            },
            color: 'orange' as const
          }
        ]

      default: // employee
        return [
          {
            title: 'My Tasks',
            value: tasks?.total || 0,
            icon: require('lucide-react').ClipboardList,
            change: {
              value: 3,
              period: 'yesterday',
              type: 'positive' as const
            },
            color: 'blue' as const
          },
          {
            title: 'Completed Today',
            value: tasks?.completed || 0,
            icon: require('lucide-react').CheckCircle,
            change: {
              value: 2,
              period: 'yesterday',
              type: 'positive' as const
            },
            color: 'green' as const
          },
          {
            title: 'Hours Today',
            value: timeTracking?.totalHoursToday || 0,
            icon: require('lucide-react').Clock,
            change: {
              value: 0,
              period: 'target: 8h',
              type: 'neutral' as const
            },
            color: 'cyan' as const
          },
          {
            title: 'This Week Progress',
            value: '78%',
            icon: require('lucide-react').TrendingUp,
            change: {
              value: 12,
              period: 'this week',
              type: 'positive' as const
            },
            color: 'purple' as const
          }
        ]
    }
  }
}

export const dashboardService = new DashboardService()