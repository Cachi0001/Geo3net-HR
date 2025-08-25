import { supabase } from '../config/database'
import { NotFoundError, ConflictError, ValidationError, AuthorizationError } from '../utils/errors'
import { emailService } from './email.service'
import bcrypt from 'bcryptjs'

export interface Employee {
  id: string
  employeeId: string
  userId?: string
  fullName: string
  email: string
  phoneNumber?: string
  departmentId?: string
  positionId?: string
  managerId?: string
  employmentStatus: 'active' | 'inactive' | 'terminated' | 'on_leave' | 'suspended'
  hireDate?: string
  terminationDate?: string
  terminationReason?: string
  emergencyContact?: any
  skills?: string[]
  certifications?: any[]
  performanceRating?: number
  salaryGrade?: string
  workLocation?: string
  employmentType: 'full_time' | 'part_time' | 'contract' | 'intern'
  probationEndDate?: string
  lastPromotionDate?: string
  notes?: string
  profilePhotoUrl?: string
  createdAt: string
  updatedAt: string
  createdBy?: string
  updatedBy?: string
  deletedAt?: string
  deletedBy?: string

  // Joined data
  department?: any
  position?: any
  manager?: any
  user?: any
}

export interface CreateEmployeeData {
  fullName: string
  email: string
  phoneNumber?: string
  departmentId?: string
  positionId?: string
  managerId?: string
  employmentStatus?: 'active' | 'inactive' | 'terminated' | 'on_leave' | 'suspended'
  hireDate?: string
  emergencyContact?: any
  skills?: string[]
  certifications?: any[]
  salaryGrade?: string
  workLocation?: string
  employmentType?: 'full_time' | 'part_time' | 'contract' | 'intern'
  probationEndDate?: string
  notes?: string
  profilePhotoUrl?: string
}

export interface UpdateEmployeeData {
  fullName?: string
  email?: string
  phoneNumber?: string
  departmentId?: string
  positionId?: string
  managerId?: string
  employmentStatus?: 'active' | 'inactive' | 'terminated' | 'on_leave' | 'suspended'
  terminationDate?: string
  terminationReason?: string
  emergencyContact?: any
  skills?: string[]
  certifications?: any[]
  performanceRating?: number
  salaryGrade?: string
  workLocation?: string
  employmentType?: 'full_time' | 'part_time' | 'contract' | 'intern'
  probationEndDate?: string
  lastPromotionDate?: string
  notes?: string
  profilePhotoUrl?: string
}

