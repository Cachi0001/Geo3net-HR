import { supabase } from '../config/database'
import { EmailService } from './email.service'
import { RoleService } from './role.service'
import { generateTemporaryPassword } from '../utils/password'
import { NotFoundError, ConflictError, ValidationError } from '../utils/errors'

export interface Employee {
  id: string
  userId?: string
  employeeId: string
  fullName: string
  email: string
  phoneNumber?: string
  dateOfBirth?: string
  address?: string
  emergencyContact?: string
  emergencyPhone?: string
  departmentId?: string
  positionId?: string
  managerId?: string
  hireDate: string
  salary?: number
  employmentStatus: 'active' | 'inactive' | 'terminated' | 'on_leave'
  profilePicture?: string
  skills?: string[]
  notes?: string
  createdAt: string
  updatedAt: string
  createdBy: string
  updatedBy?: string
}

export interface CreateEmployeeData {
  fullName: string
  email: string
  phoneNumber?: string
  dateOfBirth?: string
  address?: string
  emergencyContact?: string
  emergencyPhone?: string
  departmentId?: string
  positionId?: string
  managerId?: string
  hireDate: string
  salary?: number
  skills?: string[]
  notes?: string
  sendInvitation?: boolean
  accountSetupMethod?: 'email_invitation' | 'manual_setup'
  password?: string
}

export interface UpdateEmployeeData {
  fullName?: string
  phoneNumber?: string
  dateOfBirth?: string
  address?: string
  emergencyContact?: string
  emergencyPhone?: string
  departmentId?: string
  positionId?: string
  managerId?: string
  salary?: number
  employmentStatus?: 'active' | 'inactive' | 'terminated' | 'on_leave'
  profilePicture?: string
  skills?: string[]
  notes?: string
}

export interface EmployeeSearchFilters {
  departmentId?: string
  positionId?: string
  managerId?: string
  employmentStatus?: string
  search?: string
  limit?: number
  offset?: number
}

export interface EmployeeResult {
  success: boolean
  message: string
  employee?: Employee
  employees?: Employee[]
  total?: number
  temporaryPassword?: string
}

export interface EmployeeAccessContext {
  userId: string
  role: string
  permissions: string[]
  isOwner?: boolean
}

export class EmployeeService {
  private emailService: EmailService
  private roleService: RoleService

  constructor() {
    this.emailService = new EmailService()
    this.roleService = new RoleService()
  }

  async createEmployee(data: CreateEmployeeData, createdBy: string): Promise<EmployeeResult> {
    try {
      // Validate required fields
      this.validateEmployeeData(data)

      // Check if email already exists
      const existingEmployee = await this.getEmployeeByEmail(data.email)
      if (existingEmployee) {
        throw new ConflictError('Employee with this email already exists')
      }

      // Generate employee ID
      const employeeId = await this.generateEmployeeId()

      // Create employee record
      const { data: newEmployee, error } = await supabase
        .from('employees')
        .insert({
          employee_id: employeeId,
          full_name: data.fullName,
          email: data.email,
          phone_number: data.phoneNumber,
          date_of_birth: data.dateOfBirth,
          address: data.address,
          emergency_contact: data.emergencyContact,
          emergency_phone: data.emergencyPhone,
          department_id: data.departmentId,
          position_id: data.positionId,
          manager_id: data.managerId,
          hire_date: data.hireDate,
          salary: data.salary,
          employment_status: 'active',
          skills: data.skills || [],
          notes: data.notes,
          created_by: createdBy
        })
        .select()
        .single()

      if (error) throw error

      const employee = this.mapDatabaseToEmployee(newEmployee)

      let temporaryPassword: string | undefined
      let userAccountCreated = false

      // Handle account setup based on method
      if (data.accountSetupMethod === 'manual_setup' && data.password) {
        // Create user account with provided password
        temporaryPassword = await this.createUserAccountWithPassword(employee, data.password, createdBy)
        userAccountCreated = true
      } else if (data.sendInvitation || data.accountSetupMethod === 'email_invitation') {
        // Send invitation with temporary password
        temporaryPassword = await this.sendEmployeeInvitation(employee, createdBy)
        userAccountCreated = true
      }

      return {
        success: true,
        message: `Employee created successfully${userAccountCreated ? ' with user account' : ''}`,
        employee,
        temporaryPassword: temporaryPassword && data.accountSetupMethod === 'email_invitation' ? temporaryPassword : undefined
      }
    } catch (error) {
      if (error instanceof ConflictError || error instanceof ValidationError) {
        throw error
      }
      throw new Error('Failed to create employee')
    }
  }

