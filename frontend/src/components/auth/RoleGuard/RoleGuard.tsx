import React from 'react'
import { useAuth } from '../../../hooks/useAuth'

export interface RoleGuardProps {
  children: React.ReactNode
  allowedRoles?: string[]
  requiredPermissions?: string[]
  requireAnyPermission?: boolean
  fallback?: React.ReactNode
  hideIfNoAccess?: boolean
}

const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  allowedRoles = [],
  requiredPermissions = [],
  requireAnyPermission = false,
  fallback = null,
  hideIfNoAccess = false,
}) => {
  const { user } = useAuth()

  // If no user, don't render anything
  if (!user) {
    return hideIfNoAccess ? null : <>{fallback}</>
  }

  // Check role access
  if (allowedRoles.length > 0) {
    const hasRoleAccess = allowedRoles.includes(user.role) || checkRoleHierarchy(user.role, allowedRoles)
    
    if (!hasRoleAccess) {
      return hideIfNoAccess ? null : <>{fallback}</>
    }
  }

  // Check permission access
  if (requiredPermissions.length > 0) {
    const hasPermissionAccess = checkUserPermissions(user, requiredPermissions, requireAnyPermission)
    
    if (!hasPermissionAccess) {
      return hideIfNoAccess ? null : <>{fallback}</>
    }
  }

  return <>{children}</>
}

// Helper function to check role hierarchy
const checkRoleHierarchy = (userRole: string, allowedRoles: string[]): boolean => {
  const roleHierarchy = ['employee', 'hr-staff', 'manager', 'hr-admin', 'super-admin']
  const userRoleIndex = roleHierarchy.indexOf(userRole)
  
  if (userRoleIndex === -1) return false
  
  // Check if user has a role that's equal or higher than any allowed role
  return allowedRoles.some(role => {
    const allowedRoleIndex = roleHierarchy.indexOf(role)
    return allowedRoleIndex !== -1 && userRoleIndex >= allowedRoleIndex
  })
}

// Helper function to check user permissions (same as ProtectedRoute)
const checkUserPermissions = (
  user: any,
  requiredPermissions: string[],
  requireAnyPermission: boolean
): boolean => {
  const rolePermissions: Record<string, string[]> = {
    'super-admin': ['*'],
    'hr-admin': [
      'employee.create',
      'employee.read',
      'employee.update',
      'employee.delete',
      'roles.manage',
      'roles.assign',
      'reports.generate',
      'payroll.manage',
      'recruitment.manage',
      'tasks.create',
      'tasks.read',
      'tasks.update',
      'tasks.delete',
      'tasks.assign',
    ],
    'manager': [
      'employee.read',
      'employee.update',
      'tasks.create',
      'tasks.read',
      'tasks.update',
      'tasks.assign',
      'reports.generate',
    ],
    'hr-staff': [
      'employee.create',
      'employee.read',
      'employee.update',
      'recruitment.manage',
      'tasks.read',
      'tasks.update',
    ],
    'employee': [
      'tasks.read',
      'tasks.update',
      'profile.update',
    ],
  }

  const userPermissions = rolePermissions[user.role] || []
  
  if (userPermissions.includes('*')) {
    return true
  }

  if (requireAnyPermission) {
    return requiredPermissions.some(permission => 
      userPermissions.includes(permission)
    )
  } else {
    return requiredPermissions.every(permission => 
      userPermissions.includes(permission)
    )
  }
}

export default RoleGuard