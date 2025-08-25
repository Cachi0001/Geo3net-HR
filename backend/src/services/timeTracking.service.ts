import { supabase } from '../config/database'
import { ConflictError, NotFoundError, ValidationError } from '../utils/errors'

export interface Location {
  latitude: number
  longitude: number
  accuracy?: number
  address?: string
  timestamp?: string
  source?: 'gps' | 'network' | 'passive'
}

export interface CheckInData {
  employeeId: string
  location?: Location
  notes?: string
  deviceInfo?: string
}

export interface CheckOutData {
  location?: Location
  notes?: string
  deviceInfo?: string
}

export interface TimeEntry {
  id: string
  employeeId: string
  checkInTime: string
  checkOutTime?: string
  checkInLocation?: Location
  checkOutLocation?: Location
  locationStatus?: string
  totalHours?: number
  status: 'checked_in' | 'checked_out' | 'break' | 'overtime'
  notes?: string
  deviceInfo?: string
  createdAt: string
  updatedAt: string
}

export interface AttendanceRecord {
  employeeId: string
  date: string
  checkInTime?: string
  checkOutTime?: string
  totalHours: number
  regularHours: number
  overtimeHours: number
  breakTime: number
  status: 'present' | 'absent' | 'partial' | 'late' | 'early_leave'
  lateMinutes: number
  earlyLeaveMinutes: number
}

export interface WorkHoursSummary {
  employeeId: string
  period: string
  totalHours: number
  regularHours: number
  overtimeHours: number
  totalDays: number
  presentDays: number
  absentDays: number
  lateDays: number
  averageHoursPerDay: number
}

export interface TimeTrackingResult {
  success: boolean
  message: string
  timeEntry?: TimeEntry
  attendanceRecord?: AttendanceRecord
  summary?: WorkHoursSummary
  data?: any
}

export class TimeTrackingService {
  private readonly STANDARD_WORK_HOURS = 8
  private readonly OVERTIME_THRESHOLD = 8
  private readonly LATE_THRESHOLD_MINUTES = 15
  private readonly EARLY_LEAVE_THRESHOLD_MINUTES = 30
  private readonly MAX_LOCATION_DISTANCE_METERS = 100 // Maximum distance from office location
  

  // Office location (configurable)
  private readonly OFFICE_LOCATION: Location = {
    latitude: parseFloat(process.env.OFFICE_LATITUDE || '0'),
    longitude: parseFloat(process.env.OFFICE_LONGITUDE || '0')
  }

