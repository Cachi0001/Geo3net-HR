import { supabase } from '../config/database'
import { 
  LeaveRequest, 
  CreateLeaveRequestData, 
  UpdateLeaveRequestData, 
  LeaveRequestResult,
  LeaveSearchFilters,
  ConflictCheck
} from '../types/leave.types'
import { ValidationError, NotFoundError, ConflictError } from '../utils/errors'
import { LeaveBalanceService } from './leaveBalance.service'
import { LeaveTypeService } from './leaveType.service'

export class LeaveRequestService {
  private leaveBalanceService: LeaveBalanceService
  private leaveTypeService: LeaveTypeService

  constructor() {
    this.leaveBalanceService = new LeaveBalanceService()
    this.leaveTypeService = new LeaveTypeService()
  }

  async createLeaveRequest(data: CreateLeaveRequestData, employeeId: string): Promise<LeaveRequestResult> {
    try {
      // Validate request data
      this.validateLeaveRequestData(data)

      // Check if leave type exists and is active
      const leaveType = await this.leaveTypeService.getLeaveTypeById(data.leaveTypeId)
      if (!leaveType || !leaveType.isActive) {
        throw new ValidationError('Invalid or inactive leave type')
      }

      // Calculate total days
      const startDate = new Date(data.startDate)
      const endDate = new Date(data.endDate)
      const totalDays = this.calculateLeaveDays(startDate, endDate)

      // Validate dates
      this.validateLeaveDates(startDate, endDate, leaveType)

      // Check for conflicts with existing requests
      const conflictCheck = await this.checkLeaveConflicts(employeeId, startDate, endDate)
      if (conflictCheck.hasConflict) {
        throw new ConflictError(conflictCheck.message || 'Leave request conflicts with existing requests')
      }

      // Check available balance if leave type requires approval
      if (leaveType.requiresApproval) {
        const availableBalance = await this.leaveBalanceService.calculateAvailableLeave(employeeId, data.leaveTypeId)
        if (availableBalance < totalDays) {
          throw new ValidationError(`Insufficient leave balance. Available: ${availableBalance} days, Requested: ${totalDays} days`)
        }
      }

      // Create the leave request
      const { data: newRequest, error } = await supabase
        .from('leave_requests')
        .insert({
          employee_id: employeeId,
          leave_type_id: data.leaveTypeId,
          start_date: data.startDate,
          end_date: data.endDate,
          total_days: totalDays,
          reason: data.reason,
          status: 'pending',
          emergency_contact_notified: data.emergencyContactNotified || false,
          attachments: data.attachments || [],
          created_by: employeeId
        })
        .select(`
          *,
          employee:employees(id, full_name, employee_id),
          leave_type:leave_types(*)
        `)
        .single()

      if (error) throw error

      // Update pending balance
      await this.updatePendingBalance(employeeId, data.leaveTypeId, totalDays, 'add')

      const leaveRequest = this.mapDatabaseToLeaveRequest(newRequest)

      return {
        success: true,
        message: 'Leave request created successfully',
        leaveRequest
      }
    } catch (error) {
      if (error instanceof ValidationError || error instanceof ConflictError) {
        throw error
      }
      throw new Error('Failed to create leave request')
    }
  }

  async getLeaveRequestById(id: string): Promise<LeaveRequest | null> {
    try {
      const { data, error } = await supabase
        .from('leave_requests')
        .select(`
          *,
          employee:employees(id, full_name, employee_id),
          leave_type:leave_types(*),
          approver:employees!approved_by(id, full_name, employee_id)
        `)
        .eq('id', id)
        .single()

      if (error || !data) return null

      return this.mapDatabaseToLeaveRequest(data)
    } catch (error) {
      return null
    }
  }

