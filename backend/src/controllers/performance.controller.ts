import { Request, Response } from 'express'
import { PerformanceService, CreatePerformanceCycleData, CreatePerformanceGoalData, UpdatePerformanceGoalData, CreatePerformanceReviewData, UpdatePerformanceReviewData, PerformanceSearchFilters } from '../services/performance.service'
import { ResponseHandler } from '../utils/response'
import { ValidationError, NotFoundError, ConflictError } from '../utils/errors'
import { AuthenticatedRequest } from '../middleware/permission'
import { auditService } from '../services/audit.service'

export class PerformanceController {
  private performanceService: PerformanceService

  constructor() {
    this.performanceService = new PerformanceService()
  }

  // Performance Cycle Methods
  /**
   * Create a new performance cycle
   * POST /api/performance/cycles
   */
  async createPerformanceCycle(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const cycleData: CreatePerformanceCycleData = req.body
      const userId = req.user?.id!

      const result = await this.performanceService.createPerformanceCycle(cycleData, userId)

      if (result.success) {
        // Log audit trail
        await auditService.logUserAction(userId, 'create_performance_cycle', {
          entityType: 'performance_cycle',
          entityId: result.cycle?.id,
          newValues: cycleData,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        })

        return ResponseHandler.created(res, result.message, {
          performanceCycle: result.cycle
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
      return ResponseHandler.internalError(res, 'Failed to create performance cycle')
    }
  }

  /**
   * Get all performance cycles with optional filtering
   * GET /api/performance/cycles
   */
  async getPerformanceCycles(req: Request, res: Response): Promise<Response> {
    try {
      const filters: PerformanceSearchFilters = {
        status: req.query.status as string,

        search: req.query.search as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
      }

      const result = await this.performanceService.getPerformanceCycles(filters)

      if (result.success) {
        return ResponseHandler.success(res, result.message, {
          performanceCycles: result.cycles,
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
      return ResponseHandler.internalError(res, 'Failed to retrieve performance cycles')
    }
  }

  /**
   * Get performance cycle by ID
   * GET /api/performance/cycles/:id
   */
  async getPerformanceCycleById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params
      const result = await this.performanceService.getPerformanceCycleById(id)

      if (result.success) {
        return ResponseHandler.success(res, result.message, {
          performanceCycle: result.cycle
        })
      }

      return ResponseHandler.notFound(res, result.message)
    } catch (error) {
      return ResponseHandler.internalError(res, 'Failed to retrieve performance cycle')
    }
  }

  /**
   * Update performance cycle
   * PUT /api/performance/cycles/:id
   */
  async updatePerformanceCycle(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params
      const updateData: { status: 'planning' | 'active' | 'review' | 'completed' | 'cancelled' } = req.body
      const userId = req.user?.id!

      // Get current data for audit log
      const currentResult = await this.performanceService.getPerformanceCycleById(id)
      const oldValues = currentResult.cycle

      const result = await this.performanceService.updatePerformanceCycleStatus(id, updateData.status)

      if (result.success) {
        // Log audit trail
        await auditService.logDataChange(
          userId,
          'performance_cycle',
          id,
          oldValues || {},
          updateData,
          req.ip,
          req.get('User-Agent')
        )

        return ResponseHandler.success(res, result.message, {
          performanceCycle: result.cycle
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
      return ResponseHandler.internalError(res, 'Failed to update performance cycle')
    }
  }

  // Performance Goal Methods
  /**
   * Create a new performance goal
   * POST /api/performance/goals
   */
  async createPerformanceGoal(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const goalData: CreatePerformanceGoalData = req.body
      const userId = req.user?.id!

      const result = await this.performanceService.createPerformanceGoal(goalData)

      if (result.success) {
        // Log audit trail
        await auditService.logUserAction(userId, 'create_performance_goal', {
          entityType: 'performance_goal',
          entityId: result.goal?.id,
          newValues: goalData,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        })

        return ResponseHandler.created(res, result.message, {
          performanceGoal: result.goal
        })
      }

      return ResponseHandler.badRequest(res, result.message)
    } catch (error) {
      if (error instanceof ValidationError) {
        return ResponseHandler.validationError(res, error.errors || [error.message])
      }
      return ResponseHandler.internalError(res, 'Failed to create performance goal')
    }
  }

  /**
   * Get all performance goals with optional filtering
   * GET /api/performance/goals
   */
  async getPerformanceGoals(req: Request, res: Response): Promise<Response> {
    try {
      const filters: PerformanceSearchFilters = {
        employeeId: req.query.employeeId as string,
        cycleId: req.query.cycleId as string,
        status: req.query.status as string,
        search: req.query.search as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
      }

      const result = await this.performanceService.getPerformanceGoals(filters)

      if (result.success) {
        return ResponseHandler.success(res, result.message, {
          performanceGoals: result.goals,
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
      return ResponseHandler.internalError(res, 'Failed to retrieve performance goals')
    }
  }

  /**
   * Get performance goal by ID
   * GET /api/performance/goals/:id
   */
  async getPerformanceGoalById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params
      const result = await this.performanceService.getPerformanceGoals({ employeeId: id })

      if (result.success) {
        return ResponseHandler.success(res, result.message, {
          performanceGoal: result.goal
        })
      }

      return ResponseHandler.notFound(res, result.message)
    } catch (error) {
      return ResponseHandler.internalError(res, 'Failed to retrieve performance goal')
    }
  }

  /**
   * Update performance goal
   * PUT /api/performance/goals/:id
   */
  async updatePerformanceGoal(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params
      const updateData: UpdatePerformanceGoalData = req.body
      const userId = req.user?.id!

      // Get current data for audit log
      const currentResult = await this.performanceService.getPerformanceGoals({ employeeId: id })
      const oldValues = currentResult.goals?.[0]

      const result = await this.performanceService.updatePerformanceGoal(id, updateData)

      if (result.success) {
        // Log audit trail
        await auditService.logDataChange(
          userId,
          'performance_goal',
          id,
          oldValues || {},
          updateData,
          req.ip,
          req.get('User-Agent')
        )

        return ResponseHandler.success(res, result.message, {
          performanceGoal: result.goals?.[0]
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
      return ResponseHandler.internalError(res, 'Failed to update performance goal')
    }
  }

  // Performance Review Methods
  /**
   * Create a new performance review
   * POST /api/performance/reviews
   */
  async createPerformanceReview(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const reviewData: CreatePerformanceReviewData = req.body
      const userId = req.user?.id!

      const result = await this.performanceService.createPerformanceReview(reviewData)

      if (result.success) {
        // Log audit trail
        await auditService.logUserAction(userId, 'create_performance_review', {
          entityType: 'performance_review',
          entityId: result.review?.id,
          newValues: reviewData,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        })

        return ResponseHandler.created(res, result.message, {
          performanceReview: result.review
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
      return ResponseHandler.internalError(res, 'Failed to create performance review')
    }
  }

  /**
   * Get all performance reviews with optional filtering
   * GET /api/performance/reviews
   */
  async getPerformanceReviews(req: Request, res: Response): Promise<Response> {
    try {
      const filters: PerformanceSearchFilters = {
        employeeId: req.query.employeeId as string,
        cycleId: req.query.cycleId as string,
        reviewerId: req.query.reviewerId as string,
        status: req.query.status as string,
        search: req.query.search as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
      }

      const result = await this.performanceService.getPerformanceReviews(filters)

      if (result.success) {
        return ResponseHandler.success(res, result.message, {
          performanceReviews: result.reviews,
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
      return ResponseHandler.internalError(res, 'Failed to retrieve performance reviews')
    }
  }

  /**
   * Get performance review by ID
   * GET /api/performance/reviews/:id
   */
  async getPerformanceReviewById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params
      const result = await this.performanceService.getPerformanceReviewById(id)

      if (result.success) {
        return ResponseHandler.success(res, result.message, {
          performanceReview: result.review
        })
      }

      return ResponseHandler.notFound(res, result.message)
    } catch (error) {
      return ResponseHandler.internalError(res, 'Failed to retrieve performance review')
    }
  }

  /**
   * Update performance review
   * PUT /api/performance/reviews/:id
   */
  async updatePerformanceReview(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params
      const updateData: UpdatePerformanceReviewData = req.body
      const userId = req.user?.id!

      // Get current data for audit log
      const currentResult = await this.performanceService.getPerformanceReviewById(id)
      const oldValues = currentResult.review

      const result = await this.performanceService.updatePerformanceReview(id, updateData)

      if (result.success) {
        // Log audit trail
        await auditService.logDataChange(
          userId,
          'performance_review',
          id,
          oldValues || {},
          updateData,
          req.ip,
          req.get('User-Agent')
        )

        return ResponseHandler.success(res, result.message, {
          performanceReview: result.review
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
      return ResponseHandler.internalError(res, 'Failed to update performance review')
    }
  }

  /**
   * Get employee performance summary
   * GET /api/performance/employees/:employeeId/summary
   */
  async getEmployeePerformanceSummary(req: Request, res: Response): Promise<Response> {
    try {
      const { employeeId } = req.params
      const cycleId = req.query.cycleId as string

      // Get goals for the employee
      const goalsResult = await this.performanceService.getPerformanceGoals({
        employeeId,
        cycleId
      })

      // Get reviews for the employee
      const reviewsResult = await this.performanceService.getPerformanceReviews({
        employeeId,
        cycleId
      })

      if (goalsResult.success && reviewsResult.success) {
        const goals = goalsResult.goals || []
        const reviews = reviewsResult.reviews || []

        const summary = {
          totalGoals: goals.length,
          completedGoals: goals.filter((g: any) => g.status === 'completed').length,
            inProgressGoals: goals.filter((g: any) => g.status === 'in_progress').length,
            notStartedGoals: goals.filter((g: any) => g.status === 'not_started').length,
            averageGoalProgress: goals.length > 0 ? goals.reduce((sum: number, g: any) => sum + g.progress, 0) / goals.length : 0,
          totalReviews: reviews.length,
          completedReviews: reviews.filter((r: any) => r.status === 'completed').length,
            averageOverallRating: reviews.filter((r: any) => r.overallRating).length > 0 
              ? reviews.filter((r: any) => r.overallRating).reduce((sum: number, r: any) => sum + (r.overallRating || 0), 0) / reviews.filter((r: any) => r.overallRating).length 
            : 0
        }

        return ResponseHandler.success(res, 'Employee performance summary retrieved successfully', {
          summary,
          goals,
          reviews
        })
      }

      return ResponseHandler.badRequest(res, 'Failed to retrieve performance data')
    } catch (error) {
      return ResponseHandler.internalError(res, 'Failed to retrieve employee performance summary')
    }
  }

  /**
   * Get performance analytics for a cycle
   * GET /api/performance/cycles/:cycleId/analytics
   */
  async getPerformanceAnalytics(req: Request, res: Response): Promise<Response> {
    try {
      const { cycleId } = req.params

      // Get all goals for the cycle
      const goalsResult = await this.performanceService.getPerformanceGoals({ cycleId })
      
      // Get all reviews for the cycle
      const reviewsResult = await this.performanceService.getPerformanceReviews({ cycleId })

      if (goalsResult.success && reviewsResult.success) {
        const goals = goalsResult.goals || []
        const reviews = reviewsResult.reviews || []

        const analytics = {
          goalAnalytics: {
            total: goals.length,
            byStatus: {
              completed: goals.filter((g: any) => g.status === 'completed').length,
            inProgress: goals.filter((g: any) => g.status === 'in_progress').length,
            notStarted: goals.filter((g: any) => g.status === 'not_started').length
          },
          averageProgress: goals.length > 0 ? goals.reduce((sum: number, g: any) => sum + g.progress, 0) / goals.length : 0
          },
          reviewAnalytics: {
            total: reviews.length,
            byStatus: {
              completed: reviews.filter((r: any) => r.status === 'completed').length,
            inProgress: reviews.filter((r: any) => r.status === 'in_progress').length,
            draft: reviews.filter((r: any) => r.status === 'draft').length
          },
          averageRating: reviews.filter((r: any) => r.overallRating).length > 0 
            ? reviews.filter((r: any) => r.overallRating).reduce((sum: number, r: any) => sum + (r.overallRating || 0), 0) / reviews.filter((r: any) => r.overallRating).length 
              : 0,
            ratingDistribution: {
              excellent: reviews.filter((r: any) => r.overallRating && r.overallRating >= 4.5).length,
              good: reviews.filter((r: any) => r.overallRating && r.overallRating >= 3.5 && r.overallRating < 4.5).length,
              satisfactory: reviews.filter((r: any) => r.overallRating && r.overallRating >= 2.5 && r.overallRating < 3.5).length,
              needsImprovement: reviews.filter((r: any) => r.overallRating && r.overallRating < 2.5).length
            }
          }
        }

        return ResponseHandler.success(res, 'Performance analytics retrieved successfully', {
          analytics
        })
      }

      return ResponseHandler.badRequest(res, 'Failed to retrieve performance data')
    } catch (error) {
      return ResponseHandler.internalError(res, 'Failed to retrieve performance analytics')
    }
  }

  /**
   * Get my reviews
   * GET /api/performance/my-reviews
   */
  async getMyReviews(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id!

      const result = await this.performanceService.getPerformanceReviews({ employeeId: userId })

      if (result.success) {
        return ResponseHandler.success(res, 'Reviews retrieved successfully', {
          reviews: result.reviews
        })
      }

      return ResponseHandler.notFound(res, result.message)
    } catch (error) {
      return ResponseHandler.internalError(res, 'Failed to retrieve reviews')
    }
  }

  /**
   * Get my performance summary
   * GET /api/performance/my-summary
   */
  async getMyPerformanceSummary(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id!

      const result = await this.performanceService.getPerformanceReviews({ employeeId: userId })

      if (result.success) {
        return ResponseHandler.success(res, 'Performance summary retrieved successfully', {
          reviews: result.reviews,
          total: result.total
        })
      }

      return ResponseHandler.notFound(res, result.message)
    } catch (error) {
      return ResponseHandler.internalError(res, 'Failed to retrieve performance summary')
    }
  }

  /**
   * Get my goals
   * GET /api/performance/my-goals
   */
  async getMyGoals(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id!

      const result = await this.performanceService.getPerformanceGoals({ employeeId: userId })

      if (result.success) {
        return ResponseHandler.success(res, 'Goals retrieved successfully', {
          goals: result.goals,
          total: result.total
        })
      }

      return ResponseHandler.badRequest(res, result.message)
    } catch (error) {
      return ResponseHandler.internalError(res, 'Failed to retrieve goals')
    }
  }


  async getEmployeeReviews(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { employeeId } = req.params
      const userId = req.user?.id!

      const result = await this.performanceService.getPerformanceReviews({ employeeId })

      if (result.success) {
        // Log audit trail
        await auditService.logUserAction(userId, 'view_employee_reviews', {
          entityType: 'employee',
          entityId: employeeId
        })

        return ResponseHandler.success(res, 'Employee reviews retrieved successfully', {
          reviews: result.reviews
        })
      }

      return ResponseHandler.notFound(res, result.message)
    } catch (error) {
      return ResponseHandler.internalError(res, 'Failed to retrieve employee reviews')
    }
  }

  /**
   * Get cycle report
   * GET /api/performance/cycles/:cycleId/report
   */
  async getCycleReport(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { cycleId } = req.params
      const userId = req.user?.id!
      
      const result = await this.performanceService.getPerformanceCycleById(cycleId)
      
      if (result.success) {
        // Log audit trail
        await auditService.logUserAction(userId, 'view_cycle_report', {
          entityType: 'performance_cycle',
          entityId: cycleId
        })
        
        return ResponseHandler.success(res, 'Cycle report retrieved successfully', {
          cycle: result.cycle
        })
      }
      
      return ResponseHandler.notFound(res, result.message)
    } catch (error) {
      return ResponseHandler.internalError(res, 'Failed to get cycle report')
    }
  }

  /**
   * Generate goals for cycle
   * POST /api/performance/cycles/:cycleId/generate-goals
   */
  async generateGoalsForCycle(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { cycleId } = req.params
      const userId = req.user?.id!
      
      const result = await this.performanceService.getPerformanceGoals({ cycleId })
      
      if (result.success) {
        // Log audit trail
        await auditService.logUserAction(userId, 'generate_goals', {
          entityType: 'performance_cycle',
          entityId: cycleId
        })
        
        return ResponseHandler.success(res, 'Goals generated successfully', {
          goals: result.goals
        })
      }
      
      return ResponseHandler.badRequest(res, result.message)
    } catch (error) {
      return ResponseHandler.internalError(res, 'Failed to generate goals for cycle')
    }
  }

  /**
   * Get employee goals
   * GET /api/performance/employees/:employeeId/goals
   */
  async getEmployeeGoals(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { employeeId } = req.params
      const userId = req.user?.id!
      
      const result = await this.performanceService.getPerformanceGoals({ employeeId })
      
      if (result.success) {
        // Log audit trail
        await auditService.logUserAction(userId, 'view_employee_goals', {
          entityType: 'performance_goals',
          entityId: employeeId
        })
        
        return ResponseHandler.success(res, 'Employee goals retrieved successfully', {
          goals: result.goals
        })
      }
      
      return ResponseHandler.badRequest(res, result.message)
    } catch (error) {
      return ResponseHandler.internalError(res, 'Failed to get employee goals')
    }
  }

}