export interface EmployeeSearchFilters {
  search?: string
  departmentId?: string
  positionId?: string
  employmentStatus?: string
  employmentType?: string
  managerId?: string
  hireDate?: { from?: string; to?: string }
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface EmployeeResult {
  success: boolean
  message: string
  employee?: Employee
  employees?: Employee[]
  total?: number
  page?: number
  limit?: number
  errors?: any[]
}

class EmployeeService {
  /**
   * Validate employee access permissions
   */
  private async validateEmployeeAccess(userId: string, action: string = 'read'): Promise<void> {
    // Get user data
    const { data: user, error } = await supabase
      .from('users')
      .select('id, employee_id')
      .eq('id', userId)
      .single()

    if (error || !user) {
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

    // Get the user's active role names
    const roleNames = userRoles.map((ur: any) => ur.role_name)

    // Super admin and HR admin have full access
    if (roleNames.some(role => ['super-admin', 'hr-admin'].includes(role))) {
      return
    }

    // Managers can manage their team members
    if (roleNames.includes('manager') && ['read', 'update'].includes(action)) {
      return
    }

    // Employees can only read their own data
    if (roleNames.includes('employee') && action === 'read') {
      return
    }

    throw new AuthorizationError(`Insufficient permissions for ${action} operation`)
  }

  // Basic implementation - will be enhanced later
  async createEmployee(data: CreateEmployeeData, createdBy: string): Promise<EmployeeResult> {
    return { success: false, message: 'Employee service implementation needed' }
  }

  async getEmployeeById(id: string, requestedBy: string): Promise<Employee | null> {
    return null
  }

  async getEmployeeByUserId(userId: string, requestedBy?: string): Promise<Employee | null> {
    return null
  }

  async searchEmployees(filters: EmployeeSearchFilters, requestedBy: string): Promise<EmployeeResult> {
    return { success: true, message: 'No employees found', employees: [], total: 0 }
  }

  async updateEmployee(id: string, data: UpdateEmployeeData, updatedBy: string, reason?: string): Promise<EmployeeResult> {
    return { success: false, message: 'Employee service implementation needed' }
  }

  async deleteEmployee(id: string, deletedBy: string, reason?: string): Promise<EmployeeResult> {
    return { success: false, message: 'Employee service implementation needed' }
  }

  async restoreEmployee(id: string, restoredBy: string): Promise<EmployeeResult> {
    return { success: false, message: 'Employee service implementation needed' }
  }

  async getEmployeeHierarchy(employeeId: string, requestedBy: string): Promise<any> {
    return { directReports: [], managerChain: [] }
  }

  async getEmployeeAuditLogs(employeeId: string, requestedBy: string, limit: number = 50): Promise<any[]> {
    return []
  }

  async bulkUpdateEmployees(employeeIds: string[], updateData: UpdateEmployeeData, updatedBy: string, reason?: string): Promise<EmployeeResult> {
    return { success: false, message: 'Employee service implementation needed' }
  }

  async getComprehensiveEmployeeStatistics(requestedBy: string): Promise<any> {
    return {}
  }

  async getEmployeesBySkills(skills: string[], requestedBy: string): Promise<Employee[]> {
    return []
  }

  async getEmployeePerformanceSummary(id: string, requestedBy: string): Promise<any> {
    return {}
  }

  async getEmployeeSkills(id: string, requestedBy: string): Promise<string[]> {
    return []
  }

  async addEmployeeSkill(id: string, skill: string, updatedBy: string, reason?: string): Promise<EmployeeResult> {
    return { success: false, message: 'Employee service implementation needed' }
  }

  async removeEmployeeSkill(id: string, skill: string, updatedBy: string, reason?: string): Promise<EmployeeResult> {
    return { success: false, message: 'Employee service implementation needed' }
  }

  async getEmployeeCertifications(id: string, requestedBy: string): Promise<any[]> {
    return []
  }

  async addEmployeeCertification(id: string, certification: any, updatedBy: string, reason?: string): Promise<EmployeeResult> {
    return { success: false, message: 'Employee service implementation needed' }
  }

  async removeEmployeeCertification(id: string, certificationName: string, updatedBy: string, reason?: string): Promise<EmployeeResult> {
    return { success: false, message: 'Employee service implementation needed' }
  }

  async sendEmployeeInvitation(id: string, requestedBy: string): Promise<EmployeeResult> {
    try {
      // Validate permissions
      await this.validateEmployeeAccess(requestedBy, 'update')
      
      // Get employee data
      const { data: employee, error } = await supabase
        .from('employees')
        .select('*')
        .eq('id', id)
        .single()

      if (error || !employee) {
        throw new NotFoundError('Employee not found')
      }

      // Get user data to get temporary password info
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('email, full_name, is_temporary_password')
        .eq('id', employee.user_id)
        .single()

      if (userError || !user) {
        throw new Error('Failed to get user data for invitation')
      }

      // Generate new temporary password if needed
      let temporaryPassword = ''
      if (user.is_temporary_password) {
        temporaryPassword = Math.random().toString(36).slice(-8)
        const hashedPassword = await bcrypt.hash(temporaryPassword, 12)
        
        const { error: passwordError } = await supabase
          .from('users')
          .update({
            password_hash: hashedPassword,
            is_temporary_password: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', employee.user_id)

        if (passwordError) {
          throw new Error('Failed to update temporary password')
        }
      }

      // Send invitation email
      try {
        await emailService.sendEmployeeInvitationEmail(user.email, user.full_name, temporaryPassword)
      } catch (emailError) {
        console.error('Failed to send invitation email:', emailError)
        // Don't fail the entire operation if email fails
      }

      // Update invitation sent timestamp
      const { error: updateError } = await supabase
        .from('users')
        .update({
          invitation_sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', employee.user_id)

      if (updateError) {
        throw new Error('Failed to update invitation status')
      }

      console.log('✅ [EmployeeService] Invitation sent to:', employee.email)
      
      return {
        success: true,
        message: 'Invitation sent successfully'
      }
    } catch (error) {
      console.error('❌ [EmployeeService] Send invitation failed:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to send invitation'
      }
    }
  }

  async activateEmployeeAccount(id: string, requestedBy: string): Promise<EmployeeResult> {
    return { success: false, message: 'Employee service implementation needed' }
  }
}

export const employeeService = new EmployeeService()
export { EmployeeService }