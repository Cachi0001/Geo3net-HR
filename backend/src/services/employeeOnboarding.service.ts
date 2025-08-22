import { supabase } from '../config/database'
import { LeaveBalanceService } from './leaveBalance.service'
import { LeavePolicyService } from './leavePolicy.service'
import { EmployeeLeavePolicyService, PolicyAssignmentData } from './employeeLeavePolicy.service'
import { LeaveAccrualService } from './leaveAccrual.service'

export interface OnboardingResult {
  success: boolean
  message: string
  assignedPolicies: number
  initializedBalances: number
  errors: string[]
}

export interface EmployeeOnboardingData {
  employeeId: string
  hireDate: Date
  departmentId?: string
  positionId?: string
  customPolicyAssignments?: {
    policyId: string
    customAllocation?: number
    effectiveDate?: Date
  }[]
}

export class EmployeeOnboardingService {
  private leaveBalanceService: LeaveBalanceService
  private leavePolicyService: LeavePolicyService
  private employeeLeavePolicyService: EmployeeLeavePolicyService
  private leaveAccrualService: LeaveAccrualService

  constructor() {
    this.leaveBalanceService = new LeaveBalanceService()
    this.leavePolicyService = new LeavePolicyService()
    this.employeeLeavePolicyService = new EmployeeLeavePolicyService()
    this.leaveAccrualService = new LeaveAccrualService()
  }

  async onboardNewEmployee(data: EmployeeOnboardingData, onboardedBy: string): Promise<OnboardingResult> {
    try {
      console.log(`🎯 Starting leave onboarding for employee: ${data.employeeId}`)
      
      let assignedPolicies = 0
      let initializedBalances = 0
      const errors: string[] = []

      // Validate employee exists
      const employee = await this.getEmployeeById(data.employeeId)
      if (!employee) {
        throw new Error('Employee not found')
      }

      // Determine which policies to assign
      let policiesToAssign: { policyId: string; customAllocation?: number; effectiveDate: Date }[] = []

      if (data.customPolicyAssignments && data.customPolicyAssignments.length > 0) {
        // Use custom policy assignments
        policiesToAssign = data.customPolicyAssignments.map(assignment => ({
          policyId: assignment.policyId,
          customAllocation: assignment.customAllocation,
          effectiveDate: assignment.effectiveDate || data.hireDate
        }))
      } else {
        // Use default policies based on department/position or system defaults
        const defaultPolicies = await this.getDefaultPoliciesForEmployee(data.departmentId, data.positionId)
        policiesToAssign = defaultPolicies.map(policy => ({
          policyId: policy.id,
          effectiveDate: data.hireDate
        }))
      }

      // Assign policies to employee
      for (const policyAssignment of policiesToAssign) {
        try {
          const assignmentData: PolicyAssignmentData = {
            employeeId: data.employeeId,
            policyId: policyAssignment.policyId,
            effectiveDate: policyAssignment.effectiveDate.toISOString().split('T')[0],
            customAllocation: policyAssignment.customAllocation
          }

          await this.employeeLeavePolicyService.assignPolicyToEmployee(assignmentData, onboardedBy)
          assignedPolicies++
          
          console.log(`✅ Assigned policy ${policyAssignment.policyId} to employee ${data.employeeId}`)
        } catch (error: any) {
          const errorMsg = `Failed to assign policy ${policyAssignment.policyId}: ${error.message}`
          errors.push(errorMsg)
          console.error(`❌ ${errorMsg}`)
        }
      }

      // Initialize leave balances
      if (assignedPolicies > 0) {
        try {
          await this.leaveBalanceService.initializeEmployeeBalances(data.employeeId, data.hireDate)
          
          // Count initialized balances
          const balanceResult = await this.leaveBalanceService.getEmployeeBalances(data.employeeId)
          initializedBalances = balanceResult.leaveBalances?.length || 0
          
          console.log(`✅ Initialized ${initializedBalances} leave balances for employee ${data.employeeId}`)
        } catch (error: any) {
          const errorMsg = `Failed to initialize leave balances: ${error.message}`
          errors.push(errorMsg)
          console.error(`❌ ${errorMsg}`)
        }
      }

      // Process initial accruals if hire date is not at year start
      const currentYear = new Date().getFullYear()
      const yearStart = new Date(currentYear, 0, 1)
      
      if (data.hireDate > yearStart && initializedBalances > 0) {
        try {
          const accrualResult = await this.leaveAccrualService.processEmployeeAccruals(data.employeeId, data.hireDate)
          if (accrualResult > 0) {
            console.log(`✅ Processed initial accruals: ${accrualResult} days for employee ${data.employeeId}`)
          }
        } catch (error: any) {
          const errorMsg = `Failed to process initial accruals: ${error.message}`
          errors.push(errorMsg)
          console.error(`❌ ${errorMsg}`)
        }
      }

      const result: OnboardingResult = {
        success: assignedPolicies > 0 || initializedBalances > 0,
        message: `Employee onboarding completed. Assigned ${assignedPolicies} policies, initialized ${initializedBalances} balances${errors.length > 0 ? ` with ${errors.length} errors` : ''}`,
        assignedPolicies,
        initializedBalances,
        errors
      }

      console.log('✅ Employee leave onboarding completed:', result)
      return result
    } catch (error: any) {
      console.error('❌ Failed to onboard employee:', error)
      throw new Error(`Failed to onboard employee: ${error.message}`)
    }
  }

