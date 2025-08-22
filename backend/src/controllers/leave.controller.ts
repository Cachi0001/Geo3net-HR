import { Request, Response } from 'express'
import { LeaveService, CreateLeaveTypeData, UpdateLeaveTypeData, CreateLeaveRequestData, UpdateLeaveRequestData, LeaveSearchFilters } from '../services/leave.service'
import { ResponseHandler } from '../utils/response'
import { ValidationError, NotFoundError, ConflictError } from '../utils/errors'
import { AuthenticatedRequest } from '../middleware/permission'
import { auditService } from '../services/audit.service'

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
      const leaveTypeData: CreateLeaveTypeData = req.body
      const userId = req.user?.id!

      const result = await this.leaveService.createLeaveType(leaveTypeData)

      if (result.success) {
        // Log audit trail
        await auditService.logUserAction(userId, 'create_leave_type', {
          entityType: 'leave_type',
          entityId: result.leaveType?.id,
          newValues: leaveTypeData,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        })

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
  async getLeaveTypes(req: Request, res: Response): Promise<Response> {
    try {
      const includeInactive = req.query.includeInactive === 'true'
      const filters: LeaveSearchFilters = {
        search: includeInactive ? undefined : undefined // Will show all active by default
      }
      const result = await this.leaveService.getLeaveTypes(filters)

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
  async getLeaveTypeById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params
      const result = await this.leaveService.getLeaveTypeById(id)

      if (result.success) {
        return ResponseHandler.success(res, result.message, {
          leaveType: result.leaveType
        })
      }

      return ResponseHandler.notFound(res, result.message)
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
      const updateData: UpdateLeaveTypeData = req.body
      const userId = req.user?.id!

      // Get current data for audit log
      const currentResult = await this.leaveService.getLeaveTypeById(id)
      const oldValues = currentResult.leaveType

      const result = await this.leaveService.updateLeaveType(id, updateData)

      if (result.success) {
        // Log audit trail
        await auditService.logDataChange(
          userId,
          'leave_type',
          id,
          oldValues || {},
          updateData,
          req.ip,
          req.get('User-Agent')
        )

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
      return ResponseHandler.internalError(res, 'Failed to update leave type')
    }
  }

  // Leave Request Methods
  /**
   * Create a new leave request
   * POST /api/leave/requests
   */
  async createLeaveRequest(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const leaveRequestData: CreateLeaveRequestData = req.body
      const userId = req.user?.id!

      // Set employee ID from authenticated user if not provided
      if (!leaveRequestData.employeeId) {
        leaveRequestData.employeeId = userId
      }

      const result = await this.leaveService.createLeaveRequest(leaveRequestData)

      if (result.success) {
        // Log audit trail
        await auditService.logUserAction(userId, 'create_leave_request', {
          entityType: 'leave_request',
          entityId: result.leaveRequest?.id,
          newValues: leaveRequestData,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        })

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
   * Get leave requests with optional filtering
   * GET /api/leave/requests
   */
  async getLeaveRequests(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id!
      const userRole = req.user?.role

      const filters: LeaveSearchFilters = {
        employeeId: req.query.employeeId as string,
        leaveTypeId: req.query.leaveTypeId as string,
        status: req.query.status as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        search: req.query.search as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
      }

      // If user is not admin/hr/super-admin, only show their own requests
      if (!['admin', 'hr', 'super-admin'].includes(userRole || '')) {
        filters.employeeId = userId
      }

      const result = await this.leaveService.getLeaveRequests(filters)

      if (result.success) {
        return ResponseHandler.success(res, result.message, {
          leaveRequests: result.leaveRequests,
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
      const userId = req.user?.id!
      const userRole = req.user?.role

      const result = await this.leaveService.getLeaveRequestById(id)

      if (result.success) {
        const leaveRequest = result.leaveRequest

        // Check if user has permission to view this request
        if (!['admin', 'hr', 'super-admin'].includes(userRole || '') && leaveRequest?.employeeId !== userId) {
          return ResponseHandler.forbidden(res, 'You can only view your own leave requests')
        }

        return ResponseHandler.success(res, result.message, {
          leaveRequest: result.leaveRequest
        })
      }

      return ResponseHandler.notFound(res, result.message)
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
      const updateData: UpdateLeaveRequestData = req.body
      const userId = req.user?.id!
      const userRole = req.user?.role

      // Get current data for permission check and audit log
      const currentResult = await this.leaveService.getLeaveRequestById(id)
      const oldValues = currentResult.leaveRequest

      if (!oldValues) {
        return ResponseHandler.notFound(res, 'Leave request not found')
      }

      // Check permissions
      const isOwner = oldValues.employeeId === userId
      const isHROrAdmin = ['admin', 'hr', 'super-admin'].includes(userRole || '')

      // Only owner can update their own pending requests, HR/Admin can update any
      if (!isHROrAdmin && (!isOwner || oldValues.status !== 'pending')) {
        return ResponseHandler.forbidden(res, 'You can only update your own pending leave requests')
      }

      // Employees can only update certain fields
      if (!isHROrAdmin && isOwner) {
        const allowedFields = ['startDate', 'endDate', 'reason', 'emergencyContact']
        const updateFields = Object.keys(updateData)
        const invalidFields = updateFields.filter(field => !allowedFields.includes(field))
        
        if (invalidFields.length > 0) {
          return ResponseHandler.forbidden(res, `You can only update: ${allowedFields.join(', ')}`)
        }
      }

      const result = await this.leaveService.updateLeaveRequest(id, updateData)

      if (result.success) {
        // Log audit trail
        await auditService.logDataChange(
          userId,
          'leave_request',
          id,
          oldValues,
          updateData,
          req.ip,
          req.get('User-Agent')
        )

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
      const { approverComments } = req.body
      const userId = req.user?.id!
      const userRole = req.user?.role

      // Check permissions
      if (!['admin', 'hr', 'manager', 'super-admin'].includes(userRole || '')) {
        return ResponseHandler.forbidden(res, 'You do not have permission to approve leave requests')
      }

      const updateData: UpdateLeaveRequestData = {
        status: 'approved',
        approverId: userId,
        approvedAt: new Date().toISOString(),
        approverComments
      }

      // Get current data for audit log
      const currentResult = await this.leaveService.getLeaveRequestById(id)
      const oldValues = currentResult.leaveRequest

      const result = await this.leaveService.updateLeaveRequest(id, updateData)

      if (result.success) {
        // Log audit trail
        await auditService.logUserAction(userId, 'approve_leave_request', {
          entityType: 'leave_request',
          entityId: id,
          oldValues: oldValues || {},
          newValues: updateData,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        })

        return ResponseHandler.success(res, result.message, {
          leaveRequest: result.leaveRequest
        })
      }

      return ResponseHandler.badRequest(res, result.message)
    } catch (error) {
      if (error instanceof NotFoundError) {
        return ResponseHandler.notFound(res, error.message)
      }
      if (error instanceof ConflictError) {
        return ResponseHandler.conflict(res, error.message)
      }
      return ResponseHandler.internalError(res, 'Failed to approve leave request')
    }
  }

  /**
   * Reject leave request
   * POST /api/leave/requests/:id/reject
   */
  async rejectLeaveRequest(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params
      const { approverComments } = req.body
      const userId = req.user?.id!
      const userRole = req.user?.role

      // Check permissions
      if (!['admin', 'hr', 'manager', 'super-admin'].includes(userRole || '')) {
        return ResponseHandler.forbidden(res, 'You do not have permission to reject leave requests')
      }

      if (!approverComments) {
        return ResponseHandler.badRequest(res, 'Rejection reason is required')
      }

      const updateData: UpdateLeaveRequestData = {
        status: 'rejected',
        approverId: userId,
        approvedAt: new Date().toISOString(),
        approverComments
      }

      // Get current data for audit log
      const currentResult = await this.leaveService.getLeaveRequestById(id)
      const oldValues = currentResult.leaveRequest

      const result = await this.leaveService.updateLeaveRequest(id, updateData)

      if (result.success) {
        // Log audit trail
        await auditService.logUserAction(userId, 'reject_leave_request', {
          entityType: 'leave_request',
          entityId: id,
          oldValues: oldValues || {},
          newValues: updateData,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        })

        return ResponseHandler.success(res, result.message, {
          leaveRequest: result.leaveRequest
        })
      }

      return ResponseHandler.badRequest(res, result.message)
    } catch (error) {
      if (error instanceof NotFoundError) {
        return ResponseHandler.notFound(res, error.message)
      }
      if (error instanceof ConflictError) {
        return ResponseHandler.conflict(res, error.message)
      }
      return ResponseHandler.internalError(res, 'Failed to reject leave request')
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
      const userRole = req.user?.role

      // Get current data for permission check
      const currentResult = await this.leaveService.getLeaveRequestById(id)
      const oldValues = currentResult.leaveRequest

      if (!oldValues) {
        return ResponseHandler.notFound(res, 'Leave request not found')
      }

      // Check permissions - only owner or HR/Admin can cancel
      const isOwner = oldValues.employeeId === userId
      const isHROrAdmin = ['admin', 'hr'].includes(userRole || '')

      if (!isOwner && !isHROrAdmin) {
        return ResponseHandler.forbidden(res, 'You can only cancel your own leave requests')
      }

      // Can only cancel pending or approved requests
      if (!['pending', 'approved'].includes(oldValues.status)) {
        return ResponseHandler.badRequest(res, 'Can only cancel pending or approved leave requests')
      }

      const updateData: UpdateLeaveRequestData = {
        status: 'cancelled',
        approverComments: reason || 'Cancelled by user'
      }

      const result = await this.leaveService.updateLeaveRequest(id, updateData)

      if (result.success) {
        // Log audit trail
        await auditService.logUserAction(userId, 'cancel_leave_request', {
          entityType: 'leave_request',
          entityId: id,
          oldValues: oldValues,
          newValues: updateData,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        })

        return ResponseHandler.success(res, result.message, {
          leaveRequest: result.leaveRequest
        })
      }

      return ResponseHandler.badRequest(res, result.message)
    } catch (error) {
      if (error instanceof NotFoundError) {
        return ResponseHandler.notFound(res, error.message)
      }
      return ResponseHandler.internalError(res, 'Failed to cancel leave request')
    }
  }

  // Leave Balance Methods
  /**
   * Get leave balances for an employee
   * GET /api/leave/balances/:employeeId
   */
  async getLeaveBalances(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { employeeId } = req.params
      const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear()
      const userId = req.user?.id!
      const userRole = req.user?.role

      // Check permissions - users can only view their own balances
      if (!['admin', 'hr', 'super-admin'].includes(userRole || '') && employeeId !== userId) {
        return ResponseHandler.forbidden(res, 'You can only view your own leave balances')
      }

      const filters: LeaveSearchFilters = {
        employeeId,
        year
      }
      const result = await this.leaveService.getLeaveBalances(filters)

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
   * Initialize leave balances for an employee
   * POST /api/leave/balances/:employeeId/initialize
   */
  async initializeLeaveBalances(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { employeeId } = req.params
      const year = req.body.year || new Date().getFullYear()
      const userId = req.user?.id!
      const userRole = req.user?.role

      // Check permissions - only HR/Admin/Super-Admin can initialize balances
      if (!['admin', 'hr', 'super-admin'].includes(userRole || '')) {
        return ResponseHandler.forbidden(res, 'You do not have permission to initialize leave balances')
      }

      const result = await this.leaveService.initializeLeaveBalancesForEmployee(employeeId, year)

      if (result.success) {
        // Log audit trail
        await auditService.logUserAction(userId, 'initialize_leave_balances', {
          entityType: 'leave_balance',
          entityId: employeeId,
          newValues: { employeeId, year },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        })

        return ResponseHandler.success(res, result.message, {
          leaveBalances: result.leaveBalances
        })
      }

      return ResponseHandler.badRequest(res, result.message)
    } catch (error) {
      return ResponseHandler.internalError(res, 'Failed to initialize leave balances')
    }
  }

  /**
   * Update leave balance
   * PUT /api/leave/balances/:id
   */
  async updateLeaveBalance(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params
      const { allocated, used, reason } = req.body
      const userId = req.user?.id!
      const userRole = req.user?.role

      // Check permissions - only HR/Admin/Super-Admin can update balances
      if (!['admin', 'hr', 'super-admin'].includes(userRole || '')) {
        return ResponseHandler.forbidden(res, 'You do not have permission to update leave balances')
      }

      if (allocated === undefined && used === undefined) {
        return ResponseHandler.badRequest(res, 'Either allocated or used days must be provided')
      }

      const updateData: any = {}
      if (allocated !== undefined) updateData.allocated = allocated
      if (used !== undefined) updateData.used = used

      const result = await this.leaveService.updateLeaveBalance(id, updateData)

      if (result.success) {
        // Log audit trail
        await auditService.logUserAction(userId, 'update_leave_balance', {
          entityType: 'leave_balance',
          entityId: id,
          newValues: { ...updateData, reason },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        })

        return ResponseHandler.success(res, result.message, {
          leaveBalance: result.leaveBalance
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
      return ResponseHandler.internalError(res, 'Failed to update leave balance')
    }
  }

  /**
   * Get leave analytics
   * GET /api/leave/analytics
   */
  async getLeaveAnalytics(req: Request, res: Response): Promise<Response> {
    try {
      const startDate = req.query.startDate as string
      const endDate = req.query.endDate as string
      const departmentId = req.query.departmentId as string

      const filters: LeaveSearchFilters = {
        startDate,
        endDate
      }

      const result = await this.leaveService.getLeaveRequests(filters)

      if (result.success) {
        const requests = result.leaveRequests || []

        const analytics = {
          totalRequests: requests.length,
          byStatus: {
            pending: requests.filter(r => r.status === 'pending').length,
            approved: requests.filter(r => r.status === 'approved').length,
            rejected: requests.filter(r => r.status === 'rejected').length,
            cancelled: requests.filter(r => r.status === 'cancelled').length
          },
          byLeaveType: requests.reduce((acc: Record<string, number>, request) => {
            const type = request.leaveTypeName || 'Unknown'
            acc[type] = (acc[type] || 0) + 1
            return acc
          }, {}),
          averageDuration: requests.length > 0 ? 
            requests.reduce((sum, r) => sum + (r.totalDays || 0), 0) / requests.length : 0,
          totalDaysRequested: requests.reduce((sum, r) => sum + (r.totalDays || 0), 0),
          approvalRate: requests.length > 0 ? 
            (requests.filter(r => r.status === 'approved').length / requests.length) * 100 : 0
        }

        return ResponseHandler.success(res, 'Leave analytics retrieved successfully', {
          analytics
        })
      }

      return ResponseHandler.badRequest(res, result.message)
    } catch (error) {
      return ResponseHandler.internalError(res, 'Failed to retrieve leave analytics')
    }
  }

  /**
   * Get my leave requests (for authenticated user)
   * GET /api/leave/my-requests
   */
  async getMyLeaveRequests(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id!
      
      const filters: LeaveSearchFilters = {
        employeeId: userId,
        status: req.query.status as string,
        leaveTypeId: req.query.leaveTypeId as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
      }

      const result = await this.leaveService.getLeaveRequests(filters)

      if (result.success) {
        return ResponseHandler.success(res, result.message, {
          leaveRequests: result.leaveRequests,
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
      return ResponseHandler.internalError(res, 'Failed to retrieve your leave requests')
    }
  }

  /**
   * Get my leave balances (for authenticated user)
   * GET /api/leave/my-balances
   */
  async getMyLeaveBalances(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id!
      const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear()

      const result = await this.leaveService.getLeaveBalances({ employeeId: userId, year })

      if (result.success) {
        return ResponseHandler.success(res, result.message, {
          leaveBalances: result.leaveBalances
        })
      }

      return ResponseHandler.badRequest(res, result.message)
    } catch (error) {
      return ResponseHandler.internalError(res, 'Failed to retrieve your leave balances')
    }
  }
}