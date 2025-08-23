import { Request, Response, NextFunction } from 'express'
import { AuthLoggerService } from '../services/authLogger.service'
import { ResponseHandler } from '../utils/response'
import { ValidationError } from '../utils/errors'

const authLogger = AuthLoggerService.getInstance()

/**
 * Get authentication logs for admin dashboard
 */
export const getAuthLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, limit = 50, action, status } = req.query

    if (limit && (isNaN(Number(limit)) || Number(limit) > 1000)) {
      throw new ValidationError('Invalid limit parameter')
    }

    let logs = await authLogger.getUserAuthLogs(
      userId as string || '', 
      Number(limit)
    )

    // Filter by action if specified
    if (action) {
      logs = logs.filter(log => log.action === action)
    }

    // Filter by status if specified
    if (status) {
      logs = logs.filter(log => log.status === status)
    }

    return ResponseHandler.success(res, 'Auth logs retrieved successfully', {
      logs,
      total: logs.length
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get security events for admin dashboard
 */
export const getSecurityEvents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { limit = 100, severity, eventType } = req.query

    if (limit && (isNaN(Number(limit)) || Number(limit) > 1000)) {
      throw new ValidationError('Invalid limit parameter')
    }

    let events = await authLogger.getSecurityEvents(Number(limit))

    // Filter by severity if specified
    if (severity) {
      events = events.filter(event => event.severity === severity)
    }

    // Filter by event type if specified
    if (eventType) {
      events = events.filter(event => event.eventType === eventType)
    }

    return ResponseHandler.success(res, 'Security events retrieved successfully', {
      events,
      total: events.length
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get authentication statistics
 */
export const getAuthStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { timeframe = 'day' } = req.query

    if (!['hour', 'day', 'week', 'month'].includes(timeframe as string)) {
      throw new ValidationError('Invalid timeframe. Must be: hour, day, week, or month')
    }

    const stats = await authLogger.getAuthStats(timeframe as 'hour' | 'day' | 'week' | 'month')

    return ResponseHandler.success(res, 'Auth statistics retrieved successfully', stats)
  } catch (error) {
    next(error)
  }
}

/**
 * Clean up old logs (admin only)
 */
export const cleanupLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { daysToKeep = 90 } = req.body

    if (isNaN(Number(daysToKeep)) || Number(daysToKeep) < 1) {
      throw new ValidationError('Invalid daysToKeep parameter')
    }

    await authLogger.cleanupOldLogs(Number(daysToKeep))

    return ResponseHandler.success(res, `Old logs cleaned up successfully (kept ${daysToKeep} days)`)
  } catch (error) {
    next(error)
  }
}

/**
 * Get detailed user activity
 */
export const getUserActivity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params
    const { limit = 100 } = req.query

    if (!userId) {
      throw new ValidationError('User ID is required')
    }

    const logs = await authLogger.getUserAuthLogs(userId, Number(limit))

    // Group by action type for better visualization
    const activitySummary = logs.reduce((acc: any, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1
      return acc
    }, {})

    return ResponseHandler.success(res, 'User activity retrieved successfully', {
      userId,
      logs,
      summary: activitySummary,
      total: logs.length
    })
  } catch (error) {
    next(error)
  }
}