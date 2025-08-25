// Employee related TypeScript interfaces for frontend-backend consistency

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
  employmentStatus: 'active' | 'inactive' | 'terminated' | 'on-leave'
  profilePicture?: string
  skills?: string[]
  notes?: string
  createdAt: string
  updatedAt: string
  createdBy: string
  updatedBy?: string
  // Related data for display
  department?: {
    id: string
    name: string
  }
  position?: {
    id: string
    title: string
  }
  manager?: {
    id: string
    fullName: string
    employeeId: string
  }
}

export interface CreateEmployeeData {
  fullName: string
  email: string
  phoneNumber?: string
  dateOfBirth?: string
  address?: string
  emergencyContact?: string
  emergencyPhone?: string
  departmentId?: string  // Required per project requirements
  positionId?: string    // Required per project requirements
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
  status?: string
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

// Department and Position interfaces for employee forms
export interface Department {
  id: string
  name: string
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Position {
  id: string
  title: string
  description?: string
  departmentId?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface EmployeeStatistics {
  totalEmployees: number
  activeEmployees: number
  inactiveEmployees: number
  terminatedEmployees: number
  onLeaveEmployees: number
  departmentBreakdown: Array<{
    departmentId: string
    departmentName: string
    count: number
  }>
  positionBreakdown: Array<{
    positionId: string
    positionTitle: string
    count: number
  }>
}