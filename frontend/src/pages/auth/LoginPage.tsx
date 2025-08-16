import React, { useState , useEffect} from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Card, Input, Button } from '../../components/common'
import './AuthPage.css'
import { useToast } from '../../hooks/useToast'

const LoginPage: React.FC = () => {
  const { login } = useAuth()
  const navigate = useNavigate()
  const { showSuccess, showError } = useToast()

  

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  

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

      await login(email, password, navigate)

    } catch (err: any) {
      console.log('❌ LoginPage: Login error:', err)
      let msg = 'Login failed. Please try again.'

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

          <p className="auth-page__footer">
            Don't have an account? <Link to="/register">Register</Link>
          </p>
        </Card>
      </div>
    </div>
  )
}

export default LoginPage