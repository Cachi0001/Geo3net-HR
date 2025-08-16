// Service Worker registration utility

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '[::1]' ||
  window.location.hostname.match(
    /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
  )
)

export function registerSW() {
  const enabled = process.env.REACT_APP_ENABLE_NOTIFICATIONS === 'true'
  if (!enabled) {
    console.log('SW: Disabled by REACT_APP_ENABLE_NOTIFICATIONS flag')
    return
  }
  if ('serviceWorker' in navigator) {
    const publicUrl = new URL(process.env.PUBLIC_URL || '', window.location.href)
    if (publicUrl.origin !== window.location.origin) {
      return
    }

    window.addEventListener('load', () => {
      const swUrl = `${process.env.PUBLIC_URL}/sw.js`

      // In development, avoid reload loop if sw.js does not exist
      if (isLocalhost) {
        checkValidServiceWorker(swUrl)
      } else {
        registerValidSW(swUrl)
      }
    })
  }
}

function registerValidSW(swUrl: string) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      console.log('SW registered: ', registration)
      // Register for background sync (only when supported, secure, and SW is active)
      const isSecure = window.isSecureContext || window.location.hostname === 'localhost'
      const hasSync = 'sync' in window.ServiceWorkerRegistration.prototype
      if (isSecure && hasSync) {
        // Ensure the SW is active/ready before registering sync
        navigator.serviceWorker.ready
          .then((readyReg) => {
            try {
              if (readyReg && (readyReg as any).sync) {
                console.log('Background Sync supported. Registering tag...')
                ;(readyReg as any).sync.register('background-sync')
              } else {
                console.log('Background Sync not available on ready registration')
              }
            } catch (err) {
              console.warn('Background Sync registration failed:', (err as any)?.message)
            }
          })
          .catch((err) => {
            console.warn('serviceWorker.ready rejected, skipping Background Sync:', (err as any)?.message)
          })
      } else {
        console.log('Background Sync not supported or insecure context. Skipping registration.', { isSecure, hasSync })
      }
    })
    .catch((error) => {
      console.error('SW registration failed: ', error)
    })
}

function checkValidServiceWorker(swUrl: string) {
  fetch(swUrl, {
    headers: { 'Service-Worker': 'script' },
  })
    .then((response) => {
      const contentType = response.headers.get('content-type')
      if (
        response.status === 404 ||
        (contentType != null && contentType.indexOf('javascript') === -1)
      ) {
        // If sw.js is missing in dev, don't force reload loop
        if (isLocalhost) {
          console.warn('SW: sw.js missing or invalid in development, skipping registration without reload')
          return
        }
        navigator.serviceWorker.ready
          .then((registration) => {
            registration.unregister().then(() => {
              window.location.reload()
            })
          })
      } else {
        registerValidSW(swUrl)
      }
    })
    .catch(() => {
      console.log('No internet connection found. App is running in offline mode.')
    })
}

export function unregisterSW() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister()
      })
      .catch((error) => {
        console.error(error.message)
      })
  }
}