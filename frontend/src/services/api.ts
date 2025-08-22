const API_BASE_URL = 'http://localhost:5003/api'
const WS_BASE_URL = 'ws://localhost:5003'

// Enhanced API Response types
export interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
  error?: string
  timestamp?: string
  requestId?: string
}

export interface LoginResponse {
  user: {
    id: string
    email: string
    fullName: string
    role: string
    employeeId?: string
    department?: string
    position?: string
  }
  tokens: {
    accessToken: string
    refreshToken: string
    expiresIn: string
  }
}

// Enhanced error types
export interface ApiError extends Error {
  code?: string
  statusCode?: number
  field?: string
  context?: any
}

export interface RegisterData {
  email: string
  fullName: string
  password: string
}

export interface LoginData {
  email: string
  password: string
  rememberMe?: boolean
}

// Real-time data types
export interface RealTimeUpdate {
  type: 'attendance' | 'task' | 'notification' | 'system'
  data: any
  timestamp: string
  userId?: string
}

export interface ConnectionStatus {
  isOnline: boolean
  lastConnected: Date | null
  reconnectAttempts: number
  connectionError?: string
}

// Enhanced API Client class
class ApiClient {
  private baseURL: string
  private wsURL: string
  private token: string | null = null
  private refreshToken: string | null = null
  private ws: WebSocket | null = null
  private reconnectTimer: number | null = null
  private connectionStatus: ConnectionStatus = {
    isOnline: navigator.onLine,
    lastConnected: null,
    reconnectAttempts: 0
  }
  private eventListeners: Map<string, Function[]> = new Map()
  private heartbeatTimer: number | null = null
  private readonly MAX_RECONNECT_ATTEMPTS = 5
  private readonly RECONNECT_INTERVAL = 3000
  private readonly HEARTBEAT_INTERVAL = 30000
  private isRefreshing = false
  private refreshPromise: Promise<any> | null = null

  constructor(baseURL: string, wsURL?: string) {
    this.baseURL = baseURL
    this.wsURL = wsURL || WS_BASE_URL

    // Enhanced token initialization with validation
    this.initializeTokens()

    // Initialize connection monitoring
    this.initializeConnectionMonitoring()

    console.log('🔧 ApiClient initialized:', {
      baseURL: this.baseURL,
      hasToken: !!this.token,
      hasRefreshToken: !!this.refreshToken
    })
  }

  private initializeTokens(): void {
    // Check both localStorage and sessionStorage for tokens
    this.token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')
    this.refreshToken = localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken')

    // Validate token if it exists
    if (this.token) {
      try {
        const payload = JSON.parse(atob(this.token.split('.')[1]))
        const isExpired = payload.exp * 1000 < Date.now()

        if (isExpired) {
          console.log('🔄 Access token expired, will attempt refresh on next request')
        }
      } catch (error) {
        console.warn('⚠️ Invalid token format, clearing tokens')
        this.clearToken()
      }
    }
  }

  private initializeConnectionMonitoring(): void {
    // Monitor online/offline status
    window.addEventListener('online', () => {
      console.log('🌐 Connection restored')
      this.connectionStatus.isOnline = true
      this.connectionStatus.lastConnected = new Date()
      this.connectionStatus.reconnectAttempts = 0
    })

    window.addEventListener('offline', () => {
      console.log('📴 Connection lost')
      this.connectionStatus.isOnline = false
    })
  }

  setToken(token: string, rememberMe: boolean = false) {
    console.log('🔐 Setting access token:', { rememberMe, tokenLength: token?.length })
    this.token = token

    if (rememberMe) {
      // Use localStorage for persistent storage
      localStorage.setItem('accessToken', token)
      sessionStorage.removeItem('accessToken')
    } else {
      // Use sessionStorage for session-only storage
      sessionStorage.setItem('accessToken', token)
      localStorage.removeItem('accessToken')
    }
  }

  setRefreshToken(refreshToken: string, rememberMe: boolean = false) {
    console.log('🔄 Setting refresh token:', { rememberMe, tokenLength: refreshToken?.length })
    this.refreshToken = refreshToken

    if (rememberMe) {
      localStorage.setItem('refreshToken', refreshToken)
      sessionStorage.removeItem('refreshToken')
    } else {
      sessionStorage.setItem('refreshToken', refreshToken)
      localStorage.removeItem('refreshToken')
    }
  }

