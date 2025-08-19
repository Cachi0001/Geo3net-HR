import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { apiClient, LoginData, RegisterData, LoginResponse } from '../services/api'
import { toast } from 'sonner'

// Auth context type
export interface AuthUser {
  id: string
  email: string
  fullName: string
  role: string
  employeeId?: string
  department?: string
  position?: string
}

// Custom hooks for authentication
export const useAuth = () => {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  // Get current user query
  const {
    data: user,
    isLoading: isLoadingUser,
    error: userError,
  } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')
      if (!token) return null
      
      try {
        const response = await apiClient.getCurrentUser()
        return response.data || null
      } catch (error) {
        // If token is invalid, clear it
        apiClient.clearToken()
        return null
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: (data: LoginData) => apiClient.login(data),
    onSuccess: (response, variables) => {
      if (response.success && response.data) {
        const { user, accessToken, refreshToken } = response.data
        const rememberMe = variables.rememberMe || false
        
        // Store tokens with remember me preference
        apiClient.setToken(accessToken, rememberMe)
        
        // Store refresh token in the same storage type as access token
        if (rememberMe) {
          localStorage.setItem('refreshToken', refreshToken)
          sessionStorage.removeItem('refreshToken')
        } else {
          sessionStorage.setItem('refreshToken', refreshToken)
          localStorage.removeItem('refreshToken')
        }
        
        // Update query cache
        queryClient.setQueryData(['currentUser'], user)
        
        toast.success('Login successful!')
        
        // Navigate based on role
        navigate('/dashboard')
      } else {
        toast.error(response.message || 'Login failed')
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Login failed')
    },
  })

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: (data: RegisterData) => apiClient.register(data),
    onSuccess: (response) => {
      if (response.success) {
        toast.success('Registration successful! Please login.')
        navigate('/login')
      } else {
        toast.error(response.message || 'Registration failed')
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Registration failed')
    },
  })

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: () => apiClient.logout(),
    onSuccess: () => {
      // Clear query cache
      queryClient.setQueryData(['currentUser'], null)
      queryClient.clear()
      
      toast.success('Logged out successfully')
      navigate('/login')
    },
    onError: (error: Error) => {
      // Even if logout fails on server, clear local data
      apiClient.clearToken()
      queryClient.setQueryData(['currentUser'], null)
      queryClient.clear()
      
      toast.error(error.message || 'Logout failed')
      navigate('/login')
    },
  })

  // Forgot password mutation
  const forgotPasswordMutation = useMutation({
    mutationFn: (email: string) => apiClient.forgotPassword(email),
    onSuccess: (response) => {
      if (response.success) {
        toast.success('Password reset email sent!')
      } else {
        toast.error(response.message || 'Failed to send reset email')
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to send reset email')
    },
  })

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: ({ token, newPassword }: { token: string; newPassword: string }) =>
      apiClient.resetPassword(token, newPassword),
    onSuccess: (response) => {
      if (response.success) {
        toast.success('Password reset successful! Please login.')
        navigate('/login')
      } else {
        toast.error(response.message || 'Password reset failed')
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Password reset failed')
    },
  })

  // Helper functions
  const isAuthenticated = !!user
  const isLoading = isLoadingUser || loginMutation.isPending || registerMutation.isPending

  const hasRole = (requiredRole: string | string[]) => {
    if (!user) return false
    
    if (Array.isArray(requiredRole)) {
      return requiredRole.includes(user.role)
    }
    
    return user.role === requiredRole
  }

  const hasAnyRole = (roles: string[]) => {
    if (!user) return false
    return roles.includes(user.role)
  }

  const isAdmin = () => hasAnyRole(['super-admin', 'hr-admin'])
  const isManager = () => hasRole('manager')
  const isEmployee = () => hasRole('employee')

  return {
    // User data
    user,
    isAuthenticated,
    isLoading,
    userError,
    
    // Mutations
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout: logoutMutation.mutate,
    forgotPassword: forgotPasswordMutation.mutate,
    resetPassword: resetPasswordMutation.mutate,
    
    // Loading states
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    isSendingResetEmail: forgotPasswordMutation.isPending,
    isResettingPassword: resetPasswordMutation.isPending,
    
    // Role helpers
    hasRole,
    hasAnyRole,
    isAdmin,
    isManager,
    isEmployee,
  }
}

// Hook for checking backend health
export const useHealthCheck = () => {
  return useQuery({
    queryKey: ['healthCheck'],
    queryFn: () => apiClient.healthCheck(),
    refetchInterval: 30000, // Check every 30 seconds
    retry: 3,
  })
}