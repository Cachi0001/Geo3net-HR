import { Router } from 'express'
import { DepartmentController } from '../controllers/department.controller'
import { authenticateToken } from '../middleware/auth'
import { requireHRAdmin } from '../middleware/permission'

const router = Router()
const departmentController = new DepartmentController()

// Apply authentication to all routes
router.use(authenticateToken)

// Get all departments
router.get('/', 
  departmentController.getDepartments.bind(departmentController)
)

// Get single department
router.get('/:id', 
  departmentController.getDepartment.bind(departmentController)
)

// Create department (admin only)
router.post('/', 
  requireHRAdmin,
  departmentController.createDepartment.bind(departmentController)
)

// Update department (admin only)
router.put('/:id', 
  requireHRAdmin,
  departmentController.updateDepartment.bind(departmentController)
)

// Delete department (admin only)
router.delete('/:id', 
  requireHRAdmin,
  departmentController.deleteDepartment.bind(departmentController)
)

// Get department employees
router.get('/:id/employees', 
  departmentController.getDepartmentEmployees.bind(departmentController)
)

export { router as departmentRoutes }