import { apiClient } from './api';

export interface DashboardMetrics {
  totalEmployees: number;
  presentToday: number;
  lateArrivals: number;
  onLeave: number;
  absentToday: number;
}

export interface AttendanceDashboard {
  date: string;
  summary: DashboardMetrics;
  attendanceList: any[];
}

export interface AttendanceAnalytics {
  period: {
    startDate?: string;
    endDate?: string;
  };
  departmentId?: string;
  analytics: {
    averageWorkHours: number;
    punctualityRate: number;
    overtimeHours: number;
    absenteeismRate: number;
    trends: {
      daily: any[];
      weekly: any[];
      monthly: any[];
    };
  };
}

export interface RealTimeStatus {
  timestamp: string;
  currentlyCheckedIn: number;
  activeEmployees: any[];
}

export interface DepartmentStats {
  department: string;
  employees: number;
  present: number;
  absent: number;
  performance: number;
}

export interface RecentActivity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  user?: string;
}

class DashboardApiService {
  /**
   * Get attendance dashboard data
   */
  async getAttendanceDashboard(date?: string): Promise<AttendanceDashboard> {
    const params = date ? { date } : {};
    const response = await apiClient.get('/settings/attendance-dashboard', { params });
    return response.data.data;
  }

  /**
   * Get attendance analytics
   */
  async getAttendanceAnalytics(params: {
    startDate?: string;
    endDate?: string;
    departmentId?: string;
  }): Promise<AttendanceAnalytics> {
    const response = await apiClient.get('/settings/attendance-analytics', { params });
    return response.data.data;
  }

  /**
   * Get real-time attendance status
   */
  async getRealTimeStatus(): Promise<RealTimeStatus> {
    const response = await apiClient.get('/dashboard/real-time-status');
    return response.data.data;
  }

  /**
   * Get employee statistics
   */
  async getEmployeeStats(): Promise<any> {
    const response = await apiClient.get('/employees/stats');
    return response.data.data;
  }

  /**
   * Get department performance data
   */
  async getDepartmentStats(): Promise<DepartmentStats[]> {
    try {
      const response = await apiClient.get('/dashboard/department-stats');
      return response.data.data;
    } catch (error) {
      // Fallback to mock data if endpoint doesn't exist yet
      return [
        { department: 'Engineering', employees: 25, present: 23, absent: 2, performance: 92 },
        { department: 'Marketing', employees: 15, present: 14, absent: 1, performance: 88 },
        { department: 'Sales', employees: 20, present: 18, absent: 2, performance: 85 },
        { department: 'HR', employees: 8, present: 8, absent: 0, performance: 95 }
      ];
    }
  }

  /**
   * Get recent activities/audit logs
   */
  async getRecentActivities(limit: number = 10): Promise<RecentActivity[]> {
    try {
      const response = await apiClient.get('/dashboard/recent-activities', { params: { limit } });
      return response.data.data;
    } catch (error) {
      // Fallback to mock data if endpoint doesn't exist yet
      return [
        {
          id: '1',
          type: 'check-in',
          description: 'John Doe checked in',
          timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
          user: 'John Doe'
        },
        {
          id: '2',
          type: 'leave-request',
          description: 'Sarah Wilson submitted leave request',
          timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
          user: 'Sarah Wilson'
        },
        {
          id: '3',
          type: 'task-completed',
          description: 'Mike Johnson completed project milestone',
          timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
          user: 'Mike Johnson'
        }
      ];
    }
  }

  /**
   * Get comprehensive dashboard data (using new unified endpoint)
   */
  async getDashboardData(): Promise<{
    metrics: DashboardMetrics;
    departmentStats: DepartmentStats[];
    recentActivities: RecentActivity[];
    realTimeStatus: RealTimeStatus;
  }> {
    try {
      // Try the new unified endpoint first
      const response = await apiClient.get('/dashboard/data');
      return response.data.data;
    } catch (error) {
      console.warn('Unified dashboard endpoint not available, falling back to individual calls');
      // Fallback to individual API calls
      const [attendanceDashboard, departmentStats, recentActivities, realTimeStatus] = await Promise.all([
        this.getAttendanceDashboard(),
        this.getDepartmentStats(),
        this.getRecentActivities(),
        this.getRealTimeStatus()
      ]);

      return {
        metrics: attendanceDashboard.summary,
        departmentStats,
        recentActivities,
        realTimeStatus
      };
    }
  }
}

export const dashboardApi = new DashboardApiService();
export default dashboardApi;