import { supabase } from '../config/database'
import { NotFoundError, ConflictError, ValidationError } from '../utils/errors'

export interface EmployeeSchedule {
  id: string
  employeeId: string
  scheduleDate: string
  startTime: string
  endTime: string
  scheduleType: 'work' | 'break' | 'meeting' | 'training' | 'other'
  title: string
  description?: string
  location?: string
  isRecurring: boolean
  recurringPattern?: 'daily' | 'weekly' | 'monthly'
  recurringEndDate?: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  createdAt: string
  updatedAt: string
  createdBy: string
  updatedBy?: string
}

export interface Meeting {
  id: string
  title: string
  description?: string
  startTime: string
  endTime: string
  location?: string
  meetingType: 'team' | 'one_on_one' | 'client' | 'training' | 'other'
  organizerId: string
  attendeeIds: string[]
  isRecurring: boolean
  recurringPattern?: 'daily' | 'weekly' | 'monthly'
  recurringEndDate?: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  meetingLink?: string
  agenda?: string
  notes?: string
  createdAt: string
  updatedAt: string
  createdBy: string
  updatedBy?: string
}

export interface CreateEmployeeScheduleData {
  employeeId: string
  scheduleDate: string
  startTime: string
  endTime: string
  scheduleType: 'work' | 'break' | 'meeting' | 'training' | 'other'
  title: string
  description?: string
  location?: string
  isRecurring?: boolean
  recurringPattern?: 'daily' | 'weekly' | 'monthly'
  recurringEndDate?: string
}

export interface CreateMeetingData {
  title: string
  description?: string
  startTime: string
  endTime: string
  location?: string
  meetingType: 'team' | 'one_on_one' | 'client' | 'training' | 'other'
  organizerId: string
  attendeeIds: string[]
  isRecurring?: boolean
  recurringPattern?: 'daily' | 'weekly' | 'monthly'
  recurringEndDate?: string
  meetingLink?: string
  agenda?: string
}

export interface ScheduleFilters {
  employeeId?: string
  date?: string
  type?: string
  startDate?: string
  endDate?: string
}

export interface MeetingFilters {
  startDate?: string
  endDate?: string
  meetingType?: string
  organizerId?: string
  attendeeId?: string
}

