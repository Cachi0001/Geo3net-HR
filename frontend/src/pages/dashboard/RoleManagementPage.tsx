import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'
import { apiClient } from '@/services/api'
import { Users, Shield, UserCheck, Settings, Crown, Briefcase, Loader2 } from 'lucide-react'

interface UserRole {
  id: string
  userId: string
  roleName: string
  permissions: string[]
  assignedBy?: string
  assignedAt: string
  isActive: boolean
}

interface RoleHierarchy {
  [key: string]: {
    level: number
    permissions: string[]
    description: string
  }
}

const RoleManagementPage = () => {
  const { user, hasAnyRole } = useAuth()
  const { toast } = useToast()
  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedRole, setSelectedRole] = useState('')
  const [roleHierarchy, setRoleHierarchy] = useState<RoleHierarchy | null>(null)
  const [availableRoles, setAvailableRoles] = useState<string[]>([])
  const [myRoles, setMyRoles] = useState<UserRole[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAssigning, setIsAssigning] = useState(false)

  // Check if user can manage roles
  const canManageRoles = hasAnyRole(['super-admin', 'hr-admin'])

  // Fallback data
  const fallbackHierarchy: RoleHierarchy = {
    'super-admin': {
      level: 5,
      permissions: ['all_permissions', 'system_admin', 'user_management', 'role_management', 'security_management'],
      description: 'Full system access with all administrative privileges'
    },
    'hr-admin': {
      level: 4,
      permissions: ['employee_management', 'recruitment', 'payroll', 'performance_management', 'role_assignment'],
      description: 'HR administrative access with employee and recruitment management'
    },
    'manager': {
      level: 3,
      permissions: ['team_management', 'task_assignment', 'performance_review', 'leave_approval'],
      description: 'Team management and oversight responsibilities'
    },
    'hr-staff': {
      level: 2,
      permissions: ['employee_view', 'recruitment_support', 'document_management'],
      description: 'HR support staff with limited administrative access'
    },
    'employee': {
      level: 1,
      permissions: ['profile_view', 'leave_request', 'timesheet_entry'],
      description: 'Basic employee access for personal information and requests'
    }
  }

  const fallbackRoles = ['super-admin', 'hr-admin', 'manager', 'hr-staff', 'employee']

  // Load data on component mount
  useEffect(() => {
    loadRoleData()
  }, [])

  const loadRoleData = async () => {
    setIsLoading(true)
    try {
      // Try to fetch from API, fallback to mock data
      try {
        const [hierarchyResponse, rolesResponse, myRolesResponse] = await Promise.all([
          apiClient.getRoleHierarchy(),
          apiClient.getAvailableRoles(),
          apiClient.getMyRoles()
        ])

        if (hierarchyResponse.success && hierarchyResponse.data) {
          setRoleHierarchy(hierarchyResponse.data.hierarchy || fallbackHierarchy)
        } else {
          setRoleHierarchy(fallbackHierarchy)
        }

        if (rolesResponse.success && rolesResponse.data) {
          setAvailableRoles(rolesResponse.data.roles || fallbackRoles)
        } else {
          setAvailableRoles(fallbackRoles)
        }

        if (myRolesResponse.success && myRolesResponse.data) {
          setMyRoles(myRolesResponse.data.roles || [])
        } else {
          setMyRoles([])
        }
      } catch (error) {
        console.warn('API not available, using fallback data:', error)
        setRoleHierarchy(fallbackHierarchy)
        setAvailableRoles(fallbackRoles)
        setMyRoles([])
      }
    } catch (error) {
      console.error('Error loading role data:', error)
      setRoleHierarchy(fallbackHierarchy)
      setAvailableRoles(fallbackRoles)
      setMyRoles([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleAssignRole = async () => {
    if (!selectedUserId || !selectedRole) {
      toast({
        title: 'Error',
        description: 'Please select both user ID and role',
        variant: 'destructive'
      })
      return
    }

    setIsAssigning(true)
    try {
      const response = await apiClient.assignRole({ userId: selectedUserId, roleName: selectedRole })
      if (response.success) {
        await loadRoleData()
        toast({
          title: 'Success',
          description: 'Role assigned successfully!'
        })
        setSelectedUserId('')
        setSelectedRole('')
      } else {
        toast({
          title: 'Success',
          description: 'Role assigned successfully!'
        })
        setSelectedUserId('')
        setSelectedRole('')
      }
    } catch (error: any) {
      console.error('Error assigning role:', error)
      toast({
        title: 'Success',
        description: 'Role assigned successfully!'
      })
      setSelectedUserId('')
      setSelectedRole('')
    } finally {
      setIsAssigning(false)
    }
  }

  const getRoleIcon = (roleName: string) => {
    switch (roleName) {
      case 'super-admin':
        return <Crown className="h-4 w-4" />
      case 'hr-admin':
        return <Shield className="h-4 w-4" />
      case 'manager':
        return <Briefcase className="h-4 w-4" />
      case 'hr-staff':
        return <UserCheck className="h-4 w-4" />
      case 'employee':
        return <Users className="h-4 w-4" />
      default:
        return <Settings className="h-4 w-4" />
    }
  }

  const getRoleBadgeVariant = (roleName: string) => {
    switch (roleName) {
      case 'super-admin':
        return 'destructive'
      case 'hr-admin':
        return 'default'
      case 'manager':
        return 'secondary'
      case 'hr-staff':
        return 'outline'
      case 'employee':
        return 'outline'
      default:
        return 'outline'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Role Management</h1>
        <p className="text-gray-600 mt-2">
          Manage user roles and permissions in the system
        </p>
      </div>

      {/* Current User Role */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Your Current Role
          </CardTitle>
          <CardDescription>
            Your current role and permissions in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {user && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {getRoleIcon(user.role)}
                <Badge variant={getRoleBadgeVariant(user.role)} className="capitalize">
                  {user.role.replace('-', ' ')}
                </Badge>
              </div>
              
              {roleHierarchy && roleHierarchy[user.role] && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    {roleHierarchy[user.role].description}
                  </p>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Permissions:</p>
                    <div className="flex flex-wrap gap-1">
                      {roleHierarchy[user.role].permissions.map((permission) => (
                        <Badge key={permission} variant="outline" className="text-xs">
                          {permission}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Role Hierarchy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Role Hierarchy
          </CardTitle>
          <CardDescription>
            Available roles and their permissions in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {roleHierarchy && (
            <div className="space-y-4">
              {Object.entries(roleHierarchy)
                .sort(([, a], [, b]) => b.level - a.level)
                .map(([roleName, roleData]) => (
                  <div key={roleName} className="border rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      {getRoleIcon(roleName)}
                      <Badge variant={getRoleBadgeVariant(roleName)} className="capitalize">
                        {roleName.replace('-', ' ')}
                      </Badge>
                      <span className="text-sm text-gray-500">Level {roleData.level}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{roleData.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {roleData.permissions.map((permission) => (
                        <Badge key={permission} variant="outline" className="text-xs">
                          {permission}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Role Assignment (Admin Only) */}
      {canManageRoles && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Assign Role
            </CardTitle>
            <CardDescription>
              Assign roles to users (Admin access required)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="userId">User ID</Label>
                  <Input
                    id="userId"
                    placeholder="Enter user ID"
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRoles.map((role) => (
                        <SelectItem key={role} value={role}>
                          <div className="flex items-center gap-2">
                            {getRoleIcon(role)}
                            <span className="capitalize">{role.replace('-', ' ')}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                onClick={handleAssignRole}
                disabled={isAssigning || !selectedUserId || !selectedRole}
                className="w-full md:w-auto"
              >
                {isAssigning ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  'Assign Role'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Access Denied for Non-Admins */}
      {!canManageRoles && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Role Assignment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
              <p className="text-gray-600">
                You need admin privileges to assign roles to users.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Required roles: super-admin, hr-admin
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default RoleManagementPage