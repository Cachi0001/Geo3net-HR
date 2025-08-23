import { Router } from 'express'
import { authenticateToken } from '../middleware/auth'
import { requireHRAdmin, requireSuperAdmin } from '../middleware/permission'
import {
  getAuthLogs,
  getSecurityEvents,
  getAuthStats,
  cleanupLogs,
  getUserActivity
} from '../controllers/authLogs.controller'

const router = Router()

// All routes require authentication and HR admin or higher
router.use(authenticateToken)
router.use(requireHRAdmin)

// Get authentication logs
router.get('/logs', getAuthLogs)

// Get security events
router.get('/security-events', getSecurityEvents)

// Get authentication statistics
router.get('/stats', getAuthStats)

// Get user activity
router.get('/user/:userId/activity', getUserActivity)

// Clean up old logs (super-admin only)
router.post('/cleanup', requireSuperAdmin, cleanupLogs)

export default router