  async reinitializeEmployeeBalances(employeeId: string, year: number, reinitializedBy: string): Promise<OnboardingResult> {
    try {
      console.log(`🔄 Reinitializing leave balances for employee: ${employeeId}, year: ${year}`)
      
      let initializedBalances = 0
      const errors: string[] = []

      // Validate employee exists
      const employee = await this.getEmployeeById(employeeId)
      if (!employee) {
        throw new Error('Employee not found')
      }

      // Get employee's active policy assignments
      const assignments = await this.employeeLeavePolicyService.getEmployeePolicyAssignments(employeeId)
      if (!assignments.success || !assignments.assignments) {
        throw new Error('No active policy assignments found for employee')
      }

      // Remove existing balances for the year
      await this.clearEmployeeBalancesForYear(employeeId, year)

      // Reinitialize balances based on current policy assignments
      const effectiveDate = new Date(year, 0, 1) // January 1st of the year
      
      for (const assignment of assignments.assignments) {
        if (!assignment.leavePolicy) continue

        try {
          const leaveTypeId = assignment.leavePolicy.leaveTypeId
          const allocation = assignment.customAllocation || assignment.leavePolicy.annualAllocation

          // Calculate pro-rated allocation if employee was hired mid-year
          const hireDate = new Date(employee.hire_date)
          const proRatedAllocation = this.calculateProRatedAllocation(
            allocation, 
            hireDate.getFullYear() === year ? hireDate : effectiveDate, 
            year
          )

          // Initialize balance
          await this.initializeBalance(employeeId, leaveTypeId, year, proRatedAllocation)
          initializedBalances++

          console.log(`✅ Reinitialized balance for leave type ${leaveTypeId}: ${proRatedAllocation} days`)
        } catch (error: any) {
          const errorMsg = `Failed to reinitialize balance for leave type ${assignment.leavePolicy?.leaveTypeId}: ${error.message}`
          errors.push(errorMsg)
          console.error(`❌ ${errorMsg}`)
        }
      }

      const result: OnboardingResult = {
        success: initializedBalances > 0,
        message: `Balance reinitialization completed. Reinitialized ${initializedBalances} balances${errors.length > 0 ? ` with ${errors.length} errors` : ''}`,
        assignedPolicies: 0,
        initializedBalances,
        errors
      }

      console.log('✅ Employee balance reinitialization completed:', result)
      return result
    } catch (error: any) {
      console.error('❌ Failed to reinitialize employee balances:', error)
      throw new Error(`Failed to reinitialize employee balances: ${error.message}`)
    }
  }

