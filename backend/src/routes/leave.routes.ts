import { Router } from 'express'
import { LeaveController } from '../controllers/leave.controller'
import { authenticateToken } from '../middleware/auth'
import { 
  permissionMiddleware,
  requireHRStaff,
  requireManager,
  AuthenticatedRequest
} from '../middleware/permission'

const router = Router()
const leaveController = new LeaveController()

// Apply authentication to all routes
router.use(authenticateToken)

// Leave Type Routes
router.post('/types', 
  requireHRStaff,
  leaveController.createLeaveType.bind(leaveController)
)

router.get('/types', 
  leaveController.getLeaveTypes.bind(leaveController)
)

router.get('/types/:id', 
  leaveController.getLeaveTypeById.bind(leaveController)
)

router.put('/types/:id', 
  requireHRStaff,
  leaveController.updateLeaveType.bind(leaveController)
)

// Leave Policy Routes
router.post('/policies', 
  requireHRStaff,
  leaveController.createLeavePolicy.bind(leaveController)
)

router.get('/policies', 
  permissionMiddleware.requireAnyPermission(['leave.read', 'leave.manage']),
  leaveController.getLeavePolicies.bind(leaveController)
)

router.get('/policies/:id', 
  permissionMiddleware.requireAnyPermission(['leave.read', 'leave.manage']),
  leaveController.getLeavePolicyById.bind(leaveController)
)

router.put('/policies/:id', 
  requireHRStaff,
  leaveController.updateLeavePolicy.bind(leaveController)
)

// Leave Request Routes
router.post('/requests', 
  (req: AuthenticatedRequest, res, next) => {
    console.log('🔍 [LeaveRoutes] POST /requests route hit')
    console.log('🔍 [LeaveRoutes] Request body:', JSON.stringify(req.body))
    console.log('🔍 [LeaveRoutes] Request headers:', JSON.stringify(req.headers))
    console.log('🔍 [LeaveRoutes] User from auth:', req.user)
    next()
  },
  async (req: AuthenticatedRequest, res, next) => {
    try {
      console.log('🔍 [LeaveRoutes] About to call controller method')
      await leaveController.createLeaveRequest(req, res)
    } catch (error) {
      console.log('🔍 [LeaveRoutes] Error in controller call:', error)
      next(error)
    }
  }
)

router.get('/requests', 
  permissionMiddleware.requireAnyPermission(['leave.read', 'leave.manage', 'team.manage']),
  leaveController.getLeaveRequests.bind(leaveController)
)

router.get('/requests/:id', 
  permissionMiddleware.requireAnyPermission(['leave.read', 'leave.manage', 'team.manage']),
  leaveController.getLeaveRequestById.bind(leaveController)
)

router.put('/requests/:id', 
  permissionMiddleware.requireAnyPermission(['leave.manage', 'team.manage']),
  leaveController.updateLeaveRequest.bind(leaveController)
)

router.post('/requests/:id/approve', 
  permissionMiddleware.requireAnyPermission(['leave.manage', 'team.manage']),
  leaveController.approveLeaveRequest.bind(leaveController)
)

router.post('/requests/:id/reject', 
  permissionMiddleware.requireAnyPermission(['leave.manage', 'team.manage']),
  leaveController.denyLeaveRequest.bind(leaveController)
)

router.post('/requests/:id/cancel', 
  leaveController.cancelLeaveRequest.bind(leaveController)
)

router.get('/balances/:employeeId', 
  permissionMiddleware.requireAnyPermission(['leave.read', 'leave.manage']),
  leaveController.getLeaveBalances.bind(leaveController)
)

router.post('/balances/:employeeId/initialize', 
  requireHRStaff,
  leaveController.initializeLeaveBalances.bind(leaveController)
)

router.put('/balances/:id', 
  requireHRStaff,
  leaveController.updateLeaveBalance.bind(leaveController)
)

router.get('/my-requests', 
  leaveController.getMyLeaveRequests.bind(leaveController)
)

router.get('/my-balances', 
  leaveController.getMyLeaveBalances.bind(leaveController)
)

// Analytics and Reports
router.get('/analytics', 
  permissionMiddleware.requireAnyPermission(['reports.generate', 'leave.manage']),
  leaveController.getLeaveAnalytics.bind(leaveController)
)

// Accrual Processing
router.post('/accruals/process', 
  requireHRStaff,
  leaveController.processAccruals.bind(leaveController)
)

// Leave Request Validation
router.post('/validate', 
  leaveController.validateLeaveRequest.bind(leaveController)
)

export default router