  async updateLeaveRequest(id: string, data: UpdateLeaveRequestData, updatedBy: string): Promise<LeaveRequestResult> {
    try {
      // Check if request exists
      const existingRequest = await this.getLeaveRequestById(id)
      if (!existingRequest) {
        throw new NotFoundError('Leave request not found')
      }

      // Only allow updates to pending requests (unless it's a status change by manager)
      if (existingRequest.status !== 'pending' && !data.status) {
        throw new ValidationError('Only pending requests can be modified')
      }

      let updateFields: any = {
        updated_by: updatedBy,
        updated_at: new Date().toISOString()
      }

      // Handle date changes
      if (data.startDate || data.endDate) {
        const startDate = new Date(data.startDate || existingRequest.startDate)
        const endDate = new Date(data.endDate || existingRequest.endDate)
        const totalDays = this.calculateLeaveDays(startDate, endDate)

        // Validate new dates
        const leaveType = await this.leaveTypeService.getLeaveTypeById(existingRequest.leaveTypeId)
        if (leaveType) {
          this.validateLeaveDates(startDate, endDate, leaveType)
        }

        // Check for conflicts (excluding current request)
        const conflictCheck = await this.checkLeaveConflicts(
          existingRequest.employeeId, 
          startDate, 
          endDate, 
          id
        )
        if (conflictCheck.hasConflict) {
          throw new ConflictError(conflictCheck.message || 'Updated dates conflict with existing requests')
        }

        // Update pending balance if days changed
        const daysDifference = totalDays - existingRequest.totalDays
        if (daysDifference !== 0) {
          await this.updatePendingBalance(
            existingRequest.employeeId, 
            existingRequest.leaveTypeId, 
            Math.abs(daysDifference), 
            daysDifference > 0 ? 'add' : 'subtract'
          )
        }

        updateFields = {
          ...updateFields,
          start_date: data.startDate,
          end_date: data.endDate,
          total_days: totalDays
        }
      }

      // Handle other field updates
      if (data.reason !== undefined) updateFields.reason = data.reason
      if (data.emergencyContactNotified !== undefined) updateFields.emergency_contact_notified = data.emergencyContactNotified
      if (data.attachments !== undefined) updateFields.attachments = data.attachments
      if (data.status !== undefined) updateFields.status = data.status
      if (data.denialReason !== undefined) updateFields.denial_reason = data.denialReason

      // Update the request
      const { data: updatedRequest, error } = await supabase
        .from('leave_requests')
        .update(updateFields)
        .eq('id', id)
        .select(`
          *,
          employee:employees(id, full_name, employee_id),
          leave_type:leave_types(*),
          approver:employees!approved_by(id, full_name, employee_id)
        `)
        .single()

      if (error) throw error

      const leaveRequest = this.mapDatabaseToLeaveRequest(updatedRequest)

      return {
        success: true,
        message: 'Leave request updated successfully',
        leaveRequest
      }
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError || error instanceof ConflictError) {
        throw error
      }
      throw new Error('Failed to update leave request')
    }
  }

  async approveLeaveRequest(id: string, approvedBy: string, comments?: string): Promise<LeaveRequestResult> {
    try {
      const existingRequest = await this.getLeaveRequestById(id)
      if (!existingRequest) {
        throw new NotFoundError('Leave request not found')
      }

      if (existingRequest.status !== 'pending') {
        throw new ValidationError('Only pending requests can be approved')
      }

      // Update request status
      const { data: approvedRequest, error } = await supabase
        .from('leave_requests')
        .update({
          status: 'approved',
          approved_by: approvedBy,
          approved_at: new Date().toISOString(),
          updated_by: approvedBy,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          *,
          employee:employees(id, full_name, employee_id),
          leave_type:leave_types(*),
          approver:employees!approved_by(id, full_name, employee_id)
        `)
        .single()

      if (error) throw error

      // Move from pending to used balance
      await this.updatePendingBalance(
        existingRequest.employeeId, 
        existingRequest.leaveTypeId, 
        existingRequest.totalDays, 
        'subtract'
      )

      await this.leaveBalanceService.updateBalance(
        existingRequest.employeeId, 
        existingRequest.leaveTypeId, 
        {
          type: 'usage',
          amount: existingRequest.totalDays,
          reason: `Approved leave request: ${existingRequest.startDate} to ${existingRequest.endDate}`,
          effectiveDate: existingRequest.startDate
        }
      )

      const leaveRequest = this.mapDatabaseToLeaveRequest(approvedRequest)

      return {
        success: true,
        message: 'Leave request approved successfully',
        leaveRequest
      }
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error
      }
      throw new Error('Failed to approve leave request')
    }
  }

  async denyLeaveRequest(id: string, deniedBy: string, reason: string): Promise<LeaveRequestResult> {
    try {
      const existingRequest = await this.getLeaveRequestById(id)
      if (!existingRequest) {
        throw new NotFoundError('Leave request not found')
      }

      if (existingRequest.status !== 'pending') {
        throw new ValidationError('Only pending requests can be denied')
      }

      if (!reason?.trim()) {
        throw new ValidationError('Denial reason is required')
      }

      // Update request status
      const { data: deniedRequest, error } = await supabase
        .from('leave_requests')
        .update({
          status: 'denied',
          approved_by: deniedBy,
          approved_at: new Date().toISOString(),
          denial_reason: reason,
          updated_by: deniedBy,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          *,
          employee:employees(id, full_name, employee_id),
          leave_type:leave_types(*),
          approver:employees!approved_by(id, full_name, employee_id)
        `)
        .single()

      if (error) throw error

      // Remove from pending balance
      await this.updatePendingBalance(
        existingRequest.employeeId, 
        existingRequest.leaveTypeId, 
        existingRequest.totalDays, 
        'subtract'
      )

      const leaveRequest = this.mapDatabaseToLeaveRequest(deniedRequest)

      return {
        success: true,
        message: 'Leave request denied successfully',
        leaveRequest
      }
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error
      }
      throw new Error('Failed to deny leave request')
    }
  }

  async cancelLeaveRequest(id: string, cancelledBy: string, reason?: string): Promise<LeaveRequestResult> {
    try {
      const existingRequest = await this.getLeaveRequestById(id)
      if (!existingRequest) {
        throw new NotFoundError('Leave request not found')
      }

      if (!['pending', 'approved'].includes(existingRequest.status)) {
        throw new ValidationError('Only pending or approved requests can be cancelled')
      }

      // Update request status
      const { data: cancelledRequest, error } = await supabase
        .from('leave_requests')
        .update({
          status: 'cancelled',
          denial_reason: reason || 'Cancelled by user',
          updated_by: cancelledBy,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          *,
          employee:employees(id, full_name, employee_id),
          leave_type:leave_types(*),
          approver:employees!approved_by(id, full_name, employee_id)
        `)
        .single()

      if (error) throw error

      // Restore balance based on previous status
      if (existingRequest.status === 'pending') {
        // Remove from pending balance
        await this.updatePendingBalance(
          existingRequest.employeeId, 
          existingRequest.leaveTypeId, 
          existingRequest.totalDays, 
          'subtract'
        )
      } else if (existingRequest.status === 'approved') {
        // Restore used balance
        await this.leaveBalanceService.updateBalance(
          existingRequest.employeeId, 
          existingRequest.leaveTypeId, 
          {
            type: 'adjustment',
            amount: existingRequest.totalDays,
            reason: `Cancelled leave request: ${existingRequest.startDate} to ${existingRequest.endDate}`,
            effectiveDate: new Date().toISOString()
          }
        )
      }

      const leaveRequest = this.mapDatabaseToLeaveRequest(cancelledRequest)

      return {
        success: true,
        message: 'Leave request cancelled successfully',
        leaveRequest
      }
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error
      }
      throw new Error('Failed to cancel leave request')
    }
  }

  async getEmployeeLeaveRequests(employeeId: string, filters: LeaveSearchFilters = {}): Promise<LeaveRequestResult> {
    try {
      let query = supabase
        .from('leave_requests')
        .select(`
          *,
          employee:employees(id, full_name, employee_id),
          leave_type:leave_types(*),
          approver:employees!approved_by(id, full_name, employee_id)
        `)
        .eq('employee_id', employeeId)

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status)
      }

      if (filters.leaveTypeId) {
        query = query.eq('leave_type_id', filters.leaveTypeId)
      }

      if (filters.startDate) {
        query = query.gte('start_date', filters.startDate)
      }

      if (filters.endDate) {
        query = query.lte('end_date', filters.endDate)
      }

      // Apply pagination
      if (filters.limit) {
        query = query.limit(filters.limit)
      }

      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
      }

      query = query.order('created_at', { ascending: false })

      const { data, error } = await query

      if (error) throw error

      const leaveRequests = data?.map(request => this.mapDatabaseToLeaveRequest(request)) || []

      return {
        success: true,
        message: 'Employee leave requests retrieved successfully',
        leaveRequests
      }
    } catch (error) {
      throw new Error('Failed to retrieve employee leave requests')
    }
  }

  async getTeamLeaveRequests(managerId: string, filters: LeaveSearchFilters = {}): Promise<LeaveRequestResult> {
    try {
      // First get team members
      const { data: teamMembers, error: teamError } = await supabase
        .from('employees')
        .select('id')
        .eq('manager_id', managerId)
        .eq('employment_status', 'active')

      if (teamError) throw teamError

      if (!teamMembers || teamMembers.length === 0) {
        return {
          success: true,
          message: 'No team members found',
          leaveRequests: []
        }
      }

      const teamMemberIds = teamMembers.map(member => member.id)

      let query = supabase
        .from('leave_requests')
        .select(`
          *,
          employee:employees(id, full_name, employee_id),
          leave_type:leave_types(*),
          approver:employees!approved_by(id, full_name, employee_id)
        `)
        .in('employee_id', teamMemberIds)

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status)
      }

      if (filters.leaveTypeId) {
        query = query.eq('leave_type_id', filters.leaveTypeId)
      }

      if (filters.startDate) {
        query = query.gte('start_date', filters.startDate)
      }

      if (filters.endDate) {
        query = query.lte('end_date', filters.endDate)
      }

      // Apply pagination
      if (filters.limit) {
        query = query.limit(filters.limit)
      }

      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
      }

      query = query.order('created_at', { ascending: false })

      const { data, error } = await query

      if (error) throw error

      const leaveRequests = data?.map(request => this.mapDatabaseToLeaveRequest(request)) || []

      return {
        success: true,
        message: 'Team leave requests retrieved successfully',
        leaveRequests
      }
    } catch (error) {
      throw new Error('Failed to retrieve team leave requests')
    }
  }

  async checkLeaveConflicts(employeeId: string, startDate: Date, endDate: Date, excludeRequestId?: string): Promise<ConflictCheck> {
    try {
      let query = supabase
        .from('leave_requests')
        .select(`
          *,
          leave_type:leave_types(name)
        `)
        .eq('employee_id', employeeId)
        .in('status', ['pending', 'approved'])
        .or(`and(start_date.lte.${endDate.toISOString().split('T')[0]},end_date.gte.${startDate.toISOString().split('T')[0]})`)

      if (excludeRequestId) {
        query = query.neq('id', excludeRequestId)
      }

      const { data, error } = await query

      if (error) throw error

      const conflictingRequests = data?.map(request => this.mapDatabaseToLeaveRequest(request)) || []

      return {
        hasConflict: conflictingRequests.length > 0,
        conflictingRequests,
        message: conflictingRequests.length > 0 
          ? `Leave request conflicts with ${conflictingRequests.length} existing request(s)`
          : undefined
      }
    } catch (error) {
      return {
        hasConflict: true,
        conflictingRequests: [],
        message: 'Unable to check for conflicts'
      }
    }
  }

  private validateLeaveRequestData(data: CreateLeaveRequestData): void {
    const errors: string[] = []

    if (!data.leaveTypeId?.trim()) {
      errors.push('Leave type is required')
    }

    if (!data.startDate) {
      errors.push('Start date is required')
    }

    if (!data.endDate) {
      errors.push('End date is required')
    }

    if (data.startDate && data.endDate) {
      const startDate = new Date(data.startDate)
      const endDate = new Date(data.endDate)

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        errors.push('Invalid date format')
      } else if (startDate > endDate) {
        errors.push('Start date must be before or equal to end date')
      }
    }

    if (errors.length > 0) {
      throw new ValidationError('Validation failed', errors)
    }
  }

  private validateLeaveDates(startDate: Date, endDate: Date, leaveType: any): void {
    const errors: string[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Check if dates are in the past
    if (startDate < today) {
      errors.push('Leave cannot be requested for past dates')
    }

    // Check advance notice requirement
    if (leaveType.advanceNoticeDays > 0) {
      const requiredNoticeDate = new Date()
      requiredNoticeDate.setDate(requiredNoticeDate.getDate() + leaveType.advanceNoticeDays)
      
      if (startDate < requiredNoticeDate) {
        errors.push(`This leave type requires ${leaveType.advanceNoticeDays} days advance notice`)
      }
    }

    // Check maximum consecutive days
    if (leaveType.maxConsecutiveDays) {
      const totalDays = this.calculateLeaveDays(startDate, endDate)
      if (totalDays > leaveType.maxConsecutiveDays) {
        errors.push(`Maximum consecutive days for this leave type is ${leaveType.maxConsecutiveDays}`)
      }
    }

    if (errors.length > 0) {
      throw new ValidationError('Date validation failed', errors)
    }
  }

  private calculateLeaveDays(startDate: Date, endDate: Date): number {
    // Simple calculation - count all days including weekends
    // In a more sophisticated system, this could exclude weekends and holidays
    const timeDiff = endDate.getTime() - startDate.getTime()
    return Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1
  }

  private async updatePendingBalance(employeeId: string, leaveTypeId: string, days: number, operation: 'add' | 'subtract'): Promise<void> {
    const currentYear = new Date().getFullYear()
    
    // First get the current balance
    const { data: currentBalance, error: fetchError } = await supabase
      .from('leave_balances')
      .select('pending_days')
      .eq('employee_id', employeeId)
      .eq('leave_type_id', leaveTypeId)
      .eq('policy_year', currentYear)
      .single()

    if (fetchError) throw fetchError

    const currentPendingDays = currentBalance?.pending_days || 0
    const newPendingDays = operation === 'add' 
      ? currentPendingDays + days
      : currentPendingDays - days

    const { error } = await supabase
      .from('leave_balances')
      .update({
        pending_days: newPendingDays,
        updated_at: new Date().toISOString()
      })
      .eq('employee_id', employeeId)
      .eq('leave_type_id', leaveTypeId)
      .eq('policy_year', currentYear)

    if (error) throw error
  }

  private mapDatabaseToLeaveRequest(data: any): LeaveRequest {
    return {
      id: data.id,
      employeeId: data.employee_id,
      leaveTypeId: data.leave_type_id,
      startDate: data.start_date,
      endDate: data.end_date,
      totalDays: parseFloat(data.total_days),
      reason: data.reason,
      status: data.status,
      approvedBy: data.approved_by,
      approvedAt: data.approved_at,
      denialReason: data.denial_reason,
      emergencyContactNotified: data.emergency_contact_notified,
      attachments: data.attachments || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      createdBy: data.created_by,
      updatedBy: data.updated_by,
      employee: data.employee ? {
        id: data.employee.id,
        fullName: data.employee.full_name,
        employeeId: data.employee.employee_id
      } : undefined,
      leaveType: data.leave_type ? {
        id: data.leave_type.id,
        name: data.leave_type.name,
        description: data.leave_type.description,
        colorCode: data.leave_type.color_code,
        isPaid: data.leave_type.is_paid,
        requiresApproval: data.leave_type.requires_approval,
        maxConsecutiveDays: data.leave_type.max_consecutive_days,
        advanceNoticeDays: data.leave_type.advance_notice_days,
        isActive: data.leave_type.is_active,
        createdAt: data.leave_type.created_at,
        updatedAt: data.leave_type.updated_at,
        createdBy: data.leave_type.created_by,
        updatedBy: data.leave_type.updated_by
      } : undefined,
      approver: data.approver ? {
        id: data.approver.id,
        fullName: data.approver.full_name,
        employeeId: data.approver.employee_id
      } : undefined
    }
  }
}