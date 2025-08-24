import { supabase } from '../config/database'
import { AppError } from '../utils/errors'

export interface Location {
  id: string
  name: string
  address: string
  latitude?: number
  longitude?: number
  radius_meters: number
  is_default: boolean
  is_active: boolean
  timezone: string
  created_by: string
  created_at: Date
  updated_at: Date
}

export interface AttendancePolicy {
  id: string
  name: string
  work_hours_start: string
  work_hours_end: string
  break_duration_minutes: number
  late_arrival_threshold_minutes: number
  overtime_threshold_minutes: number
  require_location_verification: boolean
  allow_early_checkin_minutes: number
  allow_late_checkout_minutes: number
  is_default: boolean
  is_active: boolean
  created_by: string
  created_at: Date
  updated_at: Date
}

export interface CheckinSettings {
  require_photo: boolean
  auto_checkout_hours: number
  allow_offline_checkin: boolean
  require_location_verification: boolean
  gps_accuracy_threshold: number
}

export interface NotificationSettings {
  late_arrival_alert: boolean
  missed_checkout_alert: boolean
  overtime_alert: boolean
  email_notifications: boolean
  sms_notifications: boolean
  push_notifications: boolean
}

export interface SystemConfig {
  company_name: string
  working_days: number[]
  default_timezone: string
  date_format: string
  time_format: string
  currency: string
}

export class SettingsService {
  /**
   * Location Management Methods
   */

  async createLocation(locationData: Omit<Location, 'id' | 'created_at' | 'updated_at'>): Promise<Location> {
    // Check if location name already exists
    const { data: existingLocation, error: checkError } = await supabase
      .from('office_locations')
      .select('id')
      .eq('name', locationData.name)
      .eq('is_active', true)
      .single();
    
    if (existingLocation && !checkError) {
      throw new AppError('Location with this name already exists', 409);
    }

    const { data, error } = await supabase
      .from('office_locations')
      .insert({
        name: locationData.name,
        address: locationData.address,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        radius_meters: locationData.radius_meters,
        is_default: locationData.is_default,
        is_active: locationData.is_active,
        timezone: locationData.timezone,
        created_by: locationData.created_by
      })
      .select()
      .single();
    
    if (error) {
      throw new AppError('Failed to create location', 500);
    }
    
    return this.mapDatabaseToLocation(data);
  }

  async getLocations(page: number = 1, limit: number = 10, filters: any = {}): Promise<{
    locations: Location[]
    total: number
    page: number
    limit: number
  }> {
    let query = supabase
      .from('office_locations')
      .select('*', { count: 'exact' });

    // Apply filters
    if (filters.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive);
    }

    // Apply pagination and ordering
    const offset = (page - 1) * limit;
    query = query
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    
    if (error) {
      throw new AppError('Failed to fetch locations', 500);
    }

