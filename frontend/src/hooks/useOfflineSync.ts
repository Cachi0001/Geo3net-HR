import { useState, useEffect, useCallback, useRef } from 'react'
import { useApiCall } from './useApiCall'
import { useToast } from './useToast'

interface OfflineAction {
  id: string
  type: 'check-in' | 'check-out'
  data: any
  timestamp: number
  retryCount: number
}

interface UseOfflineSyncReturn {
  isOnline: boolean
  pendingActions: OfflineAction[]
  queueAction: (type: 'check-in' | 'check-out', data: any) => void
  syncPendingActions: () => Promise<void>
  clearPendingActions: () => void
}

const STORAGE_KEY = 'hr_offline_actions'
const MAX_RETRY_COUNT = 3

export const useOfflineSync = (): UseOfflineSyncReturn => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [pendingActions, setPendingActions] = useState<OfflineAction[]>([])
  const { apiCall } = useApiCall()
  const { showToast } = useToast()
  const syncInProgressRef = useRef(false)

  // Load pending actions from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const actions = JSON.parse(stored)
        setPendingActions(actions)
      } catch (e) {
        console.error('Failed to parse stored offline actions:', e)
        localStorage.removeItem(STORAGE_KEY)
      }
    }
  }, [])

  // Save pending actions to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pendingActions))
  }, [pendingActions])

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      showToast('success', 'Connection restored. Syncing pending actions...')
      syncPendingActions()
    }

    const handleOffline = () => {
      setIsOnline(false)
      showToast('warning', 'You are offline. Actions will be synced when connection is restored.')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && pendingActions.length > 0 && !syncInProgressRef.current) {
      syncPendingActions()
    }
  }, [isOnline, pendingActions.length])

  const queueAction = useCallback((type: 'check-in' | 'check-out', data: any) => {
    const action: OfflineAction = {
      id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      timestamp: Date.now(),
      retryCount: 0
    }

    setPendingActions(prev => [...prev, action])

    if (!isOnline) {
      showToast('info', `${type === 'check-in' ? 'Check-in' : 'Check-out'} saved offline. Will sync when online.`)
    }
  }, [isOnline, showToast])

  const syncPendingActions = useCallback(async () => {
    if (!isOnline || pendingActions.length === 0 || syncInProgressRef.current) {
      return
    }

    syncInProgressRef.current = true

    try {
      const actionsToSync = [...pendingActions]
      const failedActions: OfflineAction[] = []

      for (const action of actionsToSync) {
        try {
          const endpoint = action.type === 'check-in' 
            ? '/api/time-tracking/check-in' 
            : '/api/time-tracking/check-out'

          await apiCall(endpoint, 'POST', action.data)
          
          // Remove successful action from pending list
          setPendingActions(prev => prev.filter(a => a.id !== action.id))
          
        } catch (error: any) {
          console.error(`Failed to sync ${action.type}:`, error)
          
          // Increment retry count
          const updatedAction = {
            ...action,
            retryCount: action.retryCount + 1
          }

          if (updatedAction.retryCount < MAX_RETRY_COUNT) {
            failedActions.push(updatedAction)
          } else {
            // Max retries reached, remove from queue
            setPendingActions(prev => prev.filter(a => a.id !== action.id))
            showToast('error', `Failed to sync ${action.type} after ${MAX_RETRY_COUNT} attempts. Action discarded.`)
          }
        }
      }

      // Update failed actions with new retry counts
      if (failedActions.length > 0) {
        setPendingActions(prev => {
          const updated = [...prev]
          failedActions.forEach(failedAction => {
            const index = updated.findIndex(a => a.id === failedAction.id)
            if (index !== -1) {
              updated[index] = failedAction
            }
          })
          return updated
        })
      }

      if (actionsToSync.length > failedActions.length) {
        const syncedCount = actionsToSync.length - failedActions.length
        showToast('success', `Successfully synced ${syncedCount} offline action${syncedCount > 1 ? 's' : ''}.`)
      }

    } catch (error) {
      console.error('Error during sync:', error)
      showToast('error', 'Failed to sync offline actions. Will retry later.')
    } finally {
      syncInProgressRef.current = false
    }
  }, [isOnline, pendingActions, apiCall, showToast])

  const clearPendingActions = useCallback(() => {
    setPendingActions([])
    localStorage.removeItem(STORAGE_KEY)
    showToast('info', 'Cleared all pending offline actions.')
  }, [showToast])

  return {
    isOnline,
    pendingActions,
    queueAction,
    syncPendingActions,
    clearPendingActions
  }
}