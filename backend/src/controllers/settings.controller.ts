import { Request, Response } from 'express'
import { SettingsService } from '../services/settings.service'
import { ResponseHandler } from '../utils/response'
import { ValidationError, NotFoundError, ConflictError } from '../utils/errors'
import { AuthenticatedRequest } from '../middleware/permission'

export class SettingsController {
  private settingsService: SettingsService

  constructor() {
    this.settingsService = new SettingsService()
  }


  async createLocation(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const {
        name,
        address,
        latitude,
        longitude,
        radius,
        isActive = true,
        description
      } = req.body

      // Validate required fields
      if (!name || !address || !latitude || !longitude || !radius) {
        return ResponseHandler.badRequest(res, 'Name, address, latitude, longitude, and radius are required')
      }

      // Validate coordinates
      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        return ResponseHandler.badRequest(res, 'Invalid coordinates')
      }

      // Validate radius (in meters)
      if (radius < 10 || radius > 10000) {
        return ResponseHandler.badRequest(res, 'Radius must be between 10 and 10000 meters')
      }

      const location = await this.settingsService.createLocation({
        name,
        address,
        latitude,
        longitude,
        radius_meters: radius,
        is_default: false, // New locations are not default by default
        is_active: isActive,
        timezone: 'UTC', // Default timezone
        created_by: req.user!.id
      })

