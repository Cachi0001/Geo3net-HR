import { supabase } from '../config/database'
import { hashPassword, comparePassword, generateTemporaryPassword, generateResetToken } from '../utils/password'
import { generateTokens, TokenPayload } from '../utils/jwt'
import { EmailService } from './email.service'
import { v4 as uuidv4 } from 'uuid'

export interface RegisterData {
  email: string
  fullName: string
  password: string
  googleId?: string
}

export interface LoginData {
  email: string
  password: string
}

export interface AuthResult {
  success: boolean
  user?: any
  tokens?: any
  message?: string
  verificationToken?: string
  resetToken?: string
  temporaryPassword?: string
  requiresEmailVerification?: boolean
}

export class AuthService {
  private emailService: EmailService

  constructor() {
    this.emailService = new EmailService()
  }
  async registerWithEmail(data: RegisterData): Promise<AuthResult> {
    try {
      const { email, fullName, password } = data
      
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single()

      if (existingUser) {
        return {
          success: false,
          message: 'Email already registered'
        }
      }

      const hashedPassword = await hashPassword(password)
      const employeeId = `EMP${Date.now()}`

      const { data: newUser, error } = await supabase
        .from('users')
        .insert({
          email,
          full_name: fullName,
          password_hash: hashedPassword,
          employee_id: employeeId,
          hire_date: new Date().toISOString().split('T')[0],
          account_status: 'pending_setup',
          email_verified: false
        })
        .select()
        .single()

      if (error) throw error

      await supabase
        .from('user_roles')
        .insert({
          user_id: newUser.id,
          role_name: 'employee',
          is_active: true
        })

      const verificationToken = generateResetToken()
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

      await supabase
        .from('email_verification_tokens')
        .insert({
          user_id: newUser.id,
          verification_token: verificationToken,
          expires_at: expiresAt
        })

      await this.emailService.sendEmailVerificationEmail(
        newUser.email,
        newUser.full_name,
        verificationToken
      )

      return {
        success: true,
        user: {
          id: newUser.id,
          email: newUser.email,
          fullName: newUser.full_name,
          employeeId: newUser.employee_id,
          accountStatus: newUser.account_status,
          emailVerified: false
        },
        verificationToken,
        message: 'Registration successful. Please verify your email.'
      }
    } catch (error) {
      return {
        success: false,
        message: 'Registration failed'
      }
    }
  }

