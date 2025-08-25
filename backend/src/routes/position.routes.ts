import { Router } from 'express'
import { positionController } from '../controllers/position.controller'
import { authenticateToken } from '../middleware/auth'

const router = Router()

// Apply authentication middleware to all routes
router.use(authenticateToken)

// Get all positions
router.get('/', positionController.getPositions)

export default router