      return ResponseHandler.created(res, 'Location created successfully', location)
    } catch (error) {
      if (error instanceof ValidationError) {
        return ResponseHandler.badRequest(res, error.message)
      }
      if (error instanceof ConflictError) {
        return ResponseHandler.conflict(res, error.message)
      }
      return ResponseHandler.internalError(res, 'Failed to create location')
    }
  }

  async getLocations(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { page = 1, limit = 10, isActive } = req.query
      
      const filters = {
        isActive: isActive !== undefined ? isActive === 'true' : undefined
      }

      const result = await this.settingsService.getLocations(
        parseInt(page as string),
        parseInt(limit as string),
        filters
      )

      return ResponseHandler.success(res, 'Locations retrieved successfully', result)
    } catch (error) {
      return ResponseHandler.internalError(res, 'Failed to retrieve locations')
    }
  }

  async getLocationById(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params
      const location = await this.settingsService.getLocationById(id)

      if (!location) {
        return ResponseHandler.notFound(res, 'Location not found')
      }

      return ResponseHandler.success(res, 'Location retrieved successfully', location)
    } catch (error) {
      return ResponseHandler.internalError(res, 'Failed to retrieve location')
    }
  }

  async updateLocation(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params
      const updateData = req.body

      // Validate coordinates if provided
      if (updateData.latitude && (updateData.latitude < -90 || updateData.latitude > 90)) {
        return ResponseHandler.badRequest(res, 'Invalid latitude')
      }
      if (updateData.longitude && (updateData.longitude < -180 || updateData.longitude > 180)) {
        return ResponseHandler.badRequest(res, 'Invalid longitude')
      }

      // Validate radius if provided
      if (updateData.radius && (updateData.radius < 10 || updateData.radius > 10000)) {
        return ResponseHandler.badRequest(res, 'Radius must be between 10 and 10000 meters')
      }

      const location = await this.settingsService.updateLocation(id, {
        ...updateData,
        updatedBy: req.user!.id
      })

      if (!location) {
        return ResponseHandler.notFound(res, 'Location not found')
      }

      return ResponseHandler.success(res, 'Location updated successfully', location)
    } catch (error) {
      if (error instanceof ValidationError) {
        return ResponseHandler.badRequest(res, error.message)
      }
      return ResponseHandler.internalError(res, 'Failed to update location')
    }
  }

  async deleteLocation(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params
      const success = await this.settingsService.deleteLocation(id)

      if (!success) {
        return ResponseHandler.notFound(res, 'Location not found')
      }

      return ResponseHandler.success(res, 'Location deleted successfully')
    } catch (error) {
      if (error instanceof ConflictError) {
        return ResponseHandler.conflict(res, error.message)
      }
      return ResponseHandler.internalError(res, 'Failed to delete location')
    }
  }

  async setDefaultLocation(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params
      const success = await this.settingsService.setDefaultLocation(id)

      if (!success) {
        return ResponseHandler.notFound(res, 'Location not found')
      }

      return ResponseHandler.success(res, 'Default location set successfully')
    } catch (error) {
      return ResponseHandler.internalError(res, 'Failed to set default location')
    }
  }

  /**
   * Attendance Policy Methods
   */

  async createAttendancePolicy(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const {
        name,
        work_hours_start,
        work_hours_end,
        break_duration_minutes,
        late_arrival_threshold_minutes,
        overtime_threshold_minutes,
        require_location_verification,
        allow_early_checkin_minutes,
        allow_late_checkout_minutes,
        is_active = true
      } = req.body

      // Validate required fields
      if (!name || !work_hours_start || !work_hours_end) {
        return ResponseHandler.badRequest(res, 'Name, work hours start, and work hours end are required')
      }

      const policy = await this.settingsService.createAttendancePolicy({
        name,
        work_hours_start,
        work_hours_end,
        break_duration_minutes: break_duration_minutes || 60, // Default 1 hour
        late_arrival_threshold_minutes: late_arrival_threshold_minutes || 15, // Default 15 minutes
        overtime_threshold_minutes: overtime_threshold_minutes || 480, // Default 8 hours
        require_location_verification: require_location_verification || true,
        allow_early_checkin_minutes: allow_early_checkin_minutes || 30,
        allow_late_checkout_minutes: allow_late_checkout_minutes || 30,
        is_default: false,
        is_active,
        created_by: req.user!.id
      })

      return ResponseHandler.created(res, 'Attendance policy created successfully', policy)
    } catch (error) {
      if (error instanceof ValidationError) {
        return ResponseHandler.badRequest(res, error.message)
      }
      return ResponseHandler.internalError(res, 'Failed to create attendance policy')
    }
  }

  async getAttendancePolicies(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { page = 1, limit = 10, isActive } = req.query
      
      const filters = {
        isActive: isActive !== undefined ? isActive === 'true' : undefined
      }

      const result = await this.settingsService.getAttendancePolicies(
        parseInt(page as string),
        parseInt(limit as string),
        filters
      )

      return ResponseHandler.success(res, 'Attendance policies retrieved successfully', result)
    } catch (error) {
      return ResponseHandler.internalError(res, 'Failed to retrieve attendance policies')
    }
  }

  async getAttendancePolicyById(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params
      const policy = await this.settingsService.getAttendancePolicyById(id)

      if (!policy) {
        return ResponseHandler.notFound(res, 'Attendance policy not found')
      }

      return ResponseHandler.success(res, 'Attendance policy retrieved successfully', policy)
    } catch (error) {
      return ResponseHandler.internalError(res, 'Failed to retrieve attendance policy')
    }
  }

  async updateAttendancePolicy(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params
      const updateData = req.body

      const policy = await this.settingsService.updateAttendancePolicy(id, {
        ...updateData,
        updatedBy: req.user!.id
      })

      if (!policy) {
        return ResponseHandler.notFound(res, 'Attendance policy not found')
      }

      return ResponseHandler.success(res, 'Attendance policy updated successfully', policy)
    } catch (error) {
      if (error instanceof ValidationError) {
        return ResponseHandler.badRequest(res, error.message)
      }
      return ResponseHandler.internalError(res, 'Failed to update attendance policy')
    }
  }

  async deleteAttendancePolicy(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params
      const success = await this.settingsService.deleteAttendancePolicy(id)

      if (!success) {
        return ResponseHandler.notFound(res, 'Attendance policy not found')
      }

      return ResponseHandler.success(res, 'Attendance policy deleted successfully')
    } catch (error) {
      if (error instanceof ConflictError) {
        return ResponseHandler.conflict(res, error.message)
      }
      return ResponseHandler.internalError(res, 'Failed to delete attendance policy')
    }
  }

  async setDefaultAttendancePolicy(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params
      const success = await this.settingsService.setDefaultAttendancePolicy(id)

      if (!success) {
        return ResponseHandler.notFound(res, 'Attendance policy not found')
      }

      return ResponseHandler.success(res, 'Default attendance policy set successfully')
    } catch (error) {
      return ResponseHandler.internalError(res, 'Failed to set default attendance policy')
    }
  }

  /**
   * Check-in Settings Methods
   */

  async getCheckinSettings(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const settings = await this.settingsService.getCheckinSettings()
      return ResponseHandler.success(res, 'Check-in settings retrieved successfully', settings)
    } catch (error) {
      return ResponseHandler.internalError(res, 'Failed to retrieve check-in settings')
    }
  }

  async updateCheckinSettings(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const settings = await this.settingsService.updateCheckinSettings({
        ...req.body,
        updatedBy: req.user!.id
      })

      return ResponseHandler.success(res, 'Check-in settings updated successfully', settings)
    } catch (error) {
      if (error instanceof ValidationError) {
        return ResponseHandler.badRequest(res, error.message)
      }
      return ResponseHandler.internalError(res, 'Failed to update check-in settings')
    }
  }

  /**
   * Notification Settings Methods
   */

  async getNotificationSettings(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const settings = await this.settingsService.getNotificationSettings()
      return ResponseHandler.success(res, 'Notification settings retrieved successfully', settings)
    } catch (error) {
      return ResponseHandler.internalError(res, 'Failed to retrieve notification settings')
    }
  }

  async updateNotificationSettings(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const settings = await this.settingsService.updateNotificationSettings({
        ...req.body,
        updatedBy: req.user!.id
      })

      return ResponseHandler.success(res, 'Notification settings updated successfully', settings)
    } catch (error) {
      if (error instanceof ValidationError) {
        return ResponseHandler.badRequest(res, error.message)
      }
      return ResponseHandler.internalError(res, 'Failed to update notification settings')
    }
  }

  /**
   * System Configuration Methods
   */

  async getSystemConfig(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const config = await this.settingsService.getSystemConfig()
      return ResponseHandler.success(res, 'System configuration retrieved successfully', config)
    } catch (error) {
      return ResponseHandler.internalError(res, 'Failed to retrieve system configuration')
    }
  }

  async updateSystemConfig(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const config = await this.settingsService.updateSystemConfig({
        ...req.body,
        updatedBy: req.user!.id
      })

      return ResponseHandler.success(res, 'System configuration updated successfully', config)
    } catch (error) {
      if (error instanceof ValidationError) {
        return ResponseHandler.badRequest(res, error.message)
      }
      return ResponseHandler.internalError(res, 'Failed to update system configuration')
    }
  }

  /**
   * Attendance Dashboard Methods
   */

  async getAttendanceDashboard(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { date } = req.query
      const dashboard = await this.settingsService.getAttendanceDashboard(date as string)
      return ResponseHandler.success(res, 'Attendance dashboard retrieved successfully', dashboard)
    } catch (error) {
      return ResponseHandler.internalError(res, 'Failed to retrieve attendance dashboard')
    }
  }

  async getAttendanceAnalytics(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { startDate, endDate, departmentId } = req.query
      const analytics = await this.settingsService.getAttendanceAnalytics({
        startDate: startDate as string,
        endDate: endDate as string,
        departmentId: departmentId as string
      })
      return ResponseHandler.success(res, 'Attendance analytics retrieved successfully', analytics)
    } catch (error) {
      return ResponseHandler.internalError(res, 'Failed to retrieve attendance analytics')
    }
  }

  async getRealTimeAttendanceStatus(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const status = await this.settingsService.getRealTimeAttendanceStatus()
      return ResponseHandler.success(res, 'Real-time attendance status retrieved successfully', status)
    } catch (error) {
      return ResponseHandler.internalError(res, 'Failed to retrieve real-time attendance status')
    }
  }
}