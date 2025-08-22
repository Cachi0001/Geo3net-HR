import { Request, Response } from 'express'
import { supabase } from '../config/database'
import { CloudinaryService } from '../services/cloudinary.service'
import { AuditService } from '../services/audit.service'
import bcrypt from 'bcryptjs'
import multer from 'multer'
import { AuthenticatedRequest } from '../middleware/auth'

// Create AuditService instance
const auditService = new AuditService()

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(null, false)
    }
  },
})

export class UserController {
  /**
   * Get current user profile
   */
  async getUserProfile(req: AuthenticatedRequest, res: Response) {
    try {
      console.log('🔍 getUserProfile - req.user:', req.user)
      const userId = req.user?.id
      console.log('🔍 getUserProfile - userId:', userId)
      
      if (!userId) {
        console.log('❌ getUserProfile - No userId found')
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        })
      }

      console.log('🔍 getUserProfile - Querying database for userId:', userId)
      const { data: user, error } = await supabase
        .from('users')
        .select('id, email, full_name, employee_id, department_id, position_id, manager_id, phone, hire_date, status, account_status, profile_picture, profile_data, created_at, updated_at')
        .eq('id', userId)
        .single()

      console.log('🔍 getUserProfile - Database result:', { user, error })
      
      if (error || !user) {
        console.log('❌ getUserProfile - User not found in database')
        return res.status(404).json({
          success: false,
          message: 'User not found'
        })
      }

      res.json({
        success: true,
        message: 'Profile retrieved successfully',
        data: user
      })
    } catch (error) {
      console.error('Get user profile error:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve user profile',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        })
      }

      const { full_name, email, phone, profile_data } = req.body

      // Check if email is being changed and if it's already taken
      if (email) {
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('email', email)
          .neq('id', userId)
          .single()

        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: 'Email is already in use by another user'
          })
        }
      }

      const updateData: any = {
        updated_at: new Date().toISOString()
      }
      if (full_name) updateData.full_name = full_name
      if (email) updateData.email = email
      if (phone) updateData.phone = phone
      if (profile_data) updateData.profile_data = profile_data

      const { data: updatedUser, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select('id, email, full_name, employee_id, department_id, position_id, manager_id, phone, hire_date, status, account_status, profile_picture, profile_data, created_at, updated_at')
        .single()

      if (error || !updatedUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found or update failed'
        })
      }

      // Log the profile update
      await auditService.createAuditLog({
        userId,
        action: 'profile_update',
        entityType: 'user_profile',
        entityId: userId,
        newValues: {
          updatedFields: Object.keys(updateData),
          timestamp: new Date()
        }
      })

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: updatedUser
      })
    } catch (error) {
      console.error('Update user profile error:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to update user profile',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * Upload profile picture
   */
  async uploadProfilePicture(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        })
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No image file provided'
        })
      }

      // Get current user to check for existing profile picture
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, profile_picture')
        .eq('id', userId)
        .single()

      if (userError || !user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        })
      }

      // Delete existing profile picture if it exists
      if (user.profile_picture) {
        try {
          // Extract public_id from Cloudinary URL
          const urlParts = user.profile_picture.split('/')
          const publicIdWithExtension = urlParts[urlParts.length - 1]
          const publicId = publicIdWithExtension.split('.')[0]
          await CloudinaryService.deleteImage(publicId)
        } catch (deleteError) {
          console.warn('Failed to delete existing profile picture:', deleteError)
        }
      }

      // Upload new profile picture
      const uploadResult = await CloudinaryService.uploadProfileImage(
        req.file.buffer,
        userId
      )

      // Update user with new profile picture
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          profile_picture: uploadResult.secure_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select('id, email, full_name, employee_id, department_id, position_id, manager_id, phone, hire_date, status, account_status, profile_picture, profile_data, created_at, updated_at')
        .single()

      if (updateError) {
        return res.status(500).json({
          success: false,
          message: 'Failed to update user profile picture'
        })
      }

      // Log the profile picture upload
      await auditService.createAuditLog({
        userId,
        action: 'profile_picture_upload',
        entityType: 'user_profile',
        entityId: userId,
        newValues: {
          imageUrl: uploadResult.secure_url,
          publicId: uploadResult.public_id,
          timestamp: new Date()
        }
      })

      res.json({
        success: true,
        message: 'Profile picture uploaded successfully',
        data: {
          profilePicture: updatedUser?.profile_picture,
          user: updatedUser
        }
      })
    } catch (error) {
      console.error('Upload profile picture error:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to upload profile picture',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * Delete profile picture
   */
  async deleteProfilePicture(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        })
      }

      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, profile_picture')
        .eq('id', userId)
        .single()

      if (userError || !user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        })
      }

      if (!user.profile_picture) {
        return res.status(400).json({
          success: false,
          message: 'No profile picture to delete'
        })
      }

      // Delete from Cloudinary
      try {
        // Extract public_id from Cloudinary URL
        const urlParts = user.profile_picture.split('/')
        const publicIdWithExtension = urlParts[urlParts.length - 1]
        const publicId = publicIdWithExtension.split('.')[0]
        await CloudinaryService.deleteImage(publicId)
      } catch (deleteError) {
        console.warn('Failed to delete from Cloudinary:', deleteError)
      }

      // Remove profile picture from user
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          profile_picture: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select('id, email, full_name, employee_id, department_id, position_id, manager_id, phone, hire_date, status, account_status, profile_picture, profile_data, created_at, updated_at')
        .single()

      if (updateError) {
        return res.status(500).json({
          success: false,
          message: 'Failed to update user profile'
        })
      }

      // Log the profile picture deletion
      await auditService.createAuditLog({
        userId,
        action: 'profile_picture_delete',
        entityType: 'user_profile',
        entityId: userId,
        oldValues: {
          deletedImageUrl: user.profile_picture,
          timestamp: new Date()
        }
      })

      res.json({
        success: true,
        message: 'Profile picture deleted successfully',
        data: updatedUser
      })
    } catch (error) {
      console.error('Delete profile picture error:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to delete profile picture',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * Change password (redirect to forgot password)
   */
  async changePassword(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        })
      }

      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, email')
        .eq('id', userId)
        .single()

      if (userError || !user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        })
      }

      // Instead of changing password directly, redirect to forgot password flow
      res.json({
        success: false,
        message: 'Password changes must be done through email reset. Please use the forgot password feature.',
        redirectToForgotPassword: true,
        userEmail: user.email
      })
    } catch (error) {
      console.error('Change password error:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to process password change request',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
}

export const uploadProfilePicture = upload.single('profilePicture')