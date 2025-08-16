import { apiService } from './api.service'
import { DashboardStats } from '../types/design-system'

export interface DashboardStatistics {
  employees: {
    total: number
    active: number
    newThisMonth: number
    departments: { [key: string]: number }
  }
  tasks: {
    total: number
    completed: number
    overdue: number
    inProgress: number
  }
  timeTracking: {
    totalHoursToday: number
    activeUsers: number
    averageHours: number
  }
  system: {
    uptime: number
    activeUsers: number
    securityAlerts: number
  }
}

class DashboardService {
  async getEmployeeStatistics(): Promise<any> {
    try {
      const response = await apiService.get('/employees/statistics')
      return response.data
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
            value: employees?.total || 0,
            icon: require('lucide-react').Users,
            change: employees?.newThisMonth ? {
              value: Math.round((employees.newThisMonth / employees.total) * 100),
              period: 'last month',
              type: 'positive' as const
            } : undefined,
            color: 'blue' as const
          },
          {
            title: 'System Health',
            value: system?.uptime ? `${system.uptime}%` : '99.9%',
            icon: require('lucide-react').TrendingUp,
            change: {
              value: 0.1,
              period: 'uptime',
              type: 'positive' as const
            },
            color: 'green' as const
          },
          {
            title: 'Active Sessions',
            value: system?.activeUsers || 0,
            icon: require('lucide-react').Shield,
            change: {
              value: 5,
              period: 'last week',
              type: 'positive' as const
            },
            color: 'cyan' as const
          },
          {
            title: 'Security Alerts',
            value: system?.securityAlerts || 0,
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
            change: employees?.newThisMonth ? {
              value: Math.round((employees.newThisMonth / employees.total) * 100),
              period: 'last month',
              type: 'positive' as const
            } : undefined,
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
            value: employees?.departments ? Object.keys(employees.departments).length : 0,
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