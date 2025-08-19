import { Router } from 'express'
import { RecruitmentController } from '../controllers/recruitment.controller'
import { authenticateToken } from '../middleware/auth'
import { 
  permissionMiddleware,
  requireHRStaff,
  requireManager
} from '../middleware/permission'

const router = Router()
const recruitmentController = new RecruitmentController()

// Job Posting Routes (Public and Authenticated)

// Public routes (no authentication required)
router.get('/jobs/active', 
  recruitmentController.getActiveJobPostings.bind(recruitmentController)
)

router.get('/jobs/:id/public', 
  recruitmentController.getJobPostingById.bind(recruitmentController)
)

router.post('/applications', 
  recruitmentController.createJobApplication.bind(recruitmentController)
)

router.use(authenticateToken)

router.post('/jobs', 
  requireHRStaff,
  recruitmentController.createJobPosting.bind(recruitmentController)
)

router.get('/jobs', 
  permissionMiddleware.requireAnyPermission(['recruitment.read', 'recruitment.manage']),
  recruitmentController.getJobPostings.bind(recruitmentController)
)

router.get('/jobs/:id', 
  permissionMiddleware.requireAnyPermission(['recruitment.read', 'recruitment.manage']),
  recruitmentController.getJobPostingById.bind(recruitmentController)
)

router.put('/jobs/:id', 
  requireHRStaff,
  recruitmentController.updateJobPosting.bind(recruitmentController)
)

router.delete('/jobs/:id', 
  requireHRStaff,
  recruitmentController.deleteJobPosting.bind(recruitmentController)
)

router.get('/applications', 
  permissionMiddleware.requireAnyPermission(['recruitment.read', 'recruitment.manage']),
  recruitmentController.getJobApplications.bind(recruitmentController)
)

router.get('/applications/:id', 
  permissionMiddleware.requireAnyPermission(['recruitment.read', 'recruitment.manage']),
  recruitmentController.getJobApplicationById.bind(recruitmentController)
)

router.put('/applications/:id', 
  permissionMiddleware.requireAnyPermission(['recruitment.manage', 'team.manage']),
  recruitmentController.updateJobApplication.bind(recruitmentController)
)

router.delete('/applications/:id', 
  requireHRStaff,
  recruitmentController.deleteJobApplication.bind(recruitmentController)
)

router.get('/jobs/:jobId/applications', 
  permissionMiddleware.requireAnyPermission(['recruitment.read', 'recruitment.manage']),
  recruitmentController.getJobApplicationsByJobId.bind(recruitmentController)
)

router.get('/analytics', 
  permissionMiddleware.requireAnyPermission(['reports.generate', 'recruitment.manage']),
  recruitmentController.getRecruitmentAnalytics.bind(recruitmentController)
)

export default router