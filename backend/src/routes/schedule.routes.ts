import { Router } from 'express'
import { ScheduleController } from '../controllers/schedule.controller'
import { authenticateToken } from '../middleware/auth'
import { 
  permissionMiddleware,
  requireHRStaff,
  requireManager
} from '../middleware/permission'

const router = Router()
const scheduleController = new ScheduleController()

// Apply authentication to all routes
router.use(authenticateToken)

// Employee Schedule Routes
router.post('/employee-schedules', 
  permissionMiddleware.requireAnyPermission(['schedule.manage', 'team.manage']),
  scheduleController.createEmployeeSchedule.bind(scheduleController)
)

router.get('/employee-schedules', 
  permissionMiddleware.requireAnyPermission(['schedule.read', 'schedule.manage', 'team.manage']),
  scheduleController.getEmployeeSchedules.bind(scheduleController)
)

router.get('/employee-schedules/:id', 
  permissionMiddleware.requireAnyPermission(['schedule.read', 'schedule.manage', 'team.manage']),
  scheduleController.getEmployeeScheduleById.bind(scheduleController)
)

router.put('/employee-schedules/:id', 
  permissionMiddleware.requireAnyPermission(['schedule.manage', 'team.manage']),
  scheduleController.updateEmployeeSchedule.bind(scheduleController)
)

router.delete('/employee-schedules/:id', 
  permissionMiddleware.requireAnyPermission(['schedule.manage', 'team.manage']),
  scheduleController.deleteEmployeeSchedule.bind(scheduleController)
)

// Get schedules for specific employee
router.get('/employees/:employeeId/schedules', 
  permissionMiddleware.requireAnyPermission(['schedule.read', 'schedule.manage', 'team.manage']),
  scheduleController.getSchedulesByEmployee.bind(scheduleController)
)

// Get schedules for specific date range
router.get('/employee-schedules/date-range', 
  permissionMiddleware.requireAnyPermission(['schedule.read', 'schedule.manage', 'team.manage']),
  scheduleController.getSchedulesByDateRange.bind(scheduleController)
)

// Meeting Routes
router.post('/meetings', 
  permissionMiddleware.requireAnyPermission(['schedule.manage', 'team.manage']),
  scheduleController.createMeeting.bind(scheduleController)
)

router.get('/meetings', 
  permissionMiddleware.requireAnyPermission(['schedule.read', 'schedule.manage', 'team.manage']),
  scheduleController.getMeetings.bind(scheduleController)
)

router.get('/meetings/:id', 
  permissionMiddleware.requireAnyPermission(['schedule.read', 'schedule.manage', 'team.manage']),
  scheduleController.getMeetingById.bind(scheduleController)
)

router.put('/meetings/:id', 
  permissionMiddleware.requireAnyPermission(['schedule.manage', 'team.manage']),
  scheduleController.updateMeeting.bind(scheduleController)
)

router.delete('/meetings/:id', 
  permissionMiddleware.requireAnyPermission(['schedule.manage', 'team.manage']),
  scheduleController.deleteMeeting.bind(scheduleController)
)

// Get meetings for specific employee
router.get('/employees/:employeeId/meetings', 
  permissionMiddleware.requireAnyPermission(['schedule.read', 'schedule.manage', 'team.manage']),
  scheduleController.getMeetingsByEmployee.bind(scheduleController)
)

// Get meetings for specific date range
router.get('/meetings/date-range', 
  permissionMiddleware.requireAnyPermission(['schedule.read', 'schedule.manage', 'team.manage']),
  scheduleController.getMeetingsByDateRange.bind(scheduleController)
)

// My Schedule Routes (for authenticated user)
router.get('/my-schedule', 
  scheduleController.getMySchedule.bind(scheduleController)
)

router.get('/my-meetings', 
  scheduleController.getMyMeetings.bind(scheduleController)
)

// Today's schedule for dashboard
router.get('/today', 
  scheduleController.getTodaySchedule.bind(scheduleController)
)

// Calendar view routes
router.get('/calendar/:year/:month', 
  permissionMiddleware.requireAnyPermission(['schedule.read', 'schedule.manage', 'team.manage']),
  scheduleController.getCalendarView.bind(scheduleController)
)

// Conflict checking
router.post('/check-conflicts', 
  permissionMiddleware.requireAnyPermission(['schedule.manage', 'team.manage']),
  scheduleController.checkScheduleConflicts.bind(scheduleController)
)

export default router