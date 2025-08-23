import { supabase } from '../config/database'
import { hashPassword, comparePassword, generateTemporaryPassword, generateResetToken } from '../utils/password'
import { generateTokens, generateAccessToken, verifyToken, decodeToken, TokenPayload } from '../utils/jwt'
import { EmailService } from './email.service'
import { RoleService } from './role.service'
import { AuthLoggerService } from './authLogger.service'
import { ConflictError, AuthenticationError, ValidationError, AppError } from '../utils/errors'

export interface RegisterData {
  email: string
  fullName: string
  password: string
  googleId?: string
}

export interface LoginData {
  email: string
  password: string
  rememberMe?: boolean
}

export interface AuthResult {
  user: any
  tokens?: any
  message?: string
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
  private authLogger: AuthLoggerService

  constructor() {
    this.emailService = new EmailService()
    this.roleService = new RoleService()
    this.authLogger = new AuthLoggerService()
  }

  private async debugDatabaseConstraints() {
    try {
      console.log('🔍 Checking database constraints...')

      // Check users table constraints
      const { data: constraints, error } = await supabase
        .rpc('get_table_constraints', { table_name: 'users' })
        .select()

      if (error) {
        console.log('⚠️ Could not fetch constraints via RPC, trying direct query...')

        // Alternative method to check constraints
        const { data: constraintData, error: constraintError } = await supabase
          .from('information_schema.check_constraints')
          .select('constraint_name, check_clause')
          .like('constraint_name', '%users%')

        if (constraintError) {
          console.log('⚠️ Could not fetch constraint info:', constraintError.message)
        } else {
          console.log('📋 Found constraints:', constraintData)
        }
      } else {
        console.log('📋 Table constraints:', constraints)
      }
    } catch (error) {
      console.log('⚠️ Error checking constraints:', error)
    }
  }


