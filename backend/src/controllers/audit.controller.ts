import { Request, Response } from 'express'
import { AuditService, AuditSearchFilters } from '../services/audit.service'
import { ResponseHandler } from '../utils/response'
import { ValidationError } from '../utils/errors'
import { AuthenticatedRequest } from '../middleware/permission'

export class AuditController {
  private auditService: AuditService

  constructor() {
    this.auditService = new AuditService()
  }

  
  async getAuditLogs(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const userRole = req.user?.role

      if (!['admin', 'hr'].includes(userRole || '')) {
        return ResponseHandler.forbidden(res, 'You do not have permission to view audit logs')
      }

      const filters: AuditSearchFilters = {
        userId: req.query.userId as string,
        action: req.query.action as string,
        entityType: req.query.entityType as string,
        entityId: req.query.entityId as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        ipAddress: req.query.ipAddress as string,
        search: req.query.search as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
      }

      const result = await this.auditService.getAuditLogs(filters)

      if (result.success) {
        return ResponseHandler.success(res, result.message, {
          auditLogs: result.auditLogs,
          total: result.total,
          pagination: {
            limit: filters.limit || 50,
            offset: filters.offset || 0,
            total: result.total || 0
          }
        })
      }

      return ResponseHandler.badRequest(res, result.message)
    } catch (error) {
      return ResponseHandler.internalError(res, 'Failed to retrieve audit logs')
    }
  }

  /**
   * Get audit log by ID
   * GET /api/audit/logs/:id
   */
  async getAuditLogById(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params
      const userRole = req.user?.role

      // Check permissions - only admin and hr can view audit logs
      if (!['admin', 'hr'].includes(userRole || '')) {
        return ResponseHandler.forbidden(res, 'You do not have permission to view audit logs')
      }

      const result = await this.auditService.getAuditLogById(id)

      if (result.success) {
        return ResponseHandler.success(res, result.message, {
          auditLog: result.auditLog
        })
      }

      return ResponseHandler.notFound(res, result.message)
    } catch (error) {
      return ResponseHandler.internalError(res, 'Failed to retrieve audit log')
    }
  }

  /**
   * Get audit summary/analytics
   * GET /api/audit/summary
   */
  async getAuditSummary(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const userRole = req.user?.role

      // Check permissions - only admin and hr can view audit summary
      if (!['admin', 'hr'].includes(userRole || '')) {
        return ResponseHandler.forbidden(res, 'You do not have permission to view audit summary')
      }

      const startDate = req.query.startDate as string
      const endDate = req.query.endDate as string
      const groupBy = req.query.groupBy as string || 'day'

      const result = await this.auditService.getAuditSummary({
        startDate,
        endDate
      })

      if (result.success) {
        return ResponseHandler.success(res, result.message, {
          summary: result.summary
        })
      }

      return ResponseHandler.badRequest(res, result.message)
    } catch (error) {
      return ResponseHandler.internalError(res, 'Failed to retrieve audit summary')
    }
  }

  /**
   * Get user activity logs
   * GET /api/audit/users/:userId/activity
   */
  async getUserActivity(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { userId } = req.params
      const requestingUserId = req.user?.id!
      const userRole = req.user?.role

      // Check permissions - users can view their own activity, admin/hr can view any
      if (!['admin', 'hr'].includes(userRole || '') && userId !== requestingUserId) {
        return ResponseHandler.forbidden(res, 'You can only view your own activity logs')
      }

      const filters: AuditSearchFilters = {
        userId,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        action: req.query.action as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
      }

      const result = await this.auditService.getAuditLogs(filters)

      if (result.success) {
        return ResponseHandler.success(res, result.message, {
          activityLogs: result.auditLogs,
          total: result.total,
          pagination: {
            limit: filters.limit || 50,
            offset: filters.offset || 0,
            total: result.total || 0
          }
        })
      }

      return ResponseHandler.badRequest(res, result.message)
    } catch (error) {
      return ResponseHandler.internalError(res, 'Failed to retrieve user activity')
    }
  }

  /**
   * Get system activity analytics
   * GET /api/audit/analytics
   */
  async getSystemAnalytics(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const userRole = req.user?.role

      // Check permissions - only admin can view system analytics
      if (userRole !== 'admin') {
        return ResponseHandler.forbidden(res, 'You do not have permission to view system analytics')
      }

      const startDate = req.query.startDate as string || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() // Last 30 days
      const endDate = req.query.endDate as string || new Date().toISOString()

      // Get all audit logs for the period
      const result = await this.auditService.getAuditLogs({
        startDate,
        endDate,
        limit: 10000 // Large limit to get all data for analytics
      })

      if (result.success) {
        const logs = result.auditLogs || []

        // Calculate analytics
        const analytics = {
          totalActivities: logs.length,
          uniqueUsers: new Set(logs.map(log => log.userId).filter(Boolean)).size,
          topActions: this.getTopItems(logs, 'action', 10),
          topUsers: this.getTopItems(logs, 'userId', 10),
          topEntityTypes: this.getTopItems(logs, 'entityType', 10),
          activityByHour: this.getActivityByHour(logs),
          activityByDay: this.getActivityByDay(logs),
          securityEvents: {
            failedLogins: logs.filter(log => log.action === 'login_failed').length,
            passwordResets: logs.filter(log => log.action === 'password_reset').length,
            accountLockouts: logs.filter(log => log.action === 'account_locked').length,
            suspiciousActivities: logs.filter(log => 
              log.action?.includes('failed') || 
              log.action?.includes('unauthorized') ||
              log.action?.includes('suspicious')
            ).length
          },
          dataChanges: {
            total: logs.filter(log => log.action?.includes('update') || log.action?.includes('delete')).length,
            byEntityType: this.getTopItems(
              logs.filter(log => log.action?.includes('update') || log.action?.includes('delete')),
              'entityType',
              10
            )
          },
          systemHealth: {
            errors: logs.filter(log => log.action?.includes('error')).length,
            warnings: logs.filter(log => log.action?.includes('warning')).length,
            criticalEvents: logs.filter(log => log.action?.includes('critical')).length
          }
        }

        return ResponseHandler.success(res, 'System analytics retrieved successfully', {
          analytics,
          period: {
            startDate,
            endDate
          }
        })
      }

      return ResponseHandler.badRequest(res, result.message)
    } catch (error) {
      return ResponseHandler.internalError(res, 'Failed to retrieve system analytics')
    }
  }

  /**
   * Get security events
   * GET /api/audit/security
   */
  async getSecurityEvents(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const userRole = req.user?.role

      // Check permissions - only admin can view security events
      if (userRole !== 'admin') {
        return ResponseHandler.forbidden(res, 'You do not have permission to view security events')
      }

      const filters: AuditSearchFilters = {
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        ipAddress: req.query.ipAddress as string,
        userId: req.query.userId as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
      }

      // Get security-related actions
      const securityActions = [
        'login_failed',
        'login_success',
        'logout',
        'password_reset',
        'password_change',
        'account_locked',
        'account_unlocked',
        'unauthorized_access',
        'permission_denied',
        'suspicious_activity'
      ]

      const allResults = await Promise.all(
        securityActions.map(action => 
          this.auditService.getAuditLogs({ ...filters, action })
        )
      )

      const securityEvents = allResults
        .filter(result => result.success)
        .flatMap(result => result.auditLogs || [])
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(filters.offset || 0, (filters.offset || 0) + (filters.limit || 50))

      return ResponseHandler.success(res, 'Security events retrieved successfully', {
        securityEvents,
        total: securityEvents.length,
        pagination: {
          limit: filters.limit || 50,
          offset: filters.offset || 0,
          total: securityEvents.length
        }
      })
    } catch (error) {
      return ResponseHandler.internalError(res, 'Failed to retrieve security events')
    }
  }

  /**
   * Clean up old audit logs
   * DELETE /api/audit/cleanup
   */
  async cleanupOldLogs(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const userRole = req.user?.role
      const userId = req.user?.id!

      // Check permissions - only admin can cleanup logs
      if (userRole !== 'admin') {
        return ResponseHandler.forbidden(res, 'You do not have permission to cleanup audit logs')
      }

      const daysToKeep = req.body.daysToKeep || 365 // Default to 1 year

      if (daysToKeep < 30) {
        return ResponseHandler.badRequest(res, 'Cannot delete logs newer than 30 days')
      }

      const result = await this.auditService.cleanupOldLogs(daysToKeep)

      if (result.success) {
        // Log the cleanup action
        await this.auditService.logUserAction(userId, 'cleanup_audit_logs', {
          entityType: 'audit_log',
          newValues: { daysToKeep, deletedCount: result.deletedCount },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        })

        return ResponseHandler.success(res, result.message, {
          deletedCount: result.deletedCount
        })
      }

      return ResponseHandler.badRequest(res, result.message)
    } catch (error) {
      return ResponseHandler.internalError(res, 'Failed to cleanup audit logs')
    }
  }

  /**
   * Export audit logs
   * GET /api/audit/export
   */
  async exportAuditLogs(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const userRole = req.user?.role
      const userId = req.user?.id!

      // Check permissions - only admin and hr can export logs
      if (!['admin', 'hr'].includes(userRole || '')) {
        return ResponseHandler.forbidden(res, 'You do not have permission to export audit logs')
      }

      const filters: AuditSearchFilters = {
        userId: req.query.userId as string,
        action: req.query.action as string,
        entityType: req.query.entityType as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        limit: 10000 // Large limit for export
      }

      const result = await this.auditService.getAuditLogs(filters)

      if (result.success) {
        // Log the export action
        await this.auditService.logUserAction(userId, 'export_audit_logs', {
          entityType: 'audit_log',
          newValues: { filters, exportedCount: result.auditLogs?.length || 0 },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        })

        // Format data for export
        const exportData = result.auditLogs?.map(log => ({
          id: log.id,
          userId: log.userId,
          userName: log.userName,
          action: log.action,
          entityType: log.entityType,
          entityId: log.entityId,
          oldValues: JSON.stringify(log.oldValues),
          newValues: JSON.stringify(log.newValues),
          ipAddress: log.ipAddress,
          userAgent: log.userAgent,
          createdAt: log.createdAt
        }))

        return ResponseHandler.success(res, 'Audit logs exported successfully', {
          exportData,
          total: exportData?.length || 0,
          exportedAt: new Date().toISOString()
        })
      }

      return ResponseHandler.badRequest(res, result.message)
    } catch (error) {
      return ResponseHandler.internalError(res, 'Failed to export audit logs')
    }
  }

  // Helper methods for analytics
  private getTopItems(logs: any[], field: string, limit: number): Array<{ name: string; count: number }> {
    const counts: Record<string, number> = {}
    
    logs.forEach(log => {
      const value = log[field]
      if (value) {
        counts[value] = (counts[value] || 0) + 1
      }
    })

    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([name, count]) => ({ name, count }))
  }

  private getActivityByHour(logs: any[]): Array<{ hour: number; count: number }> {
    const hourCounts: Record<number, number> = {}
    
    // Initialize all hours
    for (let i = 0; i < 24; i++) {
      hourCounts[i] = 0
    }

    logs.forEach(log => {
      const hour = new Date(log.createdAt).getHours()
      hourCounts[hour]++
    })

    return Object.entries(hourCounts)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }))
      .sort((a, b) => a.hour - b.hour)
  }

  private getActivityByDay(logs: any[]): Array<{ date: string; count: number }> {
    const dayCounts: Record<string, number> = {}
    
    logs.forEach(log => {
      const date = new Date(log.createdAt).toISOString().split('T')[0]
      dayCounts[date] = (dayCounts[date] || 0) + 1
    })

    return Object.entries(dayCounts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }
}