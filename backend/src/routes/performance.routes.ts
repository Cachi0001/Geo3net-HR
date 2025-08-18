import { Router } from 'express'
import { PerformanceController } from '../controllers/performance.controller'
import { authenticateToken } from '../middleware/auth'
import { 
  permissionMiddleware,
  requireHRStaff,
  requireManager
} from '../middleware/permission'

const router = Router()
const performanceController = new PerformanceController()

// Apply authentication to all routes
router.use(authenticateToken)

// Performance Cycle Routes
router.post('/cycles', 
  requireHRStaff,
  performanceController.createPerformanceCycle.bind(performanceController)
)

router.get('/cycles', 
  permissionMiddleware.requireAnyPermission(['performance.read', 'performance.manage']),
  performanceController.getPerformanceCycles.bind(performanceController)
)

router.get('/cycles/:id', 
  permissionMiddleware.requireAnyPermission(['performance.read', 'performance.manage']),
  performanceController.getPerformanceCycleById.bind(performanceController)
)

router.put('/cycles/:id', 
  requireHRStaff,
  performanceController.updatePerformanceCycle.bind(performanceController)
)

router.post('/cycles/:id/generate-goals', 
  requireHRStaff,
  performanceController.generateGoalsForCycle.bind(performanceController)
)

// Performance Goal Routes
router.post('/goals', 
  permissionMiddleware.requireAnyPermission(['performance.manage', 'team.manage']),
  performanceController.createPerformanceGoal.bind(performanceController)
)

router.get('/goals', 
  permissionMiddleware.requireAnyPermission(['performance.read', 'performance.manage']),
  performanceController.getPerformanceGoals.bind(performanceController)
)

router.get('/goals/:id', 
  permissionMiddleware.requireAnyPermission(['performance.read', 'performance.manage']),
  performanceController.getPerformanceGoalById.bind(performanceController)
)

router.put('/goals/:id', 
  permissionMiddleware.requireAnyPermission(['performance.manage', 'team.manage']),
  performanceController.updatePerformanceGoal.bind(performanceController)
)

// Performance Review Routes
router.post('/reviews', 
  permissionMiddleware.requireAnyPermission(['performance.manage', 'team.manage']),
  performanceController.createPerformanceReview.bind(performanceController)
)

router.get('/reviews', 
  permissionMiddleware.requireAnyPermission(['performance.read', 'performance.manage']),
  performanceController.getPerformanceReviews.bind(performanceController)
)

router.get('/reviews/:id', 
  permissionMiddleware.requireAnyPermission(['performance.read', 'performance.manage']),
  performanceController.getPerformanceReviewById.bind(performanceController)
)

router.put('/reviews/:id', 
  permissionMiddleware.requireAnyPermission(['performance.manage', 'team.manage']),
  performanceController.updatePerformanceReview.bind(performanceController)
)

// Employee-specific performance routes
router.get('/employees/:employeeId/goals', 
  permissionMiddleware.requireAnyPermission(['performance.read', 'performance.manage']),
  performanceController.getEmployeeGoals.bind(performanceController)
)

router.get('/employees/:employeeId/reviews', 
  permissionMiddleware.requireAnyPermission(['performance.read', 'performance.manage']),
  performanceController.getEmployeeReviews.bind(performanceController)
)

router.get('/employees/:employeeId/summary', 
  permissionMiddleware.requireAnyPermission(['performance.read', 'performance.manage']),
  performanceController.getEmployeePerformanceSummary.bind(performanceController)
)

// My performance routes (for authenticated user)
router.get('/my-goals', 
  performanceController.getMyGoals.bind(performanceController)
)

router.get('/my-reviews', 
  performanceController.getMyReviews.bind(performanceController)
)

router.get('/my-summary', 
  performanceController.getMyPerformanceSummary.bind(performanceController)
)

// Analytics and Reports
router.get('/analytics', 
  permissionMiddleware.requireAnyPermission(['reports.generate', 'performance.manage']),
  performanceController.getPerformanceAnalytics.bind(performanceController)
)

router.get('/reports/cycle/:cycleId', 
  permissionMiddleware.requireAnyPermission(['reports.generate', 'performance.manage']),
  performanceController.getCycleReport.bind(performanceController)
)

export default router