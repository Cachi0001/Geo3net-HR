import { supabase } from '../config/database'
import { 
  LeaveBalance, 
  LeaveBalanceResult,
  BalanceChange,
  AccrualResult,
  CarryoverResult,
  BalanceHistory
} from '../types/leave.types'
import { ValidationError, NotFoundError, ConflictError } from '../utils/errors'
import { LeavePolicyService } from './leavePolicy.service'
import { EmployeeLeavePolicyService } from './employeeLeavePolicy.service'

export class LeaveBalanceService {
  private leavePolicyService: LeavePolicyService
  private employeeLeavePolicyService: EmployeeLeavePolicyService

  constructor() {
    this.leavePolicyService = new LeavePolicyService()
    this.employeeLeavePolicyService = new EmployeeLeavePolicyService()
  }

  async getEmployeeBalances(employeeId: string, year?: number): Promise<LeaveBalanceResult> {
    try {
      const currentYear = year || new Date().getFullYear()

      const { data, error } = await supabase
        .from('leave_balances')
        .select(`
          *,
          leave_type:leave_types(*)
        `)
        .eq('employee_id', employeeId)
        .eq('policy_year', currentYear)
        .order('leave_type.name')

      if (error) throw error

      const leaveBalances = data?.map(balance => this.mapDatabaseToLeaveBalance(balance)) || []

      return {
        success: true,
        message: 'Employee leave balances retrieved successfully',
        leaveBalances
      }
    } catch (error) {
      throw new Error('Failed to retrieve employee leave balances')
    }
  }

  async getBalanceByEmployeeAndLeaveType(employeeId: string, leaveTypeId: string, year?: number): Promise<LeaveBalance | null> {
    try {
      const currentYear = year || new Date().getFullYear()

      const { data, error } = await supabase
        .from('leave_balances')
        .select(`
          *,
          leave_type:leave_types(*)
        `)
        .eq('employee_id', employeeId)
        .eq('leave_type_id', leaveTypeId)
        .eq('policy_year', currentYear)
        .single()

      if (error || !data) return null

      return this.mapDatabaseToLeaveBalance(data)
    } catch (error) {
      return null
    }
  }

  async updateBalance(employeeId: string, leaveTypeId: string, change: BalanceChange): Promise<void> {
    try {
      const currentYear = new Date().getFullYear()
      
      // Get current balance
      let balance = await this.getBalanceByEmployeeAndLeaveType(employeeId, leaveTypeId, currentYear)
      
      // If balance doesn't exist, initialize it
      if (!balance) {
        await this.initializeEmployeeBalance(employeeId, leaveTypeId, currentYear)
        balance = await this.getBalanceByEmployeeAndLeaveType(employeeId, leaveTypeId, currentYear)
        if (!balance) {
          throw new Error('Failed to initialize employee balance')
        }
      }

      // Calculate new values based on change type
      let updateData: any = {}
      let balanceBefore = balance.availableDays
      let balanceAfter = balanceBefore

      switch (change.type) {
        case 'accrual':
          updateData.allocated_days = balance.allocatedDays + change.amount
          balanceAfter = balanceBefore + change.amount
          break
        case 'usage':
          updateData.used_days = balance.usedDays + change.amount
          balanceAfter = balanceBefore - change.amount
          break
        case 'adjustment':
          updateData.allocated_days = balance.allocatedDays + change.amount
          balanceAfter = balanceBefore + change.amount
          break
        case 'carryover':
          updateData.carried_over_days = balance.carriedOverDays + change.amount
          balanceAfter = balanceBefore + change.amount
          break
      }

      // Update the balance
      const { error: updateError } = await supabase
        .from('leave_balances')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('employee_id', employeeId)
        .eq('leave_type_id', leaveTypeId)
        .eq('policy_year', currentYear)

      if (updateError) throw updateError

      // Record the change in accrual history
      await this.recordAccrualHistory(
        employeeId,
        leaveTypeId,
        new Date(change.effectiveDate),
        change.amount,
        balanceBefore,
        balanceAfter,
        change.reason,
        currentYear
      )
    } catch (error) {
      throw new Error('Failed to update leave balance')
    }
  }

  async calculateAvailableLeave(employeeId: string, leaveTypeId: string): Promise<number> {
    try {
      const balance = await this.getBalanceByEmployeeAndLeaveType(employeeId, leaveTypeId)
      if (!balance) return 0

      return Math.max(0, balance.availableDays)
    } catch (error) {
      return 0
    }
  }

  async getBalanceHistory(employeeId: string, leaveTypeId: string, year?: number): Promise<BalanceHistory[]> {
    try {
      const currentYear = year || new Date().getFullYear()

      const { data, error } = await supabase
        .from('leave_accrual_history')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('leave_type_id', leaveTypeId)
        .eq('policy_year', currentYear)
        .order('accrual_date', { ascending: false })

      if (error) throw error

      return data?.map(record => ({
        date: record.accrual_date,
        type: this.mapAccrualReasonToType(record.accrual_reason),
        amount: parseFloat(record.accrued_days),
        balance: parseFloat(record.balance_after),
        reason: record.accrual_reason
      })) || []
    } catch (error) {
      throw new Error('Failed to retrieve balance history')
    }
  }