  async loginWithEmail(data: LoginData): Promise<AuthResult> {
    try {
      const { email, password } = data

      const { data: user, error } = await supabase
        .from('users')
        .select(`
          id, email, full_name, password_hash, employee_id, account_status, status, email_verified,
          user_roles!inner(role_name, is_active)
        `)
        .eq('email', email)
        .eq('status', 'active')
        .single()

      if (error || !user) {
        return {
          success: false,
          message: 'Invalid credentials'
        }
      }

      const isValidPassword = await comparePassword(password, user.password_hash)
      if (!isValidPassword) {
        return {
          success: false,
          message: 'Invalid credentials'
        }
      }

      if (!user.email_verified) {
        return {
          success: false,
          message: 'Please verify your email before logging in',
          requiresEmailVerification: true
        }
      }

      const activeRole = user.user_roles.find((role: any) => role.is_active)
      if (!activeRole) {
        return {
          success: false,
          message: 'No active role assigned'
        }
      }

      const tokenPayload: TokenPayload = {
        userId: user.id,
        email: user.email,
        role: activeRole.role_name
      }

      const tokens = generateTokens(tokenPayload)

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          employeeId: user.employee_id,
          accountStatus: user.account_status,
          role: activeRole.role_name
        },
        tokens
      }
    } catch (error) {
      return {
        success: false,
        message: 'Login failed'
      }
    }
  }

  async createEmployeeAccount(employeeData: any, createdBy: string): Promise<AuthResult> {
    try {
      const temporaryPassword = generateTemporaryPassword()
      const hashedPassword = await hashPassword(temporaryPassword)
      const employeeId = `EMP${Date.now()}`

      const { data: newUser, error } = await supabase
        .from('users')
        .insert({
          ...employeeData,
          password_hash: hashedPassword,
          employee_id: employeeId,
          is_temporary_password: true,
          account_status: 'pending_setup',
          created_by: createdBy,
          invitation_sent_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      await supabase
        .from('user_roles')
        .insert({
          user_id: newUser.id,
          role_name: 'employee',
          assigned_by: createdBy,
          is_active: true
        })

      return {
        success: true,
        user: newUser,
        temporaryPassword
      }
    } catch (error) {
      return {
        success: false,
        message: 'Failed to create employee account'
      }
    }
  }

  async forgotPassword(email: string): Promise<AuthResult> {
    try {
      const { data: user } = await supabase
        .from('users')
        .select('id, full_name')
        .eq('email', email)
        .single()

      if (!user) {
        return {
          success: true,
          message: 'If email exists, reset link will be sent'
        }
      }

      const resetToken = generateResetToken()
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

      await supabase
        .from('password_reset_tokens')
        .insert({
          user_id: user.id,
          reset_token: resetToken,
          expires_at: expiresAt
        })

      await this.emailService.sendPasswordResetEmail(
        email,
        user.full_name,
        resetToken
      )

      return {
        success: true,
        message: 'Reset link sent to email',
        resetToken,
        user
      }
    } catch (error) {
      return {
        success: false,
        message: 'Failed to process password reset'
      }
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<AuthResult> {
    try {
      const { data: resetRecord } = await supabase
        .from('password_reset_tokens')
        .select('user_id, expires_at, is_used')
        .eq('reset_token', token)
        .single()

      if (!resetRecord || resetRecord.is_used || new Date(resetRecord.expires_at) < new Date()) {
        return {
          success: false,
          message: 'Invalid or expired reset token'
        }
      }

      const hashedPassword = await hashPassword(newPassword)

      await supabase
        .from('users')
        .update({
          password_hash: hashedPassword,
          is_temporary_password: false,
          last_password_change: new Date().toISOString()
        })
        .eq('id', resetRecord.user_id)

      await supabase
        .from('password_reset_tokens')
        .update({ is_used: true })
        .eq('reset_token', token)

      return {
        success: true,
        message: 'Password reset successfully'
      }
    } catch (error) {
      return {
        success: false,
        message: 'Failed to reset password'
      }
    }
  }

  async resendEmailVerification(email: string): Promise<AuthResult> {
    try {
      const { data: user } = await supabase
        .from('users')
        .select('id, full_name, email_verified')
        .eq('email', email)
        .single()

      if (!user) {
        return {
          success: false,
          message: 'User not found'
        }
      }

      if (user.email_verified) {
        return {
          success: false,
          message: 'Email already verified'
        }
      }

      await supabase
        .from('email_verification_tokens')
        .update({ is_used: true })
        .eq('user_id', user.id)
        .eq('is_used', false)

      const verificationToken = generateResetToken()
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

      await supabase
        .from('email_verification_tokens')
        .insert({
          user_id: user.id,
          verification_token: verificationToken,
          expires_at: expiresAt
        })

      await this.emailService.sendEmailVerificationEmail(
        email,
        user.full_name,
        verificationToken
      )

      return {
        success: true,
        message: 'Verification email sent',
        verificationToken,
        user
      }
    } catch (error) {
      return {
        success: false,
        message: 'Failed to send verification email'
      }
    }
  }

  async verifyEmail(token: string): Promise<AuthResult> {
    try {
      const response = await fetch('https://cwxlqpjslegqisijixwu.supabase.co/functions/v1/email-service', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({
          action: 'verify_email',
          token
        })
      })

      const result = await response.json()
      return result as AuthResult
    } catch (error) {
      return {
        success: false,
        message: 'Email verification failed'
      }
    }
  }
}