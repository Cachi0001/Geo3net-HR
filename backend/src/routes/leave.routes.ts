import { Router } from 'express'
import { LeaveController } from '../controllers/leave.controller'
import { authenticateToken } from '../middleware/auth'
import { 
  permissionMiddleware,
  requireHRStaff,
  requireManager
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

// Leave Request Routes
router.post('/requests', 
  leaveController.createLeaveRequest.bind(leaveController)
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

// Leave Request Actions
router.post('/requests/:id/approve', 
  permissionMiddleware.requireAnyPermission(['leave.manage', 'team.manage']),
  leaveController.approveLeaveRequest.bind(leaveController)
)

router.post('/requests/:id/reject', 
  permissionMiddleware.requireAnyPermission(['leave.manage', 'team.manage']),
  leaveController.rejectLeaveRequest.bind(leaveController)
)

router.post('/requests/:id/cancel', 
  leaveController.cancelLeaveRequest.bind(leaveController)
)

// Leave Balance Routes
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

// My Leave Routes (for authenticated user)
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

export default router