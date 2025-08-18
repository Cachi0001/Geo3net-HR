import { Router } from 'express'
import { AuditController } from '../controllers/audit.controller'
import { authenticateToken } from '../middleware/auth'
import { 
  permissionMiddleware,
  requireHRStaff
} from '../middleware/permission'

const router = Router()
const auditController = new AuditController()

// Apply authentication to all routes
router.use(authenticateToken)

// Audit Log Routes
router.get('/logs', 
  permissionMiddleware.requireAnyPermission(['audit.read', 'system.admin']),
  auditController.getAuditLogs.bind(auditController)
)

router.get('/logs/:id', 
  permissionMiddleware.requireAnyPermission(['audit.read', 'system.admin']),
  auditController.getAuditLogById.bind(auditController)
)

// Audit Summary and Analytics
router.get('/summary', 
  permissionMiddleware.requireAnyPermission(['audit.read', 'system.admin']),
  auditController.getAuditSummary.bind(auditController)
)

router.get('/analytics', 
  permissionMiddleware.requirePermission('system.admin'),
  auditController.getSystemAnalytics.bind(auditController)
)

// User Activity Routes
router.get('/users/:userId/activity', 
  permissionMiddleware.requireAnyPermission(['audit.read', 'system.admin']),
  auditController.getUserActivity.bind(auditController)
)

// Security Events
router.get('/security', 
  permissionMiddleware.requirePermission('system.admin'),
  auditController.getSecurityEvents.bind(auditController)
)

// Export and Cleanup
router.get('/export', 
  permissionMiddleware.requireAnyPermission(['audit.read', 'system.admin']),
  auditController.exportAuditLogs.bind(auditController)
)

router.delete('/cleanup', 
  permissionMiddleware.requirePermission('system.admin'),
  auditController.cleanupOldLogs.bind(auditController)
)

export default router