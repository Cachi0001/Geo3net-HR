import { Request, Response } from 'express';
import { supabase } from '../config/database';
import { ResponseHandler } from '../utils/response';
import { AppError } from '../utils/errors';
import { AuthenticatedRequest } from '../middleware/permission';

export interface AttendancePolicy {
  id: string;
  name: string;
  work_hours_start: string;
  work_hours_end: string;
  break_duration_minutes: number;
  late_arrival_threshold_minutes: number;
  overtime_threshold_minutes: number;
  require_location_verification: boolean;
  allow_early_checkin_minutes: number;
  allow_late_checkout_minutes: number;
  is_default: boolean;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAttendancePolicyRequest {
  name: string;
  work_hours_start: string;
  work_hours_end: string;
  break_duration_minutes?: number;
  late_arrival_threshold_minutes?: number;
  overtime_threshold_minutes?: number;
  require_location_verification?: boolean;
  allow_early_checkin_minutes?: number;
  allow_late_checkout_minutes?: number;
  is_default?: boolean;
  is_active?: boolean;
}

export class AttendancePolicyController {
  /**
   * Get all attendance policies
   */
  async getAttendancePolicies(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      console.log('📋 Fetching attendance policies...');
      
      const { data: policies, error } = await supabase
        .from('attendance_policies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching attendance policies:', error);
        throw new AppError('Failed to fetch attendance policies', 500);
      }

