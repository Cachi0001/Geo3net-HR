import { Request, Response } from 'express'
import { employeeService, CreateEmployeeData, UpdateEmployeeData, EmployeeSearchFilters } from '../services/employee.service'
import { ResponseHandler } from '../utils/response'
import { AuthenticatedRequest } from '../middleware/permission'
import { ValidationError, ConflictError, AuthorizationError, NotFoundError } from '../utils/errors'

export class EmployeeController {
  /**
   * Create new employee
   */
  async createEmployee(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id
      if (!userId) {
        return ResponseHandler.forbidden(res, 'Authentication required')
      }

      const employeeData: CreateEmployeeData = req.body

      console.log('📥 [EmployeeController] Creating employee:', employeeData.fullName)

      const result = await employeeService.createEmployee(employeeData, userId)

      if (!result.success) {
        return ResponseHandler.badRequest(res, result.message)
      }

      return ResponseHandler.created(res, result.message, result.employee)
    } catch (error: any) {
      console.error('❌ [EmployeeController] Create employee error:', error)

      if (error instanceof ValidationError) {
        return ResponseHandler.badRequest(res, error.message)
      }

      if (error instanceof ConflictError) {
        return ResponseHandler.conflict(res, error.message)
      }

      if (error instanceof AuthorizationError) {
        return ResponseHandler.forbidden(res, error.message)
      }

      return ResponseHandler.internalError(res, 'Failed to create employee')
    }
  }

  /**
   * Get employee by ID
   */
  async getEmployee(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id
      if (!userId) {
        return ResponseHandler.forbidden(res, 'Authentication required')
      }

      const { id } = req.params

      console.log('📥 [EmployeeController] Getting employee:', id)

      const employee = await employeeService.getEmployeeById(id, userId)

      if (!employee) {
        return ResponseHandler.notFound(res, 'Employee not found')
      }

      return ResponseHandler.success(res, 'Employee retrieved successfully', employee)
    } catch (error: any) {
      console.error('❌ [EmployeeController] Get employee error:', error)

      if (error instanceof AuthorizationError) {
        return ResponseHandler.forbidden(res, error.message)
      }

      return ResponseHandler.internalError(res, 'Failed to get employee')
    }
  }

  /**
   * Search and filter employees
   */
  async searchEmployees(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id
      if (!userId) {
        return ResponseHandler.forbidden(res, 'Authentication required')
      }

      const filters: EmployeeSearchFilters = {
        search: req.query.search as string,
        departmentId: req.query.departmentId as string,
        positionId: req.query.positionId as string,
        employmentStatus: req.query.employmentStatus as string,
        employmentType: req.query.employmentType as string,
        managerId: req.query.managerId as string,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc'
      }

      // Handle date range filters
      if (req.query.hireDateFrom || req.query.hireDateTo) {
        filters.hireDate = {
          from: req.query.hireDateFrom as string,
          to: req.query.hireDateTo as string
        }
      }

      console.log('📥 [EmployeeController] Searching employees with filters:', filters)

      const result = await employeeService.searchEmployees(filters, userId)

      if (!result.success) {
        return ResponseHandler.badRequest(res, result.message)
      }

      return ResponseHandler.success(res, result.message, {
        employees: result.employees,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: Math.ceil((result.total || 0) / (result.limit || 20))
        }
      })
    } catch (error: any) {
      console.error('❌ [EmployeeController] Search employees error:', error)

      if (error instanceof AuthorizationError) {
        return ResponseHandler.forbidden(res, error.message)
      }

      return ResponseHandler.internalError(res, 'Failed to search employees')
    }
  }

  /**
   * Update employee
   */
  async updateEmployee(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id
      if (!userId) {
        return ResponseHandler.forbidden(res, 'Authentication required')
      }

      const { id } = req.params
      const updateData: UpdateEmployeeData = req.body
      const reason = req.body.reason as string

      console.log('📥 [EmployeeController] Updating employee:', id)

      const result = await employeeService.updateEmployee(id, updateData, userId, reason)

      if (!result.success) {
        return ResponseHandler.badRequest(res, result.message)
      }

      return ResponseHandler.success(res, result.message, result.employee)
    } catch (error: any) {
      console.error('❌ [EmployeeController] Update employee error:', error)

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

      return ResponseHandler.internalError(res, 'Failed to update employee')
    }
  }

  /**
   * Delete employee (soft delete)
   */
  async deleteEmployee(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id
      if (!userId) {
        return ResponseHandler.forbidden(res, 'Authentication required')
      }

      const { id } = req.params
      const reason = req.body.reason as string

      console.log('📥 [EmployeeController] Deleting employee:', id)

      const result = await employeeService.deleteEmployee(id, userId, reason)

      if (!result.success) {
        return ResponseHandler.badRequest(res, result.message)
      }

      return ResponseHandler.success(res, result.message)
    } catch (error: any) {
      console.error('❌ [EmployeeController] Delete employee error:', error)

      if (error instanceof ConflictError) {
        return ResponseHandler.conflict(res, error.message)
      }

      if (error instanceof AuthorizationError) {
        return ResponseHandler.forbidden(res, error.message)
      }

      if (error instanceof NotFoundError) {
        return ResponseHandler.notFound(res, error.message)
      }

      return ResponseHandler.internalError(res, 'Failed to delete employee')
    }
  }

  /**
   * Restore deleted employee
   */
  async restoreEmployee(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id
      if (!userId) {
        return ResponseHandler.forbidden(res, 'Authentication required')
      }

      const { id } = req.params

      console.log('📥 [EmployeeController] Restoring employee:', id)

      const result = await employeeService.restoreEmployee(id, userId)

      if (!result.success) {
        return ResponseHandler.badRequest(res, result.message)
      }

      return ResponseHandler.success(res, result.message, result.employee)
    } catch (error: any) {
      console.error('❌ [EmployeeController] Restore employee error:', error)

      if (error instanceof AuthorizationError) {
        return ResponseHandler.forbidden(res, error.message)
      }

      if (error instanceof NotFoundError) {
        return ResponseHandler.notFound(res, error.message)
      }

      return ResponseHandler.internalError(res, 'Failed to restore employee')
    }
  }

  /**
   * Get employee hierarchy
   */
  async getEmployeeHierarchy(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id
      if (!userId) {
        return ResponseHandler.forbidden(res, 'Authentication required')
      }

      const { id } = req.params

      console.log('📥 [EmployeeController] Getting employee hierarchy:', id)

      const hierarchy = await employeeService.getEmployeeHierarchy(id, userId)

      return ResponseHandler.success(res, 'Employee hierarchy retrieved successfully', hierarchy)
    } catch (error: any) {
      console.error('❌ [EmployeeController] Get employee hierarchy error:', error)

      if (error instanceof AuthorizationError) {
        return ResponseHandler.forbidden(res, error.message)
      }

      return ResponseHandler.internalError(res, 'Failed to get employee hierarchy')
    }
  }

  /**
   * Get employee audit logs
   */
  async getEmployeeAuditLogs(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id
      if (!userId) {
        return ResponseHandler.forbidden(res, 'Authentication required')
      }

      const { id } = req.params
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50

      console.log('📥 [EmployeeController] Getting employee audit logs:', id)

      const auditLogs = await employeeService.getEmployeeAuditLogs(id, userId, limit)

      return ResponseHandler.success(res, 'Employee audit logs retrieved successfully', auditLogs)
    } catch (error: any) {
      console.error('❌ [EmployeeController] Get employee audit logs error:', error)

      if (error instanceof AuthorizationError) {
        return ResponseHandler.forbidden(res, error.message)
      }

      return ResponseHandler.internalError(res, 'Failed to get employee audit logs')
    }
  }

  /**
   * Update employee manager
   */
  async updateEmployeeManager(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id
      if (!userId) {
        return ResponseHandler.forbidden(res, 'Authentication required')
      }

      const { id } = req.params
      const { managerId, reason } = req.body

      console.log('📥 [EmployeeController] Updating employee manager:', id, 'to', managerId)

      const result = await employeeService.updateEmployee(
        id,
        { managerId },
        userId,
        reason || 'Manager assignment updated'
      )

      if (!result.success) {
        return ResponseHandler.badRequest(res, result.message)
      }

      return ResponseHandler.success(res, 'Employee manager updated successfully', result.employee)
    } catch (error: any) {
      console.error('❌ [EmployeeController] Update employee manager error:', error)

      if (error instanceof ValidationError) {
        return ResponseHandler.badRequest(res, error.message)
      }

      if (error instanceof AuthorizationError) {
        return ResponseHandler.forbidden(res, error.message)
      }

      if (error instanceof NotFoundError) {
        return ResponseHandler.notFound(res, error.message)
      }

      return ResponseHandler.internalError(res, 'Failed to update employee manager')
    }
  }

  /**
   * Get employee subordinates
   */
  async getEmployeeSubordinates(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id
      if (!userId) {
        return ResponseHandler.forbidden(res, 'Authentication required')
      }

      const { id } = req.params

      console.log('📥 [EmployeeController] Getting employee subordinates:', id)

      const hierarchy = await employeeService.getEmployeeHierarchy(id, userId)

      return ResponseHandler.success(res, 'Employee subordinates retrieved successfully', {
        subordinates: hierarchy.directReports
      })
    } catch (error: any) {
      console.error('❌ [EmployeeController] Get employee subordinates error:', error)

      if (error instanceof AuthorizationError) {
        return ResponseHandler.forbidden(res, error.message)
      }

      return ResponseHandler.internalError(res, 'Failed to get employee subordinates')
    }
  }

  /**
   * Get employee statistics
   */
  async getEmployeeStatistics(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id
      if (!userId) {
        return ResponseHandler.forbidden(res, 'Authentication required')
      }

      console.log('📥 [EmployeeController] Getting employee statistics')

      // Get basic statistics
      const result = await employeeService.searchEmployees({ limit: 1 }, userId)
      
      if (!result.success) {
        return ResponseHandler.badRequest(res, result.message)
      }

      // Get statistics by status
      const statusStats = await Promise.all([
        employeeService.searchEmployees({ employmentStatus: 'active', limit: 1 }, userId),
        employeeService.searchEmployees({ employmentStatus: 'inactive', limit: 1 }, userId),
        employeeService.searchEmployees({ employmentStatus: 'on_leave', limit: 1 }, userId),
        employeeService.searchEmployees({ employmentStatus: 'terminated', limit: 1 }, userId)
      ])

      const statistics = {
        total: result.total || 0,
        active: statusStats[0].total || 0,
        inactive: statusStats[1].total || 0,
        onLeave: statusStats[2].total || 0,
        terminated: statusStats[3].total || 0
      }

      return ResponseHandler.success(res, 'Employee statistics retrieved successfully', statistics)
    } catch (error: any) {
      console.error('❌ [EmployeeController] Get employee statistics error:', error)

      if (error instanceof AuthorizationError) {
        return ResponseHandler.forbidden(res, error.message)
      }

      return ResponseHandler.internalError(res, 'Failed to get employee statistics')
    }
  }

  /**
   * Bulk update employees
   */
  async bulkUpdateEmployees(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id
      if (!userId) {
        return ResponseHandler.forbidden(res, 'Authentication required')
      }

      const { employeeIds, updateData, reason } = req.body

      if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
        return ResponseHandler.badRequest(res, 'Employee IDs array is required')
      }

      if (!updateData || Object.keys(updateData).length === 0) {
        return ResponseHandler.badRequest(res, 'Update data is required')
      }

      console.log('📥 [EmployeeController] Bulk updating employees:', employeeIds.length)

      const result = await employeeService.bulkUpdateEmployees(employeeIds, updateData, userId, reason)

      if (!result.success) {
        return ResponseHandler.badRequest(res, result.message)
      }

      return ResponseHandler.success(res, result.message, {
        updatedEmployees: result.employees,
        errors: result.errors
      })
    } catch (error: any) {
      console.error('❌ [EmployeeController] Bulk update employees error:', error)

      if (error instanceof ValidationError) {
        return ResponseHandler.badRequest(res, error.message)
      }

      if (error instanceof AuthorizationError) {
        return ResponseHandler.forbidden(res, error.message)
      }

      return ResponseHandler.internalError(res, 'Failed to bulk update employees')
    }
  }

  /**
   * Get comprehensive employee statistics
   */
  async getComprehensiveStatistics(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id
      if (!userId) {
        return ResponseHandler.forbidden(res, 'Authentication required')
      }

      console.log('📥 [EmployeeController] Getting comprehensive employee statistics')

      const statistics = await employeeService.getComprehensiveEmployeeStatistics(userId)

      return ResponseHandler.success(res, 'Comprehensive employee statistics retrieved successfully', statistics)
    } catch (error: any) {
      console.error('❌ [EmployeeController] Get comprehensive statistics error:', error)

      if (error instanceof AuthorizationError) {
        return ResponseHandler.forbidden(res, error.message)
      }

      return ResponseHandler.internalError(res, 'Failed to get comprehensive employee statistics')
    }
  }

  /**
   * Get employees by skills
   */
  async getEmployeesBySkills(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id
      if (!userId) {
        return ResponseHandler.forbidden(res, 'Authentication required')
      }

      const { skills } = req.query

      if (!skills) {
        return ResponseHandler.badRequest(res, 'Skills parameter is required')
      }

      const skillsArray = Array.isArray(skills) ? skills : [skills]

      console.log('📥 [EmployeeController] Getting employees by skills:', skillsArray)

      const employees = await employeeService.getEmployeesBySkills(skillsArray as string[], userId)

      return ResponseHandler.success(res, 'Employees retrieved successfully', employees)
    } catch (error: any) {
      console.error('❌ [EmployeeController] Get employees by skills error:', error)

      if (error instanceof AuthorizationError) {
        return ResponseHandler.forbidden(res, error.message)
      }

      return ResponseHandler.internalError(res, 'Failed to get employees by skills')
    }
  }

  /**
   * Get employee performance summary
   */
  async getEmployeePerformanceSummary(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id
      if (!userId) {
        return ResponseHandler.forbidden(res, 'Authentication required')
      }

      const { id } = req.params

      console.log('📥 [EmployeeController] Getting employee performance summary:', id)

      const summary = await employeeService.getEmployeePerformanceSummary(id, userId)

      return ResponseHandler.success(res, 'Employee performance summary retrieved successfully', summary)
    } catch (error: any) {
      console.error('❌ [EmployeeController] Get employee performance summary error:', error)

      if (error instanceof AuthorizationError) {
        return ResponseHandler.forbidden(res, error.message)
      }

      if (error instanceof NotFoundError) {
        return ResponseHandler.notFound(res, error.message)
      }

      return ResponseHandler.internalError(res, 'Failed to get employee performance summary')
    }
  }

  /**
   * Get employee skills
   */
  async getEmployeeSkills(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id
      if (!userId) {
        return ResponseHandler.forbidden(res, 'Authentication required')
      }

      const { id } = req.params

      console.log('📥 [EmployeeController] Getting employee skills:', id)

      const skills = await employeeService.getEmployeeSkills(id, userId)

      return ResponseHandler.success(res, 'Employee skills retrieved successfully', skills)
    } catch (error: any) {
      console.error('❌ [EmployeeController] Get employee skills error:', error)

      if (error instanceof AuthorizationError) {
        return ResponseHandler.forbidden(res, error.message)
      }

      if (error instanceof NotFoundError) {
        return ResponseHandler.notFound(res, error.message)
      }

      return ResponseHandler.internalError(res, 'Failed to get employee skills')
    }
  }

  /**
   * Add skill to employee
   */
  async addEmployeeSkill(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id
      if (!userId) {
        return ResponseHandler.forbidden(res, 'Authentication required')
      }

      const { id } = req.params
      const { skill, reason } = req.body

      console.log('📥 [EmployeeController] Adding skill to employee:', id, skill)

      const result = await employeeService.addEmployeeSkill(id, skill, userId, reason)

      if (!result.success) {
        return ResponseHandler.badRequest(res, result.message)
      }

      return ResponseHandler.success(res, result.message, result.employee)
    } catch (error: any) {
      console.error('❌ [EmployeeController] Add employee skill error:', error)

      if (error instanceof ValidationError) {
        return ResponseHandler.badRequest(res, error.message)
      }

      if (error instanceof ConflictError) {
        return ResponseHandler.conflict(res, error.message)
      }

      if (error instanceof AuthorizationError) {
        return ResponseHandler.forbidden(res, error.message)
      }

      return ResponseHandler.internalError(res, 'Failed to add employee skill')
    }
  }

  /**
   * Remove skill from employee
   */
  async removeEmployeeSkill(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id
      if (!userId) {
        return ResponseHandler.forbidden(res, 'Authentication required')
      }

      const { id, skill } = req.params
      const { reason } = req.body

      console.log('📥 [EmployeeController] Removing skill from employee:', id, skill)

      const result = await employeeService.removeEmployeeSkill(id, skill, userId, reason)

      if (!result.success) {
        return ResponseHandler.badRequest(res, result.message)
      }

      return ResponseHandler.success(res, result.message, result.employee)
    } catch (error: any) {
      console.error('❌ [EmployeeController] Remove employee skill error:', error)

      if (error instanceof AuthorizationError) {
        return ResponseHandler.forbidden(res, error.message)
      }

      if (error instanceof NotFoundError) {
        return ResponseHandler.notFound(res, error.message)
      }

      return ResponseHandler.internalError(res, 'Failed to remove employee skill')
    }
  }

  /**
   * Get employee certifications
   */
  async getEmployeeCertifications(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id
      if (!userId) {
        return ResponseHandler.forbidden(res, 'Authentication required')
      }

      const { id } = req.params

      console.log('📥 [EmployeeController] Getting employee certifications:', id)

      const certifications = await employeeService.getEmployeeCertifications(id, userId)

      return ResponseHandler.success(res, 'Employee certifications retrieved successfully', certifications)
    } catch (error: any) {
      console.error('❌ [EmployeeController] Get employee certifications error:', error)

      if (error instanceof AuthorizationError) {
        return ResponseHandler.forbidden(res, error.message)
      }

      if (error instanceof NotFoundError) {
        return ResponseHandler.notFound(res, error.message)
      }

      return ResponseHandler.internalError(res, 'Failed to get employee certifications')
    }
  }

  /**
   * Add certification to employee
   */
  async addEmployeeCertification(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id
      if (!userId) {
        return ResponseHandler.forbidden(res, 'Authentication required')
      }

      const { id } = req.params
      const { certification, reason } = req.body

      console.log('📥 [EmployeeController] Adding certification to employee:', id, certification?.name)

      const result = await employeeService.addEmployeeCertification(id, certification, userId, reason)

      if (!result.success) {
        return ResponseHandler.badRequest(res, result.message)
      }

      return ResponseHandler.success(res, result.message, result.employee)
    } catch (error: any) {
      console.error('❌ [EmployeeController] Add employee certification error:', error)

      if (error instanceof ValidationError) {
        return ResponseHandler.badRequest(res, error.message)
      }

      if (error instanceof ConflictError) {
        return ResponseHandler.conflict(res, error.message)
      }

      if (error instanceof AuthorizationError) {
        return ResponseHandler.forbidden(res, error.message)
      }

      return ResponseHandler.internalError(res, 'Failed to add employee certification')
    }
  }

  /**
   * Remove certification from employee
   */
  async removeEmployeeCertification(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id
      if (!userId) {
        return ResponseHandler.forbidden(res, 'Authentication required')
      }

      const { id, certificationName } = req.params
      const { reason } = req.body

      console.log('📥 [EmployeeController] Removing certification from employee:', id, certificationName)

      const result = await employeeService.removeEmployeeCertification(id, certificationName, userId, reason)

      if (!result.success) {
        return ResponseHandler.badRequest(res, result.message)
      }

      return ResponseHandler.success(res, result.message, result.employee)
    } catch (error: any) {
      console.error('❌ [EmployeeController] Remove employee certification error:', error)

      if (error instanceof AuthorizationError) {
        return ResponseHandler.forbidden(res, error.message)
      }

      if (error instanceof NotFoundError) {
        return ResponseHandler.notFound(res, error.message)
      }

      return ResponseHandler.internalError(res, 'Failed to remove employee certification')
    }
  }

  /**
   * Send invitation to employee
   */
  async sendInvitation(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id
      if (!userId) {
        return ResponseHandler.forbidden(res, 'Authentication required')
      }

      const { id } = req.params

      console.log('📥 [EmployeeController] Sending invitation to employee:', id)

      const result = await employeeService.sendEmployeeInvitation(id, userId)

      if (!result.success) {
        return ResponseHandler.badRequest(res, result.message)
      }

      return ResponseHandler.success(res, result.message)
    } catch (error: any) {
      console.error('❌ [EmployeeController] Send invitation error:', error)

      if (error instanceof ValidationError) {
        return ResponseHandler.badRequest(res, error.message)
      }

      if (error instanceof AuthorizationError) {
        return ResponseHandler.forbidden(res, error.message)
      }

      if (error instanceof NotFoundError) {
        return ResponseHandler.notFound(res, error.message)
      }

      return ResponseHandler.internalError(res, 'Failed to send invitation')
    }
  }

  /**
   * Activate employee account
   */
  async activateAccount(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id
      if (!userId) {
        return ResponseHandler.forbidden(res, 'Authentication required')
      }

      const { id } = req.params

      console.log('📥 [EmployeeController] Activating employee account:', id)

      const result = await employeeService.activateEmployeeAccount(id, userId)

      if (!result.success) {
        return ResponseHandler.badRequest(res, result.message)
      }

      return ResponseHandler.success(res, result.message)
    } catch (error: any) {
      console.error('❌ [EmployeeController] Activate account error:', error)

      if (error instanceof ValidationError) {
        return ResponseHandler.badRequest(res, error.message)
      }

      if (error instanceof AuthorizationError) {
        return ResponseHandler.forbidden(res, error.message)
      }

      if (error instanceof NotFoundError) {
        return ResponseHandler.notFound(res, error.message)
      }

      return ResponseHandler.internalError(res, 'Failed to activate account')
    }
  }
}

export const employeeController = new EmployeeController()