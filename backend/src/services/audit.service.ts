import { supabase } from '../config/database'
import { ValidationError } from '../utils/errors'

export interface AuditLog {
  id: string
  userId?: string
  action: string
  entityType: string
  entityId?: string
  oldValues?: Record<string, any>
  newValues?: Record<string, any>
  ipAddress?: string
  userAgent?: string
  timestamp: string
  createdAt: string
  updatedAt: string
  // Related data for display
  userName?: string
}

export interface CreateAuditLogData {
  userId?: string
  action: string
  entityType: string
  entityId?: string
  oldValues?: Record<string, any>
  newValues?: Record<string, any>
  ipAddress?: string
  userAgent?: string
}

export interface AuditSearchFilters {
  userId?: string
  action?: string
  entityType?: string
  entityId?: string
  startDate?: string
  endDate?: string
  search?: string
  limit?: number
  offset?: number
  ipAddress?: string
}

export interface AuditResult {
  success: boolean
  message: string
  auditLog?: AuditLog
  auditLogs?: AuditLog[]
  total?: number
  deletedCount?: number
  summary?: {
    totalActions: number
    uniqueUsers: number
    topActions: Array<{ action: string; count: number }>
    topEntities: Array<{ entityType: string; count: number }>
  }
}

export class AuditService {
  // Create audit log entry
  async createAuditLog(data: CreateAuditLogData): Promise<AuditResult> {
    try {
      this.validateAuditLogData(data)

      const { data: newAuditLog, error } = await supabase
        .from('audit_logs')
        .insert({
          user_id: data.userId,
          action: data.action,
          entity_type: data.entityType,
          entity_id: data.entityId,
          old_values: data.oldValues,
          new_values: data.newValues,
          ip_address: data.ipAddress,
          user_agent: data.userAgent,
          timestamp: new Date().toISOString()
        })
        .select(`
          *,
          users(full_name)
        `)
        .single()

      if (error) throw error

      return {
        success: true,
        message: 'Audit log created successfully',
        auditLog: this.mapDatabaseToAuditLog(newAuditLog)
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to create audit log'
      }
    }
  }

