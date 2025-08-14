import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'
import { useToast } from './useToast'
import { useNotifications } from './useNotifications'
import { apiService } from '../services/api.service'

interface TaskNotificationData {
  taskId: string
  type: 'task_assignment' | 'task_status_change' | 'task_comment' | 'task_due_reminder' | 'bulk_task_assignment'
  title: string
  message: string
  url?: string
  timestamp: string
  priority: 'low' | 'medium' | 'high'
  read?: boolean
}

interface UseTaskNotificationsReturn {
  // Notification state
  isEnabled: boolean
  hasPermission: boolean
  isSubscribed: boolean
  
  // Actions
  enableNotifications: () => Promise<void>
  disableNotifications: () => Promise<void>
  testNotification: () => Promise<void>
  
  // Real-time notifications
  recentNotifications: TaskNotificationData[]
  unreadCount: number
  markAsRead: (notificationId: string) => void
  clearAll: () => void
}

export const useTaskNotifications = (): UseTaskNotificationsReturn => {
  const { user } = useAuth()
  const { showToast } = useToast()
  
  const [isEnabled, setIsEnabled] = useState(false)
  const [isSupported] = useState('Notification' in window && 'serviceWorker' in navigator)
  const [permission, setPermission] = useState<NotificationPermission>(
    'Notification' in window ? Notification.permission : 'denied'
  )
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [recentNotifications, setRecentNotifications] = useState<TaskNotificationData[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  // Check if notifications are enabled
  useEffect(() => {
    const enabled = localStorage.getItem('taskNotificationsEnabled') === 'true'
    setIsEnabled(enabled && isSubscribed)
    
    // Check subscription status
    checkSubscriptionStatus()
  }, [isSubscribed])

  const checkSubscriptionStatus = async () => {
    try {
      const response = await apiService.get('/notifications/subscriptions')
      setIsSubscribed(response.data && response.data.length > 0)
    } catch (error) {
      console.error('Failed to check subscription status:', error)
    }
  }

  // Listen for service worker messages (notification clicks)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const { type, data } = event.data
      
      if (type === 'NOTIFICATION_CLICKED' && data.taskId) {
        handleNotificationClick(data)
      }
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleMessage)
      return () => {
        navigator.serviceWorker.removeEventListener('message', handleMessage)
      }
    }
  }, [])

  // Load recent notifications on mount
  useEffect(() => {
    if (user && isEnabled) {
      loadRecentNotifications()
    }
  }, [user, isEnabled])

  // Enable task notifications
  const enableNotifications = useCallback(async () => {
    try {
      if (!isSupported) {
        showToast('error', 'Push notifications are not supported in this browser')
        return
      }

      // Request permission if not granted
      if (permission !== 'granted') {
        const newPermission = await Notification.requestPermission()
        setPermission(newPermission)
        
        if (newPermission !== 'granted') {
          showToast('warning', 'Notification permission denied')
          return
        }
      }

      // Subscribe to push notifications
      if (!isSubscribed) {
        await subscribeToNotifications()
      }

      localStorage.setItem('taskNotificationsEnabled', 'true')
      setIsEnabled(true)
      showToast('success', 'Task notifications enabled')
    } catch (error) {
      console.error('Failed to enable task notifications:', error)
      showToast('error', 'Failed to enable task notifications')
    }
  }, [isSupported, permission, isSubscribed, showToast])

  const subscribeToNotifications = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready
        
        // Get VAPID public key
        const vapidResponse = await apiService.get('/notifications/vapid-public-key')
        const publicKey = vapidResponse.data.publicKey
        
        // Subscribe to push notifications
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: publicKey
        })

        // Send subscription to server
        await apiService.post('/notifications/subscribe', { subscription })
        setIsSubscribed(true)
      }
    } catch (error) {
      console.error('Failed to subscribe to notifications:', error)
      throw error
    }
  }

  // Disable task notifications
  const disableNotifications = useCallback(async () => {
    try {
      localStorage.setItem('taskNotificationsEnabled', 'false')
      setIsEnabled(false)
      showToast('success', 'Task notifications disabled')
    } catch (error) {
      console.error('Failed to disable task notifications:', error)
      showToast('error', 'Failed to disable task notifications')
    }
  }, [showToast])

  // Test notification
  const testNotification = useCallback(async () => {
    try {
      if (!isEnabled) {
        showToast('warning', 'Please enable task notifications first')
        return
      }

      // Send a test notification via the API
      await apiService.post('/notifications/send', {
        userIds: [user?.id],
        templateType: 'system_announcement',
        variables: {
          title: 'Test Notification',
          message: 'This is a test notification from the Go3net HR system!',
          priority: 'medium'
        }
      })

      showToast('success', 'Test notification sent!')
    } catch (error) {
      console.error('Failed to send test notification:', error)
      
      // Fallback to local notification
      try {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Test Notification', {
            body: 'This is a test notification from the Go3net HR system!',
            icon: '/icons/notification-icon.png',
            tag: 'test-notification'
          })
          showToast('success', 'Test notification sent (local)')
        }
      } catch (localError) {
        showToast('error', 'Failed to send test notification')
      }
    }
  }, [isEnabled, user?.id, showToast])

  // Load recent notifications
  const loadRecentNotifications = useCallback(async () => {
    try {
      const response = await apiService.get('/notifications/history?limit=10')
      const notifications = response.data.map((notif: any) => ({
        taskId: notif.payload?.data?.taskId || '',
        type: notif.type,
        title: notif.title,
        message: notif.body,
        url: notif.payload?.data?.url,
        timestamp: notif.createdAt,
        priority: notif.payload?.data?.priority || 'medium',
        read: notif.read || false
      }))
      
      setRecentNotifications(notifications)
      setUnreadCount(notifications.filter((n: any) => !n.read).length)
    } catch (error) {
      console.error('Failed to load recent notifications:', error)
    }
  }, [])

  // Handle notification click
  const handleNotificationClick = useCallback((data: any) => {
    if (data.url) {
      // Navigate to the task
      window.location.href = data.url
    }
    
    // Mark as read
    if (data.notificationId) {
      markAsRead(data.notificationId)
    }
  }, [])

  // Mark notification as read
  const markAsRead = useCallback((notificationId: string) => {
    setRecentNotifications(prev => 
      prev.map(notif => 
        notif.taskId === notificationId 
          ? { ...notif, read: true } 
          : notif
      )
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }, [])

  // Clear all notifications
  const clearAll = useCallback(() => {
    setRecentNotifications([])
    setUnreadCount(0)
  }, [])

  // Auto-refresh notifications every 30 seconds when enabled
  useEffect(() => {
    if (!isEnabled || !user) return

    const interval = setInterval(() => {
      loadRecentNotifications()
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [isEnabled, user, loadRecentNotifications])

  return {
    // Notification state
    isEnabled,
    hasPermission: permission === 'granted',
    isSubscribed,
    
    // Actions
    enableNotifications,
    disableNotifications,
    testNotification,
    
    // Real-time notifications
    recentNotifications,
    unreadCount,
    markAsRead,
    clearAll
  }
}