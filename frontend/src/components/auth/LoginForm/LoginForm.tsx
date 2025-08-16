import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Input, Card } from '../../common'
import { useAuth } from '../../../hooks/useAuth'
import { useToast } from '../../../hooks/useToast'
import './LoginForm.css'

export interface LoginFormProps {
  onSuccess?: () => void
  onForgotPassword?: () => void
  onRegister?: () => void
}

const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  onForgotPassword,
  onRegister,
}) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  
  const { login } = useAuth()
  const navigate = useNavigate()
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

    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('📝 LoginForm: submit clicked', { email: formData.email })
    if (!validateForm()) {
      console.warn('📝 LoginForm: validation failed', { errors })
      return
    }

    setIsLoading(true)
    console.log('📝 LoginForm: calling login...')
    try {
      await login(formData.email, formData.password, navigate)
      console.log('📝 LoginForm: login resolved, AuthContext should navigate to /dashboard')
      showToast('success', 'Login successful!')
      onSuccess?.()
    } catch (error: any) {
      console.error('📝 LoginForm: login error', error?.message)
      showToast('error', error.message || 'Login failed. Please try again.')
    } finally {
      setIsLoading(false)
      console.log('📝 LoginForm: submit end, isLoading=false')
    }
  }

  

  return (
    <Card className="login-form-card" padding="lg">
      <div className="login-form-header">
        <h1 className="login-form-title">Welcome Back</h1>
        <p className="login-form-subtitle">Sign in to your account</p>
      </div>

      <form onSubmit={handleSubmit} className="login-form">
        <div className="login-form-fields">
          <Input
            label="Email Address"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            error={errors.email}
            placeholder="Enter your email"
            fullWidth
            required
            disabled={isLoading}
          />

          <Input
            label="Password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            error={errors.password}
            placeholder="Enter your password"
            fullWidth
            required
            disabled={isLoading}
          />
        </div>

        <div className="login-form-actions">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={isLoading}
            disabled={isLoading}
          >
            Sign In
          </Button>

          
        </div>

        <div className="login-form-footer">
          <button
            type="button"
            className="login-form-link"
            onClick={onForgotPassword}
            disabled={isLoading}
          >
            Forgot your password?
          </button>

          <div className="login-form-register">
            <span>Don't have an account? </span>
            <button
              type="button"
              className="login-form-link"
              onClick={onRegister}
              disabled={isLoading}
            >
              Sign up
            </button>
          </div>
        </div>
      </form>
    </Card>
  )
}

export default LoginForm