  // Get audit logs with filtering
  async getAuditLogs(filters: AuditSearchFilters = {}): Promise<AuditResult> {
    try {
      let query = supabase
        .from('audit_logs')
        .select(`
          *,
          users(full_name)
        `, { count: 'exact' })
        .order('timestamp', { ascending: false })

      if (filters.userId) {
        query = query.eq('user_id', filters.userId)
      }

      if (filters.action) {
        query = query.eq('action', filters.action)
      }

      if (filters.entityType) {
        query = query.eq('entity_type', filters.entityType)
      }

      if (filters.entityId) {
        query = query.eq('entity_id', filters.entityId)
      }

      if (filters.startDate) {
        query = query.gte('timestamp', filters.startDate)
      }

      if (filters.endDate) {
        query = query.lte('timestamp', filters.endDate)
      }

      if (filters.search) {
        query = query.or(`action.ilike.%${filters.search}%,entity_type.ilike.%${filters.search}%,users.full_name.ilike.%${filters.search}%`)
      }

      if (filters.limit) {
        query = query.limit(filters.limit)
      }

      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
      }

      const { data, error, count } = await query

      if (error) throw error

      return {
        success: true,
        message: 'Audit logs retrieved successfully',
        auditLogs: data?.map(this.mapDatabaseToAuditLog) || [],
        total: count || 0
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to retrieve audit logs'
      }
    }
  }

  // Get audit log by ID
  async getAuditLogById(id: string): Promise<AuditResult> {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          *,
          users(full_name)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      if (!data) {
        return {
          success: false,
          message: 'Audit log not found'
        }
      }

      return {
        success: true,
        message: 'Audit log retrieved successfully',
        auditLog: this.mapDatabaseToAuditLog(data)
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to retrieve audit log'
      }
    }
  }

  // Get audit summary/statistics
  async getAuditSummary(filters: AuditSearchFilters = {}): Promise<AuditResult> {
    try {
      let baseQuery = supabase.from('audit_logs').select('*')

      if (filters.startDate) {
        baseQuery = baseQuery.gte('timestamp', filters.startDate)
      }
      if (filters.endDate) {
        baseQuery = baseQuery.lte('timestamp', filters.endDate)
      }
      if (filters.userId) {
        baseQuery = baseQuery.eq('user_id', filters.userId)
      }

      // Get total count
      let countQuery = supabase.from('audit_logs').select('*', { count: 'exact', head: true })
      if (filters.startDate) {
        countQuery = countQuery.gte('timestamp', filters.startDate)
      }
      if (filters.endDate) {
        countQuery = countQuery.lte('timestamp', filters.endDate)
      }
      if (filters.userId) {
        countQuery = countQuery.eq('user_id', filters.userId)
      }
      const { count: totalActions } = await countQuery

      // Get unique users count
      const { data: uniqueUsersData } = await supabase
        .from('audit_logs')
        .select('user_id')
        .neq('user_id', null)

      const uniqueUsers = new Set(uniqueUsersData?.map((item: any) => item.user_id) || []).size

      // Get top actions
      const { data: actionsData } = await baseQuery
        .select('action')
      
      const actionCounts = actionsData?.reduce((acc: Record<string, number>, item) => {
        acc[item.action] = (acc[item.action] || 0) + 1
        return acc
      }, {}) || {}

      const topActions = Object.entries(actionCounts)
        .map(([action, count]) => ({ action, count: count as number }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)

      // Get top entity types
      const { data: entitiesData } = await baseQuery
        .select('entity_type')
      
      const entityCounts = entitiesData?.reduce((acc: Record<string, number>, item) => {
        acc[item.entity_type] = (acc[item.entity_type] || 0) + 1
        return acc
      }, {}) || {}

      const topEntities = Object.entries(entityCounts)
        .map(([entityType, count]) => ({ entityType, count: count as number }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)

      return {
        success: true,
        message: 'Audit summary retrieved successfully',
        summary: {
          totalActions: totalActions || 0,
          uniqueUsers,
          topActions,
          topEntities
        }
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to retrieve audit summary'
      }
    }
  }

  // Clean up old audit logs (for maintenance)
  async cleanupOldLogs(daysToKeep: number = 365): Promise<AuditResult> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

      const { data, error } = await supabase
        .from('audit_logs')
        .delete()
        .lt('timestamp', cutoffDate.toISOString())
        .select('id')

      if (error) throw error

      const deletedCount = data?.length || 0

      return {
        success: true,
        message: `Cleaned up ${deletedCount} old audit log entries`,
        deletedCount
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to cleanup old audit logs'
      }
    }
  }

  // Convenience methods for common audit actions
  async logUserAction(userId: string, action: string, details?: {
    entityType?: string
    entityId?: string
    oldValues?: Record<string, any>
    newValues?: Record<string, any>
    ipAddress?: string
    userAgent?: string
  }): Promise<void> {
    try {
      await this.createAuditLog({
        userId,
        action,
        entityType: details?.entityType || 'user',
        entityId: details?.entityId,
        oldValues: details?.oldValues,
        newValues: details?.newValues,
        ipAddress: details?.ipAddress,
        userAgent: details?.userAgent
      })
    } catch (error) {
      console.error('Failed to log user action:', error)
    }
  }

  async logSystemAction(action: string, details?: {
    entityType?: string
    entityId?: string
    oldValues?: Record<string, any>
    newValues?: Record<string, any>
  }): Promise<void> {
    try {
      await this.createAuditLog({
        action,
        entityType: details?.entityType || 'system',
        entityId: details?.entityId,
        oldValues: details?.oldValues,
        newValues: details?.newValues
      })
    } catch (error) {
      console.error('Failed to log system action:', error)
    }
  }

  async logDataChange(userId: string, entityType: string, entityId: string, oldValues: Record<string, any>, newValues: Record<string, any>, ipAddress?: string, userAgent?: string): Promise<void> {
    try {
      await this.createAuditLog({
        userId,
        action: 'update',
        entityType,
        entityId,
        oldValues,
        newValues,
        ipAddress,
        userAgent
      })
    } catch (error) {
      console.error('Failed to log data change:', error)
    }
  }

  async logLogin(userId: string, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.logUserAction(userId, 'login', {
      entityType: 'authentication',
      ipAddress,
      userAgent
    })
  }

  async logLogout(userId: string, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.logUserAction(userId, 'logout', {
      entityType: 'authentication',
      ipAddress,
      userAgent
    })
  }

  async logFailedLogin(email: string, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.createAuditLog({
      action: 'failed_login',
      entityType: 'authentication',
      newValues: { email },
      ipAddress,
      userAgent
    })
  }

  async logPasswordChange(userId: string, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.logUserAction(userId, 'password_change', {
      entityType: 'authentication',
      ipAddress,
      userAgent
    })
  }

  async logPermissionChange(userId: string, targetUserId: string, oldRole: string, newRole: string, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.logUserAction(userId, 'permission_change', {
      entityType: 'user_role',
      entityId: targetUserId,
      oldValues: { role: oldRole },
      newValues: { role: newRole },
      ipAddress,
      userAgent
    })
  }

  async logFileAccess(userId: string, fileName: string, action: 'view' | 'download' | 'upload' | 'delete', ipAddress?: string, userAgent?: string): Promise<void> {
    await this.logUserAction(userId, `file_${action}`, {
      entityType: 'file',
      entityId: fileName,
      ipAddress,
      userAgent
    })
  }

  async logReportGeneration(userId: string, reportType: string, filters?: Record<string, any>, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.logUserAction(userId, 'generate_report', {
      entityType: 'report',
      entityId: reportType,
      newValues: { filters },
      ipAddress,
      userAgent
    })
  }

  async logBulkOperation(userId: string, operation: string, entityType: string, affectedIds: string[], ipAddress?: string, userAgent?: string): Promise<void> {
    await this.logUserAction(userId, `bulk_${operation}`, {
      entityType,
      newValues: { affectedIds, count: affectedIds.length },
      ipAddress,
      userAgent
    })
  }

  // Helper methods
  private validateAuditLogData(data: CreateAuditLogData): void {
    if (!data.action?.trim()) {
      throw new ValidationError('Action is required')
    }
    if (!data.entityType?.trim()) {
      throw new ValidationError('Entity type is required')
    }
  }

  private mapDatabaseToAuditLog(data: any): AuditLog {
    return {
      id: data.id,
      userId: data.user_id,
      action: data.action,
      entityType: data.entity_type,
      entityId: data.entity_id,
      oldValues: data.old_values,
      newValues: data.new_values,
      ipAddress: data.ip_address,
      userAgent: data.user_agent,
      timestamp: data.timestamp,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      userName: data.users?.full_name
    }
  }
}

// Export singleton instance
export const auditService = new AuditService()