import { Router } from 'express'
import { employeeController } from '../controllers/employee.controller'
import { authenticateToken } from '../middleware/auth'
import { 
  permissionMiddleware,
  canReadEmployees,
  canCreateEmployees,
  canUpdateEmployees,
  canDeleteEmployees
} from '../middleware/permission'

const router = Router()

// Apply authentication to all routes
router.use(authenticateToken)

// Employee CRUD operations
router.post('/', 
  canCreateEmployees,
  employeeController.createEmployee.bind(employeeController)
)

router.get('/', 
  canReadEmployees,
  employeeController.searchEmployees.bind(employeeController)
)

router.get('/statistics',
  canReadEmployees,
  employeeController.getEmployeeStatistics.bind(employeeController)
)

router.get('/:id', 
  canReadEmployees,
  employeeController.getEmployee.bind(employeeController)
)

router.put('/:id', 
  canUpdateEmployees,
  employeeController.updateEmployee.bind(employeeController)
)

router.delete('/:id', 
  canDeleteEmployees,
  employeeController.deleteEmployee.bind(employeeController)
)

router.post('/:id/restore', 
  canCreateEmployees,
  employeeController.restoreEmployee.bind(employeeController)
)

// Employee hierarchy management
router.get('/:id/hierarchy', 
  canReadEmployees,
  employeeController.getEmployeeHierarchy.bind(employeeController)
)

router.put('/:id/manager', 
  canUpdateEmployees,
  employeeController.updateEmployeeManager.bind(employeeController)
)

router.get('/:id/subordinates', 
  canReadEmployees,
  employeeController.getEmployeeSubordinates.bind(employeeController)
)

// Employee audit and history
router.get('/:id/audit-logs', 
  canReadEmployees,
  employeeController.getEmployeeAuditLogs.bind(employeeController)
)

// Enhanced employee operations
router.put('/bulk-update', 
  canUpdateEmployees,
  employeeController.bulkUpdateEmployees.bind(employeeController)
)

router.get('/comprehensive-statistics',
  canReadEmployees,
  employeeController.getComprehensiveStatistics.bind(employeeController)
)

router.get('/by-skills',
  canReadEmployees,
  employeeController.getEmployeesBySkills.bind(employeeController)
)

router.get('/:id/performance-summary',
  canReadEmployees,
  employeeController.getEmployeePerformanceSummary.bind(employeeController)
)

// Skills management
router.get('/:id/skills',
  canReadEmployees,
  employeeController.getEmployeeSkills.bind(employeeController)
)

router.post('/:id/skills',
  canUpdateEmployees,
  employeeController.addEmployeeSkill.bind(employeeController)
)

router.delete('/:id/skills/:skill',
  canUpdateEmployees,
  employeeController.removeEmployeeSkill.bind(employeeController)
)

// Certifications management
router.get('/:id/certifications',
  canReadEmployees,
  employeeController.getEmployeeCertifications.bind(employeeController)
)

router.post('/:id/certifications',
  canUpdateEmployees,
  employeeController.addEmployeeCertification.bind(employeeController)
)

router.delete('/:id/certifications/:certificationName',
  canUpdateEmployees,
  employeeController.removeEmployeeCertification.bind(employeeController)
)

export { router as employeeRoutes }