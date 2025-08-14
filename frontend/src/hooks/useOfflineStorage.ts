import { useState, useEffect, useCallback } from 'react'

interface OfflineStorageOptions {
  key: string
  defaultValue?: any
  syncOnline?: boolean
}

interface UseOfflineStorageReturn<T> {
  data: T
  setData: (data: T) => void
  isLoading: boolean
  lastSynced: Date | null
  syncToServer: () => Promise<void>
  clearData: () => void
}

export const useOfflineStorage = <T = any>({
  key,
  defaultValue = null,
  syncOnline = false
}: OfflineStorageOptions): UseOfflineStorageReturn<T> => {
  const [data, setDataState] = useState<T>(defaultValue)
  const [isLoading, setIsLoading] = useState(true)
  const [lastSynced, setLastSynced] = useState<Date | null>(null)

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(key)
      if (stored) {
        const parsed = JSON.parse(stored)
        setDataState(parsed.data)
        setLastSynced(parsed.lastSynced ? new Date(parsed.lastSynced) : null)
      }
    } catch (error) {
      console.error(`Error loading offline data for key ${key}:`, error)
    } finally {
      setIsLoading(false)
    }
  }, [key])

  // Save data to localStorage
  const setData = useCallback((newData: T) => {
    try {
      const dataToStore = {
        data: newData,
        lastSynced: lastSynced?.toISOString(),
        timestamp: new Date().toISOString()
      }
      localStorage.setItem(key, JSON.stringify(dataToStore))
      setDataState(newData)
    } catch (error) {
      console.error(`Error saving offline data for key ${key}:`, error)
    }
  }, [key, lastSynced])

  // Sync to server (placeholder - implement based on your API)
  const syncToServer = useCallback(async () => {
    try {
      // This would be implemented based on your specific sync requirements
      // For now, just update the lastSynced timestamp
      setLastSynced(new Date())
      
      const stored = localStorage.getItem(key)
      if (stored) {
        const parsed = JSON.parse(stored)
        parsed.lastSynced = new Date().toISOString()
        localStorage.setItem(key, JSON.stringify(parsed))
      }
    } catch (error) {
      console.error(`Error syncing data for key ${key}:`, error)
      throw error
    }
  }, [key])

  // Clear data
  const clearData = useCallback(() => {
    localStorage.removeItem(key)
    setDataState(defaultValue)
    setLastSynced(null)
  }, [key, defaultValue])

  return {
    data,
    setData,
    isLoading,
    lastSynced,
    syncToServer,
    clearData
  }
}