      console.log(`✅ Found ${policies?.length || 0} attendance policies`);
      return ResponseHandler.success(res, 'Attendance policies retrieved successfully', policies || []);
    } catch (error: any) {
      console.error('❌ Get attendance policies error:', error);
      return ResponseHandler.internalError(res, error.message || 'Failed to retrieve attendance policies');
    }
  }

  /**
   * Get attendance policy by ID
   */
  async getAttendancePolicyById(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      console.log('📋 Fetching attendance policy:', id);

      const { data: policy, error } = await supabase
        .from('attendance_policies')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('❌ Error fetching attendance policy:', error);
        if (error.code === 'PGRST116') {
          return ResponseHandler.notFound(res, 'Attendance policy not found');
        }
        throw new AppError('Failed to fetch attendance policy', 500);
      }

      console.log('✅ Attendance policy found:', policy.name);
      return ResponseHandler.success(res, 'Attendance policy retrieved successfully', policy);
    } catch (error: any) {
      console.error('❌ Get attendance policy error:', error);
      return ResponseHandler.internalError(res, error.message || 'Failed to retrieve attendance policy');
    }
  }

  /**
   * Create new attendance policy
   */
  async createAttendancePolicy(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const policyData: CreateAttendancePolicyRequest = req.body;
      
      console.log('➕ Creating attendance policy:', policyData.name);

      // Validate required fields
      if (!policyData.name || !policyData.work_hours_start || !policyData.work_hours_end) {
        return ResponseHandler.badRequest(res, 'Name, work hours start, and work hours end are required');
      }

      // If this is set as default, unset other defaults
      if (policyData.is_default) {
        await supabase
          .from('attendance_policies')
          .update({ is_default: false })
          .eq('is_default', true);
      }

      const newPolicy = {
        ...policyData,
        created_by: userId,
        break_duration_minutes: policyData.break_duration_minutes || 60,
        late_arrival_threshold_minutes: policyData.late_arrival_threshold_minutes || 15,
        overtime_threshold_minutes: policyData.overtime_threshold_minutes || 480,
        require_location_verification: policyData.require_location_verification ?? true,
        allow_early_checkin_minutes: policyData.allow_early_checkin_minutes || 30,
        allow_late_checkout_minutes: policyData.allow_late_checkout_minutes || 60,
        is_default: policyData.is_default || false,
        is_active: policyData.is_active ?? true,
      };

      const { data: policy, error } = await supabase
        .from('attendance_policies')
        .insert([newPolicy])
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating attendance policy:', error);
        if (error.code === '23505') {
          return ResponseHandler.badRequest(res, 'Attendance policy with this name already exists');
        }
        throw new AppError('Failed to create attendance policy', 500);
      }

      console.log('✅ Attendance policy created:', policy.id);
      return ResponseHandler.created(res, 'Attendance policy created successfully', policy);
    } catch (error: any) {
      console.error('❌ Create attendance policy error:', error);
      return ResponseHandler.internalError(res, error.message || 'Failed to create attendance policy');
    }
  }

  /**
   * Update attendance policy
   */
  async updateAttendancePolicy(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const updateData: Partial<CreateAttendancePolicyRequest> = req.body;
      
      console.log('✏️ Updating attendance policy:', id);

      // If this is set as default, unset other defaults
      if (updateData.is_default) {
        await supabase
          .from('attendance_policies')
          .update({ is_default: false })
          .eq('is_default', true)
          .neq('id', id);
      }

      const { data: policy, error } = await supabase
        .from('attendance_policies')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating attendance policy:', error);
        if (error.code === 'PGRST116') {
          return ResponseHandler.notFound(res, 'Attendance policy not found');
        }
        if (error.code === '23505') {
          return ResponseHandler.badRequest(res, 'Attendance policy with this name already exists');
        }
        throw new AppError('Failed to update attendance policy', 500);
      }

      console.log('✅ Attendance policy updated:', policy.name);
      return ResponseHandler.success(res, 'Attendance policy updated successfully', policy);
    } catch (error: any) {
      console.error('❌ Update attendance policy error:', error);
      return ResponseHandler.internalError(res, error.message || 'Failed to update attendance policy');
    }
  }

  /**
   * Delete attendance policy
   */
  async deleteAttendancePolicy(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      console.log('🗑️ Deleting attendance policy:', id);

      // Check if this is the default policy
      const { data: policy } = await supabase
        .from('attendance_policies')
        .select('is_default, name')
        .eq('id', id)
        .single();

      if (policy?.is_default) {
        return ResponseHandler.badRequest(res, 'Cannot delete the default attendance policy');
      }

      const { error } = await supabase
        .from('attendance_policies')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Error deleting attendance policy:', error);
        throw new AppError('Failed to delete attendance policy', 500);
      }

      console.log('✅ Attendance policy deleted');
      return ResponseHandler.success(res, 'Attendance policy deleted successfully');
    } catch (error: any) {
      console.error('❌ Delete attendance policy error:', error);
      return ResponseHandler.internalError(res, error.message || 'Failed to delete attendance policy');
    }
  }

  /**
   * Set default attendance policy
   */
  async setDefaultPolicy(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      console.log('🎯 Setting default attendance policy:', id);

      // Unset all other defaults
      await supabase
        .from('attendance_policies')
        .update({ is_default: false })
        .eq('is_default', true);

      // Set this one as default
      const { data: policy, error } = await supabase
        .from('attendance_policies')
        .update({ is_default: true })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Error setting default policy:', error);
        if (error.code === 'PGRST116') {
          return ResponseHandler.notFound(res, 'Attendance policy not found');
        }
        throw new AppError('Failed to set default policy', 500);
      }

      console.log('✅ Default policy set:', policy.name);
      return ResponseHandler.success(res, 'Default attendance policy set successfully', policy);
    } catch (error: any) {
      console.error('❌ Set default policy error:', error);
      return ResponseHandler.internalError(res, error.message || 'Failed to set default policy');
    }
  }

  /**
   * Get default attendance policy
   */
  async getDefaultPolicy(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      console.log('🎯 Fetching default attendance policy...');

      const { data: policy, error } = await supabase
        .from('attendance_policies')
        .select('*')
        .eq('is_default', true)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('❌ Error fetching default policy:', error);
        if (error.code === 'PGRST116') {
          return ResponseHandler.notFound(res, 'No default attendance policy found');
        }
        throw new AppError('Failed to fetch default policy', 500);
      }

      console.log('✅ Default policy found:', policy.name);
      return ResponseHandler.success(res, 'Default attendance policy retrieved successfully', policy);
    } catch (error: any) {
      console.error('❌ Get default policy error:', error);
      return ResponseHandler.internalError(res, error.message || 'Failed to retrieve default policy');
    }
  }
}