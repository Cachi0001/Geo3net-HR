import { supabase } from '../config/database'
import { NotFoundError, ConflictError, ValidationError } from '../utils/errors'
import { EmailService } from './email.service'

export interface JobPosting {
  id: string
  title: string
  description: string
  requirements?: string
  departmentId?: string
  positionId?: string
  salaryMin?: number
  salaryMax?: number
  employmentType: 'full-time' | 'part-time' | 'contract' | 'internship'
  location?: string
  status: 'draft' | 'active' | 'closed' | 'cancelled'
  postedBy: string
  postedDate: string
  closingDate?: string
  createdAt: string
  updatedAt: string
  // Related data for display
  departmentName?: string
  positionName?: string
  postedByName?: string
  applicationCount?: number
}

export interface JobApplication {
  id: string
  jobPostingId: string
  applicantName: string
  applicantEmail: string
  applicantPhone?: string
  resumeUrl?: string
  coverLetter?: string
  status: 'submitted' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected' | 'withdrawn'
  applicationDate: string
  interviewDate?: string
  interviewNotes?: string
  rejectionReason?: string
  reviewedBy?: string
  createdAt: string
  updatedAt: string
  // Related data for display
  jobTitle?: string
  reviewedByName?: string
}

export interface CreateJobPostingData {
  title: string
  description: string
  requirements?: string
  departmentId?: string
  positionId?: string
  salaryMin?: number
  salaryMax?: number
  employmentType?: 'full-time' | 'part-time' | 'contract' | 'internship'
  location?: string
  closingDate?: string
}

export interface UpdateJobPostingData {
  title?: string
  description?: string
  requirements?: string
  departmentId?: string
  positionId?: string
  salaryMin?: number
  salaryMax?: number
  employmentType?: 'full-time' | 'part-time' | 'contract' | 'internship'
  location?: string
  status?: 'draft' | 'active' | 'closed' | 'cancelled'
  closingDate?: string
}

export interface CreateJobApplicationData {
  jobPostingId: string
  applicantName: string
  applicantEmail: string
  applicantPhone?: string
  resumeUrl?: string
  coverLetter?: string
}

export interface UpdateJobApplicationData {
  status?: 'submitted' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected' | 'withdrawn'
  interviewDate?: string
  interviewNotes?: string
  rejectionReason?: string
}

export interface RecruitmentSearchFilters {
  departmentId?: string
  positionId?: string
  employmentType?: string
  status?: string
  postedBy?: string
  jobPostingId?: string
  search?: string
  limit?: number
  offset?: number
}

export interface RecruitmentResult {
  success: boolean
  message: string
  jobPosting?: JobPosting
  jobPostings?: JobPosting[]
  application?: JobApplication
  applications?: JobApplication[]
  total?: number
}

export class RecruitmentService {
  private emailService: EmailService

  constructor() {
    this.emailService = new EmailService()
  }

  // Job Posting Methods
  async createJobPosting(data: CreateJobPostingData, postedBy: string): Promise<RecruitmentResult> {
    try {
      this.validateJobPostingData(data)

      const { data: newJobPosting, error } = await supabase
        .from('job_postings')
        .insert({
          title: data.title,
          description: data.description,
          requirements: data.requirements,
          department_id: data.departmentId,
          position_id: data.positionId,
          salary_min: data.salaryMin,
          salary_max: data.salaryMax,
          employment_type: data.employmentType || 'full-time',
          location: data.location,
          status: 'draft',
          posted_by: postedBy,
          posted_date: new Date().toISOString().split('T')[0],
          closing_date: data.closingDate
        })
        .select(`
          *,
          departments(name),
          positions(title),
          users!job_postings_posted_by_fkey(full_name)
        `)
        .single()

      if (error) throw error

      return {
        success: true,
        message: 'Job posting created successfully',
        jobPosting: this.mapDatabaseToJobPosting(newJobPosting)
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to create job posting'
      }
    }
  }

