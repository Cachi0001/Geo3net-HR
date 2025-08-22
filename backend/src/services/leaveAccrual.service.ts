import { supabase } from '../config/database'
import { LeaveBalanceService } from './leaveBalance.service'
import { EmployeeLeavePolicyService } from './employeeLeavePolicy.service'
import { AccrualResult } from '../types/leave.types'

export interface AccrualJobConfig {
  frequency: 'daily' | 'weekly' | 'monthly'
  enabled: boolean
  lastRun?: Date
  nextRun?: Date
}

export interface AccrualSchedule {
  id: string
  employeeId: string
  leaveTypeId: string
  frequency: string
  nextAccrualDate: Date
  accrualAmount: number
  isActive: boolean
}

export class LeaveAccrualService {
  private leaveBalanceService: LeaveBalanceService
  private employeeLeavePolicyService: EmployeeLeavePolicyService

  constructor() {
    this.leaveBalanceService = new LeaveBalanceService()
    this.employeeLeavePolicyService = new EmployeeLeavePolicyService()
  }

  async processScheduledAccruals(): Promise<AccrualResult> {
    try {
      console.log('🔄 Starting scheduled leave accrual processing...')
      
      const currentDate = new Date()
      let processedEmployees = 0
      let totalAccrued = 0
      const errors: string[] = []

      // Get all active employees
      const { data: employees, error: employeeError } = await supabase
        .from('employees')
        .select('id, hire_date, full_name')
        .eq('employment_status', 'active')

      if (employeeError) throw employeeError

      if (!employees || employees.length === 0) {
        return {
          success: true,
          message: 'No active employees found for accrual processing',
          processedEmployees: 0,
          totalAccrued: 0,
          errors: []
        }
      }

      console.log(`📊 Processing accruals for ${employees.length} active employees`)

      // Process each employee
      for (const employee of employees) {
        try {
          const employeeAccrued = await this.processEmployeeAccruals(employee.id, currentDate)
          if (employeeAccrued > 0) {
            processedEmployees++
            totalAccrued += employeeAccrued
            console.log(`✅ Employee ${employee.full_name}: ${employeeAccrued} days accrued`)
          }
        } catch (error: any) {
          const errorMsg = `Employee ${employee.full_name} (${employee.id}): ${error.message}`
          errors.push(errorMsg)
          console.error(`❌ ${errorMsg}`)
        }
      }

      // Update last run timestamp
      await this.updateLastAccrualRun(currentDate)

      const result = {
        success: processedEmployees > 0 || errors.length === 0,
        message: `Accrual processing completed. Processed ${processedEmployees} employees, accrued ${totalAccrued.toFixed(2)} total days${errors.length > 0 ? ` with ${errors.length} errors` : ''}`,
        processedEmployees,
        totalAccrued: Math.round(totalAccrued * 100) / 100,
        errors
      }

      console.log('✅ Scheduled leave accrual processing completed:', result)
      return result
    } catch (error: any) {
      console.error('❌ Failed to process scheduled accruals:', error)
      throw new Error(`Failed to process scheduled accruals: ${error.message}`)
    }
  }