  setTokens(accessToken: string, refreshToken: string, rememberMe: boolean = false) {
    this.setToken(accessToken, rememberMe)
    this.setRefreshToken(refreshToken, rememberMe)
  }

  get baseUrl(): string {
    return this.baseURL
  }

  clearToken() {
    console.log('🗑️ Clearing all tokens')
    this.token = null
    this.refreshToken = null
    this.isRefreshing = false
    this.refreshPromise = null

    // Clear from both storage types
    localStorage.removeItem('accessToken')
    sessionStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    sessionStorage.removeItem('refreshToken')
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    console.log(`🚀 API Request [${requestId}]:`, {
      method: options.method || 'GET',
      endpoint,
      hasToken: !!this.token
    })

    // Always check for the latest token from storage
    const currentToken = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')
    if (currentToken && currentToken !== this.token) {
      console.log('🔄 Token updated from storage')
      this.token = currentToken
    }

    // Check if we need to refresh token before making request
    if (this.token && this.isTokenExpired(this.token) && !endpoint.includes('/auth/')) {
      console.log('🔄 Token expired, attempting refresh before request')
      try {
        await this.handleTokenRefresh()
      } catch (error) {
        console.error('❌ Pre-request token refresh failed:', error)
        // Continue with request, let it fail and handle in response
      }
    }

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        'X-Request-ID': requestId,
        ...options.headers,
      },
      ...options,
    }

    try {
      const startTime = Date.now()
      const response = await fetch(url, config)
      const duration = Date.now() - startTime

      console.log(`📡 API Response [${requestId}]:`, {
        status: response.status,
        duration: `${duration}ms`,
        ok: response.ok
      })

      // Check if response has content
      const contentType = response.headers.get('content-type')
      let data: any = {}

      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json()
        } catch (parseError) {
          console.warn(`⚠️ Failed to parse JSON response [${requestId}]:`, parseError)
          data = {
            success: false,
            message: 'Invalid response format',
            error: 'PARSE_ERROR'
          }
        }
      } else {
        // Handle non-JSON responses
        const text = await response.text()
        data = {
          success: response.ok,
          message: text || `HTTP ${response.status}`,
          error: response.ok ? undefined : 'NON_JSON_RESPONSE'
        }
      }

      if (!response.ok) {
        return this.handleErrorResponse(response, data, endpoint, config, requestId)
      }

      // Ensure response has required fields
      if (typeof data.success === 'undefined') {
        data.success = true
      }

      return data
    } catch (error: any) {
      console.error(`❌ API request failed [${requestId}]:`, {
        endpoint,
        error: error.message,
        stack: error.stack
      })

      // Handle network errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error: Please check your internet connection')
      }

      throw error
    }
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const currentTime = Math.floor(Date.now() / 1000)
      return payload.exp < currentTime
    } catch (error) {
      console.warn('⚠️ Could not parse token for expiration check:', error)
      return true // Assume expired if we can't parse
    }
  }

  private async handleTokenRefresh(): Promise<void> {
    if (this.isRefreshing) {
      // If already refreshing, wait for the existing refresh to complete
      if (this.refreshPromise) {
        await this.refreshPromise
      }
      return
    }

    this.isRefreshing = true
    this.refreshPromise = this.performTokenRefresh()

    try {
      await this.refreshPromise
    } finally {
      this.isRefreshing = false
      this.refreshPromise = null
    }
  }

  private async performTokenRefresh(): Promise<void> {
    const refreshToken = localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken')

    if (!refreshToken) {
      throw new Error('No refresh token available')
    }

    console.log('🔄 Performing token refresh...')

    try {
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      })

      if (!response.ok) {
        throw new Error(`Refresh failed: ${response.status}`)
      }

      const data = await response.json()

      if (data.success && data.data?.accessToken) {
        const rememberMe = !!localStorage.getItem('accessToken')
        this.setToken(data.data.accessToken, rememberMe)
        console.log('✅ Token refreshed successfully')
      } else {
        throw new Error(data.message || 'Token refresh failed')
      }
    } catch (error) {
      console.error('❌ Token refresh failed:', error)
      this.clearToken()

      // Redirect to login if we're in a browser environment
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }

      throw error
    }
  }

  private async handleErrorResponse(
    response: Response,
    data: any,
    endpoint: string,
    config: RequestInit,
    requestId: string
  ): Promise<ApiResponse> {
    console.log(`❌ Error Response [${requestId}]:`, {
      status: response.status,
      data
    })

    // Handle authentication errors
    if (response.status === 401 || response.status === 403) {
      if (!endpoint.includes('/auth/') && this.refreshToken) {
        try {
          console.log('🔄 Attempting token refresh due to auth error')
          await this.handleTokenRefresh()

          // Retry the original request with new token
          const retryConfig = {
            ...config,
            headers: {
              ...config.headers,
              Authorization: `Bearer ${this.token}`
            }
          }

          const retryResponse = await fetch(`${this.baseURL}${endpoint}`, retryConfig)

          if (retryResponse.ok) {
            const retryData = retryResponse.headers.get('content-type')?.includes('application/json')
              ? await retryResponse.json()
              : { success: true, message: await retryResponse.text() }

            console.log(`✅ Retry successful [${requestId}]`)
            return retryData
          }
        } catch (refreshError) {
          console.error(`❌ Token refresh and retry failed [${requestId}]:`, refreshError)
          // Fall through to handle as regular error
        }
      }
    }

    // Handle validation errors specifically
    if (response.status === 400 && data.errors) {
      const errorMessage = Array.isArray(data.errors)
        ? data.errors.join(', ')
        : typeof data.errors === 'object'
          ? Object.values(data.errors).flat().join(', ')
          : data.errors

      const error = new Error(errorMessage || data.message || 'Validation failed') as ApiError
      error.code = 'VALIDATION_ERROR'
      error.statusCode = 400
      throw error
    }

    // Handle 404 specifically
    if (response.status === 404) {
      const error = new Error(`Route ${endpoint} not found`) as ApiError
      error.code = 'NOT_FOUND'
      error.statusCode = 404
      throw error
    }

    // Handle other errors
    const error = new Error(data.message || `HTTP error! status: ${response.status}`) as ApiError
    error.code = data.error || 'API_ERROR'
    error.statusCode = response.status
    throw error
  }

  // Authentication endpoints
  async register(data: RegisterData): Promise<ApiResponse<LoginResponse>> {
    return this.request<LoginResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async login(data: LoginData): Promise<ApiResponse<LoginResponse>> {
    console.log('🔐 Attempting login for:', data.email)

    const response = await this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    })

    // If login successful, store tokens
    if (response.success && response.data?.tokens) {
      const { accessToken, refreshToken } = response.data.tokens
      const rememberMe = data.rememberMe || false

      this.setTokens(accessToken, refreshToken, rememberMe)

      console.log('✅ Login successful, tokens stored:', {
        user: response.data.user.email,
        role: response.data.user.role,
        rememberMe
      })
    }

    return response
  }

  async logout(): Promise<ApiResponse> {
    const response = await this.request('/auth/logout', {
      method: 'POST',
    })
    this.clearToken()
    return response
  }

  async refreshTokenEndpoint(): Promise<ApiResponse<{ accessToken: string }>> {
    const refreshToken = this.refreshToken || localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken')
    if (!refreshToken) {
      throw new Error('No refresh token available')
    }

    console.log('🔄 Calling refresh token endpoint')

    const response = await this.request<{ accessToken: string }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    })

    // Update stored token if refresh successful
    if (response.success && response.data?.accessToken) {
      const rememberMe = !!localStorage.getItem('accessToken')
      this.setToken(response.data.accessToken, rememberMe)
      console.log('✅ Token refreshed via endpoint')
    }

    return response
  }

  async getCurrentUser(): Promise<ApiResponse<LoginResponse['user']>> {
    return this.request<LoginResponse['user']>('/auth/me')
  }

  async forgotPassword(email: string): Promise<ApiResponse> {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  }

  async resetPassword(token: string, newPassword: string): Promise<ApiResponse> {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    })
  }

  // Health check
  async healthCheck(): Promise<ApiResponse> {
    return fetch(`${this.baseURL.replace('/api', '')}/health`)
      .then(res => res.json())
      .catch(error => ({ success: false, message: error.message }))
  }

  // Dashboard endpoints
  async getDashboardMetrics(): Promise<ApiResponse> {
    return this.request('/dashboard/metrics')
  }

  async getDepartmentStats(): Promise<ApiResponse> {
    return this.request('/dashboard/department-stats')
  }

  async getDepartments(): Promise<ApiResponse> {
    return this.request('/departments')
  }

  async getRecentActivities(): Promise<ApiResponse> {
    return this.request('/dashboard/recent-activities')
  }

  async getDashboardData(): Promise<ApiResponse> {
    return this.request('/dashboard/data')
  }

  async getSuperAdminDashboard(): Promise<ApiResponse> {
    return this.request('/dashboard/super-admin')
  }

  async getRealTimeStatus(): Promise<ApiResponse> {
    return this.request('/dashboard/real-time-status')
  }

  async getSystemAnalytics(params?: any): Promise<ApiResponse> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return this.request(`/dashboard/analytics${queryString}`)
  }

  // Employee endpoints
  async getEmployees(params?: any): Promise<ApiResponse> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return this.request(`/employees${queryString}`)
  }

  async getEmployee(id: string): Promise<ApiResponse> {
    return this.request(`/employees/${id}`)
  }

  async createEmployee(data: any): Promise<ApiResponse> {
    return this.request('/employees', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateEmployee(id: string, data: any): Promise<ApiResponse> {
    return this.request(`/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteEmployee(id: string): Promise<ApiResponse> {
    return this.request(`/employees/${id}`, {
      method: 'DELETE',
    })
  }

  async getEmployeeStats(): Promise<ApiResponse> {
    return this.request('/employees/statistics')
  }

  // Time tracking endpoints
  async getTimeTrackingHistory(params?: any): Promise<ApiResponse> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return this.request(`/time-tracking/history${queryString}`)
  }

  async checkIn(data: any): Promise<ApiResponse> {
    return this.request('/time-tracking/check-in', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async checkOut(data: any): Promise<ApiResponse> {
    return this.request('/time-tracking/check-out', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getActiveTimeEntry(): Promise<ApiResponse> {
    return this.request('/time-tracking/active')
  }

  async getTimeEntries(params?: any): Promise<ApiResponse> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return this.request(`/time-tracking/entries${queryString}`)
  }

  async getAttendanceRecords(startDate: string, endDate: string): Promise<ApiResponse> {
    return this.request('/time-tracking/attendance', {
      method: 'GET',
      body: JSON.stringify({ startDate, endDate }),
    })
  }

  async getAttendanceRecord(date: string): Promise<ApiResponse> {
    return this.request(`/time-tracking/attendance/${date}`)
  }

  async getWorkHoursSummary(params?: any): Promise<ApiResponse> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return this.request(`/time-tracking/summary${queryString}`)
  }

  async validateLocation(location: any): Promise<ApiResponse> {
    return this.request('/time-tracking/validate-location', {
      method: 'POST',
      body: JSON.stringify({ location }),
    })
  }

  // Admin Time Tracking endpoints
  async getAllTimeEntries(params?: any): Promise<ApiResponse> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return this.request(`/time-tracking/admin/entries${queryString}`)
  }

  async getAttendanceReport(params?: any): Promise<ApiResponse> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return this.request(`/time-tracking/admin/report${queryString}`)
  }

  async getTeamTimeEntries(params?: any): Promise<ApiResponse> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return this.request(`/time-tracking/team/entries${queryString}`)
  }

  async getTeamStatistics(params?: any): Promise<ApiResponse> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return this.request(`/time-tracking/team/statistics${queryString}`)
  }

  // Task endpoints
  async getTasks(params?: any): Promise<ApiResponse> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return this.request(`/tasks/search${queryString}`)
  }

  async getMyTasks(status?: string): Promise<ApiResponse> {
    const queryString = status ? `?status=${status}` : ''
    return this.request(`/tasks/my-tasks${queryString}`)
  }

  async getTasksCreatedByMe(status?: string): Promise<ApiResponse> {
    const queryString = status ? `?status=${status}` : ''
    return this.request(`/tasks/created-by-me${queryString}`)
  }

  async getTaskStatistics(params?: any): Promise<ApiResponse> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return this.request(`/tasks/statistics${queryString}`)
  }

  async getOverdueTasks(): Promise<ApiResponse> {
    return this.request('/tasks/overdue')
  }

  async createTask(data: any): Promise<ApiResponse> {
    return this.request('/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateTask(id: string, data: any): Promise<ApiResponse> {
    return this.request(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteTask(id: string): Promise<ApiResponse> {
    return this.request(`/tasks/${id}`, {
      method: 'DELETE',
    })
  }

  async assignTask(id: string, assignedTo: string): Promise<ApiResponse> {
    return this.request(`/tasks/${id}/assign`, {
      method: 'PATCH',
      body: JSON.stringify({ assignedTo }),
    })
  }

  async updateTaskStatus(id: string, status: string): Promise<ApiResponse> {
    return this.request(`/tasks/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
  }

  // Role and Permission Management
  async getRoleHierarchy(): Promise<ApiResponse> {
    return this.request('/roles/hierarchy')
  }

  async getAvailableRoles(): Promise<ApiResponse> {
    return this.request('/roles/available')
  }

  async getMyRoles(): Promise<ApiResponse> {
    return this.request('/roles/my-roles')
  }

  async getUserRoles(userId: string): Promise<ApiResponse> {
    return this.request(`/roles/user/${userId}`)
  }

  async assignRole(data: { userId: string; roleName: string }): Promise<ApiResponse> {
    return this.request('/roles/assign', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateUserPermissions(userId: string, permissions: string[]): Promise<ApiResponse> {
    return this.request('/roles/permissions', {
      method: 'PUT',
      body: JSON.stringify({ userId, permissions }),
    })
  }

  async deactivateUserRole(userId: string): Promise<ApiResponse> {
    return this.request(`/roles/user/${userId}`, {
      method: 'DELETE',
    })
  }

  async validatePermission(permission: string): Promise<ApiResponse> {
    return this.request(`/roles/validate/${permission}`)
  }

  // Security endpoints
  async getSecurityLogs(params?: string): Promise<ApiResponse> {
    return this.request(`/security/logs${params || ''}`)
  }

  async getActiveSessions(): Promise<ApiResponse> {
    return this.request('/security/sessions')
  }

  async getSecurityPolicies(): Promise<ApiResponse> {
    return this.request('/security/policies')
  }

  async terminateSession(sessionId: string): Promise<ApiResponse> {
    return this.request(`/security/sessions/${sessionId}`, {
      method: 'DELETE',
    })
  }

  async updateSecurityPolicy(policyId: string, data: any): Promise<ApiResponse> {
    return this.request(`/security/policies/${policyId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  // Profile endpoints
  async getUserProfile(): Promise<ApiResponse> {
    return this.request('/users/profile')
  }

  async updateUserProfile(data: any): Promise<ApiResponse> {
    return this.request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async changePassword(data: any): Promise<ApiResponse> {
    return this.request('/users/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Profile picture endpoints
  async uploadProfilePicture(file: File): Promise<ApiResponse> {
    const formData = new FormData()
    formData.append('profilePicture', file)

    return this.request('/users/profile-picture', {
      method: 'POST',
      body: formData,
      headers: {
        // Remove Content-Type to let browser set it with boundary for FormData
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
    })
  }

  async deleteProfilePicture(): Promise<ApiResponse> {
    return this.request('/users/profile-picture', {
      method: 'DELETE',
    })
  }
  // Activities endpoints
  async getActivities(params?: any): Promise<ApiResponse> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return this.request(`/activities${queryString}`)
  }

  // Settings and Configuration endpoints
  async getAttendanceDashboard(date?: string): Promise<ApiResponse> {
    const params = date ? `?date=${date}` : ''
    return this.request(`/settings/attendance-dashboard${params}`)
  }

  async getAttendanceAnalytics(params?: any): Promise<ApiResponse> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return this.request(`/settings/attendance-analytics${queryString}`)
  }

  // Location Management endpoints
  async getLocations(): Promise<ApiResponse> {
    return this.request('/settings/locations')
  }

  async createLocation(data: any): Promise<ApiResponse> {
    return this.request('/settings/locations', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateLocation(id: string, data: any): Promise<ApiResponse> {
    return this.request(`/settings/locations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteLocation(id: string): Promise<ApiResponse> {
    return this.request(`/settings/locations/${id}`, {
      method: 'DELETE',
    })
  }

  // Attendance Policy Management endpoints (FIXED - removed duplicate)
  async getAttendancePolicies(): Promise<ApiResponse> {
    console.log('📋 Fetching attendance policies')
    return this.request('/attendance-policies')
  }

  async getAttendancePolicyById(id: string): Promise<ApiResponse> {
    console.log('📋 Fetching attendance policy:', id)
    return this.request(`/attendance-policies/${id}`)
  }

  async createAttendancePolicy(data: any): Promise<ApiResponse> {
    console.log('➕ Creating attendance policy:', data.name)
    return this.request('/attendance-policies', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateAttendancePolicy(id: string, data: any): Promise<ApiResponse> {
    console.log('✏️ Updating attendance policy:', id)
    return this.request(`/attendance-policies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteAttendancePolicy(id: string): Promise<ApiResponse> {
    console.log('🗑️ Deleting attendance policy:', id)
    return this.request(`/attendance-policies/${id}`, {
      method: 'DELETE',
    })
  }

  async setDefaultAttendancePolicy(id: string): Promise<ApiResponse> {
    console.log('🎯 Setting default attendance policy:', id)
    return this.request(`/attendance-policies/${id}/set-default`, {
      method: 'POST',
    })
  }

  async getDefaultAttendancePolicy(): Promise<ApiResponse> {
    console.log('🎯 Fetching default attendance policy')
    return this.request('/attendance-policies/default')
  }

  // System Configuration endpoints
  async getSystemConfiguration(): Promise<ApiResponse> {
    return this.request('/settings/system-config')
  }

  async updateSystemConfiguration(data: any): Promise<ApiResponse> {
    return this.request('/settings/system-config', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async getUserManagementStats(): Promise<ApiResponse> {
    return this.request('/admin/user-stats')
  }

  async getAttendanceOverview(): Promise<ApiResponse> {
    return this.request('/admin/attendance-overview')
  }

  // Department Management endpoints
  async createDepartment(data: any): Promise<ApiResponse> {
    return this.request('/departments', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateDepartment(id: string, data: any): Promise<ApiResponse> {
    return this.request(`/departments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteDepartment(id: string): Promise<ApiResponse> {
    return this.request(`/departments/${id}`, {
      method: 'DELETE',
    })
  }

  // Recruitment endpoints
  async getJobPostings(params?: any): Promise<ApiResponse> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return this.request(`/recruitment/job-postings${queryString}`)
  }

  async createJobPosting(data: any): Promise<ApiResponse> {
    return this.request('/recruitment/job-postings', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getJobApplications(params?: any): Promise<ApiResponse> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return this.request(`/recruitment/applications${queryString}`)
  }

  // Payroll Management endpoints
  async getPayrollRecords(params?: any): Promise<ApiResponse> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return this.request(`/payroll${queryString}`)
  }

  async createPayrollRecord(data: any): Promise<ApiResponse> {
    return this.request('/payroll', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updatePayrollRecord(id: string, data: any): Promise<ApiResponse> {
    return this.request(`/payroll/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async getPayrollSummary(params?: any): Promise<ApiResponse> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return this.request(`/payroll/summary${queryString}`)
  }

  async processPayroll(data: any): Promise<ApiResponse> {
    return this.request('/payroll/process', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }
}

// Create and export the API client instance
const apiClient = new ApiClient(API_BASE_URL, WS_BASE_URL)

export default apiClient
export { ApiClient, apiClient }