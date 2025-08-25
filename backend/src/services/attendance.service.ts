import { supabase } from '../config/database'
import { NotFoundError, ConflictError, ValidationError, AuthorizationError } from '../utils/errors'
import { websocketService } from './websocket.service'

export interface AttendanceSession {
  id: string
  employeeId: string
  sessionDate: string
  checkInTime?: string
  checkOutTime?: string
  breakStartTime?: string
  breakEndTime?: string
  totalBreakMinutes: number
  status: 'checked_in' | 'on_break' | 'checked_out' | 'overtime'
  locationData?: any
  deviceInfo?: any
  ipAddress?: string
  isManualEntry: boolean
  approvedBy?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface AttendanceEvent {
  id: string
  sessionId: string
  eventType: 'check_in' | 'check_out' | 'break_start' | 'break_end'
  eventTime: string
  locationData?: any
  deviceInfo?: any
  createdAt: string
}

export interface AttendanceViolation {
  id: string
  employeeId: string
  sessionId?: string
  violationType: 'late_arrival' | 'early_departure' | 'missed_checkout' | 'location_violation'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  autoDetected: boolean
  resolved: boolean
  resolvedBy?: string
  resolutionNotes?: string
  createdAt: string
  resolvedAt?: string
}

export interface CheckInData {
  employeeId: string
  locationData?: any
  deviceInfo?: any
  notes?: string
}

export interface CheckOutData {
  employeeId: string
  locationData?: any
  deviceInfo?: any
  notes?: string
}

export interface AttendanceResult {
  success: boolean
  message: string
  session?: AttendanceSession
  sessions?: AttendanceSession[]
  violations?: AttendanceViolation[]
  total?: number
  page?: number
  limit?: number
}

class AttendanceService {
  /**
   * Check in employee
   */
  async checkIn(data: CheckInData, requestedBy: string): Promise<AttendanceResult> {
    try {
      console.log('🔄 [AttendanceService] Processing check-in for employee:', data.employeeId)

      // Validate employee exists and user has permission
      const { data: employee, error: empError } = await supabase
        .from('employees')
        .select('id, full_name, user_id')
        .eq('id', data.employeeId)
        .eq('employee_status', 'active')
        .is('deleted_at', null)
        .single()

      if (empError || !employee) {
        throw new NotFoundError('Employee not found or inactive')
      }

      // Check if user has permission (employee can check themselves in, managers can check in their reports)
      if (employee.user_id !== requestedBy) {
        const hasPermission = await this.validateAttendanceAccess(requestedBy, data.employeeId, 'write')
        if (!hasPermission) {
          throw new AuthorizationError('Insufficient permissions to check in this employee')
        }
      }

      const today = new Date().toISOString().split('T')[0]
      const now = new Date().toISOString()

      // Check if employee is already checked in today
      const { data: existingSession } = await supabase
        .from('attendance_sessions')
        .select('*')
        .eq('employee_id', data.employeeId)
        .eq('session_date', today)
        .single()

      if (existingSession && existingSession.status === 'checked_in') {
        throw new ConflictError('Employee is already checked in')
      }

      let session: AttendanceSession

      if (existingSession) {
        // Update existing session
        const { data: updatedSession, error } = await supabase
          .from('attendance_sessions')
          .update({
            check_in_time: now,
            status: 'checked_in',
            location_data: data.locationData,
            device_info: data.deviceInfo,
            ip_address: this.getClientIP(),
            notes: data.notes,
            updated_at: now
          })
          .eq('id', existingSession.id)
          .select()
          .single()

        if (error) {
          console.error('Failed to update attendance session:', error)
          throw new Error('Failed to update attendance session')
        }

        session = this.mapDatabaseToSession(updatedSession)
      } else {
        // Create new session
        const { data: newSession, error } = await supabase
          .from('attendance_sessions')
          .insert({
            employee_id: data.employeeId,
            session_date: today,
            check_in_time: now,
            status: 'checked_in',
            location_data: data.locationData,
            device_info: data.deviceInfo,
            ip_address: this.getClientIP(),
            notes: data.notes
          })
          .select()
          .single()

        if (error) {
          console.error('Failed to create attendance session:', error)
          throw new Error('Failed to create attendance session')
        }

        session = this.mapDatabaseToSession(newSession)
      }

      // Check for violations (late arrival, location, etc.)
      await this.checkForViolations(session)

      // Broadcast real-time update
      websocketService.broadcastAttendanceUpdate(data.employeeId, 'check_in', session)

      console.log('✅ [AttendanceService] Check-in successful for employee:', data.employeeId)

      return {
        success: true,
        message: 'Check-in successful',
        session
      }
    } catch (error: any) {
      console.error('❌ [AttendanceService] Check-in failed:', error)
      if (error instanceof ValidationError || error instanceof ConflictError || error instanceof AuthorizationError || error instanceof NotFoundError) {
        throw error
      }
      throw new Error(`Failed to check in: ${error.message}`)
    }
  }

