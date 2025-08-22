import { Router } from 'express';
import { TaskController } from '../controllers/task.controller';
import { authenticateToken } from '../middleware/auth';
import { permissionMiddleware } from '../middleware/permission';

const router = Router();
const taskController = new TaskController();

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * Task Management Routes
 * Access: All authenticated users can view/manage their tasks
 * Managers and above can create/assign tasks to others
 */

// Get task statistics for current user
router.get('/stats',
  taskController.getTaskStats.bind(taskController)
);

// Get tasks assigned to current user
router.get('/my-tasks',
  taskController.getMyTasks.bind(taskController)
);

// Get all tasks (with filtering) - Managers and above
router.get('/',
  permissionMiddleware.requireMinimumRole('manager'),
  taskController.getTasks.bind(taskController)
);

// Get task by ID
router.get('/:id',
  taskController.getTaskById.bind(taskController)
);

// Get task comments
router.get('/:id/comments',
  taskController.getTaskComments.bind(taskController)
);

// Add comment to task
router.post('/:id/comments',
  taskController.addTaskComment.bind(taskController)
);

// Create new task - Managers and above
router.post('/',
  permissionMiddleware.requireMinimumRole('manager'),
  taskController.createTask.bind(taskController)
);

// Update task - Task assignee or Managers and above
router.put('/:id',
  taskController.updateTask.bind(taskController)
);

// Delete task - HR Admin and above
router.delete('/:id',
  permissionMiddleware.requireMinimumRole('hr-admin'),
  taskController.deleteTask.bind(taskController)
);

export default router;