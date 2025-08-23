import { supabase } from '../config/database'
import { LeaveTypeService } from './leaveType.service'
import { LeaveBalanceService } from './leaveBalance.service'
import { EmployeeLeavePolicyService } from './employeeLeavePolicy.service'
import { ValidationError } from '../utils/errors'

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export interface BusinessDayCalculationOptions {
  excludeWeekends: boolean
  excludeHolidays: boolean
  customHolidays?: Date[]
}

export class LeaveValidationService {
  private leaveTypeService: LeaveTypeService
  private leaveBalanceService: LeaveBalanceService
  private employeeLeavePolicyService: EmployeeLeavePolicyService

  constructor() {
    this.leaveTypeService = new LeaveTypeService()
    this.leaveBalanceService = new LeaveBalanceService()
    this.employeeLeavePolicyService = new EmployeeLeavePolicyService()
  }

  async validateLeaveRequest(
    employeeId: string,
    leaveTypeId: string,
    startDate: Date,
    endDate: Date,
    excludeRequestId?: string
  ): Promise<ValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []

    try {
      // Basic date validation
      const dateValidation = this.validateDates(startDate, endDate)
      errors.push(...dateValidation.errors)
      warnings.push(...dateValidation.warnings)

      // Get leave type details
      const leaveType = await this.leaveTypeService.getLeaveTypeById(leaveTypeId)
      if (!leaveType) {
        errors.push('Invalid leave type')
        return { isValid: false, errors, warnings }
      }

      if (!leaveType.isActive) {
        errors.push('This leave type is no longer available')
        return { isValid: false, errors, warnings }
      }

      // Get employee details
      const employee = await this.getEmployeeDetails(employeeId)
      if (!employee) {
        errors.push('Employee not found')
        return { isValid: false, errors, warnings }
      }

      if (employee.employment_status !== 'active') {
        errors.push('Only active employees can request leave')
        return { isValid: false, errors, warnings }
      }

      // Validate against leave type rules
      const leaveTypeValidation = await this.validateAgainstLeaveTypeRules(
        leaveType, 
        startDate, 
        endDate, 
        employee
      )
      errors.push(...leaveTypeValidation.errors)
      warnings.push(...leaveTypeValidation.warnings)

      // Check probation period
      const probationValidation = await this.validateProbationPeriod(employeeId, leaveTypeId, employee.hire_date)
      errors.push(...probationValidation.errors)
      warnings.push(...probationValidation.warnings)

      // Check balance availability
      const balanceValidation = await this.validateBalanceAvailability(
        employeeId, 
        leaveTypeId, 
        startDate, 
        endDate
      )
      errors.push(...balanceValidation.errors)
      warnings.push(...balanceValidation.warnings)

      // Check for conflicts
      const conflictValidation = await this.validateConflicts(
        employeeId, 
        startDate, 
        endDate, 
        excludeRequestId
      )
      errors.push(...conflictValidation.errors)
      warnings.push(...conflictValidation.warnings)

      // Check team availability (warning only)
      const teamValidation = await this.validateTeamAvailability(employeeId, startDate, endDate)
      warnings.push(...teamValidation.warnings)

      // Check for blackout periods
      const blackoutValidation = await this.validateBlackoutPeriods(leaveTypeId, startDate, endDate)
      errors.push(...blackoutValidation.errors)
      warnings.push(...blackoutValidation.warnings)

    } catch (error: any) {
      errors.push(`Validation error: ${error.message}`)
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  calculateBusinessDays(
    startDate: Date, 
    endDate: Date, 
    options: BusinessDayCalculationOptions = { excludeWeekends: true, excludeHolidays: false }
  ): number {
    let totalDays = 0
    const currentDate = new Date(startDate)

    while (currentDate <= endDate) {
      let isBusinessDay = true

      // Check if it's a weekend
      if (options.excludeWeekends) {
        const dayOfWeek = currentDate.getDay()
        if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday or Saturday
          isBusinessDay = false
        }
      }

      // Check if it's a holiday
      if (options.excludeHolidays && options.customHolidays) {
        const isHoliday = options.customHolidays.some(holiday => 
          holiday.toDateString() === currentDate.toDateString()
        )
        if (isHoliday) {
          isBusinessDay = false
        }
      }

      if (isBusinessDay) {
        totalDays++
      }

      currentDate.setDate(currentDate.getDate() + 1)
    }

    return totalDays
  }

