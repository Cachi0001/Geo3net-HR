import { apiService } from './api.service'

export interface NotificationSubscription {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

export interface NotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  image?: string
  data?: Record<string, any>
  actions?: Array<{
    action: string
    title: string
    icon?: string
  }>
  tag?: string
  requireInteraction?: boolean
}

export interface NotificationLog {
  id: string
  userId: string
  templateId?: string
  title: string
  body: string
  type: string
  payload: NotificationPayload
  status: 'pending' | 'sent' | 'failed' | 'clicked' | 'dismissed'
  sentAt?: string
  clickedAt?: string
  dismissedAt?: string
  errorMessage?: string
  createdAt: string
}

export interface NotificationStats {
  total: number
  sent: number
  clicked: number
  dismissed: number
  failed: number
  clickRate: number
}

class NotificationService {
  private registration: ServiceWorkerRegistration | null = null
  private vapidPublicKey: string | null = null

  // Initialize the service
  async initialize(): Promise<void> {
    try {
      // Check if service workers are supported
      if (!('serviceWorker' in navigator)) {
        console.warn('Service workers are not supported in this browser')
        return
      }

      // Check if push messaging is supported
      if (!('PushManager' in window)) {
        console.warn('Push messaging is not supported in this browser')
        return
      }

      // Register service worker
      this.registration = await navigator.serviceWorker.register('/sw.js')
      console.log('Service worker registered successfully')

      // Get VAPID public key
      await this.getVapidPublicKey()

      // Listen for service worker messages
      this.setupMessageListener()

    } catch (error) {
      console.error('Failed to initialize notification service:', error)
    }
  }

  private async getVapidPublicKey(): Promise<void> {
    try {
      const response = await apiService.get<{ publicKey: string }>('/notifications/vapid-public-key')
      this.vapidPublicKey = response.publicKey
    } catch (error) {
      console.error('Failed to get VAPID public key:', error)
    }
  }

  private setupMessageListener(): void {
    navigator.serviceWorker.addEventListener('message', (event) => {
      const { type, data } = event.data

      switch (type) {
        case 'NOTIFICATION_CLICKED':
          this.handleNotificationClick(data)
          break
        case 'NOTIFICATION_DISMISSED':
          this.handleNotificationDismiss(data)
          break
        default:
          console.log('Unknown message type:', type)
      }
    })
  }

  // Request notification permission
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('This browser does not support notifications')
    }

    let permission = Notification.permission

    if (permission === 'default') {
      permission = await Notification.requestPermission()
    }

    return permission
  }

  // Subscribe to push notifications
  async subscribe(): Promise<void> {
    try {
      const permission = await this.requestPermission()
      
      if (permission !== 'granted') {
        throw new Error('Notification permission denied')
      }

      if (!this.registration) {
        throw new Error('Service worker not registered')
      }

      if (!this.vapidPublicKey) {
        throw new Error('VAPID public key not available')
      }

      // Subscribe to push notifications
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
      })

      // Send subscription to server
      await apiService.post('/notifications/subscribe', {
        subscription: subscription.toJSON()
      })

      console.log('Successfully subscribed to push notifications')
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error)
      throw error
    }
  }

  // Unsubscribe from push notifications
  async unsubscribe(): Promise<void> {
    try {
      if (!this.registration) {
        throw new Error('Service worker not registered')
      }

      const subscription = await this.registration.pushManager.getSubscription()
      
      if (subscription) {
        // Unsubscribe from push manager
        await subscription.unsubscribe()

        // Remove subscription from server
        await apiService.post('/notifications/unsubscribe', {
          endpoint: subscription.endpoint
        })

        console.log('Successfully unsubscribed from push notifications')
      }
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error)
      throw error
    }
  }

  // Check if user is subscribed
  async isSubscribed(): Promise<boolean> {
    try {
      if (!this.registration) {
        return false
      }

      const subscription = await this.registration.pushManager.getSubscription()
      return subscription !== null
    } catch (error) {
      console.error('Failed to check subscription status:', error)
      return false
    }
  }

  // Get notification history
  async getNotificationHistory(limit: number = 50, offset: number = 0): Promise<{
    data: NotificationLog[]
    pagination: {
      limit: number
      offset: number
      hasMore: boolean
    }
  }> {
    return apiService.get(`/notifications/history?limit=${limit}&offset=${offset}`)
  }

  // Get notification statistics
  async getNotificationStats(days: number = 30): Promise<NotificationStats> {
    const response = await apiService.get<{ data: NotificationStats }>(`/notifications/stats?days=${days}`)
    return response.data
  }

  // Send notification (admin only)
  async sendNotification(
    userIds: string | string[],
    templateType: string,
    variables: Record<string, string> = {},
    customPayload?: Partial<NotificationPayload>
  ): Promise<void> {
    await apiService.post('/notifications/send', {
      userIds: Array.isArray(userIds) ? userIds : [userIds],
      templateType,
      variables,
      customPayload
    })
  }

  // Handle notification click
  private async handleNotificationClick(data: { notificationId: string, url?: string }): Promise<void> {
    try {
      // Mark notification as clicked
      await apiService.patch(`/notifications/${data.notificationId}/clicked`)

      // Navigate to URL if provided
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Failed to handle notification click:', error)
    }
  }

  // Handle notification dismiss
  private async handleNotificationDismiss(data: { notificationId: string }): Promise<void> {
    try {
      // Mark notification as dismissed
      await apiService.patch(`/notifications/${data.notificationId}/dismissed`)
    } catch (error) {
      console.error('Failed to handle notification dismiss:', error)
    }
  }

  // Show local notification (fallback)
  async showLocalNotification(title: string, options: NotificationOptions = {}): Promise<void> {
    const permission = await this.requestPermission()
    
    if (permission === 'granted') {
      new Notification(title, {
        icon: '/icons/notification-icon.png',
        badge: '/icons/badge-icon.png',
        ...options
      })
    }
  }

  // Utility function to convert VAPID key
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  // Check if notifications are supported
  static isSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
  }

  // Get current permission status
  static getPermissionStatus(): NotificationPermission {
    return Notification.permission
  }
}

export const notificationService = new NotificationService()