  async initializeEmployeeBalances(employeeId: string, effectiveDate: Date): Promise<void> {
    try {
      // Get all active policy assignments for the employee
      const assignments = await this.employeeLeavePolicyService.getEmployeePolicyAssignments(employeeId)
      if (!assignments.success || !assignments.assignments) {
        throw new Error('No active policy assignments found for employee')
      }

      const currentYear = effectiveDate.getFullYear()

      for (const assignment of assignments.assignments) {
        if (!assignment.leavePolicy) continue

        const leaveTypeId = assignment.leavePolicy.leaveTypeId
        
        // Check if balance already exists
        const existingBalance = await this.getBalanceByEmployeeAndLeaveType(employeeId, leaveTypeId, currentYear)
        if (existingBalance) continue

        // Calculate pro-rated allocation if starting mid-year
        const allocation = assignment.customAllocation || assignment.leavePolicy.annualAllocation
        const proRatedAllocation = this.calculateProRatedAllocation(allocation, effectiveDate, currentYear)

        // Initialize the balance
        await this.initializeEmployeeBalance(employeeId, leaveTypeId, currentYear, proRatedAllocation)
      }
    } catch (error) {
      throw new Error('Failed to initialize employee balances')
    }
  }

  async processAccruals(employeeId?: string, accrualDate?: Date): Promise<AccrualResult> {
    try {
      const processDate = accrualDate || new Date()
      const currentYear = processDate.getFullYear()
      
      let processedEmployees = 0
      let totalAccrued = 0
      const errors: string[] = []

      // Get employees to process
      let employeeIds: string[] = []
      if (employeeId) {
        employeeIds = [employeeId]
      } else {
        // Get all active employees
        const { data: employees, error } = await supabase
          .from('employees')
          .select('id')
          .eq('employment_status', 'active')

        if (error) throw error
        employeeIds = employees?.map(emp => emp.id) || []
      }

      // Process each employee
      for (const empId of employeeIds) {
        try {
          const assignments = await this.employeeLeavePolicyService.getEmployeePolicyAssignments(empId)
          if (!assignments.success || !assignments.assignments) continue

          for (const assignment of assignments.assignments) {
            if (!assignment.leavePolicy) continue

            const policy = assignment.leavePolicy
            const leaveTypeId = policy.leaveTypeId

            // Check if employee is past probation period
            const employee = await this.getEmployeeHireDate(empId)
            if (!employee) continue

            const monthsSinceHire = this.getMonthsDifference(new Date(employee.hire_date), processDate)
            if (monthsSinceHire < policy.probationPeriodMonths) continue

            // Check if accrual is due
            const lastAccrualDate = await this.getLastAccrualDate(empId, leaveTypeId, currentYear)
            if (!this.isAccrualDue(policy.accrualFrequency, lastAccrualDate, processDate)) continue

            // Calculate accrual amount
            const accrualAmount = policy.accrualRate

            // Apply accrual
            await this.updateBalance(empId, leaveTypeId, {
              type: 'accrual',
              amount: accrualAmount,
              reason: 'regular_accrual',
              effectiveDate: processDate.toISOString()
            })

            totalAccrued += accrualAmount
          }

          processedEmployees++
        } catch (error: any) {
          errors.push(`Employee ${empId}: ${error.message}`)
        }
      }

      return {
        success: processedEmployees > 0,
        message: `Processed accruals for ${processedEmployees} employees`,
        processedEmployees,
        totalAccrued,
        errors
      }
    } catch (error) {
      throw new Error('Failed to process leave accruals')
    }
  }

  async processCarryovers(year: number): Promise<CarryoverResult> {
    try {
      let processedEmployees = 0
      let totalCarriedOver = 0
      let totalExpired = 0
      const errors: string[] = []

      // Get all balances from the previous year
      const { data: balances, error } = await supabase
        .from('leave_balances')
        .select(`
          *,
          leave_type:leave_types(*),
          employee:employees(id, hire_date)
        `)
        .eq('policy_year', year - 1)

      if (error) throw error

      const employeeBalances = new Map<string, any[]>()
      
      // Group balances by employee
      for (const balance of balances || []) {
        const empId = balance.employee_id
        if (!employeeBalances.has(empId)) {
          employeeBalances.set(empId, [])
        }
        employeeBalances.get(empId)!.push(balance)
      }

      // Process each employee
      for (const [empId, empBalances] of employeeBalances) {
        try {
          for (const balance of empBalances) {
            const leaveTypeId = balance.leave_type_id
            const availableDays = parseFloat(balance.available_days)

            if (availableDays <= 0) continue

            // Get the active policy for this leave type
            const assignment = await this.employeeLeavePolicyService.getActivePolicyForEmployee(
              empId, 
              leaveTypeId, 
              new Date(year, 0, 1)
            )

            if (!assignment?.leavePolicy) continue

            const policy = assignment.leavePolicy
            const carryoverLimit = policy.carryoverLimit

            // Calculate carryover amount
            const carryoverAmount = Math.min(availableDays, carryoverLimit)
            const expiredAmount = availableDays - carryoverAmount

            if (carryoverAmount > 0) {
              // Initialize new year balance with carryover
              await this.initializeEmployeeBalance(empId, leaveTypeId, year, 0, carryoverAmount)
              totalCarriedOver += carryoverAmount
            }

            if (expiredAmount > 0) {
              totalExpired += expiredAmount
            }
          }

          processedEmployees++
        } catch (error: any) {
          errors.push(`Employee ${empId}: ${error.message}`)
        }
      }

      return {
        success: processedEmployees > 0,
        message: `Processed carryovers for ${processedEmployees} employees`,
        processedEmployees,
        totalCarriedOver,
        totalExpired,
        errors
      }
    } catch (error) {
      throw new Error('Failed to process leave carryovers')
    }
  }

