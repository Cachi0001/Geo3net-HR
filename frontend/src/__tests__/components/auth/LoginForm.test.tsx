import React from 'react'
import { render, screen, fireEvent, waitFor } from '../../utils/test-utils'
import { LoginForm } from '../../../components/auth'

// Mock the auth hook
const mockLogin = jest.fn()
const mockLoginWithGoogle = jest.fn()

jest.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({
    login: mockLogin,
    loginWithGoogle: mockLoginWithGoogle,
  }),
}))

// Mock the toast hook
const mockShowToast = jest.fn()
jest.mock('../../../hooks/useToast', () => ({
  useToast: () => ({
    showToast: mockShowToast,
  }),
}))

describe('LoginForm', () => {
  const mockProps = {
    onSuccess: jest.fn(),
    onForgotPassword: jest.fn(),
    onRegister: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders login form correctly', () => {
    render(<LoginForm {...mockProps} />)

    expect(screen.getByText('Welcome Back')).toBeInTheDocument()
    expect(screen.getByText('Sign in to your account')).toBeInTheDocument()
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument()
  })

  it('validates required fields', () => {
    render(<LoginForm {...mockProps} />)

    const submitButton = screen.getByRole('button', { name: /sign in/i })
    fireEvent.click(submitButton)

    expect(screen.getByText('Email is required')).toBeInTheDocument()
    expect(screen.getByText('Password is required')).toBeInTheDocument()
    expect(mockLogin).not.toHaveBeenCalled()
  })

  it('validates email format', () => {
    render(<LoginForm {...mockProps} />)

    const emailInput = screen.getByLabelText(/email address/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
    fireEvent.click(submitButton)

    expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument()
    expect(mockLogin).not.toHaveBeenCalled()
  })

  it('validates password length', () => {
    render(<LoginForm {...mockProps} />)

    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: '123' } })
    fireEvent.click(submitButton)

    expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument()
    expect(mockLogin).not.toHaveBeenCalled()
  })

  it('submits form with valid data', async () => {
    mockLogin.mockResolvedValue({})
    
    render(<LoginForm {...mockProps} />)

    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123')
      expect(mockShowToast).toHaveBeenCalledWith('success', 'Login successful!')
      expect(mockProps.onSuccess).toHaveBeenCalled()
    })
  })

  it('handles login error', async () => {
    const errorMessage = 'Invalid credentials'
    mockLogin.mockRejectedValue(new Error(errorMessage))
    
    render(<LoginForm {...mockProps} />)

    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith('error', errorMessage)
      expect(mockProps.onSuccess).not.toHaveBeenCalled()
    })
  })

  it('handles Google login', async () => {
    mockLoginWithGoogle.mockResolvedValue({})
    
    render(<LoginForm {...mockProps} />)

    const googleButton = screen.getByRole('button', { name: /continue with google/i })
    fireEvent.click(googleButton)

    await waitFor(() => {
      expect(mockLoginWithGoogle).toHaveBeenCalled()
      expect(mockShowToast).toHaveBeenCalledWith('success', 'Login successful!')
      expect(mockProps.onSuccess).toHaveBeenCalled()
    })
  })

  it('calls forgot password callback', () => {
    render(<LoginForm {...mockProps} />)

    const forgotPasswordLink = screen.getByText('Forgot your password?')
    fireEvent.click(forgotPasswordLink)

    expect(mockProps.onForgotPassword).toHaveBeenCalled()
  })

  it('calls register callback', () => {
    render(<LoginForm {...mockProps} />)

    const registerLink = screen.getByText('Sign up')
    fireEvent.click(registerLink)

    expect(mockProps.onRegister).toHaveBeenCalled()
  })

  it('disables form during loading', async () => {
    mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)))
    
    render(<LoginForm {...mockProps} />)

    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    const googleButton = screen.getByRole('button', { name: /continue with google/i })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(emailInput).toBeDisabled()
      expect(passwordInput).toBeDisabled()
      expect(submitButton).toBeDisabled()
      expect(googleButton).toBeDisabled()
    })
  })
})