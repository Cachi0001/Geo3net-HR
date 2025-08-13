import React from 'react'

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Card, Input, Button } from '../../components/common'
import './AuthPage.css'
import { useToast } from '../../hooks/useToast'

const ForgotPasswordPage: React.FC = () => {
  const { forgotPassword } = useAuth()
  const { showSuccess, showError } = useToast()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      if (!email.trim()) {
        const msg = 'Email is required'
        setError(msg)
        showError(msg)
        setSubmitting(false)
        return
      }
      await forgotPassword(email)
      setSubmitted(true)
      showSuccess('A reset link has been sent')
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to send reset email. Please try again.'
      setError(msg)
      showError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-page__container">
        <h2 className="auth-page__title">Reset your password</h2>
        <Card padding="lg" variant="elevated">
          {submitted ? (
            <>
              <p>
                If an account exists for <strong>{email}</strong>, you will receive an email with instructions to reset your password.
              </p>
              <p className="auth-page__footer">
                Return to <Link to="/login">Sign in</Link>
              </p>
            </>
          ) : (
            <>
              {error && (<div role="alert" className="auth-page__error">{error}</div>)}
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

                <Button type="submit" variant="primary" fullWidth loading={submitting}>
                  {submitting ? 'Sending...' : 'Send reset link'}
                </Button>
              </form>

              <p className="auth-page__footer">
                Remembered your password? <Link to="/login">Sign in</Link>
              </p>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}

export default ForgotPasswordPage