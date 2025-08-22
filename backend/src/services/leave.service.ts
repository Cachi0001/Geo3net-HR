import { supabase } from '../config/database'
import { NotFoundError, ConflictError, ValidationError } from '../utils/errors'
import { EmailService } from './email.service'

export interface LeaveType {
  id: string
  name: string
  description?: string
  maxDaysPerYear: number
  carryForwardAllowed: boolean
  requiresApproval: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface LeaveRequest {
  id: string
  employeeId: string
  leaveTypeId: string
  startDate: string
  endDate: string
  totalDays: number
  reason?: string
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  approvedBy?: string
  approvedAt?: string
  rejectionReason?: string
  emergencyContact?: string
  handoverNotes?: string
  createdAt: string
  updatedAt: string
  // Related data for display
  employeeName?: string
  leaveTypeName?: string
  approvedByName?: string
}

export interface LeaveBalance {
  id: string
  employeeId: string
  leaveTypeId: string
  year: number
  allocatedDays: number
  usedDays: number
  carriedForward: number
  remainingDays: number
  createdAt: string
  updatedAt: string
  // Related data for display
  employeeName?: string
  leaveTypeName?: string
}

export interface CreateLeaveTypeData {
  name: string
  description?: string
  maxDaysPerYear?: number
  carryForwardAllowed?: boolean
  requiresApproval?: boolean
}

export interface UpdateLeaveTypeData {
  name?: string
  description?: string
  maxDaysPerYear?: number
  carryForwardAllowed?: boolean
  requiresApproval?: boolean
  isActive?: boolean
}

export interface CreateLeaveRequestData {
  employeeId: string
  leaveTypeId: string
  startDate: string
  endDate: string
  reason?: string
  emergencyContact?: string
  handoverNotes?: string
}

export interface UpdateLeaveRequestData {
  startDate?: string
  endDate?: string
  reason?: string
  status?: 'pending' | 'approved' | 'rejected' | 'cancelled'
  rejectionReason?: string
  emergencyContact?: string
  handoverNotes?: string
  approverId?: string
  approverComments?: string
  approvedAt?: string
}

export interface CreateLeaveBalanceData {
  employeeId: string
  leaveTypeId: string
  year: number
  allocatedDays: number
  carriedForward?: number
}

export interface LeaveSearchFilters {
  employeeId?: string
  leaveTypeId?: string
  status?: string
  year?: number
  startDate?: string
  endDate?: string
  search?: string
  limit?: number
  offset?: number
}

export interface LeaveResult {
  success: boolean
  message: string
  leaveType?: LeaveType
  leaveTypes?: LeaveType[]
  leaveRequest?: LeaveRequest
  leaveRequests?: LeaveRequest[]
  leaveBalance?: LeaveBalance
  leaveBalances?: LeaveBalance[]
  total?: number
}

export class LeaveService {
  private emailService: EmailService

  constructor() {
    this.emailService = new EmailService()
  }

  async createLeaveType(data: CreateLeaveTypeData): Promise<LeaveResult> {
    try {
      this.validateLeaveTypeData(data)

      const { data: existing, error: checkError } = await supabase
        .from('leave_types')
        .select('id')
        .eq('name', data.name)
        .single()

      if (existing) {
        throw new ConflictError('Leave type with this name already exists')
      }

      const { data: newLeaveType, error } = await supabase
        .from('leave_types')
        .insert({
          name: data.name,
          description: data.description,
          max_days_per_year: data.maxDaysPerYear || 0,
          carry_forward_allowed: data.carryForwardAllowed || false,
          requires_approval: data.requiresApproval !== false, // Default to true
          is_active: true
        })
        .select()
        .single()

      if (error) throw error

      return {
        success: true,
        message: 'Leave type created successfully',
        leaveType: this.mapDatabaseToLeaveType(newLeaveType)
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to create leave type'
      }
    }
  }

