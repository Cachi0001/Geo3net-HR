import { supabase } from '../config/database'
import { 
  EmployeeLeavePolicy,
  LeavePolicy
} from '../types/leave.types'
import { ValidationError, NotFoundError, ConflictError } from '../utils/errors'
import { LeavePolicyService } from './leavePolicy.service'

export interface PolicyAssignmentData {
  employeeId: string
  policyId: string
  effectiveDate: string
  expiryDate?: string
  customAllocation?: number
}

export interface BulkPolicyAssignmentData {
  policyId: string
  employeeIds: string[]
  effectiveDate: string
  expiryDate?: string
  customAllocation?: number
}

export interface PolicyAssignmentResult {
  success: boolean
  message: string
  assignment?: EmployeeLeavePolicy
  assignments?: EmployeeLeavePolicy[]
  errors?: string[]
}

export class EmployeeLeavePolicyService {
  private leavePolicyService: LeavePolicyService

  constructor() {
    this.leavePolicyService = new LeavePolicyService()
  }

  async assignPolicyToEmployee(data: PolicyAssignmentData, assignedBy: string): Promise<PolicyAssignmentResult> {
    try {
      // Validate input data
      this.validateAssignmentData(data)

      // Check if policy exists and is active
      const policy = await this.leavePolicyService.getLeavePolicyById(data.policyId)
      if (!policy || !policy.isActive) {
        throw new NotFoundError('Leave policy not found or inactive')
      }

      // Check if employee exists
      const employee = await this.getEmployeeById(data.employeeId)
      if (!employee) {
        throw new NotFoundError('Employee not found')
      }

      // Check for overlapping assignments
      const hasOverlap = await this.checkForOverlappingAssignments(
        data.employeeId, 
        data.policyId, 
        new Date(data.effectiveDate),
        data.expiryDate ? new Date(data.expiryDate) : undefined
      )

      if (hasOverlap) {
        throw new ConflictError('Employee already has an overlapping policy assignment for this leave type')
      }

      // Create the assignment
      const { data: newAssignment, error } = await supabase
        .from('employee_leave_policies')
        .insert({
          employee_id: data.employeeId,
          leave_policy_id: data.policyId,
          effective_date: data.effectiveDate,
          expiry_date: data.expiryDate,
          custom_allocation: data.customAllocation,
          is_active: true,
          created_by: assignedBy
        })
        .select(`
          *,
          leave_policy:leave_policies(
            *,
            leave_type:leave_types(*)
          )
        `)
        .single()

      if (error) throw error

      const assignment = this.mapDatabaseToEmployeeLeavePolicy(newAssignment)

      return {
        success: true,
        message: 'Policy assigned to employee successfully',
        assignment
      }
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof ConflictError) {
        throw error
      }
      throw new Error('Failed to assign policy to employee')
    }
  }

  async bulkAssignPolicyToEmployees(data: BulkPolicyAssignmentData, assignedBy: string): Promise<PolicyAssignmentResult> {
    try {
      // Validate input data
      this.validateBulkAssignmentData(data)

      // Check if policy exists and is active
      const policy = await this.leavePolicyService.getLeavePolicyById(data.policyId)
      if (!policy || !policy.isActive) {
        throw new NotFoundError('Leave policy not found or inactive')
      }

      const assignments: EmployeeLeavePolicy[] = []
      const errors: string[] = []

      // Process each employee
      for (const employeeId of data.employeeIds) {
        try {
          const assignmentData: PolicyAssignmentData = {
            employeeId,
            policyId: data.policyId,
            effectiveDate: data.effectiveDate,
            expiryDate: data.expiryDate,
            customAllocation: data.customAllocation
          }

          const result = await this.assignPolicyToEmployee(assignmentData, assignedBy)
          if (result.assignment) {
            assignments.push(result.assignment)
          }
        } catch (error: any) {
          errors.push(`Employee ${employeeId}: ${error.message}`)
        }
      }

      return {
        success: assignments.length > 0,
        message: `Successfully assigned policy to ${assignments.length} employees${errors.length > 0 ? ` with ${errors.length} errors` : ''}`,
        assignments,
        errors: errors.length > 0 ? errors : undefined
      }
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error
      }
      throw new Error('Failed to bulk assign policy to employees')
    }
  }

  async updatePolicyAssignment(
    assignmentId: string, 
    updateData: Partial<PolicyAssignmentData>, 
    updatedBy: string
  ): Promise<PolicyAssignmentResult> {
    try {
      // Check if assignment exists
      const existingAssignment = await this.getAssignmentById(assignmentId)
      if (!existingAssignment) {
        throw new NotFoundError('Policy assignment not found')
      }

      // Validate update data
      if (updateData.effectiveDate || updateData.expiryDate) {
        const effectiveDate = updateData.effectiveDate ? new Date(updateData.effectiveDate) : new Date(existingAssignment.effectiveDate)
        const expiryDate = updateData.expiryDate ? new Date(updateData.expiryDate) : 
                          (existingAssignment.expiryDate ? new Date(existingAssignment.expiryDate) : undefined)

        if (expiryDate && effectiveDate >= expiryDate) {
          throw new ValidationError('Effective date must be before expiry date')
        }
      }

      // Update the assignment
      const { data: updatedAssignment, error } = await supabase
        .from('employee_leave_policies')
        .update({
          effective_date: updateData.effectiveDate,
          expiry_date: updateData.expiryDate,
          custom_allocation: updateData.customAllocation,
          updated_at: new Date().toISOString()
        })
        .eq('id', assignmentId)
        .select(`
          *,
          leave_policy:leave_policies(
            *,
            leave_type:leave_types(*)
          )
        `)
        .single()

      if (error) throw error

      const assignment = this.mapDatabaseToEmployeeLeavePolicy(updatedAssignment)

      return {
        success: true,
        message: 'Policy assignment updated successfully',
        assignment
      }
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error
      }
      throw new Error('Failed to update policy assignment')
    }
  }

  async deactivatePolicyAssignment(assignmentId: string, deactivatedBy: string): Promise<PolicyAssignmentResult> {
    try {
      // Check if assignment exists
      const existingAssignment = await this.getAssignmentById(assignmentId)
      if (!existingAssignment) {
        throw new NotFoundError('Policy assignment not found')
      }

      // Deactivate the assignment
      const { error } = await supabase
        .from('employee_leave_policies')
        .update({
          is_active: false,
          expiry_date: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString()
        })
        .eq('id', assignmentId)

      if (error) throw error

      return {
        success: true,
        message: 'Policy assignment deactivated successfully'
      }
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error
      }
      throw new Error('Failed to deactivate policy assignment')
    }
  }

  async getEmployeePolicyAssignments(employeeId: string, includeInactive: boolean = false): Promise<PolicyAssignmentResult> {
    try {
      let query = supabase
        .from('employee_leave_policies')
        .select(`
          *,
          leave_policy:leave_policies(
            *,
            leave_type:leave_types(*)
          )
        `)
        .eq('employee_id', employeeId)
        .order('effective_date', { ascending: false })

      if (!includeInactive) {
        query = query.eq('is_active', true)
      }

      const { data, error } = await query

      if (error) throw error

      const assignments = data?.map(assignment => this.mapDatabaseToEmployeeLeavePolicy(assignment)) || []

      return {
        success: true,
        message: 'Employee policy assignments retrieved successfully',
        assignments
      }
    } catch (error) {
      throw new Error('Failed to retrieve employee policy assignments')
    }
  }

  async getActivePolicyForEmployee(employeeId: string, leaveTypeId: string, date: Date = new Date()): Promise<EmployeeLeavePolicy | null> {
    try {
      const dateStr = date.toISOString().split('T')[0]

      const { data, error } = await supabase
        .from('employee_leave_policies')
        .select(`
          *,
          leave_policy:leave_policies(
            *,
            leave_type:leave_types(*)
          )
        `)
        .eq('employee_id', employeeId)
        .eq('is_active', true)
        .lte('effective_date', dateStr)
        .or(`expiry_date.is.null,expiry_date.gte.${dateStr}`)
        .eq('leave_policy.leave_type_id', leaveTypeId)
        .order('effective_date', { ascending: false })
        .limit(1)
        .single()

      if (error || !data) return null

      return this.mapDatabaseToEmployeeLeavePolicy(data)
    } catch (error) {
      return null
    }
  }

  async transferPoliciesFromEmployee(fromEmployeeId: string, toEmployeeId: string, transferredBy: string): Promise<PolicyAssignmentResult> {
    try {
      // Get all active policies from source employee
      const sourceAssignments = await this.getEmployeePolicyAssignments(fromEmployeeId)
      if (!sourceAssignments.success || !sourceAssignments.assignments) {
        throw new NotFoundError('No active policy assignments found for source employee')
      }

      // Check if target employee exists
      const targetEmployee = await this.getEmployeeById(toEmployeeId)
      if (!targetEmployee) {
        throw new NotFoundError('Target employee not found')
      }

      const newAssignments: EmployeeLeavePolicy[] = []
      const errors: string[] = []

      // Transfer each policy
      for (const assignment of sourceAssignments.assignments) {
        try {
          // Deactivate old assignment
          await this.deactivatePolicyAssignment(assignment.id, transferredBy)

          // Create new assignment for target employee
          const newAssignmentData: PolicyAssignmentData = {
            employeeId: toEmployeeId,
            policyId: assignment.leavePolicyId,
            effectiveDate: new Date().toISOString().split('T')[0],
            expiryDate: assignment.expiryDate,
            customAllocation: assignment.customAllocation
          }

          const result = await this.assignPolicyToEmployee(newAssignmentData, transferredBy)
          if (result.assignment) {
            newAssignments.push(result.assignment)
          }
        } catch (error: any) {
          errors.push(`Policy ${assignment.leavePolicyId}: ${error.message}`)
        }
      }

      return {
        success: newAssignments.length > 0,
        message: `Successfully transferred ${newAssignments.length} policies${errors.length > 0 ? ` with ${errors.length} errors` : ''}`,
        assignments: newAssignments,
        errors: errors.length > 0 ? errors : undefined
      }
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error
      }
      throw new Error('Failed to transfer policies between employees')
    }
  }

  private async getAssignmentById(assignmentId: string): Promise<EmployeeLeavePolicy | null> {
    try {
      const { data, error } = await supabase
        .from('employee_leave_policies')
        .select(`
          *,
          leave_policy:leave_policies(
            *,
            leave_type:leave_types(*)
          )
        `)
        .eq('id', assignmentId)
        .single()

      if (error || !data) return null

      return this.mapDatabaseToEmployeeLeavePolicy(data)
    } catch (error) {
      return null
    }
  }

  private async getEmployeeById(employeeId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, full_name, employment_status')
        .eq('id', employeeId)
        .eq('employment_status', 'active')
        .single()

      if (error || !data) return null
      return data
    } catch (error) {
      return null
    }
  }

  private async checkForOverlappingAssignments(
    employeeId: string, 
    policyId: string, 
    effectiveDate: Date,
    expiryDate?: Date
  ): Promise<boolean> {
    try {
      // Get the leave type for this policy
      const policy = await this.leavePolicyService.getLeavePolicyById(policyId)
      if (!policy) return false

      const effectiveDateStr = effectiveDate.toISOString().split('T')[0]
      const expiryDateStr = expiryDate ? expiryDate.toISOString().split('T')[0] : null

      // Check for overlapping assignments for the same leave type
      let query = supabase
        .from('employee_leave_policies')
        .select(`
          id,
          effective_date,
          expiry_date,
          leave_policy:leave_policies!inner(leave_type_id)
        `)
        .eq('employee_id', employeeId)
        .eq('is_active', true)
        .eq('leave_policy.leave_type_id', policy.leaveTypeId)

      // Check for date overlaps
      if (expiryDateStr) {
        query = query.or(`and(effective_date.lte.${expiryDateStr},or(expiry_date.is.null,expiry_date.gte.${effectiveDateStr}))`)
      } else {
        query = query.or(`expiry_date.is.null,expiry_date.gte.${effectiveDateStr}`)
      }

      const { data, error } = await query

      if (error) throw error
      return data && data.length > 0
    } catch (error) {
      // If we can't determine overlap, err on the side of caution
      return true
    }
  }

  private validateAssignmentData(data: PolicyAssignmentData): void {
    const errors: string[] = []

    if (!data.employeeId?.trim()) {
      errors.push('Employee ID is required')
    }

    if (!data.policyId?.trim()) {
      errors.push('Policy ID is required')
    }

    if (!data.effectiveDate) {
      errors.push('Effective date is required')
    } else {
      const effectiveDate = new Date(data.effectiveDate)
      if (isNaN(effectiveDate.getTime())) {
        errors.push('Invalid effective date format')
      }
    }

    if (data.expiryDate) {
      const expiryDate = new Date(data.expiryDate)
      if (isNaN(expiryDate.getTime())) {
        errors.push('Invalid expiry date format')
      } else if (data.effectiveDate && new Date(data.effectiveDate) >= expiryDate) {
        errors.push('Effective date must be before expiry date')
      }
    }

    if (data.customAllocation !== undefined && data.customAllocation < 0) {
      errors.push('Custom allocation cannot be negative')
    }

    if (errors.length > 0) {
      throw new ValidationError('Validation failed', errors)
    }
  }

  private validateBulkAssignmentData(data: BulkPolicyAssignmentData): void {
    const errors: string[] = []

    if (!data.policyId?.trim()) {
      errors.push('Policy ID is required')
    }

    if (!data.employeeIds || data.employeeIds.length === 0) {
      errors.push('At least one employee ID is required')
    }

    if (!data.effectiveDate) {
      errors.push('Effective date is required')
    }

    // Validate individual assignment data
    const sampleData: PolicyAssignmentData = {
      employeeId: 'sample',
      policyId: data.policyId,
      effectiveDate: data.effectiveDate,
      expiryDate: data.expiryDate,
      customAllocation: data.customAllocation
    }

    try {
      this.validateAssignmentData(sampleData)
    } catch (error) {
      if (error instanceof ValidationError) {
        errors.push(...error.errors)
      }
    }

    if (errors.length > 0) {
      throw new ValidationError('Validation failed', errors)
    }
  }

  private mapDatabaseToEmployeeLeavePolicy(data: any): EmployeeLeavePolicy {
    return {
      id: data.id,
      employeeId: data.employee_id,
      leavePolicyId: data.leave_policy_id,
      effectiveDate: data.effective_date,
      expiryDate: data.expiry_date,
      customAllocation: data.custom_allocation ? parseFloat(data.custom_allocation) : undefined,
      isActive: data.is_active,
      createdAt: data.created_at,
      createdBy: data.created_by,
      leavePolicy: data.leave_policy ? {
        id: data.leave_policy.id,
        name: data.leave_policy.name,
        description: data.leave_policy.description,
        leaveTypeId: data.leave_policy.leave_type_id,
        annualAllocation: parseFloat(data.leave_policy.annual_allocation),
        accrualRate: parseFloat(data.leave_policy.accrual_rate),
        accrualFrequency: data.leave_policy.accrual_frequency,
        maxBalance: data.leave_policy.max_balance ? parseFloat(data.leave_policy.max_balance) : undefined,
        carryoverLimit: parseFloat(data.leave_policy.carryover_limit),
        carryoverExpiryMonths: data.leave_policy.carryover_expiry_months,
        probationPeriodMonths: data.leave_policy.probation_period_months,
        isActive: data.leave_policy.is_active,
        createdAt: data.leave_policy.created_at,
        updatedAt: data.leave_policy.updated_at,
        createdBy: data.leave_policy.created_by,
        updatedBy: data.leave_policy.updated_by,
        leaveType: data.leave_policy.leave_type ? {
          id: data.leave_policy.leave_type.id,
          name: data.leave_policy.leave_type.name,
          description: data.leave_policy.leave_type.description,
          colorCode: data.leave_policy.leave_type.color_code,
          isPaid: data.leave_policy.leave_type.is_paid,
          requiresApproval: data.leave_policy.leave_type.requires_approval,
          maxConsecutiveDays: data.leave_policy.leave_type.max_consecutive_days,
          advanceNoticeDays: data.leave_policy.leave_type.advance_notice_days,
          isActive: data.leave_policy.leave_type.is_active,
          createdAt: data.leave_policy.leave_type.created_at,
          updatedAt: data.leave_policy.leave_type.updated_at,
          createdBy: data.leave_policy.leave_type.created_by,
          updatedBy: data.leave_policy.leave_type.updated_by
        } : undefined
      } : undefined
    }
  }
}