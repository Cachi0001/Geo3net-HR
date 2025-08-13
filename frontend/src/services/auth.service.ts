import { apiService } from './api.service'
import { User } from '../contexts/AuthContext'

interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: User
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
    return apiService.post<AuthResponse>('/auth/login', data)
  }

  async loginWithGoogle(token: string): Promise<AuthResponse> {
    return apiService.post<AuthResponse>('/auth/google', { token })
  }

  async register(email: string, fullName: string, password: string): Promise<{ user: User; message: string }> {
    const data: RegisterRequest = { email, fullName, password }
    return apiService.post<{ user: User; message: string }>('/auth/register', data)
  }

  async getSystemStatus(): Promise<{
    needsInitialization: boolean
    totalUsers: number
    roleDistribution: Record<string, number>
    systemReady: boolean
  }> {
    return apiService.get('/system/status')
  }

  async initializeSystem(): Promise<{
    superAdminCreated: boolean
    credentials?: { email: string; password: string }
  }> {
    return apiService.post('/system/initialize')
  }

  async logout(): Promise<void> {
    return apiService.post('/auth/logout')
  }

  async forgotPassword(email: string): Promise<void> {
    const data: ForgotPasswordRequest = { email }
    return apiService.post('/auth/forgot-password', data)
  }

  async resetPassword(token: string, password: string): Promise<void> {
    const data: ResetPasswordRequest = { token, newPassword: password }
    return apiService.post('/auth/reset-password', data)
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    const data: ChangePasswordRequest = { oldPassword, newPassword }
    return apiService.post('/auth/change-password', data)
  }

  async getCurrentUser(): Promise<User> {
    return apiService.get<User>('/auth/me')
  }

  async updateProfile(profileData: Partial<User>): Promise<User> {
    return apiService.put<User>('/auth/profile', profileData)
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    return apiService.post<AuthResponse>('/auth/refresh', { refreshToken })
  }

  async verifyEmail(token: string): Promise<void> {
    return apiService.post('/auth/verify-email', { token })
  }

  async resendVerificationEmail(): Promise<void> {
    return apiService.post('/auth/resend-verification')
  }
}

export const authService = new AuthService()