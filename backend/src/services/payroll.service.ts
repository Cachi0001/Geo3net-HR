import { supabase } from '../config/database'
import { NotFoundError, ConflictError, ValidationError } from '../utils/errors'

export interface PayrollPeriod {
  id: string
  name: string
  startDate: string
  endDate: string
  payDate: string
  status: 'draft' | 'processing' | 'approved' | 'paid' | 'cancelled'
  processedBy?: string
  approvedBy?: string
  createdAt: string
  updatedAt: string
}

export interface PayrollRecord {
  id: string
  payrollPeriodId: string
  basicSalary: number
  overtimeHours: number
  overtimeRate: number
  overtimePay: number
  allowances: number
  bonuses: number
  grossPay: number
  taxDeduction: number
  pensionDeduction: number
  insuranceDeduction: number
  otherDeductions: number
  totalDeductions: number
  netPay: number
  paymentMethod: string
  paymentStatus: 'pending' | 'paid' | 'failed' | 'cancelled'
  paymentDate?: string
  paymentReference?: string
  notes?: string
  createdAt: string
  updatedAt: string
  // Employee details for display
  employeeName?: string
  employeeId?: string
  department?: string
}

export interface CreatePayrollPeriodData {
  name: string
  startDate: string
  endDate: string
  payDate: string
}


export interface CreatePayrollRecordData {
  employeeId: string
  payrollPeriodId: string
  basicSalary: number
  overtimeHours?: number
  overtimeRate?: number
  allowances?: number
  bonuses?: number
  taxDeduction?: number
  pensionDeduction?: number
  insuranceDeduction?: number
  otherDeductions?: number
  paymentMethod?: string
  notes?: string
}

export interface UpdatePayrollRecordData {
  basicSalary?: number
  overtimeHours?: number
  overtimeRate?: number
  allowances?: number
  bonuses?: number
  taxDeduction?: number
  pensionDeduction?: number
  insuranceDeduction?: number
  otherDeductions?: number
  paymentMethod?: string
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'cancelled'
  paymentDate?: string
  paymentReference?: string
  notes?: string
}

export interface PayrollSearchFilters {
  employeeId?: string
  payrollPeriodId?: string
  paymentStatus?: string
  departmentId?: string
  search?: string
  limit?: number
  offset?: number
}

export interface PayrollResult {
  success: boolean
  message: string
  payrollPeriod?: PayrollPeriod
  payrollPeriods?: PayrollPeriod[]
  payrollRecord?: PayrollRecord
  payrollRecords?: PayrollRecord[]
  total?: number
}

export class PayrollService {
  async createPayrollPeriod(data: CreatePayrollPeriodData, createdBy: string): Promise<PayrollResult> {
    try {
      this.validatePayrollPeriodData(data)

      const { data: existingPeriods, error: checkError } = await supabase
        .from('payroll_periods')
        .select('*')
        .or(`start_date.lte.${data.endDate},end_date.gte.${data.startDate}`)
        .neq('status', 'cancelled')

      if (checkError) throw checkError

      if (existingPeriods && existingPeriods.length > 0) {
        throw new ConflictError('Payroll period overlaps with existing period')
      }

      const { data: newPeriod, error } = await supabase
        .from('payroll_periods')
        .insert({
          name: data.name,
          start_date: data.startDate,
          end_date: data.endDate,
          pay_date: data.payDate,
          status: 'draft'
        })
        .select()
        .single()

      if (error) throw error

      return {
        success: true,
        message: 'Payroll period created successfully',
        payrollPeriod: this.mapDatabaseToPayrollPeriod(newPeriod)
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to create payroll period'
      }
    }
  }

