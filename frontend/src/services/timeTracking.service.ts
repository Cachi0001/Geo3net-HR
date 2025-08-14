import { apiService } from './api.service';

// Based on the likely response from a summary endpoint
export interface TimeTrackingSummary {
  today: number; // hours
  thisWeek: number; // hours
  thisMonth: number; // hours
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
}

export const timeTrackingService = new TimeTrackingService();
