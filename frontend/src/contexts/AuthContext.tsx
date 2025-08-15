import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authService } from '../services/auth.service'

export interface User {
  id: string
  email: string
  fullName: string
  role: string
  employeeId?: string
  departmentId?: string
  positionId?: string
  profileComplete: boolean
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<User>
  loginWithGoogle: (token: string) => Promise<void>
  register: (data: { firstName: string; lastName: string; email: string; password: string }) => Promise<{ user: User; message: string }>
  logout: () => Promise<void>
  forgotPassword: (email: string) => Promise<void>
  resetPassword: (token: string, password: string) => Promise<void>
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>
  updateProfile: (profileData: Partial<User>) => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('accessToken')
        if (token) {
          const userData = await authService.getCurrentUser()
          setUser(userData)
        }
      } catch (error) {
        // Token might be expired or invalid
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    console.log('🔍 AuthContext: Login method called with:', { email })
    setLoading(true)
    try {
      console.log('🔍 AuthContext: Making login API call...')
      const response = await authService.login(email, password)
      console.log('✅ AuthContext: Login API success:', { 
        hasTokens: !!(response.accessToken && response.refreshToken),
        hasUser: !!response.user,
        userRole: response.user?.role,
        userId: response.user?.id
      })
      
      console.log('🔍 AuthContext: Storing tokens in localStorage...')
      localStorage.setItem('accessToken', response.accessToken)
      localStorage.setItem('refreshToken', response.refreshToken)
      
      console.log('🔍 AuthContext: Setting user state...')
      setUser(response.user)
      console.log('✅ AuthContext: User state updated, returning user data')
      
      // Return the user data so LoginPage can use it for immediate navigation
      return response.user
    } catch (error) {
      console.log('❌ AuthContext: Login error:', error)
      throw error // Re-throw so LoginPage can handle it
    } finally {
      console.log('🔍 AuthContext: Setting loading to false')
      setLoading(false)
    }
  }, [])

  const loginWithGoogle = useCallback(async (token: string) => {
    setLoading(true)
    try {
      const response = await authService.loginWithGoogle(token)
      localStorage.setItem('accessToken', response.accessToken)
      localStorage.setItem('refreshToken', response.refreshToken)
      setUser(response.user)
    } finally {
      setLoading(false)
    }
  }, [])

  const register = useCallback(async (data: { firstName: string; lastName: string; email: string; password: string }) => {
    setLoading(true)
    try {
      const fullName = `${data.firstName} ${data.lastName}`
      const response = await authService.register(data.email, fullName, data.password)
      // Don't auto-login after registration - user needs to verify email first
      return response
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    setLoading(true)
    try {
      await authService.logout()
    } catch (error) {
      // Even if logout fails on server, clear local state
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      setUser(null)
      setLoading(false)
    }
  }, [])

  const forgotPassword = useCallback(async (email: string) => {
    await authService.forgotPassword(email)
  }, [])

  const resetPassword = useCallback(async (token: string, password: string) => {
    await authService.resetPassword(token, password)
  }, [])

  const changePassword = useCallback(async (oldPassword: string, newPassword: string) => {
    await authService.changePassword(oldPassword, newPassword)
  }, [])

  const updateProfile = useCallback(async (profileData: Partial<User>) => {
    if (!user) return
    
    const updatedUser = await authService.updateProfile(profileData)
    setUser(updatedUser)
  }, [user])

  const refreshUser = useCallback(async () => {
    if (!user) return
    
    try {
      const userData = await authService.getCurrentUser()
      setUser(userData)
    } catch (error) {
      console.error('Failed to refresh user:', error)
    }
  }, [user])

  const value: AuthContextType = {
    user,
    loading,
    login,
    loginWithGoogle,
    register,
    logout,
    forgotPassword,
    resetPassword,
    changePassword,
    updateProfile,
    refreshUser,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}