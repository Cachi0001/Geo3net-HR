import React from 'react'

import { useState, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Card, Input, Button } from '../../components/common'
import './AuthPage.css'
import { useToast } from '../../hooks/useToast'

const ResetPasswordPage: React.FC = () => {
  const { resetPassword } = useAuth()
  const { showSuccess, showError } = useToast()
  const [searchParams] = useSearchParams()
  const token = useMemo(() => searchParams.get('token') || '', [searchParams])

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!token) {
      const msg = 'Invalid or missing token. Please use the password reset link from your email.'
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
    if (password.length < 8) {
      const msg = 'Password must be at least 8 characters'
      setError(msg)
      showError(msg)
      return
    }
    setSubmitting(true)
    try {
      await resetPassword(token, password)
      setDone(true)
      showSuccess('Password updated successfully')
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to reset password. Please try again.'
      setError(msg)
      showError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-page__container">
        <h2 className="auth-page__title">Set new password</h2>
        <Card padding="lg" variant="elevated">
          {done ? (
            <>
              <p>Your password has been updated successfully.</p>
              <p className="auth-page__footer">
                You can now <Link to="/login">sign in</Link> with your new password.
              </p>
            </>
          ) : (
            <>
              {error && (<div role="alert" className="auth-page__error">{error}</div>)}
              <form onSubmit={handleSubmit}>
                <div className="auth-page__form-group">
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    label="New password"
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
                    label="Confirm new password"
                    required
                    fullWidth
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>

                <Button type="submit" variant="primary" fullWidth loading={submitting}>
                  {submitting ? 'Updating...' : 'Update password'}
                </Button>
              </form>

              <p className="auth-page__footer">
                Back to <Link to="/login">Sign in</Link>
              </p>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}

export default ResetPasswordPage