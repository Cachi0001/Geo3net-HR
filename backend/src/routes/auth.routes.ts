import { Router } from 'express'
import { 
  register, 
  login, 
  googleAuth, 
  forgotPassword, 
  resetPassword, 
  verifyEmail, 
  resendVerification,
  refreshToken,
  debugAuth,
  healthCheck,
  me
} from '../controllers/auth.controller'
import { authenticateToken } from '../middleware/auth'

const router = Router()

router.post('/register', register)
router.post('/login', login)
router.get('/me', authenticateToken, me)
router.post('/refresh', refreshToken)
router.post('/google', googleAuth)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password', resetPassword)
router.get('/verify-email/:token', verifyEmail)
router.post('/resend-verification', resendVerification)

// Health check endpoint (always available)
router.get('/health', healthCheck)

// Debug endpoint (development only)
if (process.env.NODE_ENV === 'development') {
  router.get('/debug', debugAuth)
}

export default router