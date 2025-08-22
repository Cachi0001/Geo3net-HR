import { Router } from 'express';
import { AttendancePolicyController } from '../controllers/attendancePolicy.controller';
import { authenticateToken } from '../middleware/auth';
import { permissionMiddleware } from '../middleware/permission';

const router = Router();
const attendancePolicyController = new AttendancePolicyController();

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * Attendance Policy Management Routes
 * Access: Super Admin only
 */

// Get all attendance policies
router.get('/',
  permissionMiddleware.requireMinimumRole('super-admin'),
  attendancePolicyController.getAttendancePolicies.bind(attendancePolicyController)
);

// Get default attendance policy
router.get('/default',
  permissionMiddleware.requireMinimumRole('manager'),
  attendancePolicyController.getDefaultPolicy.bind(attendancePolicyController)
);

// Get attendance policy by ID
router.get('/:id',
  permissionMiddleware.requireMinimumRole('super-admin'),
  attendancePolicyController.getAttendancePolicyById.bind(attendancePolicyController)
);

// Create new attendance policy
router.post('/',
  permissionMiddleware.requireMinimumRole('super-admin'),
  attendancePolicyController.createAttendancePolicy.bind(attendancePolicyController)
);

// Update attendance policy
router.put('/:id',
  permissionMiddleware.requireMinimumRole('super-admin'),
  attendancePolicyController.updateAttendancePolicy.bind(attendancePolicyController)
);

// Set default attendance policy
router.post('/:id/set-default',
  permissionMiddleware.requireMinimumRole('super-admin'),
  attendancePolicyController.setDefaultPolicy.bind(attendancePolicyController)
);

// Delete attendance policy
router.delete('/:id',
  permissionMiddleware.requireMinimumRole('super-admin'),
  attendancePolicyController.deleteAttendancePolicy.bind(attendancePolicyController)
);

export default router;