  async processEmployeeAccruals(employeeId: string, processDate: Date = new Date()): Promise<number> {
    try {
      let totalAccrued = 0
      const currentYear = processDate.getFullYear()

      // Get employee's active policy assignments
      const assignments = await this.employeeLeavePolicyService.getEmployeePolicyAssignments(employeeId)
      if (!assignments.success || !assignments.assignments) {
        return 0
      }

      // Get employee hire date to check probation period
      const { data: employee, error: empError } = await supabase
        .from('employees')
        .select('hire_date')
        .eq('id', employeeId)
        .single()

      if (empError || !employee) {
        throw new Error('Employee not found')
      }

      const hireDate = new Date(employee.hire_date)
      const monthsSinceHire = this.getMonthsDifference(hireDate, processDate)

      // Process each policy assignment
      for (const assignment of assignments.assignments) {
        if (!assignment.leavePolicy) continue

        const policy = assignment.leavePolicy
        const leaveTypeId = policy.leaveTypeId

        // Check if employee is past probation period
        if (monthsSinceHire < policy.probationPeriodMonths) {
          continue
        }

        // Check if accrual is due
        const lastAccrualDate = await this.getLastAccrualDate(employeeId, leaveTypeId, currentYear)
        if (!this.isAccrualDue(policy.accrualFrequency, lastAccrualDate, processDate)) {
          continue
        }

        // Calculate accrual amount
        const accrualAmount = policy.accrualRate

        if (accrualAmount > 0) {
          // Apply the accrual
          await this.leaveBalanceService.updateBalance(employeeId, leaveTypeId, {
            type: 'accrual',
            amount: accrualAmount,
            reason: `${policy.accrualFrequency}_accrual`,
            effectiveDate: processDate.toISOString()
          })

          totalAccrued += accrualAmount

          // Update last accrual date in balance record
          await this.updateLastAccrualDate(employeeId, leaveTypeId, currentYear, processDate)
        }
      }

      return totalAccrued
    } catch (error: any) {
      throw new Error(`Failed to process employee accruals: ${error.message}`)
    }
  }

  async processYearEndAccruals(year: number): Promise<AccrualResult> {
    try {
      console.log(`🎯 Processing year-end accruals for ${year}...`)
      
      let processedEmployees = 0
      let totalAccrued = 0
      const errors: string[] = []

      // Get all employees who were active during the year
      const { data: employees, error: employeeError } = await supabase
        .from('employees')
        .select('id, hire_date, full_name')
        .lte('hire_date', `${year}-12-31`)
        .neq('employment_status', 'terminated')

      if (employeeError) throw employeeError

      if (!employees || employees.length === 0) {
        return {
          success: true,
          message: `No employees found for year-end accrual processing for ${year}`,
          processedEmployees: 0,
          totalAccrued: 0,
          errors: []
        }
      }

      const yearEndDate = new Date(year, 11, 31) // December 31st

      // Process each employee
      for (const employee of employees) {
        try {
          const employeeAccrued = await this.processEmployeeYearEndAccrual(employee.id, yearEndDate)
          if (employeeAccrued > 0) {
            processedEmployees++
            totalAccrued += employeeAccrued
          }
        } catch (error: any) {
          const errorMsg = `Employee ${employee.full_name} (${employee.id}): ${error.message}`
          errors.push(errorMsg)
          console.error(`❌ ${errorMsg}`)
        }
      }

      const result = {
        success: processedEmployees > 0 || errors.length === 0,
        message: `Year-end accrual processing for ${year} completed. Processed ${processedEmployees} employees, accrued ${totalAccrued.toFixed(2)} total days${errors.length > 0 ? ` with ${errors.length} errors` : ''}`,
        processedEmployees,
        totalAccrued: Math.round(totalAccrued * 100) / 100,
        errors
      }

      console.log('✅ Year-end accrual processing completed:', result)
      return result
    } catch (error: any) {
      console.error('❌ Failed to process year-end accruals:', error)
      throw new Error(`Failed to process year-end accruals: ${error.message}`)
    }
  }

  async processEmployeeYearEndAccrual(employeeId: string, yearEndDate: Date): Promise<number> {
    try {
      let totalAccrued = 0
      const year = yearEndDate.getFullYear()

      // Get employee's policy assignments that were active during the year
      const assignments = await this.employeeLeavePolicyService.getEmployeePolicyAssignments(employeeId)
      if (!assignments.success || !assignments.assignments) {
        return 0
      }

      // Process each policy for final year-end accrual
      for (const assignment of assignments.assignments) {
        if (!assignment.leavePolicy) continue

        const policy = assignment.leavePolicy
        const leaveTypeId = policy.leaveTypeId

        // For annual accrual frequency, ensure full allocation is reached
        if (policy.accrualFrequency === 'annually') {
          const currentBalance = await this.leaveBalanceService.getBalanceByEmployeeAndLeaveType(
            employeeId, 
            leaveTypeId, 
            year
          )

          if (currentBalance) {
            const targetAllocation = assignment.customAllocation || policy.annualAllocation
            const shortfall = targetAllocation - currentBalance.allocatedDays

            if (shortfall > 0) {
              await this.leaveBalanceService.updateBalance(employeeId, leaveTypeId, {
                type: 'accrual',
                amount: shortfall,
                reason: 'year_end_adjustment',
                effectiveDate: yearEndDate.toISOString()
              })

              totalAccrued += shortfall
            }
          }
        }
      }

      return totalAccrued
    } catch (error: any) {
      throw new Error(`Failed to process employee year-end accrual: ${error.message}`)
    }
  }

