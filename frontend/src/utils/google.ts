declare global {
  interface Window {
    google?: any
  }
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`)
    if (existing) return resolve()

    const script = document.createElement('script')
    script.src = src
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`))
    document.head.appendChild(script)
  })
}

export async function startGoogleOneTap(onCredential: (credential: string) => void): Promise<void> {
  const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID
  if (!clientId) {
    throw new Error('Missing REACT_APP_GOOGLE_CLIENT_ID')
  }

  await loadScript('https://accounts.google.com/gsi/client')

  if (!window.google?.accounts?.id) {
    throw new Error('Google Identity Services SDK not available')
  }

  window.google.accounts.id.initialize({
    client_id: clientId,
    callback: (response: { credential?: string }) => {
      if (response?.credential) {
        onCredential(response.credential)
      }
    },
    auto_select: false,
  })

  // Show the One Tap prompt
  window.google.accounts.id.prompt()
}