  /**
   * Check out employee
   */
  async checkOut(data: CheckOutData, requestedBy: string): Promise<AttendanceResult> {
    try {
      console.log('🔄 [AttendanceService] Processing check-out for employee:', data.employeeId)

      // Validate employee exists and user has permission
      const { data: employee, error: empError } = await supabase
        .from('employees')
        .select('id, full_name, user_id')
        .eq('id', data.employeeId)
        .eq('employee_status', 'active')
        .is('deleted_at', null)
        .single()

      if (empError || !employee) {
        throw new NotFoundError('Employee not found or inactive')
      }

      // Check if user has permission
      if (employee.user_id !== requestedBy) {
        const hasPermission = await this.validateAttendanceAccess(requestedBy, data.employeeId, 'write')
        if (!hasPermission) {
          throw new AuthorizationError('Insufficient permissions to check out this employee')
        }
      }

      const today = new Date().toISOString().split('T')[0]
      const now = new Date().toISOString()

      // Get today's session
      const { data: existingSession, error: sessionError } = await supabase
        .from('attendance_sessions')
        .select('*')
        .eq('employee_id', data.employeeId)
        .eq('session_date', today)
        .single()

      if (sessionError || !existingSession) {
        throw new NotFoundError('No active session found for today. Please check in first.')
      }

      if (existingSession.status === 'checked_out') {
        throw new ConflictError('Employee is already checked out')
      }

      // Update session with check-out time
      const { data: updatedSession, error } = await supabase
        .from('attendance_sessions')
        .update({
          check_out_time: now,
          status: 'checked_out',
          location_data: data.locationData,
          device_info: data.deviceInfo,
          ip_address: this.getClientIP(),
          notes: data.notes,
          updated_at: now
        })
        .eq('id', existingSession.id)
        .select()
        .single()

      if (error) {
        console.error('Failed to update attendance session:', error)
        throw new Error('Failed to update attendance session')
      }

      const session = this.mapDatabaseToSession(updatedSession)

      // Check for violations (early departure, etc.)
      await this.checkForViolations(session)

      // Broadcast real-time update
      websocketService.broadcastAttendanceUpdate(data.employeeId, 'check_out', session)

      console.log('✅ [AttendanceService] Check-out successful for employee:', data.employeeId)

      return {
        success: true,
        message: 'Check-out successful',
        session
      }
    } catch (error: any) {
      console.error('❌ [AttendanceService] Check-out failed:', error)
      if (error instanceof ValidationError || error instanceof ConflictError || error instanceof AuthorizationError || error instanceof NotFoundError) {
        throw error
      }
      throw new Error(`Failed to check out: ${error.message}`)
    }
  }

  /**
   * Start break
   */
  async startBreak(employeeId: string, requestedBy: string): Promise<AttendanceResult> {
    try {
      console.log('🔄 [AttendanceService] Starting break for employee:', employeeId)

      const today = new Date().toISOString().split('T')[0]
      const now = new Date().toISOString()

      // Get today's session
      const { data: session, error: sessionError } = await supabase
        .from('attendance_sessions')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('session_date', today)
        .single()

      if (sessionError || !session) {
        throw new NotFoundError('No active session found for today. Please check in first.')
      }

      if (session.status !== 'checked_in') {
        throw new ConflictError('Employee must be checked in to start a break')
      }

      // Update session with break start time
      const { data: updatedSession, error } = await supabase
        .from('attendance_sessions')
        .update({
          break_start_time: now,
          status: 'on_break',
          updated_at: now
        })
        .eq('id', session.id)
        .select()
        .single()

      if (error) {
        console.error('Failed to start break:', error)
        throw new Error('Failed to start break')
      }

      // Broadcast real-time update
      const mappedSession = this.mapDatabaseToSession(updatedSession)
      websocketService.broadcastAttendanceUpdate(employeeId, 'break_start', mappedSession)

      console.log('✅ [AttendanceService] Break started for employee:', employeeId)

      return {
        success: true,
        message: 'Break started successfully',
        session: mappedSession
      }
    } catch (error: any) {
      console.error('❌ [AttendanceService] Start break failed:', error)
      if (error instanceof ValidationError || error instanceof ConflictError || error instanceof NotFoundError) {
        throw error
      }
      throw new Error(`Failed to start break: ${error.message}`)
    }
  }

