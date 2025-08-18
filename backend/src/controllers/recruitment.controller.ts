import { Request, Response } from 'express'
import { RecruitmentService, CreateJobPostingData, UpdateJobPostingData, CreateJobApplicationData, UpdateJobApplicationData, RecruitmentSearchFilters } from '../services/recruitment.service'
import { ResponseHandler } from '../utils/response'
import { ValidationError, NotFoundError, ConflictError } from '../utils/errors'
import { AuthenticatedRequest } from '../middleware/permission'
import { auditService } from '../services/audit.service'

export class RecruitmentController {
  private recruitmentService: RecruitmentService

  constructor() {
    this.recruitmentService = new RecruitmentService()
  }

  async createJobPosting(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id!
      const jobPostingData: CreateJobPostingData = req.body

      const result = await this.recruitmentService.createJobPosting(jobPostingData, userId)

      if (result.success) {
        // Audit log
        await auditService.createAuditLog({
          userId,
          action: 'CREATE',
          entityType: 'job_posting',
          entityId: result.jobPosting?.id
        })

        return ResponseHandler.created(res, result.message, { jobPosting: result.jobPosting })
      }

      return ResponseHandler.badRequest(res, result.message)
    } catch (error) {
      return ResponseHandler.internalError(res, 'Failed to create job posting')
    }
  }

  /**
   * Get all job postings with optional filtering
   * GET /api/recruitment/jobs
   */
  async getJobPostings(req: Request, res: Response): Promise<Response> {
    try {
      const filters: RecruitmentSearchFilters = {
        departmentId: req.query.departmentId as string,
        positionId: req.query.positionId as string,
        employmentType: req.query.employmentType as string,
        status: req.query.status as string,
        postedBy: req.query.postedBy as string,
        search: req.query.search as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
      }

      const result = await this.recruitmentService.getJobPostings(filters)

      if (result.success) {
        return ResponseHandler.success(res, result.message, {
          jobPostings: result.jobPostings,
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
      return ResponseHandler.internalError(res, 'Failed to retrieve job postings')
    }
  }

  /**
   * Get active job postings (public endpoint)
   * GET /api/recruitment/jobs/active
   */
  async getActiveJobPostings(req: Request, res: Response): Promise<Response> {
    try {
      const filters: RecruitmentSearchFilters = {
        status: 'active',
        search: req.query.search as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
      }

      const result = await this.recruitmentService.getJobPostings(filters)

      if (result.success) {
        return ResponseHandler.success(res, result.message, {
          jobPostings: result.jobPostings,
          total: result.total
        })
      }

      return ResponseHandler.badRequest(res, result.message)
    } catch (error) {
      return ResponseHandler.internalError(res, 'Failed to retrieve active job postings')
    }
  }

  /**
   * Get job posting by ID
   * GET /api/recruitment/jobs/:id
   */
  async getJobPostingById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params
      const result = await this.recruitmentService.getJobPostingById(id)

      if (result.success) {
        return ResponseHandler.success(res, result.message, { jobPosting: result.jobPosting })
      }

      return ResponseHandler.notFound(res, result.message)
    } catch (error) {
      return ResponseHandler.internalError(res, 'Failed to retrieve job posting')
    }
  }

  /**
   * Update job posting
   * PUT /api/recruitment/jobs/:id
   */
  async updateJobPosting(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params
      const userId = req.user?.id!
      const updateData: UpdateJobPostingData = req.body

      const result = await this.recruitmentService.updateJobPosting(id, updateData)

      if (result.success) {
        // Audit log
        await auditService.createAuditLog({
          userId,
          action: 'UPDATE',
          entityType: 'job_posting',
          entityId: id
        })

        return ResponseHandler.success(res, result.message, { jobPosting: result.jobPosting })
      }

      return ResponseHandler.badRequest(res, result.message)
    } catch (error) {
      return ResponseHandler.internalError(res, 'Failed to update job posting')
    }
  }

  /**
   * Delete job posting
   * DELETE /api/recruitment/jobs/:id
   */
  async deleteJobPosting(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params
      const userId = req.user?.id!

      const result = await this.recruitmentService.deleteJobPosting(id)

      if (result.success) {
        // Audit log
        await auditService.createAuditLog({
          userId,
          action: 'DELETE',
          entityType: 'job_posting',
          entityId: id
        })

        return ResponseHandler.success(res, result.message)
      }

      return ResponseHandler.badRequest(res, result.message)
    } catch (error) {
      return ResponseHandler.internalError(res, 'Failed to delete job posting')
    }
  }

  /**
   * Create a new job application
   * POST /api/recruitment/applications
   */
  async createJobApplication(req: Request, res: Response): Promise<Response> {
    try {
      const applicationData: CreateJobApplicationData = req.body

      const result = await this.recruitmentService.createJobApplication(applicationData)

      if (result.success) {
        return ResponseHandler.created(res, result.message, { application: result.application })
      }

      return ResponseHandler.badRequest(res, result.message)
    } catch (error) {
      return ResponseHandler.internalError(res, 'Failed to create job application')
    }
  }

  /**
   * Get all job applications with optional filtering
   * GET /api/recruitment/applications
   */
  async getJobApplications(req: Request, res: Response): Promise<Response> {
    try {
      const filters: RecruitmentSearchFilters = {
        jobPostingId: req.query.jobPostingId as string,
        status: req.query.status as string,
        search: req.query.search as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
      }

      const result = await this.recruitmentService.getJobApplications(filters)

      if (result.success) {
        return ResponseHandler.success(res, result.message, {
          applications: result.applications,
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
      return ResponseHandler.internalError(res, 'Failed to retrieve job applications')
    }
  }

  /**
   * Get job application by ID
   * GET /api/recruitment/applications/:id
   */
  async getJobApplicationById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params
      const result = await this.recruitmentService.getJobApplicationById(id)

      if (result.success) {
        return ResponseHandler.success(res, result.message, { application: result.application })
      }

      return ResponseHandler.notFound(res, result.message)
    } catch (error) {
      return ResponseHandler.internalError(res, 'Failed to retrieve job application')
    }
  }

  /**
   * Update job application
   * PUT /api/recruitment/applications/:id
   */
  async updateJobApplication(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params
      const userId = req.user?.id!
      const updateData: UpdateJobApplicationData = req.body

      const result = await this.recruitmentService.updateJobApplication(id, updateData, userId)

      if (result.success) {
        // Audit log
        await auditService.createAuditLog({
          userId,
          action: 'UPDATE',
          entityType: 'job_application',
          entityId: id
        })

        return ResponseHandler.success(res, result.message, { application: result.application })
      }

      return ResponseHandler.badRequest(res, result.message)
    } catch (error) {
      return ResponseHandler.internalError(res, 'Failed to update job application')
    }
  }

  /**
   * Delete job application
   * DELETE /api/recruitment/applications/:id
   */
  async deleteJobApplication(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params
      const userId = req.user?.id!

      const result = await this.recruitmentService.deleteJobApplication(id)

      if (result.success) {
        // Audit log
        await auditService.createAuditLog({
          userId,
          action: 'DELETE',
          entityType: 'job_application',
          entityId: id
        })

        return ResponseHandler.success(res, result.message)
      }

      return ResponseHandler.badRequest(res, result.message)
    } catch (error) {
      return ResponseHandler.internalError(res, 'Failed to delete job application')
    }
  }

  /**
   * Get job applications by job ID
   * GET /api/recruitment/jobs/:jobId/applications
   */
  async getJobApplicationsByJobId(req: Request, res: Response): Promise<Response> {
    try {
      const { jobId } = req.params
      const filters: RecruitmentSearchFilters = {
        jobPostingId: jobId,
        status: req.query.status as string,
        search: req.query.search as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
      }

      const result = await this.recruitmentService.getJobApplications(filters)

      if (result.success) {
        return ResponseHandler.success(res, result.message, {
          applications: result.applications,
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
      return ResponseHandler.internalError(res, 'Failed to retrieve job applications')
    }
  }

  /**
   * Get recruitment analytics
   * GET /api/recruitment/analytics
   */
  async getRecruitmentAnalytics(req: Request, res: Response): Promise<Response> {
    try {
      // Get basic analytics from existing methods
      const jobPostingsResult = await this.recruitmentService.getJobPostings({})
      const applicationsResult = await this.recruitmentService.getJobApplications({})

      if (jobPostingsResult.success && applicationsResult.success) {
        const analytics = {
          totalJobPostings: jobPostingsResult.total || 0,
          activeJobPostings: jobPostingsResult.jobPostings?.filter(job => job.status === 'active').length || 0,
          totalApplications: applicationsResult.total || 0,
          pendingApplications: applicationsResult.applications?.filter(app => app.status === 'submitted').length || 0,
          interviewApplications: applicationsResult.applications?.filter(app => app.status === 'interview').length || 0,
          hiredApplications: applicationsResult.applications?.filter(app => app.status === 'hired').length || 0
        }

        return ResponseHandler.success(res, 'Recruitment analytics retrieved successfully', { analytics })
      }

      return ResponseHandler.badRequest(res, 'Failed to retrieve analytics data')
    } catch (error) {
      return ResponseHandler.internalError(res, 'Failed to retrieve recruitment analytics')
    }
  }
}