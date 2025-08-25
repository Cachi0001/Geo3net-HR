import { TaskService } from '../../src/services/task.service'
import { RoleService } from '../../src/services/role.service'
import { supabase } from '../../src/config/database'
import { AuthorizationError } from '../../src/utils/errors'

// Mock dependencies
jest.mock('../../src/config/database')
jest.mock('../../src/services/role.service')

const mockSupabase = supabase as jest.Mocked<typeof supabase>
const MockRoleService = RoleService as jest.MockedClass<typeof RoleService>

describe('TaskService - Role-based Assignment Validation', () => {
    let taskService: TaskService
    let mockRoleService: jest.Mocked<RoleService>

    beforeEach(() => {
        jest.clearAllMocks()
        mockRoleService = new MockRoleService() as jest.Mocked<RoleService>
        taskService = new TaskService()
            // Replace the roleService instance
            ; (taskService as any).roleService = mockRoleService
    })

    describe('validateTaskAssignment', () => {
        it('should allow super-admin to assign to anyone', async () => {
            // Setup
            const assignerId = 'super-admin-id'
            const assigneeId = 'employee-id'

            mockRoleService.getActiveRole
                .mockResolvedValueOnce({
                    id: '1',
                    userId: assignerId,
                    roleName: 'super-admin',
                    permissions: ['*'],
                    assignedAt: new Date().toISOString(),
                    isActive: true
                })
                .mockResolvedValueOnce({
                    id: '2',
                    userId: assigneeId,
                    roleName: 'employee',
                    permissions: ['tasks.read'],
                    assignedAt: new Date().toISOString(),
                    isActive: true
                })

            // Execute - should not throw
            await expect((taskService as any).validateTaskAssignment(assignerId, assigneeId))
                .resolves.not.toThrow()
        })

        it('should allow manager to assign to employee in same department', async () => {
            // Setup
            const managerId = 'manager-id'
            const employeeId = 'employee-id'

            mockRoleService.getActiveRole
                .mockResolvedValueOnce({
                    id: '1',
                    userId: managerId,
                    roleName: 'manager',
                    permissions: ['tasks.assign'],
                    assignedAt: new Date().toISOString(),
                    isActive: true
                })
                .mockResolvedValueOnce({
                    id: '2',
                    userId: employeeId,
                    roleName: 'employee',
                    permissions: ['tasks.read'],
                    assignedAt: new Date().toISOString(),
                    isActive: true
                })

            mockRoleService.getRoleLevel
                .mockReturnValueOnce(3) // manager level
                .mockReturnValueOnce(1) // employee level

            // Mock user hierarchy data
            mockSupabase.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn()
                            .mockResolvedValueOnce({
                                data: {
                                    id: managerId,
                                    department_id: 'dept-1',
                                    manager_id: null
                                },
                                error: null
                            })
                            .mockResolvedValueOnce({
                                data: {
                                    id: employeeId,
                                    department_id: 'dept-1',
                                    manager_id: managerId
                                },
                                error: null
                            })
                    })
                })
            } as any)

            // Execute - should not throw
            await expect((taskService as any).validateTaskAssignment(managerId, employeeId))
                .resolves.not.toThrow()
        })

        it('should reject assignment when assigner has no task assignment permissions', async () => {
            // Setup
            const employeeId1 = 'employee-1'
            const employeeId2 = 'employee-2'

            mockRoleService.getActiveRole
                .mockResolvedValueOnce({
                    id: '1',
                    userId: employeeId1,
                    roleName: 'employee',
                    permissions: ['tasks.read'], // No tasks.assign permission
                    assignedAt: new Date().toISOString(),
                    isActive: true
                })
                .mockResolvedValueOnce({
                    id: '2',
                    userId: employeeId2,
                    roleName: 'employee',
                    permissions: ['tasks.read'],
                    assignedAt: new Date().toISOString(),
                    isActive: true
                })

            // Execute - should throw AuthorizationError
            await expect((taskService as any).validateTaskAssignment(employeeId1, employeeId2))
                .rejects.toThrow(AuthorizationError)
        })

        it('should reject assignment when assigner has lower role level than assignee', async () => {
            // Setup
            const employeeId = 'employee-id'
            const managerId = 'manager-id'

            mockRoleService.getActiveRole
                .mockResolvedValueOnce({
                    id: '1',
                    userId: employeeId,
                    roleName: 'employee',
                    permissions: ['tasks.assign'], // Has permission but lower level
                    assignedAt: new Date().toISOString(),
                    isActive: true
                })
                .mockResolvedValueOnce({
                    id: '2',
                    userId: managerId,
                    roleName: 'manager',
                    permissions: ['tasks.read'],
                    assignedAt: new Date().toISOString(),
                    isActive: true
                })

            mockRoleService.getRoleLevel
                .mockReturnValueOnce(1) // employee level
                .mockReturnValueOnce(3) // manager level

            // Mock user hierarchy data
            mockSupabase.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn()
                            .mockResolvedValueOnce({
                                data: {
                                    id: employeeId,
                                    department_id: 'dept-1',
                                    manager_id: managerId
                                },
                                error: null
                            })
                            .mockResolvedValueOnce({
                                data: {
                                    id: managerId,
                                    department_id: 'dept-1',
                                    manager_id: null
                                },
                                error: null
                            })
                    })
                })
            } as any)

            // Execute - should throw AuthorizationError
            await expect((taskService as any).validateTaskAssignment(employeeId, managerId))
                .rejects.toThrow(AuthorizationError)
        })

        it('should allow HR admin to assign to employees', async () => {
            // Setup
            const hrAdminId = 'hr-admin-id'
            const employeeId = 'employee-id'

            mockRoleService.getActiveRole
                .mockResolvedValueOnce({
                    id: '1',
                    userId: hrAdminId,
                    roleName: 'hr-admin',
                    permissions: ['tasks.assign'],
                    assignedAt: new Date().toISOString(),
                    isActive: true
                })
                .mockResolvedValueOnce({
                    id: '2',
                    userId: employeeId,
                    roleName: 'employee',
                    permissions: ['tasks.read'],
                    assignedAt: new Date().toISOString(),
                    isActive: true
                })

            mockRoleService.getRoleLevel
                .mockReturnValueOnce(4) // hr-admin level
                .mockReturnValueOnce(1) // employee level

            // Mock user hierarchy data
            mockSupabase.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn()
                            .mockResolvedValueOnce({
                                data: {
                                    id: hrAdminId,
                                    department_id: 'hr-dept',
                                    manager_id: null
                                },
                                error: null
                            })
                            .mockResolvedValueOnce({
                                data: {
                                    id: employeeId,
                                    department_id: 'other-dept',
                                    manager_id: 'other-manager'
                                },
                                error: null
                            })
                    })
                })
            } as any)

            // Execute - should not throw
            await expect((taskService as any).validateTaskAssignment(hrAdminId, employeeId))
                .resolves.not.toThrow()
        })

        it('should allow assignment to direct reports', async () => {
            // Setup
            const managerId = 'manager-id'
            const employeeId = 'employee-id'

            mockRoleService.getActiveRole
                .mockResolvedValueOnce({
                    id: '1',
                    userId: managerId,
                    roleName: 'manager',
                    permissions: ['tasks.assign'],
                    assignedAt: new Date().toISOString(),
                    isActive: true
                })
                .mockResolvedValueOnce({
                    id: '2',
                    userId: employeeId,
                    roleName: 'employee',
                    permissions: ['tasks.read'],
                    assignedAt: new Date().toISOString(),
                    isActive: true
                })

            mockRoleService.getRoleLevel
                .mockReturnValueOnce(3) // manager level
                .mockReturnValueOnce(1) // employee level

            // Mock user hierarchy data - employee reports to manager
            mockSupabase.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn()
                            .mockResolvedValueOnce({
                                data: {
                                    id: managerId,
                                    department_id: 'dept-1',
                                    manager_id: null
                                },
                                error: null
                            })
                            .mockResolvedValueOnce({
                                data: {
                                    id: employeeId,
                                    department_id: 'dept-2', // Different department
                                    manager_id: managerId // But reports to this manager
                                },
                                error: null
                            })
                    })
                })
            } as any)

            // Execute - should not throw
            await expect((taskService as any).validateTaskAssignment(managerId, employeeId))
                .resolves.not.toThrow()
        })

        it('should reject assignment when assigner has no active role', async () => {
            // Setup
            const assignerId = 'no-role-user'
            const assigneeId = 'employee-id'

            mockRoleService.getActiveRole
                .mockResolvedValueOnce(null) // No active role
                .mockResolvedValueOnce({
                    id: '2',
                    userId: assigneeId,
                    roleName: 'employee',
                    permissions: ['tasks.read'],
                    assignedAt: new Date().toISOString(),
                    isActive: true
                })

            // Execute - should throw AuthorizationError
            await expect((taskService as any).validateTaskAssignment(assignerId, assigneeId))
                .rejects.toThrow(AuthorizationError)
        })

        it('should reject assignment when assignee has no active role', async () => {
            // Setup
            const assignerId = 'manager-id'
            const assigneeId = 'no-role-user'

            mockRoleService.getActiveRole
                .mockResolvedValueOnce({
                    id: '1',
                    userId: assignerId,
                    roleName: 'manager',
                    permissions: ['tasks.assign'],
                    assignedAt: new Date().toISOString(),
                    isActive: true
                })
                .mockResolvedValueOnce(null) // No active role

            // Execute - should throw AuthorizationError
            await expect((taskService as any).validateTaskAssignment(assignerId, assigneeId))
                .rejects.toThrow(AuthorizationError)
        })
    })

    describe('getAssignableUsers', () => {
        it('should return all users for super-admin', async () => {
            // Setup
            const superAdminId = 'super-admin-id'

            mockRoleService.getActiveRole.mockResolvedValueOnce({
                id: '1',
                userId: superAdminId,
                roleName: 'super-admin',
                permissions: ['*'],
                assignedAt: new Date().toISOString(),
                isActive: true
            })

            const mockUsers = [
                { id: '1', email: 'user1@test.com', full_name: 'User 1' },
                { id: '2', email: 'user2@test.com', full_name: 'User 2' }
            ]

            mockSupabase.from.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        data: mockUsers,
                        error: null
                    })
                })
            } as any)

            // Execute
            const result = await taskService.getAssignableUsers(superAdminId)

            // Assert
            expect(result).toEqual(mockUsers)
        })

        it('should return empty array when user has no active role', async () => {
            // Setup
            const userId = 'no-role-user'

            mockRoleService.getActiveRole.mockResolvedValueOnce(null)

            // Execute
            const result = await taskService.getAssignableUsers(userId)

            // Assert
            expect(result).toEqual([])
        })
    })
})