  /**
   * End break
   */
  async endBreak(employeeId: string, requestedBy: string): Promise<AttendanceResult> {
    try {
      console.log('🔄 [AttendanceService] Ending break for employee:', employeeId)

      const today = new Date().toISOString().split('T')[0]
      const now = new Date().toISOString()

      // Get today's session
      const { data: session, error: sessionError } = await supabase
        .from('attendance_sessions')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('session_date', today)
        .single()

      if (sessionError || !session) {
        throw new NotFoundError('No active session found for today.')
      }

      if (session.status !== 'on_break') {
        throw new ConflictError('Employee is not currently on break')
      }

      // Calculate break duration
      const breakStart = new Date(session.break_start_time)
      const breakEnd = new Date(now)
      const breakMinutes = Math.round((breakEnd.getTime() - breakStart.getTime()) / (1000 * 60))

      // Update session with break end time
      const { data: updatedSession, error } = await supabase
        .from('attendance_sessions')
        .update({
          break_end_time: now,
          total_break_minutes: (session.total_break_minutes || 0) + breakMinutes,
          status: 'checked_in',
          updated_at: now
        })
        .eq('id', session.id)
        .select()
        .single()

      if (error) {
        console.error('Failed to end break:', error)
        throw new Error('Failed to end break')
      }

      // Broadcast real-time update
      const mappedSession = this.mapDatabaseToSession(updatedSession)
      websocketService.broadcastAttendanceUpdate(employeeId, 'break_end', mappedSession)

      console.log('✅ [AttendanceService] Break ended for employee:', employeeId)

      return {
        success: true,
        message: 'Break ended successfully',
        session: mappedSession
      }
    } catch (error: any) {
      console.error('❌ [AttendanceService] End break failed:', error)
      if (error instanceof ValidationError || error instanceof ConflictError || error instanceof NotFoundError) {
        throw error
      }
      throw new Error(`Failed to end break: ${error.message}`)
    }
  }

  /**
   * Get attendance sessions with filters
   */
  async getAttendanceSessions(filters: any, requestedBy: string): Promise<AttendanceResult> {
    try {
      // Validate access
      const hasAccess = await this.validateAttendanceAccess(requestedBy, undefined, 'read')
      if (!hasAccess) {
        throw new AuthorizationError('Insufficient permissions to view attendance data')
      }

      const page = filters.page || 1
      const limit = Math.min(filters.limit || 20, 100)
      const offset = (page - 1) * limit

      let query = supabase
        .from('attendance_sessions')
        .select(`
          *,
          employee:employees(id, full_name, employee_number, department:departments(name))
        `, { count: 'exact' })

      // Apply filters
      if (filters.employeeId) {
        query = query.eq('employee_id', filters.employeeId)
      }

      if (filters.dateFrom) {
        query = query.gte('session_date', filters.dateFrom)
      }

      if (filters.dateTo) {
        query = query.lte('session_date', filters.dateTo)
      }

      if (filters.status) {
        query = query.eq('status', filters.status)
      }

      // Apply pagination
      query = query.range(offset, offset + limit - 1)
      query = query.order('session_date', { ascending: false })

      const { data: sessions, error, count } = await query

      if (error) {
        console.error('Failed to get attendance sessions:', error)
        throw new Error('Failed to get attendance sessions')
      }

      const mappedSessions = sessions?.map(session => this.mapDatabaseToSession(session)) || []

      return {
        success: true,
        message: 'Attendance sessions retrieved successfully',
        sessions: mappedSessions,
        total: count || 0,
        page,
        limit
      }
    } catch (error: any) {
      if (error instanceof AuthorizationError) {
        throw error
      }
      console.error('Failed to get attendance sessions:', error)
      throw new Error('Failed to get attendance sessions')
    }
  }

