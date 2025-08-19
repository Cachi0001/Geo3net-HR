import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authenticateToken } from '../middleware/auth';
import { permissionMiddleware } from '../middleware/permission';

const router = Router();
const dashboardController = new DashboardController();

// Apply authentication to all dashboard routes
router.use(authenticateToken);

/**
 * Dashboard Metrics Routes
 * Access: Super Admin, HR Admin, Manager
 */

// Get comprehensive dashboard metrics
router.get('/metrics',
  permissionMiddleware.requireMinimumRole('manager'),
  dashboardController.getDashboardMetrics.bind(dashboardController)
);

// Get department statistics
router.get('/department-stats',
  permissionMiddleware.requireMinimumRole('manager'),
  dashboardController.getDepartmentStats.bind(dashboardController)
);

// Get recent activities
router.get('/recent-activities',
  permissionMiddleware.requireMinimumRole('manager'),
  dashboardController.getRecentActivities.bind(dashboardController)
);

// Get comprehensive dashboard data (all in one)
router.get('/data',
  permissionMiddleware.requireMinimumRole('manager'),
  dashboardController.getDashboardData.bind(dashboardController)
);

/**
 * Real-time Dashboard Routes
 */

// Get real-time attendance status (from settings controller)
router.get('/real-time-status',
  permissionMiddleware.requireMinimumRole('manager'),
  async (req, res) => {
    // This would typically be handled by the settings controller
    // For now, return a simple response
    res.json({
      success: true,
      message: 'Real-time status retrieved successfully',
      data: {
        timestamp: new Date().toISOString(),
        currentlyCheckedIn: 186,
        activeEmployees: []
      }
    });
  }
);

export default router;