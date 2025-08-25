import { describe, it, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals'
import { employeeService, CreateEmployeeData, UpdateEmployeeData } from '../../src/services/employee.service'
import { supabase } from '../../src/config/database'
import { ValidationError, ConflictError, AuthorizationError, NotFoundError } from '../../src/utils/errors'

// Mock the database
jest.mock('../../src/config/database', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
      not: jest.fn().mockReturnThis(),
      like: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      single: jest.fn(),
      count: 'exact'
    }))
  }
}))

describe('Employee Service', () => {
  const mockSupabase = supabase as jest.Mocked<typeof supabase>
  
  const mockUser = {
    id: 'user-123',
    role: 'hr_admin',
    employee_id: 'emp-123'
  }

  const mockEmployee = {
    id: 'emp-456',
    employee_number: 'EMP20240001',
    user_id: 'user-456',
    full_name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    department_id: 'dept-123',
    position_id: 'pos-123',
    manager_id: 'emp-123',
    employee_status: 'active',
    hire_date: '2024-01-15',
    employment_type: 'full_time',
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
    created_by: 'user-123',
    deleted_at: null
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createEmployee', () => {
    const createEmployeeData: CreateEmployeeData = {
      fullName: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+1234567890',
      departmentId: 'dept-123',
      positionId: 'pos-123',
      managerId: 'emp-123',
      hireDate: '2024-01-15',
      employmentType: 'full_time'
    }

    it('should create employee successfully', async () => {
      // Mock user role check
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockUser, error: null })
      } as any)

      // Mock duplicate email check
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        is: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
      } as any)

      // Mock employee number generation
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        like: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
      } as any)

      // Mock existing user check
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
      } as any)

      // Mock user creation
      mockSupabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ 
          data: { id: 'user-456', full_name: 'John Doe', email: 'john.doe@example.com' }, 
          error: null 
        })
      } as any)

      // Mock employee creation
      mockSupabase.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockEmployee, error: null })
      } as any)

      // Mock hierarchy creation
      mockSupabase.from.mockReturnValueOnce({
        insert: jest.fn().mockResolvedValue({ data: {}, error: null })
      } as any)

      // Mock audit log
      mockSupabase.from.mockReturnValueOnce({
        insert: jest.fn().mockResolvedValue({ data: {}, error: null })
      } as any)

      const result = await employeeService.createEmployee(createEmployeeData, mockUser.id)

      expect(result.success).toBe(true)
      expect(result.employee).toBeDefined()
      expect(result.employee?.fullName).toBe('John Doe')
    })

    it('should throw ValidationError for invalid email', async () => {
      const invalidData = { ...createEmployeeData, email: 'invalid-email' }

      await expect(employeeService.createEmployee(invalidData, mockUser.id))
        .rejects.toThrow(ValidationError)
    })

    it('should throw ConflictError for duplicate email', async () => {
      // Mock user role check
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockUser, error: null })
      } as any)

      // Mock duplicate email check - return existing employee
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        is: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { id: 'existing-emp' }, error: null })
      } as any)

      await expect(employeeService.createEmployee(createEmployeeData, mockUser.id))
        .rejects.toThrow(ConflictError)
    })

    it('should throw AuthorizationError for insufficient permissions', async () => {
      // Mock user role check - return employee role
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ 
          data: { ...mockUser, role: 'employee' }, 
          error: null 
        })
      } as any)

      await expect(employeeService.createEmployee(createEmployeeData, mockUser.id))
        .rejects.toThrow(AuthorizationError)
    })
  })

  describe('getEmployeeById', () => {
    it('should get employee successfully', async () => {
      // Mock user role check
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockUser, error: null })
      } as any)

      // Mock employee fetch
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        is: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockEmployee, error: null })
      } as any)

      const employee = await employeeService.getEmployeeById('emp-456', mockUser.id)

      expect(employee).toBeDefined()
      expect(employee?.id).toBe('emp-456')
      expect(employee?.fullName).toBe('John Doe')
    })

    it('should return null for non-existent employee', async () => {
      // Mock user role check
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockUser, error: null })
      } as any)

      // Mock employee fetch - not found
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        is: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
      } as any)

      const employee = await employeeService.getEmployeeById('non-existent', mockUser.id)

      expect(employee).toBeNull()
    })
  })

  describe('updateEmployee', () => {
    const updateData: UpdateEmployeeData = {
      fullName: 'John Updated',
      phone: '+9876543210'
    }

    it('should update employee successfully', async () => {
      // Mock user role check
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockUser, error: null })
      } as any)

      // Mock get existing employee
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        is: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockEmployee, error: null })
      } as any)

      // Mock employee update
      mockSupabase.from.mockReturnValueOnce({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ 
          data: { ...mockEmployee, full_name: 'John Updated' }, 
          error: null 
        })
      } as any)

      const result = await employeeService.updateEmployee('emp-456', updateData, mockUser.id)

      expect(result.success).toBe(true)
      expect(result.employee?.fullName).toBe('John Updated')
    })

    it('should throw NotFoundError for non-existent employee', async () => {
      // Mock user role check
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockUser, error: null })
      } as any)

      // Mock get existing employee - not found
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        is: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
      } as any)

      await expect(employeeService.updateEmployee('non-existent', updateData, mockUser.id))
        .rejects.toThrow(NotFoundError)
    })
  })

  describe('deleteEmployee', () => {
    it('should soft delete employee successfully', async () => {
      // Mock user role check
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockUser, error: null })
      } as any)

      // Mock get existing employee
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        is: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockEmployee, error: null })
      } as any)

      // Mock check for active tasks
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: [], error: null })
      } as any)

      // Mock employee soft delete
      mockSupabase.from.mockReturnValueOnce({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ 
          data: { ...mockEmployee, deleted_at: new Date().toISOString() }, 
          error: null 
        })
      } as any)

      // Mock hierarchy deactivation
      mockSupabase.from.mockReturnValueOnce({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        mockResolvedValue: { data: {}, error: null }
      } as any)

      // Mock user deactivation
      mockSupabase.from.mockReturnValueOnce({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        mockResolvedValue: { data: {}, error: null }
      } as any)

      // Mock audit log
      mockSupabase.from.mockReturnValueOnce({
        insert: jest.fn().mockResolvedValue({ data: {}, error: null })
      } as any)

      const result = await employeeService.deleteEmployee('emp-456', mockUser.id)

      expect(result.success).toBe(true)
    })

    it('should throw ConflictError when employee has active tasks', async () => {
      // Mock user role check
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockUser, error: null })
      } as any)

      // Mock get existing employee
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        is: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockEmployee, error: null })
      } as any)

      // Mock check for active tasks - return active task
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: [{ id: 'task-123' }], error: null })
      } as any)

      await expect(employeeService.deleteEmployee('emp-456', mockUser.id))
        .rejects.toThrow(ConflictError)
    })
  })

  describe('searchEmployees', () => {
    it('should search employees successfully', async () => {
      // Mock user role check
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockUser, error: null })
      } as any)

      // Mock employee search
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        is: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({ 
          data: [mockEmployee], 
          error: null, 
          count: 1 
        })
      } as any)

      const result = await employeeService.searchEmployees(
        { search: 'John', page: 1, limit: 10 },
        mockUser.id
      )

      expect(result.success).toBe(true)
      expect(result.employees).toHaveLength(1)
      expect(result.total).toBe(1)
    })
  })

  describe('validation', () => {
    it('should validate email format', () => {
      const invalidData = { fullName: 'Test', email: 'invalid-email' }
      
      expect(() => {
        // Access private method through any cast for testing
        ;(employeeService as any).validateEmployeeData(invalidData)
      }).toThrow(ValidationError)
    })

    it('should validate phone format', () => {
      const invalidData = { fullName: 'Test', phone: 'invalid-phone' }
      
      expect(() => {
        ;(employeeService as any).validateEmployeeData(invalidData)
      }).toThrow(ValidationError)
    })

    it('should validate performance rating range', () => {
      const invalidData = { fullName: 'Test', performanceRating: 6 }
      
      expect(() => {
        ;(employeeService as any).validateEmployeeData(invalidData)
      }).toThrow(ValidationError)
    })
  })
})