    return {
      locations: data.map(row => this.mapDatabaseToLocation(row)),
      total: count || 0,
      page,
      limit
    };
  }

  async getLocationById(id: string): Promise<Location | null> {
    const { data, error } = await supabase
      .from('office_locations')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();
    
    if (error || !data) {
      return null;
    }

    return this.mapDatabaseToLocation(data);
  }

  async updateLocation(id: string, updateData: Partial<Location>): Promise<Location | null> {
    // Check if location exists
    const { data: existingLocation, error: checkError } = await supabase
      .from('office_locations')
      .select('id')
      .eq('id', id)
      .eq('is_active', true)
      .single();
    
    if (!existingLocation || checkError) {
      return null;
    }

    // Check if name already exists (if name is being updated)
    if (updateData.name) {
      const { data: nameCheck, error: nameError } = await supabase
        .from('office_locations')
        .select('id')
        .eq('name', updateData.name)
        .neq('id', id)
        .eq('is_active', true)
        .single();
      
      if (nameCheck && !nameError) {
        throw new AppError('Location with this name already exists', 409);
      }
    }

    // Filter out fields that shouldn't be updated
    const filteredData = Object.fromEntries(
      Object.entries(updateData).filter(([key]) => 
        key !== 'id' && key !== 'created_at' && key !== 'updated_at'
      )
    );

    if (Object.keys(filteredData).length === 0) {
      throw new AppError('No valid fields to update', 400);
    }

    const { data, error } = await supabase
      .from('office_locations')
      .update(filteredData)
      .eq('id', id)
      .eq('is_active', true)
      .select()
      .single();
    
    if (error || !data) {
      return null;
    }
    
    return this.mapDatabaseToLocation(data);
  }

  async deleteLocation(id: string): Promise<boolean> {
    // Check if location is being used in time entries
    const { data: timeEntries, error: checkError } = await supabase
      .from('check_in_records')
      .select('id')
      .eq('location_id', id)
      .limit(1);

    if (timeEntries && timeEntries.length > 0) {
      throw new AppError('Cannot delete location that has associated time entries', 409);
    }

    const { error } = await supabase
      .from('office_locations')
      .update({ is_active: false })
      .eq('id', id);
    
    return !error;
  }

  async setDefaultLocation(id: string): Promise<boolean> {
    // Check if location exists and is active
    const { data: location, error: checkError } = await supabase
      .from('office_locations')
      .select('id')
      .eq('id', id)
      .eq('is_active', true)
      .single();
    
    if (!location || checkError) {
      throw new AppError('Location not found', 404);
    }

    // Remove default from all locations
    const { error: removeDefaultError } = await supabase
      .from('office_locations')
      .update({ is_default: false })
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all rows
    
    if (removeDefaultError) {
      throw new AppError('Failed to update default location', 500);
    }

    // Set new default
    const { error: setDefaultError } = await supabase
      .from('office_locations')
      .update({ is_default: true })
      .eq('id', id)
      .eq('is_active', true);
    
    if (setDefaultError) {
      throw new AppError('Failed to set default location', 500);
    }
    
    return true;
  }

  /**
   * Attendance Policy Methods
   */

  async createAttendancePolicy(policyData: Omit<AttendancePolicy, 'id' | 'created_at' | 'updated_at'>): Promise<AttendancePolicy> {
    // Check if policy name already exists
    const { data: existingPolicy, error: checkError } = await supabase
      .from('attendance_policies')
      .select('id')
      .eq('name', policyData.name)
      .eq('is_active', true)
      .single();
    
    if (existingPolicy && !checkError) {
      throw new AppError('Attendance policy with this name already exists', 409);
    }

    const { data, error } = await supabase
      .from('attendance_policies')
      .insert({
        name: policyData.name,
        work_hours_start: policyData.work_hours_start,
        work_hours_end: policyData.work_hours_end,
        break_duration_minutes: policyData.break_duration_minutes,
        late_arrival_threshold_minutes: policyData.late_arrival_threshold_minutes,
        overtime_threshold_minutes: policyData.overtime_threshold_minutes,
        require_location_verification: policyData.require_location_verification,
        allow_early_checkin_minutes: policyData.allow_early_checkin_minutes,
        allow_late_checkout_minutes: policyData.allow_late_checkout_minutes,
        is_default: policyData.is_default,
        is_active: policyData.is_active,
        created_by: policyData.created_by
      })
      .select()
      .single();
    
    if (error) {
      throw new AppError('Failed to create attendance policy', 500);
    }
    
    return this.mapDatabaseToAttendancePolicy(data);
  }

  async getAttendancePolicies(page: number = 1, limit: number = 10, filters: any = {}): Promise<{
    policies: AttendancePolicy[]
    total: number
    page: number
    limit: number
  }> {
    let query = supabase
      .from('attendance_policies')
      .select('*', { count: 'exact' });

    // Apply filters
    if (filters.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive);
    }

    // Apply pagination and ordering
    const offset = (page - 1) * limit;
    query = query
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    
    if (error) {
      throw new AppError('Failed to fetch attendance policies', 500);
    }

    return {
      policies: data.map(row => this.mapDatabaseToAttendancePolicy(row)),
      total: count || 0,
      page,
      limit
    };
  }

  async getAttendancePolicyById(id: string): Promise<AttendancePolicy | null> {
    const { data, error } = await supabase
      .from('attendance_policies')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();
    
    if (error || !data) {
      return null;
    }

    return this.mapDatabaseToAttendancePolicy(data);
  }

  async updateAttendancePolicy(id: string, updateData: Partial<AttendancePolicy>): Promise<AttendancePolicy | null> {
    // Check if policy exists
    const { data: existingPolicy, error: checkError } = await supabase
      .from('attendance_policies')
      .select('id')
      .eq('id', id)
      .eq('is_active', true)
      .single();
    
    if (!existingPolicy || checkError) {
      return null;
    }

    // Check if name already exists (if name is being updated)
    if (updateData.name) {
      const { data: nameCheck, error: nameError } = await supabase
        .from('attendance_policies')
        .select('id')
        .eq('name', updateData.name)
        .neq('id', id)
        .eq('is_active', true)
        .single();
      
      if (nameCheck && !nameError) {
        throw new AppError('Attendance policy with this name already exists', 409);
      }
    }

    // Filter out fields that shouldn't be updated
    const filteredData = Object.fromEntries(
      Object.entries(updateData).filter(([key]) => 
        key !== 'id' && key !== 'created_at' && key !== 'updated_at'
      )
    );

    if (Object.keys(filteredData).length === 0) {
      throw new AppError('No valid fields to update', 400);
    }

    const { data, error } = await supabase
      .from('attendance_policies')
      .update(filteredData)
      .eq('id', id)
      .eq('is_active', true)
      .select()
      .single();
    
    if (error || !data) {
      return null;
    }
    
    return this.mapDatabaseToAttendancePolicy(data);
  }

  async deleteAttendancePolicy(id: string): Promise<boolean> {
    // Check if policy is being used by employees
    const { data: employees, error: checkError } = await supabase
      .from('employees')
      .select('id')
      .eq('attendance_policy_id', id)
      .limit(1);

    if (employees && employees.length > 0) {
      throw new AppError('Cannot delete attendance policy that is assigned to employees', 409);
    }

    const { error } = await supabase
      .from('attendance_policies')
      .update({ is_active: false })
      .eq('id', id);
    
    return !error;
  }

  async setDefaultAttendancePolicy(id: string): Promise<boolean> {
    // Check if policy exists and is active
    const { data: policy, error: checkError } = await supabase
      .from('attendance_policies')
      .select('id')
      .eq('id', id)
      .eq('is_active', true)
      .single();
    
    if (!policy || checkError) {
      throw new AppError('Attendance policy not found', 404);
    }

    // Remove default from all policies
    const { error: removeDefaultError } = await supabase
      .from('attendance_policies')
      .update({ is_default: false })
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all rows
    
    if (removeDefaultError) {
      throw new AppError('Failed to update default policy', 500);
    }

    // Set new default
    const { error: setDefaultError } = await supabase
      .from('attendance_policies')
      .update({ is_default: true })
      .eq('id', id)
      .eq('is_active', true);
    
    if (setDefaultError) {
      throw new AppError('Failed to set default policy', 500);
    }
    
    return true;
  }

  /**
   * Settings Methods
   */

  async getCheckinSettings(): Promise<CheckinSettings> {
    const { data, error } = await supabase
      .from('system_settings')
      .select('setting_key, setting_value')
      .eq('setting_type', 'checkin')
      .eq('is_active', true);
    
    if (error) {
      throw new AppError('Failed to fetch check-in settings', 500);
    }
    
    const settings: CheckinSettings = {
      require_photo: false,
      auto_checkout_hours: 12,
      allow_offline_checkin: false,
      require_location_verification: true,
      gps_accuracy_threshold: 100
    };
    
    data.forEach((row: any) => {
      const key = row.setting_key.replace('checkin_', '');
      if (key in settings) {
        (settings as any)[key] = JSON.parse(row.setting_value);
      }
    });
    
    return settings;
  }

  async updateCheckinSettings(settings: CheckinSettings): Promise<CheckinSettings> {
    for (const [key, value] of Object.entries(settings)) {
      const settingKey = `checkin_${key}`;
      
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          setting_key: settingKey,
          setting_value: JSON.stringify(value),
          setting_type: 'checkin',
          description: `Check-in setting: ${key}`,
          is_active: true
        }, {
          onConflict: 'setting_key'
        });
      
      if (error) {
        throw new AppError(`Failed to update check-in setting: ${key}`, 500);
      }
    }
    
    return settings;
  }

  async getNotificationSettings(): Promise<NotificationSettings> {
    const { data, error } = await supabase
      .from('system_settings')
      .select('setting_key, setting_value')
      .eq('setting_type', 'notification')
      .eq('is_active', true);
    
    if (error) {
      throw new AppError('Failed to fetch notification settings', 500);
    }
    
    const settings: NotificationSettings = {
      late_arrival_alert: true,
      missed_checkout_alert: true,
      overtime_alert: true,
      email_notifications: true,
      sms_notifications: false,
      push_notifications: true
    };
    
    data.forEach((row: any) => {
      const key = row.setting_key.replace('notification_', '');
      if (key in settings) {
        (settings as any)[key] = JSON.parse(row.setting_value);
      }
    });
    
    return settings;
  }

  async updateNotificationSettings(settings: NotificationSettings): Promise<NotificationSettings> {
    for (const [key, value] of Object.entries(settings)) {
      const settingKey = `notification_${key}`;
      
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          setting_key: settingKey,
          setting_value: JSON.stringify(value),
          setting_type: 'notification',
          description: `Notification setting: ${key}`,
          is_active: true
        }, {
          onConflict: 'setting_key'
        });
      
      if (error) {
        throw new AppError(`Failed to update notification setting: ${key}`, 500);
      }
    }
    
    return settings;
  }

  async getSystemConfig(): Promise<SystemConfig> {
    const { data, error } = await supabase
      .from('system_settings')
      .select('setting_key, setting_value')
      .eq('setting_type', 'general')
      .eq('is_active', true);
    
    if (error) {
      throw new AppError('Failed to fetch system configuration', 500);
    }
    
    const config: SystemConfig = {
      company_name: 'Go3net HR Management System',
      working_days: [1, 2, 3, 4, 5],
      default_timezone: 'UTC',
      date_format: 'YYYY-MM-DD',
      time_format: '24h',
      currency: 'USD'
    };
    
    data.forEach((row: any) => {
      const key = row.setting_key.replace('general_', '');
      if (key in config) {
        (config as any)[key] = JSON.parse(row.setting_value);
      }
    });
    
    return config;
  }

  async updateSystemConfig(config: SystemConfig): Promise<SystemConfig> {
    for (const [key, value] of Object.entries(config)) {
      const settingKey = `general_${key}`;
      
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          setting_key: settingKey,
          setting_value: JSON.stringify(value),
          setting_type: 'general',
          description: `General setting: ${key}`,
          is_active: true
        }, {
          onConflict: 'setting_key'
        });
      
      if (error) {
        throw new AppError(`Failed to update system setting: ${key}`, 500);
      }
    }
    
    return config;
  }

  /**
   * Dashboard and Analytics Methods
   */

  async getAttendanceDashboard(date?: string): Promise<any> {
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    // Get today's attendance summary
    const { data: attendanceData, error } = await supabase
      .from('check_in_records')
      .select(`
        id, employee_id, check_in_time, check_out_time, status,
        employees!inner(full_name, employee_id, department)
      `)
      .gte('check_in_time', `${targetDate}T00:00:00`)
      .lt('check_in_time', `${targetDate}T23:59:59`);
    
    if (error) {
      throw new AppError('Failed to fetch attendance dashboard data', 500);
    }

    // Calculate statistics
    const totalEmployees = await this.getTotalEmployeeCount();
    const presentToday = attendanceData.length;
    const lateArrivals = attendanceData.filter((entry: any) => entry.status === 'late').length;
    const onLeave = await this.getEmployeesOnLeave(targetDate);

    return {
      date: targetDate,
      summary: {
        totalEmployees,
        presentToday,
        lateArrivals,
        onLeave,
        absentToday: totalEmployees - presentToday - onLeave
      },
      attendanceList: attendanceData
    };
  }

  async getAttendanceAnalytics(params: {
    startDate?: string
    endDate?: string
    departmentId?: string
  }): Promise<any> {
    const { startDate, endDate, departmentId } = params;
    
    // This would contain complex analytics queries
    // For now, return a placeholder structure
    return {
      period: { startDate, endDate },
      departmentId,
      analytics: {
        averageWorkHours: 8.2,
        punctualityRate: 85.5,
        overtimeHours: 120.5,
        absenteeismRate: 3.2,
        trends: {
          daily: [],
          weekly: [],
          monthly: []
        }
      }
    };
  }

  async getRealTimeAttendanceStatus(): Promise<any> {
    const today = new Date().toISOString().split('T')[0];
    
    // Get current check-in status
    const { data: statusData, error } = await supabase
      .from('check_in_records')
      .select(`
        id, employee_id, check_in_time, check_out_time, status,
        employees!inner(full_name, employee_id, department)
      `)
      .gte('check_in_time', `${today}T00:00:00`)
      .is('check_out_time', null);
    
    if (error) {
      throw new AppError('Failed to fetch real-time attendance status', 500);
    }

    return {
      timestamp: new Date().toISOString(),
      currentlyCheckedIn: statusData.length,
      activeEmployees: statusData
    };
  }

  /**
   * Helper Methods
   */

  private async getTotalEmployeeCount(): Promise<number> {
    const { count, error } = await supabase
      .from('employees')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');
    
    if (error) {
      throw new AppError('Failed to get total employee count', 500);
    }
    
    return count || 0;
  }

  private async getEmployeesOnLeave(date: string): Promise<number> {
    const { count, error } = await supabase
      .from('leave_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved')
      .lte('start_date', date)
      .gte('end_date', date);
    
    if (error) {
      throw new AppError('Failed to get employees on leave count', 500);
    }
    
    return count || 0;
  }

  /**
   * Database Mapping Methods
   */

  private mapDatabaseToLocation(data: any): Location {
    return {
      id: data.id,
      name: data.name,
      address: data.address,
      latitude: data.latitude,
      longitude: data.longitude,
      radius_meters: data.radius_meters,
      is_default: data.is_default,
      is_active: data.is_active,
      timezone: data.timezone,
      created_by: data.created_by,
      created_at: data.created_at,
      updated_at: data.updated_at
    }
  }

  private mapDatabaseToAttendancePolicy(data: any): AttendancePolicy {
    return {
      id: data.id,
      name: data.name,
      work_hours_start: data.work_hours_start,
      work_hours_end: data.work_hours_end,
      break_duration_minutes: data.break_duration_minutes,
      late_arrival_threshold_minutes: data.late_arrival_threshold_minutes,
      overtime_threshold_minutes: data.overtime_threshold_minutes,
      require_location_verification: data.require_location_verification,
      allow_early_checkin_minutes: data.allow_early_checkin_minutes,
      allow_late_checkout_minutes: data.allow_late_checkout_minutes,
      is_default: data.is_default,
      is_active: data.is_active,
      created_by: data.created_by,
      created_at: data.created_at,
      updated_at: data.updated_at
    }
  }


}