  async getJobPostings(filters: RecruitmentSearchFilters = {}): Promise<RecruitmentResult> {
    try {
      let query = supabase
        .from('job_postings')
        .select(`
          *,
          departments(name),
          positions(title),
          users!job_postings_posted_by_fkey(full_name)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })

      if (filters.departmentId) {
        query = query.eq('department_id', filters.departmentId)
      }

      if (filters.positionId) {
        query = query.eq('position_id', filters.positionId)
      }

      if (filters.employmentType) {
        query = query.eq('employment_type', filters.employmentType)
      }

      if (filters.status) {
        query = query.eq('status', filters.status)
      }

      if (filters.postedBy) {
        query = query.eq('posted_by', filters.postedBy)
      }

      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
      }

      if (filters.limit) {
        query = query.limit(filters.limit)
      }

      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
      }

      const { data, error, count } = await query

      if (error) throw error

      // Get application counts for each job posting
      const jobPostingsWithCounts = await Promise.all(
        (data || []).map(async (jobPosting) => {
          const { count: applicationCount } = await supabase
            .from('job_applications')
            .select('*', { count: 'exact', head: true })
            .eq('job_posting_id', jobPosting.id)

          return {
            ...this.mapDatabaseToJobPosting(jobPosting),
            applicationCount: applicationCount || 0
          }
        })
      )

      return {
        success: true,
        message: 'Job postings retrieved successfully',
        jobPostings: jobPostingsWithCounts,
        total: count || 0
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to retrieve job postings'
      }
    }
  }

  async getJobPostingById(id: string): Promise<RecruitmentResult> {
    try {
      const { data, error } = await supabase
        .from('job_postings')
        .select(`
          *,
          departments(name),
          positions(title),
          users!job_postings_posted_by_fkey(full_name)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      if (!data) throw new NotFoundError('Job posting not found')

      // Get application count
      const { count: applicationCount } = await supabase
        .from('job_applications')
        .select('*', { count: 'exact', head: true })
        .eq('job_posting_id', id)

      const jobPosting = this.mapDatabaseToJobPosting(data)
      jobPosting.applicationCount = applicationCount || 0

      return {
        success: true,
        message: 'Job posting retrieved successfully',
        jobPosting
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to retrieve job posting'
      }
    }
  }

  async updateJobPosting(id: string, data: UpdateJobPostingData): Promise<RecruitmentResult> {
    try {
      const updateData: any = {}

      if (data.title !== undefined) updateData.title = data.title
      if (data.description !== undefined) updateData.description = data.description
      if (data.requirements !== undefined) updateData.requirements = data.requirements
      if (data.departmentId !== undefined) updateData.department_id = data.departmentId
      if (data.positionId !== undefined) updateData.position_id = data.positionId
      if (data.salaryMin !== undefined) updateData.salary_min = data.salaryMin
      if (data.salaryMax !== undefined) updateData.salary_max = data.salaryMax
      if (data.employmentType !== undefined) updateData.employment_type = data.employmentType
      if (data.location !== undefined) updateData.location = data.location
      if (data.status !== undefined) updateData.status = data.status
      if (data.closingDate !== undefined) updateData.closing_date = data.closingDate

      const { data: updatedJobPosting, error } = await supabase
        .from('job_postings')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          departments(name),
          positions(title),
          users!job_postings_posted_by_fkey(full_name)
        `)
        .single()

      if (error) throw error
      if (!updatedJobPosting) throw new NotFoundError('Job posting not found')

      return {
        success: true,
        message: 'Job posting updated successfully',
        jobPosting: this.mapDatabaseToJobPosting(updatedJobPosting)
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to update job posting'
      }
    }
  }

  async deleteJobPosting(id: string): Promise<RecruitmentResult> {
    try {
      // Check if there are any applications
      const { count } = await supabase
        .from('job_applications')
        .select('*', { count: 'exact', head: true })
        .eq('job_posting_id', id)

      if (count && count > 0) {
        throw new ConflictError('Cannot delete job posting with existing applications')
      }

      const { error } = await supabase
        .from('job_postings')
        .delete()
        .eq('id', id)

      if (error) throw error

      return {
        success: true,
        message: 'Job posting deleted successfully'
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to delete job posting'
      }
    }
  }

  // Job Application Methods
  async createJobApplication(data: CreateJobApplicationData): Promise<RecruitmentResult> {
    try {
      this.validateJobApplicationData(data)

      // Check if job posting exists and is active
      const { data: jobPosting, error: jobError } = await supabase
        .from('job_postings')
        .select('id, title, status, closing_date')
        .eq('id', data.jobPostingId)
        .single()

      if (jobError || !jobPosting) {
        throw new NotFoundError('Job posting not found')
      }

      if (jobPosting.status !== 'active') {
        throw new ValidationError('Job posting is not active')
      }

      if (jobPosting.closing_date && new Date(jobPosting.closing_date) < new Date()) {
        throw new ValidationError('Job posting has closed')
      }

      // Check for duplicate application
      const { data: existingApplication } = await supabase
        .from('job_applications')
        .select('id')
        .eq('job_posting_id', data.jobPostingId)
        .eq('applicant_email', data.applicantEmail)
        .single()

      if (existingApplication) {
        throw new ConflictError('Application already exists for this email')
      }

      const { data: newApplication, error } = await supabase
        .from('job_applications')
        .insert({
          job_posting_id: data.jobPostingId,
          applicant_name: data.applicantName,
          applicant_email: data.applicantEmail,
          applicant_phone: data.applicantPhone,
          resume_url: data.resumeUrl,
          cover_letter: data.coverLetter,
          status: 'submitted',
          application_date: new Date().toISOString().split('T')[0]
        })
        .select(`
          *,
          job_postings(title)
        `)
        .single()

      if (error) throw error

      // Send confirmation email to applicant
      try {
        await this.emailService.sendEmail({
          to: data.applicantEmail,
          subject: `Application Received - ${jobPosting.title}`,
          html: `
            <h2>Application Received</h2>
            <p>Dear ${data.applicantName},</p>
            <p>Thank you for your application for the position of <strong>${jobPosting.title}</strong>.</p>
            <p>We have received your application and will review it shortly. We will contact you if your profile matches our requirements.</p>
            <p>Best regards,<br>HR Team</p>
          `
        })
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError)
      }

      return {
        success: true,
        message: 'Job application submitted successfully',
        application: this.mapDatabaseToJobApplication(newApplication)
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to submit job application'
      }
    }
  }

  async getJobApplications(filters: RecruitmentSearchFilters = {}): Promise<RecruitmentResult> {
    try {
      let query = supabase
        .from('job_applications')
        .select(`
          *,
          job_postings(title),
          users!job_applications_reviewed_by_fkey(full_name)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })

      if (filters.jobPostingId) {
        query = query.eq('job_posting_id', filters.jobPostingId)
      }

      if (filters.status) {
        query = query.eq('status', filters.status)
      }

      if (filters.search) {
        query = query.or(`applicant_name.ilike.%${filters.search}%,applicant_email.ilike.%${filters.search}%`)
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
        message: 'Job applications retrieved successfully',
        applications: data?.map(this.mapDatabaseToJobApplication) || [],
        total: count || 0
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to retrieve job applications'
      }
    }
  }

  async getJobApplicationById(id: string): Promise<RecruitmentResult> {
    try {
      const { data, error } = await supabase
        .from('job_applications')
        .select(`
          *,
          job_postings(title),
          users!job_applications_reviewed_by_fkey(full_name)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      if (!data) throw new NotFoundError('Job application not found')

      return {
        success: true,
        message: 'Job application retrieved successfully',
        application: this.mapDatabaseToJobApplication(data)
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to retrieve job application'
      }
    }
  }

  async updateJobApplication(id: string, data: UpdateJobApplicationData, reviewedBy?: string): Promise<RecruitmentResult> {
    try {
      const updateData: any = {}

      if (data.status !== undefined) updateData.status = data.status
      if (data.interviewDate !== undefined) updateData.interview_date = data.interviewDate
      if (data.interviewNotes !== undefined) updateData.interview_notes = data.interviewNotes
      if (data.rejectionReason !== undefined) updateData.rejection_reason = data.rejectionReason
      if (reviewedBy) updateData.reviewed_by = reviewedBy

      const { data: updatedApplication, error } = await supabase
        .from('job_applications')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          job_postings(title),
          users!job_applications_reviewed_by_fkey(full_name)
        `)
        .single()

      if (error) throw error
      if (!updatedApplication) throw new NotFoundError('Job application not found')

      // Send status update email to applicant
      if (data.status && ['interview', 'offer', 'hired', 'rejected'].includes(data.status)) {
        try {
          let subject = ''
          let message = ''

          switch (data.status) {
            case 'interview':
              subject = 'Interview Invitation'
              message = `We would like to invite you for an interview${data.interviewDate ? ` on ${new Date(data.interviewDate).toLocaleDateString()}` : ''}.`
              break
            case 'offer':
              subject = 'Job Offer'
              message = 'Congratulations! We would like to extend a job offer to you.'
              break
            case 'hired':
              subject = 'Welcome to the Team!'
              message = 'Congratulations! You have been selected for the position.'
              break
            case 'rejected':
              subject = 'Application Update'
              message = 'Thank you for your interest. Unfortunately, we have decided to move forward with other candidates.'
              break
          }

          await this.emailService.sendEmail({
            to: updatedApplication.applicant_email,
            subject: `${subject} - ${updatedApplication.job_postings.title}`,
            html: `
              <h2>${subject}</h2>
              <p>Dear ${updatedApplication.applicant_name},</p>
              <p>${message}</p>
              ${data.rejectionReason ? `<p>Feedback: ${data.rejectionReason}</p>` : ''}
              <p>Best regards,<br>HR Team</p>
            `
          })
        } catch (emailError) {
          console.error('Failed to send status update email:', emailError)
        }
      }

      return {
        success: true,
        message: 'Job application updated successfully',
        application: this.mapDatabaseToJobApplication(updatedApplication)
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to update job application'
      }
    }
  }

  async deleteJobApplication(id: string): Promise<RecruitmentResult> {
    try {
      const { error } = await supabase
        .from('job_applications')
        .delete()
        .eq('id', id)

      if (error) throw error

      return {
        success: true,
        message: 'Job application deleted successfully'
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to delete job application'
      }
    }
  }

  // Helper Methods
  private validateJobPostingData(data: CreateJobPostingData): void {
    if (!data.title?.trim()) {
      throw new ValidationError('Job title is required')
    }
    if (!data.description?.trim()) {
      throw new ValidationError('Job description is required')
    }
    if (data.salaryMin && data.salaryMax && data.salaryMin > data.salaryMax) {
      throw new ValidationError('Minimum salary cannot be greater than maximum salary')
    }
    if (data.closingDate && new Date(data.closingDate) <= new Date()) {
      throw new ValidationError('Closing date must be in the future')
    }
  }

  private validateJobApplicationData(data: CreateJobApplicationData): void {
    if (!data.jobPostingId) {
      throw new ValidationError('Job posting ID is required')
    }
    if (!data.applicantName?.trim()) {
      throw new ValidationError('Applicant name is required')
    }
    if (!data.applicantEmail?.trim()) {
      throw new ValidationError('Applicant email is required')
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.applicantEmail)) {
      throw new ValidationError('Invalid email format')
    }
  }

  private mapDatabaseToJobPosting(data: any): JobPosting {
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      requirements: data.requirements,
      departmentId: data.department_id,
      positionId: data.position_id,
      salaryMin: data.salary_min,
      salaryMax: data.salary_max,
      employmentType: data.employment_type,
      location: data.location,
      status: data.status,
      postedBy: data.posted_by,
      postedDate: data.posted_date,
      closingDate: data.closing_date,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      departmentName: data.departments?.name,
      positionName: data.positions?.title,
      postedByName: data.users?.full_name
    }
  }

  private mapDatabaseToJobApplication(data: any): JobApplication {
    return {
      id: data.id,
      jobPostingId: data.job_posting_id,
      applicantName: data.applicant_name,
      applicantEmail: data.applicant_email,
      applicantPhone: data.applicant_phone,
      resumeUrl: data.resume_url,
      coverLetter: data.cover_letter,
      status: data.status,
      applicationDate: data.application_date,
      interviewDate: data.interview_date,
      interviewNotes: data.interview_notes,
      rejectionReason: data.rejection_reason,
      reviewedBy: data.reviewed_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      jobTitle: data.job_postings?.title,
      reviewedByName: data.users?.full_name
    }
  }
}