  async getLeaveTypes(filters: LeaveSearchFilters = {}): Promise<LeaveResult> {
    try {
      let query = supabase
        .from('leave_types')
        .select('*', { count: 'exact' })
        .order('name')

      if (filters.search) {
        query = query.ilike('name', `%${filters.search}%`)
      } else {
        query = query.eq('is_active', true)
      }

      if (filters.limit) {
        query = query.limit(filters.limit)
      }

      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
      }

      const { data, error, count } = await query

      if (error) throw error

      return {
        success: true,
        message: 'Leave types retrieved successfully',
        leaveTypes: data?.map(this.mapDatabaseToLeaveType) || [],
        total: count || 0
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to retrieve leave types'
      }
    }
  }

  async getLeaveTypeById(id: string): Promise<LeaveResult> {
    try {
      const { data, error } = await supabase
        .from('leave_types')
        .select('*')
        .eq('id', id)
        .single()

      if (error || !data) {
        throw new NotFoundError('Leave type not found')
      }

      return {
        success: true,
        message: 'Leave type retrieved successfully',
        leaveType: this.mapDatabaseToLeaveType(data)
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to retrieve leave type'
      }
    }
  }

  async updateLeaveType(id: string, data: UpdateLeaveTypeData): Promise<LeaveResult> {
    try {
      const updateData: any = {}

      if (data.name !== undefined) updateData.name = data.name
      if (data.description !== undefined) updateData.description = data.description
      if (data.maxDaysPerYear !== undefined) updateData.max_days_per_year = data.maxDaysPerYear
      if (data.carryForwardAllowed !== undefined) updateData.carry_forward_allowed = data.carryForwardAllowed
      if (data.requiresApproval !== undefined) updateData.requires_approval = data.requiresApproval
      if (data.isActive !== undefined) updateData.is_active = data.isActive

      const { data: updatedLeaveType, error } = await supabase
        .from('leave_types')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      if (!updatedLeaveType) throw new NotFoundError('Leave type not found')

      return {
        success: true,
        message: 'Leave type updated successfully',
        leaveType: this.mapDatabaseToLeaveType(updatedLeaveType)
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to update leave type'
      }
    }
  }

  async createLeaveRequest(data: CreateLeaveRequestData): Promise<LeaveResult> {
    try {
      this.validateLeaveRequestData(data)

      const totalDays = this.calculateLeaveDays(data.startDate, data.endDate)

      const balanceCheck = await this.checkLeaveBalance(data.employeeId, data.leaveTypeId, totalDays)
      if (!balanceCheck.success) {
        throw new ValidationError(balanceCheck.message)
      }

      const { data: overlapping, error: overlapError } = await supabase
        .from('leave_requests')
        .select('id')
        .eq('employee_id', data.employeeId)
        .neq('status', 'rejected')
        .neq('status', 'cancelled')
        .or(`start_date.lte.${data.endDate},end_date.gte.${data.startDate}`)

      if (overlapError) throw overlapError

      if (overlapping && overlapping.length > 0) {
        throw new ConflictError('Leave request overlaps with existing request')
      }

      const { data: newLeaveRequest, error } = await supabase
        .from('leave_requests')
        .insert({
          employee_id: data.employeeId,
          leave_type_id: data.leaveTypeId,
          start_date: data.startDate,
          end_date: data.endDate,
          total_days: totalDays,
          reason: data.reason,
          emergency_contact: data.emergencyContact,
          handover_notes: data.handoverNotes,
          status: 'pending'
        })
        .select(`
          *,
          users!leave_requests_employee_id_fkey(full_name, email),
          leave_types(name, requires_approval)
        `)
        .single()

      if (error) throw error

      // Send notification to manager/HR if approval is required
      const leaveRequest = this.mapDatabaseToLeaveRequest(newLeaveRequest)
      if (newLeaveRequest.leave_types.requires_approval) {
        try {
          // Get manager/HR emails (simplified - you might want to implement proper manager hierarchy)
          const { data: managers } = await supabase
            .from('users')
            .select('email')
            .or('role.eq.hr_admin,role.eq.manager')

          if (managers && managers.length > 0) {
            const managerEmails = managers.map(m => m.email).join(',')
            await this.emailService.sendEmail({
              to: managerEmails,
              subject: 'New Leave Request Pending Approval',
              html: `
                <h2>New Leave Request</h2>
                <p><strong>Employee:</strong> ${newLeaveRequest.users.full_name}</p>
                <p><strong>Leave Type:</strong> ${newLeaveRequest.leave_types.name}</p>
                <p><strong>Dates:</strong> ${data.startDate} to ${data.endDate}</p>
                <p><strong>Total Days:</strong> ${totalDays}</p>
                <p><strong>Reason:</strong> ${data.reason || 'Not specified'}</p>
                <p>Please review and approve/reject this request.</p>
              `
            })
          }
        } catch (emailError) {
          console.error('Failed to send notification email:', emailError)
        }
      }

      return {
        success: true,
        message: 'Leave request created successfully',
        leaveRequest
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to create leave request'
      }
    }
  }

