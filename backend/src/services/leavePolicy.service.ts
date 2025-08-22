import { supabase } from '../config/database'
import {
    LeavePolicy,
    CreateLeavePolicyData,
    UpdateLeavePolicyData,
    LeavePolicyResult,
    EmployeeLeavePolicy
} from '../types/leave.types'
import { ValidationError, NotFoundError, ConflictError } from '../utils/errors'
import { LeaveTypeService } from './leaveType.service'

export class LeavePolicyService {
    private leaveTypeService: LeaveTypeService

    constructor() {
        this.leaveTypeService = new LeaveTypeService()
    }

    async createLeavePolicy(data: CreateLeavePolicyData, createdBy: string): Promise<LeavePolicyResult> {
        try {
            // Validate required fields
            this.validateLeavePolicyData(data)

            // Check if leave type exists
            const leaveType = await this.leaveTypeService.getLeaveTypeById(data.leaveTypeId)
            if (!leaveType) {
                throw new ValidationError('Invalid leave type ID')
            }

            // Check if policy with same name already exists
            const existingPolicy = await this.getLeavePolicyByName(data.name)
            if (existingPolicy) {
                throw new ConflictError('Leave policy with this name already exists')
            }

            // Create leave policy record
            const { data: newLeavePolicy, error } = await supabase
                .from('leave_policies')
                .insert({
                    name: data.name,
                    description: data.description,
                    leave_type_id: data.leaveTypeId,
                    annual_allocation: data.annualAllocation,
                    accrual_rate: data.accrualRate || 0,
                    accrual_frequency: data.accrualFrequency || 'monthly',
                    max_balance: data.maxBalance,
                    carryover_limit: data.carryoverLimit || 0,
                    carryover_expiry_months: data.carryoverExpiryMonths || 12,
                    probation_period_months: data.probationPeriodMonths || 0,
                    is_active: true,
                    created_by: createdBy
                })
                .select(`
          *,
          leave_type:leave_types(*)
        `)
                .single()

            if (error) throw error

            const leavePolicy = this.mapDatabaseToLeavePolicy(newLeavePolicy)

            return {
                success: true,
                message: 'Leave policy created successfully',
                leavePolicy
            }
        } catch (error) {
            if (error instanceof ConflictError || error instanceof ValidationError) {
                throw error
            }
            throw new Error('Failed to create leave policy')
        }
    }

    async getLeavePolicyById(id: string): Promise<LeavePolicy | null> {
        try {
            const { data, error } = await supabase
                .from('leave_policies')
                .select(`
          *,
          leave_type:leave_types(*)
        `)
                .eq('id', id)
                .single()

            if (error || !data) return null

            return this.mapDatabaseToLeavePolicy(data)
        } catch (error) {
            return null
        }
    }

    async getLeavePolicyByName(name: string): Promise<LeavePolicy | null> {
        try {
            const { data, error } = await supabase
                .from('leave_policies')
                .select(`
          *,
          leave_type:leave_types(*)
        `)
                .eq('name', name)
                .single()

            if (error || !data) return null

            return this.mapDatabaseToLeavePolicy(data)
        } catch (error) {
            return null
        }
    }

    async getAllLeavePolicies(includeInactive: boolean = false): Promise<LeavePolicyResult> {
        try {
            let query = supabase
                .from('leave_policies')
                .select(`
          *,
          leave_type:leave_types(*)
        `)
                .order('name')

            if (!includeInactive) {
                query = query.eq('is_active', true)
            }

            const { data, error } = await query

            if (error) throw error

            const leavePolicies = data?.map(policy => this.mapDatabaseToLeavePolicy(policy)) || []

            return {
                success: true,
                message: 'Leave policies retrieved successfully',
                leavePolicies
            }
        } catch (error) {
            throw new Error('Failed to retrieve leave policies')
        }
    }

    async getPoliciesByLeaveType(leaveTypeId: string, includeInactive: boolean = false): Promise<LeavePolicyResult> {
        try {
            let query = supabase
                .from('leave_policies')
                .select(`
          *,
          leave_type:leave_types(*)
        `)
                .eq('leave_type_id', leaveTypeId)
                .order('name')

            if (!includeInactive) {
                query = query.eq('is_active', true)
            }

            const { data, error } = await query

            if (error) throw error

            const leavePolicies = data?.map(policy => this.mapDatabaseToLeavePolicy(policy)) || []

            return {
                success: true,
                message: 'Leave policies retrieved successfully',
                leavePolicies
            }
        } catch (error) {
            throw new Error('Failed to retrieve leave policies by type')
        }
    }

