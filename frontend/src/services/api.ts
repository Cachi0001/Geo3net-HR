const API_BASE_URL = 'http://localhost:5003/api'

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
  error?: string
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
  accessToken: string
  refreshToken: string
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

// API Client class
class ApiClient {
  private baseURL: string
  private token: string | null = null

  constructor(baseURL: string) {
    this.baseURL = baseURL
    // Check both localStorage and sessionStorage for token
    this.token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')
  }

  setToken(token: string, rememberMe: boolean = false) {
    this.token = token
    if (rememberMe) {
      // Use localStorage for persistent storage
      localStorage.setItem('accessToken', token)
      // Remove from sessionStorage if it exists
      sessionStorage.removeItem('accessToken')
    } else {
      // Use sessionStorage for session-only storage
      sessionStorage.setItem('accessToken', token)
      // Remove from localStorage if it exists
      localStorage.removeItem('accessToken')
    }
  }

  get baseUrl(): string {
    return this.baseURL
  }

  clearToken() {
    this.token = null
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
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)
      
      // Check if response has content
      const contentType = response.headers.get('content-type')
      let data: any = {}
      
      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json()
        } catch (parseError) {
          console.warn('Failed to parse JSON response:', parseError)
          data = { message: 'Invalid response format' }
        }
      } else {
        // Handle non-JSON responses
        const text = await response.text()
        data = { message: text || `HTTP error! status: ${response.status}` }
      }

      if (!response.ok) {
        // Handle validation errors specifically
        if (response.status === 400 && data.errors) {
          const errorMessage = Array.isArray(data.errors) 
            ? data.errors.join(', ') 
            : typeof data.errors === 'object' 
              ? Object.values(data.errors).flat().join(', ')
              : data.errors
          throw new Error(errorMessage || data.message || 'Validation failed')
        }
        throw new Error(data.message || `HTTP error! status: ${response.status}`)
      }

      return data
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  // Authentication endpoints
  async register(data: RegisterData): Promise<ApiResponse<LoginResponse>> {
    return this.request<LoginResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async login(data: LoginData): Promise<ApiResponse<LoginResponse>> {
    return this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async logout(): Promise<ApiResponse> {
    const response = await this.request('/auth/logout', {
      method: 'POST',
    })
    this.clearToken()
    return response
  }

  async refreshToken(): Promise<ApiResponse<{ accessToken: string }>> {
    const refreshToken = localStorage.getItem('refreshToken')
    if (!refreshToken) {
      throw new Error('No refresh token available')
    }

    return this.request<{ accessToken: string }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    })
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

  async getRecentActivities(): Promise<ApiResponse> {
    return this.request('/dashboard/recent-activities')
  }

  async getDashboardData(): Promise<ApiResponse> {
    return this.request('/dashboard/data')
  }

  async getRealTimeStatus(): Promise<ApiResponse> {
    return this.request('/dashboard/real-time-status')
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
    return this.request('/employees/stats')
  }

  // Time tracking endpoints
  async getTimeTrackingHistory(params?: any): Promise<ApiResponse> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return this.request(`/time-tracking/history${queryString}`)
  }

  async checkIn(data: any): Promise<ApiResponse> {
    return this.request('/time-tracking/checkin', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async checkOut(data: any): Promise<ApiResponse> {
    return this.request('/time-tracking/checkout', {
      method: 'POST',
      body: JSON.stringify(data),
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

  // Enhanced Time Tracking endpoints
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

  // Settings endpoints
  async getAttendanceDashboard(date?: string): Promise<ApiResponse> {
    const params = date ? `?date=${date}` : ''
    return this.request(`/settings/attendance-dashboard${params}`)
  }

  async getAttendanceAnalytics(params?: any): Promise<ApiResponse> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return this.request(`/settings/attendance-analytics${queryString}`)
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

  // Activities endpoints
  async getActivities(params?: any): Promise<ApiResponse> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return this.request(`/activities${queryString}`)
  }

  // Generic GET method for backward compatibility
  async get(endpoint: string, options?: any): Promise<ApiResponse> {
    return this.request(endpoint, { method: 'GET', ...options })
  }

  // Generic POST method for backward compatibility
  async post(endpoint: string, data?: any): Promise<ApiResponse> {
    return this.request(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  // Generic PUT method for backward compatibility
  async put(endpoint: string, data?: any): Promise<ApiResponse> {
    return this.request(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  // Generic PATCH method for backward compatibility
  async patch(endpoint: string, data?: any): Promise<ApiResponse> {
    return this.request(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  // Generic DELETE method for backward compatibility
  async delete(endpoint: string): Promise<ApiResponse> {
    return this.request(endpoint, { method: 'DELETE' })
  }
}

// Export singleton instance
export const apiClient = new ApiClient(API_BASE_URL)
export default apiClient