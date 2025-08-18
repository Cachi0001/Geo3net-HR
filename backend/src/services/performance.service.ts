import { supabase } from '../config/database'
import { NotFoundError, ConflictError, ValidationError } from '../utils/errors'

export interface PerformanceCycle {
  id: string
  name: string
  description?: string
  startDate: string
  endDate: string
  reviewDeadline?: string
  status: 'planning' | 'active' | 'review' | 'completed' | 'cancelled'
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface PerformanceGoal {
  id: string
  employeeId: string
  cycleId: string
  title: string
  description?: string
  targetValue?: string
  weight: number
  status: 'draft' | 'active' | 'achieved' | 'not_achieved' | 'cancelled'
  selfRating?: number
  managerRating?: number
  finalRating?: number
  achievementNotes?: string
  createdAt: string
  updatedAt: string
  // Employee details for display
  employeeName?: string
  cycleName?: string
}

export interface PerformanceReview {
  id: string
  employeeId: string
  reviewerId: string
  cycleId: string
  overallRating?: number
  strengths?: string
  areasForImprovement?: string
  developmentPlan?: string
  goalsForNextPeriod?: string
  employeeComments?: string
  managerComments?: string
  hrComments?: string
  status: 'draft' | 'self_review' | 'manager_review' | 'hr_review' | 'completed'
  selfReviewCompletedAt?: string
  managerReviewCompletedAt?: string
  hrReviewCompletedAt?: string
  finalReviewDate?: string
  createdAt: string
  updatedAt: string
  // Related data for display
  employeeName?: string
  reviewerName?: string
  cycleName?: string
  goals?: PerformanceGoal[]
}

export interface CreatePerformanceCycleData {
  name: string
  description?: string
  startDate: string
  endDate: string
  reviewDeadline?: string
}

export interface CreatePerformanceGoalData {
  employeeId: string
  cycleId: string
  title: string
  description?: string
  targetValue?: string
  weight?: number
}

export interface UpdatePerformanceGoalData {
  title?: string
  description?: string
  targetValue?: string
  weight?: number
  status?: 'draft' | 'active' | 'achieved' | 'not_achieved' | 'cancelled'
  selfRating?: number
  managerRating?: number
  finalRating?: number
  achievementNotes?: string
}

export interface CreatePerformanceReviewData {
  employeeId: string
  reviewerId: string
  cycleId: string
}

export interface UpdatePerformanceReviewData {
  overallRating?: number
  strengths?: string
  areasForImprovement?: string
  developmentPlan?: string
  goalsForNextPeriod?: string
  employeeComments?: string
  managerComments?: string
  hrComments?: string
  status?: 'draft' | 'self_review' | 'manager_review' | 'hr_review' | 'completed'
}

export interface PerformanceSearchFilters {
  employeeId?: string
  cycleId?: string
  reviewerId?: string
  status?: string
  search?: string
  limit?: number
  offset?: number
}

export interface PerformanceResult {
  success: boolean
  message: string
  cycle?: PerformanceCycle
  cycles?: PerformanceCycle[]
  goal?: PerformanceGoal
  goals?: PerformanceGoal[]
  review?: PerformanceReview
  reviews?: PerformanceReview[]
  total?: number
}

export class PerformanceService {
  // Performance Cycle Methods
  async createPerformanceCycle(data: CreatePerformanceCycleData, createdBy: string): Promise<PerformanceResult> {
    try {
      this.validatePerformanceCycleData(data)

      // Check for overlapping cycles
      const { data: existingCycles, error: checkError } = await supabase
        .from('performance_cycles')
        .select('*')
        .or(`start_date.lte.${data.endDate},end_date.gte.${data.startDate}`)
        .neq('status', 'cancelled')

      if (checkError) throw checkError

      if (existingCycles && existingCycles.length > 0) {
        throw new ConflictError('Performance cycle overlaps with existing cycle')
      }

      const { data: newCycle, error } = await supabase
        .from('performance_cycles')
        .insert({
          name: data.name,
          description: data.description,
          start_date: data.startDate,
          end_date: data.endDate,
          review_deadline: data.reviewDeadline,
          status: 'planning',
          created_by: createdBy
        })
        .select()
        .single()

      if (error) throw error

      return {
        success: true,
        message: 'Performance cycle created successfully',
        cycle: this.mapDatabaseToPerformanceCycle(newCycle)
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to create performance cycle'
      }
    }
  }