    async updateLeavePolicy(id: string, data: UpdateLeavePolicyData, updatedBy: string): Promise<LeavePolicyResult> {
        try {
            // Check if leave policy exists
            const existingPolicy = await this.getLeavePolicyById(id)
            if (!existingPolicy) {
                throw new NotFoundError('Leave policy not found')
            }

            // Check for name conflicts if name is being updated
            if (data.name && data.name !== existingPolicy.name) {
                const conflictingPolicy = await this.getLeavePolicyByName(data.name)
                if (conflictingPolicy) {
                    throw new ConflictError('Leave policy with this name already exists')
                }
            }

            // Validate update data
            if (data.annualAllocation !== undefined || data.accrualRate !== undefined) {
                this.validatePolicyNumbers(data)
            }

            // Update leave policy record
            const { data: updatedLeavePolicy, error } = await supabase
                .from('leave_policies')
                .update({
                    name: data.name,
                    description: data.description,
                    annual_allocation: data.annualAllocation,
                    accrual_rate: data.accrualRate,
                    accrual_frequency: data.accrualFrequency,
                    max_balance: data.maxBalance,
                    carryover_limit: data.carryoverLimit,
                    carryover_expiry_months: data.carryoverExpiryMonths,
                    probation_period_months: data.probationPeriodMonths,
                    is_active: data.isActive,
                    updated_by: updatedBy,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select(`
          *,
          leave_type:leave_types(*)
        `)
                .single()

            if (error) throw error

            const leavePolicy = this.mapDatabaseToLeavePolicy(updatedLeavePolicy)

            return {
                success: true,
                message: 'Leave policy updated successfully',
                leavePolicy
            }
        } catch (error) {
            if (error instanceof NotFoundError || error instanceof ConflictError || error instanceof ValidationError) {
                throw error
            }
            throw new Error('Failed to update leave policy')
        }
    }

    async deleteLeavePolicy(id: string, deletedBy: string): Promise<LeavePolicyResult> {
        try {
            // Check if leave policy exists
            const existingPolicy = await this.getLeavePolicyById(id)
            if (!existingPolicy) {
                throw new NotFoundError('Leave policy not found')
            }

            // Check if policy is assigned to any employees
            const isAssigned = await this.isPolicyAssignedToEmployees(id)
            if (isAssigned) {
                // Soft delete by deactivating instead of hard delete
                const { error } = await supabase
                    .from('leave_policies')
                    .update({
                        is_active: false,
                        updated_by: deletedBy,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', id)

                if (error) throw error

                return {
                    success: true,
                    message: 'Leave policy deactivated successfully (cannot delete as it is assigned to employees)'
                }
            } else {
                // Hard delete if not assigned
                const { error } = await supabase
                    .from('leave_policies')
                    .delete()
                    .eq('id', id)

                if (error) throw error

                return {
                    success: true,
                    message: 'Leave policy deleted successfully'
                }
            }
        } catch (error) {
            if (error instanceof NotFoundError) {
                throw error
            }
            throw new Error('Failed to delete leave policy')
        }
    }

    async assignPolicyToEmployee(
        employeeId: string,
        policyId: string,
        effectiveDate: Date,
        assignedBy: string,
        customAllocation?: number
    ): Promise<void> {
        try {
            // Check if policy exists
            const policy = await this.getLeavePolicyById(policyId)
            if (!policy) {
                throw new NotFoundError('Leave policy not found')
            }

            // Check if employee already has this policy assigned for the same period
            const existingAssignment = await this.getEmployeePolicyAssignment(employeeId, policyId, effectiveDate)
            if (existingAssignment) {
                throw new ConflictError('Employee already has this policy assigned for this period')
            }

            // Insert employee leave policy assignment
            const { error } = await supabase
                .from('employee_leave_policies')
                .insert({
                    employee_id: employeeId,
                    leave_policy_id: policyId,
                    effective_date: effectiveDate.toISOString().split('T')[0],
                    custom_allocation: customAllocation,
                    is_active: true,
                    created_by: assignedBy
                })

            if (error) throw error
        } catch (error) {
            if (error instanceof NotFoundError || error instanceof ConflictError) {
                throw error
            }
            throw new Error('Failed to assign policy to employee')
        }
    }

    async getEmployeePolicies(employeeId: string): Promise<EmployeeLeavePolicy[]> {
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
                .eq('employee_id', employeeId)
                .eq('is_active', true)
                .order('effective_date', { ascending: false })

            if (error) throw error

            return data?.map(assignment => this.mapDatabaseToEmployeeLeavePolicy(assignment)) || []
        } catch (error) {
            throw new Error('Failed to retrieve employee policies')
        }
    }

    private async isPolicyAssignedToEmployees(policyId: string): Promise<boolean> {
        try {
            const { data, error } = await supabase
                .from('employee_leave_policies')
                .select('id')
                .eq('leave_policy_id', policyId)
                .eq('is_active', true)
                .limit(1)

            if (error) throw error
            return data && data.length > 0
        } catch (error) {
            // If we can't determine assignment, err on the side of caution
            return true
        }
    }

    private async getEmployeePolicyAssignment(
        employeeId: string,
        policyId: string,
        effectiveDate: Date
    ): Promise<EmployeeLeavePolicy | null> {
        try {
            const dateStr = effectiveDate.toISOString().split('T')[0]

            const { data, error } = await supabase
                .from('employee_leave_policies')
                .select('*')
                .eq('employee_id', employeeId)
                .eq('leave_policy_id', policyId)
                .eq('effective_date', dateStr)
                .eq('is_active', true)
                .single()

            if (error || !data) return null

            return this.mapDatabaseToEmployeeLeavePolicy(data)
        } catch (error) {
            return null
        }
    }

    private validateLeavePolicyData(data: CreateLeavePolicyData): void {
        const errors: string[] = []

        if (!data.name?.trim()) {
            errors.push('Policy name is required')
        }

        if (data.name && data.name.length > 100) {
            errors.push('Policy name must be 100 characters or less')
        }

        if (!data.leaveTypeId?.trim()) {
            errors.push('Leave type ID is required')
        }

        if (data.annualAllocation === undefined || data.annualAllocation < 0) {
            errors.push('Annual allocation must be a non-negative number')
        }

        this.validatePolicyNumbers(data)

        if (errors.length > 0) {
            throw new ValidationError('Validation failed', errors)
        }
    }

    private validatePolicyNumbers(data: CreateLeavePolicyData | UpdateLeavePolicyData): void {
        const errors: string[] = []

        if (data.accrualRate !== undefined && data.accrualRate < 0) {
            errors.push('Accrual rate cannot be negative')
        }

        if (data.maxBalance !== undefined && data.maxBalance < 0) {
            errors.push('Maximum balance cannot be negative')
        }

        if (data.carryoverLimit !== undefined && data.carryoverLimit < 0) {
            errors.push('Carryover limit cannot be negative')
        }

        if (data.carryoverExpiryMonths !== undefined && data.carryoverExpiryMonths < 0) {
            errors.push('Carryover expiry months cannot be negative')
        }

        if (data.probationPeriodMonths !== undefined && data.probationPeriodMonths < 0) {
            errors.push('Probation period months cannot be negative')
        }

        if (errors.length > 0) {
            throw new ValidationError('Validation failed', errors)
        }
    }

    private mapDatabaseToLeavePolicy(data: any): LeavePolicy {
        return {
            id: data.id,
            name: data.name,
            description: data.description,
            leaveTypeId: data.leave_type_id,
            annualAllocation: parseFloat(data.annual_allocation),
            accrualRate: parseFloat(data.accrual_rate),
            accrualFrequency: data.accrual_frequency,
            maxBalance: data.max_balance ? parseFloat(data.max_balance) : undefined,
            carryoverLimit: parseFloat(data.carryover_limit),
            carryoverExpiryMonths: data.carryover_expiry_months,
            probationPeriodMonths: data.probation_period_months,
            isActive: data.is_active,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            createdBy: data.created_by,
            updatedBy: data.updated_by,
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
            } : undefined
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
            leavePolicy: data.leave_policy ? this.mapDatabaseToLeavePolicy(data.leave_policy) : undefined
        }
    }
}