import { Request, Response } from 'express'
import { ScheduleService } from '../services/schedule.service'
import { EmployeeService } from '../services/employee.service'
import { ResponseHandler } from '../utils/response'
import { ValidationError, NotFoundError, ConflictError } from '../utils/errors'
import { AuthenticatedRequest } from '../middleware/permission'

export class ScheduleController {
  private scheduleService: ScheduleService
  private employeeService: EmployeeService

  constructor() {
    this.scheduleService = new ScheduleService()
    this.employeeService = new EmployeeService()
  }

  // Employee Schedule Methods
  /**
   * Create a new employee schedule
   * POST /api/schedule/employee-schedules
   */
  async createEmployeeSchedule(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const scheduleData = req.body
      const userId = req.user?.id!

      const result = await this.scheduleService.createEmployeeSchedule(scheduleData, userId)

      if (result.success) {
        return ResponseHandler.created(res, result.message, {
          schedule: result.schedule
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
      return ResponseHandler.internalError(res, 'Failed to create employee schedule')
    }
  }

  /**
   * Get all employee schedules
   * GET /api/schedule/employee-schedules
   */
  async getEmployeeSchedules(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { page = 1, limit = 10, employeeId, date, type } = req.query
      const filters = {
        employeeId: employeeId as string,
        date: date as string,
        type: type as string
      }

      const result = await this.scheduleService.getEmployeeSchedules(
        filters,
        parseInt(page as string),
        parseInt(limit as string)
      )

      if (result.success) {
        return ResponseHandler.success(res, result.message, {
          schedules: result.schedules,
          pagination: result.pagination
        })
      }

      return ResponseHandler.badRequest(res, result.message)
    } catch (error) {
      return ResponseHandler.internalError(res, 'Failed to fetch employee schedules')
    }
  }

  /**
   * Get employee schedule by ID
   * GET /api/schedule/employee-schedules/:id
   */
  async getEmployeeScheduleById(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params

      const result = await this.scheduleService.getEmployeeScheduleById(id)

      if (result.success) {
        return ResponseHandler.success(res, result.message, {
          schedule: result.schedule
        })
      }

      return ResponseHandler.notFound(res, result.message)
    } catch (error) {
      if (error instanceof NotFoundError) {
        return ResponseHandler.notFound(res, error.message)
      }
      return ResponseHandler.internalError(res, 'Failed to fetch employee schedule')
    }
  }

  /**
   * Update employee schedule
   * PUT /api/schedule/employee-schedules/:id
   */
  async updateEmployeeSchedule(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params
      const updateData = req.body
      const userId = req.user?.id!

      const result = await this.scheduleService.updateEmployeeSchedule(id, updateData, userId)

      if (result.success) {
        return ResponseHandler.success(res, result.message, {
          schedule: result.schedule
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
      return ResponseHandler.internalError(res, 'Failed to update employee schedule')
    }
  }

  /**
   * Delete employee schedule
   * DELETE /api/schedule/employee-schedules/:id
   */
  async deleteEmployeeSchedule(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params
      const userId = req.user?.id!

      const result = await this.scheduleService.deleteEmployeeSchedule(id, userId)

      if (result.success) {
        return ResponseHandler.success(res, result.message)
      }

      return ResponseHandler.badRequest(res, result.message)
    } catch (error) {
      if (error instanceof NotFoundError) {
        return ResponseHandler.notFound(res, error.message)
      }
      return ResponseHandler.internalError(res, 'Failed to delete employee schedule')
    }
  }

  /**
   * Get schedules for specific employee
   * GET /api/schedule/employees/:employeeId/schedules
   */
  async getSchedulesByEmployee(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { employeeId } = req.params
      const { startDate, endDate, type } = req.query

      const result = await this.scheduleService.getSchedulesByEmployee(
        employeeId,
        startDate as string,
        endDate as string,
        type as string
      )

      if (result.success) {
        return ResponseHandler.success(res, result.message, {
          schedules: result.schedules
        })
      }

      return ResponseHandler.badRequest(res, result.message)
    } catch (error) {
      return ResponseHandler.internalError(res, 'Failed to fetch employee schedules')
    }
  }

