import { Request, Response, NextFunction } from 'express'
import { AuthService } from '../services/auth.service'
import { validatePasswordStrength } from '../utils/password'
import { ResponseHandler } from '../utils/response'
import { ValidationError, AuthenticationError, EmailVerificationError } from '../utils/errors'
import Joi from 'joi'

const authService = new AuthService()

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  fullName: Joi.string().min(2).max(100).required(),
  password: Joi.string().min(8).required()
})

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
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
      throw new ValidationError('Validation error', errors)
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

    if (!result.success) {
      throw new ValidationError(result.message || 'Registration failed')
    }

    return ResponseHandler.created(res, 'Registration successful. Please verify your email.', {
      user: result.user
    })
  } catch (error) {
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

    const { email, password } = value

    const result = await authService.loginWithEmail({ email, password })

    if (!result.success) {
      if (result.requiresEmailVerification) {
        throw new EmailVerificationError(result.message)
      }
      throw new AuthenticationError(result.message || 'Invalid credentials')
    }

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

    const result = await authService.registerWithEmail({
      email,
      fullName,
      password: 'google-oauth-user',
      googleId: googleToken
    })

    if (!result.success) {
      const loginResult = await authService.loginWithEmail({
        email,
        password: 'google-oauth-user'
      })
      
      if (!loginResult.success) {
        throw new AuthenticationError(loginResult.message || 'Google authentication failed')
      }

      return ResponseHandler.success(res, 'Google login successful', {
        user: loginResult.user,
        tokens: loginResult.tokens
      })
    }

    return ResponseHandler.created(res, 'Google registration successful', {
      user: result.user
    })
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
    const result = await authService.forgotPassword(email)

    return ResponseHandler.success(res, result.message || 'Password reset email sent')
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

    const result = await authService.resetPassword(token, newPassword)

    if (!result.success) {
      throw new ValidationError(result.message || 'Password reset failed')
    }

    return ResponseHandler.success(res, result.message || 'Password reset successful')
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

    const result = await authService.verifyEmail(token)

    if (!result.success) {
      throw new ValidationError(result.message || 'Email verification failed')
    }

    return ResponseHandler.success(res, result.message || 'Email verified successfully')
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
    const result = await authService.resendEmailVerification(email)

    return ResponseHandler.success(res, result.message || 'Verification email sent')
  } catch (error) {
    next(error)
  }
}