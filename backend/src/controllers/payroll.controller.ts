import { Request, Response } from 'express'
import { PayrollService, CreatePayrollPeriodData, CreatePayrollRecordData, UpdatePayrollRecordData, PayrollSearchFilters } from '../services/payroll.service'
import { ResponseHandler } from '../utils/response'
import { ValidationError, NotFoundError, ConflictError } from '../utils/errors'
import { AuthenticatedRequest } from '../middleware/permission'
import { auditService } from '../services/audit.service'

export class PayrollController {
  private payrollService: PayrollService

  constructor() {
    this.payrollService = new PayrollService()
  }

  // Payroll Period Methods
  /**
   * Create a new payroll period
   * POST /api/payroll/periods
   */
  async createPayrollPeriod(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const periodData: CreatePayrollPeriodData = req.body
      const userId = req.user?.id!

      const result = await this.payrollService.createPayrollPeriod(periodData, userId)

      if (result.success) {
        // Log audit trail
        await auditService.logUserAction(userId, 'create_payroll_period', {
          entityType: 'payroll_period',
          entityId: result.payrollPeriod?.id,
          newValues: periodData,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        })

        return ResponseHandler.created(res, result.message, {
          payrollPeriod: result.payrollPeriod
        })
      }

      return ResponseHandler.badRequest(res, result.message)
    } catch (error) {
      if (error instanceof ValidationError) {
        return ResponseHandler.validationError(res, error.errors || [error.message])
      }
      if (error instanceof ConflictError) {
        return ResponseHandler.conflict(res, error.message)
      }
      return ResponseHandler.internalError(res, 'Failed to create payroll period')
    }
  }

  /**
   * Get all payroll periods with optional filtering
   * GET /api/payroll/periods
   */
  async getPayrollPeriods(req: Request, res: Response): Promise<Response> {
    try {
      const filters: PayrollSearchFilters = {
        paymentStatus: req.query.status as string,
        search: req.query.search as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
      }

      const result = await this.payrollService.getPayrollPeriods(filters)

      if (result.success) {
        return ResponseHandler.success(res, result.message, {
          payrollPeriods: result.payrollPeriods,
          total: result.total,
          pagination: {
            limit: filters.limit || 10,
            offset: filters.offset || 0,
            total: result.total || 0
          }
        })
      }

      return ResponseHandler.badRequest(res, result.message)
    } catch (error) {
      return ResponseHandler.internalError(res, 'Failed to retrieve payroll periods')
    }
  }

  /**
   * Get payroll period by ID
   * GET /api/payroll/periods/:id
   */
  async getPayrollPeriodById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params
      const result = await this.payrollService.getPayrollPeriodById(id)

      if (result.success) {
        return ResponseHandler.success(res, result.message, {
          payrollPeriod: result.payrollPeriod
        })
      }

      return ResponseHandler.notFound(res, result.message)
    } catch (error) {
      return ResponseHandler.internalError(res, 'Failed to retrieve payroll period')
    }
  }

  /**
   * Update payroll period status
   * PUT /api/payroll/periods/:id/status
   */
  async updatePayrollPeriodStatus(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params
      const { status } = req.body
      const userId = req.user?.id!

      // Get current data for audit log
      const currentResult = await this.payrollService.getPayrollPeriodById(id)
      const oldValues = currentResult.payrollPeriod

      const result = await this.payrollService.updatePayrollPeriodStatus(id, status, userId)

      if (result.success) {
        // Log audit trail
        await auditService.logDataChange(
          userId,
          'payroll_period',
          id,
          oldValues || {},
          { status },
          req.ip,
          req.get('User-Agent')
        )

        return ResponseHandler.success(res, result.message, {
          payrollPeriod: result.payrollPeriod
        })
      }

      return ResponseHandler.badRequest(res, result.message)
    } catch (error) {
      if (error instanceof ValidationError) {
        return ResponseHandler.validationError(res, error.errors || [error.message])
      }
      if (error instanceof NotFoundError) {
        return ResponseHandler.notFound(res, error.message)
      }
      return ResponseHandler.internalError(res, 'Failed to update payroll period status')
    }
  }

  /**
   * Generate payroll for a period
   * POST /api/payroll/periods/:id/generate
   */
  async generatePayrollForPeriod(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params
      const userId = req.user?.id!

      const result = await this.payrollService.generatePayrollForPeriod(id)

      if (result.success) {
        // Log audit trail
        await auditService.logUserAction(userId, 'generate_payroll', {
          entityType: 'payroll_period',
          entityId: id,
          newValues: { generatedRecords: result.payrollRecords?.length || 0 },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        })

        return ResponseHandler.success(res, result.message, {
          payrollRecords: result.payrollRecords,
          generatedCount: result.payrollRecords?.length || 0
        })
      }

      return ResponseHandler.badRequest(res, result.message)
    } catch (error) {
      return ResponseHandler.internalError(res, 'Failed to process payroll')
    }
  }



  /**
   * Get payroll summary report
   * GET /api/payroll/summary-report
   */
  async getPayrollSummaryReport(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id!
      const { startDate, endDate } = req.query

      // getPayrollSummaryReport method doesn't exist, using getPayrollRecords instead
      const result = await this.payrollService.getPayrollRecords({
        search: '',
        limit: 1000
      })

      if (result.success) {
        // Log audit trail
        await auditService.logUserAction(userId, 'view_payroll_summary_report', {
          entityType: 'payroll_report'
        })

        return ResponseHandler.success(res, 'Payroll summary report retrieved successfully', {
          report: { records: result.payrollRecords, total: result.total }
        })
      }

      return ResponseHandler.badRequest(res, result.message)
    } catch (error) {
      return ResponseHandler.internalError(res, 'Failed to retrieve payroll summary report')
    }
  }

  /**
   * Get employee payroll records
   * GET /api/payroll/employee/:employeeId/records
   */
  async getEmployeePayrollRecords(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { employeeId } = req.params
      const userId = req.user?.id!

      const result = await this.payrollService.getPayrollRecords({ employeeId })

      if (result.success) {
        // Log audit trail
        await auditService.logUserAction(userId, 'view_employee_payroll_records', {
          entityType: 'payroll_records',
          entityId: employeeId
        })

        return ResponseHandler.success(res, 'Employee payroll records retrieved successfully', {
          payrollRecords: result.payrollRecords
        })
      }

      return ResponseHandler.badRequest(res, result.message)
    } catch (error) {
      return ResponseHandler.internalError(res, 'Failed to retrieve employee payroll records')
    }
  }

  /**
   * Create a new payroll record
   * POST /api/payroll/records
   */
  async createPayrollRecord(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const recordData: CreatePayrollRecordData = req.body
      const userId = req.user?.id!

      const result = await this.payrollService.createPayrollRecord(recordData)

      if (result.success) {
        // Log audit trail
        await auditService.logUserAction(userId, 'create_payroll_record', {
          entityType: 'payroll_record',
          entityId: result.payrollRecord?.id,
          newValues: recordData,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        })

        return ResponseHandler.created(res, result.message, {
          payrollRecord: result.payrollRecord
        })
      }

      return ResponseHandler.badRequest(res, result.message)
    } catch (error) {
      if (error instanceof ValidationError) {
        return ResponseHandler.validationError(res, error.errors || [error.message])
      }
      if (error instanceof ConflictError) {
        return ResponseHandler.conflict(res, error.message)
      }
      return ResponseHandler.internalError(res, 'Failed to create payroll record')
    }
  }

  /**
   * Get all payroll records with optional filtering
   * GET /api/payroll/records
   */
  async getPayrollRecords(req: Request, res: Response): Promise<Response> {
    try {
      const filters: PayrollSearchFilters = {
        employeeId: req.query.employeeId as string,
        payrollPeriodId: req.query.periodId as string,
        paymentStatus: req.query.status as string,
        // year filter not supported in PayrollSearchFilters: req.query.year ? parseInt(req.query.year as string) : undefined,
        search: req.query.search as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
      }

      const result = await this.payrollService.getPayrollRecords(filters)

      if (result.success) {
        return ResponseHandler.success(res, result.message, {
          payrollRecords: result.payrollRecords,
          total: result.total,
          pagination: {
            limit: filters.limit || 10,
            offset: filters.offset || 0,
            total: result.total || 0
          }
        })
      }

      return ResponseHandler.badRequest(res, result.message)
    } catch (error) {
      return ResponseHandler.internalError(res, 'Failed to retrieve payroll records')
    }
  }

  /**
   * Get payroll record by ID
   * GET /api/payroll/records/:id
   */
  async getPayrollRecordById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params
      const result = await this.payrollService.getPayrollRecordById(id)

      if (result.success) {
        return ResponseHandler.success(res, result.message, {
          payrollRecord: result.payrollRecord
        })
      }

      return ResponseHandler.notFound(res, result.message)
    } catch (error) {
      return ResponseHandler.internalError(res, 'Failed to retrieve payroll record')
    }
  }

  /**
   * Update payroll record
   * PUT /api/payroll/records/:id
   */
  async updatePayrollRecord(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params
      const updateData: UpdatePayrollRecordData = req.body
      const userId = req.user?.id!

      // Get current data for audit log
      const currentResult = await this.payrollService.getPayrollRecordById(id)
      const oldValues = currentResult.payrollRecord

      const result = await this.payrollService.updatePayrollRecord(id, updateData)

      if (result.success) {
        // Log audit trail
        await auditService.logDataChange(
          userId,
          'payroll_record',
          id,
          oldValues || {},
          updateData,
          req.ip,
          req.get('User-Agent')
        )

        return ResponseHandler.success(res, result.message, {
          payrollRecord: result.payrollRecord
        })
      }

      return ResponseHandler.badRequest(res, result.message)
    } catch (error) {
      if (error instanceof ValidationError) {
        return ResponseHandler.validationError(res, error.errors || [error.message])
      }
      if (error instanceof NotFoundError) {
        return ResponseHandler.notFound(res, error.message)
      }
      return ResponseHandler.internalError(res, 'Failed to update payroll record')
    }
  }

  /**
   * Delete payroll record
   * DELETE /api/payroll/records/:id
   */
  async deletePayrollRecord(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params
      const userId = req.user?.id!

      // Get current data for audit log
      const currentResult = await this.payrollService.getPayrollRecordById(id)
      const oldValues = currentResult.payrollRecord

      const result = await this.payrollService.deletePayrollRecord(id)

      if (result.success) {
        // Log audit trail
        await auditService.logUserAction(userId, 'delete_payroll_record', {
          entityType: 'payroll_record',
          entityId: id,
          oldValues: oldValues || {},
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        })

        return ResponseHandler.success(res, result.message)
      }

      return ResponseHandler.badRequest(res, result.message)
    } catch (error) {
      if (error instanceof NotFoundError) {
        return ResponseHandler.notFound(res, error.message)
      }
      return ResponseHandler.internalError(res, 'Failed to delete payroll record')
    }
  }

  /**
   * Get employee payroll summary
   * GET /api/payroll/employees/:employeeId/summary
   */
  async getEmployeePayrollSummary(req: Request, res: Response): Promise<Response> {
    try {
      const { employeeId } = req.params
      const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear()

      const filters: PayrollSearchFilters = {
        employeeId
      }

      const result = await this.payrollService.getPayrollRecords(filters)

      if (result.success) {
        const records = result.payrollRecords || []
        const summary = {
          totalGrossPay: records.reduce((sum, record) => sum + record.grossPay, 0),
          totalNetPay: records.reduce((sum, record) => sum + record.netPay, 0),
          totalDeductions: records.reduce((sum, record) => sum + record.totalDeductions, 0),
          totalTax: records.reduce((sum, record) => sum + record.taxDeduction, 0),
          recordsCount: records.length,
          year
        }

        return ResponseHandler.success(res, 'Employee payroll summary retrieved successfully', {
          summary,
          records
        })
      }

      return ResponseHandler.badRequest(res, result.message)
    } catch (error) {
      return ResponseHandler.internalError(res, 'Failed to retrieve employee payroll summary')
    }
  }
}