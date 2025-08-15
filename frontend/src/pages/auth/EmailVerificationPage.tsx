import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Card, Button, LoadingSpinner } from '../../components/common'
import { authService } from '../../services/auth.service'
import { useToast } from '../../hooks/useToast'
import { useAuth } from '../../hooks/useAuth'
import './AuthPage.css'

const EmailVerificationPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { login } = useAuth()

  const [verifying, setVerifying] = useState(false)
  const [verified, setVerified] = useState(false)
  const [error, setError] = useState('')
  const [resending, setResending] = useState(false)
  const [userEmail, setUserEmail] = useState('')

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

      // Redirect to login page after 3 seconds
      setTimeout(() => {
        navigate('/login', {
          state: {
            message: 'Your email has been verified. Please log in to continue.',
            verified: true
          }
        })
      }, 3000)
    } catch (error: any) {
      const errorMessage = error.message || 'Email verification failed'
      setError(errorMessage)
      showToast('error', errorMessage)
    } finally {
      setVerifying(false)
    }
  }

  const resendVerification = async () => {
    if (!userEmail) {
      setError('Please enter your email address to resend verification')
      return
    }

    try {
      setResending(true)
      await authService.resendVerificationEmail(userEmail)
      showToast('success', 'Verification email sent! Please check your inbox.')
    } catch (error: any) {
      showToast('error', error.message || 'Failed to resend verification email')
    } finally {
      setResending(false)
    }
  }

  const goToLogin = () => {
    navigate('/login', {
      state: {
        message: 'Your email has been verified. Please log in to continue.',
        verified: true
      }
    })
  }

  const goToLoginFromError = () => {
    navigate('/login')
  }

  if (verifying) {
    return (
      <div className="auth-page">
        <div className="auth-page__container">
          <Card className="auth-page__card" padding="lg">
            <div className="auth-page__content">
              <div className="auth-page__loading">
                <LoadingSpinner size="lg" />
                <h1>Verifying Your Email</h1>
                <p>Please wait while we verify your email address...</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  if (verified) {
    return (
      <div className="auth-page">
        <div className="auth-page__container">
          <Card className="auth-page__card" padding="lg">
            <div className="auth-page__content">
              <div className="auth-page__success">
                <div className="auth-page__success-icon">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                    <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>

                <h1>Email Verified Successfully!</h1>
                <p>
                  Your email address has been verified. You will be redirected to the login page shortly to access your account.
                </p>

                <div className="auth-page__actions">
                  <Button variant="primary" size="lg" onClick={goToLogin} fullWidth>
                    Continue to Login
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-page__container">
        <Card className="auth-page__card" padding="lg">
          <div className="auth-page__content">
            <div className="auth-page__error">
              <div className="auth-page__error-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                  <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>

              <h1>Email Verification Failed</h1>
              <p className="auth-page__error-message">{error}</p>

              <div className="auth-page__help">
                <h3>What can you do?</h3>
                <ul>
                  <li>Check if the verification link has expired</li>
                  <li>Make sure you clicked the complete link from your email</li>
                  <li>Request a new verification email</li>
                  <li>Contact support if the problem persists</li>
                </ul>
              </div>

              <div className="auth-page__form-group">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="auth-page__input"
                />
              </div>

              <div className="auth-page__actions">
                <Button
                  variant="primary"
                  onClick={resendVerification}
                  loading={resending}
                  disabled={resending || !userEmail}
                  fullWidth
                >
                  Resend Verification Email
                </Button>
                <Button variant="outline" onClick={goToLoginFromError} fullWidth>
                  Back to Login
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default EmailVerificationPage