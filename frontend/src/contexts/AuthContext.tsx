import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
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
  login: (email: string, password: string, navigate: (path: string) => void) => Promise<void>
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
      console.log('🔧 AuthContext.initializeAuth: start')
      try {
        const token = localStorage.getItem('accessToken')
        console.log('🔧 AuthContext.initializeAuth: token present =', !!token)
        if (token) {
          try {
            const userData = await authService.getCurrentUser()
            console.log('🔧 AuthContext.initializeAuth: fetched user =', userData?.id, userData?.email)
            setUser(userData)
          } catch (err: any) {
            console.warn('⚠️ AuthContext.initializeAuth: failed to fetch current user, clearing tokens', err?.message)
            localStorage.removeItem('accessToken')
            localStorage.removeItem('refreshToken')
            setUser(null)
          }
        } else {
          console.log('🔧 AuthContext.initializeAuth: no token, user stays null')
        }
      } catch (error) {
        // Token might be expired or invalid
        console.error('❌ AuthContext.initializeAuth: unexpected error', (error as any)?.message)
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        setUser(null)
      } finally {
        setLoading(false)
        console.log('🔧 AuthContext.initializeAuth: end. loading=false, hasUser=', !!user)
      }
    }

    initializeAuth()
  }, [])

  const login = useCallback(async (email: string, password: string, navigate: (path: string) => void) => {
    console.log('🔐 AuthContext.login: start for', email)
    setLoading(true)
    try {
      const response = await authService.login(email, password)
      console.log('🔐 AuthContext.login: received user/tokens', {
        hasUser: !!response?.user,
        hasAT: !!response?.accessToken,
        hasRT: !!response?.refreshToken,
      })
      if (response?.accessToken) localStorage.setItem('accessToken', response.accessToken)
      if (response?.refreshToken) localStorage.setItem('refreshToken', response.refreshToken)
      setUser(response.user)
      console.log('🔐 AuthContext.login: setUser complete, navigating to /dashboard')
      navigate('/dashboard')
    } catch (error) {
      console.error('❌ AuthContext.login: error', (error as any)?.message)
      throw error
    } finally {
      setLoading(false)
      console.log('🔐 AuthContext.login: end. loading=false')
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
    console.log('🚪 AuthContext.logout: start')
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
      console.log('🚪 AuthContext.logout: completed, tokens cleared')
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
      console.log('🔄 AuthContext.refreshUser: fetching /auth/me')
      const userData = await authService.getCurrentUser()
      setUser(userData)
      console.log('🔄 AuthContext.refreshUser: updated user', userData?.id)
    } catch (error) {
      console.error('Failed to refresh user:', error)
    }
  }, [user])

  const value: AuthContextType = {
    user,
    loading,
    login,
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