  /**
   * Get live attendance dashboard data
   */
  async getLiveAttendanceDashboard(requestedBy: string): Promise<any> {
    try {
      // Validate access
      const hasAccess = await this.validateAttendanceAccess(requestedBy, undefined, 'read')
      if (!hasAccess) {
        throw new AuthorizationError('Insufficient permissions to view attendance dashboard')
      }

      const today = new Date().toISOString().split('T')[0]

      // Get today's attendance sessions
      const { data: sessions, error } = await supabase
        .from('attendance_sessions')
        .select(`
          *,
          employee:employees(id, full_name, employee_number, department:departments(name))
        `)
        .eq('session_date', today)
        .order('check_in_time', { ascending: false })

      if (error) {
        console.error('Failed to get live attendance data:', error)
        throw new Error('Failed to get live attendance data')
      }

      // Calculate statistics
      const stats = {
        totalEmployees: 0,
        checkedIn: 0,
        onBreak: 0,
        checkedOut: 0,
        notCheckedIn: 0,
        violations: 0
      }

      const mappedSessions = sessions?.map(session => {
        const mapped = this.mapDatabaseToSession(session)
        
        // Update stats
        stats.totalEmployees++
        switch (mapped.status) {
          case 'checked_in':
            stats.checkedIn++
            break
          case 'on_break':
            stats.onBreak++
            break
          case 'checked_out':
            stats.checkedOut++
            break
        }

        return mapped
      }) || []

      // Get violations for today
      const { data: violations } = await supabase
        .from('attendance_violations')
        .select('*')
        .gte('created_at', today)
        .eq('resolved', false)

      stats.violations = violations?.length || 0

      return {
        success: true,
        message: 'Live attendance dashboard data retrieved successfully',
        data: {
          sessions: mappedSessions,
          statistics: stats,
          violations: violations || [],
          lastUpdated: new Date().toISOString()
        }
      }
    } catch (error: any) {
      if (error instanceof AuthorizationError) {
        throw error
      }
      console.error('Failed to get live attendance dashboard:', error)
      throw new Error('Failed to get live attendance dashboard')
    }
  }

  /**
   * Get attendance violations
   */
  async getAttendanceViolations(filters: any, requestedBy: string): Promise<AttendanceResult> {
    try {
      // Validate access
      const hasAccess = await this.validateAttendanceAccess(requestedBy, undefined, 'read')
      if (!hasAccess) {
        throw new AuthorizationError('Insufficient permissions to view attendance violations')
      }

      const page = filters.page || 1
      const limit = Math.min(filters.limit || 20, 100)
      const offset = (page - 1) * limit

      let query = supabase
        .from('attendance_violations')
        .select(`
          *,
          employee:employees(id, full_name, employee_number)
        `, { count: 'exact' })

      // Apply filters
      if (filters.employeeId) {
        query = query.eq('employee_id', filters.employeeId)
      }

      if (filters.violationType) {
        query = query.eq('violation_type', filters.violationType)
      }

      if (filters.severity) {
        query = query.eq('severity', filters.severity)
      }

      if (filters.resolved !== undefined) {
        query = query.eq('resolved', filters.resolved)
      }

      // Apply pagination
      query = query.range(offset, offset + limit - 1)
      query = query.order('created_at', { ascending: false })

      const { data: violations, error, count } = await query

      if (error) {
        console.error('Failed to get attendance violations:', error)
        throw new Error('Failed to get attendance violations')
      }

      return {
        success: true,
        message: 'Attendance violations retrieved successfully',
        violations: violations || [],
        total: count || 0,
        page,
        limit
      }
    } catch (error: any) {
      if (error instanceof AuthorizationError) {
        throw error
      }
      console.error('Failed to get attendance violations:', error)
      throw new Error('Failed to get attendance violations')
    }
  }

  /**
   * Resolve attendance violation
   */
  async resolveViolation(violationId: string, resolutionNotes: string, requestedBy: string): Promise<AttendanceResult> {
    try {
      // Validate access
      const hasAccess = await this.validateAttendanceAccess(requestedBy, undefined, 'write')
      if (!hasAccess) {
        throw new AuthorizationError('Insufficient permissions to resolve attendance violations')
      }

      const { data: violation, error } = await supabase
        .from('attendance_violations')
        .update({
          resolved: true,
          resolved_by: requestedBy,
          resolution_notes: resolutionNotes,
          resolved_at: new Date().toISOString()
        })
        .eq('id', violationId)
        .select()
        .single()

      if (error) {
        console.error('Failed to resolve violation:', error)
        throw new Error('Failed to resolve violation')
      }

      return {
        success: true,
        message: 'Violation resolved successfully',
        violations: [violation]
      }
    } catch (error: any) {
      if (error instanceof AuthorizationError) {
        throw error
      }
      console.error('Failed to resolve violation:', error)
      throw new Error('Failed to resolve violation')
    }
  }

