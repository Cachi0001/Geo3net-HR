import { supabase } from '../config/database'
import { hashPassword, comparePassword, generateTemporaryPassword, generateResetToken } from '../utils/password'
import { generateTokens, TokenPayload } from '../utils/jwt'
import { EmailService } from './email.service'
import { RoleService } from './role.service'
import { ConflictError, AuthenticationError, EmailVerificationError, ValidationError, AppError } from '../utils/errors'
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
  user: any
  tokens?: any
  verificationToken?: string
  resetToken?: string
  temporaryPassword?: string
}

export interface User {
  id: string
  email: string
  fullName: string
  employeeId: string
  accountStatus: string
  emailVerified: boolean
  role?: string
}

export class AuthService {
  private emailService: EmailService
  private roleService: RoleService

  constructor() {
    this.emailService = new EmailService()
    this.roleService = new RoleService()
  }
  async registerWithEmail(data: RegisterData): Promise<AuthResult> {
    const { email, fullName, password } = data

    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      throw new ConflictError('An account with this email already exists. Please try logging in instead.')
    }

    const { data: superAdminExists } = await supabase
      .from('users')
      .select(`
        id,
        user_roles!inner(role_name, is_active)
      `)
      .eq('user_roles.role_name', 'super-admin')
      .eq('user_roles.is_active', true)
      .single()

    if (!superAdminExists) {
      throw new ValidationError('System is not initialized. Please contact your administrator to set up the system first.')
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
        account_status: 'pending_verification',
        email_verified: false,
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      throw new AppError(`Failed to create user account: ${error.message}`)
    }

    const roleResult = await this.roleService.assignDefaultRole(newUser.id)
    if (!roleResult.success) {
      throw new AppError(`Failed to assign default role: ${roleResult.message}`)
    }

    const verificationToken = generateResetToken()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    const { error: tokenError } = await supabase
      .from('email_verification_tokens')
      .insert({
        user_id: newUser.id,
        verification_token: verificationToken,
        expires_at: expiresAt
      })

    if (tokenError) {
      throw new AppError(`Failed to create verification token: ${tokenError.message}`)
    }

    await this.emailService.sendEmailVerificationEmail(
      newUser.email,
      newUser.full_name,
      verificationToken
    )

