import { supabase } from '../config/database'

export interface AuthLogEntry {
  userId?: string
  email: string
  action: string
  status: 'success' | 'failure' | 'warning'
  details?: any
  ipAddress?: string
  userAgent?: string
  sessionId?: string
  timestamp: string
}

export interface SecurityEvent {
  userId?: string
  email?: string
  eventType: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  metadata?: any
  ipAddress?: string
  userAgent?: string
  timestamp: string
}

export class AuthLoggerService {
  /**
   * Log authentication events
   */
  async logAuthEvent(entry: Omit<AuthLogEntry, 'timestamp'>): Promise<void> {
    try {
      const logEntry: AuthLogEntry = {
        ...entry,
        timestamp: new Date().toISOString()
      }

      console.log(`🔐 [AUTH LOG] ${logEntry.action} - ${logEntry.status}:`, {
        email: logEntry.email,
        userId: logEntry.userId,
        details: logEntry.details,
        ipAddress: logEntry.ipAddress
      })

      // Store in database
      const { error } = await supabase
        .from('auth_logs')
        .insert({
          user_id: logEntry.userId,
          email: logEntry.email,
          action: logEntry.action,
          status: logEntry.status,
          details: logEntry.details ? JSON.stringify(logEntry.details) : null,
          ip_address: logEntry.ipAddress,
          user_agent: logEntry.userAgent,
          session_id: logEntry.sessionId,
          created_at: logEntry.timestamp
        })

      if (error) {
        console.error('❌ Failed to store auth log:', error.message)
        // Don't throw error to avoid breaking auth flow
      }
    } catch (error) {
      console.error('❌ Auth logging error:', error)
      // Don't throw error to avoid breaking auth flow
    }
  }

  /**
   * Log security events
   */
  async logSecurityEvent(event: Omit<SecurityEvent, 'timestamp'>): Promise<void> {
    try {
      const securityEvent: SecurityEvent = {
        ...event,
        timestamp: new Date().toISOString()
      }

      console.log(`🚨 [SECURITY] ${securityEvent.eventType} - ${securityEvent.severity}:`, {
        email: securityEvent.email,
        userId: securityEvent.userId,
        description: securityEvent.description,
        metadata: securityEvent.metadata
      })

      // Store in database
      const { error } = await supabase
        .from('security_events')
        .insert({
          user_id: securityEvent.userId,
          email: securityEvent.email,
          event_type: securityEvent.eventType,
          severity: securityEvent.severity,
          description: securityEvent.description,
          metadata: securityEvent.metadata ? JSON.stringify(securityEvent.metadata) : null,
          ip_address: securityEvent.ipAddress,
          user_agent: securityEvent.userAgent,
          created_at: securityEvent.timestamp
        })

      if (error) {
        console.error('❌ Failed to store security event:', error.message)
        // Don't throw error to avoid breaking auth flow
      }
    } catch (error) {
      console.error('❌ Security logging error:', error)
      // Don't throw error to avoid breaking auth flow
    }
  }

  /**
   * Log login attempts
   */
  async logLoginAttempt(
    email: string,
    success: boolean,
    reason?: string,
    userId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logAuthEvent({
      userId,
      email,
      action: 'login_attempt',
      status: success ? 'success' : 'failure',
      details: {
        reason,
        loginTime: new Date().toISOString()
      },
      ipAddress,
      userAgent
    })

    // Log security event for failed attempts
    if (!success) {
      await this.logSecurityEvent({
        userId,
        email,
        eventType: 'failed_login',
        severity: 'medium',
        description: `Failed login attempt: ${reason || 'Invalid credentials'}`,
        metadata: {
          reason,
          attemptTime: new Date().toISOString()
        },
        ipAddress,
        userAgent
      })
    }
  }

  /**
   * Log registration attempts
   */
  async logRegistrationAttempt(
    email: string,
    success: boolean,
    reason?: string,
    userId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logAuthEvent({
      userId,
      email,
      action: 'registration_attempt',
      status: success ? 'success' : 'failure',
      details: {
        reason,
        registrationTime: new Date().toISOString()
      },
      ipAddress,
      userAgent
    })
  }

