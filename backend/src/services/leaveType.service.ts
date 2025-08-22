import { supabase } from '../config/database'
import { 
  LeaveType, 
  CreateLeaveTypeData, 
  UpdateLeaveTypeData, 
  LeaveTypeResult 
} from '../types/leave.types'
import { ValidationError, NotFoundError, ConflictError } from '../utils/errors'

export class LeaveTypeService {
  
  async createLeaveType(data: CreateLeaveTypeData, createdBy: string): Promise<LeaveTypeResult> {
    try {
      // Validate required fields
      this.validateLeaveTypeData(data)

      // Check if leave type with same name already exists
      const existingType = await this.getLeaveTypeByName(data.name)
      if (existingType) {
        throw new ConflictError('Leave type with this name already exists')
      }

      // Create leave type record
      const { data: newLeaveType, error } = await supabase
        .from('leave_types')
        .insert({
          name: data.name,
          description: data.description,
          color_code: data.colorCode || '#007bff',
          is_paid: data.isPaid !== undefined ? data.isPaid : true,
          requires_approval: data.requiresApproval !== undefined ? data.requiresApproval : true,
          max_consecutive_days: data.maxConsecutiveDays,
          advance_notice_days: data.advanceNoticeDays || 0,
          is_active: true,
          created_by: createdBy
        })
        .select()
        .single()

      if (error) throw error

      const leaveType = this.mapDatabaseToLeaveType(newLeaveType)

      return {
        success: true,
        message: 'Leave type created successfully',
        leaveType
      }
    } catch (error) {
      if (error instanceof ConflictError || error instanceof ValidationError) {
        throw error
      }
      throw new Error('Failed to create leave type')
    }
  }

  async getLeaveTypeById(id: string): Promise<LeaveType | null> {
    try {
      const { data, error } = await supabase
        .from('leave_types')
        .select('*')
        .eq('id', id)
        .single()

      if (error || !data) return null

      return this.mapDatabaseToLeaveType(data)
    } catch (error) {
      return null
    }
  }

  async getLeaveTypeByName(name: string): Promise<LeaveType | null> {
    try {
      const { data, error } = await supabase
        .from('leave_types')
        .select('*')
        .eq('name', name)
        .single()

      if (error || !data) return null

      return this.mapDatabaseToLeaveType(data)
    } catch (error) {
      return null
    }
  }

  async getAllLeaveTypes(includeInactive: boolean = false): Promise<LeaveTypeResult> {
    try {
      let query = supabase
        .from('leave_types')
        .select('*')
        .order('name')

      if (!includeInactive) {
        query = query.eq('is_active', true)
      }

      const { data, error } = await query

      if (error) throw error

      const leaveTypes = data?.map(type => this.mapDatabaseToLeaveType(type)) || []

      return {
        success: true,
        message: 'Leave types retrieved successfully',
        leaveTypes
      }
    } catch (error) {
      throw new Error('Failed to retrieve leave types')
    }
  }

  async updateLeaveType(id: string, data: UpdateLeaveTypeData, updatedBy: string): Promise<LeaveTypeResult> {
    try {
      // Check if leave type exists
      const existingType = await this.getLeaveTypeById(id)
      if (!existingType) {
        throw new NotFoundError('Leave type not found')
      }

      // Check for name conflicts if name is being updated
      if (data.name && data.name !== existingType.name) {
        const conflictingType = await this.getLeaveTypeByName(data.name)
        if (conflictingType) {
          throw new ConflictError('Leave type with this name already exists')
        }
      }

      // Update leave type record
      const { data: updatedLeaveType, error } = await supabase
        .from('leave_types')
        .update({
          name: data.name,
          description: data.description,
          color_code: data.colorCode,
          is_paid: data.isPaid,
          requires_approval: data.requiresApproval,
          max_consecutive_days: data.maxConsecutiveDays,
          advance_notice_days: data.advanceNoticeDays,
          is_active: data.isActive,
          updated_by: updatedBy,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      const leaveType = this.mapDatabaseToLeaveType(updatedLeaveType)

      return {
        success: true,
        message: 'Leave type updated successfully',
        leaveType
      }
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ConflictError) {
        throw error
      }
      throw new Error('Failed to update leave type')
    }
  }

  async deleteLeaveType(id: string, deletedBy: string): Promise<LeaveTypeResult> {
    try {
      // Check if leave type exists
      const existingType = await this.getLeaveTypeById(id)
      if (!existingType) {
        throw new NotFoundError('Leave type not found')
      }

      // Check if leave type is being used in any policies or requests
      const isInUse = await this.isLeaveTypeInUse(id)
      if (isInUse) {
        // Soft delete by deactivating instead of hard delete
        const { error } = await supabase
          .from('leave_types')
          .update({
            is_active: false,
            updated_by: deletedBy,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)

        if (error) throw error

        return {
          success: true,
          message: 'Leave type deactivated successfully (cannot delete as it is in use)'
        }
      } else {
        // Hard delete if not in use
        const { error } = await supabase
          .from('leave_types')
          .delete()
          .eq('id', id)

        if (error) throw error

        return {
          success: true,
          message: 'Leave type deleted successfully'
        }
      }
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error
      }
      throw new Error('Failed to delete leave type')
    }
  }

  private async isLeaveTypeInUse(leaveTypeId: string): Promise<boolean> {
    try {
      // Check if used in policies
      const { data: policies, error: policyError } = await supabase
        .from('leave_policies')
        .select('id')
        .eq('leave_type_id', leaveTypeId)
        .limit(1)

      if (policyError) throw policyError
      if (policies && policies.length > 0) return true

      // Check if used in requests
      const { data: requests, error: requestError } = await supabase
        .from('leave_requests')
        .select('id')
        .eq('leave_type_id', leaveTypeId)
        .limit(1)

      if (requestError) throw requestError
      if (requests && requests.length > 0) return true

      return false
    } catch (error) {
      // If we can't determine usage, err on the side of caution
      return true
    }
  }

  private validateLeaveTypeData(data: CreateLeaveTypeData): void {
    const errors: string[] = []

    if (!data.name?.trim()) {
      errors.push('Leave type name is required')
    }

    if (data.name && data.name.length > 100) {
      errors.push('Leave type name must be 100 characters or less')
    }

    if (data.description && data.description.length > 500) {
      errors.push('Description must be 500 characters or less')
    }

    if (data.colorCode && !/^#[0-9A-F]{6}$/i.test(data.colorCode)) {
      errors.push('Color code must be a valid hex color (e.g., #007bff)')
    }

    if (data.maxConsecutiveDays !== undefined && data.maxConsecutiveDays < 1) {
      errors.push('Maximum consecutive days must be at least 1')
    }

    if (data.advanceNoticeDays !== undefined && data.advanceNoticeDays < 0) {
      errors.push('Advance notice days cannot be negative')
    }

    if (errors.length > 0) {
      throw new ValidationError('Validation failed', errors)
    }
  }

  private mapDatabaseToLeaveType(data: any): LeaveType {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      colorCode: data.color_code,
      isPaid: data.is_paid,
      requiresApproval: data.requires_approval,
      maxConsecutiveDays: data.max_consecutive_days,
      advanceNoticeDays: data.advance_notice_days,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      createdBy: data.created_by,
      updatedBy: data.updated_by
    }
  }
}