export interface ScheduleResult {
  success: boolean
  message: string
  schedule?: EmployeeSchedule
  schedules?: EmployeeSchedule[]
  pagination?: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface MeetingResult {
  success: boolean
  message: string
  meeting?: Meeting
  meetings?: Meeting[]
  pagination?: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface ConflictCheckResult {
  success: boolean
  message: string
  conflicts?: Array<{
    id: string
    title: string
    startTime: string
    endTime: string
    type: 'schedule' | 'meeting'
  }>
  hasConflicts?: boolean
}

export class ScheduleService {
  // Employee Schedule Methods
  async createEmployeeSchedule(scheduleData: CreateEmployeeScheduleData, userId: string): Promise<ScheduleResult> {
    try {
      // Validate required fields
      if (!scheduleData.employeeId || !scheduleData.scheduleDate || !scheduleData.startTime || !scheduleData.endTime || !scheduleData.title) {
        throw new ValidationError('Missing required fields: employeeId, scheduleDate, startTime, endTime, title')
      }

      // Check for conflicts
      const conflictCheck = await this.checkScheduleConflicts(
        scheduleData.employeeId,
        `${scheduleData.scheduleDate}T${scheduleData.startTime}`,
        `${scheduleData.scheduleDate}T${scheduleData.endTime}`
      )

      if (conflictCheck.hasConflicts) {
        throw new ConflictError('Schedule conflicts with existing appointments')
      }

      // Verify employee exists
      const { data: employee, error: employeeError } = await supabase
        .from('employees')
        .select('id')
        .eq('id', scheduleData.employeeId)
        .single()

      if (employeeError || !employee) {
        throw new NotFoundError('Employee not found')
      }

      // Create schedule
      const { data, error } = await supabase
        .from('employee_schedules')
        .insert({
          employee_id: scheduleData.employeeId,
          schedule_date: scheduleData.scheduleDate,
          start_time: scheduleData.startTime,
          end_time: scheduleData.endTime,
          schedule_type: scheduleData.scheduleType,
          title: scheduleData.title,
          description: scheduleData.description,
          location: scheduleData.location,
          is_recurring: scheduleData.isRecurring || false,
          recurring_pattern: scheduleData.recurringPattern,
          recurring_end_date: scheduleData.recurringEndDate,
          status: 'scheduled',
          created_by: userId
        })
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to create schedule: ${error.message}`)
      }

      return {
        success: true,
        message: 'Employee schedule created successfully',
        schedule: this.mapScheduleFromDB(data)
      }
    } catch (error) {
      if (error instanceof ValidationError || error instanceof ConflictError || error instanceof NotFoundError) {
        throw error
      }
      throw new Error(`Failed to create employee schedule: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async getEmployeeSchedules(filters: ScheduleFilters, page: number = 1, limit: number = 10): Promise<ScheduleResult> {
    try {
      let query = supabase
        .from('employee_schedules')
        .select(`
          *,
          employee:employees(id, full_name, employee_id)
        `, { count: 'exact' })

      // Apply filters
      if (filters.employeeId) {
        query = query.eq('employee_id', filters.employeeId)
      }
      if (filters.date) {
        query = query.eq('schedule_date', filters.date)
      }
      if (filters.type) {
        query = query.eq('schedule_type', filters.type)
      }
      if (filters.startDate && filters.endDate) {
        query = query.gte('schedule_date', filters.startDate).lte('schedule_date', filters.endDate)
      }

      // Apply pagination
      const offset = (page - 1) * limit
      query = query.range(offset, offset + limit - 1)
      query = query.order('schedule_date', { ascending: true })
      query = query.order('start_time', { ascending: true })

      const { data, error, count } = await query

      if (error) {
        throw new Error(`Failed to fetch schedules: ${error.message}`)
      }

      const schedules = data?.map(item => this.mapScheduleFromDB(item)) || []
      const totalPages = Math.ceil((count || 0) / limit)

      return {
        success: true,
        message: 'Employee schedules retrieved successfully',
        schedules,
        pagination: {
          total: count || 0,
          page,
          limit,
          totalPages
        }
      }
    } catch (error) {
      throw new Error(`Failed to fetch employee schedules: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async getEmployeeScheduleById(id: string): Promise<ScheduleResult> {
    try {
      const { data, error } = await supabase
        .from('employee_schedules')
        .select(`
          *,
          employee:employees(id, full_name, employee_id)
        `)
        .eq('id', id)
        .single()

      if (error || !data) {
        throw new NotFoundError('Employee schedule not found')
      }

      return {
        success: true,
        message: 'Employee schedule retrieved successfully',
        schedule: this.mapScheduleFromDB(data)
      }
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error
      }
      throw new Error(`Failed to fetch employee schedule: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async updateEmployeeSchedule(id: string, updateData: Partial<CreateEmployeeScheduleData>, userId: string): Promise<ScheduleResult> {
    try {
      // Check if schedule exists
      const existingSchedule = await this.getEmployeeScheduleById(id)
      if (!existingSchedule.success) {
        throw new NotFoundError('Employee schedule not found')
      }

      // Check for conflicts if time/date is being updated
      if (updateData.scheduleDate || updateData.startTime || updateData.endTime) {
        const schedule = existingSchedule.schedule!
        const newStartTime = updateData.startTime || schedule.startTime
        const newEndTime = updateData.endTime || schedule.endTime
        const newDate = updateData.scheduleDate || schedule.scheduleDate

        const conflictCheck = await this.checkScheduleConflicts(
          schedule.employeeId,
          `${newDate}T${newStartTime}`,
          `${newDate}T${newEndTime}`,
          id
        )

        if (conflictCheck.hasConflicts) {
          throw new ConflictError('Schedule conflicts with existing appointments')
        }
      }

      const { data, error } = await supabase
        .from('employee_schedules')
        .update({
          ...updateData.scheduleDate && { schedule_date: updateData.scheduleDate },
          ...updateData.startTime && { start_time: updateData.startTime },
          ...updateData.endTime && { end_time: updateData.endTime },
          ...updateData.scheduleType && { schedule_type: updateData.scheduleType },
          ...updateData.title && { title: updateData.title },
          ...updateData.description !== undefined && { description: updateData.description },
          ...updateData.location !== undefined && { location: updateData.location },
          ...updateData.isRecurring !== undefined && { is_recurring: updateData.isRecurring },
          ...updateData.recurringPattern && { recurring_pattern: updateData.recurringPattern },
          ...updateData.recurringEndDate !== undefined && { recurring_end_date: updateData.recurringEndDate },
          updated_by: userId,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to update schedule: ${error.message}`)
      }

      return {
        success: true,
        message: 'Employee schedule updated successfully',
        schedule: this.mapScheduleFromDB(data)
      }
    } catch (error) {
      if (error instanceof ValidationError || error instanceof ConflictError || error instanceof NotFoundError) {
        throw error
      }
      throw new Error(`Failed to update employee schedule: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async deleteEmployeeSchedule(id: string, userId: string): Promise<ScheduleResult> {
    try {
      const { data, error } = await supabase
        .from('employee_schedules')
        .delete()
        .eq('id', id)
        .select()
        .single()

      if (error || !data) {
        throw new NotFoundError('Employee schedule not found')
      }

      return {
        success: true,
        message: 'Employee schedule deleted successfully'
      }
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error
      }
      throw new Error(`Failed to delete employee schedule: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async getSchedulesByEmployee(employeeId: string, startDate?: string, endDate?: string, type?: string): Promise<ScheduleResult> {
    try {
      let query = supabase
        .from('employee_schedules')
        .select('*')
        .eq('employee_id', employeeId)

      if (startDate && endDate) {
        query = query.gte('schedule_date', startDate).lte('schedule_date', endDate)
      }
      if (type) {
        query = query.eq('schedule_type', type)
      }

      query = query.order('schedule_date', { ascending: true })
      query = query.order('start_time', { ascending: true })

      const { data, error } = await query

      if (error) {
        throw new Error(`Failed to fetch employee schedules: ${error.message}`)
      }

      const schedules = data?.map(item => this.mapScheduleFromDB(item)) || []

      return {
        success: true,
        message: 'Employee schedules retrieved successfully',
        schedules
      }
    } catch (error) {
      throw new Error(`Failed to fetch employee schedules: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async getSchedulesByDateRange(startDate: string, endDate: string, employeeId?: string, type?: string): Promise<ScheduleResult> {
    try {
      let query = supabase
        .from('employee_schedules')
        .select(`
          *,
          employee:employees(id, full_name, employee_id)
        `)
        .gte('schedule_date', startDate)
        .lte('schedule_date', endDate)

      if (employeeId) {
        query = query.eq('employee_id', employeeId)
      }
      if (type) {
        query = query.eq('schedule_type', type)
      }

      query = query.order('schedule_date', { ascending: true })
      query = query.order('start_time', { ascending: true })

      const { data, error } = await query

      if (error) {
        throw new Error(`Failed to fetch schedules: ${error.message}`)
      }

      const schedules = data?.map(item => this.mapScheduleFromDB(item)) || []

      return {
        success: true,
        message: 'Schedules retrieved successfully',
        schedules
      }
    } catch (error) {
      throw new Error(`Failed to fetch schedules by date range: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Meeting Methods
  async createMeeting(meetingData: CreateMeetingData, userId: string): Promise<MeetingResult> {
    try {
      // Validate required fields
      if (!meetingData.title || !meetingData.startTime || !meetingData.endTime || !meetingData.organizerId) {
        throw new ValidationError('Missing required fields: title, startTime, endTime, organizerId')
      }

      // Check for conflicts for all attendees
      const allParticipants = [meetingData.organizerId, ...meetingData.attendeeIds]
      for (const participantId of allParticipants) {
        const conflictCheck = await this.checkScheduleConflicts(
          participantId,
          meetingData.startTime,
          meetingData.endTime
        )

        if (conflictCheck.hasConflicts) {
          throw new ConflictError(`Meeting conflicts with existing appointments for participant ${participantId}`)
        }
      }

      // Create meeting
      const { data, error } = await supabase
        .from('meetings')
        .insert({
          title: meetingData.title,
          description: meetingData.description,
          start_time: meetingData.startTime,
          end_time: meetingData.endTime,
          location: meetingData.location,
          meeting_type: meetingData.meetingType,
          organizer_id: meetingData.organizerId,
          attendee_ids: meetingData.attendeeIds,
          is_recurring: meetingData.isRecurring || false,
          recurring_pattern: meetingData.recurringPattern,
          recurring_end_date: meetingData.recurringEndDate,
          status: 'scheduled',
          meeting_link: meetingData.meetingLink,
          agenda: meetingData.agenda,
          created_by: userId
        })
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to create meeting: ${error.message}`)
      }

      return {
        success: true,
        message: 'Meeting created successfully',
        meeting: this.mapMeetingFromDB(data)
      }
    } catch (error) {
      if (error instanceof ValidationError || error instanceof ConflictError) {
        throw error
      }
      throw new Error(`Failed to create meeting: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async getMeetings(filters: MeetingFilters, page: number = 1, limit: number = 10): Promise<MeetingResult> {
    try {
      let query = supabase
        .from('meetings')
        .select(`
          *,
          organizer:employees!meetings_organizer_id_fkey(id, full_name, employee_id)
        `, { count: 'exact' })

      // Apply filters
      if (filters.startDate && filters.endDate) {
        query = query.gte('start_time', filters.startDate).lte('end_time', filters.endDate)
      }
      if (filters.meetingType) {
        query = query.eq('meeting_type', filters.meetingType)
      }
      if (filters.organizerId) {
        query = query.eq('organizer_id', filters.organizerId)
      }
      if (filters.attendeeId) {
        query = query.contains('attendee_ids', [filters.attendeeId])
      }

      // Apply pagination
      const offset = (page - 1) * limit
      query = query.range(offset, offset + limit - 1)
      query = query.order('start_time', { ascending: true })

      const { data, error, count } = await query

      if (error) {
        throw new Error(`Failed to fetch meetings: ${error.message}`)
      }

      const meetings = data?.map(item => this.mapMeetingFromDB(item)) || []
      const totalPages = Math.ceil((count || 0) / limit)

      return {
        success: true,
        message: 'Meetings retrieved successfully',
        meetings,
        pagination: {
          total: count || 0,
          page,
          limit,
          totalPages
        }
      }
    } catch (error) {
      throw new Error(`Failed to fetch meetings: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async getMeetingById(id: string): Promise<MeetingResult> {
    try {
      const { data, error } = await supabase
        .from('meetings')
        .select(`
          *,
          organizer:employees!meetings_organizer_id_fkey(id, full_name, employee_id)
        `)
        .eq('id', id)
        .single()

      if (error || !data) {
        throw new NotFoundError('Meeting not found')
      }

      return {
        success: true,
        message: 'Meeting retrieved successfully',
        meeting: this.mapMeetingFromDB(data)
      }
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error
      }
      throw new Error(`Failed to fetch meeting: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async updateMeeting(id: string, updateData: Partial<CreateMeetingData>, userId: string): Promise<MeetingResult> {
    try {
      // Check if meeting exists
      const existingMeeting = await this.getMeetingById(id)
      if (!existingMeeting.success) {
        throw new NotFoundError('Meeting not found')
      }

      // Check for conflicts if time is being updated
      if (updateData.startTime || updateData.endTime || updateData.attendeeIds) {
        const meeting = existingMeeting.meeting!
        const newStartTime = updateData.startTime || meeting.startTime
        const newEndTime = updateData.endTime || meeting.endTime
        const newAttendeeIds = updateData.attendeeIds || meeting.attendeeIds
        const organizerId = updateData.organizerId || meeting.organizerId

        const allParticipants = [organizerId, ...newAttendeeIds]
        for (const participantId of allParticipants) {
          const conflictCheck = await this.checkScheduleConflicts(
            participantId,
            newStartTime,
            newEndTime,
            id
          )

          if (conflictCheck.hasConflicts) {
            throw new ConflictError(`Meeting conflicts with existing appointments for participant ${participantId}`)
          }
        }
      }

      const { data, error } = await supabase
        .from('meetings')
        .update({
          ...updateData.title && { title: updateData.title },
          ...updateData.description !== undefined && { description: updateData.description },
          ...updateData.startTime && { start_time: updateData.startTime },
          ...updateData.endTime && { end_time: updateData.endTime },
          ...updateData.location !== undefined && { location: updateData.location },
          ...updateData.meetingType && { meeting_type: updateData.meetingType },
          ...updateData.organizerId && { organizer_id: updateData.organizerId },
          ...updateData.attendeeIds && { attendee_ids: updateData.attendeeIds },
          ...updateData.isRecurring !== undefined && { is_recurring: updateData.isRecurring },
          ...updateData.recurringPattern && { recurring_pattern: updateData.recurringPattern },
          ...updateData.recurringEndDate !== undefined && { recurring_end_date: updateData.recurringEndDate },
          ...updateData.meetingLink !== undefined && { meeting_link: updateData.meetingLink },
          ...updateData.agenda !== undefined && { agenda: updateData.agenda },
          updated_by: userId,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to update meeting: ${error.message}`)
      }

      return {
        success: true,
        message: 'Meeting updated successfully',
        meeting: this.mapMeetingFromDB(data)
      }
    } catch (error) {
      if (error instanceof ValidationError || error instanceof ConflictError || error instanceof NotFoundError) {
        throw error
      }
      throw new Error(`Failed to update meeting: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async deleteMeeting(id: string, userId: string): Promise<MeetingResult> {
    try {
      const { data, error } = await supabase
        .from('meetings')
        .delete()
        .eq('id', id)
        .select()
        .single()

      if (error || !data) {
        throw new NotFoundError('Meeting not found')
      }

      return {
        success: true,
        message: 'Meeting deleted successfully'
      }
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error
      }
      throw new Error(`Failed to delete meeting: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async getMeetingsByEmployee(employeeId: string, startDate?: string, endDate?: string, meetingType?: string): Promise<MeetingResult> {
    try {
      let query = supabase
        .from('meetings')
        .select('*')
        .or(`organizer_id.eq.${employeeId},attendee_ids.cs.{${employeeId}}`)

      if (startDate && endDate) {
        query = query.gte('start_time', startDate).lte('end_time', endDate)
      }
      if (meetingType) {
        query = query.eq('meeting_type', meetingType)
      }

      query = query.order('start_time', { ascending: true })

      const { data, error } = await query

      if (error) {
        throw new Error(`Failed to fetch employee meetings: ${error.message}`)
      }

      const meetings = data?.map(item => this.mapMeetingFromDB(item)) || []

      return {
        success: true,
        message: 'Employee meetings retrieved successfully',
        meetings
      }
    } catch (error) {
      throw new Error(`Failed to fetch employee meetings: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async getMeetingsByDateRange(startDate: string, endDate: string, employeeId?: string, meetingType?: string): Promise<MeetingResult> {
    try {
      let query = supabase
        .from('meetings')
        .select(`
          *,
          organizer:employees!meetings_organizer_id_fkey(id, full_name, employee_id)
        `)
        .gte('start_time', startDate)
        .lte('end_time', endDate)

      if (employeeId) {
        query = query.or(`organizer_id.eq.${employeeId},attendee_ids.cs.{${employeeId}}`)
      }
      if (meetingType) {
        query = query.eq('meeting_type', meetingType)
      }

      query = query.order('start_time', { ascending: true })

      const { data, error } = await query

      if (error) {
        throw new Error(`Failed to fetch meetings: ${error.message}`)
      }

      const meetings = data?.map(item => this.mapMeetingFromDB(item)) || []

      return {
        success: true,
        message: 'Meetings retrieved successfully',
        meetings
      }
    } catch (error) {
      throw new Error(`Failed to fetch meetings by date range: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Personal Schedule Methods
  async getMySchedule(userId: string, startDate?: string, endDate?: string, type?: string): Promise<ScheduleResult> {
    try {
      // Get employee ID from user ID
      const { data: employee, error: employeeError } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', userId)
        .single()

      if (employeeError || !employee) {
        throw new NotFoundError('Employee profile not found')
      }

      return await this.getSchedulesByEmployee(employee.id, startDate, endDate, type)
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error
      }
      throw new Error(`Failed to fetch your schedule: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async getMyMeetings(userId: string, startDate?: string, endDate?: string, meetingType?: string): Promise<MeetingResult> {
    try {
      // Get employee ID from user ID
      const { data: employee, error: employeeError } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', userId)
        .single()

      if (employeeError || !employee) {
        throw new NotFoundError('Employee profile not found')
      }

      return await this.getMeetingsByEmployee(employee.id, startDate, endDate, meetingType)
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error
      }
      throw new Error(`Failed to fetch your meetings: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async getTodaySchedule(userId: string): Promise<any> {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      // Get employee ID from user ID
      const { data: employee, error: employeeError } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', userId)
        .single()

      if (employeeError || !employee) {
        throw new NotFoundError('Employee profile not found')
      }

      // Get today's schedules
      const scheduleResult = await this.getSchedulesByEmployee(employee.id, today, today)
      
      // Get today's meetings
      const meetingResult = await this.getMeetingsByEmployee(employee.id, today, today)

      const todaySchedule = {
        schedules: scheduleResult.schedules || [],
        meetings: meetingResult.meetings || [],
        date: today
      }

      return {
        success: true,
        message: 'Today\'s schedule retrieved successfully',
        todaySchedule
      }
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error
      }
      throw new Error(`Failed to fetch today's schedule: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async getCalendarView(year: number, month: number, employeeId?: string): Promise<any> {
    try {
      const startDate = `${year}-${month.toString().padStart(2, '0')}-01`
      const endDate = new Date(year, month, 0).toISOString().split('T')[0] // Last day of month

      let scheduleResult: ScheduleResult
      let meetingResult: MeetingResult

      if (employeeId) {
        scheduleResult = await this.getSchedulesByEmployee(employeeId, startDate, endDate)
        meetingResult = await this.getMeetingsByEmployee(employeeId, startDate, endDate)
      } else {
        scheduleResult = await this.getSchedulesByDateRange(startDate, endDate)
        meetingResult = await this.getMeetingsByDateRange(startDate, endDate)
      }

      const calendar = {
        year,
        month,
        schedules: scheduleResult.schedules || [],
        meetings: meetingResult.meetings || [],
        startDate,
        endDate
      }

      return {
        success: true,
        message: 'Calendar view retrieved successfully',
        calendar
      }
    } catch (error) {
      throw new Error(`Failed to fetch calendar view: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async checkScheduleConflicts(employeeId: string, startTime: string, endTime: string, excludeId?: string): Promise<ConflictCheckResult> {
    try {
      const conflicts: Array<{
        id: string
        title: string
        startTime: string
        endTime: string
        type: 'schedule' | 'meeting'
      }> = []

      // Check employee schedules
      let scheduleQuery = supabase
        .from('employee_schedules')
        .select('id, title, schedule_date, start_time, end_time')
        .eq('employee_id', employeeId)
        .eq('schedule_date', startTime.split('T')[0])
        .or(`start_time.lt.${endTime.split('T')[1]},end_time.gt.${startTime.split('T')[1]}`)

      if (excludeId) {
        scheduleQuery = scheduleQuery.neq('id', excludeId)
      }

      const { data: scheduleConflicts, error: scheduleError } = await scheduleQuery

      if (scheduleError) {
        throw new Error(`Failed to check schedule conflicts: ${scheduleError.message}`)
      }

      if (scheduleConflicts) {
        conflicts.push(...scheduleConflicts.map(item => ({
          id: item.id,
          title: item.title,
          startTime: `${item.schedule_date}T${item.start_time}`,
          endTime: `${item.schedule_date}T${item.end_time}`,
          type: 'schedule' as const
        })))
      }

      // Check meetings
      let meetingQuery = supabase
        .from('meetings')
        .select('id, title, start_time, end_time')
        .or(`organizer_id.eq.${employeeId},attendee_ids.cs.{${employeeId}}`)
        .lt('start_time', endTime)
        .gt('end_time', startTime)

      if (excludeId) {
        meetingQuery = meetingQuery.neq('id', excludeId)
      }

      const { data: meetingConflicts, error: meetingError } = await meetingQuery

      if (meetingError) {
        throw new Error(`Failed to check meeting conflicts: ${meetingError.message}`)
      }

      if (meetingConflicts) {
        conflicts.push(...meetingConflicts.map(item => ({
          id: item.id,
          title: item.title,
          startTime: item.start_time,
          endTime: item.end_time,
          type: 'meeting' as const
        })))
      }

      return {
        success: true,
        message: conflicts.length > 0 ? 'Schedule conflicts found' : 'No schedule conflicts',
        conflicts,
        hasConflicts: conflicts.length > 0
      }
    } catch (error) {
      throw new Error(`Failed to check schedule conflicts: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Helper methods to map database objects to interface objects
  private mapScheduleFromDB(data: any): EmployeeSchedule {
    return {
      id: data.id,
      employeeId: data.employee_id,
      scheduleDate: data.schedule_date,
      startTime: data.start_time,
      endTime: data.end_time,
      scheduleType: data.schedule_type,
      title: data.title,
      description: data.description,
      location: data.location,
      isRecurring: data.is_recurring,
      recurringPattern: data.recurring_pattern,
      recurringEndDate: data.recurring_end_date,
      status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      createdBy: data.created_by,
      updatedBy: data.updated_by
    }
  }

  private mapMeetingFromDB(data: any): Meeting {
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      startTime: data.start_time,
      endTime: data.end_time,
      location: data.location,
      meetingType: data.meeting_type,
      organizerId: data.organizer_id,
      attendeeIds: data.attendee_ids || [],
      isRecurring: data.is_recurring,
      recurringPattern: data.recurring_pattern,
      recurringEndDate: data.recurring_end_date,
      status: data.status,
      meetingLink: data.meeting_link,
      agenda: data.agenda,
      notes: data.notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      createdBy: data.created_by,
      updatedBy: data.updated_by
    }
  }
}