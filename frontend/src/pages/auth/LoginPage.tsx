import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Card, Input, Button } from '../../components/common'
import './AuthPage.css'
import { useToast } from '../../hooks/useToast'
import { startGoogleOneTap } from '../../utils/google'

const LoginPage: React.FC = () => {
  const { login, loginWithGoogle } = useAuth()
  const { showSuccess, showError } = useToast()
  const navigate = useNavigate()
  const location = useLocation() as any
  const from = location.state?.from?.pathname || '/dashboard'
  const verificationMessage = location.state?.message
  const isVerified = location.state?.verified

  console.log('🔍 LoginPage: Component rendered with:', {
    from,
    locationState: location.state,
    currentPath: location.pathname
  })

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Show verification success message
  useEffect(() => {
    if (verificationMessage && isVerified) {
      showSuccess(verificationMessage)
    }
  }, [verificationMessage, isVerified, showSuccess])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Basic validation
    if (!email.trim() || !password.trim()) {
      const msg = 'Email and password are required'
      setError(msg)
      showError(msg)
      return
    }
    if (password.length < 8) {
      const msg = 'Password must be at least 8 characters'
      setError(msg)
      showError(msg)
      return
    }

    setSubmitting(true)
    try {
      console.log('🔍 LoginPage: Starting login process...')
      console.log('🔍 LoginPage: Current URL before login:', window.location.href)
      console.log('🔍 LoginPage: Target redirect URL:', from)

      const user = await login(email, password)
      console.log('✅ LoginPage: Login successful, user returned:', user)
      console.log('✅ LoginPage: Tokens in localStorage:', {
        accessToken: !!localStorage.getItem('accessToken'),
        refreshToken: !!localStorage.getItem('refreshToken')
      })

      showSuccess('Welcome back!')
      console.log('🚀 LoginPage: About to redirect to:', from)
      console.log('🚀 LoginPage: Current URL before redirect:', window.location.href)

      // Add a small delay to ensure state updates
      setTimeout(() => {
        console.log('🚀 LoginPage: Executing redirect now...')
        window.location.href = from
      }, 100)

    } catch (err: any) {
      console.log('❌ LoginPage: Login error:', err)
      let msg = 'Login failed. Please try again.'

      // Extract error message from different possible error structures
      if (err?.response?.data?.message) {
        msg = err.response.data.message
      } else if (err?.message) {
        msg = err.message
      }

      setError(msg)
      showError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-page__container">
        <h2 className="auth-page__title">Sign in to your account</h2>
        <Card padding="lg" variant="elevated">
          {error && (
            <div role="alert" className="auth-page__error">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="auth-page__form-group">
              <Input
                id="email"
                name="email"
                type="email"
                label="Email address"
                required
                fullWidth
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="auth-page__form-group">
              <Input
                id="password"
                name="password"
                type="password"
                label="Password"
                required
                fullWidth
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="auth-page__actions">
              <Link to="/forgot-password">Forgot your password?</Link>
            </div>

            <Button type="submit" variant="primary" fullWidth loading={submitting} disabled={submitting}>
              {submitting ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          {/* Social auth */}
          <div className="auth-page__separator">
            <span>or</span>
          </div>
          <Button
            type="button"
            variant="outline"
            fullWidth
            disabled={submitting}
            onClick={async () => {
              setSubmitting(true)
              try {
                await startGoogleOneTap(async (credential) => {
                  try {
                    await loginWithGoogle(credential)
                    showSuccess('Signed in with Google')
                    navigate(from, { replace: true })
                  } catch (e: any) {
                    const msg = e?.response?.data?.message || 'Google sign-in failed'
                    showError(msg)
                  }
                })
              } catch (err: any) {
                const msg = err?.message || 'Google setup failed'
                showError(msg)
              } finally {
                setSubmitting(false)
              }
            }}
          >
            Continue with Google
          </Button>

          <p className="auth-page__footer">
            Don't have an account? <Link to="/register">Register</Link>
          </p>
        </Card>
      </div>
    </div>
  )
}

export default LoginPage