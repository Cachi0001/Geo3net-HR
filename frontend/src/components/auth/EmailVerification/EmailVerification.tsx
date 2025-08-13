import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Card, Button, LoadingSpinner } from '../../common'
import { authService } from '../../../services/auth.service'
import { useToast } from '../../../hooks/useToast'
import './EmailVerification.css'

const EmailVerification: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [verifying, setVerifying] = useState(false)
  const [verified, setVerified] = useState(false)
  const [error, setError] = useState('')
  const [resending, setResending] = useState(false)

  const token = searchParams.get('token')

  useEffect(() => {
    if (token) {
      verifyEmail(token)
    } else {
      setError('Invalid verification link. Please check your email for the correct link.')
    }
  }, [token])

  const verifyEmail = async (verificationToken: string) => {
    try {
      setVerifying(true)
      setError('')

      await authService.verifyEmail(verificationToken)

      setVerified(true)
      showToast('success', 'Email verified successfully! You can now log in to your account.')
    } catch (error: any) {
      const errorMessage = error.message || 'Email verification failed'
      setError(errorMessage)
      showToast(errorMessage, 'error')
    } finally {
      setVerifying(false)
    }
  }

  const resendVerification = async () => {
    try {
      setResending(true)
      await authService.resendVerificationEmail()
      showToast('success', 'Verification email sent! Please check your inbox.')
    } catch (error: any) {
      showToast(error.message || 'Failed to resend verification email', 'error')
    } finally {
      setResending(false)
    }
  }

  const goToLogin = () => {
    navigate('/login')
  }

  if (verifying) {
    return (
      <div className="email-verification-page">
        <Card className="verification-card" padding="lg">
          <div className="verification-content">
            <div className="verification-loading">
              <LoadingSpinner size="lg" />
              <h1>Verifying Your Email</h1>
              <p>Please wait while we verify your email address...</p>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  if (verified) {
    return (
      <div className="email-verification-page">
        <Card className="verification-card" padding="lg">
          <div className="verification-content">
            <div className="verification-success">
              <div className="success-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                  <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              <h1>Email Verified Successfully!</h1>
              <p>
                Your email address has been verified. You can now log in to your account
                and start using the HR Management System.
              </p>

              <div className="verification-actions">
                <Button variant="primary" size="lg" onClick={goToLogin} fullWidth>
                  Continue to Login
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="email-verification-page">
      <Card className="verification-card" padding="lg">
        <div className="verification-content">
          <div className="verification-error">
            <div className="error-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>

            <h1>Email Verification Failed</h1>
            <p className="error-message">{error}</p>

            <div className="verification-help">
              <h3>What can you do?</h3>
              <ul>
                <li>Check if the verification link has expired</li>
                <li>Make sure you clicked the complete link from your email</li>
                <li>Request a new verification email</li>
                <li>Contact support if the problem persists</li>
              </ul>
            </div>

            <div className="verification-actions">
              <Button
                variant="primary"
                onClick={resendVerification}
                loading={resending}
                disabled={resending}
              >
                Resend Verification Email
              </Button>
              <Button variant="outline" onClick={goToLogin}>
                Back to Login
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default EmailVerification