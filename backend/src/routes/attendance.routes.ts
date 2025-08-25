import { Router } from 'express'
import { attendanceController } from '../controllers/attendance.controller'
import { authenticateToken } from '../middleware/auth'
import { 
  canReadAttendance,
  canUpdateAttendance
} from '../middleware/permission'

const router = Router()

// Apply authentication to all routes
router.use(authenticateToken)

// Real-time attendance tracking
router.post('/check-in', 
  canUpdateAttendance,
  attendanceController.checkIn.bind(attendanceController)
)

router.post('/check-out', 
  canUpdateAttendance,
  attendanceController.checkOut.bind(attendanceController)
)

router.post('/break-start', 
  canUpdateAttendance,
  attendanceController.startBreak.bind(attendanceController)
)

router.post('/break-end', 
  canUpdateAttendance,
  attendanceController.endBreak.bind(attendanceController)
)

// Attendance data retrieval
router.get('/sessions', 
  canReadAttendance,
  attendanceController.getAttendanceSessions.bind(attendanceController)
)

router.get('/live-dashboard', 
  canReadAttendance,
  attendanceController.getLiveAttendanceDashboard.bind(attendanceController)
)

router.get('/violations', 
  canReadAttendance,
  attendanceController.getAttendanceViolations.bind(attendanceController)
)

router.post('/violations/:id/resolve', 
  canUpdateAttendance,
  attendanceController.resolveViolation.bind(attendanceController)
)

router.get('/status/:employeeId', 
  canReadAttendance,
  attendanceController.getCurrentStatus.bind(attendanceController)
)

router.get('/statistics', 
  canReadAttendance,
  attendanceController.getAttendanceStatistics.bind(attendanceController)
)

export { router as attendanceRoutes }