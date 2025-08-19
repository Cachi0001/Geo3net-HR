import { Router } from 'express'
import { SettingsController } from '../controllers/settings.controller'
import { authenticateToken } from '../middleware/auth'
import { permissionMiddleware } from '../middleware/permission'

const router = Router()
const settingsController = new SettingsController()

// Apply authentication to all routes
router.use(authenticateToken)

/**
 * Location Management Routes
 * Super-admin only access for configuring office locations and geofencing
 */

// Create office location
router.post('/locations',
  permissionMiddleware.requireMinimumRole('super-admin'),
  settingsController.createLocation.bind(settingsController)
)

// Get all office locations
router.get('/locations',
  permissionMiddleware.requireMinimumRole('super-admin'),
  settingsController.getLocations.bind(settingsController)
)

// Get location by ID
router.get('/locations/:id',
  permissionMiddleware.requireMinimumRole('super-admin'),
  settingsController.getLocationById.bind(settingsController)
)

// Update office location
router.put('/locations/:id',
  permissionMiddleware.requireMinimumRole('super-admin'),
  settingsController.updateLocation.bind(settingsController)
)

// Delete office location
router.delete('/locations/:id',
  permissionMiddleware.requireMinimumRole('super-admin'),
  settingsController.deleteLocation.bind(settingsController)
)

// Set default location
router.post('/locations/:id/set-default',
  permissionMiddleware.requireMinimumRole('super-admin'),
  settingsController.setDefaultLocation.bind(settingsController)
)

/**
 * Attendance Policy Routes
 * Super-admin configuration for work hours, break times, overtime rules
 */

// Create attendance policy
router.post('/attendance-policies',
  permissionMiddleware.requireMinimumRole('super-admin'),
  settingsController.createAttendancePolicy.bind(settingsController)
)

// Get all attendance policies
router.get('/attendance-policies',
  permissionMiddleware.requireMinimumRole('super-admin'),
  settingsController.getAttendancePolicies.bind(settingsController)
)

// Get attendance policy by ID
router.get('/attendance-policies/:id',
  permissionMiddleware.requireMinimumRole('super-admin'),
  settingsController.getAttendancePolicyById.bind(settingsController)
)

// Update attendance policy
router.put('/attendance-policies/:id',
  permissionMiddleware.requireMinimumRole('super-admin'),
  settingsController.updateAttendancePolicy.bind(settingsController)
)

// Delete attendance policy
router.delete('/attendance-policies/:id',
  permissionMiddleware.requireMinimumRole('super-admin'),
  settingsController.deleteAttendancePolicy.bind(settingsController)
)

// Set default attendance policy
router.post('/attendance-policies/:id/set-default',
  permissionMiddleware.requireMinimumRole('super-admin'),
  settingsController.setDefaultAttendancePolicy.bind(settingsController)
)

/**
 * Check-in/Check-out Configuration Routes
 * Super-admin settings for check-in rules and validation
 */

// Get check-in settings
router.get('/checkin-settings',
  permissionMiddleware.requireMinimumRole('super-admin'),
  settingsController.getCheckinSettings.bind(settingsController)
)

// Update check-in settings
router.put('/checkin-settings',
  permissionMiddleware.requireMinimumRole('super-admin'),
  settingsController.updateCheckinSettings.bind(settingsController)
)

/**
 * Notification Settings Routes
 * Super-admin configuration for attendance alerts and notifications
 */

// Get notification settings
router.get('/notification-settings',
  permissionMiddleware.requireMinimumRole('super-admin'),
  settingsController.getNotificationSettings.bind(settingsController)
)

// Update notification settings
router.put('/notification-settings',
  permissionMiddleware.requireMinimumRole('super-admin'),
  settingsController.updateNotificationSettings.bind(settingsController)
)

/**
 * System Configuration Routes
 * General system settings for super-admin
 */

// Get system configuration
router.get('/system-config',
  permissionMiddleware.requireMinimumRole('super-admin'),
  settingsController.getSystemConfig.bind(settingsController)
)

// Update system configuration
router.put('/system-config',
  permissionMiddleware.requireMinimumRole('super-admin'),
  settingsController.updateSystemConfig.bind(settingsController)
)

/**
 * Attendance Dashboard Data Routes
 * Super-admin access to attendance monitoring and analytics
 */

// Get attendance dashboard overview
router.get('/attendance-dashboard',
  permissionMiddleware.requireMinimumRole('super-admin'),
  settingsController.getAttendanceDashboard.bind(settingsController)
)

// Get attendance analytics
router.get('/attendance-analytics',
  permissionMiddleware.requireMinimumRole('super-admin'),
  settingsController.getAttendanceAnalytics.bind(settingsController)
)

// Get real-time attendance status
router.get('/attendance-status',
  permissionMiddleware.requireMinimumRole('super-admin'),
  settingsController.getRealTimeAttendanceStatus.bind(settingsController)
)

export { router as settingsRoutes }