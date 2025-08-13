import React, { useState } from 'react'
import { Button, Input, Card } from '../../common'
import { useAuth } from '../../../hooks/useAuth'
import { useToast } from '../../../hooks/useToast'
import { usePasswordResetRateLimit } from '../../../hooks/usePasswordResetRateLimit'
import './ForgotPasswordForm.css'

export interface ForgotPasswordFormProps {
  onSuccess?: () => void
  onBackToLogin?: () => void
}

const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  onSuccess,
  onBackToLogin,
}) => {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  
  const { forgotPassword } = useAuth()
  const { showToast } = useToast()
  const { 
    isLimited, 
    remainingAttempts, 
    remainingTime, 
    recordAttempt,
    maxAttempts 
  } = usePasswordResetRateLimit()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
    
    if (error) {
      setError('')
    }
  }

  const validateEmail = () => {
    if (!email) {
      setError('Email is required')
      return false
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address')
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateEmail()) {
      return
    }

    if (isLimited) {
      showToast('error', `Too many attempts. Please try again in ${remainingTime}.`)
      return
    }

    setIsLoading(true)
    
    try {
      await forgotPassword(email)
      recordAttempt() // Record successful attempt
      setIsSubmitted(true)
      showToast('success', 'Password reset email sent successfully!')
      onSuccess?.()
    } catch (error: any) {
      recordAttempt() // Record failed attempt
      
      if (error.message?.includes('Too many password reset attempts')) {
        showToast('error', error.message)
      } else {
        showToast('error', error.message || 'Failed to send reset email. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <Card className="forgot-password-form-card" padding="lg">
        <div className="forgot-password-success">
          <div className="forgot-password-success-icon">
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
          
          <h1 className="forgot-password-success-title">Check Your Email</h1>
          
          <p className="forgot-password-success-message">
            We've sent a password reset link to <strong>{email}</strong>. 
            Please check your email and follow the instructions to reset your password.
          </p>
          
          <div className="forgot-password-success-actions">
            <Button
              type="button"
              variant="primary"
              size="lg"
              fullWidth
              onClick={onBackToLogin}
            >
              Back to Sign In
            </Button>
            
            <button
              type="button"
              className="forgot-password-resend-link"
              onClick={() => setIsSubmitted(false)}
            >
              Didn't receive the email? Try again
            </button>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="forgot-password-form-card" padding="lg">
      <div className="forgot-password-form-header">
        <h1 className="forgot-password-form-title">Reset Password</h1>
        <p className="forgot-password-form-subtitle">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      {/* Rate Limit Warning */}
      {(remainingAttempts < maxAttempts && remainingAttempts > 0) && (
        <div className="forgot-password-rate-limit-warning">
          <div style={{ 
            backgroundColor: '#fff3cd', 
            border: '1px solid #ffeaa7', 
            borderRadius: '8px', 
            padding: '12px 16px', 
            marginBottom: '20px',
            color: '#856404'
          }}>
            <strong>⚠️ Rate Limit Notice:</strong> You have {remainingAttempts} password reset attempt{remainingAttempts !== 1 ? 's' : ''} remaining in the next 24 hours.
          </div>
        </div>
      )}

      {isLimited && (
        <div className="forgot-password-rate-limit-error">
          <div style={{ 
            backgroundColor: '#f8d7da', 
            border: '1px solid #f5c6cb', 
            borderRadius: '8px', 
            padding: '16px', 
            marginBottom: '20px',
            color: '#721c24'
          }}>
            <strong>🚫 Rate Limit Exceeded</strong><br />
            You've reached the maximum number of password reset attempts (5) in 24 hours.<br />
            Please try again in <strong>{remainingTime}</strong>.
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="forgot-password-form">
        <div className="forgot-password-form-fields">
          <Input
            label="Email Address"
            type="email"
            name="email"
            value={email}
            onChange={handleInputChange}
            error={error}
            placeholder="Enter your email"
            fullWidth
            required
            disabled={isLoading}
            autoFocus
          />
        </div>

        <div className="forgot-password-form-actions">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={isLoading}
            disabled={isLoading || !email || isLimited}
          >
            Send Reset Link
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

export default ForgotPasswordForm