  /**
   * Log role assignments
   */
  async logRoleAssignment(
    userId: string,
    email: string,
    roleName: string,
    assignedBy: string,
    success: boolean,
    reason?: string,
    ipAddress?: string
  ): Promise<void> {
    await this.logAuthEvent({
      userId,
      email,
      action: 'role_assignment',
      status: success ? 'success' : 'failure',
      details: {
        roleName,
        assignedBy,
        reason,
        assignmentTime: new Date().toISOString()
      },
      ipAddress
    })

    // Log security event for role changes
    await this.logSecurityEvent({
      userId,
      email,
      eventType: 'role_change',
      severity: roleName === 'super-admin' ? 'high' : 'medium',
      description: `Role ${success ? 'assigned' : 'assignment failed'}: ${roleName}`,
      metadata: {
        roleName,
        assignedBy,
        reason,
        success
      },
      ipAddress
    })
  }

  /**
   * Log token operations
   */
  async logTokenOperation(
    userId: string,
    email: string,
    operation: 'generate' | 'refresh' | 'revoke',
    success: boolean,
    tokenType: 'access' | 'refresh' | 'reset' | 'verification',
    reason?: string,
    ipAddress?: string
  ): Promise<void> {
    await this.logAuthEvent({
      userId,
      email,
      action: `token_${operation}`,
      status: success ? 'success' : 'failure',
      details: {
        tokenType,
        reason,
        operationTime: new Date().toISOString()
      },
      ipAddress
    })
  }

  /**
   * Log password operations
   */
  async logPasswordOperation(
    userId: string,
    email: string,
    operation: 'change' | 'reset' | 'forgot',
    success: boolean,
    reason?: string,
    ipAddress?: string
  ): Promise<void> {
    await this.logAuthEvent({
      userId,
      email,
      action: `password_${operation}`,
      status: success ? 'success' : 'failure',
      details: {
        reason,
        operationTime: new Date().toISOString()
      },
      ipAddress
    })

    // Log security event for password changes
    await this.logSecurityEvent({
      userId,
      email,
      eventType: 'password_change',
      severity: 'medium',
      description: `Password ${operation} ${success ? 'successful' : 'failed'}`,
      metadata: {
        operation,
        reason,
        success
      },
      ipAddress
    })
  }

  /**
   * Log session events
   */
  async logSessionEvent(
    userId: string,
    email: string,
    event: 'start' | 'end' | 'timeout' | 'concurrent',
    sessionId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logAuthEvent({
      userId,
      email,
      action: `session_${event}`,
      status: 'success',
      details: {
        sessionId,
        eventTime: new Date().toISOString()
      },
      ipAddress,
      userAgent,
      sessionId
    })
  }

  /**
   * Log suspicious activities
   */
  async logSuspiciousActivity(
    email: string,
    activityType: string,
    description: string,
    metadata?: any,
    userId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logSecurityEvent({
      userId,
      email,
      eventType: 'suspicious_activity',
      severity: 'high',
      description: `${activityType}: ${description}`,
      metadata: {
        activityType,
        ...metadata
      },
      ipAddress,
      userAgent
    })
  }

  /**
   * Get recent auth logs for a user
   */
  async getUserAuthLogs(userId: string, limit: number = 50): Promise<AuthLogEntry[]> {
    try {
      const { data, error } = await supabase
        .from('auth_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('❌ Failed to fetch auth logs:', error.message)
        return []
      }

      return data.map(log => ({
        userId: log.user_id,
        email: log.email,
        action: log.action,
        status: log.status,
        details: log.details ? JSON.parse(log.details) : null,
        ipAddress: log.ip_address,
        userAgent: log.user_agent,
        sessionId: log.session_id,
        timestamp: log.created_at
      }))
    } catch (error) {
      console.error('❌ Error fetching auth logs:', error)
      return []
    }
  }

  /**
   * Get recent security events
   */
  async getSecurityEvents(limit: number = 100): Promise<SecurityEvent[]> {
    try {
      const { data, error } = await supabase
        .from('security_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('❌ Failed to fetch security events:', error.message)
        return []
      }

      return data.map(event => ({
        userId: event.user_id,
        email: event.email,
        eventType: event.event_type,
        severity: event.severity,
        description: event.description,
        metadata: event.metadata ? JSON.parse(event.metadata) : null,
        ipAddress: event.ip_address,
        userAgent: event.user_agent,
        timestamp: event.created_at
      }))
    } catch (error) {
      console.error('❌ Error fetching security events:', error)
      return []
    }
  }
}