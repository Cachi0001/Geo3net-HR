import { Request, Response } from 'express'
import { LeaveService } from '../services/leave.service'
import { ResponseHandler } from '../utils/response'
import { ValidationError, NotFoundError, ConflictError } from '../utils/errors'
import { AuthenticatedRequest } from '../middleware/permission'

export class LeaveController {
  private leaveService: LeaveService

  constructor() {
    this.leaveService = new LeaveService()
  }

  // Leave Type Methods
  /**
   * Create a new leave type
   * POST /api/leave/types
   */
  async createLeaveType(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const leaveTypeData = req.body
      const userId = req.user?.id!

      const result = await this.leaveService.createLeaveType(leaveTypeData, userId)

      if (result.success) {
        return ResponseHandler.created(res, result.message, {
          leaveType: result.leaveType
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
      return ResponseHandler.internalError(res, 'Failed to create leave type')
    }
  }

  /**
   * Get all leave types
   * GET /api/leave/types
   */
  async getLeaveTypes(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const includeInactive = req.query.includeInactive === 'true'
      const result = await this.leaveService.getLeaveTypes(includeInactive)

      if (result.success) {
        return ResponseHandler.success(res, result.message, {
          leaveTypes: result.leaveTypes
        })
      }

      return ResponseHandler.badRequest(res, result.message)
    } catch (error) {
      return ResponseHandler.internalError(res, 'Failed to retrieve leave types')
    }
  }

  /**
   * Get leave type by ID
   * GET /api/leave/types/:id
   */
  async getLeaveTypeById(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params
      const leaveType = await this.leaveService.getLeaveTypeById(id)

      if (!leaveType) {
        return ResponseHandler.notFound(res, 'Leave type not found')
      }

      return ResponseHandler.success(res, 'Leave type retrieved successfully', {
        leaveType
      })
    } catch (error) {
      return ResponseHandler.internalError(res, 'Failed to retrieve leave type')
    }
  }