  /**
   * Check for attendance violations
   */
  private async checkForViolations(session: AttendanceSession): Promise<void> {
    try {
      // Get attendance policy (simplified - would normally get employee-specific policy)
      const { data: policy } = await supabase
        .from('attendance_policies')
        .select('*')
        .eq('is_default', true)
        .eq('is_active', true)
        .single()

      if (!policy) return

      const violations: any[] = []

      // Check for late arrival
      if (session.checkInTime) {
        const checkInTime = new Date(session.checkInTime)
        const workStartTime = new Date(`${session.sessionDate}T${policy.work_hours_start}`)
        const lateThreshold = policy.late_arrival_threshold_minutes || 15

        if (checkInTime > new Date(workStartTime.getTime() + lateThreshold * 60000)) {
          violations.push({
            employee_id: session.employeeId,
            session_id: session.id,
            violation_type: 'late_arrival',
            severity: 'medium',
            description: `Employee arrived ${Math.round((checkInTime.getTime() - workStartTime.getTime()) / 60000)} minutes late`,
            auto_detected: true
          })
        }
      }

      // Check for early departure
      if (session.checkOutTime) {
        const checkOutTime = new Date(session.checkOutTime)
        const workEndTime = new Date(`${session.sessionDate}T${policy.work_hours_end}`)

        if (checkOutTime < workEndTime) {
          violations.push({
            employee_id: session.employeeId,
            session_id: session.id,
            violation_type: 'early_departure',
            severity: 'medium',
            description: `Employee left ${Math.round((workEndTime.getTime() - checkOutTime.getTime()) / 60000)} minutes early`,
            auto_detected: true
          })
        }
      }

      // Insert violations if any
      if (violations.length > 0) {
        const { data: insertedViolations } = await supabase
          .from('attendance_violations')
          .insert(violations)
          .select()

        // Send real-time violation alerts
        if (insertedViolations) {
          insertedViolations.forEach(violation => {
            websocketService.sendAttendanceViolationAlert(violation)
          })
        }
      }
    } catch (error) {
      console.error('Failed to check for violations:', error)
      // Don't throw error to avoid breaking the main flow
    }
  }

  /**
   * Validate attendance access permissions
   */
  private async validateAttendanceAccess(userId: string, targetEmployeeId?: string, action: string = 'read'): Promise<boolean> {
    const { data: user } = await supabase
      .from('users')
      .select('id, employee_id')
      .eq('id', userId)
      .single()

    if (!user) {
      throw new AuthorizationError('User not found')
    }

    // Get user roles
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role_name, is_active')
      .eq('user_id', userId)
      .eq('is_active', true)

    if (rolesError || !userRoles || userRoles.length === 0) {
      throw new AuthorizationError('User has no active roles')
    }

    const roleNames = userRoles.map((ur: any) => ur.role_name)

    // Super admin and HR admin have full access
    if (roleNames.some(role => ['super-admin', 'hr-admin'].includes(role))) {
      return true
    }

    // Managers can view their team's attendance
    if (roleNames.includes('manager') && targetEmployeeId) {
      const { data: hierarchy } = await supabase
        .from('employee_hierarchy')
        .select('*')
        .eq('employee_id', targetEmployeeId)
        .eq('manager_id', user.employee_id)
        .eq('is_active', true)
        .single()

      return !!hierarchy
    }

    // Employees can manage their own attendance
    if (roleNames.includes('employee') && targetEmployeeId === user.employee_id) {
      return true
    }

    return false
  }

  /**
   * Get client IP address (placeholder)
   */
  private getClientIP(): string {
    // In a real implementation, this would get the actual client IP
    return '127.0.0.1'
  }

  /**
   * Map database record to AttendanceSession interface
   */
  private mapDatabaseToSession(data: any): AttendanceSession {
    return {
      id: data.id,
      employeeId: data.employee_id,
      sessionDate: data.session_date,
      checkInTime: data.check_in_time,
      checkOutTime: data.check_out_time,
      breakStartTime: data.break_start_time,
      breakEndTime: data.break_end_time,
      totalBreakMinutes: data.total_break_minutes || 0,
      status: data.status,
      locationData: data.location_data,
      deviceInfo: data.device_info,
      ipAddress: data.ip_address,
      isManualEntry: data.is_manual_entry || false,
      approvedBy: data.approved_by,
      notes: data.notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }
  }
}

export const attendanceService = new AttendanceService()
export { AttendanceService }