  async registerWithEmail(data: RegisterData, ipAddress?: string, userAgent?: string): Promise<AuthResult> {
    const { email, fullName, password } = data

    console.log('🔍 [AuthService] Registration attempt started for:', email)

    try {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single()

      if (existingUser) {
        await this.authLogger.logRegistrationAttempt(
          email,
          false,
          'Email already exists',
          undefined,
          ipAddress,
          userAgent
        )
        throw new ConflictError('An account with this email already exists. Please try logging in instead.')
      }

      const CEO_EMAIL = process.env.CEO_EMAIL
      if (!CEO_EMAIL) {
        await this.authLogger.logRegistrationAttempt(
          email,
          false,
          'CEO_EMAIL not configured',
          undefined,
          ipAddress,
          userAgent
        )
        throw new AppError('CEO_EMAIL environment variable is not configured')
      }

      const isCEO = email.toLowerCase() === CEO_EMAIL.toLowerCase()

      console.log('🔍 [AuthService] Registration details:', {
        email,
        isCEO,
        ceoEmail: CEO_EMAIL
      })

      const hashedPassword = await hashPassword(password)
      const employeeId = isCEO ? 'CEO001' : `EMP${Date.now()}`

      const userData = {
        email,
        full_name: fullName,
        password_hash: hashedPassword,
        employee_id: employeeId,
        hire_date: new Date().toISOString().split('T')[0],
        account_status: isCEO ? 'active' : 'pending_setup',
        status: isCEO ? 'active' : 'inactive'
      }

      console.log('🔍 [AuthService] User data for insertion:', {
        ...userData,
        password_hash: '[REDACTED]'
      })

      const { data: newUser, error } = await supabase
        .from('users')
        .insert(userData)
        .select()
        .single()

      if (error) {
        console.error('❌ [AuthService] Database insertion error:', error)

        await this.authLogger.logRegistrationAttempt(
          email,
          false,
          `Database error: ${error.message}`,
          undefined,
          ipAddress,
          userAgent
        )

        // Check if it's a constraint violation
        if (error.code === '23514') {
          console.error('🚨 [AuthService] CHECK CONSTRAINT VIOLATION DETECTED!')
          await this.authLogger.logSecurityEvent({
            email,
            eventType: 'constraint_violation',
            severity: 'high',
            description: 'Database constraint violation during registration',
            metadata: {
              errorCode: error.code,
              errorMessage: error.message,
              userData: { ...userData, password_hash: '[REDACTED]' }
            },
            ipAddress,
            userAgent
          })
        }

        throw new AppError(`Failed to create user account: ${error.message}`)
      }

      console.log('✅ [AuthService] User created successfully:', {
        id: newUser.id,
        email: newUser.email,
        account_status: newUser.account_status,
        status: newUser.status,
        isCEO
      })

      // Assign role based on whether this is the CEO or not
      const roleToAssign = isCEO ? 'super-admin' : 'employee'
      const roleResult = await this.roleService.assignRole(newUser.id, roleToAssign, newUser.id)

      if (!roleResult.success) {
        await this.authLogger.logRoleAssignment(
          newUser.id,
          newUser.email,
          roleToAssign,
          newUser.id,
          false,
          roleResult.message,
          ipAddress
        )
        throw new AppError(`Failed to assign ${roleToAssign} role: ${roleResult.message}`)
      }

      // Log successful role assignment
      await this.authLogger.logRoleAssignment(
        newUser.id,
        newUser.email,
        roleToAssign,
        newUser.id,
        true,
        'Role assigned during registration',
        ipAddress
      )

      // Only send verification email for non-CEO users
      let verificationToken: string | undefined = undefined
      if (!isCEO) {
        verificationToken = generateResetToken()
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

        const { error: tokenError } = await supabase
          .from('email_verification_tokens')
          .insert({
            user_id: newUser.id,
            verification_token: verificationToken,
            expires_at: expiresAt
          })

        if (tokenError) {
          await this.authLogger.logTokenOperation(
            newUser.id,
            newUser.email,
            'generate',
            false,
            'verification',
            tokenError.message,
            ipAddress
          )
          throw new AppError(`Failed to create verification token: ${tokenError.message}`)
        }

        await this.authLogger.logTokenOperation(
          newUser.id,
          newUser.email,
          'generate',
          true,
          'verification',
          'Email verification token created',
          ipAddress
        )

        await this.emailService.sendEmailVerificationEmail(
          newUser.email,
          newUser.full_name,
          verificationToken
        )
      }

      // Log successful registration
      await this.authLogger.logRegistrationAttempt(
        email,
        true,
        `${isCEO ? 'Super-admin' : 'Employee'} account created successfully`,
        newUser.id,
        ipAddress,
        userAgent
      )

      const message = isCEO
        ? 'Super-admin account created successfully! You can now log in immediately.'
        : 'Account created successfully! Please check your email and click the verification link to activate your account.'

      return {
        user: {
          id: newUser.id,
          email: newUser.email,
          fullName: newUser.full_name,
          employeeId: newUser.employee_id,
          accountStatus: newUser.account_status,
          role: roleToAssign
        },
        message,
        verificationToken
      }
    } catch (error: any) {
      console.error('❌ [AuthService] Registration failed:', error.message)

      // Log the error if not already logged
      if (!(error instanceof ConflictError) && !(error instanceof AppError)) {
        await this.authLogger.logRegistrationAttempt(
          email,
          false,
          `Unexpected error: ${error.message}`,
          undefined,
          ipAddress,
          userAgent
        )
      }

      throw error
    }
  }

