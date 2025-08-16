import { apiService } from './api.service'
import { User } from '../contexts/AuthContext'

interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: User
}

// Backend responses are wrapped by ResponseHandler:
// { success: boolean, message: string, data?: any }
// This helper unwraps to return the inner data if present.
const unwrap = <T>(res: any): T => {
  if (res && typeof res === 'object' && 'success' in res) {
    return (res.data ?? (res as T)) as T
  }
  return res as T
}

interface LoginRequest {
  email: string
  password: string
}

interface RegisterRequest {
  email: string
  fullName: string
  password: string
}

interface ForgotPasswordRequest {
  email: string
}

interface ResetPasswordRequest {
  token: string
  newPassword: string
}

interface ChangePasswordRequest {
  oldPassword: string
  newPassword: string
}

class AuthService {
  async login(email: string, password: string): Promise<AuthResponse> {
    const data: LoginRequest = { email, password }
    console.log('🔐 AuthService.login: Sending credentials for', email)
    const res = await apiService.post<any>('/auth/login', data)
    console.log('🔐 AuthService.login: Raw response keys =', Object.keys(res || {}))
    const payload = unwrap<{ user: User; tokens: { accessToken: string; refreshToken: string } }>(res)
    console.log('🔐 AuthService.login: Unwrapped payload present =', !!payload, 'has tokens =', !!payload?.tokens)
    return {
      user: payload.user,
      accessToken: payload.tokens?.accessToken,
      refreshToken: payload.tokens?.refreshToken,
    }
  }

  async loginWithGoogle(token: string): Promise<AuthResponse> {
    console.log('🔐 AuthService.loginWithGoogle: Starting')
    const res = await apiService.post<any>('/auth/google', { token })
    const payload = unwrap<{ user: User; tokens: { accessToken: string; refreshToken: string } }>(res)
    return {
      user: payload.user,
      accessToken: payload.tokens?.accessToken,
      refreshToken: payload.tokens?.refreshToken,
    }
  }

  async register(email: string, fullName: string, password: string): Promise<{ user: User; message: string }> {
    const data: RegisterRequest = { email, fullName, password }
    console.log('🆕 AuthService.register: Registering', { email, fullName })
    const res = await apiService.post<any>('/auth/register', data)
    const payload = unwrap<{ user: User }>(res)
    const message: string = (res && (res.message as string)) || 'Account created successfully!'
    return { user: payload.user, message }
  }

  async getSystemStatus(): Promise<{
    needsInitialization: boolean
    totalUsers: number
    roleDistribution: Record<string, number>
    systemReady: boolean
  }> {
    console.log('ℹ️ AuthService.getSystemStatus')
    return apiService.get('/system/status')
  }

  async initializeSystem(): Promise<{
    superAdminCreated: boolean
    credentials?: { email: string; password: string }
  }> {
    console.log('⚙️ AuthService.initializeSystem')
    return apiService.post('/system/initialize')
  }

  async logout(): Promise<void> {
    console.log('🚪 AuthService.logout')
    return apiService.post('/auth/logout')
  }

  async forgotPassword(email: string): Promise<void> {
    const data: ForgotPasswordRequest = { email }
    console.log('🔁 AuthService.forgotPassword for', email)
    return apiService.post('/auth/forgot-password', data)
  }

  async resetPassword(token: string, password: string): Promise<void> {
    const data: ResetPasswordRequest = { token, newPassword: password }
    console.log('♻️ AuthService.resetPassword')
    return apiService.post('/auth/reset-password', data)
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    const data: ChangePasswordRequest = { oldPassword, newPassword }
    console.log('🔑 AuthService.changePassword')
    return apiService.post('/auth/change-password', data)
  }

  async getCurrentUser(): Promise<User> {
    console.log('👤 AuthService.getCurrentUser')
    const res = await apiService.get<any>('/auth/me')
    const payload = unwrap<{ user: User }>(res)
    return (payload as any).user ?? (payload as any)
  }

  async updateProfile(profileData: Partial<User>): Promise<User> {
    console.log('🧩 AuthService.updateProfile', Object.keys(profileData || {}))
    const res = await apiService.put<any>('/auth/profile', profileData)
    const payload = unwrap<User>(res)
    return (payload as any).user ?? (payload as any)
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    console.log('🔄 AuthService.refreshToken: starting')
    const res = await apiService.post<any>('/auth/refresh', { refreshToken })
    const payload = unwrap<{ accessToken: string; refreshToken: string }>(res)
    return {
      user: (res?.data?.user as User) || (res?.user as User),
      accessToken: (payload as any).accessToken,
      refreshToken: (payload as any).refreshToken,
    }
  }

  async verifyEmail(token: string): Promise<void> {
    console.log('📧 AuthService.verifyEmail')
    return apiService.post('/auth/verify-email', { token })
  }

  async resendVerificationEmail(email?: string): Promise<void> {
    const data = email ? { email } : {}
    console.log('📧 AuthService.resendVerificationEmail for', email)
    return apiService.post('/auth/resend-verification', data)
  }
}

export const authService = new AuthService()