  async getEmployeeById(id: string, accessContext?: EmployeeAccessContext): Promise<Employee | null> {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          department:departments(id, name),
          position:positions(id, title),
          manager:employees!manager_id(id, full_name, employee_id)
        `)
        .eq('id', id)
        .single()

      if (error || !data) return null

      const employee = this.mapDatabaseToEmployee(data)
      
      // Apply role-based data filtering if access context is provided
      if (accessContext) {
        return this.filterEmployeeDataByRole(employee, accessContext)
      }
      
      return employee
    } catch (error) {
      return null
    }
  }

  async getEmployeeByEmployeeId(employeeId: string, accessContext?: EmployeeAccessContext): Promise<Employee | null> {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          department:departments(id, name),
          position:positions(id, title),
          manager:employees!manager_id(id, full_name, employee_id)
        `)
        .eq('employee_id', employeeId)
        .single()

      if (error || !data) return null

      const employee = this.mapDatabaseToEmployee(data)
      
      // Apply role-based data filtering if access context is provided
      if (accessContext) {
        return this.filterEmployeeDataByRole(employee, accessContext)
      }
      
      return employee
    } catch (error) {
      return null
    }
  }

  async getEmployeeByEmail(email: string): Promise<Employee | null> {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          department:departments(id, name),
          position:positions(id, title),
          manager:employees!manager_id(id, full_name, employee_id)
        `)
        .eq('email', email)
        .single()

      if (error || !data) return null

      return this.mapDatabaseToEmployee(data)
    } catch (error) {
      return null
    }
  }

  async getEmployeeByUserId(userId: string, accessContext?: EmployeeAccessContext): Promise<Employee | null> {
    try {
      console.log('🔍 [EmployeeService] getEmployeeByUserId called with userId:', userId)
      
      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          department:departments(id, name),
          position:positions(id, title),
          manager:employees!manager_id(id, full_name, employee_id)
        `)
        .eq('user_id', userId)
        .single()

      console.log('🔍 [EmployeeService] Supabase query result:', { data: !!data, error: error?.message })
      
      if (error || !data) {
        console.log('❌ [EmployeeService] No employee found for userId:', userId)
        return null
      }

      const employee = this.mapDatabaseToEmployee(data)
      console.log('✅ [EmployeeService] Employee found:', { id: employee.id, fullName: employee.fullName })
      
      // Apply role-based data filtering if access context is provided
      if (accessContext) {
        return this.filterEmployeeDataByRole(employee, accessContext)
      }
      
      return employee
    } catch (error) {
      console.log('❌ [EmployeeService] Exception in getEmployeeByUserId:', error)
      return null
    }
  }

  async updateEmployee(id: string, data: UpdateEmployeeData, updatedBy: string): Promise<EmployeeResult> {
    try {
      // Check if employee exists
      const existingEmployee = await this.getEmployeeById(id)
      if (!existingEmployee) {
        throw new NotFoundError('Employee not found')
      }

      // Update employee record
      const { data: updatedEmployee, error } = await supabase
        .from('employees')
        .update({
          full_name: data.fullName,
          phone_number: data.phoneNumber,
          date_of_birth: data.dateOfBirth,
          address: data.address,
          emergency_contact: data.emergencyContact,
          emergency_phone: data.emergencyPhone,
          department_id: data.departmentId,
          position_id: data.positionId,
          manager_id: data.managerId,
          salary: data.salary,
          employment_status: data.employmentStatus,
          profile_picture: data.profilePicture,
          skills: data.skills,
          notes: data.notes,
          updated_by: updatedBy,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          *,
          department:departments(id, name),
          position:positions(id, title),
          manager:employees!manager_id(id, full_name, employee_id)
        `)
        .single()

      if (error) throw error

      const employee = this.mapDatabaseToEmployee(updatedEmployee)

      return {
        success: true,
        message: 'Employee updated successfully',
        employee
      }
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error
      }
      throw new Error('Failed to update employee')
    }
  }

  async deleteEmployee(id: string, deletedBy: string): Promise<EmployeeResult> {
    try {
      // Check if employee exists
      const existingEmployee = await this.getEmployeeById(id)
      if (!existingEmployee) {
        throw new NotFoundError('Employee not found')
      }

      // Soft delete by updating employment status
      const { error } = await supabase
        .from('employees')
        .update({
          employment_status: 'terminated',
          updated_by: deletedBy,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error

      return {
        success: true,
        message: 'Employee deleted successfully'
      }
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error
      }
      throw new Error('Failed to delete employee')
    }
  }

  async searchEmployees(filters: EmployeeSearchFilters, accessContext?: EmployeeAccessContext): Promise<EmployeeResult> {
    try {
      const _ts = new Date().toISOString()
      try {
        console.log(`[EMPLOYEES][${_ts}] searchEmployees called with filters:`, JSON.stringify(filters))
      } catch {}

      let query = supabase
        .from('employees')
        .select(`
          *,
          department:departments(id, name),
          position:positions(id, title),
          manager:employees!manager_id(id, full_name, employee_id)
        `, { count: 'exact' })

      // Apply filters
      if (filters.departmentId) {
        query = query.eq('department_id', filters.departmentId)
      }

      if (filters.positionId) {
        query = query.eq('position_id', filters.positionId)
      }

      if (filters.managerId) {
        query = query.eq('manager_id', filters.managerId)
      }

      if (filters.employmentStatus) {
        query = query.eq('employment_status', filters.employmentStatus)
      }

      if (filters.search) {
        query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,employee_id.ilike.%${filters.search}%`)
      }

      // Apply pagination
      if (filters.limit) {
        query = query.limit(filters.limit)
      }

      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
      }

      try {
        console.log(`[EMPLOYEES][${_ts}] pagination -> limit=${filters.limit ?? 'none'} offset=${filters.offset ?? 'none'}`)
      } catch {}

      const { data, error, count } = await query

      if (error) {
        try {
          console.error(`[EMPLOYEES][${_ts}] Supabase error in searchEmployees`, {
            message: (error as any).message,
            details: (error as any).details,
            hint: (error as any).hint,
            code: (error as any).code
          })
        } catch {}
        throw error
      }

      let employees = data?.map(emp => this.mapDatabaseToEmployee(emp)) || []
      
      console.log(`📋 [EmployeeService][${_ts}] Raw employees before filtering:`, employees.length)
      
      // Apply role-based data filtering if access context is provided
      if (accessContext) {
        console.log(`🔐 [EmployeeService][${_ts}] Applying role-based filtering with context:`, {
          role: accessContext.role,
          permissions: accessContext.permissions,
          userId: accessContext.userId
        })
        
        employees = employees.map(emp => {
          const filtered = this.filterEmployeeDataByRole(emp, accessContext)
          console.log(`🔍 [EmployeeService][${_ts}] Employee ${emp.fullName} filtered - showing salary: ${filtered.salary !== undefined}`)
          return filtered
        })
        
        console.log(`📋 [EmployeeService][${_ts}] Employees after filtering:`, employees.length)
      } else {
        console.log(`⚠️ [EmployeeService][${_ts}] No access context provided - returning unfiltered data`)
      }

      try {
        console.log(`[EMPLOYEES][${_ts}] searchEmployees success -> rows=${employees.length} total=${count ?? 0}`)
      } catch {}

      return {
        success: true,
        message: 'Employees retrieved successfully',
        employees,
        total: count || 0
      }
    } catch (error: any) {
      try {
        console.error(`[EMPLOYEES][${new Date().toISOString()}] searchEmployees FAILED`, {
          filters,
          error: {
            message: error?.message,
            stack: error?.stack,
            code: error?.code,
            details: error?.details,
            hint: error?.hint
          }
        })
      } catch {}
      throw new Error('Failed to search employees')
    }
  }

  async getEmployeesByManager(managerId: string): Promise<Employee[]> {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          department:departments(id, name),
          position:positions(id, title)
        `)
        .eq('manager_id', managerId)
        .eq('employment_status', 'active')

      if (error) throw error

      return data?.map(emp => this.mapDatabaseToEmployee(emp)) || []
    } catch (error) {
      return []
    }
  }

  async getEmployeesByDepartment(departmentId: string): Promise<Employee[]> {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          position:positions(id, title),
          manager:employees!manager_id(id, full_name, employee_id)
        `)
        .eq('department_id', departmentId)
        .eq('employment_status', 'active')

      if (error) throw error

      return data?.map(emp => this.mapDatabaseToEmployee(emp)) || []
    } catch (error) {
      return []
    }
  }

  private async sendEmployeeInvitation(employee: Employee, invitedBy: string): Promise<string> {
    try {
      // Generate temporary password
      const temporaryPassword = generateTemporaryPassword()

      // Create user account for the employee
      const { data: newUser, error } = await supabase
        .from('users')
        .insert({
          email: employee.email,
          full_name: employee.fullName,
          employee_id: employee.employeeId,
          password_hash: temporaryPassword, // This should be hashed in a real implementation
          is_temporary_password: true,
          account_status: 'pending_setup'
        })
        .select()
        .single()

      if (error) throw error

      // Link employee to user
      await supabase
        .from('employees')
        .update({ user_id: newUser.id })
        .eq('id', employee.id)

      // Assign default employee role
      await this.roleService.assignDefaultRole(newUser.id)

      // Send invitation email
      await this.emailService.sendEmployeeInvitationEmail(
        employee.email,
        employee.fullName,
        temporaryPassword
      )

      return temporaryPassword
    } catch (error) {
      throw new Error('Failed to send employee invitation')
    }
  }

  private async createUserAccountWithPassword(employee: Employee, password: string, createdBy: string): Promise<string> {
    try {
      // Import hash function here to avoid circular dependency
      const { hashPassword } = await import('../utils/password')
      
      // Hash the provided password
      const hashedPassword = await hashPassword(password)

      // Create user account for the employee
      const { data: newUser, error } = await supabase
        .from('users')
        .insert({
          email: employee.email,
          full_name: employee.fullName,
          employee_id: employee.employeeId,
          password_hash: hashedPassword,
          is_temporary_password: false,
          account_status: 'active', // Account is immediately active
          status: 'active',
          created_by: createdBy
        })
        .select()
        .single()

      if (error) {
        console.error('Failed to create user account:', error)
        throw new Error(`Failed to create user account: ${error.message}`)
      }

      // Link employee to user
      await supabase
        .from('employees')
        .update({ user_id: newUser.id })
        .eq('id', employee.id)

      // Assign default employee role
      await this.roleService.assignDefaultRole(newUser.id)

      return password // Return the original password for confirmation
    } catch (error: any) {
      console.error('Error in createUserAccountWithPassword:', error)
      throw new Error('Failed to create user account with password')
    }
  }

  private async generateEmployeeId(): Promise<string> {
    const prefix = 'EMP'
    let attempt = 0
    const maxAttempts = 10

    while (attempt < maxAttempts) {
      const timestamp = Date.now().toString().slice(-6)
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
      const employeeId = `${prefix}${timestamp}${random}`

      // Check if this ID already exists
      const { data: existing, error } = await supabase
        .from('employees')
        .select('id')
        .eq('employee_id', employeeId)
        .single()

      if (error && error.code === 'PGRST116') {
        // No existing employee with this ID found
        console.log(`Generated unique employee ID: ${employeeId}`)
        return employeeId
      }

      attempt++
      // Small delay before retry
      await new Promise(resolve => setTimeout(resolve, 10))
    }

    throw new Error('Failed to generate unique employee ID after multiple attempts')
  }

  private validateEmployeeData(data: CreateEmployeeData): void {
    const errors: string[] = []

    // Required fields as per project requirements
    if (!data.fullName?.trim()) {
      errors.push('Full name is required')
    }

    if (!data.email?.trim()) {
      errors.push('Email is required')
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push('Invalid email format')
    }

    if (!data.hireDate) {
      errors.push('Hire date is required')
    } else {
      const hireDate = new Date(data.hireDate)
      if (isNaN(hireDate.getTime())) {
        errors.push('Invalid hire date format')
      }
    }

    // Enhanced validation for mandatory profile completion
    if (!data.departmentId) {
      errors.push('Department is required - please complete mandatory profile information')
    }

    if (!data.positionId) {
      errors.push('Position is required - please complete mandatory profile information')
    }

    // Optional field validations
    if (data.salary && data.salary < 0) {
      errors.push('Salary must be a positive number')
    }

    if (data.dateOfBirth) {
      const birthDate = new Date(data.dateOfBirth)
      if (isNaN(birthDate.getTime())) {
        errors.push('Invalid date of birth format')
      } else {
        const age = new Date().getFullYear() - birthDate.getFullYear()
        if (age < 16 || age > 80) {
          errors.push('Employee age must be between 16 and 80 years')
        }
      }
    }

    if (data.phoneNumber && !/^[\+]?[1-9][\d]{0,15}$/.test(data.phoneNumber.replace(/[\s\-\(\)]/g, ''))) {
      errors.push('Invalid phone number format')
    }

    if (errors.length > 0) {
      throw new ValidationError('Employee validation failed', errors)
    }
  }

  async linkUserToEmployee(employeeId: string, userId: string): Promise<EmployeeResult> {
    try {
      // Check if employee exists
      const existingEmployee = await this.getEmployeeById(employeeId)
      if (!existingEmployee) {
        throw new NotFoundError('Employee not found')
      }

      // Check if employee already has a user linked
      if (existingEmployee.userId) {
        throw new ConflictError('Employee already has a user account linked')
      }

      // Update employee record to link user
      const { data: updatedEmployee, error } = await supabase
        .from('employees')
        .update({
          user_id: userId,
          updated_at: new Date().toISOString()
        })
        .eq('id', employeeId)
        .select(`
          *,
          department:departments(id, name),
          position:positions(id, title),
          manager:employees!manager_id(id, full_name, employee_id)
        `)
        .single()

      if (error) throw error

      const employee = this.mapDatabaseToEmployee(updatedEmployee)

      return {
        success: true,
        message: 'User linked to employee successfully',
        employee
      }
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ConflictError) {
        throw error
      }
      throw new Error('Failed to link user to employee')
    }
  }

  async activateEmployeeAccount(employeeId: string, activatedBy: string): Promise<EmployeeResult> {
    try {
      // Get employee details
      const employee = await this.getEmployeeById(employeeId)
      if (!employee) {
        throw new NotFoundError('Employee not found')
      }

      if (!employee.userId) {
        throw new ValidationError('Employee does not have a user account to activate')
      }

      // Update user account status to active
      const { data: updatedUser, error: userError } = await supabase
        .from('users')
        .update({
          account_status: 'active',
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', employee.userId)
        .select()
        .single()

      if (userError) {
        console.error('Failed to update user account:', userError)
        throw new Error(`Failed to activate user account: ${userError.message}`)
      }

      return {
        success: true,
        message: 'Employee account activated successfully',
        employee
      }
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error
      }
      console.error('Error in activateEmployeeAccount:', error)
      throw new Error('Failed to activate employee account')
    }
  }

  private mapDatabaseToEmployee(data: any): Employee {
    return {
      id: data.id,
      userId: data.user_id,
      employeeId: data.employee_id,
      fullName: data.full_name,
      email: data.email,
      phoneNumber: data.phone_number,
      dateOfBirth: data.date_of_birth,
      address: data.address,
      emergencyContact: data.emergency_contact,
      emergencyPhone: data.emergency_phone,
      departmentId: data.department_id,
      positionId: data.position_id,
      managerId: data.manager_id,
      hireDate: data.hire_date,
      salary: data.salary,
      employmentStatus: data.employment_status,
      profilePicture: data.profile_picture,
      skills: data.skills || [],
      notes: data.notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      createdBy: data.created_by,
      updatedBy: data.updated_by
    }
  }

  private filterEmployeeDataByRole(employee: Employee, accessContext: EmployeeAccessContext): Employee {
    console.log(`🔍 [EmployeeService] Filtering data for employee ${employee.fullName}:`, {
      employeeUserId: employee.userId,
      accessUserId: accessContext.userId,
      role: accessContext.role,
      permissions: accessContext.permissions,
      isOwner: accessContext.isOwner
    })
    
    // If user is viewing their own profile, return full data
    if (employee.userId === accessContext.userId || accessContext.isOwner) {
      console.log(`✅ [EmployeeService] Employee ${employee.fullName} - owner access, returning full data`)
      return employee
    }

    // Super-admin gets full access to all data
    if (accessContext.role === 'super-admin' || accessContext.permissions.includes('employees:read:all')) {
      console.log(`✅ [EmployeeService] Employee ${employee.fullName} - super-admin access, returning full data`)
      return employee
    }

    // HR-admin gets full access to employee data
    if (accessContext.role === 'hr-admin' || accessContext.permissions.includes('employees:read:hr')) {
      console.log(`✅ [EmployeeService] Employee ${employee.fullName} - hr-admin access, returning full data`)
      return employee
    }

    // Manager can see team data with some restrictions
    if (accessContext.role === 'manager' || accessContext.permissions.includes('employees:read:team')) {
      console.log(`✅ [EmployeeService] Employee ${employee.fullName} - manager access, applying some restrictions`)
      return {
        ...employee,
        // Managers can see salary if they have permission
        salary: accessContext.permissions.includes('employees:read:salary') ? employee.salary : undefined,
        // Show emergency contacts if they have permission
        emergencyContact: accessContext.permissions.includes('employees:read:emergency') ? employee.emergencyContact : undefined,
        emergencyPhone: accessContext.permissions.includes('employees:read:emergency') ? employee.emergencyPhone : undefined,
        // Show notes if they have permission
        notes: accessContext.permissions.includes('employees:read:notes') ? employee.notes : undefined
      }
    }

    // HR-staff can see basic employee information with emergency contacts
    if (accessContext.role === 'hr-staff') {
      console.log(`✅ [EmployeeService] Employee ${employee.fullName} - hr-staff access, limited access`)
      return {
        ...employee,
        // Hide salary for hr-staff
        salary: undefined,
        // Show emergency contacts as they may need this for HR purposes
        emergencyContact: employee.emergencyContact,
        emergencyPhone: employee.emergencyPhone,
        // Hide personal notes
        notes: undefined
      }
    }

    // Default: return limited public information for regular employees
    console.log(`⚠️ [EmployeeService] Employee ${employee.fullName} - default employee access, very limited data`)
    return {
      ...employee,
      phoneNumber: undefined,
      dateOfBirth: undefined,
      address: undefined,
      emergencyContact: undefined,
      emergencyPhone: undefined,
      salary: undefined,
      notes: undefined
    }
  }
}