  async checkIn(data: CheckInData): Promise<TimeTrackingResult> {
    try {
      const { employeeId, location, notes, deviceInfo } = data
      console.log(`[TimeTracking] Check-in attempt for employee: ${employeeId}`, {
        hasLocation: !!location,
        deviceInfo: deviceInfo || 'not provided',
        timestamp: new Date().toISOString()
      })

      // Check if employee already has an active check-in
      const activeEntry = await this.getActiveTimeEntry(employeeId)
      if (activeEntry) {
        console.log(`[TimeTracking] Check-in failed - employee already checked in: ${employeeId}`, {
          activeEntryId: activeEntry.id,
          activeCheckInTime: activeEntry.checkInTime
        })
        throw new ConflictError('Employee is already checked in')
      }

      let locationStatus = 'not_provided'
      let locationValidationMessage = ''

      // Handle location validation with real-world scenarios
      if (location) {
        console.log(`[TimeTracking] Validating location for employee: ${employeeId}`, {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy
        })
        
        const locationValidation = this.validateLocationData(location)
        locationStatus = locationValidation.status
        locationValidationMessage = locationValidation.message
        
        console.log(`[TimeTracking] Location validation result for employee: ${employeeId}`, {
          status: locationStatus,
          message: locationValidationMessage,
          requireOfficeLocation: process.env.REQUIRE_OFFICE_LOCATION
        })

        // If location is required and validation fails, reject check-in
        if (process.env.REQUIRE_OFFICE_LOCATION === 'true' && locationStatus === 'invalid') {
          console.log(`[TimeTracking] Check-in rejected - invalid location: ${employeeId}`, {
            validationMessage: locationValidationMessage
          })
          throw new ValidationError(locationValidationMessage)
        }

        // If location is required but remote, reject check-in
        if (process.env.REQUIRE_OFFICE_LOCATION === 'true' && locationStatus === 'remote') {
          console.log(`[TimeTracking] Check-in rejected - remote location: ${employeeId}`, {
            validationMessage: locationValidationMessage
          })
          throw new ValidationError(locationValidationMessage)
        }

        // If location is required but not accurate enough, allow with warning
        if (process.env.REQUIRE_OFFICE_LOCATION === 'true' && locationStatus === 'low_accuracy') {
          locationValidationMessage = 'Check-in allowed but location accuracy is low'
          console.log(`[TimeTracking] Check-in allowed with warning - low accuracy: ${employeeId}`, {
            validationMessage: locationValidationMessage
          })
        }
      } else if (process.env.REQUIRE_OFFICE_LOCATION === 'true') {
        // Location is required but not provided
        throw new ValidationError('Location is required for check-in. Please enable GPS and try again.')
      }

      const checkInTime = new Date().toISOString()

      // Create time entry with location status
      console.log(`[TimeTracking] Creating time tracking entry for employee: ${employeeId}`, {
        checkInTime: checkInTime,
        hasLocation: !!location,
        locationStatus,
        hasNotes: !!notes,
        hasDeviceInfo: !!deviceInfo
      })
      
      const { data: timeEntry, error } = await supabase
        .from('time_entries')
        .insert({
          employee_id: employeeId,
          check_in_time: checkInTime,
          check_in_location: location,
          location_status: locationStatus,
          status: 'checked_in',
          notes: notes ? `${notes}${locationValidationMessage ? ` | Location: ${locationValidationMessage}` : ''}` : locationValidationMessage,
          device_info: deviceInfo
        })
        .select()
        .single()

      if (error) {
        console.error(`[TimeTracking] Failed to create time tracking entry for employee: ${employeeId}`, {
          error: error,
          errorMessage: error.message
        })
        throw error
      }
      
      console.log(`[TimeTracking] Successfully created time tracking entry for employee: ${employeeId}`, {
        entryId: timeEntry.id,
        checkInTime: timeEntry.check_in_time
      })

      const mappedEntry = this.mapDatabaseToTimeEntry(timeEntry)

      // Create or update attendance record immediately on check-in
      await this.createOrUpdateAttendanceRecord(employeeId, mappedEntry)

      console.log(`[TimeTracking] Check-in completed successfully for employee: ${employeeId}`, {
        entryId: mappedEntry.id,
        checkInTime: mappedEntry.checkInTime,
        locationStatus: mappedEntry.locationStatus,
        message: locationValidationMessage || 'Check-in successful'
      })

      return {
        success: true,
        message: locationValidationMessage || 'Check-in successful',
        timeEntry: mappedEntry
      }
    } catch (error) {
      console.error(`[TimeTracking] Check-in error for employee: ${data.employeeId}`, {
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        stack: error instanceof Error ? error.stack : 'No stack trace available',
        timestamp: new Date().toISOString(),
        hasLocation: !!data.location,
        deviceInfo: data.deviceInfo || 'not provided'
      })
      if (error instanceof ConflictError || error instanceof ValidationError) {
        throw error
      }
      throw new Error('Failed to check in')
    }
  }

