import { Router } from 'express'
import { EmployeeController } from '../controllers/employee.controller'
import { authenticateToken } from '../middleware/auth'
import { 
  permissionMiddleware,
  canReadEmployees,
  canCreateEmployees,
  canUpdateEmployees,
  canDeleteEmployees,
  requireHRStaff,
  requireManager
} from '../middleware/permission'

const router = Router()
const employeeController = new EmployeeController()

router.use(authenticateToken)
router.post('/', 
  canCreateEmployees,
  employeeController.createEmployee.bind(employeeController)
)

router.get('/', 
  permissionMiddleware.requireAnyPermission(['employee.read', 'profile.read']),
  employeeController.getEmployees.bind(employeeController)
)

router.get('/statistics',
  permissionMiddleware.requireAnyPermission(['reports.generate', 'employee.read']),
  employeeController.getEmployeeStatistics.bind(employeeController)
)

router.get('/org-structure',
  permissionMiddleware.requireAnyPermission(['employee.read', 'profile.read']),
  employeeController.getOrganizationalStructure.bind(employeeController)
)

router.get('/manager/:managerId',
  permissionMiddleware.requireAnyPermission(['team.manage', 'employee.read']),
  employeeController.getEmployeesByManager.bind(employeeController)
)

router.get('/department/:departmentId',
  permissionMiddleware.requireAnyPermission(['employee.read', 'profile.read']),
  employeeController.getEmployeesByDepartment.bind(employeeController)
)

router.get('/employee-id/:employeeId',
  permissionMiddleware.requireAnyPermission(['employee.read', 'profile.read']),
  employeeController.getEmployeeByEmployeeId.bind(employeeController)
)

router.get('/:id',
  permissionMiddleware.requireResourcePermission({
    resource: 'employee',
    action: 'read',
    allowSelf: true
  }),
  employeeController.getEmployeeById.bind(employeeController)
)

router.put('/:id',
  permissionMiddleware.requireResourcePermission({
    resource: 'employee',
    action: 'update',
    allowSelf: true
  }),
  employeeController.updateEmployee.bind(employeeController)
)

router.delete('/:id',
  canDeleteEmployees,
  employeeController.deleteEmployee.bind(employeeController)
)


router.post('/:id/invite',
  requireHRStaff,
  employeeController.sendInvitation.bind(employeeController)
)

router.post('/:id/send-invitation',
  requireHRStaff,
  employeeController.sendInvitation.bind(employeeController)
)

router.post('/:id/activate-account',
  requireHRStaff,
  employeeController.activateAccount.bind(employeeController)
)

router.post('/:id/link-user',
  requireHRStaff,
  employeeController.linkUserToEmployee.bind(employeeController)
)

export { router as employeeRoutes }