import { Router } from 'express'
import { UserController, uploadProfilePicture } from '../controllers/user.controller'
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth'
import { permissionMiddleware } from '../middleware/permission'

const router = Router()
const userController = new UserController()

router.use(authenticateToken)

// Test endpoint to verify routing
router.get('/test', (req: AuthenticatedRequest, res) => {
  console.log('🔍 TEST ENDPOINT HIT - req.user:', req.user)
  res.json({ message: 'User routes working', user: req.user })
})

router.get('/profile', 
  userController.getUserProfile.bind(userController)
)

router.put('/profile', 
  userController.updateUserProfile.bind(userController)
)

router.post('/profile/picture', 
  uploadProfilePicture,
  userController.uploadProfilePicture.bind(userController)
)

router.put('/profile/picture', 
  uploadProfilePicture,
  userController.uploadProfilePicture.bind(userController)
)

router.delete('/profile/picture', 
  userController.deleteProfilePicture.bind(userController)
)

// Change password (redirects to forgot password flow)
router.post('/change-password', 
  userController.changePassword.bind(userController)
)

export { router as userRoutes }