  async getAccrualSchedule(employeeId?: string): Promise<AccrualSchedule[]> {
    try {
      // This would typically come from a dedicated accrual_schedules table
      // For now, we'll generate it from active policy assignments
      
      let query = supabase
        .from('employee_leave_policies')
        .select(`
          *,
          leave_policy:leave_policies(
            *,
            leave_type:leave_types(*)
          ),
          employee:employees(id, full_name, hire_date)
        `)
        .eq('is_active', true)

      if (employeeId) {
        query = query.eq('employee_id', employeeId)
      }

      const { data, error } = await query

      if (error) throw error

      const schedules: AccrualSchedule[] = []

      for (const assignment of data || []) {
        if (!assignment.leave_policy) continue

        const policy = assignment.leave_policy
        const nextAccrualDate = this.calculateNextAccrualDate(
          policy.accrual_frequency,
          new Date()
        )

        schedules.push({
          id: assignment.id,
          employeeId: assignment.employee_id,
          leaveTypeId: policy.leave_type_id,
          frequency: policy.accrual_frequency,
          nextAccrualDate,
          accrualAmount: parseFloat(policy.accrual_rate),
          isActive: assignment.is_active
        })
      }

      return schedules
    } catch (error) {
      throw new Error('Failed to retrieve accrual schedule')
    }
  }

  private async getLastAccrualDate(employeeId: string, leaveTypeId: string, year: number): Promise<Date | null> {
    try {
      const { data, error } = await supabase
        .from('leave_balances')
        .select('last_accrual_date')
        .eq('employee_id', employeeId)
        .eq('leave_type_id', leaveTypeId)
        .eq('policy_year', year)
        .single()

      if (error || !data || !data.last_accrual_date) return null
      return new Date(data.last_accrual_date)
    } catch (error) {
      return null
    }
  }

  private async updateLastAccrualDate(
    employeeId: string, 
    leaveTypeId: string, 
    year: number, 
    accrualDate: Date
  ): Promise<void> {
    const { error } = await supabase
      .from('leave_balances')
      .update({
        last_accrual_date: accrualDate.toISOString().split('T')[0],
        updated_at: new Date().toISOString()
      })
      .eq('employee_id', employeeId)
      .eq('leave_type_id', leaveTypeId)
      .eq('policy_year', year)

    if (error) throw error
  }

  private async updateLastAccrualRun(runDate: Date): Promise<void> {
    // This would typically update a system settings table
    // For now, we'll just log it
    console.log(`📝 Last accrual run updated: ${runDate.toISOString()}`)
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
        return daysDiff >= 28 // Use 28 days to ensure monthly processing
      case 'quarterly':
        return daysDiff >= 90
      case 'annually':
        return daysDiff >= 365
      default:
        return false
    }
  }

  private calculateNextAccrualDate(frequency: string, fromDate: Date): Date {
    const nextDate = new Date(fromDate)

    switch (frequency) {
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7)
        break
      case 'biweekly':
        nextDate.setDate(nextDate.getDate() + 14)
        break
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1)
        break
      case 'quarterly':
        nextDate.setMonth(nextDate.getMonth() + 3)
        break
      case 'annually':
        nextDate.setFullYear(nextDate.getFullYear() + 1)
        break
      default:
        nextDate.setMonth(nextDate.getMonth() + 1) // Default to monthly
    }

    return nextDate
  }

  private getMonthsDifference(startDate: Date, endDate: Date): number {
    const yearDiff = endDate.getFullYear() - startDate.getFullYear()
    const monthDiff = endDate.getMonth() - startDate.getMonth()
    return yearDiff * 12 + monthDiff
  }
}