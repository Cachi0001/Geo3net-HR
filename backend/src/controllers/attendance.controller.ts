import { Response } from 'express'
import { attendanceService, CheckInData, CheckOutData } from '../services/attendance.service'
import { ResponseHandler } from '../utils/response'
import { AuthenticatedRequest } from '../middleware/permission'
import { ValidationError, ConflictError, AuthorizationError, NotFoundError } from '../utils/errors'

export class AttendanceController {
  /**
   * Check in employee
   */
  async checkIn(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id
      if (!userId) {
        return ResponseHandler.forbidden(res, 'Authentication required')
      }

      const checkInData: CheckInData = req.body

      console.log('📥 [AttendanceController] Processing check-in for employee:', checkInData.employeeId)

      const result = await attendanceService.checkIn(checkInData, userId)

      if (!result.success) {
        return ResponseHandler.badRequest(res, result.message)
      }

      return ResponseHandler.success(res, result.message, result.session)
    } catch (error: any) {
      console.error('❌ [AttendanceController] Check-in error:', error)

      if (error instanceof ValidationError) {
        return ResponseHandler.badRequest(res, error.message)
      }

      if (error instanceof ConflictError) {
        return ResponseHandler.conflict(res, error.message)
      }

      if (error instanceof AuthorizationError) {
        return ResponseHandler.forbidden(res, error.message)
      }

      if (error instanceof NotFoundError) {
        return ResponseHandler.notFound(res, error.message)
      }

      return ResponseHandler.internalError(res, 'Failed to process check-in')
    }
  }

  /**
   * Check out employee
   */
  async checkOut(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id
      if (!userId) {
        return ResponseHandler.forbidden(res, 'Authentication required')
      }

      const checkOutData: CheckOutData = req.body

      console.log('📥 [AttendanceController] Processing check-out for employee:', checkOutData.employeeId)

      const result = await attendanceService.checkOut(checkOutData, userId)

      if (!result.success) {
        return ResponseHandler.badRequest(res, result.message)
      }

      return ResponseHandler.success(res, result.message, result.session)
    } catch (error: any) {
      console.error('❌ [AttendanceController] Check-out error:', error)

      if (error instanceof ValidationError) {
        return ResponseHandler.badRequest(res, error.message)
      }

      if (error instanceof ConflictError) {
        return ResponseHandler.conflict(res, error.message)
      }

      if (error instanceof AuthorizationError) {
        return ResponseHandler.forbidden(res, error.message)
      }

      if (error instanceof NotFoundError) {
        return ResponseHandler.notFound(res, error.message)
      }

      return ResponseHandler.internalError(res, 'Failed to process check-out')
    }
  }

  /**
   * Start break
   */
  async startBreak(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id
      if (!userId) {
        return ResponseHandler.forbidden(res, 'Authentication required')
      }

      const { employeeId } = req.body

      console.log('📥 [AttendanceController] Starting break for employee:', employeeId)

      const result = await attendanceService.startBreak(employeeId, userId)

      if (!result.success) {
        return ResponseHandler.badRequest(res, result.message)
      }

      return ResponseHandler.success(res, result.message, result.session)
    } catch (error: any) {
      console.error('❌ [AttendanceController] Start break error:', error)

      if (error instanceof ValidationError) {
        return ResponseHandler.badRequest(res, error.message)
      }

      if (error instanceof ConflictError) {
        return ResponseHandler.conflict(res, error.message)
      }

      if (error instanceof NotFoundError) {
        return ResponseHandler.notFound(res, error.message)
      }

      return ResponseHandler.internalError(res, 'Failed to start break')
    }
  }

  /**
   * End break
   */
  async endBreak(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id
      if (!userId) {
        return ResponseHandler.forbidden(res, 'Authentication required')
      }

      const { employeeId } = req.body

      console.log('📥 [AttendanceController] Ending break for employee:', employeeId)

      const result = await attendanceService.endBreak(employeeId, userId)

      if (!result.success) {
        return ResponseHandler.badRequest(res, result.message)
      }

      return ResponseHandler.success(res, result.message, result.session)
    } catch (error: any) {
      console.error('❌ [AttendanceController] End break error:', error)

      if (error instanceof ValidationError) {
        return ResponseHandler.badRequest(res, error.message)
      }

      if (error instanceof ConflictError) {
        return ResponseHandler.conflict(res, error.message)
      }

      if (error instanceof NotFoundError) {
        return ResponseHandler.notFound(res, error.message)
      }

      return ResponseHandler.internalError(res, 'Failed to end break')
    }
  }

  /**
   * Get attendance sessions
   */
  async getAttendanceSessions(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id
      if (!userId) {
        return ResponseHandler.forbidden(res, 'Authentication required')
      }

      const filters = {
        employeeId: req.query.employeeId as string,
        dateFrom: req.query.dateFrom as string,
        dateTo: req.query.dateTo as string,
        status: req.query.status as string,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined
      }

      console.log('📥 [AttendanceController] Getting attendance sessions with filters:', filters)

      const result = await attendanceService.getAttendanceSessions(filters, userId)

      if (!result.success) {
        return ResponseHandler.badRequest(res, result.message)
      }

      return ResponseHandler.success(res, result.message, {
        sessions: result.sessions,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: Math.ceil((result.total || 0) / (result.limit || 20))
        }
      })
    } catch (error: any) {
      console.error('❌ [AttendanceController] Get attendance sessions error:', error)

      if (error instanceof AuthorizationError) {
        return ResponseHandler.forbidden(res, error.message)
      }

      return ResponseHandler.internalError(res, 'Failed to get attendance sessions')
    }
  }

  /**
   * Get live attendance dashboard
   */
  async getLiveAttendanceDashboard(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id
      if (!userId) {
        return ResponseHandler.forbidden(res, 'Authentication required')
      }

      console.log('📥 [AttendanceController] Getting live attendance dashboard')

      const result = await attendanceService.getLiveAttendanceDashboard(userId)

      if (!result.success) {
        return ResponseHandler.badRequest(res, result.message)
      }

      return ResponseHandler.success(res, result.message, result.data)
    } catch (error: any) {
      console.error('❌ [AttendanceController] Get live dashboard error:', error)

      if (error instanceof AuthorizationError) {
        return ResponseHandler.forbidden(res, error.message)
      }

      return ResponseHandler.internalError(res, 'Failed to get live attendance dashboard')
    }
  }

  /**
   * Get attendance violations
   */
  async getAttendanceViolations(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id
      if (!userId) {
        return ResponseHandler.forbidden(res, 'Authentication required')
      }

      const filters = {
        employeeId: req.query.employeeId as string,
        violationType: req.query.violationType as string,
        severity: req.query.severity as string,
        resolved: req.query.resolved ? req.query.resolved === 'true' : undefined,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined
      }

      console.log('📥 [AttendanceController] Getting attendance violations with filters:', filters)

      const result = await attendanceService.getAttendanceViolations(filters, userId)

      if (!result.success) {
        return ResponseHandler.badRequest(res, result.message)
      }

      return ResponseHandler.success(res, result.message, {
        violations: result.violations,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: Math.ceil((result.total || 0) / (result.limit || 20))
        }
      })
    } catch (error: any) {
      console.error('❌ [AttendanceController] Get violations error:', error)

      if (error instanceof AuthorizationError) {
        return ResponseHandler.forbidden(res, error.message)
      }

      return ResponseHandler.internalError(res, 'Failed to get attendance violations')
    }
  }

  /**
   * Resolve attendance violation
   */
  async resolveViolation(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id
      if (!userId) {
        return ResponseHandler.forbidden(res, 'Authentication required')
      }

      const { id } = req.params
      const { resolutionNotes } = req.body

      console.log('📥 [AttendanceController] Resolving violation:', id)

      const result = await attendanceService.resolveViolation(id, resolutionNotes, userId)

      if (!result.success) {
        return ResponseHandler.badRequest(res, result.message)
      }

      return ResponseHandler.success(res, result.message, result.violations?.[0])
    } catch (error: any) {
      console.error('❌ [AttendanceController] Resolve violation error:', error)

      if (error instanceof AuthorizationError) {
        return ResponseHandler.forbidden(res, error.message)
      }

      return ResponseHandler.internalError(res, 'Failed to resolve violation')
    }
  }

  /**
   * Get employee's current attendance status
   */
  async getCurrentStatus(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id
      if (!userId) {
        return ResponseHandler.forbidden(res, 'Authentication required')
      }

      const { employeeId } = req.params
      const today = new Date().toISOString().split('T')[0]

      console.log('📥 [AttendanceController] Getting current status for employee:', employeeId)

      // Get today's session for the employee
      const result = await attendanceService.getAttendanceSessions(
        { employeeId, dateFrom: today, dateTo: today, limit: 1 },
        userId
      )

      if (!result.success) {
        return ResponseHandler.badRequest(res, result.message)
      }

      const currentSession = result.sessions?.[0]
      const status = {
        employeeId,
        date: today,
        session: currentSession || null,
        isCheckedIn: currentSession?.status === 'checked_in' || currentSession?.status === 'on_break',
        isOnBreak: currentSession?.status === 'on_break',
        canCheckIn: !currentSession || currentSession.status === 'checked_out',
        canCheckOut: currentSession?.status === 'checked_in' || currentSession?.status === 'on_break',
        canStartBreak: currentSession?.status === 'checked_in',
        canEndBreak: currentSession?.status === 'on_break'
      }

      return ResponseHandler.success(res, 'Current attendance status retrieved successfully', status)
    } catch (error: any) {
      console.error('❌ [AttendanceController] Get current status error:', error)

      if (error instanceof AuthorizationError) {
        return ResponseHandler.forbidden(res, error.message)
      }

      return ResponseHandler.internalError(res, 'Failed to get current attendance status')
    }
  }

  /**
   * Get attendance statistics
   */
  async getAttendanceStatistics(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id
      if (!userId) {
        return ResponseHandler.forbidden(res, 'Authentication required')
      }

      const { dateFrom, dateTo } = req.query

      console.log('📥 [AttendanceController] Getting attendance statistics')

      // Get basic statistics from the live dashboard
      const dashboardResult = await attendanceService.getLiveAttendanceDashboard(userId)

      if (!dashboardResult.success) {
        return ResponseHandler.badRequest(res, dashboardResult.message)
      }

      return ResponseHandler.success(res, 'Attendance statistics retrieved successfully', dashboardResult.data.statistics)
    } catch (error: any) {
      console.error('❌ [AttendanceController] Get statistics error:', error)

      if (error instanceof AuthorizationError) {
        return ResponseHandler.forbidden(res, error.message)
      }

      return ResponseHandler.internalError(res, 'Failed to get attendance statistics')
    }
  }
}

export const attendanceController = new AttendanceController()