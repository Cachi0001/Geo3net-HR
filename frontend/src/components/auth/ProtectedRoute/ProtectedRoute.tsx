import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../../hooks/useAuth'
import { LoadingSpinner } from '../../common'

export interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: string
  requiredPermissions?: string[]
  requireAnyPermission?: boolean
  fallbackPath?: string
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  requiredPermissions = [],
  requireAnyPermission = false,
  fallbackPath = '/login',
}) => {
  const { user, loading } = useAuth()
  const location = useLocation()

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="protected-route-loading">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />
  }

  // Check role requirement
  if (requiredRole && user.role !== requiredRole) {
    // Check if user has a higher role (basic role hierarchy)
    const roleHierarchy = ['employee', 'hr-staff', 'manager', 'hr-admin', 'super-admin']
    const userRoleIndex = roleHierarchy.indexOf(user.role)
    const requiredRoleIndex = roleHierarchy.indexOf(requiredRole)
    
    if (userRoleIndex === -1 || userRoleIndex < requiredRoleIndex) {
      return <Navigate to="/unauthorized" replace />
    }
  }

  // Check permission requirements
  if (requiredPermissions.length > 0) {
    // This would need to be implemented with actual permission checking
    // For now, we'll use a basic role-based check
    const hasPermissions = checkUserPermissions(user, requiredPermissions, requireAnyPermission)
    
    if (!hasPermissions) {
      return <Navigate to="/unauthorized" replace />
    }
  }

  return <>{children}</>
}

// Helper function to check user permissions
// This is a simplified version - in a real app, you'd fetch permissions from the server
const checkUserPermissions = (
  user: any,
  requiredPermissions: string[],
  requireAnyPermission: boolean
): boolean => {
  // Basic role-based permission mapping
  const rolePermissions: Record<string, string[]> = {
    'super-admin': ['*'], // Super admin has all permissions
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
  
  // Super admin has all permissions
  if (userPermissions.includes('*')) {
    return true
  }

  if (requireAnyPermission) {
    // User needs at least one of the required permissions
    return requiredPermissions.some(permission => 
      userPermissions.includes(permission)
    )
  } else {
    // User needs all required permissions
    return requiredPermissions.every(permission => 
      userPermissions.includes(permission)
    )
  }
}

export default ProtectedRoute