  private async initializeEmployeeBalance(
    employeeId: string, 
    leaveTypeId: string, 
    year: number, 
    allocation: number = 0,
    carryover: number = 0
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
        carried_over_days: carryover,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (error) throw error
  }

  private async recordAccrualHistory(
    employeeId: string,
    leaveTypeId: string,
    accrualDate: Date,
    accruedDays: number,
    balanceBefore: number,
    balanceAfter: number,
    reason: string,
    policyYear: number
  ): Promise<void> {
    const { error } = await supabase
      .from('leave_accrual_history')
      .insert({
        employee_id: employeeId,
        leave_type_id: leaveTypeId,
        accrual_date: accrualDate.toISOString().split('T')[0],
        accrued_days: accruedDays,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        accrual_reason: reason,
        policy_year: policyYear,
        created_at: new Date().toISOString()
      })

    if (error) throw error
  }

  private async getEmployeeHireDate(employeeId: string): Promise<{ hire_date: string } | null> {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('hire_date')
        .eq('id', employeeId)
        .single()

      if (error || !data) return null
      return data
    } catch (error) {
      return null
    }
  }

  private async getLastAccrualDate(employeeId: string, leaveTypeId: string, year: number): Promise<Date | null> {
    try {
      const { data, error } = await supabase
        .from('leave_accrual_history')
        .select('accrual_date')
        .eq('employee_id', employeeId)
        .eq('leave_type_id', leaveTypeId)
        .eq('policy_year', year)
        .order('accrual_date', { ascending: false })
        .limit(1)
        .single()

      if (error || !data) return null
      return new Date(data.accrual_date)
    } catch (error) {
      return null
    }
  }

  private calculateProRatedAllocation(annualAllocation: number, startDate: Date, year: number): number {
    const yearStart = new Date(year, 0, 1)
    const yearEnd = new Date(year, 11, 31)
    
    const effectiveStart = startDate > yearStart ? startDate : yearStart
    const totalDaysInYear = Math.ceil((yearEnd.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
    const remainingDays = Math.ceil((yearEnd.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
    
    return Math.round((annualAllocation * remainingDays / totalDaysInYear) * 100) / 100
  }

  private getMonthsDifference(startDate: Date, endDate: Date): number {
    const yearDiff = endDate.getFullYear() - startDate.getFullYear()
    const monthDiff = endDate.getMonth() - startDate.getMonth()
    return yearDiff * 12 + monthDiff
  }

  private isAccrualDue(frequency: string, lastAccrualDate: Date | null, currentDate: Date): boolean {
    if (!lastAccrualDate) return true

    const daysDiff = Math.floor((currentDate.getTime() - lastAccrualDate.getTime()) / (1000 * 60 * 60 * 24))

    switch (frequency) {
      case 'weekly':
        return daysDiff >= 7
      case 'biweekly':
        return daysDiff >= 14
      case 'monthly':
        return daysDiff >= 30
      case 'quarterly':
        return daysDiff >= 90
      case 'annually':
        return daysDiff >= 365
      default:
        return false
    }
  }

  private mapAccrualReasonToType(reason: string): 'accrual' | 'usage' | 'adjustment' | 'carryover' {
    if (reason.includes('accrual')) return 'accrual'
    if (reason.includes('usage') || reason.includes('used')) return 'usage'
    if (reason.includes('carryover')) return 'carryover'
    return 'adjustment'
  }

  private mapDatabaseToLeaveBalance(data: any): LeaveBalance {
    return {
      id: data.id,
      employeeId: data.employee_id,
      leaveTypeId: data.leave_type_id,
      policyYear: data.policy_year,
      allocatedDays: parseFloat(data.allocated_days),
      usedDays: parseFloat(data.used_days),
      pendingDays: parseFloat(data.pending_days),
      carriedOverDays: parseFloat(data.carried_over_days),
      availableDays: parseFloat(data.available_days),
      lastAccrualDate: data.last_accrual_date,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
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
}