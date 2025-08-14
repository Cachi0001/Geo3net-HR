import { apiService } from './api.service';

// Based on the likely response from a summary endpoint
export interface TimeTrackingSummary {
  today: number; // hours
  thisWeek: number; // hours
  thisMonth: number; // hours
}

export interface TeamAttendanceStatistics {
  present: number;
  absent: number;
  onLeave: number;
  late: number;
}

export interface AttendanceRecord {
  id: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  totalHours: number;
  status: 'present' | 'absent' | 'partial' | 'late';
}

export interface AttendanceSummary {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  partialDays: number;
  totalHours: number;
  averageHours: number;
}

class TimeTrackingService {
  public async getTimeTrackingSummary(): Promise<TimeTrackingSummary> {
    try {
      const response = await apiService.get('/time-tracking/summary');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch time tracking summary:', error);
      throw error;
    }
  }

  public async getTeamAttendanceStatistics(): Promise<TeamAttendanceStatistics> {
    try {
      const response = await apiService.get('/time-tracking/team/statistics');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch team attendance statistics:', error);
      throw error;
    }
  }

  public async getAttendanceHistory(period: string): Promise<AttendanceRecord[]> {
    try {
      const response = await apiService.get('/time-tracking/attendance', { params: { period } });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch attendance history:', error);
      throw error;
    }
  }

  public async getAttendanceSummary(period: string): Promise<AttendanceSummary> {
    try {
      const response = await apiService.get('/time-tracking/attendance/summary', { params: { period } });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch attendance summary:', error);
      throw error;
    }
  }

  public async getCheckInStatus(): Promise<any> { // TODO: Define CheckInOutStatus interface
    try {
      const response = await apiService.get('/time-tracking/status');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch check-in status:', error);
      throw error;
    }
  }

  public async checkIn(data: { timestamp: string; location?: any }): Promise<any> {
    try {
      const response = await apiService.post('/time-tracking/check-in', data);
      return response.data;
    } catch (error) {
      console.error('Failed to check in:', error);
      throw error;
    }
  }

  public async checkOut(data: { timestamp: string; location?: any }): Promise<any> {
    try {
      const response = await apiService.post('/time-tracking/check-out', data);
      return response.data;
    } catch (error) {
      console.error('Failed to check out:', error);
      throw error;
    }
  }
}

export const timeTrackingService = new TimeTrackingService();