  async getPerformanceCycles(filters: PerformanceSearchFilters = {}): Promise<PerformanceResult> {
    try {
      let query = supabase
        .from('performance_cycles')
        .select('*', { count: 'exact' })
        .order('start_date', { ascending: false })

      if (filters.status) {
        query = query.eq('status', filters.status)
      }

      if (filters.search) {
        query = query.ilike('name', `%${filters.search}%`)
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
        message: 'Performance cycles retrieved successfully',
        cycles: data?.map(this.mapDatabaseToPerformanceCycle) || [],
        total: count || 0
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to retrieve performance cycles'
      }
    }
  }

  async getPerformanceCycleById(id: string): Promise<PerformanceResult> {
    try {
      const { data, error } = await supabase
        .from('performance_cycles')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      if (!data) throw new NotFoundError('Performance cycle not found')

      return {
        success: true,
        message: 'Performance cycle retrieved successfully',
        cycle: this.mapDatabaseToPerformanceCycle(data)
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to retrieve performance cycle'
      }
    }
  }

  async updatePerformanceCycleStatus(id: string, status: PerformanceCycle['status']): Promise<PerformanceResult> {
    try {
      const { data, error } = await supabase
        .from('performance_cycles')
        .update({ status })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      if (!data) throw new NotFoundError('Performance cycle not found')

      return {
        success: true,
        message: 'Performance cycle status updated successfully',
        cycle: this.mapDatabaseToPerformanceCycle(data)
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to update performance cycle status'
      }
    }
  }

  // Performance Goal Methods
  async createPerformanceGoal(data: CreatePerformanceGoalData): Promise<PerformanceResult> {
    try {
      this.validatePerformanceGoalData(data)

      const { data: newGoal, error } = await supabase
        .from('performance_goals')
        .insert({
          employee_id: data.employeeId,
          cycle_id: data.cycleId,
          title: data.title,
          description: data.description,
          target_value: data.targetValue,
          weight: data.weight || 0,
          status: 'draft'
        })
        .select(`
          *,
          users!performance_goals_employee_id_fkey(full_name),
          performance_cycles(name)
        `)
        .single()

      if (error) throw error

      return {
        success: true,
        message: 'Performance goal created successfully',
        goal: this.mapDatabaseToPerformanceGoal(newGoal)
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to create performance goal'
      }
    }
  }

  async getPerformanceGoals(filters: PerformanceSearchFilters = {}): Promise<PerformanceResult> {
    try {
      let query = supabase
        .from('performance_goals')
        .select(`
          *,
          users!performance_goals_employee_id_fkey(full_name),
          performance_cycles(name)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })

      if (filters.employeeId) {
        query = query.eq('employee_id', filters.employeeId)
      }

      if (filters.cycleId) {
        query = query.eq('cycle_id', filters.cycleId)
      }

      if (filters.status) {
        query = query.eq('status', filters.status)
      }

      if (filters.search) {
        query = query.ilike('title', `%${filters.search}%`)
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
        message: 'Performance goals retrieved successfully',
        goals: data?.map(this.mapDatabaseToPerformanceGoal) || [],
        total: count || 0
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to retrieve performance goals'
      }
    }
  }

  async updatePerformanceGoal(id: string, data: UpdatePerformanceGoalData): Promise<PerformanceResult> {
    try {
      const updateData: any = {}

      if (data.title !== undefined) updateData.title = data.title
      if (data.description !== undefined) updateData.description = data.description
      if (data.targetValue !== undefined) updateData.target_value = data.targetValue
      if (data.weight !== undefined) updateData.weight = data.weight
      if (data.status !== undefined) updateData.status = data.status
      if (data.selfRating !== undefined) updateData.self_rating = data.selfRating
      if (data.managerRating !== undefined) updateData.manager_rating = data.managerRating
      if (data.finalRating !== undefined) updateData.final_rating = data.finalRating
      if (data.achievementNotes !== undefined) updateData.achievement_notes = data.achievementNotes

      const { data: updatedGoal, error } = await supabase
        .from('performance_goals')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          users!performance_goals_employee_id_fkey(full_name),
          performance_cycles(name)
        `)
        .single()

      if (error) throw error
      if (!updatedGoal) throw new NotFoundError('Performance goal not found')

      return {
        success: true,
        message: 'Performance goal updated successfully',
        goal: this.mapDatabaseToPerformanceGoal(updatedGoal)
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to update performance goal'
      }
    }
  }

