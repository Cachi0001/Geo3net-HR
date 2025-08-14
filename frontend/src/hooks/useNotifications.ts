import { useState, useEffect, useCallback } from 'react'
import { notificationService, NotificationService, NotificationLog, NotificationStats } from '../services/notification.service'
import { useToast } from './useToast'

interface UseNotificationsReturn {
  // Subscription state
  isSupported: boolean
  permission: NotificationPermission
  isSubscribed: boolean
  isLoading: boolean
  
  // Subscription actions
  requestPermission: () => Promise<void>
  subscribe: () => Promise<void>
  unsubscribe: () => Promise<void>
  
  // Notification data
  notifications: NotificationLog[]
  stats: NotificationStats | null
  
  // Data actions
  loadNotifications: (limit?: number, offset?: number) => Promise<void>
  loadStats: (days?: number) => Promise<void>
  sendNotification: (userIds: string | string[], templateType: string, variables?: Record<string, string>) => Promise<void>
  
  // Utility
  showLocalNotification: (title: string, options?: NotificationOptions) => Promise<void>
}

export const useNotifications = (): UseNotificationsReturn => {
  const { showToast } = useToast()
  
  // State
  const [isSupported] = useState(NotificationService.isSupported())
  const [permission, setPermission] = useState<NotificationPermission>(
    NotificationService.getPermissionStatus()
  )
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [notifications, setNotifications] = useState<NotificationLog[]>([])
  const [stats, setStats] = useState<NotificationStats | null>(null)

  // Initialize notification service
  useEffect(() => {
    const initializeService = async () => {
      try {
        await notificationService.initialize()
        const subscribed = await notificationService.isSubscribed()
        setIsSubscribed(subscribed)
      } catch (error) {
        console.error('Failed to initialize notification service:', error)
      }
    }

    if (isSupported) {
      initializeService()
    }
  }, [isSupported])

  // Listen for permission changes
  useEffect(() => {
    const checkPermission = () => {
      const currentPermission = NotificationService.getPermissionStatus()
      if (currentPermission !== permission) {
        setPermission(currentPermission)
      }
    }

    // Check permission periodically
    const interval = setInterval(checkPermission, 1000)
    
    return () => clearInterval(interval)
  }, [permission])

  // Request notification permission
  const requestPermission = useCallback(async () => {
    try {
      setIsLoading(true)
      const newPermission = await notificationService.requestPermission()
      setPermission(newPermission)
      
      if (newPermission === 'granted') {
        showToast('success', 'Notification permission granted')
      } else {
        showToast('warning', 'Notification permission denied')
      }
    } catch (error) {
      console.error('Failed to request permission:', error)
      showToast('error', 'Failed to request notification permission')
    } finally {
      setIsLoading(false)
    }
  }, [showToast])

  // Subscribe to push notifications
  const subscribe = useCallback(async () => {
    try {
      setIsLoading(true)
      await notificationService.subscribe()
      setIsSubscribed(true)
      showToast('success', 'Successfully subscribed to notifications')
    } catch (error) {
      console.error('Failed to subscribe:', error)
      showToast('error', 'Failed to subscribe to notifications')
    } finally {
      setIsLoading(false)
    }
  }, [showToast])

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async () => {
    try {
      setIsLoading(true)
      await notificationService.unsubscribe()
      setIsSubscribed(false)
      showToast('success', 'Successfully unsubscribed from notifications')
    } catch (error) {
      console.error('Failed to unsubscribe:', error)
      showToast('error', 'Failed to unsubscribe from notifications')
    } finally {
      setIsLoading(false)
    }
  }, [showToast])

  // Load notification history
  const loadNotifications = useCallback(async (limit: number = 50, offset: number = 0) => {
    try {
      setIsLoading(true)
      const response = await notificationService.getNotificationHistory(limit, offset)
      
      if (offset === 0) {
        setNotifications(response.data)
      } else {
        setNotifications(prev => [...prev, ...response.data])
      }
    } catch (error) {
      console.error('Failed to load notifications:', error)
      showToast('error', 'Failed to load notification history')
    } finally {
      setIsLoading(false)
    }
  }, [showToast])

  // Load notification statistics
  const loadStats = useCallback(async (days: number = 30) => {
    try {
      const statsData = await notificationService.getNotificationStats(days)
      setStats(statsData)
    } catch (error) {
      console.error('Failed to load notification stats:', error)
      showToast('error', 'Failed to load notification statistics')
    }
  }, [showToast])

  // Send notification (admin only)
  const sendNotification = useCallback(async (
    userIds: string | string[],
    templateType: string,
    variables: Record<string, string> = {}
  ) => {
    try {
      setIsLoading(true)
      await notificationService.sendNotification(userIds, templateType, variables)
      showToast('success', 'Notification sent successfully')
    } catch (error) {
      console.error('Failed to send notification:', error)
      showToast('error', 'Failed to send notification')
    } finally {
      setIsLoading(false)
    }
  }, [showToast])

  // Show local notification
  const showLocalNotification = useCallback(async (title: string, options: NotificationOptions = {}) => {
    try {
      await notificationService.showLocalNotification(title, options)
    } catch (error) {
      console.error('Failed to show local notification:', error)
      showToast('error', 'Failed to show notification')
    }
  }, [showToast])

  return {
    // Subscription state
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    
    // Subscription actions
    requestPermission,
    subscribe,
    unsubscribe,
    
    // Notification data
    notifications,
    stats,
    
    // Data actions
    loadNotifications,
    loadStats,
    sendNotification,
    
    // Utility
    showLocalNotification
  }
}