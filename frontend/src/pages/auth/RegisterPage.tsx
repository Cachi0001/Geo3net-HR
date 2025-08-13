import React from 'react'

import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Card, Input, Button } from '../../components/common'
import './AuthPage.css'
import { useToast } from '../../hooks/useToast'

const RegisterPage: React.FC = () => {
  const { register, loading } = useAuth()
  const { showSuccess, showError } = useToast()
  const navigate = useNavigate()
  const location = useLocation() as any
  const to = location.state?.to?.pathname || '/dashboard'

  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    // Basic validations
    if (!fullName.trim()) {
      const msg = 'Full name is required'
      setError(msg)
      showError(msg)
      return
    }
    if (!email.trim()) {
      const msg = 'Email is required'
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
    if (password !== confirmPassword) {
      const msg = 'Passwords do not match'
      setError(msg)
      showError(msg)
      return
    }
    try {
      await register({ firstName: fullName.split(' ')[0] || '', lastName: fullName.split(' ').slice(1).join(' ') || '', email, password })
      showSuccess('Account created successfully')
      navigate(to, { replace: true })
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Registration failed. Please try again.'
      setError(msg)
      showError(msg)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-page__container">
        <h2 className="auth-page__title">Create your account</h2>
        <Card padding="lg" variant="elevated">
          {error && (
            <div role="alert" className="auth-page__error">{error}</div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="auth-page__form-group">
              <Input
                id="fullName"
                name="fullName"
                type="text"
                label="Full name"
                required
                fullWidth
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

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

            <div className="auth-page__form-group">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                label="Confirm password"
                required
                fullWidth
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <Button type="submit" variant="primary" fullWidth loading={loading}>
              {loading ? 'Creating account...' : 'Create account'}
            </Button>
          </form>

          <p className="auth-page__footer">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </Card>
      </div>
    </div>
  )
}

export default RegisterPage