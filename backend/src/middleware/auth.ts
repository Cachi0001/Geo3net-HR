import { Request, Response, NextFunction } from 'express'
import { verifyToken, TokenPayload } from '../utils/jwt'
import { RoleService } from '../services/role.service'

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    email: string
    role: string
  }
}

const roleService = new RoleService()

export const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  console.log('🔍 [AuthMiddleware] Request URL:', req.url)
  const authHeader = req.headers.authorization
  const token = authHeader && authHeader.split(' ')[1]
  console.log('🔍 [AuthMiddleware] Token present:', !!token)

  if (!token) {
    console.log('❌ [AuthMiddleware] No token provided')
    return res.status(401).json({ 
      success: false, 
      message: 'Access token required' 
    })
  }

  try {
    const decoded = verifyToken(token)
    console.log('🔍 [AuthMiddleware] Decoded token:', {
      userId: (decoded as TokenPayload).userId,
      email: (decoded as TokenPayload).email,
      role: (decoded as TokenPayload).role
    })

    const userId = (decoded as TokenPayload).userId
    const email = (decoded as TokenPayload).email

    // For critical operations, fetch current role from database
    // For performance, we'll use token role for most requests but validate for sensitive operations
    let currentRole = (decoded as TokenPayload).role

    // For role-sensitive endpoints, fetch current role from database
    const sensitiveEndpoints = ['/auth/me', '/roles/', '/admin/', '/users/']
    const isSensitiveEndpoint = sensitiveEndpoints.some(endpoint => req.url.includes(endpoint))
    
    if (isSensitiveEndpoint) {
      console.log('🔍 [AuthMiddleware] Sensitive endpoint detected, fetching current role from database')
      try {
        const activeRole = await roleService.getActiveRole(userId)
        if (activeRole) {
          currentRole = activeRole.roleName
          console.log('✅ [AuthMiddleware] Updated role from database:', currentRole)
        } else {
          console.log('⚠️ [AuthMiddleware] No active role found in database, using token role')
        }
      } catch (roleError) {
        console.warn('⚠️ [AuthMiddleware] Failed to fetch role from database, using token role:', roleError)
      }
    }

    // Set user data on request
    req.user = {
      id: userId,
      email: email,
      role: currentRole,
    }
    
    console.log('✅ [AuthMiddleware] Authentication successful:', {
      userId: req.user.id,
      email: req.user.email,
      role: req.user.role
    })
    
    next()
  } catch (error) {
    console.log('❌ [AuthMiddleware] Token verification failed:', error)
    return res.status(403).json({ 
      success: false, 
      message: 'Invalid or expired token' 
    })
  }
}

export const requireRole = (allowedRoles: string[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      console.log('❌ [RoleMiddleware] No authenticated user')
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      })
    }

    console.log('🔍 [RoleMiddleware] Checking role access:', {
      userRole: req.user.role,
      allowedRoles,
      hasAccess: allowedRoles.includes(req.user.role)
    })

    // Always fetch current role from database for role-based access control
    try {
      const activeRole = await roleService.getActiveRole(req.user.id)
      const currentRole = activeRole?.roleName || req.user.role

      if (!allowedRoles.includes(currentRole)) {
        console.log('❌ [RoleMiddleware] Access denied:', {
          userRole: currentRole,
          allowedRoles
        })
        return res.status(403).json({ 
          success: false, 
          message: `Access denied. Required roles: ${allowedRoles.join(', ')}. Your role: ${currentRole}` 
        })
      }

      // Update req.user with current role
      req.user.role = currentRole
      
      console.log('✅ [RoleMiddleware] Access granted:', {
        userRole: currentRole,
        allowedRoles
      })
      
      next()
    } catch (error) {
      console.error('❌ [RoleMiddleware] Error checking role:', error)
      return res.status(500).json({
        success: false,
        message: 'Error validating permissions'
      })
    }
  }
}

export const optionalAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization
  const token = authHeader && authHeader.split(' ')[1]

  if (token) {
    try {
      const decoded = verifyToken(token) as TokenPayload
      req.user = {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      }
    } catch (error) {
      req.user = undefined
    }
  }

  next()
}