  async getPublicHolidays(year: number): Promise<Date[]> {
    try {
      // This would typically come from a holidays table or external API
      // For now, return some common holidays
      const holidays = [
        new Date(year, 0, 1),   // New Year's Day
        new Date(year, 11, 25), // Christmas Day
        new Date(year, 11, 26), // Boxing Day
      ]

      return holidays
    } catch (error) {
      return []
    }
  }

  private validateDates(startDate: Date, endDate: Date): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Check if dates are valid
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      errors.push('Invalid date format')
      return { isValid: false, errors, warnings }
    }

    // Check if start date is before end date
    if (startDate > endDate) {
      errors.push('Start date must be before or equal to end date')
    }

    // Check if dates are in the past
    if (startDate < today) {
      errors.push('Leave cannot be requested for past dates')
    }

    // Check if it's too far in the future (warning)
    const oneYearFromNow = new Date()
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1)
    if (startDate > oneYearFromNow) {
      warnings.push('Leave request is more than one year in advance')
    }

    return { isValid: errors.length === 0, errors, warnings }
  }

  private async validateAgainstLeaveTypeRules(
    leaveType: any, 
    startDate: Date, 
    endDate: Date, 
    employee: any
  ): Promise<ValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []

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
        errors.push(`Maximum consecutive days for ${leaveType.name} is ${leaveType.maxConsecutiveDays}`)
      }
    }

    return { isValid: errors.length === 0, errors, warnings }
  }

  private async validateProbationPeriod(
    employeeId: string, 
    leaveTypeId: string, 
    hireDate: string
  ): Promise<ValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []

    try {
      // Get active policy for this leave type
      const assignment = await this.employeeLeavePolicyService.getActivePolicyForEmployee(
        employeeId, 
        leaveTypeId
      )

      if (assignment?.leavePolicy) {
        const policy = assignment.leavePolicy
        const hireDateObj = new Date(hireDate)
        const monthsSinceHire = this.getMonthsDifference(hireDateObj, new Date())

        if (monthsSinceHire < policy.probationPeriodMonths) {
          const remainingMonths = policy.probationPeriodMonths - monthsSinceHire
          errors.push(`Employee is still in probation period. ${remainingMonths} months remaining before eligible for ${policy.leaveType?.name}`)
        }
      }
    } catch (error) {
      warnings.push('Could not verify probation period eligibility')
    }

    return { isValid: errors.length === 0, errors, warnings }
  }

  private async validateBalanceAvailability(
    employeeId: string, 
    leaveTypeId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<ValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []

    try {
      const requestedDays = this.calculateLeaveDays(startDate, endDate)
      const availableBalance = await this.leaveBalanceService.calculateAvailableLeave(employeeId, leaveTypeId)

      if (availableBalance < requestedDays) {
        errors.push(`Insufficient leave balance. Available: ${availableBalance} days, Requested: ${requestedDays} days`)
      } else if (availableBalance - requestedDays < 2) {
        warnings.push(`This request will leave you with only ${availableBalance - requestedDays} days remaining`)
      }
    } catch (error) {
      warnings.push('Could not verify leave balance')
    }

    return { isValid: errors.length === 0, errors, warnings }
  }

  private async validateConflicts(
    employeeId: string, 
    startDate: Date, 
    endDate: Date, 
    excludeRequestId?: string
  ): Promise<ValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []

    try {
      let query = supabase
        .from('leave_requests')
        .select(`
          id, 
          start_date, 
          end_date, 
          status, 
          leave_types!inner(name)
        `)
        .eq('employee_id', employeeId)
        .in('status', ['pending', 'approved'])
        .or(`and(start_date.lte.${endDate.toISOString().split('T')[0]},end_date.gte.${startDate.toISOString().split('T')[0]})`)

      if (excludeRequestId) {
        query = query.neq('id', excludeRequestId)
      }

      const { data, error } = await query

      if (error) throw error

      if (data && data.length > 0) {
        const conflictDetails = data.map((req: any) => 
          `${req.leave_types?.name || 'Unknown'} from ${req.start_date} to ${req.end_date} (${req.status})`
        ).join(', ')
        
        errors.push(`Leave request conflicts with existing requests: ${conflictDetails}`)
      }
    } catch (error) {
      warnings.push('Could not check for conflicting requests')
    }

    return { isValid: errors.length === 0, errors, warnings }
  }

  private async validateTeamAvailability(
    employeeId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<ValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []

    try {
      // Get employee's manager and team members
      const { data: employee, error: empError } = await supabase
        .from('employees')
        .select('manager_id')
        .eq('id', employeeId)
        .single()

      if (empError || !employee?.manager_id) {
        return { isValid: true, errors, warnings }
      }

      // Get team members
      const { data: teamMembers, error: teamError } = await supabase
        .from('employees')
        .select('id, full_name')
        .eq('manager_id', employee.manager_id)
        .eq('employment_status', 'active')
        .neq('id', employeeId)

      if (teamError || !teamMembers) {
        return { isValid: true, errors, warnings }
      }

      // Check how many team members are on leave during the requested period
      const teamMemberIds = teamMembers.map(member => member.id)
      
      const { data: overlappingLeave, error: leaveError } = await supabase
        .from('leave_requests')
        .select(`
          employee_id, 
          employees!inner(full_name)
        `)
        .in('employee_id', teamMemberIds)
        .eq('status', 'approved')
        .or(`and(start_date.lte.${endDate.toISOString().split('T')[0]},end_date.gte.${startDate.toISOString().split('T')[0]})`)

      if (leaveError) {
        return { isValid: true, errors, warnings }
      }

      if (overlappingLeave && overlappingLeave.length > 0) {
        const onLeaveCount = overlappingLeave.length
        const totalTeamSize = teamMembers.length + 1 // Include the requesting employee
        const availableTeamSize = totalTeamSize - onLeaveCount - 1 // Subtract those on leave and the requester

        if (availableTeamSize < Math.ceil(totalTeamSize * 0.5)) { // Less than 50% team available
          const onLeaveNames = overlappingLeave.map((req: any) => req.employees?.full_name || 'Unknown').join(', ')
          warnings.push(`Team availability concern: ${onLeaveNames} will also be on leave during this period`)
        }
      }
    } catch (error) {
      // Don't fail validation for team availability checks
    }

    return { isValid: true, errors, warnings }
  }

  private async validateBlackoutPeriods(
    leaveTypeId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<ValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []

    try {
      // This would typically check against a blackout_periods table
      // For now, implement some basic business rules
      
      // Example: No annual leave during December for retail businesses
      const isAnnualLeave = await this.isAnnualLeaveType(leaveTypeId)
      if (isAnnualLeave) {
        const startMonth = startDate.getMonth()
        const endMonth = endDate.getMonth()
        
        // Check if any part of the leave falls in December (month 11)
        if (startMonth === 11 || endMonth === 11 || (startMonth < 11 && endMonth > 11)) {
          warnings.push('Annual leave during December may require special approval due to business requirements')
        }
      }
    } catch (error) {
      // Don't fail validation for blackout period checks
    }

    return { isValid: true, errors, warnings }
  }

  private async getEmployeeDetails(employeeId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, full_name, hire_date, employment_status, manager_id')
        .eq('id', employeeId)
        .single()

      if (error || !data) return null
      return data
    } catch (error) {
      return null
    }
  }

  private async isAnnualLeaveType(leaveTypeId: string): Promise<boolean> {
    try {
      const leaveType = await this.leaveTypeService.getLeaveTypeById(leaveTypeId)
      return leaveType?.name.toLowerCase().includes('annual') || false
    } catch (error) {
      return false
    }
  }

  private calculateLeaveDays(startDate: Date, endDate: Date): number {
    const timeDiff = endDate.getTime() - startDate.getTime()
    return Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1
  }

  private getMonthsDifference(startDate: Date, endDate: Date): number {
    const yearDiff = endDate.getFullYear() - startDate.getFullYear()
    const monthDiff = endDate.getMonth() - startDate.getMonth()
    return yearDiff * 12 + monthDiff
  }
}