import { useCallback } from 'react'
import { apiService } from '../services/api.service'

export interface UseApiCallReturn {
  apiCall: <T = any>(url: string, method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE', data?: any) => Promise<{ data: T }>
}

export const useApiCall = (): UseApiCallReturn => {
  const apiCall = useCallback(async <T = any>(
    url: string, 
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE', 
    data?: any
  ): Promise<{ data: T }> => {
    let response: T
    
    switch (method) {
      case 'GET':
        response = await apiService.get<T>(url)
        break
      case 'POST':
        response = await apiService.post<T>(url, data)
        break
      case 'PUT':
        response = await apiService.put<T>(url, data)
        break
      case 'PATCH':
        response = await apiService.patch<T>(url, data)
        break
      case 'DELETE':
        response = await apiService.delete<T>(url)
        break
      default:
        throw new Error(`Unsupported HTTP method: ${method}`)
    }
    
    return { data: response }
  }, [])

  return { apiCall }
}