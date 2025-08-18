import { Router } from 'express'
import { PayrollController } from '../controllers/payroll.controller'
import { authenticateToken } from '../middleware/auth'
import { 
  permissionMiddleware,
  requireHRStaff,
  requireManager
} from '../middleware/permission'

const router = Router()
const payrollController = new PayrollController()

// Apply authentication to all routes
router.use(authenticateToken)

// Payroll Period Routes
router.post('/periods', 
  requireHRStaff,
  payrollController.createPayrollPeriod.bind(payrollController)
)

router.get('/periods', 
  permissionMiddleware.requireAnyPermission(['payroll.read', 'payroll.manage']),
  payrollController.getPayrollPeriods.bind(payrollController)
)

router.get('/periods/:id', 
  permissionMiddleware.requireAnyPermission(['payroll.read', 'payroll.manage']),
  payrollController.getPayrollPeriodById.bind(payrollController)
)

router.put('/periods/:id/status', 
  requireHRStaff,
  payrollController.updatePayrollPeriodStatus.bind(payrollController)
)

router.post('/periods/:id/generate', 
  requireHRStaff,
  payrollController.generatePayrollForPeriod.bind(payrollController)
)

// Payroll Record Routes
router.post('/records', 
  requireHRStaff,
  payrollController.createPayrollRecord.bind(payrollController)
)

router.get('/records', 
  permissionMiddleware.requireAnyPermission(['payroll.read', 'payroll.manage']),
  payrollController.getPayrollRecords.bind(payrollController)
)

router.get('/records/:id', 
  permissionMiddleware.requireAnyPermission(['payroll.read', 'payroll.manage']),
  payrollController.getPayrollRecordById.bind(payrollController)
)

router.put('/records/:id', 
  requireHRStaff,
  payrollController.updatePayrollRecord.bind(payrollController)
)

router.delete('/records/:id', 
  requireHRStaff,
  payrollController.deletePayrollRecord.bind(payrollController)
)

// Employee-specific payroll routes
router.get('/employees/:employeeId/records', 
  permissionMiddleware.requireAnyPermission(['payroll.read', 'payroll.manage']),
  payrollController.getEmployeePayrollRecords.bind(payrollController)
)

router.get('/employees/:employeeId/summary', 
  permissionMiddleware.requireAnyPermission(['payroll.read', 'payroll.manage']),
  payrollController.getEmployeePayrollSummary.bind(payrollController)
)

// Reports
router.get('/reports/summary', 
  permissionMiddleware.requireAnyPermission(['reports.generate', 'payroll.manage']),
  payrollController.getPayrollSummaryReport.bind(payrollController)
)

export default router