  async loginWithEmail(data: LoginData, ipAddress?: string, userAgent?: string): Promise<AuthResult> {
    const { email, password, rememberMe } = data

    console.log(`🔍 [AuthService] Login attempt for email: ${email}`)

    try {
      // First get the user
      const { data: user, error } = await supabase
        .from('users')
        .select(`
          id, email, full_name, password_hash, employee_id, account_status, status
        `)
        .eq('email', email)
        .single()

      console.log(`🔍 [AuthService] Database query result:`, {
        userFound: !!user,
        error: error?.message,
        userStatus: user?.status,
        accountStatus: user?.account_status
      })

      if (error || !user) {
        console.log(`❌ [AuthService] User not found for email: ${email}`, error?.message)
        await this.authLogger.logLoginAttempt(
          email,
          false,
          'User not found',
          undefined,
          ipAddress,
          userAgent
        )
        throw new AuthenticationError('Invalid email or password')
      }

      const isValidPassword = await comparePassword(password, user.password_hash)
      console.log(`🔍 [AuthService] Password validation result: ${isValidPassword}`)

      if (!isValidPassword) {
        console.log(`❌ [AuthService] Invalid password for email: ${email}`)
        await this.authLogger.logLoginAttempt(
          email,
          false,
          'Invalid password',
          user.id,
          ipAddress,
          userAgent
        )
        throw new AuthenticationError('Invalid email or password')
      }

      // Check if account is suspended
      if (user.account_status === 'suspended') {
        console.log(`❌ [AuthService] Account suspended for email: ${email}`)
        await this.authLogger.logLoginAttempt(
          email,
          false,
          'Account suspended',
          user.id,
          ipAddress,
          userAgent
        )
        await this.authLogger.logSecurityEvent({
          userId: user.id,
          email: user.email,
          eventType: 'suspended_account_access',
          severity: 'high',
          description: 'Attempted login to suspended account',
          ipAddress,
          userAgent
        })
        throw new AuthenticationError('Account has been suspended. Please contact support.')
      }

      // Check if user is terminated
      if (user.status === 'terminated') {
        console.log(`❌ [AuthService] Account terminated for email: ${email}`)
        await this.authLogger.logLoginAttempt(
          email,
          false,
          'Account terminated',
          user.id,
          ipAddress,
          userAgent
        )
        await this.authLogger.logSecurityEvent({
          userId: user.id,
          email: user.email,
          eventType: 'terminated_account_access',
          severity: 'high',
          description: 'Attempted login to terminated account',
          ipAddress,
          userAgent
        })
        throw new AuthenticationError('Account has been terminated. Please contact support.')
      }

      // Get user roles separately
      const { data: userRoles, error: roleError } = await supabase
        .from('user_roles')
        .select('role_name, is_active')
        .eq('user_id', user.id)
        .eq('is_active', true)

      console.log(`🔍 [AuthService] User roles query:`, {
        rolesFound: userRoles?.length || 0,
        roleError: roleError?.message,
        roles: userRoles
      })

      let activeRole = null
      if (userRoles && userRoles.length > 0) {
        activeRole = userRoles[0] // Take the first active role
      }

      if (!activeRole) {
        console.log(`⚠️ [AuthService] No active role found, assigning default employee role for: ${email}`)
        // Assign default employee role if none exists
        const roleResult = await this.roleService.assignRole(user.id, 'employee', user.id)
        if (roleResult.success) {
          activeRole = { role_name: 'employee', is_active: true }
          console.log(`✅ [AuthService] Assigned employee role to: ${email}`)
          await this.authLogger.logRoleAssignment(
            user.id,
            user.email,
            'employee',
            user.id,
            true,
            'Auto-assigned during login',
            ipAddress
          )
        } else {
          console.log(`❌ [AuthService] Failed to assign employee role to: ${email}`, roleResult.message)
          await this.authLogger.logLoginAttempt(
            email,
            false,
            'Failed to assign role',
            user.id,
            ipAddress,
            userAgent
          )
          throw new AuthenticationError('Unable to assign user role. Please contact support.')
        }
      }

      const tokenPayload: TokenPayload = {
        userId: user.id,
        email: user.email,
        role: activeRole.role_name
      }

      const tokens = generateTokens(tokenPayload)

      // Log successful token generation
      await this.authLogger.logTokenOperation(
        user.id,
        user.email,
        'generate',
        true,
        'access',
        'Login tokens generated',
        ipAddress
      )

      // Log session start
      await this.authLogger.logSessionEvent(
        user.id,
        user.email,
        'start',
        undefined, // sessionId can be added later if needed
        ipAddress,
        userAgent
      )

      const userPayload = {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        employeeId: user.employee_id,
        accountStatus: user.account_status,
        role: activeRole.role_name
      }

      console.log(`✅ [AuthService] Login successful for:`, {
        email: userPayload.email,
        role: userPayload.role,
        employeeId: userPayload.employeeId
      })

      // Log successful login
      await this.authLogger.logLoginAttempt(
        email,
        true,
        `Successful login as ${activeRole.role_name}`,
        user.id,
        ipAddress,
        userAgent
      )

      // Log security event for super-admin logins
      if (activeRole.role_name === 'super-admin') {
        await this.authLogger.logSecurityEvent({
          userId: user.id,
          email: user.email,
          eventType: 'super_admin_login',
          severity: 'medium',
          description: 'Super-admin user logged in',
          metadata: {
            employeeId: user.employee_id,
            rememberMe
          },
          ipAddress,
          userAgent
        })
      }

      return {
        user: userPayload,
        tokens
      }
    } catch (error: any) {
      // Handle database connectivity issues
      if (error.message?.includes('fetch failed') || error.message?.includes('Failed to fetch')) {
        console.error(`❌ [AuthService] Database connectivity issue during login for ${email}:`, error.message)
        await this.authLogger.logLoginAttempt(
          email,
          false,
          'Database connectivity issue',
          undefined,
          ipAddress,
          userAgent
        )
        throw new AuthenticationError('Service temporarily unavailable. Please try again in a few moments.')
      }

      // Re-throw authentication errors as-is (already logged above)
      if (error instanceof AuthenticationError) {
        throw error
      }

      // Handle other unexpected errors
      console.error(`❌ [AuthService] Unexpected error during login for ${email}:`, error)
      await this.authLogger.logLoginAttempt(
        email,
        false,
        `Unexpected error: ${error.message}`,
        undefined,
        ipAddress,
        userAgent
      )
      throw new AuthenticationError('Login failed. Please try again.')
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
    try {
      console.log(`🔍 [AuthService] Password reset request for: ${email}`)

      // Check rate limiting - 5 attempts per 24 hours per email
      await this.checkPasswordResetRateLimit(email, ipAddress)

      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, full_name, account_status, status')
        .eq('email', email)
        .single()

      // Log the attempt regardless of whether user exists (security)
      await this.logPasswordResetAttempt(email, ipAddress, !!user)

      if (userError || !user) {
        console.log(`🔍 [AuthService] User not found for password reset: ${email}`)
        await this.authLogger.logSecurityEvent({
          email,
          eventType: 'password_reset_unknown_email',
          severity: 'low',
          description: 'Password reset attempted for unknown email',
          ipAddress
        })
        // Don't reveal if user exists or not
        return
      }

      // Check if account is active
      if (user.account_status === 'suspended' || user.status === 'terminated') {
        console.log(`🔍 [AuthService] Password reset attempted for inactive account: ${email}`)
        await this.authLogger.logSecurityEvent({
          userId: user.id,
          email,
          eventType: 'password_reset_inactive_account',
          severity: 'medium',
          description: `Password reset attempted for ${user.account_status} account`,
          ipAddress
        })
        // Don't reveal account status
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
        console.error(`❌ [AuthService] Failed to create reset token for ${email}:`, error)
        await this.authLogger.logPasswordOperation(
          user.id,
          email,
          'forgot',
          false,
          `Database error: ${error.message}`,
          ipAddress
        )
        throw new AppError(`Failed to create reset token: ${error.message}`)
      }

      // Log successful token creation
      await this.authLogger.logPasswordOperation(
        user.id,
        email,
        'forgot',
        true,
        'Password reset token created',
        ipAddress
      )

      try {
        await this.emailService.sendPasswordResetEmail(
          email,
          user.full_name,
          resetToken
        )
        console.log(`✅ [AuthService] Password reset email sent to: ${email}`)
      } catch (emailError: any) {
        console.error(`❌ [AuthService] Failed to send password reset email to ${email}:`, emailError)
        await this.authLogger.logPasswordOperation(
          user.id,
          email,
          'forgot',
          false,
          `Email sending failed: ${emailError.message}`,
          ipAddress
        )
        // Don't throw error here as token was created successfully
        // The user might still be able to use the token if they have it
      }
    } catch (error: any) {
      console.error(`❌ [AuthService] Password reset failed for ${email}:`, error)

      // Log the error if not already logged
      if (!(error instanceof ValidationError) && !(error instanceof AppError)) {
        await this.authLogger.logPasswordOperation(
          'unknown',
          email,
          'forgot',
          false,
          `Unexpected error: ${error.message}`,
          ipAddress
        )
      }

      throw error
    }
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

  async resetPassword(token: string, newPassword: string, ipAddress?: string): Promise<void> {
    try {
      console.log(`🔍 [AuthService] Password reset attempt with token`)

      const { data: resetRecord, error } = await supabase
        .from('password_reset_tokens')
        .select('user_id, expires_at, is_used')
        .eq('reset_token', token)
        .single()

      if (error || !resetRecord) {
        console.log(`❌ [AuthService] Invalid reset token provided`)
        await this.authLogger.logSecurityEvent({
          eventType: 'invalid_reset_token',
          severity: 'medium',
          description: 'Invalid password reset token used',
          ipAddress
        })
        throw new ValidationError('Invalid or expired reset token')
      }

      if (resetRecord.is_used) {
        console.log(`❌ [AuthService] Reset token already used`)
        await this.authLogger.logSecurityEvent({
          userId: resetRecord.user_id,
          eventType: 'reused_reset_token',
          severity: 'high',
          description: 'Attempt to reuse password reset token',
          ipAddress
        })
        throw new ValidationError('Invalid or expired reset token')
      }

      if (new Date(resetRecord.expires_at) < new Date()) {
        console.log(`❌ [AuthService] Reset token expired`)
        await this.authLogger.logSecurityEvent({
          userId: resetRecord.user_id,
          eventType: 'expired_reset_token',
          severity: 'low',
          description: 'Expired password reset token used',
          ipAddress
        })
        throw new ValidationError('Invalid or expired reset token')
      }

      // Get user details for logging
      const { data: user } = await supabase
        .from('users')
        .select('email, account_status, status')
        .eq('id', resetRecord.user_id)
        .single()

      if (!user) {
        console.log(`❌ [AuthService] User not found for reset token`)
        throw new ValidationError('Invalid reset token')
      }

      // Check if account is still active
      if (user.account_status === 'suspended' || user.status === 'terminated') {
        console.log(`❌ [AuthService] Password reset attempted for inactive account: ${user.email}`)
        await this.authLogger.logSecurityEvent({
          userId: resetRecord.user_id,
          email: user.email,
          eventType: 'password_reset_inactive_account',
          severity: 'high',
          description: `Password reset attempted for ${user.account_status} account`,
          ipAddress
        })
        throw new ValidationError('Account is not active')
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
        console.error(`❌ [AuthService] Failed to update password for user ${user.email}:`, updateError)
        await this.authLogger.logPasswordOperation(
          resetRecord.user_id,
          user.email,
          'reset',
          false,
          `Database error: ${updateError.message}`,
          ipAddress
        )
        throw new AppError(`Failed to update password: ${updateError.message}`)
      }

      const { error: tokenError } = await supabase
        .from('password_reset_tokens')
        .update({ is_used: true })
        .eq('reset_token', token)

      if (tokenError) {
        console.error(`❌ [AuthService] Failed to mark token as used:`, tokenError)
        // Don't throw error here as password was already updated
        // Just log the issue
        await this.authLogger.logPasswordOperation(
          resetRecord.user_id,
          user.email,
          'reset',
          false,
          `Token cleanup failed: ${tokenError.message}`,
          ipAddress
        )
      }

      // Log successful password reset
      await this.authLogger.logPasswordOperation(
        resetRecord.user_id,
        user.email,
        'reset',
        true,
        'Password reset successful',
        ipAddress
      )

      console.log(`✅ [AuthService] Password reset successful for: ${user.email}`)
    } catch (error: any) {
      console.error(`❌ [AuthService] Password reset failed:`, error)

      // Log the error if not already logged
      if (!(error instanceof ValidationError) && !(error instanceof AppError)) {
        await this.authLogger.logPasswordOperation(
          'unknown',
          'unknown',
          'reset',
          false,
          `Unexpected error: ${error.message}`,
          ipAddress
        )
      }

      throw error
    }
  }

  async resendEmailVerification(email: string): Promise<void> {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, full_name')
      .eq('email', email)
      .single()

    if (error || !user) {
      throw new ValidationError('User not found')
    }

    // Skip email verification check for now
    // if (user.email_verified) {
    //   throw new ValidationError('Email already verified')
    // }

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

  /**
   * Validates if a token is expired
   */
  private isTokenExpired(token: string): boolean {
    try {
      const decoded = decodeToken(token)
      if (!decoded || !decoded.exp) {
        return true
      }

      const currentTime = Math.floor(Date.now() / 1000)
      const bufferTime = 60 // 1 minute buffer

      return decoded.exp < (currentTime + bufferTime)
    } catch (error) {
      console.warn('⚠️ [AuthService] Could not parse token for expiration check:', error)
      return true
    }
  }

  /**
   * Validates token format and basic structure
   */
  private validateTokenFormat(token: string): boolean {
    if (!token || typeof token !== 'string') {
      return false
    }

    const parts = token.split('.')
    if (parts.length !== 3) {
      return false
    }

    try {
      // Try to decode the payload
      JSON.parse(atob(parts[1]))
      return true
    } catch (error) {
      return false
    }
  }

  async refreshToken(refreshToken: string, ipAddress?: string): Promise<{ accessToken: string }> {
    try {
      console.log(`🔍 [AuthService] Token refresh attempt`)

      // Enhanced token validation with expiration check
      let decoded: TokenPayload
      try {
        decoded = verifyToken(refreshToken) as TokenPayload
      } catch (tokenError: any) {
        console.log(`❌ [AuthService] Invalid refresh token format:`, tokenError.message)
        await this.authLogger.logTokenOperation(
          'unknown',
          'unknown',
          'refresh',
          false,
          'refresh',
          `Invalid token format: ${tokenError.message}`,
          ipAddress
        )
        throw new AuthenticationError('Invalid refresh token format')
      }

      // Verify user still exists and is active
      const { data: user, error } = await supabase
        .from('users')
        .select('id, email, account_status, status')
        .eq('id', decoded.userId)
        .single()

      if (error || !user) {
        console.log(`❌ [AuthService] User not found during token refresh: ${decoded.userId}`)
        await this.authLogger.logTokenOperation(
          decoded.userId,
          decoded.email,
          'refresh',
          false,
          'refresh',
          'User not found',
          ipAddress
        )
        throw new AuthenticationError('User not found')
      }

      if (user.account_status === 'suspended' || user.status === 'terminated') {
        console.log(`❌ [AuthService] Token refresh attempted for inactive account: ${user.email}`)
        await this.authLogger.logTokenOperation(
          user.id,
          user.email,
          'refresh',
          false,
          'refresh',
          `Account ${user.account_status}`,
          ipAddress
        )
        await this.authLogger.logSecurityEvent({
          userId: user.id,
          email: user.email,
          eventType: 'token_refresh_inactive_account',
          severity: 'medium',
          description: `Token refresh attempted for ${user.account_status} account`,
          ipAddress
        })
        throw new AuthenticationError('Account is inactive')
      }

      // Get current role
      const { data: userRoles, error: roleError } = await supabase
        .from('user_roles')
        .select('role_name')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single()

      if (roleError) {
        console.log(`⚠️ [AuthService] Role query failed during token refresh for ${user.email}:`, roleError)
      }

      const role = userRoles?.role_name || 'employee'

      // Generate new access token
      const newTokenPayload: TokenPayload = {
        userId: user.id,
        email: user.email,
        role: role
      }

      const accessToken = generateAccessToken(newTokenPayload)

      // Log successful token refresh
      await this.authLogger.logTokenOperation(
        user.id,
        user.email,
        'refresh',
        true,
        'access',
        'Token refreshed successfully',
        ipAddress
      )

      console.log(`✅ [AuthService] Token refresh successful for: ${user.email}`)

      return { accessToken }
    } catch (error: any) {
      console.error(`❌ [AuthService] Token refresh failed:`, error)

      // Log the error if not already logged
      if (!(error instanceof AuthenticationError)) {
        await this.authLogger.logTokenOperation(
          'unknown',
          'unknown',
          'refresh',
          false,
          'refresh',
          `Unexpected error: ${error.message}`,
          ipAddress
        )
      }

      throw new AuthenticationError('Invalid refresh token')
    }
  }
}