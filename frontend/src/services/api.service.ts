import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'

class ApiService {
  private api: AxiosInstance

  constructor() {
    this.api = axios.create({
      baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('accessToken')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
          console.log('📤 ApiService: Request', {
            method: config.method,
            url: config.url,
            hasAuth: true,
          })
        } else {
          console.log('📤 ApiService: Request (no token)', {
            method: config.method,
            url: config.url,
          })
        }
        return config
      },
      (error) => {
        console.error('❌ ApiService: Request error', error?.message)
        return Promise.reject(error)
      }
    )

    // Response interceptor to handle token refresh
    this.api.interceptors.response.use(
      (response) => {
        console.log('📥 ApiService: Response', {
          url: response.config?.url,
          status: response.status,
        })
        return response
      },
      async (error) => {
        const originalRequest = error.config

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true

          try {
            const refreshToken = localStorage.getItem('refreshToken')
            if (refreshToken) {
              console.warn('🔄 ApiService: 401 received. Attempting token refresh...')
              const response = await axios.post(
                `${this.api.defaults.baseURL}/auth/refresh`,
                { refreshToken }
              )

              const { accessToken } = response.data
              localStorage.setItem('accessToken', accessToken)

              // Retry original request with new token
              originalRequest.headers.Authorization = `Bearer ${accessToken}`
              console.log('🔁 ApiService: Retrying original request after refresh', originalRequest.url)
              return this.api(originalRequest)
            }
          } catch (refreshError) {
            // Refresh failed. Do not hard-redirect for notification endpoints.
            console.error('❌ ApiService: Token refresh failed.', (refreshError as any)?.message)
            const url = (originalRequest?.url || '') as string
            const isNotificationEndpoint = url.startsWith('/notifications')
            localStorage.removeItem('accessToken')
            localStorage.removeItem('refreshToken')
            if (!isNotificationEndpoint && window.location.pathname !== '/login') {
              window.location.href = '/login'
            }
            return Promise.reject(refreshError)
          }
        }

        console.error('❌ ApiService: Response error', {
          url: originalRequest?.url,
          status: error.response?.status,
          message: error?.message,
        })
        return Promise.reject(error)
      }
    )
  }

  // Generic request methods
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    console.log('🔍 ApiService: GET', url)
    const response: AxiosResponse<T> = await this.api.get(url, config)
    console.log('✅ ApiService: GET response', { url, status: response.status })
    return response.data
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    console.log('🔍 ApiService: POST request to:', url)
    const response: AxiosResponse<T> = await this.api.post(url, data, config)
    console.log('✅ ApiService: POST response:', {
      status: response.status,
      url,
      hasData: !!response.data
    })
    return response.data
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    console.log('✏️ ApiService: PUT', url)
    const response: AxiosResponse<T> = await this.api.put(url, data, config)
    console.log('✅ ApiService: PUT response', { url, status: response.status })
    return response.data
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    console.log('✏️ ApiService: PATCH', url)
    const response: AxiosResponse<T> = await this.api.patch(url, data, config)
    console.log('✅ ApiService: PATCH response', { url, status: response.status })
    return response.data
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    console.log('🗑️ ApiService: DELETE', url)
    const response: AxiosResponse<T> = await this.api.delete(url, config)
    console.log('✅ ApiService: DELETE response', { url, status: response.status })
    return response.data
  }

  // File upload method
  async uploadFile<T = any>(url: string, file: File, onProgress?: (progress: number) => void): Promise<T> {
    const formData = new FormData()
    formData.append('file', file)

    const config: AxiosRequestConfig = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(progress)
        }
      },
    }

    return this.post<T>(url, formData, config)
  }

  // Get the axios instance for advanced usage
  getAxiosInstance(): AxiosInstance {
    return this.api
  }
}

export const apiService = new ApiService()