  /**
   * Get schedules for date range
   * GET /api/schedule/employee-schedules/date-range
   */
  async getSchedulesByDateRange(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { startDate, endDate, employeeId, type } = req.query

      const result = await this.scheduleService.getSchedulesByDateRange(
        startDate as string,
        endDate as string,
        employeeId as string,
        type as string
      )

      if (result.success) {
        return ResponseHandler.success(res, result.message, {
          schedules: result.schedules
        })
      }

      return ResponseHandler.badRequest(res, result.message)
    } catch (error) {
      return ResponseHandler.internalError(res, 'Failed to fetch schedules by date range')
    }
  }

  // Meeting Methods
  /**
   * Create a new meeting
   * POST /api/schedule/meetings
   */
  async createMeeting(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const meetingData = req.body
      const userId = req.user?.id!

      const result = await this.scheduleService.createMeeting(meetingData, userId)

      if (result.success) {
        return ResponseHandler.created(res, result.message, {
          meeting: result.meeting
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
      return ResponseHandler.internalError(res, 'Failed to create meeting')
    }
  }

  /**
   * Get all meetings
   * GET /api/schedule/meetings
   */
  async getMeetings(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { page = 1, limit = 10, startDate, endDate, meetingType } = req.query
      const filters = {
        startDate: startDate as string,
        endDate: endDate as string,
        meetingType: meetingType as string
      }

      const result = await this.scheduleService.getMeetings(
        filters,
        parseInt(page as string),
        parseInt(limit as string)
      )

      if (result.success) {
        return ResponseHandler.success(res, result.message, {
          meetings: result.meetings,
          pagination: result.pagination
        })
      }

      return ResponseHandler.badRequest(res, result.message)
    } catch (error) {
      return ResponseHandler.internalError(res, 'Failed to fetch meetings')
    }
  }

  /**
   * Get meeting by ID
   * GET /api/schedule/meetings/:id
   */
  async getMeetingById(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params

      const result = await this.scheduleService.getMeetingById(id)

      if (result.success) {
        return ResponseHandler.success(res, result.message, {
          meeting: result.meeting
        })
      }

      return ResponseHandler.notFound(res, result.message)
    } catch (error) {
      if (error instanceof NotFoundError) {
        return ResponseHandler.notFound(res, error.message)
      }
      return ResponseHandler.internalError(res, 'Failed to fetch meeting')
    }
  }

  /**
   * Update meeting
   * PUT /api/schedule/meetings/:id
   */
  async updateMeeting(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params
      const updateData = req.body
      const userId = req.user?.id!

      const result = await this.scheduleService.updateMeeting(id, updateData, userId)

      if (result.success) {
        return ResponseHandler.success(res, result.message, {
          meeting: result.meeting
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
      return ResponseHandler.internalError(res, 'Failed to update meeting')
    }
  }

  /**
   * Delete meeting
   * DELETE /api/schedule/meetings/:id
   */
  async deleteMeeting(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params
      const userId = req.user?.id!

      const result = await this.scheduleService.deleteMeeting(id, userId)

      if (result.success) {
        return ResponseHandler.success(res, result.message)
      }

      return ResponseHandler.badRequest(res, result.message)
    } catch (error) {
      if (error instanceof NotFoundError) {
        return ResponseHandler.notFound(res, error.message)
      }
      return ResponseHandler.internalError(res, 'Failed to delete meeting')
    }
  }

  /**
   * Get meetings for specific employee
   * GET /api/schedule/employees/:employeeId/meetings
   */
  async getMeetingsByEmployee(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { employeeId } = req.params
      const { startDate, endDate, meetingType } = req.query

      const result = await this.scheduleService.getMeetingsByEmployee(
        employeeId,
        startDate as string,
        endDate as string,
        meetingType as string
      )

      if (result.success) {
        return ResponseHandler.success(res, result.message, {
          meetings: result.meetings
        })
      }

      return ResponseHandler.badRequest(res, result.message)
    } catch (error) {
      return ResponseHandler.internalError(res, 'Failed to fetch employee meetings')
    }
  }

  /**
   * Get meetings for date range
   * GET /api/schedule/meetings/date-range
   */
  async getMeetingsByDateRange(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { startDate, endDate, employeeId, meetingType } = req.query

      const result = await this.scheduleService.getMeetingsByDateRange(
        startDate as string,
        endDate as string,
        employeeId as string,
        meetingType as string
      )

      if (result.success) {
        return ResponseHandler.success(res, result.message, {
          meetings: result.meetings
        })
      }

      return ResponseHandler.badRequest(res, result.message)
    } catch (error) {
      return ResponseHandler.internalError(res, 'Failed to fetch meetings by date range')
    }
  }

  // Personal Schedule Methods
  /**
   * Get current user's schedule
   * GET /api/schedule/my-schedule
   */
  async getMySchedule(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id!
      const { startDate, endDate, type } = req.query

      const result = await this.scheduleService.getMySchedule(
        userId,
        startDate as string,
        endDate as string,
        type as string
      )

      if (result.success) {
        return ResponseHandler.success(res, result.message, {
          schedules: result.schedules
        })
      }

      return ResponseHandler.badRequest(res, result.message)
    } catch (error) {
      return ResponseHandler.internalError(res, 'Failed to fetch your schedule')
    }
  }

  /**
   * Get current user's meetings
   * GET /api/schedule/my-meetings
   */
  async getMyMeetings(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id!
      const { startDate, endDate, meetingType } = req.query

      const result = await this.scheduleService.getMyMeetings(
        userId,
        startDate as string,
        endDate as string,
        meetingType as string
      )

      if (result.success) {
        return ResponseHandler.success(res, result.message, {
          meetings: result.meetings
        })
      }

      return ResponseHandler.badRequest(res, result.message)
    } catch (error) {
      return ResponseHandler.internalError(res, 'Failed to fetch your meetings')
    }
  }

  /**
   * Get today's schedule for dashboard
   * GET /api/schedule/today
   */
  async getTodaySchedule(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id!

      const result = await this.scheduleService.getTodaySchedule(userId)

      if (result.success) {
        return ResponseHandler.success(res, result.message, {
          todaySchedule: result.todaySchedule
        })
      }

      return ResponseHandler.badRequest(res, result.message)
    } catch (error) {
      return ResponseHandler.internalError(res, 'Failed to fetch today\'s schedule')
    }
  }

  /**
   * Get calendar view for specific month
   * GET /api/schedule/calendar/:year/:month
   */
  async getCalendarView(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { year, month } = req.params
      const { employeeId } = req.query

      const result = await this.scheduleService.getCalendarView(
        parseInt(year),
        parseInt(month),
        employeeId as string
      )

      if (result.success) {
        return ResponseHandler.success(res, result.message, {
          calendar: result.calendar
        })
      }

      return ResponseHandler.badRequest(res, result.message)
    } catch (error) {
      return ResponseHandler.internalError(res, 'Failed to fetch calendar view')
    }
  }

  /**
   * Check for schedule conflicts
   * POST /api/schedule/check-conflicts
   */
  async checkScheduleConflicts(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { employeeId, startTime, endTime, excludeId } = req.body

      const result = await this.scheduleService.checkScheduleConflicts(
        employeeId,
        startTime,
        endTime,
        excludeId
      )

      if (result.success) {
        return ResponseHandler.success(res, result.message, {
          conflicts: result.conflicts,
          hasConflicts: result.hasConflicts
        })
      }

      return ResponseHandler.badRequest(res, result.message)
    } catch (error) {
      return ResponseHandler.internalError(res, 'Failed to check schedule conflicts')
    }
  }
}