  // Performance Review Methods
  async createPerformanceReview(data: CreatePerformanceReviewData): Promise<PerformanceResult> {
    try {
      this.validatePerformanceReviewData(data)

      // Check if review already exists for this employee and cycle
      const { data: existing, error: checkError } = await supabase
        .from('performance_reviews')
        .select('id')
        .eq('employee_id', data.employeeId)
        .eq('cycle_id', data.cycleId)
        .single()

      if (existing) {
        throw new ConflictError('Performance review already exists for this employee and cycle')
      }

      const { data: newReview, error } = await supabase
        .from('performance_reviews')
        .insert({
          employee_id: data.employeeId,
          reviewer_id: data.reviewerId,
          cycle_id: data.cycleId,
          status: 'draft'
        })
        .select(`
          *,
          users!performance_reviews_employee_id_fkey(full_name),
          reviewer:users!performance_reviews_reviewer_id_fkey(full_name),
          performance_cycles(name)
        `)
        .single()

      if (error) throw error

      return {
        success: true,
        message: 'Performance review created successfully',
        review: this.mapDatabaseToPerformanceReview(newReview)
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to create performance review'
      }
    }
  }

  async getPerformanceReviews(filters: PerformanceSearchFilters = {}): Promise<PerformanceResult> {
    try {
      let query = supabase
        .from('performance_reviews')
        .select(`
          *,
          users!performance_reviews_employee_id_fkey(full_name),
          reviewer:users!performance_reviews_reviewer_id_fkey(full_name),
          performance_cycles(name)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })

      if (filters.employeeId) {
        query = query.eq('employee_id', filters.employeeId)
      }

      if (filters.reviewerId) {
        query = query.eq('reviewer_id', filters.reviewerId)
      }

      if (filters.cycleId) {
        query = query.eq('cycle_id', filters.cycleId)
      }

      if (filters.status) {
        query = query.eq('status', filters.status)
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
        message: 'Performance reviews retrieved successfully',
        reviews: data?.map(this.mapDatabaseToPerformanceReview) || [],
        total: count || 0
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to retrieve performance reviews'
      }
    }
  }

  async getPerformanceReviewById(id: string): Promise<PerformanceResult> {
    try {
      const { data, error } = await supabase
        .from('performance_reviews')
        .select(`
          *,
          users!performance_reviews_employee_id_fkey(full_name),
          reviewer:users!performance_reviews_reviewer_id_fkey(full_name),
          performance_cycles(name)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      if (!data) throw new NotFoundError('Performance review not found')

      // Get associated goals
      const { data: goals } = await supabase
        .from('performance_goals')
        .select(`
          *,
          users!performance_goals_employee_id_fkey(full_name),
          performance_cycles(name)
        `)
        .eq('employee_id', data.employee_id)
        .eq('cycle_id', data.cycle_id)

      const review = this.mapDatabaseToPerformanceReview(data)
      if (goals) {
        review.goals = goals.map(this.mapDatabaseToPerformanceGoal)
      }

      return {
        success: true,
        message: 'Performance review retrieved successfully',
        review
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to retrieve performance review'
      }
    }
  }

  async updatePerformanceReview(id: string, data: UpdatePerformanceReviewData): Promise<PerformanceResult> {
    try {
      const updateData: any = {}

      if (data.overallRating !== undefined) updateData.overall_rating = data.overallRating
      if (data.strengths !== undefined) updateData.strengths = data.strengths
      if (data.areasForImprovement !== undefined) updateData.areas_for_improvement = data.areasForImprovement
      if (data.developmentPlan !== undefined) updateData.development_plan = data.developmentPlan
      if (data.goalsForNextPeriod !== undefined) updateData.goals_for_next_period = data.goalsForNextPeriod
      if (data.employeeComments !== undefined) updateData.employee_comments = data.employeeComments
      if (data.managerComments !== undefined) updateData.manager_comments = data.managerComments
      if (data.hrComments !== undefined) updateData.hr_comments = data.hrComments
      if (data.status !== undefined) {
        updateData.status = data.status
        
        // Set completion timestamps based on status
        const now = new Date().toISOString()
        if (data.status === 'self_review') {
          updateData.self_review_completed_at = now
        } else if (data.status === 'manager_review') {
          updateData.manager_review_completed_at = now
        } else if (data.status === 'hr_review') {
          updateData.hr_review_completed_at = now
        } else if (data.status === 'completed') {
          updateData.final_review_date = new Date().toISOString().split('T')[0]
        }
      }

      const { data: updatedReview, error } = await supabase
        .from('performance_reviews')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          users!performance_reviews_employee_id_fkey(full_name),
          reviewer:users!performance_reviews_reviewer_id_fkey(full_name),
          performance_cycles(name)
        `)
        .single()

      if (error) throw error
      if (!updatedReview) throw new NotFoundError('Performance review not found')

      return {
        success: true,
        message: 'Performance review updated successfully',
        review: this.mapDatabaseToPerformanceReview(updatedReview)
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to update performance review'
      }
    }
  }

  // Helper Methods
  private validatePerformanceCycleData(data: CreatePerformanceCycleData): void {
    if (!data.name?.trim()) {
      throw new ValidationError('Cycle name is required')
    }
    if (!data.startDate) {
      throw new ValidationError('Start date is required')
    }
    if (!data.endDate) {
      throw new ValidationError('End date is required')
    }
    if (new Date(data.startDate) >= new Date(data.endDate)) {
      throw new ValidationError('End date must be after start date')
    }
    if (data.reviewDeadline && new Date(data.reviewDeadline) <= new Date(data.endDate)) {
      throw new ValidationError('Review deadline must be after cycle end date')
    }
  }

  private validatePerformanceGoalData(data: CreatePerformanceGoalData): void {
    if (!data.employeeId) {
      throw new ValidationError('Employee ID is required')
    }
    if (!data.cycleId) {
      throw new ValidationError('Cycle ID is required')
    }
    if (!data.title?.trim()) {
      throw new ValidationError('Goal title is required')
    }
    if (data.weight !== undefined && (data.weight < 0 || data.weight > 100)) {
      throw new ValidationError('Goal weight must be between 0 and 100')
    }
  }

  private validatePerformanceReviewData(data: CreatePerformanceReviewData): void {
    if (!data.employeeId) {
      throw new ValidationError('Employee ID is required')
    }
    if (!data.reviewerId) {
      throw new ValidationError('Reviewer ID is required')
    }
    if (!data.cycleId) {
      throw new ValidationError('Cycle ID is required')
    }
  }

  private mapDatabaseToPerformanceCycle(data: any): PerformanceCycle {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      startDate: data.start_date,
      endDate: data.end_date,
      reviewDeadline: data.review_deadline,
      status: data.status,
      createdBy: data.created_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }
  }

  private mapDatabaseToPerformanceGoal(data: any): PerformanceGoal {
    return {
      id: data.id,
      employeeId: data.employee_id,
      cycleId: data.cycle_id,
      title: data.title,
      description: data.description,
      targetValue: data.target_value,
      weight: data.weight,
      status: data.status,
      selfRating: data.self_rating,
      managerRating: data.manager_rating,
      finalRating: data.final_rating,
      achievementNotes: data.achievement_notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      employeeName: data.users?.full_name,
      cycleName: data.performance_cycles?.name
    }
  }

  private mapDatabaseToPerformanceReview(data: any): PerformanceReview {
    return {
      id: data.id,
      employeeId: data.employee_id,
      reviewerId: data.reviewer_id,
      cycleId: data.cycle_id,
      overallRating: data.overall_rating,
      strengths: data.strengths,
      areasForImprovement: data.areas_for_improvement,
      developmentPlan: data.development_plan,
      goalsForNextPeriod: data.goals_for_next_period,
      employeeComments: data.employee_comments,
      managerComments: data.manager_comments,
      hrComments: data.hr_comments,
      status: data.status,
      selfReviewCompletedAt: data.self_review_completed_at,
      managerReviewCompletedAt: data.manager_review_completed_at,
      hrReviewCompletedAt: data.hr_review_completed_at,
      finalReviewDate: data.final_review_date,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      employeeName: data.users?.full_name,
      reviewerName: data.reviewer?.full_name,
      cycleName: data.performance_cycles?.name
    }
  }
}