  /**
   * Update leave type
   * PUT /api/leave/types/:id
   */
  async updateLeaveType(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params
      const updateData = req.body
      const userId = req.user?.id!

      const result = await this.leaveService.updateLeaveType(id, updateData, userId)

      if (result.success) {
        return ResponseHandler.success(res, result.message, {
          leaveType: result.leaveType
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
      if (error instanceof ConflictError) {
        return ResponseHandler.conflict(res, error.message)
      }
      return ResponseHandler.internalError(res, 'Failed to update leave type')
    }
  }

  // Leave Policy Methods
  /**
   * Create a new leave policy
   * POST /api/leave/policies
   */
  async createLeavePolicy(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const policyData = req.body
      const userId = req.user?.id!

      const result = await this.leaveService.createLeavePolicy(policyData, userId)

      if (result.success) {
        return ResponseHandler.created(res, result.message, {
          leavePolicy: result.leavePolicy
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
      return ResponseHandler.internalError(res, 'Failed to create leave policy')
    }
  }

  /**
   * Get all leave policies
   * GET /api/leave/policies
   */
  async getLeavePolicies(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const includeInactive = req.query.includeInactive === 'true'
      const result = await this.leaveService.getLeavePolicies(includeInactive)

      if (result.success) {
        return ResponseHandler.success(res, result.message, {
          leavePolicies: result.leavePolicies
        })
      }

      return ResponseHandler.badRequest(res, result.message)
    } catch (error) {
      return ResponseHandler.internalError(res, 'Failed to retrieve leave policies')
    }
  }

  /**
   * Get leave policy by ID
   * GET /api/leave/policies/:id
   */
  async getLeavePolicyById(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params
      const leavePolicy = await this.leaveService.getLeavePolicyById(id)

      if (!leavePolicy) {
        return ResponseHandler.notFound(res, 'Leave policy not found')
      }

      return ResponseHandler.success(res, 'Leave policy retrieved successfully', {
        leavePolicy
      })
    } catch (error) {
      return ResponseHandler.internalError(res, 'Failed to retrieve leave policy')
    }
  }

  /**
   * Update leave policy
   * PUT /api/leave/policies/:id
   */
  async updateLeavePolicy(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params
      const updateData = req.body
      const userId = req.user?.id!

      const result = await this.leaveService.updateLeavePolicy(id, updateData, userId)

      if (result.success) {
        return ResponseHandler.success(res, result.message, {
          leavePolicy: result.leavePolicy
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
      if (error instanceof ConflictError) {
        return ResponseHandler.conflict(res, error.message)
      }
      return ResponseHandler.internalError(res, 'Failed to update leave policy')
    }
  }

  // Leave Request Methods
  /**
   * Create a new leave request
   * POST /api/leave/requests
   */
  async createLeaveRequest(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const requestData = req.body
      const employeeId = req.user?.id!
      const userRole = req.user?.role

      // Super-admin cannot submit leave requests
      if (userRole === 'super-admin') {
        return ResponseHandler.forbidden(res, 'Super administrators cannot submit leave requests')
      }

      const result = await this.leaveService.createLeaveRequest(requestData, employeeId)

      if (result.success) {
        return ResponseHandler.created(res, result.message, {
          leaveRequest: result.leaveRequest
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
      return ResponseHandler.internalError(res, 'Failed to create leave request')
    }
  }

  /**
   * Get leave requests with filtering
   * GET /api/leave/requests
   */
  async getLeaveRequests(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id!
      const userRole = req.user?.role || 'employee'
      const filters = {
        status: req.query.status as string,
        leaveTypeId: req.query.leaveTypeId as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        employeeId: req.query.employeeId as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0
      }

      let result: any

      // Determine which requests to show based on role
      if (['super-admin', 'hr-admin'].includes(userRole)) {
        // HR can see all requests
        if (filters.employeeId) {
          result = await this.leaveService.getEmployeeLeaveRequests(filters.employeeId, filters)
        } else {
          // Get all requests (would need a new method for this)
          result = await this.leaveService.getEmployeeLeaveRequests(userId, filters)
        }
      } else if (userRole === 'manager') {
        // Managers can see their team's requests
        result = await this.leaveService.getTeamLeaveRequests(userId, filters)
      } else {
        // Employees can only see their own requests
        result = await this.leaveService.getEmployeeLeaveRequests(userId, filters)
      }

      if (result.success) {
        return ResponseHandler.success(res, result.message, {
          leaveRequests: result.leaveRequests,
          total: result.total
        })
      }

      return ResponseHandler.badRequest(res, result.message)
    } catch (error) {
      return ResponseHandler.internalError(res, 'Failed to retrieve leave requests')
    }
  }

  /**
   * Get leave request by ID
   * GET /api/leave/requests/:id
   */
  async getLeaveRequestById(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params
      const leaveRequest = await this.leaveService.getLeaveRequestById(id)

      if (!leaveRequest) {
        return ResponseHandler.notFound(res, 'Leave request not found')
      }

      return ResponseHandler.success(res, 'Leave request retrieved successfully', {
        leaveRequest
      })
    } catch (error) {
      return ResponseHandler.internalError(res, 'Failed to retrieve leave request')
    }
  }

  /**
   * Update leave request
   * PUT /api/leave/requests/:id
   */
  async updateLeaveRequest(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params
      const updateData = req.body
      const userId = req.user?.id!

      const result = await this.leaveService.updateLeaveRequest(id, updateData, userId)

      if (result.success) {
        return ResponseHandler.success(res, result.message, {
          leaveRequest: result.leaveRequest
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
      if (error instanceof ConflictError) {
        return ResponseHandler.conflict(res, error.message)
      }
      return ResponseHandler.internalError(res, 'Failed to update leave request')
    }
  }

  /**
   * Approve leave request
   * POST /api/leave/requests/:id/approve
   */
  async approveLeaveRequest(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params
      const { comments } = req.body
      const userId = req.user?.id!

      const result = await this.leaveService.approveLeaveRequest(id, userId, comments)

      if (result.success) {
        return ResponseHandler.success(res, result.message)
      }

      return ResponseHandler.badRequest(res, result.message)
    } catch (error) {
      if (error instanceof ValidationError) {
        return ResponseHandler.validationError(res, error.errors || [error.message])
      }
      if (error instanceof NotFoundError) {
        return ResponseHandler.notFound(res, error.message)
      }
      return ResponseHandler.internalError(res, 'Failed to approve leave request')
    }
  }

  /**
   * Deny leave request
   * POST /api/leave/requests/:id/deny
   */
  async denyLeaveRequest(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params
      const { reason } = req.body
      const userId = req.user?.id!

      if (!reason) {
        return ResponseHandler.badRequest(res, 'Denial reason is required')
      }

      const result = await this.leaveService.denyLeaveRequest(id, userId, reason)

      if (result.success) {
        return ResponseHandler.success(res, result.message)
      }

      return ResponseHandler.badRequest(res, result.message)
    } catch (error) {
      if (error instanceof ValidationError) {
        return ResponseHandler.validationError(res, error.errors || [error.message])
      }
      if (error instanceof NotFoundError) {
        return ResponseHandler.notFound(res, error.message)
      }
      return ResponseHandler.internalError(res, 'Failed to deny leave request')
    }
  }

  /**
   * Cancel leave request
   * POST /api/leave/requests/:id/cancel
   */
  async cancelLeaveRequest(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params
      const { reason } = req.body
      const userId = req.user?.id!

      const result = await this.leaveService.cancelLeaveRequest(id, userId, reason)

      if (result.success) {
        return ResponseHandler.success(res, result.message)
      }

      return ResponseHandler.badRequest(res, result.message)
    } catch (error) {
      if (error instanceof ValidationError) {
        return ResponseHandler.validationError(res, error.errors || [error.message])
      }
      if (error instanceof NotFoundError) {
        return ResponseHandler.notFound(res, error.message)
      }
      return ResponseHandler.internalError(res, 'Failed to cancel leave request')
    }
  }

  // Leave Balance Methods
  /**
   * Get employee leave balances
   * GET /api/leave/balances/:employeeId
   */
  async getLeaveBalances(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { employeeId } = req.params
      const year = req.query.year ? parseInt(req.query.year as string) : undefined

      const result = await this.leaveService.getEmployeeBalances(employeeId, year)

      if (result.success) {
        return ResponseHandler.success(res, result.message, {
          leaveBalances: result.leaveBalances
        })
      }

      return ResponseHandler.badRequest(res, result.message)
    } catch (error) {
      return ResponseHandler.internalError(res, 'Failed to retrieve leave balances')
    }
  }

  /**
   * Get my leave balances
   * GET /api/leave/my-balances
   */
  async getMyLeaveBalances(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const employeeId = req.user?.id!
      const year = req.query.year ? parseInt(req.query.year as string) : undefined

      const result = await this.leaveService.getEmployeeBalances(employeeId, year)

      if (result.success) {
        return ResponseHandler.success(res, result.message, {
          leaveBalances: result.leaveBalances
        })
      }

      return ResponseHandler.badRequest(res, result.message)
    } catch (error) {
      return ResponseHandler.internalError(res, 'Failed to retrieve leave balances')
    }
  }

  /**
   * Get my leave requests
   * GET /api/leave/my-requests
   */
  async getMyLeaveRequests(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const employeeId = req.user?.id!
      const filters = {
        status: req.query.status as string,
        leaveTypeId: req.query.leaveTypeId as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0
      }

      const result = await this.leaveService.getEmployeeLeaveRequests(employeeId, filters)

      if (result.success) {
        return ResponseHandler.success(res, result.message, {
          leaveRequests: result.leaveRequests
        })
      }

      return ResponseHandler.badRequest(res, result.message)
    } catch (error) {
      return ResponseHandler.internalError(res, 'Failed to retrieve leave requests')
    }
  }