  async adjustEmployeeBalance(
    employeeId: string, 
    leaveTypeId: string, 
    adjustmentAmount: number, 
    reason: string,
    adjustedBy: string
  ): Promise<void> {
    try {
      console.log(`⚖️ Adjusting balance for employee ${employeeId}, leave type ${leaveTypeId}: ${adjustmentAmount} days`)

      // Validate employee and leave type exist
      const employee = await this.getEmployeeById(employeeId)
      if (!employee) {
        throw new Error('Employee not found')
      }

      const { data: leaveType, error: leaveTypeError } = await supabase
        .from('leave_types')
        .select('id, name')
        .eq('id', leaveTypeId)
        .single()

      if (leaveTypeError || !leaveType) {
        throw new Error('Leave type not found')
      }

      // Apply the adjustment
      await this.leaveBalanceService.updateBalance(employeeId, leaveTypeId, {
        type: 'adjustment',
        amount: adjustmentAmount,
        reason: `Manual adjustment: ${reason}`,
        effectiveDate: new Date().toISOString()
      })

      console.log(`✅ Balance adjustment completed for employee ${employeeId}`)
    } catch (error: any) {
      console.error('❌ Failed to adjust employee balance:', error)
      throw new Error(`Failed to adjust employee balance: ${error.message}`)
    }
  }

  async bulkOnboardEmployees(
    employeeData: EmployeeOnboardingData[], 
    onboardedBy: string
  ): Promise<OnboardingResult> {
    try {
      console.log(`🎯 Starting bulk leave onboarding for ${employeeData.length} employees`)
      
      let totalAssignedPolicies = 0
      let totalInitializedBalances = 0
      const allErrors: string[] = []

      for (const data of employeeData) {
        try {
          const result = await this.onboardNewEmployee(data, onboardedBy)
          totalAssignedPolicies += result.assignedPolicies
          totalInitializedBalances += result.initializedBalances
          
          if (result.errors.length > 0) {
            allErrors.push(...result.errors.map(error => `Employee ${data.employeeId}: ${error}`))
          }
        } catch (error: any) {
          const errorMsg = `Employee ${data.employeeId}: ${error.message}`
          allErrors.push(errorMsg)
          console.error(`❌ ${errorMsg}`)
        }
      }

      const result: OnboardingResult = {
        success: totalAssignedPolicies > 0 || totalInitializedBalances > 0,
        message: `Bulk onboarding completed. Assigned ${totalAssignedPolicies} policies, initialized ${totalInitializedBalances} balances across ${employeeData.length} employees${allErrors.length > 0 ? ` with ${allErrors.length} errors` : ''}`,
        assignedPolicies: totalAssignedPolicies,
        initializedBalances: totalInitializedBalances,
        errors: allErrors
      }

      console.log('✅ Bulk employee leave onboarding completed:', result)
      return result
    } catch (error: any) {
      console.error('❌ Failed to bulk onboard employees:', error)
      throw new Error(`Failed to bulk onboard employees: ${error.message}`)
    }
  }

  private async getEmployeeById(employeeId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, full_name, hire_date, department_id, position_id, employment_status')
        .eq('id', employeeId)
        .single()

      if (error || !data) return null
      return data
    } catch (error) {
      return null
    }
  }

  private async getDefaultPoliciesForEmployee(departmentId?: string, positionId?: string): Promise<any[]> {
    try {
      // For now, return all active policies as defaults
      // In a more sophisticated system, this could be based on department/position rules
      const result = await this.leavePolicyService.getAllLeavePolicies()
      return result.leavePolicies || []
    } catch (error) {
      console.error('Failed to get default policies, returning empty array:', error)
      return []
    }
  }

  private async clearEmployeeBalancesForYear(employeeId: string, year: number): Promise<void> {
    const { error } = await supabase
      .from('leave_balances')
      .delete()
      .eq('employee_id', employeeId)
      .eq('policy_year', year)

    if (error) throw error
  }

  private async initializeBalance(
    employeeId: string, 
    leaveTypeId: string, 
    year: number, 
    allocation: number
  ): Promise<void> {
    const { error } = await supabase
      .from('leave_balances')
      .insert({
        employee_id: employeeId,
        leave_type_id: leaveTypeId,
        policy_year: year,
        allocated_days: allocation,
        used_days: 0,
        pending_days: 0,
        carried_over_days: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (error) throw error
  }

  private calculateProRatedAllocation(annualAllocation: number, startDate: Date, year: number): number {
    const yearStart = new Date(year, 0, 1)
    const yearEnd = new Date(year, 11, 31)
    
    const effectiveStart = startDate > yearStart ? startDate : yearStart
    const totalDaysInYear = Math.ceil((yearEnd.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
    const remainingDays = Math.ceil((yearEnd.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
    
    return Math.round((annualAllocation * remainingDays / totalDaysInYear) * 100) / 100
  }
}