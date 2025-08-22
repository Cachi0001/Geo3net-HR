import { Request, Response, NextFunction } from 'express'
import { AuthService } from '../services/auth.service'
import { supabase } from '../config/database'
import { AuthenticatedRequest } from '../middleware/auth'
import { validatePasswordStrength } from '../utils/password'
import { ResponseHandler } from '../utils/response'
import { ValidationError } from '../utils/errors'
import Joi from 'joi'

const authService = new AuthService()

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  fullName: Joi.string().min(2).max(100).required(),
  password: Joi.string().min(8).required()
})

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  rememberMe: Joi.boolean().optional()
})

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required()
})

const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  newPassword: Joi.string().min(8).required()
})

const googleAuthSchema = Joi.object({
  googleToken: Joi.string().required(),
  fullName: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required()
})

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { error, value } = registerSchema.validate(req.body)
    if (error) {
      const errors = error.details.map(detail => detail.message)
      throw new ValidationError('Validation failed', errors)
    }

    const { email, fullName, password } = value

    const passwordValidation = validatePasswordStrength(password)
    if (!passwordValidation.isValid) {
      throw new ValidationError('Password does not meet requirements', passwordValidation.errors)
    }

    const result = await authService.registerWithEmail({
      email,
      fullName,
      password
    })

    return ResponseHandler.created(res, result.message || 'Account created successfully!', {
      user: result.user
    })
  } catch (error: any) {
    console.error('❌ Registration error in controller:', {
      message: error.message,
      stack: error.stack,
      body: req.body,
      timestamp: new Date().toISOString()
    })
    next(error)
  }
}

// Get current authenticated user
export const me = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return ResponseHandler.unauthorized(res, 'Authentication required')
    }

    const { id: userId } = req.user

    console.log(`🔍 [AuthController] Fetching current user data for: ${userId}`)

    // Fetch user data from database
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, full_name, employee_id, account_status, status')
      .eq('id', userId)
      .single()

    if (error || !user) {
      console.log(`❌ [AuthController] User not found: ${userId}`, error?.message)
      return ResponseHandler.notFound(res, 'User not found')
    }

    // Fetch current role from database (not from token)
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role_name, is_active')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()

    let currentRole = 'employee' // Default role
    if (userRole && !roleError) {
      currentRole = userRole.role_name
      console.log(`✅ [AuthController] Current role found: ${currentRole}`)
    } else {
      console.log(`⚠️ [AuthController] No active role found, using default: ${currentRole}`)
    }

    const userData = {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      employeeId: user.employee_id,
      accountStatus: user.account_status,
      role: currentRole
    }

    console.log(`✅ [AuthController] Current user data:`, {
      email: userData.email,
      role: userData.role,
      employeeId: userData.employeeId
    })

    return ResponseHandler.success(res, 'Current user', {
      user: userData
    })
  } catch (error) {
    console.error(`❌ [AuthController] Error in me endpoint:`, error)
    next(error)
  }
}

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { error, value } = loginSchema.validate(req.body)
    if (error) {
      const errors = error.details.map(detail => detail.message)
      throw new ValidationError('Validation error', errors)
    }

    const { email, password, rememberMe } = value

    const result = await authService.loginWithEmail({ email, password, rememberMe })

    return ResponseHandler.success(res, 'Login successful', {
      user: result.user,
      tokens: result.tokens
    })
  } catch (error) {
    next(error)
  }
}

export const googleAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { error, value } = googleAuthSchema.validate(req.body)
    if (error) {
      const errors = error.details.map(detail => detail.message)
      throw new ValidationError('Validation error', errors)
    }

    const { googleToken, fullName, email } = value

    try {
      const result = await authService.registerWithEmail({
        email,
        fullName,
        password: 'google-oauth-user',
        googleId: googleToken
      })

      return ResponseHandler.created(res, 'Google registration successful', {
        user: result.user
      })
    } catch (error: any) {
      // If registration fails (user exists), try login
      if (error.statusCode === 409) {
        const loginResult = await authService.loginWithEmail({
          email,
          password: 'google-oauth-user'
        })

        return ResponseHandler.success(res, 'Google login successful', {
          user: loginResult.user,
          tokens: loginResult.tokens
        })
      }
      throw error
    }
  } catch (error) {
    next(error)
  }
}

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { error, value } = forgotPasswordSchema.validate(req.body)
    if (error) {
      const errors = error.details.map(detail => detail.message)
      throw new ValidationError('Validation error', errors)
    }

    const { email } = value
    const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] as string

    await authService.forgotPassword(email, ipAddress)

    return ResponseHandler.success(res, 'If email exists, reset link will be sent')
  } catch (error) {
    next(error)
  }
}

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { error, value } = resetPasswordSchema.validate(req.body)
    if (error) {
      const errors = error.details.map(detail => detail.message)
      throw new ValidationError('Validation error', errors)
    }

    const { token, newPassword } = value

    const passwordValidation = validatePasswordStrength(newPassword)
    if (!passwordValidation.isValid) {
      throw new ValidationError('Password does not meet requirements', passwordValidation.errors)
    }

    await authService.resetPassword(token, newPassword)

    return ResponseHandler.success(res, 'Password reset successful')
  } catch (error) {
    next(error)
  }
}

export const verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.params

    if (!token) {
      throw new ValidationError('Verification token is required')
    }

    await authService.verifyEmail(token)

    return ResponseHandler.success(res, 'Email verified successfully')
  } catch (error) {
    next(error)
  }
}

export const resendVerification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { error, value } = Joi.object({
      email: Joi.string().email().required()
    }).validate(req.body)

    if (error) {
      throw new ValidationError('Valid email is required')
    }

    const { email } = value
    await authService.resendEmailVerification(email)

    return ResponseHandler.success(res, 'Verification email sent')
  } catch (error) {
    next(error)
  }
}

export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body
    
    if (!refreshToken) {
      throw new ValidationError('Refresh token is required')
    }

    const result = await authService.refreshToken(refreshToken)
    
    return ResponseHandler.success(res, 'Token refreshed successfully', {
      accessToken: result.accessToken
    })
  } catch (error) {
    next(error)
  }
}

// Debug endpoint to check database connectivity and users
export const debugAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('🔍 [DEBUG] Checking database connectivity and users...')
    
    // Test basic database connection
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, full_name, account_status, status, created_at')
      .limit(10)
    
    if (usersError) {
      console.error('❌ [DEBUG] Users query failed:', usersError)
      return ResponseHandler.badRequest(res, `Database query failed: ${usersError.message}`)
    }
    
    console.log(`✅ [DEBUG] Found ${users?.length || 0} users in database`)
    
    // Test roles table
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id, role_name, is_active')
      .limit(10)
    
    if (rolesError) {
      console.error('⚠️ [DEBUG] Roles query failed:', rolesError)
    }
    
    console.log(`✅ [DEBUG] Found ${roles?.length || 0} user roles in database`)
    
    return ResponseHandler.success(res, 'Database debug info retrieved', {
      users: users?.map(user => ({
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        accountStatus: user.account_status,
        status: user.status,
        createdAt: user.created_at
      })) || [],
      userRoles: roles?.map(role => ({
        userId: role.user_id,
        roleName: role.role_name,
        isActive: role.is_active
      })) || [],
      connectionStatus: 'Connected'
    })
  } catch (error: any) {
    console.error('❌ [DEBUG] Database debug failed:', error)
    return ResponseHandler.internalError(res, `Debug failed: ${error.message}`)
  }
}