  /**
   * Initialize employee leave balances
   * POST /api/leave/balances/:employeeId/initialize
   */
  async initializeLeaveBalances(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { employeeId } = req.params
      const { effectiveDate } = req.body
      const userId = req.user?.id!

      const result = await this.leaveService.onboardNewEmployee({
        employeeId,
        hireDate: new Date(effectiveDate || new Date())
      }, userId)

      if (result.success) {
        return ResponseHandler.success(res, result.message, {
          assignedPolicies: result.assignedPolicies,
          initializedBalances: result.initializedBalances
        })
      }

      return ResponseHandler.badRequest(res, result.message)
    } catch (error) {
      return ResponseHandler.internalError(res, 'Failed to initialize leave balances')
    }
  }

  /**
   * Update leave balance (HR adjustment)
   * PUT /api/leave/balances/:id
   */
  async updateLeaveBalance(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { employeeId, leaveTypeId, amount, reason } = req.body
      const userId = req.user?.id!

      await this.leaveService.adjustEmployeeBalance(employeeId, leaveTypeId, amount, reason, userId)

      return ResponseHandler.success(res, 'Leave balance adjusted successfully')
    } catch (error) {
      if (error instanceof ValidationError) {
        return ResponseHandler.validationError(res, error.errors || [error.message])
      }
      if (error instanceof NotFoundError) {
        return ResponseHandler.notFound(res, error.message)
      }
      return ResponseHandler.internalError(res, 'Failed to update leave balance')
    }
  }

  /**
   * Get leave analytics
   * GET /api/leave/analytics
   */
  async getLeaveAnalytics(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      // This would implement comprehensive leave analytics
      // For now, return a placeholder
      const analytics = {
        totalRequests: 0,
        approvedRequests: 0,
        pendingRequests: 0,
        deniedRequests: 0,
        averageProcessingTime: 0,
        mostUsedLeaveTypes: [],
        departmentUtilization: []
      }

      return ResponseHandler.success(res, 'Leave analytics retrieved successfully', analytics)
    } catch (error) {
      return ResponseHandler.internalError(res, 'Failed to retrieve leave analytics')
    }
  }

  /**
   * Process accruals
   * POST /api/leave/accruals/process
   */
  async processAccruals(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const result = await this.leaveService.processScheduledAccruals()

      return ResponseHandler.success(res, result.message, {
        processedEmployees: result.processedEmployees,
        totalAccrued: result.totalAccrued,
        errors: result.errors
      })
    } catch (error) {
      return ResponseHandler.internalError(res, 'Failed to process leave accruals')
    }
  }

  /**
   * Validate leave request
   * POST /api/leave/validate
   */
  async validateLeaveRequest(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { leaveTypeId, startDate, endDate } = req.body
      const employeeId = req.user?.id!

      const validation = await this.leaveService.validateLeaveRequest(
        employeeId,
        leaveTypeId,
        new Date(startDate),
        new Date(endDate)
      )

      return ResponseHandler.success(res, 'Leave request validation completed', {
        isValid: validation.isValid,
        errors: validation.errors,
        warnings: validation.warnings
      })
    } catch (error) {
      return ResponseHandler.internalError(res, 'Failed to validate leave request')
    }
  }
}