import React, { useState } from 'react'
import { Button, Input, Card } from '../../common'
import { useAuth } from '../../../hooks/useAuth'
import { useToast } from '../../../hooks/useToast'
import './ResetPasswordForm.css'

export interface ResetPasswordFormProps {
  token: string
  onSuccess?: () => void
  onBackToLogin?: () => void
}

interface FormData {
  password: string
  confirmPassword: string
}

const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({
  token,
  onSuccess,
  onBackToLogin,
}) => {
  const [formData, setFormData] = useState<FormData>({
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  
  const { resetPassword } = useAuth()
  const { showToast } = useToast()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    
    try {
      await resetPassword(token, formData.password)
      setIsSubmitted(true)
      showToast('success', 'Password reset successfully!')
      onSuccess?.()
    } catch (error: any) {
      showToast('error', error.message || 'Failed to reset password. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <Card className="reset-password-form-card" padding="lg">
        <div className="reset-password-success">
          <div className="reset-password-success-icon">
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
              />
              <path
                d="M9 12l2 2 4-4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          
          <h1 className="reset-password-success-title">Password Reset Complete</h1>
          
          <p className="reset-password-success-message">
            Your password has been successfully reset. You can now sign in with your new password.
          </p>
          
          <div className="reset-password-success-actions">
            <Button
              type="button"
              variant="primary"
              size="lg"
              fullWidth
              onClick={onBackToLogin}
            >
              Sign In
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="reset-password-form-card" padding="lg">
      <div className="reset-password-form-header">
        <h1 className="reset-password-form-title">Set New Password</h1>
        <p className="reset-password-form-subtitle">
          Please enter your new password below.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="reset-password-form">
        <div className="reset-password-form-fields">
          <Input
            label="New Password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            error={errors.password}
            placeholder="Enter your new password"
            helperText="Must be at least 8 characters with uppercase, lowercase, and number"
            fullWidth
            required
            disabled={isLoading}
            autoFocus
          />

          <Input
            label="Confirm New Password"
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            error={errors.confirmPassword}
            placeholder="Confirm your new password"
            fullWidth
            required
            disabled={isLoading}
          />
        </div>

        <div className="reset-password-form-actions">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={isLoading}
            disabled={isLoading}
          >
            Reset Password
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="md"
            fullWidth
            onClick={onBackToLogin}
            disabled={isLoading}
          >
            Back to Sign In
          </Button>
        </div>
      </form>
    </Card>
  )
}

export default ResetPasswordForm