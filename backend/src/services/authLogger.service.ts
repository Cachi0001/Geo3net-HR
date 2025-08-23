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
  private static instance: AuthLoggerService
  private logBuffer: AuthLogEntry[] = []
  private securityBuffer: SecurityEvent[] = []
  private readonly BUFFER_SIZE = 100
  private readonly FLUSH_INTERVAL = 5000 // 5 seconds

  constructor() {
    // Start periodic buffer flush
    this.startPeriodicFlush()
  }

  /**
   * Get singleton instance
   */
  static getInstance(): AuthLoggerService {
    if (!AuthLoggerService.instance) {
      AuthLoggerService.instance = new AuthLoggerService()
    }
    return AuthLoggerService.instance
  }

  /**
   * Start periodic buffer flush to database
   */
  private startPeriodicFlush(): void {
    setInterval(() => {
      this.flushBuffers()
    }, this.FLUSH_INTERVAL)
  }

  /**
   * Flush buffered logs to database
   */
  private async flushBuffers(): Promise<void> {
    if (this.logBuffer.length > 0) {
      const logsToFlush = [...this.logBuffer]
      this.logBuffer = []
      await this.batchInsertAuthLogs(logsToFlush)
    }

    if (this.securityBuffer.length > 0) {
      const eventsToFlush = [...this.securityBuffer]
      this.securityBuffer = []
      await this.batchInsertSecurityEvents(eventsToFlush)
    }
  }

  /**
   * Batch insert auth logs
   */
  private async batchInsertAuthLogs(logs: AuthLogEntry[]): Promise<void> {
    try {
      const { error } = await supabase
        .from('auth_logs')
        .insert(logs.map(log => ({
          user_id: log.userId,
          email: log.email,
          action: log.action,
          status: log.status,
          details: log.details ? JSON.stringify(log.details) : null,
          ip_address: log.ipAddress,
          user_agent: log.userAgent,
          session_id: log.sessionId,
          created_at: log.timestamp
        })))

      if (error) {
        console.error('❌ Failed to batch insert auth logs:', error.message)
      } else {
        console.log(`✅ Flushed ${logs.length} auth logs to database`)
      }
    } catch (error) {
      console.error('❌ Batch auth log insert error:', error)
    }
  }

  /**
   * Batch insert security events
   */
  private async batchInsertSecurityEvents(events: SecurityEvent[]): Promise<void> {
    try {
      const { error } = await supabase
        .from('security_events')
        .insert(events.map(event => ({
          user_id: event.userId,
          email: event.email,
          event_type: event.eventType,
          severity: event.severity,
          description: event.description,
          metadata: event.metadata ? JSON.stringify(event.metadata) : null,
          ip_address: event.ipAddress,
          user_agent: event.userAgent,
          created_at: event.timestamp
        })))

      if (error) {
        console.error('❌ Failed to batch insert security events:', error.message)
      } else {
        console.log(`✅ Flushed ${events.length} security events to database`)
      }
    } catch (error) {
      console.error('❌ Batch security event insert error:', error)
    }
  }

  /**
   * Log authentication events with enhanced debugging
   */
  async logAuthEvent(entry: Omit<AuthLogEntry, 'timestamp'>): Promise<void> {
    try {
      const logEntry: AuthLogEntry = {
        ...entry,
        timestamp: new Date().toISOString()
      }

      // Enhanced console logging with more context
      const logLevel = logEntry.status === 'failure' ? '❌' : logEntry.status === 'warning' ? '⚠️' : '✅'
      console.log(`🔐 [AUTH LOG] ${logLevel} ${logEntry.action.toUpperCase()} - ${logEntry.status.toUpperCase()}:`, {
        email: logEntry.email,
        userId: logEntry.userId,
        details: logEntry.details,
        ipAddress: logEntry.ipAddress,
        userAgent: logEntry.userAgent ? logEntry.userAgent.substring(0, 100) + '...' : undefined,
        timestamp: logEntry.timestamp
      })

      // Add to buffer for batch processing
      this.logBuffer.push(logEntry)

      // Flush immediately if buffer is full or if it's a critical event
      if (this.logBuffer.length >= this.BUFFER_SIZE || logEntry.status === 'failure') {
        await this.flushBuffers()
      }

      // Also log to file in production for debugging
      if (process.env.NODE_ENV === 'production') {
        this.logToFile('auth', logEntry)
      }
    } catch (error) {
      console.error('❌ Auth logging error:', error)
      // Don't throw error to avoid breaking auth flow
    }
  }

  /**
   * Log security events with enhanced monitoring
   */
  async logSecurityEvent(event: Omit<SecurityEvent, 'timestamp'>): Promise<void> {
    try {
      const securityEvent: SecurityEvent = {
        ...event,
        timestamp: new Date().toISOString()
      }

      // Enhanced console logging with severity-based icons
      const severityIcon = {
        low: '🟢',
        medium: '🟡', 
        high: '🟠',
        critical: '🔴'
      }[securityEvent.severity] || '⚪'

      console.log(`🚨 [SECURITY] ${severityIcon} ${securityEvent.eventType.toUpperCase()} - ${securityEvent.severity.toUpperCase()}:`, {
        email: securityEvent.email,
        userId: securityEvent.userId,
        description: securityEvent.description,
        metadata: securityEvent.metadata,
        ipAddress: securityEvent.ipAddress,
        userAgent: securityEvent.userAgent ? securityEvent.userAgent.substring(0, 100) + '...' : undefined,
        timestamp: securityEvent.timestamp
      })

      // Add to buffer for batch processing
      this.securityBuffer.push(securityEvent)

      // Flush immediately for high/critical severity events
      if (securityEvent.severity === 'high' || securityEvent.severity === 'critical') {
        await this.flushBuffers()
        
        // Send immediate alerts for critical events
        if (securityEvent.severity === 'critical') {
          await this.sendSecurityAlert(securityEvent)
        }
      }

      // Also log to file in production
      if (process.env.NODE_ENV === 'production') {
        this.logToFile('security', securityEvent)
      }
    } catch (error) {
      console.error('❌ Security logging error:', error)
      // Don't throw error to avoid breaking auth flow
    }
  }

  /**
   * Log login attempts with enhanced details
   */
  async logLoginAttempt(
    email: string,
    success: boolean,
    reason?: string,
    userId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    const loginTime = new Date().toISOString()
    
    // Parse user agent for better logging
    const userAgentInfo = this.parseUserAgent(userAgent)
    
    await this.logAuthEvent({
      userId,
      email,
      action: 'login_attempt',
      status: success ? 'success' : 'failure',
      details: {
        reason,
        loginTime,
        userAgentInfo,
        geolocation: await this.getGeolocation(ipAddress),
        sessionInfo: {
          timestamp: loginTime,
          success
        }
      },
      ipAddress,
      userAgent
    })

    // Enhanced security event logging for failed attempts
    if (!success) {
      // Check for suspicious patterns
      const recentFailures = await this.getRecentFailedAttempts(email, ipAddress)
      const isSuspicious = recentFailures >= 3

      await this.logSecurityEvent({
        userId,
        email,
        eventType: 'failed_login',
        severity: isSuspicious ? 'high' : 'medium',
        description: `Failed login attempt: ${reason || 'Invalid credentials'}${isSuspicious ? ' (Multiple recent failures detected)' : ''}`,
        metadata: {
          reason,
          attemptTime: loginTime,
          recentFailures,
          isSuspicious,
          userAgentInfo,
          geolocation: await this.getGeolocation(ipAddress)
        },
        ipAddress,
        userAgent
      })

      // Log brute force attempts
      if (recentFailures >= 5) {
        await this.logSecurityEvent({
          userId,
          email,
          eventType: 'brute_force_attempt',
          severity: 'critical',
          description: `Potential brute force attack detected: ${recentFailures} failed attempts`,
          metadata: {
            failureCount: recentFailures,
            timeWindow: '15 minutes',
            userAgentInfo
          },
          ipAddress,
          userAgent
        })
      }
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

  /**
   * Log to file for production debugging
   */
  private logToFile(type: 'auth' | 'security', data: any): void {
    try {
      const fs = require('fs')
      const path = require('path')
      
      const logDir = path.join(process.cwd(), 'logs')
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true })
      }

      const logFile = path.join(logDir, `${type}-${new Date().toISOString().split('T')[0]}.log`)
      const logLine = `${new Date().toISOString()} - ${JSON.stringify(data)}\n`
      
      fs.appendFileSync(logFile, logLine)
    } catch (error) {
      console.error('❌ File logging error:', error)
    }
  }

  /**
   * Send security alerts for critical events
   */
  private async sendSecurityAlert(event: SecurityEvent): Promise<void> {
    try {
      console.log(`🚨 CRITICAL SECURITY ALERT: ${event.eventType}`)
      
      // In a real implementation, you would send emails, Slack notifications, etc.
      // For now, we'll just log it prominently
      console.error(`
      ╔════════════════════════════════════════════════════════════════╗
      ║                        SECURITY ALERT                          ║
      ║                                                                ║
      ║ Event: ${event.eventType.padEnd(50)} ║
      ║ Severity: ${event.severity.toUpperCase().padEnd(47)} ║
      ║ User: ${(event.email || 'Unknown').padEnd(51)} ║
      ║ IP: ${(event.ipAddress || 'Unknown').padEnd(53)} ║
      ║ Time: ${event.timestamp.padEnd(50)} ║
      ║ Description: ${event.description.substring(0, 44).padEnd(44)} ║
      ╚════════════════════════════════════════════════════════════════╝
      `)
      
      // TODO: Implement actual alerting mechanism (email, Slack, etc.)
    } catch (error) {
      console.error('❌ Security alert error:', error)
    }
  }

  /**
   * Get authentication statistics
   */
  async getAuthStats(timeframe: 'hour' | 'day' | 'week' | 'month' = 'day'): Promise<{
    totalAttempts: number
    successfulLogins: number
    failedLogins: number
    registrations: number
    passwordResets: number
    securityEvents: number
    topFailureReasons: Array<{ reason: string; count: number }>
  }> {
    try {
      const timeMap = {
        hour: '1 hour',
        day: '1 day',
        week: '1 week',
        month: '1 month'
      }

      const since = new Date()
      since.setTime(since.getTime() - (timeframe === 'hour' ? 3600000 : 
                                      timeframe === 'day' ? 86400000 :
                                      timeframe === 'week' ? 604800000 : 2592000000))

      // Get auth logs
      const { data: authLogs, error: authError } = await supabase
        .from('auth_logs')
        .select('action, status, details')
        .gte('created_at', since.toISOString())

      // Get security events
      const { data: securityEvents, error: securityError } = await supabase
        .from('security_events')
        .select('event_type')
        .gte('created_at', since.toISOString())

      if (authError || securityError) {
        console.error('❌ Failed to fetch auth stats:', authError || securityError)
        return {
          totalAttempts: 0,
          successfulLogins: 0,
          failedLogins: 0,
          registrations: 0,
          passwordResets: 0,
          securityEvents: 0,
          topFailureReasons: []
        }
      }

      const loginAttempts = authLogs?.filter(log => log.action === 'login_attempt') || []
      const registrationAttempts = authLogs?.filter(log => log.action === 'registration_attempt') || []
      const passwordResets = authLogs?.filter(log => log.action.includes('password_')) || []

      const failedLogins = loginAttempts.filter(log => log.status === 'failure')
      const failureReasons = failedLogins.reduce((acc: any, log) => {
        const reason = log.details ? JSON.parse(log.details).reason || 'Unknown' : 'Unknown'
        acc[reason] = (acc[reason] || 0) + 1
        return acc
      }, {})

      return {
        totalAttempts: loginAttempts.length,
        successfulLogins: loginAttempts.filter(log => log.status === 'success').length,
        failedLogins: failedLogins.length,
        registrations: registrationAttempts.filter(log => log.status === 'success').length,
        passwordResets: passwordResets.length,
        securityEvents: securityEvents?.length || 0,
        topFailureReasons: Object.entries(failureReasons)
          .map(([reason, count]) => ({ reason, count: count as number }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)
      }
    } catch (error) {
      console.error('❌ Error fetching auth stats:', error)
      return {
        totalAttempts: 0,
        successfulLogins: 0,
        failedLogins: 0,
        registrations: 0,
        passwordResets: 0,
        securityEvents: 0,
        topFailureReasons: []
      }
    }
  }

  /**
   * Parse user agent string for better logging
   */
  private parseUserAgent(userAgent?: string): any {
    if (!userAgent) return null

    try {
      // Simple user agent parsing (in production, use a proper library like 'ua-parser-js')
      const isBot = /bot|crawler|spider|scraper/i.test(userAgent)
      const isMobile = /mobile|android|iphone|ipad/i.test(userAgent)
      const browser = userAgent.match(/(chrome|firefox|safari|edge|opera)/i)?.[1] || 'unknown'
      const os = userAgent.match(/(windows|mac|linux|android|ios)/i)?.[1] || 'unknown'

      return {
        browser,
        os,
        isMobile,
        isBot,
        raw: userAgent.substring(0, 200) // Truncate for storage
      }
    } catch (error) {
      return { raw: userAgent.substring(0, 200) }
    }
  }

  /**
   * Get geolocation info from IP (placeholder implementation)
   */
  private async getGeolocation(ipAddress?: string): Promise<any> {
    if (!ipAddress || ipAddress === '127.0.0.1' || ipAddress === '::1') {
      return { location: 'localhost' }
    }

    try {
      // In production, you would use a geolocation service like MaxMind or ipapi
      // For now, just return basic info
      return {
        ip: ipAddress,
        location: 'Unknown',
        country: 'Unknown',
        city: 'Unknown'
      }
    } catch (error) {
      return { ip: ipAddress, location: 'Unknown' }
    }
  }

  /**
   * Get recent failed attempts for brute force detection
   */
  private async getRecentFailedAttempts(email: string, ipAddress?: string): Promise<number> {
    try {
      const fifteenMinutesAgo = new Date()
      fifteenMinutesAgo.setMinutes(fifteenMinutesAgo.getMinutes() - 15)

      let query = supabase
        .from('auth_logs')
        .select('id')
        .eq('action', 'login_attempt')
        .eq('status', 'failure')
        .gte('created_at', fifteenMinutesAgo.toISOString())

      if (email) {
        query = query.eq('email', email)
      }

      if (ipAddress) {
        query = query.eq('ip_address', ipAddress)
      }

      const { data, error } = await query

      if (error) {
        console.error('❌ Failed to get recent failed attempts:', error)
        return 0
      }

      return data?.length || 0
    } catch (error) {
      console.error('❌ Error checking recent failed attempts:', error)
      return 0
    }
  }

  /**
   * Clean up old logs (for maintenance)
   */
  async cleanupOldLogs(daysToKeep: number = 90): Promise<void> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

      // Clean auth logs
      const { error: authError } = await supabase
        .from('auth_logs')
        .delete()
        .lt('created_at', cutoffDate.toISOString())

      // Clean security events (keep longer for security reasons)
      const securityCutoff = new Date()
      securityCutoff.setDate(securityCutoff.getDate() - (daysToKeep * 2))
      
      const { error: securityError } = await supabase
        .from('security_events')
        .delete()
        .lt('created_at', securityCutoff.toISOString())

      if (authError || securityError) {
        console.error('❌ Failed to cleanup old logs:', authError || securityError)
      } else {
        console.log(`✅ Cleaned up logs older than ${daysToKeep} days`)
      }
    } catch (error) {
      console.error('❌ Log cleanup error:', error)
    }
  }
}