  async getPayrollPeriods(filters: PayrollSearchFilters = {}): Promise<PayrollResult> {
    try {
      let query = supabase
        .from('payroll_periods')
        .select('*', { count: 'exact' })
        .order('start_date', { ascending: false })

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
        message: 'Payroll periods retrieved successfully',
        payrollPeriods: data?.map(this.mapDatabaseToPayrollPeriod) || [],
        total: count || 0
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to retrieve payroll periods'
      }
    }
  }

  async getPayrollPeriodById(id: string): Promise<PayrollResult> {
    try {
      const { data, error } = await supabase
        .from('payroll_periods')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      if (!data) throw new NotFoundError('Payroll period not found')

      return {
        success: true,
        message: 'Payroll period retrieved successfully',
        payrollPeriod: this.mapDatabaseToPayrollPeriod(data)
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to retrieve payroll period'
      }
    }
  }

  async updatePayrollPeriodStatus(id: string, status: PayrollPeriod['status'], userId: string): Promise<PayrollResult> {
    try {
      const updateData: any = { status }

      if (status === 'processing') {
        updateData.processed_by = userId
      } else if (status === 'approved') {
        updateData.approved_by = userId
      }

      const { data, error } = await supabase
        .from('payroll_periods')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      if (!data) throw new NotFoundError('Payroll period not found')

      return {
        success: true,
        message: 'Payroll period status updated successfully',
        payrollPeriod: this.mapDatabaseToPayrollPeriod(data)
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to update payroll period status'
      }
    }
  }

  // Payroll Record Methods
  async createPayrollRecord(data: CreatePayrollRecordData): Promise<PayrollResult> {
    try {
      this.validatePayrollRecordData(data)

      // Check if record already exists for this employee and period
      const { data: existing, error: checkError } = await supabase
        .from('payroll_records')
        .select('id')
        .eq('employee_id', data.employeeId)
        .eq('payroll_period_id', data.payrollPeriodId)
        .single()

      if (existing) {
        throw new ConflictError('Payroll record already exists for this employee and period')
      }

      const overtimePay = (data.overtimeHours || 0) * (data.overtimeRate || 0)

      const { data: newRecord, error } = await supabase
        .from('payroll_records')
        .insert({
          employee_id: data.employeeId,
          payroll_period_id: data.payrollPeriodId,
          basic_salary: data.basicSalary,
          overtime_hours: data.overtimeHours || 0,
          overtime_rate: data.overtimeRate || 0,
          overtime_pay: overtimePay,
          allowances: data.allowances || 0,
          bonuses: data.bonuses || 0,
          tax_deduction: data.taxDeduction || 0,
          pension_deduction: data.pensionDeduction || 0,
          insurance_deduction: data.insuranceDeduction || 0,
          other_deductions: data.otherDeductions || 0,
          payment_method: data.paymentMethod || 'bank_transfer',
          notes: data.notes
        })
        .select(`
          *,
          users!payroll_records_employee_id_fkey(
            full_name,
            employee_id,
            departments(name)
          )
        `)
        .single()

      if (error) throw error

      return {
        success: true,
        message: 'Payroll record created successfully',
        payrollRecord: this.mapDatabaseToPayrollRecord(newRecord)
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to create payroll record'
      }
    }
  }

  async getPayrollRecords(filters: PayrollSearchFilters = {}): Promise<PayrollResult> {
    try {
      let query = supabase
        .from('payroll_records')
        .select(`
          *,
          users!payroll_records_employee_id_fkey(
            full_name,
            employee_id,
            departments(name)
          ),
          payroll_periods(name, start_date, end_date)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })

      if (filters.employeeId) {
        query = query.eq('employee_id', filters.employeeId)
      }

      if (filters.payrollPeriodId) {
        query = query.eq('payroll_period_id', filters.payrollPeriodId)
      }

      if (filters.paymentStatus) {
        query = query.eq('payment_status', filters.paymentStatus)
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
        message: 'Payroll records retrieved successfully',
        payrollRecords: data?.map(this.mapDatabaseToPayrollRecord) || [],
        total: count || 0
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to retrieve payroll records'
      }
    }
  }

  async getPayrollRecordById(id: string): Promise<PayrollResult> {
    try {
      const { data, error } = await supabase
        .from('payroll_records')
        .select(`
          *,
          users!payroll_records_employee_id_fkey(
            full_name,
            employee_id,
            departments(name)
          ),
          payroll_periods(name, start_date, end_date)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      if (!data) throw new NotFoundError('Payroll record not found')

      return {
        success: true,
        message: 'Payroll record retrieved successfully',
        payrollRecord: this.mapDatabaseToPayrollRecord(data)
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to retrieve payroll record'
      }
    }
  }

  async updatePayrollRecord(id: string, data: UpdatePayrollRecordData): Promise<PayrollResult> {
    try {
      const updateData: any = {}

      if (data.basicSalary !== undefined) updateData.basic_salary = data.basicSalary
      if (data.overtimeHours !== undefined) updateData.overtime_hours = data.overtimeHours
      if (data.overtimeRate !== undefined) updateData.overtime_rate = data.overtimeRate
      if (data.allowances !== undefined) updateData.allowances = data.allowances
      if (data.bonuses !== undefined) updateData.bonuses = data.bonuses
      if (data.taxDeduction !== undefined) updateData.tax_deduction = data.taxDeduction
      if (data.pensionDeduction !== undefined) updateData.pension_deduction = data.pensionDeduction
      if (data.insuranceDeduction !== undefined) updateData.insurance_deduction = data.insuranceDeduction
      if (data.otherDeductions !== undefined) updateData.other_deductions = data.otherDeductions
      if (data.paymentMethod !== undefined) updateData.payment_method = data.paymentMethod
      if (data.paymentStatus !== undefined) updateData.payment_status = data.paymentStatus
      if (data.paymentDate !== undefined) updateData.payment_date = data.paymentDate
      if (data.paymentReference !== undefined) updateData.payment_reference = data.paymentReference
      if (data.notes !== undefined) updateData.notes = data.notes

      // Recalculate overtime pay if overtime hours or rate changed
      if (data.overtimeHours !== undefined || data.overtimeRate !== undefined) {
        const { data: currentRecord } = await supabase
          .from('payroll_records')
          .select('overtime_hours, overtime_rate')
          .eq('id', id)
          .single()

        if (currentRecord) {
          const hours = data.overtimeHours !== undefined ? data.overtimeHours : currentRecord.overtime_hours
          const rate = data.overtimeRate !== undefined ? data.overtimeRate : currentRecord.overtime_rate
          updateData.overtime_pay = hours * rate
        }
      }

      const { data: updatedRecord, error } = await supabase
        .from('payroll_records')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          users!payroll_records_employee_id_fkey(
            full_name,
            employee_id,
            departments(name)
          ),
          payroll_periods(name, start_date, end_date)
        `)
        .single()

      if (error) throw error
      if (!updatedRecord) throw new NotFoundError('Payroll record not found')

      return {
        success: true,
        message: 'Payroll record updated successfully',
        payrollRecord: this.mapDatabaseToPayrollRecord(updatedRecord)
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to update payroll record'
      }
    }
  }

  async deletePayrollRecord(id: string): Promise<PayrollResult> {
    try {
      const { error } = await supabase
        .from('payroll_records')
        .delete()
        .eq('id', id)

      if (error) throw error

      return {
        success: true,
        message: 'Payroll record deleted successfully'
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to delete payroll record'
      }
    }
  }

  async generatePayrollForPeriod(periodId: string, employeeIds?: string[]): Promise<PayrollResult> {
    try {
      // Get period details
      const periodResult = await this.getPayrollPeriodById(periodId)
      if (!periodResult.success || !periodResult.payrollPeriod) {
        throw new NotFoundError('Payroll period not found')
      }

      // Get employees to generate payroll for
      let employeeQuery = supabase
        .from('users')
        .select('id, full_name, employee_id, salary, departments(name)')
        .eq('employment_status', 'active')

      if (employeeIds && employeeIds.length > 0) {
        employeeQuery = employeeQuery.in('id', employeeIds)
      }

      const { data: employees, error: employeeError } = await employeeQuery

      if (employeeError) throw employeeError

      if (!employees || employees.length === 0) {
        throw new ValidationError('No active employees found')
      }

      // Generate payroll records for each employee
      const createdRecords = []
      for (const employee of employees) {
        try {
          const recordData: CreatePayrollRecordData = {
            employeeId: employee.id,
            payrollPeriodId: periodId,
            basicSalary: employee.salary || 0
          }

          const result = await this.createPayrollRecord(recordData)
          if (result.success && result.payrollRecord) {
            createdRecords.push(result.payrollRecord)
          }
        } catch (error) {
          // Continue with other employees if one fails
          console.error(`Failed to create payroll record for employee ${employee.id}:`, error)
        }
      }

      return {
        success: true,
        message: `Generated payroll for ${createdRecords.length} employees`,
        payrollRecords: createdRecords
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to generate payroll for period'
      }
    }
  }

  // Helper Methods
  private validatePayrollPeriodData(data: CreatePayrollPeriodData): void {
    if (!data.name?.trim()) {
      throw new ValidationError('Period name is required')
    }
    if (!data.startDate) {
      throw new ValidationError('Start date is required')
    }
    if (!data.endDate) {
      throw new ValidationError('End date is required')
    }
    if (!data.payDate) {
      throw new ValidationError('Pay date is required')
    }
    if (new Date(data.startDate) >= new Date(data.endDate)) {
      throw new ValidationError('End date must be after start date')
    }
  }

  private validatePayrollRecordData(data: CreatePayrollRecordData): void {
    if (!data.employeeId) {
      throw new ValidationError('Employee ID is required')
    }
    if (!data.payrollPeriodId) {
      throw new ValidationError('Payroll period ID is required')
    }
    if (data.basicSalary < 0) {
      throw new ValidationError('Basic salary cannot be negative')
    }
    if (data.overtimeHours && data.overtimeHours < 0) {
      throw new ValidationError('Overtime hours cannot be negative')
    }
    if (data.overtimeRate && data.overtimeRate < 0) {
      throw new ValidationError('Overtime rate cannot be negative')
    }
  }

  private mapDatabaseToPayrollPeriod(data: any): PayrollPeriod {
    return {
      id: data.id,
      name: data.name,
      startDate: data.start_date,
      endDate: data.end_date,
      payDate: data.pay_date,
      status: data.status,
      processedBy: data.processed_by,
      approvedBy: data.approved_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }
  }

  private mapDatabaseToPayrollRecord(data: any): PayrollRecord {
    return {
      id: data.id,
      employeeId: data.employee_id,
      payrollPeriodId: data.payroll_period_id,
      basicSalary: data.basic_salary,
      overtimeHours: data.overtime_hours,
      overtimeRate: data.overtime_rate,
      overtimePay: data.overtime_pay,
      allowances: data.allowances,
      bonuses: data.bonuses,
      grossPay: data.gross_pay,
      taxDeduction: data.tax_deduction,
      pensionDeduction: data.pension_deduction,
      insuranceDeduction: data.insurance_deduction,
      otherDeductions: data.other_deductions,
      totalDeductions: data.total_deductions,
      netPay: data.net_pay,
      paymentMethod: data.payment_method,
      paymentStatus: data.payment_status,
      paymentDate: data.payment_date,
      paymentReference: data.payment_reference,
      notes: data.notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      employeeName: data.users?.full_name,
      department: data.users?.departments?.name
    }
  }
}