  async getLeaveRequests(filters: LeaveSearchFilters = {}): Promise<LeaveResult> {
    try {
      let query = supabase
        .from('leave_requests')
        .select(`
          *,
          users!leave_requests_employee_id_fkey(full_name),
          leave_types(name),
          approver:users!leave_requests_approved_by_fkey(full_name)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })

      if (filters.employeeId) {
        query = query.eq('employee_id', filters.employeeId)
      }

      if (filters.leaveTypeId) {
        query = query.eq('leave_type_id', filters.leaveTypeId)
      }

      if (filters.status) {
        query = query.eq('status', filters.status)
      }

      if (filters.startDate && filters.endDate) {
        query = query.gte('start_date', filters.startDate).lte('end_date', filters.endDate)
      }

      if (filters.search) {
        query = query.ilike('users.full_name', `%${filters.search}%`)
      }

      if (filters.limit) {
        query = query.limit(filters.limit)
      }

      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
      }

      const { data, error, count } = await query

      if (error) throw error

      return {
        success: true,
        message: 'Leave requests retrieved successfully',
        leaveRequests: data?.map(this.mapDatabaseToLeaveRequest) || [],
        total: count || 0
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to retrieve leave requests'
      }
    }
  }

  async getLeaveRequestById(id: string): Promise<LeaveResult> {
    try {
      const { data, error } = await supabase
        .from('leave_requests')
        .select(`
          *,
          users!leave_requests_employee_id_fkey(full_name),
          leave_types(name),
          approver:users!leave_requests_approved_by_fkey(full_name)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      if (!data) throw new NotFoundError('Leave request not found')

      return {
        success: true,
        message: 'Leave request retrieved successfully',
        leaveRequest: this.mapDatabaseToLeaveRequest(data)
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to retrieve leave request'
      }
    }
  }

  async updateLeaveRequest(id: string, data: UpdateLeaveRequestData, approvedBy?: string): Promise<LeaveResult> {
    try {
      const updateData: any = {}

      if (data.startDate !== undefined) updateData.start_date = data.startDate
      if (data.endDate !== undefined) updateData.end_date = data.endDate
      if (data.reason !== undefined) updateData.reason = data.reason
      if (data.emergencyContact !== undefined) updateData.emergency_contact = data.emergencyContact
      if (data.handoverNotes !== undefined) updateData.handover_notes = data.handoverNotes
      if (data.rejectionReason !== undefined) updateData.rejection_reason = data.rejectionReason

      if (data.status !== undefined) {
        updateData.status = data.status
        if (data.status === 'approved' || data.status === 'rejected') {
          updateData.approved_by = approvedBy
          updateData.approved_at = new Date().toISOString()
        }
      }

      // Recalculate total days if dates changed
      if (data.startDate !== undefined || data.endDate !== undefined) {
        const { data: currentRequest } = await supabase
          .from('leave_requests')
          .select('start_date, end_date')
          .eq('id', id)
          .single()

        if (currentRequest) {
          const startDate = data.startDate || currentRequest.start_date
          const endDate = data.endDate || currentRequest.end_date
          updateData.total_days = this.calculateLeaveDays(startDate, endDate)
        }
      }

      const { data: updatedRequest, error } = await supabase
        .from('leave_requests')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          users!leave_requests_employee_id_fkey(full_name, email),
          leave_types(name),
          approver:users!leave_requests_approved_by_fkey(full_name)
        `)
        .single()

      if (error) throw error
      if (!updatedRequest) throw new NotFoundError('Leave request not found')

      // Update leave balance if approved
      if (data.status === 'approved') {
        await this.updateLeaveBalanceInternal(
          updatedRequest.employee_id,
          updatedRequest.leave_type_id,
          updatedRequest.total_days
        )
      }

      // Send notification email to employee
      if (data.status && ['approved', 'rejected'].includes(data.status)) {
        try {
          const subject = data.status === 'approved' ? 'Leave Request Approved' : 'Leave Request Rejected'
          const message = data.status === 'approved' 
            ? 'Your leave request has been approved.'
            : `Your leave request has been rejected. ${data.rejectionReason ? `Reason: ${data.rejectionReason}` : ''}`

          await this.emailService.sendEmail({
            to: updatedRequest.users.email,
            subject,
            html: `
              <h2>${subject}</h2>
              <p>Dear ${updatedRequest.users.full_name},</p>
              <p>${message}</p>
              <p><strong>Leave Type:</strong> ${updatedRequest.leave_types.name}</p>
              <p><strong>Dates:</strong> ${updatedRequest.start_date} to ${updatedRequest.end_date}</p>
              <p><strong>Total Days:</strong> ${updatedRequest.total_days}</p>
              <p>Best regards,<br>HR Team</p>
            `
          })
        } catch (emailError) {
          console.error('Failed to send notification email:', emailError)
        }
      }

      return {
        success: true,
        message: 'Leave request updated successfully',
        leaveRequest: this.mapDatabaseToLeaveRequest(updatedRequest)
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to update leave request'
      }
    }
  }

  // Leave Balance Methods
  async getLeaveBalances(filters: LeaveSearchFilters = {}): Promise<LeaveResult> {
    try {
      let query = supabase
        .from('leave_balances')
        .select('*', { count: 'exact' })
        .order('year', { ascending: false })

      if (filters.employeeId) {
        query = query.eq('employee_id', filters.employeeId)
      }

      if (filters.leaveTypeId) {
        query = query.eq('leave_type_id', filters.leaveTypeId)
      }

      if (filters.year) {
        query = query.eq('year', filters.year)
      }

      if (filters.limit) {
        query = query.limit(filters.limit)
      }

      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
      }

      const { data, error, count } = await query

      if (error) throw error

      return {
        success: true,
        message: 'Leave balances retrieved successfully',
        leaveBalances: data?.map(this.mapDatabaseToLeaveBalance) || [],
        total: count || 0
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to retrieve leave balances'
      }
    }
  }

  async createLeaveBalance(data: CreateLeaveBalanceData): Promise<LeaveResult> {
    try {
      this.validateLeaveBalanceData(data)

      const { data: newBalance, error } = await supabase
        .from('leave_balances')
        .insert({
          employee_id: data.employeeId,
          leave_type_id: data.leaveTypeId,
          year: data.year,
          allocated_days: data.allocatedDays,
          carried_forward: data.carriedForward || 0,
          used_days: 0
        })
        .select('*')
        .single()

      if (error) throw error

      return {
        success: true,
        message: 'Leave balance created successfully',
        leaveBalance: this.mapDatabaseToLeaveBalance(newBalance)
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to create leave balance'
      }
    }
  }

  async initializeLeaveBalancesForEmployee(employeeId: string, year: number): Promise<LeaveResult> {
    try {
      // Get leave types
      const { data: leaveTypes } = await supabase
        .from('leave_types')
        .select('id, max_days_per_year, carry_forward_allowed')
        .eq('is_active', true)

      if (!leaveTypes) {
        throw new ValidationError('No active leave types found')
      }

      const createdBalances = []
      for (const leaveType of leaveTypes) {
        try {
          // Check if balance already exists
          const { data: existing } = await supabase
            .from('leave_balances')
            .select('id')
            .eq('employee_id', employeeId)
            .eq('leave_type_id', leaveType.id)
            .eq('year', year)
            .single()

          if (!existing) {
            // Get carried forward days from previous year if allowed
            let carriedForward = 0
            if (leaveType.carry_forward_allowed) {
              const { data: prevBalance } = await supabase
                .from('leave_balances')
                .select('remaining_days')
                .eq('employee_id', employeeId)
                .eq('leave_type_id', leaveType.id)
                .eq('year', year - 1)
                .single()

              if (prevBalance && prevBalance.remaining_days > 0) {
                carriedForward = prevBalance.remaining_days
              }
            }

            // Create new balance
            const { data: newBalance, error } = await supabase
              .from('leave_balances')
              .insert({
                employee_id: employeeId,
                leave_type_id: leaveType.id,
                year: year,
                allocated_days: leaveType.max_days_per_year,
                carried_forward: carriedForward,
                used_days: 0
              })
              .select()
              .single()

            if (!error && newBalance) {
              createdBalances.push(newBalance)
            }
          }
        } catch (error) {
          // Continue with other leave types if one fails
          console.error(`Failed to create balance for leave type ${leaveType.id}:`, error)
        }
      }

      return {
        success: true,
        message: `Initialized ${createdBalances.length} leave balances for employee`,
        leaveBalances: createdBalances.map(this.mapDatabaseToLeaveBalance)
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to initialize leave balances'
      }
    }
  }

  async initializeLeaveBalancesForYear(year: number): Promise<LeaveResult> {
    try {
      // Get all active employees and leave types
      const { data: employees } = await supabase
        .from('users')
        .select('id')
        .eq('employment_status', 'active')

      const { data: leaveTypes } = await supabase
        .from('leave_types')
        .select('id, max_days_per_year, carry_forward_allowed')
        .eq('is_active', true)

      if (!employees || !leaveTypes) {
        throw new ValidationError('No active employees or leave types found')
      }

      const createdBalances = []
      for (const employee of employees) {
        for (const leaveType of leaveTypes) {
          try {
            // Check if balance already exists
            const { data: existing } = await supabase
              .from('leave_balances')
              .select('id')
              .eq('employee_id', employee.id)
              .eq('leave_type_id', leaveType.id)
              .eq('year', year)
              .single()

            if (!existing) {
              // Get carried forward days from previous year if allowed
              let carriedForward = 0
              if (leaveType.carry_forward_allowed) {
                const { data: prevBalance } = await supabase
                  .from('leave_balances')
                  .select('remaining_days')
                  .eq('employee_id', employee.id)
                  .eq('leave_type_id', leaveType.id)
                  .eq('year', year - 1)
                  .single()

                if (prevBalance && prevBalance.remaining_days > 0) {
                  carriedForward = Math.min(prevBalance.remaining_days, leaveType.max_days_per_year * 0.5) // Max 50% carry forward
                }
              }

              const result = await this.createLeaveBalance({
                employeeId: employee.id,
                leaveTypeId: leaveType.id,
                year,
                allocatedDays: leaveType.max_days_per_year,
                carriedForward
              })

              if (result.success && result.leaveBalance) {
                createdBalances.push(result.leaveBalance)
              }
            }
          } catch (error) {
            console.error(`Failed to create balance for employee ${employee.id}, leave type ${leaveType.id}:`, error)
          }
        }
      }

      return {
        success: true,
        message: `Initialized leave balances for ${createdBalances.length} employee-leave type combinations`,
        leaveBalances: createdBalances
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to initialize leave balances'
      }
    }
  }

  private calculateLeaveDays(startDate: string, endDate: string): number {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1 // Include both start and end dates
  }

  private async checkLeaveBalance(employeeId: string, leaveTypeId: string, requestedDays: number): Promise<{ success: boolean; message: string }> {
    const currentYear = new Date().getFullYear()
    
    const { data: balance, error } = await supabase
      .from('leave_balances')
      .select('remaining_days')
      .eq('employee_id', employeeId)
      .eq('leave_type_id', leaveTypeId)
      .eq('year', currentYear)
      .single()

    if (error || !balance) {
      return {
        success: false,
        message: 'Leave balance not found for current year'
      }
    }

    if (balance.remaining_days < requestedDays) {
      return {
        success: false,
        message: `Insufficient leave balance. Available: ${balance.remaining_days} days, Requested: ${requestedDays} days`
      }
    }

    return { success: true, message: 'Leave balance sufficient' }
  }

  async updateLeaveBalance(id: string, updateData: { allocated?: number; used?: number }): Promise<LeaveResult> {
    try {
      if (!id) {
        throw new ValidationError('Leave balance ID is required')
      }

      // Get current balance
      const { data: currentBalance, error: fetchError } = await supabase
        .from('leave_balances')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError || !currentBalance) {
        throw new NotFoundError('Leave balance not found')
      }

      const updates: any = {}
      if (updateData.allocated !== undefined) {
        updates.allocated_days = updateData.allocated
      }
      if (updateData.used !== undefined) {
        updates.used_days = updateData.used
      }

      const { data: updatedBalance, error } = await supabase
        .from('leave_balances')
        .update(updates)
        .eq('id', id)
        .select('*')
        .single()

      if (error) throw error

      return {
        success: true,
        message: 'Leave balance updated successfully',
        leaveBalance: this.mapDatabaseToLeaveBalance(updatedBalance)
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to update leave balance'
      }
    }
  }

  private async updateLeaveBalanceInternal(employeeId: string, leaveTypeId: string, usedDays: number): Promise<void> {
    const currentYear = new Date().getFullYear()
    
    await supabase
      .from('leave_balances')
      .update({
        used_days: `used_days + ${usedDays}`
      })
      .eq('employee_id', employeeId)
      .eq('leave_type_id', leaveTypeId)
      .eq('year', currentYear)
  }

  private validateLeaveTypeData(data: CreateLeaveTypeData): void {
    if (!data.name?.trim()) {
      throw new ValidationError('Leave type name is required')
    }
    if (data.maxDaysPerYear !== undefined && data.maxDaysPerYear < 0) {
      throw new ValidationError('Maximum days per year cannot be negative')
    }
  }

  private validateLeaveRequestData(data: CreateLeaveRequestData): void {
    if (!data.employeeId) {
      throw new ValidationError('Employee ID is required')
    }
    if (!data.leaveTypeId) {
      throw new ValidationError('Leave type ID is required')
    }
    if (!data.startDate) {
      throw new ValidationError('Start date is required')
    }
    if (!data.endDate) {
      throw new ValidationError('End date is required')
    }
    if (new Date(data.startDate) > new Date(data.endDate)) {
      throw new ValidationError('End date must be after start date')
    }
    if (new Date(data.startDate) < new Date()) {
      throw new ValidationError('Start date cannot be in the past')
    }
  }

  private validateLeaveBalanceData(data: CreateLeaveBalanceData): void {
    if (!data.employeeId) {
      throw new ValidationError('Employee ID is required')
    }
    if (!data.leaveTypeId) {
      throw new ValidationError('Leave type ID is required')
    }
    if (!data.year || data.year < 2000 || data.year > 2100) {
      throw new ValidationError('Valid year is required')
    }
    if (data.allocatedDays < 0) {
      throw new ValidationError('Allocated days cannot be negative')
    }
  }

  private mapDatabaseToLeaveType(data: any): LeaveType {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      maxDaysPerYear: data.max_days_per_year,
      carryForwardAllowed: data.carry_forward_allowed,
      requiresApproval: data.requires_approval,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }
  }

  private mapDatabaseToLeaveRequest(data: any): LeaveRequest {
    return {
      id: data.id,
      employeeId: data.employee_id,
      leaveTypeId: data.leave_type_id,
      startDate: data.start_date,
      endDate: data.end_date,
      totalDays: data.total_days,
      reason: data.reason,
      status: data.status,
      approvedBy: data.approved_by,
      approvedAt: data.approved_at,
      rejectionReason: data.rejection_reason,
      emergencyContact: data.emergency_contact,
      handoverNotes: data.handover_notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      employeeName: data.users?.full_name,
      leaveTypeName: data.leave_types?.name,
      approvedByName: data.approver?.full_name
    }
  }

  private mapDatabaseToLeaveBalance(data: any): LeaveBalance {
    return {
      id: data.id,
      employeeId: data.employee_id,
      leaveTypeId: data.leave_type_id,
      year: data.year,
      allocatedDays: data.allocated_days,
      usedDays: data.used_days,
      carriedForward: data.carried_forward,
      remainingDays: data.allocated_days + (data.carried_forward || 0) - data.used_days,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      employeeName: data.users?.full_name || undefined,
      leaveTypeName: data.leave_types?.name || undefined
    }
  }
}