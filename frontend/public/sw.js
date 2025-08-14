const CACHE_NAME = 'go3net-hr-v1'
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/icons/notification-icon.png',
  '/icons/badge-icon.png'
]

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache')
        return cache.addAll(urlsToCache)
      })
      .catch((error) => {
        console.error('Failed to cache resources:', error)
      })
  )
})

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request)
      })
  )
})

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('Push event received:', event)

  let notificationData = {
    title: 'Go3net HR',
    body: 'You have a new notification',
    icon: '/icons/notification-icon.png',
    badge: '/icons/badge-icon.png',
    data: {},
    actions: [],
    tag: 'default',
    requireInteraction: false
  }

  if (event.data) {
    try {
      const payload = event.data.json()
      notificationData = { ...notificationData, ...payload }
    } catch (error) {
      console.error('Failed to parse push payload:', error)
      notificationData.body = event.data.text() || notificationData.body
    }
  }

  const notificationOptions = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    data: notificationData.data,
    actions: notificationData.actions,
    tag: notificationData.tag,
    requireInteraction: notificationData.requireInteraction,
    silent: false,
    vibrate: [200, 100, 200]
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationOptions)
  )
})

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event)

  event.notification.close()

  const notificationData = event.notification.data || {}
  const action = event.action

  let url = '/'

  // Handle different notification types
  if (notificationData.type) {
    switch (notificationData.type) {
      case 'task_assignment':
        url = `/tasks?taskId=${notificationData.taskId || ''}`
        break
      case 'task_status_change':
        url = `/tasks?taskId=${notificationData.taskId || ''}`
        break
      case 'task_comment':
        url = `/tasks?taskId=${notificationData.taskId || ''}`
        break
      case 'check_in_reminder':
        url = '/time-tracking'
        break
      case 'leave_request':
        url = '/profile?tab=leave-requests'
        break
      case 'system_announcement':
        url = '/dashboard'
        break
      default:
        url = '/dashboard'
    }
  }

  // Handle notification actions
  if (action) {
    switch (action) {
      case 'view':
        // Use the URL determined above
        break
      case 'dismiss':
        // Just close the notification
        return
      default:
        // Use the URL determined above
        break
    }
  }

  // Open the app or focus existing window
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin)) {
            // Focus existing window and navigate
            client.focus()
            client.postMessage({
              type: 'NOTIFICATION_CLICKED',
              data: {
                notificationId: notificationData.notificationId,
                url: url
              }
            })
            return
          }
        }

        // Open new window
        return clients.openWindow(url)
      })
      .then((client) => {
        if (client) {
          // Send message to new window
          client.postMessage({
            type: 'NOTIFICATION_CLICKED',
            data: {
              notificationId: notificationData.notificationId,
              url: url
            }
          })
        }
      })
  )
})

// Notification close event
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event)

  const notificationData = event.notification.data || {}

  // Send message to client about notification dismissal
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        clientList.forEach((client) => {
          client.postMessage({
            type: 'NOTIFICATION_DISMISSED',
            data: {
              notificationId: notificationData.notificationId
            }
          })
        })
      })
  )
})

// Background sync event (for offline functionality)
self.addEventListener('sync', (event) => {
  console.log('Background sync event:', event)

  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Perform background sync operations
      syncData()
    )
  }
})

// Sync data when back online
async function syncData() {
  try {
    // Get any pending data from IndexedDB or localStorage
    // Send to server when connection is restored
    console.log('Syncing data in background...')
    
    // This would typically involve:
    // 1. Getting offline data from storage
    // 2. Sending to server
    // 3. Updating local storage with server response
    // 4. Showing success notification if needed
    
  } catch (error) {
    console.error('Background sync failed:', error)
  }
}

// Handle service worker updates
self.addEventListener('activate', (event) => {
  console.log('Service worker activated')

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
})

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  console.log('Service worker received message:', event.data)

  const { type, data } = event.data

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting()
      break
    case 'GET_VERSION':
      event.ports[0].postMessage({ version: CACHE_NAME })
      break
    default:
      console.log('Unknown message type:', type)
  }
})