    return {
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.full_name,
        employeeId: newUser.employee_id,
        accountStatus: newUser.account_status,
        emailVerified: false
      },
      verificationToken
    }
  }

  async loginWithEmail(data: LoginData): Promise<AuthResult> {
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
      throw new AuthenticationError('Invalid credentials')
    }

    const isValidPassword = await comparePassword(password, user.password_hash)
    if (!isValidPassword) {
      throw new AuthenticationError('Invalid credentials')
    }

    if (!user.email_verified) {
      throw new EmailVerificationError('Please verify your email before logging in')
    }

    const activeRole = user.user_roles.find((role: any) => role.is_active)
    if (!activeRole) {
      throw new AuthenticationError('No active role assigned')
    }

    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: activeRole.role_name
    }

    const tokens = generateTokens(tokenPayload)

    return {
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
  }

  async createEmployeeAccount(employeeData: any, createdBy: string): Promise<AuthResult> {
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

    if (error) {
      throw new AppError(`Failed to create employee account: ${error.message}`)
    }

    const roleResult = await this.roleService.assignRole(newUser.id, 'employee', createdBy)
    if (!roleResult.success) {
      throw new AppError(`Failed to assign employee role: ${roleResult.message}`)
    }

    return {
      user: newUser,
      temporaryPassword
    }
  }

  async forgotPassword(email: string, ipAddress?: string): Promise<void> {
    // Check rate limiting - 5 attempts per 24 hours per email
    await this.checkPasswordResetRateLimit(email, ipAddress)

    const { data: user } = await supabase
      .from('users')
      .select('id, full_name')
      .eq('email', email)
      .single()

    // Log the attempt regardless of whether user exists (security)
    await this.logPasswordResetAttempt(email, ipAddress, !!user)

    if (!user) {
      // Don't reveal if user exists or not
      return
    }

    const resetToken = generateResetToken()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    const { error } = await supabase
      .from('password_reset_tokens')
      .insert({
        user_id: user.id,
        reset_token: resetToken,
        expires_at: expiresAt,
        ip_address: ipAddress
      })

    if (error) {
      throw new AppError(`Failed to create reset token: ${error.message}`)
    }

    await this.emailService.sendPasswordResetEmail(
      email,
      user.full_name,
      resetToken
    )
  }

  private async checkPasswordResetRateLimit(email: string, ipAddress?: string): Promise<void> {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    // Check email-based rate limiting
    const { data: emailAttempts, error: emailError } = await supabase
      .from('password_reset_attempts')
      .select('id')
      .eq('email', email)
      .gte('attempted_at', twentyFourHoursAgo)

    if (emailError) {
      throw new AppError(`Failed to check rate limit: ${emailError.message}`)
    }

    if (emailAttempts && emailAttempts.length >= 5) {
      throw new ValidationError(
        'Too many password reset attempts. Please try again in 24 hours.',
        ['Rate limit exceeded for this email address']
      )
    }

    // Check IP-based rate limiting (if IP is provided)
    if (ipAddress) {
      const { data: ipAttempts, error: ipError } = await supabase
        .from('password_reset_attempts')
        .select('id')
        .eq('ip_address', ipAddress)
        .gte('attempted_at', twentyFourHoursAgo)

      if (ipError) {
        throw new AppError(`Failed to check IP rate limit: ${ipError.message}`)
      }

      if (ipAttempts && ipAttempts.length >= 10) {
        throw new ValidationError(
          'Too many password reset attempts from this location. Please try again in 24 hours.',
          ['Rate limit exceeded for this IP address']
        )
      }
    }
  }

  private async logPasswordResetAttempt(email: string, ipAddress?: string, success: boolean = false): Promise<void> {
    const { error } = await supabase
      .from('password_reset_attempts')
      .insert({
        email,
        ip_address: ipAddress,
        success,
        attempted_at: new Date().toISOString()
      })

    if (error) {
      console.error('Failed to log password reset attempt:', error)
      // Don't throw error here as it shouldn't block the main flow
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const { data: resetRecord, error } = await supabase
      .from('password_reset_tokens')
      .select('user_id, expires_at, is_used')
      .eq('reset_token', token)
      .single()

    if (error || !resetRecord || resetRecord.is_used || new Date(resetRecord.expires_at) < new Date()) {
      throw new ValidationError('Invalid or expired reset token')
    }

    const hashedPassword = await hashPassword(newPassword)

    const { error: updateError } = await supabase
      .from('users')
      .update({
        password_hash: hashedPassword,
        is_temporary_password: false,
        last_password_change: new Date().toISOString()
      })
      .eq('id', resetRecord.user_id)

    if (updateError) {
      throw new AppError(`Failed to update password: ${updateError.message}`)
    }

    const { error: tokenError } = await supabase
      .from('password_reset_tokens')
      .update({ is_used: true })
      .eq('reset_token', token)

    if (tokenError) {
      throw new AppError(`Failed to mark token as used: ${tokenError.message}`)
    }
  }

  async resendEmailVerification(email: string): Promise<void> {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, full_name, email_verified')
      .eq('email', email)
      .single()

    if (error || !user) {
      throw new ValidationError('User not found')
    }

    if (user.email_verified) {
      throw new ValidationError('Email already verified')
    }

    // Mark existing tokens as used
    await supabase
      .from('email_verification_tokens')
      .update({ is_used: true })
      .eq('user_id', user.id)
      .eq('is_used', false)

    const verificationToken = generateResetToken()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    const { error: tokenError } = await supabase
      .from('email_verification_tokens')
      .insert({
        user_id: user.id,
        verification_token: verificationToken,
        expires_at: expiresAt
      })

    if (tokenError) {
      throw new AppError(`Failed to create verification token: ${tokenError.message}`)
    }

    await this.emailService.sendEmailVerificationEmail(
      email,
      user.full_name,
      verificationToken
    )
  }

  async verifyEmail(token: string): Promise<void> {
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

    const result = await response.json() as { success: boolean; message?: string }

    if (!result.success) {
      throw new ValidationError(result.message || 'Email verification failed')
    }
  }
}