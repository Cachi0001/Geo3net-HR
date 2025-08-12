import React from 'react'

import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Card, Input, Button } from '../../components/common'
import './AuthPage.css'
import { useToast } from '../../hooks/useToast'
import { startGoogleOneTap } from '../../utils/google'

const LoginPage: React.FC = () => {
  const { login, loginWithGoogle, loading } = useAuth()
  const { showSuccess, showError } = useToast()
  const navigate = useNavigate()
  const location = useLocation() as any
  const from = location.state?.from?.pathname || '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    // Basic validation
    if (!email.trim() || !password.trim()) {
      setError('Email and password are required')
      showError('Email and password are required')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      showError('Password must be at least 8 characters')
      return
    }
    try {
      await login(email, password)
      showSuccess('Welcome back!')
      navigate(from, { replace: true })
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Login failed. Please check your credentials.'
      setError(msg)
      showError(msg)
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

            <Button type="submit" variant="primary" fullWidth loading={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
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
            disabled={loading}
            onClick={async () => {
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