  async checkOut(employeeId: string, data: CheckOutData): Promise<TimeTrackingResult> {
    try {
      const { location, notes, deviceInfo } = data
      console.log(`[TimeTracking] Check-out attempt for employee: ${employeeId}`, {
        hasLocation: !!location,
        deviceInfo: deviceInfo || 'not provided',
        timestamp: new Date().toISOString()
      })

      // Get active time entry
      const activeEntry = await this.getActiveTimeEntry(employeeId)
      if (!activeEntry) {
        console.log(`[TimeTracking] Check-out failed - no active check-in found for employee: ${employeeId}`)
        throw new NotFoundError('No active check-in found for employee')
      }
      
      console.log(`[TimeTracking] Found active entry for employee: ${employeeId}`, {
        entryId: activeEntry.id,
        checkInTime: activeEntry.checkInTime
      })

      // Validate location if provided
      let locationStatus = 'not_provided'
      let locationValidationMessage = ''
      
      if (location) {
        console.log(`[TimeTracking] Validating check-out location for employee: ${employeeId}`, {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy
        })
        
        if (!this.isValidCoordinates(location)) {
          throw new ValidationError('Invalid location coordinates')
        }
        
        const locationValidation = this.validateLocationData(location)
        locationStatus = locationValidation.status
        locationValidationMessage = locationValidation.message
        
        console.log(`[TimeTracking] Check-out location validation result for employee: ${employeeId}`, {
          status: locationStatus,
          message: locationValidationMessage
        })
      }

      const checkOutTime = new Date().toISOString()
      const totalHours = this.calculateHours(activeEntry.checkInTime, checkOutTime)
      
      console.log(`[TimeTracking] Calculating work duration for employee: ${employeeId}`, {
        checkInTime: activeEntry.checkInTime,
        checkOutTime: checkOutTime,
        totalHours: totalHours
      })

      // Update time entry
      console.log(`[TimeTracking] Updating time tracking entry for check-out: ${employeeId}`, {
        entryId: activeEntry.id,
        checkOutTime: checkOutTime,
        hasLocation: !!location,
        locationStatus
      })
      
      const { data: updatedEntry, error } = await supabase
        .from('time_entries')
        .update({
          check_out_time: checkOutTime,
          check_out_location: location,
          total_hours: totalHours,
          status: 'checked_out',
          notes: notes || activeEntry.notes,
          device_info: deviceInfo || activeEntry.deviceInfo,
          updated_at: checkOutTime
        })
        .eq('id', activeEntry.id)
        .select()
        .single()

      if (error) {
        console.error(`[TimeTracking] Failed to update time tracking entry for employee: ${employeeId}`, {
          error: error,
          errorMessage: error.message,
          entryId: activeEntry.id
        })
        throw error
      }
      
      console.log(`[TimeTracking] Successfully updated time tracking entry for employee: ${employeeId}`, {
        entryId: updatedEntry.id,
        checkOutTime: updatedEntry.check_out_time,
        totalHours: updatedEntry.total_hours
      })

      const mappedEntry = this.mapDatabaseToTimeEntry(updatedEntry)

      // Create or update attendance record
      await this.createOrUpdateAttendanceRecord(employeeId, mappedEntry)
      
      console.log(`[TimeTracking] Check-out completed successfully for employee: ${employeeId}`, {
        entryId: mappedEntry.id,
        checkInTime: mappedEntry.checkInTime,
        checkOutTime: mappedEntry.checkOutTime,
        totalHours: mappedEntry.totalHours,
        locationStatus: mappedEntry.locationStatus
      })

      return {
        success: true,
        message: 'Check-out successful',
        timeEntry: mappedEntry
      }
    } catch (error) {
      console.error(`[TimeTracking] Check-out error for employee: ${employeeId}`, {
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        stack: error instanceof Error ? error.stack : 'No stack trace available',
        timestamp: new Date().toISOString()
      })
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error
      }
      throw new Error('Failed to check out')
    }
  }

  async getStatus(employeeId: string){
    
  }
  async getActiveTimeEntry(employeeId: string): Promise<TimeEntry | null> {
    try {
      const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('status', 'checked_in')
        .order('check_in_time', { ascending: false })
        .limit(1)
        .single()

      if (error || !data) return null

      return this.mapDatabaseToTimeEntry(data)
    } catch (error) {
      return null
    }
  }

  async getTimeEntries(employeeId: string, startDate?: string, endDate?: string): Promise<TimeEntry[]> {
    try {
      let query = supabase
        .from('time_entries')
        .select('*')
        .eq('employee_id', employeeId)
        .order('check_in_time', { ascending: false })

      if (startDate) {
        query = query.gte('check_in_time', startDate)
      }

      if (endDate) {
        query = query.lte('check_in_time', endDate)
      }

      const { data, error } = await query

      if (error) throw error

      return data?.map(entry => this.mapDatabaseToTimeEntry(entry)) || []
    } catch (error) {
      return []
    }
  }

  async getAttendanceRecord(employeeId: string, date: string): Promise<AttendanceRecord | null> {
    try {
      const { data, error } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('date', date)
        .single()

      if (error || !data) return null

      return this.mapDatabaseToAttendanceRecord(data)
    } catch (error) {
      return null
    }
  }

  async getAttendanceRecords(
    employeeId: string, 
    startDate: string, 
    endDate: string
  ): Promise<AttendanceRecord[]> {
    try {
      const { data, error } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('employee_id', employeeId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false })

      if (error) throw error

      return data?.map(record => this.mapDatabaseToAttendanceRecord(record)) || []
    } catch (error) {
      return []
    }
  }

  async getWorkHoursSummary(
    employeeId: string, 
    startDate: string, 
    endDate: string
  ): Promise<WorkHoursSummary> {
    try {
      const attendanceRecords = await this.getAttendanceRecords(employeeId, startDate, endDate)

      const totalHours = attendanceRecords.reduce((sum, record) => sum + record.totalHours, 0)
      const regularHours = attendanceRecords.reduce((sum, record) => sum + record.regularHours, 0)
      const overtimeHours = attendanceRecords.reduce((sum, record) => sum + record.overtimeHours, 0)
      const presentDays = attendanceRecords.filter(record => record.status === 'present').length
      const lateDays = attendanceRecords.filter(record => record.lateMinutes > 0).length

      return {
        employeeId,
        period: `${startDate} to ${endDate}`,
        totalHours,
        regularHours,
        overtimeHours,
        totalDays: attendanceRecords.length,
        presentDays,
        absentDays: attendanceRecords.length - presentDays,
        lateDays,
        averageHoursPerDay: presentDays > 0 ? totalHours / presentDays : 0
      }
    } catch (error) {
      throw new Error('Failed to generate work hours summary')
    }
  }

  async createOrUpdateAttendanceRecord(employeeId: string, timeEntry: TimeEntry): Promise<void> {
    try {
      const date = timeEntry.checkInTime.split('T')[0]
      const existingRecord = await this.getAttendanceRecord(employeeId, date)

      const checkInTime = timeEntry.checkInTime
      const checkOutTime = timeEntry.checkOutTime
      const totalHours = timeEntry.totalHours || 0

      // Calculate work hours breakdown
      const regularHours = Math.min(totalHours, this.STANDARD_WORK_HOURS)
      const overtimeHours = Math.max(0, totalHours - this.STANDARD_WORK_HOURS)

      // Determine attendance status
      const status = this.determineAttendanceStatus(checkInTime, checkOutTime, totalHours)
      const lateMinutes = this.calculateLateMinutes(checkInTime)
      const earlyLeaveMinutes = this.calculateEarlyLeaveMinutes(checkOutTime)

      const attendanceData = {
        employee_id: employeeId,
        date,
        check_in_time: checkInTime,
        check_out_time: checkOutTime,
        total_hours: totalHours,
        regular_hours: regularHours,
        overtime_hours: overtimeHours,
        break_time: 0, // Can be calculated based on break entries
        status,
        late_minutes: lateMinutes,
        early_leave_minutes: earlyLeaveMinutes,
        updated_at: new Date().toISOString()
      }

      console.log(`[TimeTracking] Creating/updating attendance record for employee: ${employeeId}`, {
        date,
        status,
        totalHours,
        lateMinutes,
        hasCheckOut: !!checkOutTime
      })

      if (existingRecord) {
        // Update existing record
        const { error } = await supabase
          .from('attendance_records')
          .update(attendanceData)
          .eq('employee_id', employeeId)
          .eq('date', date)

        if (error) {
          console.error(`[TimeTracking] Failed to update attendance record for employee: ${employeeId}`, error)
          throw error
        }

        console.log(`[TimeTracking] Successfully updated attendance record for employee: ${employeeId}`)
      } else {
        // Create new record
        const { error } = await supabase
          .from('attendance_records')
          .insert({
            ...attendanceData,
            created_at: new Date().toISOString()
          })

        if (error) {
          console.error(`[TimeTracking] Failed to create attendance record for employee: ${employeeId}`, error)
          throw error
        }

        console.log(`[TimeTracking] Successfully created attendance record for employee: ${employeeId}`)
      }
    } catch (error) {
      console.error(`[TimeTracking] Error creating/updating attendance record for employee: ${employeeId}`, error)
      // Don't throw error to prevent check-in/check-out from failing
      // Just log the error and continue
    }
  }

  private calculateHours(checkInTime: string, checkOutTime: string): number {
    const checkIn = new Date(checkInTime)
    const checkOut = new Date(checkOutTime)
    const diffMs = checkOut.getTime() - checkIn.getTime()
    return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100 // Round to 2 decimal places
  }

  private validateLocationData(location: Location): { status: string, message: string } {
    // Basic coordinate validation
    if (!this.isValidCoordinates(location)) {
      return {
        status: 'invalid',
        message: 'Invalid GPS coordinates received'
      }
    }

    // Check location accuracy if provided
    if (location.accuracy && location.accuracy > 100) {
      return {
        status: 'low_accuracy',
        message: `GPS accuracy is low (${location.accuracy}m). Location may not be precise.`
      }
    }

    // Check if office location is configured
    if (!this.OFFICE_LOCATION.latitude || !this.OFFICE_LOCATION.longitude) {
      return {
        status: 'no_office_config',
        message: 'Office location not configured. Check-in allowed from any location.'
      }
    }

    // Calculate distance from office
    const distance = this.calculateDistance(location, this.OFFICE_LOCATION)
    
    if (distance <= this.MAX_LOCATION_DISTANCE_METERS) {
      return {
        status: 'valid',
        message: `Check-in from office location (${Math.round(distance)}m from office)`
      }
    } else if (distance <= this.MAX_LOCATION_DISTANCE_METERS * 2) {
      return {
        status: 'near_office',
        message: `Check-in near office location (${Math.round(distance)}m from office)`
      }
    } else {
      return {
        status: 'remote',
        message: `Remote check-in detected (${Math.round(distance)}m from office)`
      }
    }
  }

  private isValidCoordinates(location: Location): boolean {
    return (
      typeof location.latitude === 'number' &&
      typeof location.longitude === 'number' &&
      location.latitude >= -90 && location.latitude <= 90 &&
      location.longitude >= -180 && location.longitude <= 180 &&
      !isNaN(location.latitude) && !isNaN(location.longitude)
    )
  }

  private isLocationWithinOffice(location: Location): boolean {
    const validation = this.validateLocationData(location)
    return validation.status === 'valid' || validation.status === 'near_office'
  }

  private calculateDistance(loc1: Location, loc2: Location): number {
    const R = 6371e3 // Earth's radius in meters
    const φ1 = (loc1.latitude * Math.PI) / 180
    const φ2 = (loc2.latitude * Math.PI) / 180
    const Δφ = ((loc2.latitude - loc1.latitude) * Math.PI) / 180
    const Δλ = ((loc2.longitude - loc1.longitude) * Math.PI) / 180

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c
  }

  private determineAttendanceStatus(
    checkInTime: string, 
    checkOutTime?: string, 
    totalHours?: number
  ): 'present' | 'absent' | 'partial' | 'late' | 'early_leave' {
    if (!checkInTime) return 'absent'
    if (!checkOutTime) return 'partial'

    const lateMinutes = this.calculateLateMinutes(checkInTime)
    const earlyLeaveMinutes = this.calculateEarlyLeaveMinutes(checkOutTime)

    if (lateMinutes > this.LATE_THRESHOLD_MINUTES) return 'late'
    if (earlyLeaveMinutes > this.EARLY_LEAVE_THRESHOLD_MINUTES) return 'early_leave'
    if (totalHours && totalHours < this.STANDARD_WORK_HOURS * 0.75) return 'partial'

    return 'present'
  }

  private calculateLateMinutes(checkInTime: string): number {
    const checkIn = new Date(checkInTime)
    const standardStartTime = new Date(checkIn)
    standardStartTime.setHours(9, 0, 0, 0) // Assuming 9 AM start time

    if (checkIn <= standardStartTime) return 0

    const diffMs = checkIn.getTime() - standardStartTime.getTime()
    return Math.floor(diffMs / (1000 * 60))
  }

  private calculateEarlyLeaveMinutes(checkOutTime?: string): number {
    if (!checkOutTime) return 0

    const checkOut = new Date(checkOutTime)
    const standardEndTime = new Date(checkOut)
    standardEndTime.setHours(17, 0, 0, 0) // Assuming 5 PM end time

    if (checkOut >= standardEndTime) return 0

    const diffMs = standardEndTime.getTime() - checkOut.getTime()
    return Math.floor(diffMs / (1000 * 60))
  }

  /**
   * Handle check-in when location services are unavailable
   */
  async checkInWithoutLocation(employeeId: string, reason: string, notes?: string, deviceInfo?: string): Promise<TimeTrackingResult> {
    try {
      // Check if employee already has an active check-in
      const activeEntry = await this.getActiveTimeEntry(employeeId)
      if (activeEntry) {
        throw new ConflictError('Employee is already checked in')
      }

      // If location is strictly required, reject
      if (process.env.REQUIRE_OFFICE_LOCATION === 'true' && process.env.ALLOW_LOCATION_FALLBACK !== 'true') {
        throw new ValidationError('Location is required for check-in. Please enable GPS and try again.')
      }

      const checkInTime = new Date().toISOString()
      const fallbackNote = `Location unavailable: ${reason}${notes ? ` | ${notes}` : ''}`

      // Create time entry without location
      const { data: timeEntry, error } = await supabase
        .from('time_entries')
        .insert({
          employee_id: employeeId,
          check_in_time: checkInTime,
          check_in_location: null,
          location_status: 'unavailable',
          status: 'checked_in',
          notes: fallbackNote,
          device_info: deviceInfo,
          requires_manual_review: true // Flag for HR review
        })
        .select()
        .single()

      if (error) throw error

      const mappedEntry = this.mapDatabaseToTimeEntry(timeEntry)

      return {
        success: true,
        message: 'Check-in successful without location. This entry will be reviewed by HR.',
        timeEntry: mappedEntry
      }
    } catch (error) {
      if (error instanceof ConflictError || error instanceof ValidationError) {
        throw error
      }
      throw new Error('Failed to check in without location')
    }
  }

  /**
   * Get location validation status for debugging
   */
  async validateLocationForEmployee(employeeId: string, location: Location): Promise<{
    isValid: boolean
    status: string
    message: string
    distance?: number
    recommendations: string[]
  }> {
    const validation = this.validateLocationData(location)
    const recommendations: string[] = []

    // Add recommendations based on validation status
    switch (validation.status) {
      case 'invalid':
        recommendations.push('Check if GPS is enabled on your device')
        recommendations.push('Try moving to an area with better GPS signal')
        recommendations.push('Restart your device GPS if the problem persists')
        break
      case 'low_accuracy':
        recommendations.push('Move to an open area for better GPS signal')
        recommendations.push('Wait a few moments for GPS to improve accuracy')
        recommendations.push('Check-in is allowed but may require HR review')
        break
      case 'remote':
        recommendations.push('You appear to be working remotely')
        recommendations.push('Contact HR if you should be checking in from office')
        recommendations.push('Remote check-ins may require approval')
        break
      case 'near_office':
        recommendations.push('You are near the office location')
        recommendations.push('Check-in is allowed')
        break
      case 'valid':
        recommendations.push('Location verified - you are at the office')
        break
    }

    let distance: number | undefined
    if (this.OFFICE_LOCATION.latitude && this.OFFICE_LOCATION.longitude) {
      distance = this.calculateDistance(location, this.OFFICE_LOCATION)
    }

    return {
      isValid: validation.status === 'valid' || validation.status === 'near_office',
      status: validation.status,
      message: validation.message,
      distance,
      recommendations
    }
  }

  /**
   * Admin method: Get all time entries with filters
   */
  async getAllTimeEntries(
    startDate?: string,
    endDate?: string,
    employeeId?: string,
    status?: string
  ): Promise<TimeEntry[]> {
    try {
      let query = supabase
        .from('time_entries')
        .select('*')
        .order('check_in_time', { ascending: false })

      if (startDate) {
        query = query.gte('check_in_time', startDate)
      }

      if (endDate) {
        query = query.lte('check_in_time', endDate)
      }

      if (employeeId) {
        query = query.eq('employee_id', employeeId)
      }

      if (status) {
        query = query.eq('status', status)
      }

      const { data, error } = await query

      if (error) throw error

      return data?.map(entry => this.mapDatabaseToTimeEntry(entry)) || []
    } catch (error) {
      console.error('Error getting all time entries:', error)
      return []
    }
  }

  /**
   * Admin method: Generate attendance report
   */
  async generateAttendanceReport(
    startDate?: string,
    endDate?: string,
    departmentId?: string
  ): Promise<any> {
    try {
      // Get attendance records for the period
      let query = supabase
        .from('attendance_records')
        .select('*')
        .order('date', { ascending: false })

      if (startDate) {
        query = query.gte('date', startDate)
      }

      if (endDate) {
        query = query.lte('date', endDate)
      }

      const { data: attendanceRecords, error } = await query

      if (error) throw error

      // Calculate summary statistics
      const totalEmployees = new Set(attendanceRecords?.map(r => r.employee_id) || []).size
      const totalRecords = attendanceRecords?.length || 0
      const present = attendanceRecords?.filter(r => r.status === 'present').length || 0
      const late = attendanceRecords?.filter(r => r.status === 'late').length || 0
      const absent = attendanceRecords?.filter(r => r.status === 'absent').length || 0
      const working = attendanceRecords?.filter(r => r.status === 'checked_in').length || 0

      const totalHours = attendanceRecords?.reduce((sum, r) => sum + (r.total_hours || 0), 0) || 0
      const avgHours = totalRecords > 0 ? totalHours / totalRecords : 0

      return {
        summary: {
          totalEmployees,
          present,
          late,
          absent,
          working,
          avgHours: Math.round(avgHours * 100) / 100
        },
        records: attendanceRecords?.map(record => this.mapDatabaseToAttendanceRecord(record)) || [],
        period: {
          startDate: startDate || 'N/A',
          endDate: endDate || 'N/A'
        }
      }
    } catch (error) {
      console.error('Error generating attendance report:', error)
      return {
        summary: {
          totalEmployees: 0,
          present: 0,
          late: 0,
          absent: 0,
          working: 0,
          avgHours: 0
        },
        records: [],
        period: {
          startDate: startDate || 'N/A',
          endDate: endDate || 'N/A'
        }
      }
    }
  }

  /**
   * Admin method: Get all attendance records for super-admin dashboard
   */
  async getAllAttendanceRecords(
    startDate?: string,
    endDate?: string,
    employeeId?: string,
    status?: string
  ): Promise<AttendanceRecord[]> {
    try {
      let query = supabase
        .from('attendance_records')
        .select(`
          *,
          users!attendance_records_employee_id_fkey (
            id,
            full_name,
            email,
            employee_id
          )
        `)
        .order('date', { ascending: false })

      if (startDate) {
        query = query.gte('date', startDate)
      }

      if (endDate) {
        query = query.lte('date', endDate)
      }

      if (employeeId) {
        query = query.eq('employee_id', employeeId)
      }

      if (status) {
        query = query.eq('status', status)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error getting all attendance records:', error)
        throw error
      }

      return data?.map(record => ({
        ...this.mapDatabaseToAttendanceRecord(record),
        employeeName: record.users?.full_name,
        employeeEmail: record.users?.email,
        employeeNumber: record.users?.employee_id
      })) || []
    } catch (error) {
      console.error('Error getting all attendance records:', error)
      return []
    }
  }

  /**
   * Admin method: Get attendance summary for dashboard
   */
  async getAttendanceSummary(date?: string): Promise<{
    totalEmployees: number
    present: number
    absent: number
    late: number
    checkedIn: number
    checkedOut: number
    totalHours: number
    averageHours: number
  }> {
    try {
      const targetDate = date || new Date().toISOString().split('T')[0]

      // Get attendance records for the date
      const { data: attendanceRecords, error: attendanceError } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('date', targetDate)

      if (attendanceError) {
        console.error('Error getting attendance summary:', attendanceError)
        throw attendanceError
      }

      // Get current check-in status
      const { data: timeEntries, error: timeError } = await supabase
        .from('time_entries')
        .select('employee_id, status')
        .gte('check_in_time', `${targetDate}T00:00:00`)
        .lt('check_in_time', `${targetDate}T23:59:59`)

      if (timeError) {
        console.error('Error getting time entries for summary:', timeError)
      }

      const records = attendanceRecords || []
      const entries = timeEntries || []

      const present = records.filter(r => r.status === 'present').length
      const absent = records.filter(r => r.status === 'absent').length
      const late = records.filter(r => r.status === 'late').length
      const checkedIn = entries.filter(e => e.status === 'checked_in').length
      const checkedOut = entries.filter(e => e.status === 'checked_out').length

      const totalHours = records.reduce((sum, r) => sum + (r.total_hours || 0), 0)
      const averageHours = records.length > 0 ? totalHours / records.length : 0

      // Get total employees count
      const { count: totalEmployees } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')

      return {
        totalEmployees: totalEmployees || 0,
        present,
        absent,
        late,
        checkedIn,
        checkedOut,
        totalHours: Math.round(totalHours * 100) / 100,
        averageHours: Math.round(averageHours * 100) / 100
      }
    } catch (error) {
      console.error('Error getting attendance summary:', error)
      return {
        totalEmployees: 0,
        present: 0,
        absent: 0,
        late: 0,
        checkedIn: 0,
        checkedOut: 0,
        totalHours: 0,
        averageHours: 0
      }
    }
  }

  /**
   * Manager method: Get team statistics
   */
  async getTeamStatistics(
    managerId: string,
    startDate?: string,
    endDate?: string
  ): Promise<any[]> {
    try {
      // For now, return mock data since we don't have employee-manager relationships set up
      // In a real implementation, you would:
      // 1. Get team members under this manager
      // 2. Get their attendance records for the period
      // 3. Calculate statistics for each team member
      
      const mockStats = [
        {
          employeeId: 'emp001',
          employeeName: 'John Doe',
          department: 'Engineering',
          totalHours: 40,
          expectedHours: 40,
          daysPresent: 5,
          daysLate: 1,
          daysAbsent: 0,
          productivity: 95
        },
        {
          employeeId: 'emp002',
          employeeName: 'Jane Smith',
          department: 'Engineering',
          totalHours: 38,
          expectedHours: 40,
          daysPresent: 5,
          daysLate: 0,
          daysAbsent: 0,
          productivity: 98
        }
      ]

      return mockStats
    } catch (error) {
      console.error('Error getting team statistics:', error)
      return []
    }
  }

  private mapDatabaseToTimeEntry(data: any): TimeEntry {
    return {
      id: data.id,
      employeeId: data.employee_id,
      checkInTime: data.check_in_time,
      checkOutTime: data.check_out_time,
      checkInLocation: data.check_in_location,
      checkOutLocation: data.check_out_location,
      locationStatus: data.location_status,
      totalHours: data.total_hours,
      status: data.status,
      notes: data.notes,
      deviceInfo: data.device_info,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }
  }

  private mapDatabaseToAttendanceRecord(data: any): AttendanceRecord {
    return {
      employeeId: data.employee_id,
      date: data.date,
      checkInTime: data.check_in_time,
      checkOutTime: data.check_out_time,
      totalHours: data.total_hours,
      regularHours: data.regular_hours,
      overtimeHours: data.overtime_hours,
      breakTime: data.break_time,
      status: data.status,
      lateMinutes: data.late_minutes,
      earlyLeaveMinutes: data.early_leave_minutes
    }
  }
}