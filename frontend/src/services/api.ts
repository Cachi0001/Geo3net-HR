const API_BASE_URL = 'http://localhost:5004/api'
const WS_BASE_URL = 'ws://localhost:5004'

// Import employee types for type safety
import type {
  Employee,
  CreateEmployeeData,
  UpdateEmployeeData,
  EmployeeSearchFilters,
  EmployeeResult,
  EmployeeStatistics,
  Department,
  Position
} from '../types/employee.types'

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

export interface RealTimeUpdate {
  type: 'attendance' | 'task' | 'notification' | 'system' | 'task_progress' | 'task_status_change'
  data: any
  timestamp: string
  userId?: string
}

export interface TaskProgressUpdate {
  taskId: string
  status: string
  actualHours: number
  progressNotes: string
  updatedBy: {
    id: string
    fullName: string
  }
  timestamp: string
}

export interface TaskStatusChangeNotification {
  taskId: string
  oldStatus: string
  newStatus: string
  updatedBy: {
    id: string
    fullName: string
  }
  timestamp: string
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

    // Start periodic token validation
    this.startTokenValidation()

    console.log('🔧 ApiClient initialized:', {
      baseURL: this.baseURL,
      hasToken: !!this.token,
      hasRefreshToken: !!this.refreshToken,
      tokenInfo: this.getTokenInfo()
    })
  }

  private initializeTokens(): void {
    // Check both localStorage and sessionStorage for tokens
    this.token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')
    this.refreshToken = localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken')

    // Enhanced token validation
    if (this.token) {
      if (!this.validateTokenFormat(this.token)) {
        console.warn('⚠️ Invalid access token format, clearing tokens')
        this.clearToken()
        return
      }

      try {
        const payload = JSON.parse(atob(this.token.split('.')[1]))
        const isExpired = payload.exp * 1000 < Date.now()
        const expiresIn = payload.exp * 1000 - Date.now()

        if (isExpired) {
          console.log('🔄 Access token expired, will attempt refresh on next request')
        } else {
          console.log(`🔐 Access token valid, expires in ${Math.round(expiresIn / 1000 / 60)} minutes`)
        }
      } catch (error) {
        console.warn('⚠️ Could not parse token payload, clearing tokens')
        this.clearToken()
      }
    }

    // Validate refresh token format
    if (this.refreshToken && !this.validateTokenFormat(this.refreshToken)) {
      console.warn('⚠️ Invalid refresh token format, clearing tokens')
      this.clearToken()
    }
  }

  private validateTokenFormat(token: string): boolean {
    if (!token || typeof token !== 'string') {
      return false
    }
    
    const parts = token.split('.')
    if (parts.length !== 3) {
      return false
    }
    
    try {
      // Try to decode the header and payload
      JSON.parse(atob(parts[0]))
      JSON.parse(atob(parts[1]))
      return true
    } catch (error) {
      return false
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

  private startTokenValidation(): void {
    // Check token validity every 5 minutes
    setInterval(() => {
      if (this.token && this.isTokenExpired(this.token)) {
        console.log('🔄 Token expired during periodic check, will refresh on next request')
      }
    }, 5 * 60 * 1000) // 5 minutes

    // Also validate on page focus
    window.addEventListener('focus', () => {
      if (this.token) {
        const tokenInfo = this.getTokenInfo()
        if (tokenInfo.isExpired) {
          console.log('🔄 Token expired while page was not focused')
        }
      }
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
    console.log('🗑️ Clearing all tokens and resetting state')
    
    // Clear instance variables
    this.token = null
    this.refreshToken = null
    this.isRefreshing = false
    this.refreshPromise = null

    // Clear from both storage types
    localStorage.removeItem('accessToken')
    sessionStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    sessionStorage.removeItem('refreshToken')

    // Clear any user-related data that might be cached
    localStorage.removeItem('user')
    sessionStorage.removeItem('user')

    // Reset connection status
    this.connectionStatus.reconnectAttempts = 0

    // Close WebSocket connection if exists
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }

    // Clear any timers
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    console.log('✅ All tokens and session data cleared')
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
      const bufferTime = 60 // 1 minute buffer to refresh before actual expiration
      
      return payload.exp < (currentTime + bufferTime)
    } catch (error) {
      console.warn('⚠️ Could not parse token for expiration check:', error)
      return true // Assume expired if we can't parse
    }
  }

  /**
   * Gets token expiration info for debugging
   */
  getTokenInfo(): { 
    hasToken: boolean
    hasRefreshToken: boolean
    isExpired?: boolean
    expiresIn?: number
    expiresAt?: Date
  } {
    const info = {
      hasToken: !!this.token,
      hasRefreshToken: !!this.refreshToken
    }

    if (this.token) {
      try {
        const payload = JSON.parse(atob(this.token.split('.')[1]))
        const currentTime = Math.floor(Date.now() / 1000)
        const expiresIn = payload.exp - currentTime
        
        return {
          ...info,
          isExpired: payload.exp < currentTime,
          expiresIn: expiresIn,
          expiresAt: new Date(payload.exp * 1000)
        }
      } catch (error) {
        return { ...info, isExpired: true }
      }
    }

    return info
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
      console.log('❌ No refresh token available for refresh')
      throw new Error('No refresh token available')
    }

    // Validate refresh token format before attempting refresh
    if (!this.validateTokenFormat(refreshToken)) {
      console.log('❌ Invalid refresh token format')
      this.clearToken()
      throw new Error('Invalid refresh token format')
    }

    console.log('🔄 Performing token refresh...')

    try {
      const startTime = Date.now()
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      })

      const duration = Date.now() - startTime
      console.log(`📡 Token refresh response: ${response.status} (${duration}ms)`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.message || `HTTP ${response.status}`
        
        console.error('❌ Token refresh failed:', {
          status: response.status,
          message: errorMessage
        })

        // Handle specific error cases
        if (response.status === 401 || response.status === 403) {
          console.log('🔐 Refresh token expired or invalid, clearing tokens')
          this.clearToken()
          throw new Error('Session expired. Please log in again.')
        }

        throw new Error(`Token refresh failed: ${errorMessage}`)
      }

      const data = await response.json()

      if (data.success && data.data?.accessToken) {
        const rememberMe = !!localStorage.getItem('accessToken')
        this.setToken(data.data.accessToken, rememberMe)
        
        // Log token expiration info
        try {
          const payload = JSON.parse(atob(data.data.accessToken.split('.')[1]))
          const expiresIn = payload.exp * 1000 - Date.now()
          console.log(`✅ Token refreshed successfully, expires in ${Math.round(expiresIn / 1000 / 60)} minutes`)
        } catch (parseError) {
          console.log('✅ Token refreshed successfully')
        }
      } else {
        throw new Error(data.message || 'Token refresh failed - no access token returned')
      }
    } catch (error: any) {
      console.error('❌ Token refresh failed:', error.message)
      
      // Only clear tokens and redirect for authentication errors
      if (error.message.includes('Session expired') || error.message.includes('401') || error.message.includes('403')) {
        this.clearToken()

        // Redirect to login if we're in a browser environment
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          console.log('🔄 Redirecting to login page')
          window.location.href = '/login'
        }
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

  async getDepartments(): Promise<ApiResponse<{ departments: Department[] }>> {
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

  async getEmployeeDashboard(): Promise<ApiResponse> {
    return this.request('/dashboard/employee')
  }

  async getRealTimeStatus(): Promise<ApiResponse> {
    return this.request('/dashboard/real-time-status')
  }

  async getSystemAnalytics(params?: any): Promise<ApiResponse> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return this.request(`/dashboard/analytics${queryString}`)
  }

  // Employee endpoints with proper typing
  async getEmployees(params?: EmployeeSearchFilters): Promise<ApiResponse<{ employees: Employee[], total: number }>> {
    const queryString = params ? '?' + new URLSearchParams(params as any).toString() : ''
    return this.request(`/employees${queryString}`)
  }

  async getEmployee(id: string): Promise<ApiResponse<Employee>> {
    return this.request(`/employees/${id}`)
  }

  async createEmployee(data: CreateEmployeeData): Promise<ApiResponse<{ employee: Employee, temporaryPassword?: string }>> {
    return this.request('/employees', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateEmployee(id: string, data: UpdateEmployeeData): Promise<ApiResponse<Employee>> {
    return this.request(`/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteEmployee(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.request(`/employees/${id}`, {
      method: 'DELETE',
    })
  }

  async getEmployeeStats(): Promise<ApiResponse<EmployeeStatistics>> {
    return this.request('/employees/statistics')
  }

  // Time tracking endpoints
  async getTimeTrackingHistory(params?: any): Promise<ApiResponse> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return this.request(`/time-tracking/history${queryString}`)
  }

  async checkIn(data: any): Promise<ApiResponse> {
    console.log('[API] Check-in request initiated', {
      employeeId: data.employeeId,
      hasLocation: !!data.location,
      hasDeviceInfo: !!data.deviceInfo,
      timestamp: new Date().toISOString()
    })
    
    try {
      const response = await this.request('/time-tracking/check-in', {
        method: 'POST',
        body: JSON.stringify(data),
      })
      console.log('[API] Check-in request successful', {
        employeeId: data.employeeId,
        success: response.success,
        message: response.message,
        entryId: response.data && typeof response.data === 'object' && 'id' in response.data ? response.data.id : undefined
      })
      return response
    } catch (error: any) {
      console.error('[API] Check-in request failed', {
        employeeId: data.employeeId,
        error: error.message,
        statusCode: error.statusCode
      })
      throw error
    }
  }

  async checkOut(data: any): Promise<ApiResponse> {
    console.log('[API] Check-out request initiated', {
      employeeId: data.employeeId,
      hasLocation: !!data.location,
      hasDeviceInfo: !!data.deviceInfo,
      timestamp: new Date().toISOString()
    })
    
    try {
      const response = await this.request('/time-tracking/check-out', {
        method: 'POST',
        body: JSON.stringify(data),
      })
      console.log('[API] Check-out request successful', {
        employeeId: data.employeeId,
        success: response.success,
        message: response.message,
        entryId: response.data && typeof response.data === 'object' && 'id' in response.data ? response.data.id : undefined
      })
      return response
    } catch (error: any) {
      console.error('[API] Check-out request failed', {
        employeeId: data.employeeId,
        error: error.message,
        statusCode: error.statusCode
      })
      throw error
    }
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
    return this.request(`/tasks${queryString}`)
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

    return this.request('/users/profile/picture', {
      method: 'POST',
      body: formData,
      headers: {
        // Remove Content-Type to let browser set it with boundary for FormData
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
    })
  }

  async deleteProfilePicture(): Promise<ApiResponse> {
    return this.request('/users/profile/picture', {
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

  // Department Management endpoints with proper typing
  async createDepartment(data: { name: string; description?: string; managerId?: string }): Promise<ApiResponse<Department>> {
    return this.request('/departments', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateDepartment(id: string, data: { name?: string; description?: string; managerId?: string; isActive?: boolean }): Promise<ApiResponse<Department>> {
    return this.request(`/departments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteDepartment(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.request(`/departments/${id}`, {
      method: 'DELETE',
    })
  }

  // Recruitment endpoints
  async getJobPostings(params?: any): Promise<ApiResponse> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return this.request(`/recruitment/jobs${queryString}`)
  }

  async createJobPosting(data: any): Promise<ApiResponse> {
    return this.request('/recruitment/jobs', {
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

  // Leave Management endpoints
  async getLeaveRequests(params?: any): Promise<ApiResponse> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return this.request(`/leave/requests${queryString}`)
  }

  async getMyLeaveRequests(params?: any): Promise<ApiResponse> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return this.request(`/leave/my-requests${queryString}`)
  }

  async createLeaveRequest(data: any): Promise<ApiResponse> {
    return this.request('/leave/requests', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateLeaveRequest(id: string, data: any): Promise<ApiResponse> {
    return this.request(`/leave/requests/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async approveLeaveRequest(id: string, data?: any): Promise<ApiResponse> {
    return this.request(`/leave/requests/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    })
  }

  async rejectLeaveRequest(id: string, data: any): Promise<ApiResponse> {
    return this.request(`/leave/requests/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getLeaveBalance(): Promise<ApiResponse> {
    return this.request('/leave/balance')
  }

  async getLeaveTypes(): Promise<ApiResponse> {
    return this.request('/leave/types')
  }

  // WebSocket methods for real-time task updates
  connectWebSocket(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('🔌 WebSocket already connected')
      return
    }

    try {
      const wsUrl = `${this.wsURL}/ws`
      console.log('🔌 Connecting to WebSocket:', wsUrl)
      
      this.ws = new WebSocket(wsUrl)
      
      this.ws.onopen = () => {
        console.log('✅ WebSocket connected')
        this.connectionStatus.isOnline = true
        this.connectionStatus.lastConnected = new Date()
        this.connectionStatus.reconnectAttempts = 0
        
        // Authenticate WebSocket connection
        if (this.token) {
          this.ws?.send(JSON.stringify({
            type: 'auth',
            token: this.token
          }))
        }
        
        this.startHeartbeat()
        this.emit('websocket:connected')
      }
      
      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          console.log('📨 WebSocket message received:', message)
          
          switch (message.type) {
            case 'task_progress':
              this.emit('task:progress_update', message.data)
              break
            case 'task_status_change':
              this.emit('task:status_change', message.data)
              break
            case 'notification':
              this.emit('notification', message.data)
              break
            case 'pong':
              // Heartbeat response
              break
            default:
              this.emit('websocket:message', message)
          }
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error)
        }
      }
      
      this.ws.onclose = (event) => {
        console.log('🔌 WebSocket disconnected:', event.code, event.reason)
        this.connectionStatus.isOnline = false
        this.stopHeartbeat()
        this.emit('websocket:disconnected', { code: event.code, reason: event.reason })
        
        // Attempt to reconnect if not a clean close
        if (event.code !== 1000 && this.connectionStatus.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
          this.scheduleReconnect()
        }
      }
      
      this.ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error)
        this.connectionStatus.connectionError = 'WebSocket connection error'
        this.emit('websocket:error', error)
      }
      
    } catch (error) {
      console.error('❌ Failed to create WebSocket connection:', error)
      this.connectionStatus.connectionError = 'Failed to create WebSocket connection'
    }
  }

  disconnectWebSocket(): void {
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect')
      this.ws = null
    }
    this.stopHeartbeat()
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
    }
    
    this.connectionStatus.reconnectAttempts++
    const delay = this.RECONNECT_INTERVAL * Math.pow(2, this.connectionStatus.reconnectAttempts - 1)
    
    console.log(`🔄 Scheduling WebSocket reconnect in ${delay}ms (attempt ${this.connectionStatus.reconnectAttempts})`)
    
    this.reconnectTimer = window.setTimeout(() => {
      this.connectWebSocket()
    }, delay)
  }

  private startHeartbeat(): void {
    this.stopHeartbeat()
    this.heartbeatTimer = window.setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }))
      }
    }, this.HEARTBEAT_INTERVAL)
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event)!.push(callback)
  }

  off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      const index = listeners.indexOf(callback)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  private emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`❌ Error in event listener for ${event}:`, error)
        }
      })
    }
  }

  getConnectionStatus(): ConnectionStatus {
    return { ...this.connectionStatus }
  }
}

const apiClient = new ApiClient(API_BASE_URL, WS_BASE_URL)

export default apiClient
export { ApiClient, apiClient }