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
    try {
      const response = await apiClient.getAttendanceDashboard(date);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || 'Failed to fetch attendance dashboard');
    } catch (error) {
      console.error('Attendance dashboard API error:', error);
      throw error;
    }
  }

 
  async getAttendanceAnalytics(params: {
    startDate?: string;
    endDate?: string;
    departmentId?: string;
  }): Promise<AttendanceAnalytics> {
    try {
      const response = await apiClient.getAttendanceAnalytics(params);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || 'Failed to fetch attendance analytics');
    } catch (error) {
      console.error('Attendance analytics API error:', error);
      throw error;
    }
  }

  /**
   * Get real-time attendance status
   */
  async getRealTimeStatus(): Promise<RealTimeStatus> {
    try {
      const response = await apiClient.getRealTimeStatus();
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || 'Failed to fetch real-time status');
    } catch (error) {
      console.error('Real-time status API error:', error);
      throw error;
    }
  }

  /**
   * Get employee statistics
   */
  async getEmployeeStats(): Promise<any> {
    try {
      const response = await apiClient.getEmployeeStats();
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || 'Failed to fetch employee stats');
    } catch (error) {
      console.error('Employee stats API error:', error);
      throw error;
    }
  }

  /**
   * Get department performance data
   */
  async getDepartmentStats(): Promise<DepartmentStats[]> {
    try {
      const response = await apiClient.getDepartmentStats();
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || 'Failed to fetch department stats');
    } catch (error) {
      console.error('Department stats API error:', error);
      throw error;
    }
  }

  /**
   * Get recent activities/audit logs
   */
  async getRecentActivities(limit: number = 10): Promise<RecentActivity[]> {
    try {
      const response = await apiClient.getRecentActivities();
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || 'Failed to fetch recent activities');
    } catch (error) {
      console.error('Recent activities API error:', error);
      throw error;
    }
  }

  /**
   * Get dashboard metrics
   */
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    try {
      const response = await apiClient.getDashboardMetrics();
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || 'Failed to fetch dashboard metrics');
    } catch (error) {
      console.error('Dashboard metrics API error:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive dashboard data (using new unified endpoint)
   */
  async getDashboardData(): Promise<{
    metrics: DashboardMetrics;
    departmentStats: DepartmentStats[];
    recentActivities: RecentActivity[];
    realTimeStatus?: RealTimeStatus;
  }> {
    try {
      // Try the new unified endpoint first
      const response = await apiClient.getDashboardData();
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || 'Failed to fetch dashboard data');
    } catch (error) {
      console.warn('Unified dashboard endpoint not available, falling back to individual calls');
      // Fallback to individual API calls
      try {
        const [attendanceDashboard, departmentStats, recentActivities] = await Promise.all([
          this.getAttendanceDashboard(),
          this.getDepartmentStats(),
          this.getRecentActivities()
        ]);

        return {
          metrics: attendanceDashboard.summary,
          departmentStats,
          recentActivities
        };
      } catch (fallbackError) {
        console.error('Fallback dashboard data fetch failed:', fallbackError);
        throw fallbackError;
      }
    }
  }
}

export const dashboardApi = new DashboardApiService();
export default dashboardApi;